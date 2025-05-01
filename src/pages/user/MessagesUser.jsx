import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { streamClient } from "../../config/stream";
import Sidebar from "../../components/Sidebar";
import { ClipLoader } from "react-spinners";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useParams, useNavigate } from "react-router-dom";
import CustomChatComponent from "../../components/ChatComponent";

const MessagesUser = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedChatInfo, setSelectedChatInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("group");
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadCounts, setUnreadCounts] = useState({});
  const [groupLanguages, setGroupLanguages] = useState({});
  const { channelId: urlChannelId } = useParams();

  const handleChannelLeave = (channelId) => {
    setChannels((prevChannels) =>
      prevChannels.filter((channel) => channel.id !== channelId)
    );

    if (selectedChannel?.id === channelId) {
      const remainingChannels = channels.filter(
        (channel) => channel.id !== channelId
      );
      setSelectedChannel(
        remainingChannels.length > 0 ? remainingChannels[0] : null
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

    // For one-to-one chats
    if (
      channel.type === "premium_individual_class" ||
      channel.type === "one_to_one_chat"
    ) {
      const members = Object.values(channel.state?.members || {});
      const otherMember = members.find(
        (member) => member.user?.id !== user.uid
      );

      if (otherMember && otherMember.user) {
        return {
          id: otherMember.user.id,
          name: otherMember.user.name || channel.data.name,
          image: otherMember.user.image,
          online: otherMember.user.online || false,
        };
      }
    }

    // For group chats, just return the group info
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

        const channels = await streamClient.queryChannels(filter, sort, {
          watch: true,
          state: true,
          presence: true,
          message_retention: "infinite",
        });

        // Initialize unread counts
        const counts = {};
        await Promise.all(
          channels.map(async (channel) => {
            // Get the channel state including unread counts
            const state = await channel.watch();
            const channelState = channel.state;
            counts[channel.id] = channelState.unreadCount || 0;

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

            // Removing the notification.message_new listener that was causing duplicate messages
            // The message.new event above already handles unread count updates
          })
        );

        const groupIds = channels
          .filter((channel) => channel.type === "standard_group")
          .map((channel) => channel.id);

        const groupLanguagesData = {};
        await Promise.all(
          groupIds.map(async (groupId) => {
            const groupRef = doc(db, "groups", groupId);
            const groupDoc = await getDoc(groupRef);
            if (groupDoc.exists()) {
              groupLanguagesData[groupId] =
                groupDoc.data().groupLearningLanguage;
            }
          })
        );
        setGroupLanguages(groupLanguagesData);

        setUnreadCounts(counts);
        setChannels(channels);

        // Select channel from URL or first available
        if (urlChannelId) {
          const channelToSelect = channels.find(
            (channel) => channel.id === urlChannelId
          );
          if (channelToSelect) {
            setSelectedChannel(channelToSelect);
            setSelectedChatInfo(getOtherUserFromChannel(channelToSelect));
            await channelToSelect.markRead();
            setUnreadCounts((prev) => ({
              ...prev,
              [channelToSelect.id]: 0,
            }));
          }
        } else if (channels.length > 0 && !selectedChannel) {
          setSelectedChannel(channels[0]);
          setSelectedChatInfo(getOtherUserFromChannel(channels[0]));
        }
      } catch (error) {
        console.error("Error loading channels:", error);
      } finally {
        setLoading(false);
      }
    };

    loadChannels();

    return () => {
      // Cleanup channel listeners when component unmounts
      channels.forEach((channel) => {
        channel.off("message.new");
        channel.off("message.read");
      });
    };
  }, [user]);

  const handleChannelSelect = async (channel) => {
    setSelectedChannel(channel);
    setSelectedChatInfo(getOtherUserFromChannel(channel));

    try {
      // Mark channel as read when selected
      await channel.markRead();
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

  const filterChannels = (channelsToFilter) => {
    return channelsToFilter.filter((channel) => {
      // First check if the channel has a valid name
      if (!channel.data.name || channel.data.name.trim() === "") {
        return false;
      }

      const searchTerm = searchQuery.toLowerCase();
      const channelName = channel.data.name.toLowerCase();
      const channelDescription = (channel.data.description || "").toLowerCase();

      return (
        channelName.includes(searchTerm) ||
        channelDescription.includes(searchTerm)
      );
    });
  };

  const groupChats = filterChannels(
    channels.filter(
      (channel) =>
        (channel.type === "standard_group" ||
          channel.type === "premium_group") &&
        channel.data.name &&
        channel.data.name.trim() !== ""
    )
  );

  const bambuuInstructors = filterChannels(
    channels.filter(
      (channel) =>
        (channel.type === "premium_individual_class" ||
          channel.type === "one_to_one_chat") &&
        channel.data.name &&
        channel.data.name.trim() !== ""
    )
  );

  const ChatItem = ({ channel, isInstructor }) => {
    const groupLanguage = groupLanguages[channel.id];
    const latestMessage =
      channel.state.messages[channel.state.messages.length - 1];

    const getMessagePreview = (message) => {
      if (!message) return "No messages yet";

      if (message.attachments && message.attachments.length > 0) {
        const attachment = message.attachments[0];
        // Check if it's an image
        if (
          attachment.type === "image" ||
          attachment.mime_type?.startsWith("image/")
        ) {
          return "🖼️ Sent an image";
        }
        // Handle other attachment types if needed
        return "📎 Sent an attachment";
      }

      // Regular text message
      return message.text.length > 30
        ? message.text.slice(0, 30) + "..."
        : message.text;
    };

    // Get other user's data for display (for one-to-one chats)
    const otherUser = getOtherUserFromChannel(channel);

    return (
      <div
        key={channel.id}
        className={`flex items-center gap-3 p-3 border ${
          isInstructor ? "border-[#22bf37]" : "border-[#fbbf12]"
        } cursor-pointer rounded-3xl ${
          selectedChannel?.id === channel.id
            ? isInstructor
              ? "bg-[#f0fdf1]"
              : "bg-[#ffffea]"
            : "bg-white"
        }`}
        onClick={() => handleChannelSelect(channel)}
      >
        <div className="relative">
          <img
            src={
              otherUser?.image || channel.data.image || "/default-avatar.png"
            }
            alt={otherUser?.name || channel.data.name}
            className="object-cover w-12 h-12 rounded-full"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/default-avatar.png";
            }}
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {otherUser?.name || channel.data.name}
            </h3>
          </div>

          <div className="flex flex-row items-center justify-between mt-1">
            <p className="text-sm text-gray-500 truncate">
              {getMessagePreview(latestMessage)}
            </p>

            <div className="flex items-center space-x-2">
              {isInstructor ? null : (
                <div className="flex flex-row items-center space-x-2">
                  <span className="px-2 py-0.5 text-xs bg-yellow-100 rounded-full">
                    {groupLanguage}
                  </span>
                </div>
              )}
            </div>

            {unreadCounts[channel.id] > 0 && (
              <span className="flex items-center justify-center w-6 h-6 mr-5 text-xs text-white bg-[#14B82C] rounded-full">
                {unreadCounts[channel.id]}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar user={user} />
        <div className="flex items-center justify-center flex-1">
          <ClipLoader color="#14B82C" size={50} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="flex-shrink-0 w-64 h-full">
        <Sidebar user={user} />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-x-auto min-w-[calc(100%-16rem)] h-full">
        <div className="flex-1 px-6 pt-4 bg-white border-2 border-[#e7e7e7] rounded-3xl m-2">
          <div className="flex items-center justify-between pb-4 mb-6 border-b">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-semibold">Community</h1>
            </div>
          </div>
          <div className="flex-1 flex bg-white rounded-3xl m-2 h-[calc(100vh-125px)]">
            <div className="p-4 bg-[#f6f6f6] w-96 rounded-2xl overflow-hidden flex flex-col">
              <div className="flex justify-center w-full mb-4 sm:w-auto">
                <div className="relative inline-flex p-1 bg-gray-100 border border-gray-300 rounded-full">
                  <div
                    className="absolute top-0 left-0 h-full transition-all duration-300 ease-in-out border border-gray-800 rounded-full bg-amber-400"
                    style={{
                      transform:
                        activeTab === "group"
                          ? "translateX(0)"
                          : "translateX(66.67%)",
                      width: activeTab === "group" ? "40%" : "60%",
                    }}
                  />
                  <button
                    onClick={() => setActiveTab("group")}
                    className="relative z-10 w-2/5 px-6 py-1 font-medium text-gray-800 transition-colors rounded-full text-md whitespace-nowrap"
                  >
                    Group Chats
                  </button>
                  <button
                    onClick={() => setActiveTab("bammbuuu")}
                    className="relative z-10 w-3/5 px-6 py-1 font-medium text-gray-800 transition-colors rounded-full text-md whitespace-nowrap"
                  >
                    bammbuuu+ Instructor
                  </button>
                </div>
              </div>

              <div className="relative mb-4">
                <Search className="absolute w-5 h-5 text-[#5d5d5d] left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearch}
                  placeholder={
                    activeTab === "group"
                      ? "Search groups"
                      : "Search instructor"
                  }
                  className="w-full py-2 pl-12 pr-4 border border-gray-200 rounded-3xl focus:border-[#14B82C] focus:ring-0 focus:outline-none"
                />
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto scrollbar-hide">
                {activeTab === "bammbuuu"
                  ? bambuuInstructors.map((channel) => (
                      <ChatItem
                        key={channel.id}
                        channel={channel}
                        isInstructor={true}
                      />
                    ))
                  : groupChats.map((channel) => (
                      <ChatItem
                        key={channel.id}
                        channel={channel}
                        isInstructor={false}
                      />
                    ))}
              </div>
            </div>

            <div className="flex-1 ml-4">
              {selectedChannel ? (
                <CustomChatComponent
                  channelId={selectedChannel.id}
                  type={selectedChannel.type}
                  onChannelLeave={handleChannelLeave}
                  chatInfo={selectedChatInfo}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
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
