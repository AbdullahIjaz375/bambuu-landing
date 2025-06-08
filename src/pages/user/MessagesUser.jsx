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

    // Force select the bammbuu+ tab if there's a channel ID in the URL
    // This helps ensure the correct tab is selected when navigating directly to a channel
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
  // Ensure Stream client is connected
  useEffect(() => {
    const connectStreamClient = async () => {
      if (!user) return;

      try {
        // Check if we're already connected as this user
        if (streamClient.userID === user.uid && streamClient.isConnected) {
          setStreamClientConnected(true);
          return;
        }

        // If connected as different user or disconnected, reconnect
        if (streamClient.userID) {
          await streamClient.disconnectUser();
        }

        const token = await fetchChatToken(user.uid);

        // Import helper to record the user ID for reconnection attempts
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
        console.error(`Error connecting to Stream client: ${error.message}`);
        setStreamClientConnected(false);

        // Try one more time after a short delay
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
    const loadChannels = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      if (!streamClientConnected) {
        return;
      }

      try {
        // Import connection helper
        const { ensureStreamConnection } = await import(
          "../../services/streamConnectionService"
        );

        const channels = await ensureStreamConnection(async () => {
          const filter = {
            members: { $in: [user.uid] },
            type: {
              $in: [
                "standard_group",
                "premium_group",
                "premium_individual_class",
                "one_to_one_chat",
              ],
            },
          };

          const sort = { last_message_at: -1 };

          return streamClient.queryChannels(filter, sort, {
            watch: true,
            state: true,
            presence: true,
            message_retention: "infinite",
          });
        });

        // IMPORTANT: For each premium individual class, verify the user is actually a member
        const premiumClassChannels = channels.filter(
          (ch) => ch.type === "premium_individual_class",
        );

        // Also check if user should be in premium classes they're not seeing
        try {
          const { verifyUserPremiumClassChannels } = await import(
            "../../services/channelNameSync"
          );
          await verifyUserPremiumClassChannels(user.uid);
        } catch (verifyError) {
          console.error("Error verifying premium class channels:", verifyError);
        }

        if (premiumClassChannels.length > 0) {
          const { syncPremiumClassChannelName } = await import(
            "../../services/channelNameSync"
          );

          await Promise.all(
            premiumClassChannels.map(async (channel) => {
              // Sync the name
              await syncPremiumClassChannelName(channel.id);

              // Verify membership
              const currentMembers = Object.keys(channel.state?.members || {});
              if (!currentMembers.includes(user.uid)) {
                try {
                  await channel.addMembers([
                    { user_id: user.uid, role: "channel_member" },
                  ]);
                } catch (addError) {
                  console.error(
                    `Failed to add user to channel ${channel.id}:`,
                    addError,
                  );
                }
              }
            }),
          );
        }

        // Continue with rest of your existing code...
        const counts = {};
        const onlineStatusMap = {};

        await Promise.all(
          channels.map(async (channel) => {
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
              // For one-to-one chats, track tutor's online status
              const members = Object.values(channel.state?.members || {});
              const otherMember = members.find(
                (member) => member.user?.id !== user.uid,
              );
              onlineStatusMap[channel.id] = {
                isOnline: otherMember?.user?.online || false,
              };
            }

            // Set up message.new event listener
            channel.on("message.new", async (event) => {
              // Check if message is from another user and channel is not selected
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
                // Update tutor online status
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
        const groupIds = channels
          .filter(
            (channel) =>
              channel.type === "standard_group" ||
              channel.type === "premium_group",
          )
          .map((channel) => channel.id);

        // Get group data from Firestore and sync with Stream
        const groupLanguagesData = {};
        const groupNamesData = {};

        await Promise.all(
          groupIds.map(async (groupId) => {
            try {
              // First sync the channel with Firestore to ensure names and images are correct
              const channel = channels.find((ch) => ch.id === groupId);
              if (channel) {
                // Sync channel data with Firestore
                const result = await syncChannelWithFirestore({
                  channelId: groupId,
                  type: channel.type,
                });
              }

              // Get group data for local display
              const groupRef = doc(db, "groups", groupId);
              const groupDoc = await getDoc(groupRef);
              if (groupDoc.exists()) {
                const groupData = groupDoc.data();
                groupLanguagesData[groupId] =
                  groupData.groupLearningLanguage || "Unknown";

                // Store the actual group name from Firestore
                groupNamesData[groupId] =
                  groupData.groupName || "Unnamed Group";

                // Update the channel data with the correct name from Firestore
                const channelToUpdate = channels.find(
                  (ch) => ch.id === groupId,
                );
                if (channelToUpdate) {
                  if (channelToUpdate.data) {
                    channelToUpdate.data.name = groupData.groupName;
                    // Also update the image if available
                    if (groupData.imageUrl) {
                      channelToUpdate.data.image = groupData.imageUrl;
                    }
                  } else {
                    channelToUpdate.data = {
                      name: groupData.groupName,
                      image: groupData.imageUrl || null,
                    };
                  }
                }
              } else {
                // Set defaults for groups without document data
                groupLanguagesData[groupId] = "Unknown";
                groupNamesData[groupId] = "Unnamed Group";
              }
            } catch (syncError) {
              console.error(`Error syncing channel ${groupId}:`, syncError);
            }
          }),
        );

        setGroupLanguages(groupLanguagesData);
        setGroupNames(groupNamesData);
        setUnreadCounts(counts);
        setOnlineUsers(onlineStatusMap);
        setChannels(channels);

        // Select channel from URL parameter
        if (urlChannelId) {
          // First try to find a direct match
          let channelToSelect = channels.find(
            (channel) => channel.id === urlChannelId,
          );

          // If not found and we're coming from a tutor profile, the channel ID might be combined IDs
          if (!channelToSelect) {
            // Look for channels that might be a one-to-one chat with this tutor
            channelToSelect = channels.find((channel) => {
              // Check if it's a one-to-one chat
              if (channel.type === "one_to_one_chat") {
                // Check if channel members include the tutor from the URL
                const channelMembers = Object.keys(
                  channel.state?.members || {},
                );
                // Since urlChannelId might be a combination of userIds, check if it contains the member IDs
                return channelMembers.some(
                  (memberId) =>
                    urlChannelId.includes(memberId) && memberId !== user.uid,
                );
              }
              return false;
            });
          }

          if (channelToSelect) {
            // Auto-switch to bammbuu+ tab if it's a one-to-one chat
            if (
              channelToSelect.type === "one_to_one_chat" ||
              channelToSelect.type === "premium_individual_class" ||
              channelToSelect.type === "premium_group"
            ) {
              setActiveTab("bammbuu");
            }
            setSelectedChannel(channelToSelect);
            setSelectedChatInfo(getOtherUserFromChannel(channelToSelect));

            // Use safe mark read function to prevent disconnect errors
            try {
              await safeMarkChannelRead(channelToSelect);
              setUnreadCounts((prev) => ({
                ...prev,
                [channelToSelect.id]: 0,
              }));
            } catch (markReadError) {
              console.error("Error marking channel as read:", markReadError);
            }
          }
        } else {
          // Don't select any channel by default
          setSelectedChannel(null);
          setSelectedChatInfo(null);
        }
      } catch (error) {
        console.error("Error in loadChannels:", error);
      } finally {
        setLoading(false);
      }
    };

    loadChannels();
  }, [user, streamClientConnected, urlChannelId]);

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

  const handleChannelSelect = async (channel) => {
    setSelectedChannel(channel);
    setSelectedChatInfo(getOtherUserFromChannel(channel));

    try {
      // Mark channel as read when selected - use safe function to prevent disconnect errors
      await safeMarkChannelRead(channel);
      setUnreadCounts((prev) => ({
        ...prev,
        [channel.id]: 0,
      }));
    } catch (error) {
      console.error("Error marking channel as read:", error);
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

  // Standard chats - only standard_group
  const standardChats = filterChannels(
    channels.filter((channel) => channel.type === "standard_group"),
  );

  // Bammbuu+ chats - all other types (premium_group, premium_individual_class, one_to_one_chat)
  const filteredForBammbuu = channels.filter(
    (channel) =>
      channel.type === "premium_group" ||
      channel.type === "premium_individual_class" ||
      channel.type === "one_to_one_chat",
  );

  const ChatItem = ({ channel, isInstructor }) => {
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
                          console.log(
                            `Rendering bammbuu+ chat: ${channel.id}, type: ${
                              channel.type
                            }, name: ${channel.data?.name || "Unnamed"}`,
                          );

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
                        console.log(
                          `Rendering standard chat: ${channel.id}, type: ${
                            channel.type
                          }, name: ${channel.data?.name || "Unnamed"}`,
                        );

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

export default MessagesUser;
