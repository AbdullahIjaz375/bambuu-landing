import React, { useState, useEffect } from "react";
import { Search, Bell, MoreVertical, Smile, Send, User } from "lucide-react";
import ChatComponent from "../../components/ChatComponent";
import { useAuth } from "../../context/AuthContext";
import { streamClient } from "../../config/stream";
import Sidebar from "../../components/Sidebar";
import { ChannelType } from "../../config/stream";
import { ClipLoader } from "react-spinners";

const StudentsTutor = () => {
  const { user } = useAuth();
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [loading, setLoading] = useState(true);
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
        // Filter out channels with null or empty names before setting state
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
  }, [user]);

  const handleChannelSelect = (channel) => {
    setSelectedChannel(channel);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Filter channels based on search query
  const filteredChannels = channels.filter((channel) => {
    // First ensure the channel has a valid name
    if (!channel.data.name || channel.data.name.trim() === "") {
      return false;
    }

    const channelName = channel.data.name.toLowerCase();
    const channelDescription = channel.data.description?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();

    return channelName.includes(query) || channelDescription.includes(query);
  });

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
              <div className="relative mb-4">
                <Search className="absolute w-5 h-5 text-[#5d5d5d] left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search student"
                  className="w-full py-2 pl-12 pr-4 border border-gray-200 rounded-3xl  focus:border-[#14B82C] focus:ring-0 focus:outline-none"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto scrollbar-hide">
                {filteredChannels.map((channel) => (
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
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <h3 className="font-semibold truncate">
                          {channel.data.name}
                        </h3>
                        <span className="flex-shrink-0 ml-2 text-xs text-gray-500">
                          {new Date(
                            channel.data.last_message_at
                          ).toLocaleTimeString()}
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
