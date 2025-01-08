import React, { useState, useEffect } from "react";
import { Search, Bell, MoreVertical, Smile, Send, User } from "lucide-react";
import ChatComponent from "../../components/ChatComponent";
import { useAuth } from "../../context/AuthContext";
import { streamClient } from "../../config/stream";
import Sidebar from "../../components/Sidebar";

const CommunityUser = () => {
  const { user } = useAuth();
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("group");
  const [searchQuery, setSearchQuery] = useState("");

  const handleChannelLeave = (channelId) => {
    // Remove the channel from the channels list
    setChannels((prevChannels) =>
      prevChannels.filter((channel) => channel.id !== channelId)
    );

    // If the left channel was selected, select the first available channel or null
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
        });

        setChannels(channels);
        if (channels.length > 0 && !selectedChannel) {
          setSelectedChannel(channels[0]);
        }
      } catch (error) {
        console.error("Error loading channels:", error);
      } finally {
        setLoading(false);
      }
    };

    loadChannels();
  }, [user]);

  const handleChannelSelect = (channel) => {
    setSelectedChannel(channel);
  };

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  // Filter channels based on type and search query
  const filterChannels = (channelsToFilter) => {
    return channelsToFilter.filter((channel) => {
      const searchTerm = searchQuery.toLowerCase();
      const channelName = (channel.data.name || "").toLowerCase();
      const channelDescription = (channel.data.description || "").toLowerCase();

      return (
        channelName.includes(searchTerm) ||
        channelDescription.includes(searchTerm)
      );
    });
  };

  const groupChats = filterChannels(
    channels.filter((channel) => channel.type === "standard_group")
  );

  const bambuuInstructors = filterChannels(
    channels.filter(
      (channel) =>
        channel.type === "premium_group" ||
        channel.type === "premium_individual_class" ||
        channel.type === "one_to_one_chat"
    )
  );

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar user={user} />
        <div className="flex items-center justify-center flex-1">
          Loading chats...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <Sidebar user={user} />
      {/* Main Content */}
      <div className="flex-1 px-6 pt-4 bg-white border-2 border-[#e7e7e7] rounded-3xl ml-[17rem] m-2">
        <div className="flex items-center justify-between pb-4 mb-6 border-b">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-semibold">Community</h1>
          </div>
          {/* <button className="rounded-full hover:bg-gray-100 border border-[#ffbf00] p-2">
            <Bell className="w-6 h-6" />
          </button> */}
        </div>
        <div className="flex-1 flex bg-white rounded-3xl m-2 h-[calc(100vh-145px)]">
          {/*  Left Panel */}
          <div className="p-4 bg-[#f6f6f6] w-96 rounded-2xl overflow-hidden flex flex-col">
            <div className="flex gap-2 mb-4">
              <button
                className={`px-4 py-2 rounded-full text-md ${
                  activeTab === "group"
                    ? "bg-[#ffbf00] border border-[#042f0c] text-[#042f0c]"
                    : "bg-gray-100 border"
                }`}
                onClick={() => setActiveTab("group")}
              >
                Group Chats
              </button>
              <button
                className={`px-4 py-2 rounded-full text-sm ${
                  activeTab === "bammbuuu"
                    ? "bg-[#ffbf00] border border-[#042f0c] text-[#042f0c]"
                    : "bg-gray-100 border"
                }`}
                onClick={() => setActiveTab("bammbuuu")}
              >
                bammbuuu+ Instructor
              </button>
            </div>

            <div className="relative mb-4">
              <Search className="absolute w-5 h-5 text-[#5d5d5d] left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                placeholder={
                  activeTab === "group" ? "Search groups" : "Search instructor"
                }
                className="w-full py-2 pl-10 pr-4 bg-gray-100 border border-[#d1d1d1] rounded-full"
              />
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto scrollbar-hide">
              {activeTab === "bammbuuu"
                ? bambuuInstructors.map((channel) => (
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
                        {!channel.data.disabled && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h3 className="font-semibold">{channel.data.name}</h3>
                          <span className="text-xs text-gray-500">
                            {new Date(
                              channel.data.last_message_at
                            ).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {channel.data.description || "No description"}
                        </p>
                      </div>
                    </div>
                  ))
                : groupChats.map((channel) => (
                    <div
                      key={channel.id}
                      className={`flex items-center gap-3 p-3 border border-[#fbbf12] cursor-pointer rounded-3xl ${
                        selectedChannel?.id === channel.id ? "bg-[#ffffea]" : ""
                      }`}
                      onClick={() => handleChannelSelect(channel)}
                    >
                      <div className="relative">
                        <img
                          src={channel.data.image || "/default-avatar.png"}
                          alt={channel.data.name}
                          className="object-cover w-12 h-12 rounded-full"
                        />
                        {!channel.data.disabled && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">
                            {channel.data.name}
                          </h3>
                          <span className="px-2 py-1 text-xs bg-yellow-100 rounded-full">
                            {channel.data.member_count} members
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {channel.data.description
                            ? channel.data.description.length > 10
                              ? channel.data.description.slice(0, 10) + "..."
                              : channel.data.description
                            : "No description"}
                        </p>
                      </div>
                    </div>
                  ))}
            </div>
          </div>

          {/* Right Panel */}
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
  );
};

export default CommunityUser;
