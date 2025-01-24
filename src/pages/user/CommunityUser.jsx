// import React, { useState, useEffect } from "react";
// import { Search, Bell, MoreVertical, Smile, Send, User } from "lucide-react";
// import ChatComponent from "../../components/ChatComponent";
// import { useAuth } from "../../context/AuthContext";
// import { streamClient } from "../../config/stream";
// import Sidebar from "../../components/Sidebar";
// import { ClipLoader } from "react-spinners";
// import { doc, getDoc } from 'firebase/firestore';
// import { db } from '../../config/firebase';

// const CommunityUser = () => {
//   const { user } = useAuth();
//   const [channels, setChannels] = useState([]);
//   const [selectedChannel, setSelectedChannel] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [activeTab, setActiveTab] = useState("group");
//   const [searchQuery, setSearchQuery] = useState("");
//   const [unreadCounts, setUnreadCounts] = useState({});

//   const handleChannelLeave = (channelId) => {
//     setChannels((prevChannels) =>
//       prevChannels.filter((channel) => channel.id !== channelId)
//     );

//     if (selectedChannel?.id === channelId) {
//       const remainingChannels = channels.filter(
//         (channel) => channel.id !== channelId
//       );
//       setSelectedChannel(
//         remainingChannels.length > 0 ? remainingChannels[0] : null
//       );
//     }
//   };

//   useEffect(() => {
//     const loadChannels = async () => {
//       if (!user) return;

//       try {
//         const filter = {
//           members: { $in: [user.uid] },
//           type: {
//             $in: [
//               "standard_group",
//               "premium_group",
//               "premium_individual_class",
//               "one_to_one_chat",
//             ],
//           },
//         };

//         const sort = { last_message_at: -1 };

//         const channels = await streamClient.queryChannels(filter, sort, {
//           watch: true,
//           state: true,
//           presence: true,
//           message_retention: "infinite",
//         });

//         // Initialize unread counts
//         const counts = {};
//         await Promise.all(
//           channels.map(async (channel) => {
//             // Get the channel state including unread counts
//             const state = await channel.watch();
//             const channelState = channel.state;
//             counts[channel.id] = channelState.unreadCount || 0;
//             console.log(
//               "Initial unread count for channel:",
//               channel.id,
//               counts[channel.id]
//             );

//             // Set up message.new event listener
//             channel.on("message.new", async (event) => {
//               console.log("New message event:", event);
//               // Check if message is from another user and channel is not selected
//               if (
//                 event.user?.id !== user.uid &&
//                 channel.id !== selectedChannel?.id
//               ) {
//                 const state = channel.state;
//                 const unreadCount = state.unreadCount || 1;
//                 console.log(
//                   "Updating unread count for channel:",
//                   channel.id,
//                   unreadCount
//                 );
//                 setUnreadCounts((prev) => ({
//                   ...prev,
//                   [channel.id]: unreadCount,
//                 }));
//               }
//             });

//             channel.on("notification.message_new", (event) => {
//               console.log("New message notification:", event);
//               if (
//                 event.user?.id !== user.uid &&
//                 channel.id !== selectedChannel?.id
//               ) {
//                 setUnreadCounts((prev) => ({
//                   ...prev,
//                   [channel.id]: (prev[channel.id] || 0) + 1,
//                 }));
//               }
//             });
//           })
//         );

//         setUnreadCounts(counts);
//         setChannels(channels);
//         if (channels.length > 0 && !selectedChannel) {
//           setSelectedChannel(channels[0]);
//         }
//       } catch (error) {
//         console.error("Error loading channels:", error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadChannels();

//     return () => {
//       // Cleanup channel listeners when component unmounts
//       channels.forEach((channel) => {
//         channel.off("message.new");
//         channel.off("message.read");
//       });
//     };
//   }, [user]);

//   const handleChannelSelect = async (channel) => {
//     setSelectedChannel(channel);

//     try {
//       // Mark channel as read when selected
//       await channel.markRead();
//       setUnreadCounts((prev) => ({
//         ...prev,
//         [channel.id]: 0,
//       }));
//     } catch (error) {
//       console.error("Error marking channel as read:", error);
//     }
//   };

//   const handleSearch = (event) => {
//     setSearchQuery(event.target.value);
//   };

//   const filterChannels = (channelsToFilter) => {
//     return channelsToFilter.filter((channel) => {
//       // First check if the channel has a valid name
//       if (!channel.data.name || channel.data.name.trim() === "") {
//         return false;
//       }

//       const searchTerm = searchQuery.toLowerCase();
//       const channelName = channel.data.name.toLowerCase();
//       const channelDescription = (channel.data.description || "").toLowerCase();

//       return (
//         channelName.includes(searchTerm) ||
//         channelDescription.includes(searchTerm)
//       );
//     });
//   };

//   const groupChats = filterChannels(
//     channels.filter(
//       (channel) =>
//         channel.type === "standard_group" &&
//         channel.data.name &&
//         channel.data.name.trim() !== ""
//     )
//   );

//   const bambuuInstructors = filterChannels(
//     channels.filter(
//       (channel) =>
//         (channel.type === "premium_group" ||
//           channel.type === "premium_individual_class" ||
//           channel.type === "one_to_one_chat") &&
//         channel.data.name &&
//         channel.data.name.trim() !== ""
//     )
//   );

//   const ChatItem = ({ channel, isInstructor }) => {
//     // Get the latest message from channel state
//     const latestMessage =
//       channel.state.messages[channel.state.messages.length - 1];

//     return (
//       <div
//         key={channel.id}
//         className={`flex items-center gap-3 p-3 border ${
//           isInstructor ? "border-[#22bf37]" : "border-[#fbbf12]"
//         } cursor-pointer rounded-3xl ${
//           selectedChannel?.id === channel.id
//             ? isInstructor
//               ? "bg-[#f0fdf1]"
//               : "bg-[#ffffea]"
//             : "bg-white"
//         }`}
//         onClick={() => handleChannelSelect(channel)}
//       >
//         <div className="relative">
//           <img
//             src={channel.data.image || "/default-avatar.png"}
//             alt={channel.data.name}
//             className="object-cover w-12 h-12 rounded-full"
//           />
//           {!channel.data.disabled && (
//             <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
//           )}
//         </div>
//         <div className="flex-1">
//           <div className="flex items-center justify-between">
//             <h3 className="text-lg font-semibold">{channel.data.name}</h3>
//             <div className="flex items-center">
//               {!isInstructor && (
//                 <span className="px-2 py-1 text-xs bg-yellow-100 rounded-full">
//                   {channel.data.member_count} members
//                 </span>
//               )}
//             </div>
//           </div>

//           <div className="flex flex-row items-center justify-between mt-1">
//             <p className="text-sm text-gray-500 truncate">
//               {latestMessage
//                 ? latestMessage.text.length > 30
//                   ? latestMessage.text.slice(0, 30) + "..."
//                   : latestMessage.text
//                 : "No messages yet"}
//             </p>
//             {unreadCounts[channel.id] > 0 && (
//               <span className="flex items-center justify-center w-6 h-6 mr-5 text-xs text-white bg-[#14B82C] rounded-full">
//                 {unreadCounts[channel.id]}
//               </span>
//             )}
//           </div>
//         </div>
//       </div>
//     );
//   };

//   if (loading) {
//     return (
//       <div className="flex min-h-screen bg-white">
//         <Sidebar user={user} />
//         <div className="flex items-center justify-center flex-1">
//           <ClipLoader color="#14B82C" size={50} />
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="flex h-screen bg-white">
//       {/* Sidebar */}
//       <div className="flex-shrink-0 w-64 h-full">
//         <Sidebar user={user} />
//       </div>

//       {/* Main Content */}
//       <div className="flex-1 overflow-x-auto min-w-[calc(100%-16rem)] h-full">
//         <div className="flex-1 px-6 pt-4 bg-white border-2 border-[#e7e7e7] rounded-3xl m-2">
//           <div className="flex items-center justify-between pb-4 mb-6 border-b">
//             <div className="flex items-center gap-4">
//               <h1 className="text-4xl font-semibold">Community</h1>
//             </div>
//           </div>
//           <div className="flex-1 flex bg-white rounded-3xl m-2 h-[calc(100vh-125px)]">
//             <div className="p-4 bg-[#f6f6f6] w-96 rounded-2xl overflow-hidden flex flex-col">
//               <div className="flex justify-center w-full mb-4 sm:w-auto">
//                 <div className="inline-flex bg-gray-100 border border-gray-300 rounded-full">
//                   <button
//                     onClick={() => setActiveTab("group")}
//                     className={`px-4  py-2 rounded-full text-[#042F0C] text-md font-medium transition-colors whitespace-nowrap
//                   ${
//                     activeTab === "group"
//                       ? "bg-[#FFBF00] border border-[#042F0C]"
//                       : "bg-transparent"
//                   }`}
//                   >
//                     Group Chats
//                   </button>
//                   <button
//                     onClick={() => setActiveTab("bammbuuu")}
//                     className={`px-4  py-2 rounded-full text-[#042F0C] text-md font-medium transition-colors whitespace-nowrap
//                   ${
//                     activeTab === "bammbuuu"
//                       ? "bg-[#FFBF00] border border-[#042F0C]"
//                       : "bg-transparent"
//                   }`}
//                   >
//                     bammbuuu+ Instructor
//                   </button>
//                 </div>
//               </div>

//               <div className="relative mb-4">
//                 <Search className="absolute w-5 h-5 text-[#5d5d5d] left-3 top-3" />
//                 <input
//                   type="text"
//                   value={searchQuery}
//                   onChange={handleSearch}
//                   placeholder={
//                     activeTab === "group"
//                       ? "Search groups"
//                       : "Search instructor"
//                   }
//                   className="w-full py-2 pl-12 pr-4 border border-gray-200 rounded-3xl  focus:border-[#14B82C] focus:ring-0 focus:outline-none"
//                 />
//               </div>

//               <div className="flex-1 space-y-2 overflow-y-auto scrollbar-hide">
//                 {activeTab === "bammbuuu"
//                   ? bambuuInstructors.map((channel) => (
//                       <ChatItem
//                         key={channel.id}
//                         channel={channel}
//                         isInstructor={true}
//                       />
//                     ))
//                   : groupChats.map((channel) => (
//                       <ChatItem
//                         key={channel.id}
//                         channel={channel}
//                         isInstructor={false}
//                       />
//                     ))}
//               </div>
//             </div>

//             <div className="flex-1 ml-4">
//               {selectedChannel ? (
//                 <ChatComponent
//                   channelId={selectedChannel.id}
//                   type={selectedChannel.type}
//                   onChannelLeave={handleChannelLeave}
//                 />
//               ) : (
//                 <div className="flex items-center justify-center h-full text-gray-500">
//                   Select a chat to start messaging
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CommunityUser;

import React, { useState, useEffect } from "react";
import { Search, Bell, MoreVertical, Smile, Send, User } from "lucide-react";
import ChatComponent from "../../components/ChatComponent";
import { useAuth } from "../../context/AuthContext";
import { streamClient } from "../../config/stream";
import Sidebar from "../../components/Sidebar";
import { ClipLoader } from "react-spinners";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";

const CommunityUser = () => {
  const { user } = useAuth();
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("group");
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadCounts, setUnreadCounts] = useState({});
  const [groupLanguages, setGroupLanguages] = useState({});

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
            // Get the channel state including unread counts
            const state = await channel.watch();
            const channelState = channel.state;
            counts[channel.id] = channelState.unreadCount || 0;
            console.log(
              "Initial unread count for channel:",
              channel.id,
              counts[channel.id]
            );

            // Set up message.new event listener
            channel.on("message.new", async (event) => {
              console.log("New message event:", event);
              // Check if message is from another user and channel is not selected
              if (
                event.user?.id !== user.uid &&
                channel.id !== selectedChannel?.id
              ) {
                const state = channel.state;
                const unreadCount = state.unreadCount || 1;
                console.log(
                  "Updating unread count for channel:",
                  channel.id,
                  unreadCount
                );
                setUnreadCounts((prev) => ({
                  ...prev,
                  [channel.id]: unreadCount,
                }));
              }
            });

            channel.on("notification.message_new", (event) => {
              console.log("New message notification:", event);
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
        channel.type === "standard_group" &&
        channel.data.name &&
        channel.data.name.trim() !== ""
    )
  );

  const bambuuInstructors = filterChannels(
    channels.filter(
      (channel) =>
        (channel.type === "premium_group" ||
          channel.type === "premium_individual_class" ||
          channel.type === "one_to_one_chat") &&
        channel.data.name &&
        channel.data.name.trim() !== ""
    )
  );

  const ChatItem = ({ channel, isInstructor }) => {
    // const [groupLanguage, setGroupLanguage] = useState(null);
    const groupLanguage = groupLanguages[channel.id];

    const latestMessage =
      channel.state.messages[channel.state.messages.length - 1];

    // useEffect(() => {
    //   const fetchGroupLanguage = async () => {
    //     if (!isInstructor) {
    //       try {
    //         const groupRef = doc(db, "groups", channel.id);
    //         const groupDoc = await getDoc(groupRef);
    //         if (groupDoc.exists()) {
    //           setGroupLanguage(groupDoc.data().groupLearningLanguage);
    //         }
    //       } catch (error) {
    //         console.error("Error fetching group language:", error);
    //       }
    //     }
    //   };

    //   fetchGroupLanguage();
    // }, [channel.id, isInstructor]);

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
            src={channel.data.image || "/default-avatar.png"}
            alt={channel.data.name}
            className="object-cover w-12 h-12 rounded-full"
          />
          {/* {!channel.data.disabled && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
          )} */}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{channel.data.name}</h3>
          </div>

          <div className="flex flex-row items-center justify-between mt-1">
            <p className="text-sm text-gray-500 truncate">
              {isInstructor ? (
                getMessagePreview(latestMessage)
              ) : (
                <div className="flex flex-row items-center space-x-4">
                  <div className="flex flex-row items-center space-x-2">
                    <img
                      src={
                        groupLanguage === "English"
                          ? "/svgs/xs-us.svg"
                          : groupLanguage === "Spanish"
                          ? "/svgs/xs-spain.svg"
                          : "/svgs/eng-spanish-xs.svg" // Optional: fallback flag
                      }
                      alt={
                        groupLanguage === "English"
                          ? "US Flag"
                          : groupLanguage === "Spanish"
                          ? "Spain Flag"
                          : "Default Flag"
                      }
                      className="w-4 h-4 sm:w-auto"
                    />
                    <span>{groupLanguage}</span>
                  </div>
                  <div className="flex items-center ">
                    <img alt="bammbuu" src="/svgs/users.svg" />

                    <span className="">{channel.data.member_count}</span>
                  </div>
                </div>
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
                {/* <div className="inline-flex bg-gray-100 border border-gray-300 rounded-full">
                  <button
                    onClick={() => setActiveTab("group")}
                    className={`px-4  py-2 rounded-full text-[#042F0C] text-md font-medium transition-colors whitespace-nowrap
                  ${
                    activeTab === "group"
                      ? "bg-[#FFBF00] border border-[#042F0C]"
                      : "bg-transparent"
                  }`}
                  >
                    Group Chats
                  </button>
                  <button
                    onClick={() => setActiveTab("bammbuuu")}
                    className={`px-4  py-2 rounded-full text-[#042F0C] text-md font-medium transition-colors whitespace-nowrap
                  ${
                    activeTab === "bammbuuu"
                      ? "bg-[#FFBF00] border border-[#042F0C]"
                      : "bg-transparent"
                  }`}
                  >
                    bammbuuu+ Instructor
                  </button>
                </div> */}

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
                  className="w-full py-2 pl-12 pr-4 border border-gray-200 rounded-3xl  focus:border-[#14B82C] focus:ring-0 focus:outline-none"
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

export default CommunityUser;
