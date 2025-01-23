import React, { useState, useEffect } from "react";
import { Search, Bell, MoreVertical, Smile, Send, User } from "lucide-react";
import ChatComponent from "../../components/ChatComponent";
import { useAuth } from "../../context/AuthContext";
import { streamClient } from "../../config/stream";
import Sidebar from "../../components/Sidebar";
import { ClipLoader } from "react-spinners";

const StudentsTutor = () => {
  const { user } = useAuth();
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("students");
  const [unreadCounts, setUnreadCounts] = useState({});

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
    }
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
            const state = await channel.watch();
            const channelState = channel.state;
            counts[channel.id] = channelState.unreadCount || 0;

            // Set up message listeners
            channel.on("message.new", async (event) => {
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

            channel.on("notification.message_new", (event) => {
              if (
                event.user?.id !== user.uid &&
                channel.id !== selectedChannel?.id
              ) {
                setUnreadCounts((prev) => ({
                  ...prev,
                  [channel.id]: (prev[channel.id] || 0) + 1,
                }));
              }
            });
          })
        );

        setUnreadCounts(counts);
        const validChannels = channels.filter(
          (channel) => channel.data.name && channel.data.name.trim() !== ""
        );
        setChannels(validChannels);
        if (validChannels.length > 0 && !selectedChannel) {
          setSelectedChannel(validChannels[0]);
        }
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
      });
    };
  }, [user]);

  const handleChannelSelect = async (channel) => {
    setSelectedChannel(channel);
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
      if (!channel.data.name || channel.data.name.trim() === "") {
        return false;
      }

      const channelName = channel.data.name.toLowerCase();
      const channelDescription = channel.data.description?.toLowerCase() || "";
      const query = searchQuery.toLowerCase();

      return channelName.includes(query) || channelDescription.includes(query);
    });
  };

  // Get individual student chats
  const studentChats = filterChannels(
    channels.filter(
      (channel) =>
        (channel.type === "premium_individual_class" ||
          channel.type === "one_to_one_chat") &&
        channel.data.name &&
        channel.data.name.trim() !== ""
    )
  );

  // Get group chats
  const groupChats = filterChannels(
    channels.filter(
      (channel) =>
        channel.type === "premium_group" &&
        channel.data.name &&
        channel.data.name.trim() !== ""
    )
  );

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar user={user} />
        <div className="flex items-center justify-center flex-1">
          <ClipLoader color="#FFB800" size={40} />
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
              <h1 className="text-4xl font-semibold">Students</h1>
            </div>
            <button className="rounded-full hover:bg-gray-100 border border-[#ffbf00] p-2">
              <Bell className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 flex bg-white rounded-3xl m-2 h-[calc(100vh-125px)]">
            <div className="p-4 bg-[#f6f6f6] w-96 rounded-2xl overflow-hidden flex flex-col">
              <div className="flex justify-center w-full mb-4 sm:w-auto">
                <div className="inline-flex bg-gray-100 border border-gray-300 rounded-full">
                  <button
                    onClick={() => setActiveTab("students")}
                    className={`px-8 py-2 rounded-full text-[#042F0C] text-md font-medium transition-colors whitespace-nowrap
                    ${
                      activeTab === "students"
                        ? "bg-[#FFBF00] border border-[#042F0C]"
                        : "bg-transparent"
                    }`}
                  >
                    Student Chats
                  </button>
                  <button
                    onClick={() => setActiveTab("groups")}
                    className={`px-8 py-2 rounded-full text-[#042F0C] text-md font-medium transition-colors whitespace-nowrap
                    ${
                      activeTab === "groups"
                        ? "bg-[#FFBF00] border border-[#042F0C]"
                        : "bg-transparent"
                    }`}
                  >
                    Group Chats
                  </button>
                </div>
              </div>

              <div className="relative mb-4">
                <Search className="absolute w-5 h-5 text-[#5d5d5d] left-3 top-3" />
                <input
                  type="text"
                  placeholder={
                    activeTab === "students" ? "Search student" : "Search group"
                  }
                  className="w-full py-2 pl-12 pr-4 border border-gray-200 rounded-3xl focus:border-[#14B82C] focus:ring-0 focus:outline-none"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto scrollbar-hide">
                {(activeTab === "students" ? studentChats : groupChats).map(
                  (channel) => (
                    <div
                      key={channel.id}
                      className={`flex items-center gap-3 p-3 border border-[#22bf37] cursor-pointer rounded-3xl ${
                        selectedChannel?.id === channel.id ? "bg-[#f0fdf1]" : ""
                      }`}
                      onClick={() => handleChannelSelect(channel)}
                    >
                      <div className="relative">
                        <img
                          src={channel.data.image || "/default-avatar.png"}
                          alt={channel.data.name}
                          className="object-cover w-12 h-12 rounded-full"
                        />
                        {/* {!channel.data.disabled && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                        )} */}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h3 className="text-lg font-semibold">
                            {channel.data.name}
                          </h3>
                        </div>
                        <div className="flex flex-row items-center justify-between mt-1">
                          <p className="text-sm text-gray-500 truncate">
                            {getMessagePreview(
                              channel.state.messages[
                                channel.state.messages.length - 1
                              ]
                            )}
                          </p>
                          {unreadCounts[channel.id] > 0 && (
                            <span className="flex items-center justify-center w-6 h-6 mr-5 text-xs text-white bg-[#14B82C] rounded-full">
                              {unreadCounts[channel.id]}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="flex-1 ml-4">
              {selectedChannel ? (
                <ChatComponent
                  channelId={selectedChannel.id}
                  type={selectedChannel.type}
                  onChannelLeave={handleChannelLeave}
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

export default StudentsTutor;
