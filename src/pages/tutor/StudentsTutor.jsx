import React, { useState, useEffect } from "react";
import { Search, Bell } from "lucide-react";
import CustomChatComponent from "../../components/ChatComponent";
import { useAuth } from "../../context/AuthContext";
import { streamClient } from "../../config/stream";
import Sidebar from "../../components/Sidebar";
import { ClipLoader } from "react-spinners";
import { getChannelDisplayName } from "../../services/streamService";

const StudentsTutor = () => {
  const { user } = useAuth();
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedChatInfo, setSelectedChatInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("standard");
  const [unreadCounts, setUnreadCounts] = useState({});
  const [onlineUsers, setOnlineUsers] = useState({});

  const handleChannelLeave = (channelId) => {
    setChannels((prevChannels) =>
      prevChannels.filter((channel) => channel.id !== channelId),
    );

    if (selectedChannel?.id === channelId) {
      const remainingChannels = channels.filter(
        (channel) => channel.id !== channelId,
      );

      if (remainingChannels.length > 0) {
        const firstChannel = remainingChannels[0];
        setSelectedChannel(firstChannel);
        const otherUser = getOtherUserFromChannel(firstChannel);
        setSelectedChatInfo(otherUser);
      } else {
        setSelectedChannel(null);
        setSelectedChatInfo(null);
      }
    }
  };

  // Helper function to extract the other user's info from a channel
  const getOtherUserFromChannel = (channel) => {
    if (!channel || !user) return null;
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
      name: channel.data.name,
      image: channel.data.image,
      online: false,
    };
  };

  useEffect(() => {
    const loadChannels = async () => {
      if (!user) return;

      try {
        // Filter for all channels
        const filter = {
          type: {
            $in: [
              "standard_group",
              "premium_group",
              "premium_individual_class",
              "one_to_one_chat",
            ],
          },
          members: { $in: [user.uid] },
        };

        // Query all channels
        const allChannels = await streamClient.queryChannels(
          filter,
          {},
          {
            watch: true,
            state: true,
            presence: true,
          },
        );

        // IMPORTANT: For tutors, verify premium individual class channels have all members
        const premiumClassChannels = allChannels.filter(
          (ch) => ch.type === "premium_individual_class",
        );

        if (premiumClassChannels.length > 0) {
          const { syncPremiumClassChannelName } = await import(
            "../../services/channelNameSync"
          );

          await Promise.all(
            premiumClassChannels.map(async (channel) => {
              // Throttle: Only sync each channel once per session
              if (!window._syncedChannels) window._syncedChannels = new Set();
              if (window._syncedChannels.has(channel.id)) return;
              window._syncedChannels.add(channel.id);

              // Sync the name
              await syncPremiumClassChannelName(channel.id);

              // For tutors, ensure all enrolled students are in the channel
              try {
                const { getDoc, doc } = await import("firebase/firestore");
                const { db } = await import("../../firebaseConfig");

                const classDoc = await getDoc(doc(db, "classes", channel.id));
                if (classDoc.exists()) {
                  const classData = classDoc.data();
                  const enrolledStudents = classData.classMemberIds || [];
                  const currentMembers = Object.keys(
                    channel.state?.members || {},
                  );

                  // Check if any enrolled students are missing from the channel
                  for (const studentId of enrolledStudents) {
                    if (!currentMembers.includes(studentId)) {
                      try {
                        await channel.addMembers([
                          { user_id: studentId, role: "channel_member" },
                        ]);
                      } catch (addError) {
                        console.error(
                          `Failed to add student to channel:`,
                          addError,
                        );
                      }
                    }
                  }
                }
              } catch (memberCheckError) {
                console.error(
                  `Error checking channel members:`,
                  memberCheckError,
                );
              }
            }),
          );
        }

        // Initialize unread counts and online status tracking
        const counts = {};
        const onlineStatusMap = {};

        await Promise.all(
          allChannels.map(async (channel) => {
            const state = await channel.watch();
            const channelState = channel.state;
            counts[channel.id] = channelState.unreadCount || 0;

            // Initialize online users status tracking
            if (
              channel.type === "standard_group" ||
              channel.type === "premium_group"
            ) {
              // For group chats, count online members
              const members = Object.values(channel.state?.members || {});
              const onlineCount = members.filter(
                (member) => member.user?.online,
              ).length;
              const totalMembers = members.length;
              onlineStatusMap[channel.id] = { onlineCount, totalMembers };
            } else {
              // For individual student chats, track student's online status
              const members = Object.values(channel.state?.members || {});
              const otherMember = members.find(
                (member) => member.user?.id !== user.uid,
              );
              onlineStatusMap[channel.id] = {
                isOnline: otherMember?.user?.online || false,
              };
            }

            // Set up message listeners
            channel.on("message.new", async (event) => {
              // Update unread counts for messages from others
              if (
                event.user?.id !== user.uid &&
                channel.id !== selectedChannel?.id
              ) {
                const state = channel.state;
                const unreadCount = state.unreadCount || 1;
                setUnreadCounts((prev) => ({
                  ...prev,
                  [channel.id]: unreadCount,
                }));
              }

              // Re-sort channels based on the latest message
              setChannels((prevChannels) => {
                const updatedChannels = prevChannels.map((ch) =>
                  ch.id === channel.id ? channel : ch,
                );
                return updatedChannels.sort((a, b) => {
                  const aLastMessage = a.state.last_message_at
                    ? new Date(a.state.last_message_at).getTime()
                    : 0;
                  const bLastMessage = b.state.last_message_at
                    ? new Date(b.state.last_message_at).getTime()
                    : 0;
                  return bLastMessage - aLastMessage;
                });
              });
            });

            // Add presence change listeners
            channel.on("user.presence.changed", async (event) => {
              if (
                channel.type === "standard_group" ||
                channel.type === "premium_group"
              ) {
                // Update group online count
                const members = Object.values(channel.state?.members || {});
                const onlineCount = members.filter(
                  (member) => member.user?.online,
                ).length;
                const totalMembers = members.length;

                setOnlineUsers((prev) => ({
                  ...prev,
                  [channel.id]: { onlineCount, totalMembers },
                }));
              } else if (
                channel.type === "premium_individual_class" ||
                channel.type === "one_to_one_chat"
              ) {
                // Update student online status
                const members = Object.values(channel.state?.members || {});
                const otherMember = members.find(
                  (member) => member.user?.id !== user.uid,
                );

                setOnlineUsers((prev) => ({
                  ...prev,
                  [channel.id]: {
                    isOnline: otherMember?.user?.online || false,
                  },
                }));
              }
            });
          }),
        );

        setUnreadCounts(counts);
        setOnlineUsers(onlineStatusMap);

        // Sort channels based on last_message_at
        const sortedChannels = allChannels.sort((a, b) => {
          const aLastMessage = a.state.last_message_at
            ? new Date(a.state.last_message_at).getTime()
            : 0;
          const bLastMessage = b.state.last_message_at
            ? new Date(b.state.last_message_at).getTime()
            : 0;
          return bLastMessage - aLastMessage;
        });
        const validChannels = sortedChannels.filter(
          (channel) => channel.data.name && channel.data.name.trim() !== "",
        );
        setChannels(validChannels);

        // Removed auto-selection of first chat when page loads
      } catch (error) {
        console.error("Error loading channels:", error);
      } finally {
        setLoading(false);
      }
    };

    loadChannels();

    return () => {
      channels.forEach((channel) => {
        channel.off("message.new");
        channel.off("message.read");
        channel.off("user.presence.changed");
      });
    };
  }, [user, selectedChannel]);

  const handleChannelSelect = async (channel) => {
    setSelectedChannel(channel);
    setSelectedChatInfo(getOtherUserFromChannel(channel));

    try {
      await channel.markRead();
      setUnreadCounts((prev) => ({
        ...prev,
        [channel.id]: 0,
      }));
    } catch (error) {
      console.error("Error marking channel as read:", error);
    }
  };

  const getMessagePreview = (message) => {
    if (!message) return "No messages yet";

    if (message.attachments && message.attachments.length > 0) {
      const attachment = message.attachments[0];
      if (
        attachment.type === "image" ||
        attachment.mime_type?.startsWith("image/")
      ) {
        return "🖼️ Sent an image";
      }
      return "📎 Sent an attachment";
    }

    return message.text.length > 30
      ? message.text.slice(0, 30) + "..."
      : message.text;
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
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

  // Standard chats - only standard_group
  const standardChats = filterChannels(
    channels.filter(
      (channel) =>
        channel.type === "standard_group" &&
        channel.data.name &&
        channel.data.name.trim() !== "",
    ),
  );

  // Bammbuu+ chats - premium groups and individual chats
  const bammbuuChats = filterChannels(
    channels.filter(
      (channel) =>
        (channel.type === "premium_group" ||
          channel.type === "premium_individual_class" ||
          channel.type === "one_to_one_chat") &&
        channel.data.name &&
        channel.data.name.trim() !== "",
    ),
  );

  const FormateDate = (created_at) => {
    const date = new Date(created_at);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${day}/${month}/${year}`;
  };

  const groupLanguages = {};
  const groupNames = {};
  const groupMemberCounts = {};
  // If you want to fetch groupLanguages, groupNames, groupMemberCounts from Firestore, you can add similar logic as in MessagesUser.jsx

  const ChatItem = ({ channel }) => {
    // One-to-one chat UI (same as MessagesUser.jsx)
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
    // Group chat UI (match MessagesUser.jsx, use users icon for member count if available)
    const groupName = channel.data?.name || groupNames[channel.id] || "Group";
    const groupImage = channel.data?.image || "/default-avatar.png";
    const groupLanguage =
      channel.data?.language || groupLanguages[channel.id] || "English";
    let languageFlag = "/svgs/xs-us.svg";
    if (groupLanguage === "Spanish") languageFlag = "/svgs/xs-spain.svg";
    else if (groupLanguage === "English/Spanish")
      languageFlag = "/svgs/eng-spanish-xs.svg";
    const memberCount = channel.state?.members
      ? Object.keys(channel.state.members).length
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

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar user={user} />
        <div className="flex flex-1 items-center justify-center">
          <ClipLoader color="#FFB800" size={40} />
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
              <h1 className="text-4xl font-semibold">Students</h1>
            </div>
            <button className="rounded-full border border-[#ffbf00] p-2 hover:bg-gray-100">
              <Bell className="h-6 w-6" />
            </button>
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
                  placeholder={
                    activeTab === "standard"
                      ? "Search standard chats"
                      : "Search bammbuuu+ chats"
                  }
                  className="w-full rounded-3xl border border-gray-200 py-2 pl-12 pr-4 focus:border-[#14B82C] focus:outline-none focus:ring-0"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>

              <div className="scrollbar-hide flex-1 space-y-2 overflow-y-auto">
                {(activeTab === "standard" ? standardChats : bammbuuChats).map(
                  (channel) => (
                    <ChatItem key={channel.id} channel={channel} />
                  ),
                )}
              </div>
            </div>

            <div className="ml-4 flex-1">
              {selectedChannel ? (
                <CustomChatComponent
                  channelId={selectedChannel.id}
                  type={selectedChannel.type}
                  onChannelLeave={handleChannelLeave}
                  chatInfo={selectedChatInfo}
                  description={selectedChannel.data?.description || ""}
                  name={getChannelDisplayName(selectedChannel, user)}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-500">
                  Select a chat to start messaging
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentsTutor;
