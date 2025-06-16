import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { streamClient, fetchChatToken } from "../../config/stream";
import Sidebar from "../../components/Sidebar";
import { ClipLoader } from "react-spinners";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useParams, useNavigate } from "react-router-dom";
import CustomChatComponent from "../../components/ChatComponent";
import { syncChannelWithFirestore } from "../../services/streamService";
import { safeMarkChannelRead } from "../../services/streamConnectionService";
import updateChannelNameFromFirestore from "../../utils/channelNameFix";
import { syncPremiumClassChannelName } from "../../services/channelNameSync";
import { getChannelDisplayName } from "../../services/streamService";
import { getUserChannels } from "../../api/examPrepApi";

const MessagesUser = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedChatInfo, setSelectedChatInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("standard");
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadCounts, setUnreadCounts] = useState({});
  const [groupLanguages, setGroupLanguages] = useState({});
  const [groupNames, setGroupNames] = useState({});
  const [onlineUsers, setOnlineUsers] = useState({});
  const { channelId: urlChannelId } = useParams();
  const [streamClientConnected, setStreamClientConnected] = useState(false);
  const [groupMemberCounts, setGroupMemberCounts] = useState({});

  useEffect(() => {
    const savedActiveTab = localStorage.getItem("activetab");
    if (savedActiveTab) {
      setActiveTab(savedActiveTab);
    }
    if (urlChannelId) {
      setActiveTab("bammbuu");
      localStorage.setItem("activetab", "bammbuu");
    }
  }, [urlChannelId]);

  const handleChannelLeave = (channelId) => {
    setChannels((prevChannels) =>
      prevChannels.filter((channel) => channel.id !== channelId),
    );

    if (selectedChannel?.id === channelId) {
      const remainingChannels = channels.filter(
        (channel) => channel.id !== channelId,
      );
      setSelectedChannel(
        remainingChannels.length > 0 ? remainingChannels[0] : null,
      );
      if (remainingChannels.length > 0) {
        const firstChannel = remainingChannels[0];
        const otherUser = getOtherUserFromChannel(firstChannel);
        setSelectedChatInfo(otherUser);
      } else {
        setSelectedChatInfo(null);
      }
    }
  };
  // Helper function to extract the other user's info from a channel
  const getOtherUserFromChannel = (channel) => {
    if (!channel || !user) return null;
    // For exam_prep channels, use created_by as the other user (tutor)
    if (channel.type === "exam_prep" && channel.created_by) {
      return {
        id: channel.created_by.id,
        name: channel.created_by.name,
        image: channel.created_by.image,
        online: channel.created_by.online || false,
      };
    }
    // For one-to-one chats, always show the other user's name
    if (channel.type === "one_to_one_chat") {
      const members = Object.values(channel.state?.members || {});
      const otherMember = members.find(
        (member) => member.user?.id !== user.uid,
      );
      if (otherMember && otherMember.user) {
        return {
          id: otherMember.user.id,
          name: otherMember.user.name,
          image: otherMember.user.image,
          online: otherMember.user.online || false,
        };
      }
    }
    // For group/class chats, always use channel.data.name
    return {
      id: channel.id,
      name: channel.data?.name || channel.name || "Group",
      image: channel.data?.image || "/default-avatar.png",
      online: false,
    };
  };
  // Ensure Stream client is connected
  useEffect(() => {
    const connectStreamClient = async () => {
      if (!user) return;

      try {
        if (streamClient.userID === user.uid && streamClient.isConnected) {
          setStreamClientConnected(true);
          return;
        }
        if (streamClient.userID) {
          await streamClient.disconnectUser();
        }
        const token = await fetchChatToken(user.uid);
        const { setLastUserId } = await import(
          "../../services/streamConnectionService"
        );
        setLastUserId(user.uid);
        await streamClient.connectUser(
          {
            id: user.uid,
            name: user.name || "",
            image: user.photoUrl || "",
            userType: user.userType || "student",
          },
          token,
        );
        setStreamClientConnected(true);
      } catch (error) {
        console.error(
          `[MessagesUser] Error connecting to Stream client: ${error.message}`,
        );
        setStreamClientConnected(false);
        setTimeout(() => {
          connectStreamClient();
        }, 3000);
      }
    };
    connectStreamClient();
    return () => {
      // We'll keep the connection alive - disconnection is handled elsewhere
    };
  }, [user]);

  useEffect(() => {
    const fetchUserChannels = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const channels = await getUserChannels(user.uid);
        setChannels(channels);
      } catch (err) {
        setChannels([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUserChannels();
  }, [user]);

  useEffect(() => {
    if (!channels.length) return;
    // Only fetch for group chats
    const groupChannels = channels.filter(
      (ch) => ch.type === "standard_group" || ch.type === "premium_group",
    );
    groupChannels.forEach(async (channel) => {
      try {
        const groupRef = doc(db, "groups", channel.id);
        const groupDoc = await getDoc(groupRef);
        if (groupDoc.exists()) {
          const groupData = groupDoc.data();
          setGroupMemberCounts((prev) => ({
            ...prev,
            [channel.id]: Array.isArray(groupData.memberIds)
              ? groupData.memberIds.length
              : 0,
          }));
        }
      } catch (e) {
        // fallback to 0
        setGroupMemberCounts((prev) => ({ ...prev, [channel.id]: 0 }));
      }
    });
  }, [channels]);

  const handleChannelSelect = async (channelData) => {
    if (!streamClientConnected) {
      console.warn(
        "[MessagesUser] Tried to select channel before Stream client connected",
      );
      return;
    }
    // Create a real Stream channel instance
    const streamChannel = streamClient.channel(
      channelData.type,
      channelData.id,
    );
    await streamChannel.watch();
    // Ensure user is a member of the channel
    const members = streamChannel.state.members || {};
    if (!members[user.uid]) {
      try {
        await streamChannel.addMembers([user.uid]);
      } catch (err) {
        console.error("[MessagesUser] Error adding user to channel:", err);
      }
    }
    setSelectedChannel(streamChannel);
    setSelectedChatInfo(getOtherUserFromChannel(channelData));
    try {
      await safeMarkChannelRead(streamChannel);
      setUnreadCounts((prev) => ({
        ...prev,
        [channelData.id]: 0,
      }));
    } catch (error) {
      console.error("[MessagesUser] Error marking channel as read:", error);
    }
  };

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  // Filter channels based on type and search query
  const filterChannels = (channelsToFilter) => {
    return channelsToFilter.filter((channel) => {
      let searchName = "";
      if (channel.type === "one_to_one_chat") {
        // Use the other user's name for search
        const members = Object.values(channel.state?.members || {});
        const otherMember = members.find(
          (member) => member.user?.id !== user.uid,
        );
        searchName =
          otherMember && otherMember.user
            ? otherMember.user.name?.toLowerCase() || ""
            : "";
      } else {
        searchName = channel.data.name?.toLowerCase() || "";
      }
      const channelDescription = channel.data.description?.toLowerCase() || "";
      const query = searchQuery.toLowerCase();
      return searchName.includes(query) || channelDescription.includes(query);
    });
  };

  // Categorize channels
  const standardChats = channels.filter((ch) => ch.type === "standard_group");
  const filteredForBammbuu = channels.filter(
    (ch) => ch.type !== "standard_group",
  );

  // Helper to get display name and image for a channel
  const getExamPrepDisplay = (channel) => {
    if (channel.type === "exam_prep" && channel.created_by) {
      return {
        name: channel.created_by.name || "Exam Prep",
        image: channel.created_by.image || "/images/exam-prep-icon.png",
      };
    }
    return {
      name: channel.data?.name || channel.name || "Group",
      image: channel.data?.image || "/default-avatar.png",
    };
  };

  // Helper to get both student and tutor for exam_prep chat name
  const getStudentAndTutorFromChannel = (channel) => {
    if (!channel) return { student: null, tutor: null };
    let student = null;
    let tutor = null;
    if (channel.type === "exam_prep") {
      // For exam_prep, created_by is tutor, members array has student
      tutor = channel.created_by || null;
      // Try to find student in members (not tutor)
      const members = channel.members || [];
      student = members.find((m) => m.userType !== "tutor");
    } else if (channel.type === "one_to_one_chat") {
      const members = Object.values(channel.state?.members || {});
      student = members.find((m) => m.user?.userType !== "tutor");
      tutor = members.find((m) => m.user?.userType === "tutor");
      if (student && student.user) student = student.user;
      if (tutor && tutor.user) tutor = tutor.user;
    }
    return { student, tutor };
  };

  // Helper to get display name for exam_prep chat
  const getExamPrepChatName = (channel) => {
    if (channel.type === "exam_prep") {
      const { student, tutor } = getStudentAndTutorFromChannel(channel);
      const studentName = student?.name || "Student";
      const tutorName = tutor?.name || "Tutor";
      return `Exam Prep - ${studentName}/${tutorName}`;
    }
    return getChannelDisplayName(channel, user);
  };

  const ChatItem = ({ channel, isInstructor }) => {
    // Exam prep one-to-one chat UI
    if (channel.type === "exam_prep") {
      const { name, image } = getExamPrepDisplay(channel);
      const displayName = `Exam Prep - ${name}`;
      return (
        <div
          key={channel.id}
          className={`flex cursor-pointer items-center gap-3 rounded-3xl border p-3 ${
            selectedChannel?.id === channel.id
              ? "border-[#22bf37] bg-[#f0fdf1]"
              : "border-[#fbbf12] bg-white"
          }`}
          onClick={() => handleChannelSelect(channel)}
        >
          <div className="relative">
            <img
              src={image}
              alt={displayName}
              className="h-12 w-12 rounded-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/default-avatar.png";
              }}
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{displayName}</h3>
            </div>
          </div>
        </div>
      );
    }
    // One-to-one chat UI (unchanged)
    if (
      channel.type === "one_to_one_chat" ||
      channel.type === "premium_individual_class"
    ) {
      const otherUser = getOtherUserFromChannel(channel);
      return (
        <div
          key={channel.id}
          className={`flex cursor-pointer items-center gap-3 rounded-3xl border p-3 ${
            selectedChannel?.id === channel.id
              ? "border-[#22bf37] bg-[#f0fdf1]"
              : "border-[#fbbf12] bg-white"
          }`}
          onClick={() => handleChannelSelect(channel)}
        >
          <div className="relative">
            <img
              src={otherUser?.image || "/default-avatar.png"}
              alt={otherUser?.name}
              className="h-12 w-12 rounded-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/default-avatar.png";
              }}
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {getChannelDisplayName(channel, user)}
              </h3>
            </div>
          </div>
          {/* Unread badge for one-to-one chats */}
          {unreadCounts[channel.id] > 0 && (
            <span className="ml-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#14B82C] text-xs text-white">
              {unreadCounts[channel.id]}
            </span>
          )}
        </div>
      );
    }
    // Group chat UI (reverted, but show real member count and new badge)
    const groupName = channel.data?.name || groupNames[channel.id] || "Group";
    const groupImage = channel.data?.image || "/default-avatar.png";
    const groupLanguage =
      channel.data?.language || groupLanguages[channel.id] || "English";
    let languageFlag = "/svgs/xs-us.svg";
    if (groupLanguage === "Spanish") languageFlag = "/svgs/xs-spain.svg";
    else if (groupLanguage === "English/Spanish")
      languageFlag = "/svgs/eng-spanish-xs.svg";
    const memberCount =
      groupMemberCounts[channel.id] !== undefined
        ? groupMemberCounts[channel.id]
        : "-";
    return (
      <div
        key={channel.id}
        className={`flex cursor-pointer items-center gap-3 rounded-3xl border p-3 ${
          selectedChannel?.id === channel.id
            ? "border-[#fbbf12] bg-[#ffffea]"
            : "border-[#fbbf12] bg-white"
        }`}
        onClick={() => handleChannelSelect(channel)}
      >
        <div className="relative">
          <img
            src={groupImage}
            alt={groupName}
            className="h-12 w-12 rounded-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/default-avatar.png";
            }}
          />
        </div>
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="truncate text-lg font-bold">{groupName}</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1">
              <img src={languageFlag} alt={groupLanguage} className="h-5 w-5" />
              <span className="text-sm font-medium text-gray-700">
                {groupLanguage}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <img src="/svgs/users.svg" alt="members" className="h-5 w-5" />
              <span className="text-sm font-medium text-gray-700">
                {memberCount}
              </span>
            </div>
          </div>
        </div>
        {/* Unread badge for group chats */}
        {unreadCounts[channel.id] > 0 && (
          <span className="ml-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#14B82C] text-xs text-white">
            {unreadCounts[channel.id]}
          </span>
        )}
      </div>
    );
  };

  useEffect(() => {
    // Fix channel names for premium channels to ensure they display correctly
    const fixChannelNames = async () => {
      try {
        // Only fix channel names if we have channels and the stream client is connected
        if (channels.length > 0 && streamClientConnected) {
          const premiumChannels = channels.filter(
            (ch) =>
              ch.type === "premium_group" ||
              ch.type === "premium_individual_class",
          );

          // Update names for premium channels
          for (const channel of premiumChannels) {
            try {
              const result = await updateChannelNameFromFirestore(
                channel.id,
                channel.type,
              );
              if (result.fixed) {
              }
            } catch (error) {
              console.warn(
                `Error fixing channel ${channel.id} name: ${error.message}`,
              );
            }
          }
        }
      } catch (error) {
        console.error("Error in fixChannelNames:", error);
      }
    };

    // Run the fix whenever channels are updated
    fixChannelNames();
  }, [channels, streamClientConnected]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar user={user} />
        <div className="flex flex-1 items-center justify-center">
          <ClipLoader color="#14B82C" size={50} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="h-full w-64 flex-shrink-0">
        <Sidebar user={user} />
      </div>

      {/* Main Content */}
      <div className="h-full min-w-[calc(100%-16rem)] flex-1 overflow-x-auto">
        <div className="m-2 flex-1 rounded-3xl border-2 border-[#e7e7e7] bg-white px-6 pt-4">
          <div className="mb-6 flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-semibold">Community</h1>
            </div>
          </div>
          <div className="m-2 flex h-[calc(100vh-125px)] flex-1 rounded-3xl bg-white">
            <div className="flex w-96 flex-col overflow-hidden rounded-2xl bg-[#f6f6f6] p-4">
              <div className="mb-4 flex w-full justify-center sm:w-auto">
                <div className="relative inline-flex rounded-full border border-gray-300 bg-gray-100 p-1">
                  <div
                    className="absolute left-0 top-0 h-full rounded-full border border-gray-800 bg-amber-400 transition-all duration-300 ease-in-out"
                    style={{
                      transform:
                        activeTab === "standard"
                          ? "translateX(0)"
                          : "translateX(82.0%)",
                      width: activeTab === "standard" ? "45%" : "55%",
                    }}
                  />
                  <button
                    onClick={() => setActiveTab("standard")}
                    className="text-md relative z-10 w-2/5 whitespace-nowrap rounded-full px-6 py-1 font-medium text-gray-800 transition-colors"
                  >
                    Standard Chats
                  </button>
                  <button
                    onClick={() => setActiveTab("bammbuu")}
                    className="text-md relative z-10 w-3/5 whitespace-nowrap rounded-full px-6 py-1 font-medium text-gray-800 transition-colors"
                  >
                    bammbuuu+ Chats
                  </button>
                </div>
              </div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 h-5 w-5 text-[#5d5d5d]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearch}
                  placeholder={
                    activeTab === "standard"
                      ? "Search standard chats"
                      : "Search bammbuuu+ chats"
                  }
                  className="w-full rounded-3xl border border-gray-200 py-2 pl-12 pr-4 focus:border-[#14B82C] focus:outline-none focus:ring-0"
                />
              </div>{" "}
              <div className="scrollbar-hide flex-1 space-y-2 overflow-y-auto">
                {activeTab === "bammbuu" ? (
                  // For bammbuu+ chats
                  <>
                    {filteredForBammbuu.length > 0 ? (
                      filteredForBammbuu
                        .filter((channel) => {
                          // Apply search filter
                          const channelName = channel.data?.name || "";
                          const channelDesc = channel.data?.description || "";

                          return (
                            !searchQuery ||
                            channelName
                              .toLowerCase()
                              .includes(searchQuery.toLowerCase()) ||
                            channelDesc
                              .toLowerCase()
                              .includes(searchQuery.toLowerCase())
                          );
                        })
                        .map((channel) => {
                          // Debug why this specific channel is being rendered

                          return (
                            <ChatItem
                              key={channel.id}
                              channel={channel}
                              isInstructor={
                                channel.type === "premium_individual_class" ||
                                channel.type === "one_to_one_chat"
                              }
                            />
                          );
                        })
                    ) : (
                      <div className="flex h-64 flex-col items-center justify-center">
                        <p className="text-xl font-semibold text-gray-500">
                          No Bammbuu+ chats found
                        </p>
                        <p className="text-sm text-gray-400">
                          (Looking for {filteredForBammbuu.length} channels with
                          types: premium_group, premium_individual_class,
                          one_to_one_chat)
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  // Standard chats
                  <>
                    {standardChats.length > 0 ? (
                      standardChats.map((channel) => {
                        return (
                          <ChatItem
                            key={channel.id}
                            channel={channel}
                            isInstructor={false}
                          />
                        );
                      })
                    ) : (
                      <div className="flex h-64 flex-col items-center justify-center">
                        <p className="text-xl font-semibold text-gray-500">
                          No standard chats found
                        </p>
                        <p className="text-sm text-gray-400">
                          (Looking for{" "}
                          {
                            channels.filter(
                              (ch) => ch.type === "standard_group",
                            ).length
                          }{" "}
                          standard_group channels)
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="ml-4 flex-1">
              {streamClientConnected && selectedChannel ? (
                <>
                  <CustomChatComponent
                    channelId={selectedChannel.id}
                    type={selectedChannel.type}
                    onChannelLeave={handleChannelLeave}
                    chatInfo={selectedChatInfo}
                    description={
                      selectedChannel.data?.description ||
                      selectedChannel.data?.name ||
                      ""
                    }
                    name={
                      selectedChannel.type === "exam_prep"
                        ? `Exam Prep - ${selectedChatInfo?.name || "Tutor"}`
                        : getChannelDisplayName(selectedChannel, user)
                    }
                  />
                </>
              ) : (
                <div className="flex h-full items-center justify-center text-gray-500">
                  {streamClientConnected
                    ? "Select a chat to start messaging"
                    : "Connecting to chat..."}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesUser;
