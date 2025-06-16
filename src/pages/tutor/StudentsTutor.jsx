import React, { useState, useEffect } from "react";
import { Search, Bell } from "lucide-react";
import CustomChatComponent from "../../components/ChatComponent";
import { useAuth } from "../../context/AuthContext";
import { streamClient } from "../../config/stream";
import Sidebar from "../../components/Sidebar";
import { ClipLoader } from "react-spinners";
import { getChannelDisplayName } from "../../services/streamService";
import { getUserChannels } from "../../api/examPrepApi";

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

  // Helper function to extract the student and tutor info from a channel (for exam_prep naming)
  const getStudentAndTutorFromChannel = (channel) => {
    if (!channel || !user) return { student: null, tutor: null };
    let student = null;
    let tutor = null;
    if (channel.type === "exam_prep") {
      // exam_prep: members array with userType
      const members = channel.members || [];
      student = members.find((m) => m.userType !== "tutor");
      tutor = members.find((m) => m.userType === "tutor");
    } else if (channel.type === "one_to_one_chat") {
      const members = Object.values(channel.state?.members || {});
      student = members.find((m) => m.user?.userType !== "tutor");
      tutor = members.find((m) => m.user?.userType === "tutor");
      if (student && student.user) student = student.user;
      if (tutor && tutor.user) tutor = tutor.user;
    }
    return { student, tutor };
  };

  // Helper function to get the other user (student) for chatInfo
  const getOtherUserFromChannel = (channel) => {
    if (!channel || !user) return null;
    if (channel.type === "exam_prep") {
      const members = channel.members || [];
      const student = members.find((m) => m.userType !== "tutor");
      if (student) {
        return {
          id: student.id,
          name: student.name,
          image: student.image,
          online: student.online || false,
        };
      }
      return {
        id: "",
        name: "Student",
        image: "/images/exam-prep-icon.png",
        online: false,
      };
    }
    if (channel.type === "one_to_one_chat") {
      const members = Object.values(channel.state?.members || {});
      const student = members.find(
        (member) => member.user?.userType !== "tutor",
      );
      if (student && student.user) {
        return {
          id: student.user.id,
          name: student.user.name,
          image: student.user.image,
          online: student.user.online || false,
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

  useEffect(() => {
    const fetchStreamChannels = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        // Query all channels where the tutor is a member
        const channels = await streamClient.queryChannels(
          { members: { $in: [user.uid] } },
          { last_message_at: -1 },
          { watch: true, state: true },
        );
        setChannels(channels);
      } catch (err) {
        setChannels([]);
      } finally {
        setLoading(false);
      }
    };
    fetchStreamChannels();
  }, [user]);

  const handleChannelSelect = async (channel) => {
    setSelectedChannel(channel);
    setSelectedChatInfo(getOtherUserFromChannel(channel));
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

  // Categorize channels
  const standardChats = channels.filter(
    (ch) =>
      ch.type === "standard_group" &&
      Object.keys(ch.state?.members || {}).length > 1,
  );
  const bammbuuChats = channels.filter(
    (ch) =>
      (ch.type === "one_to_one_chat" ||
        ch.type === "premium_group" ||
        ch.type === "exam_prep") &&
      Object.keys(ch.state?.members || {}).length > 1,
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

  // Helper to get display name and image for a channel (for exam_prep, show student name)
  const getExamPrepDisplay = (channel) => {
    if (channel.type === "exam_prep") {
      // Find the student (not the tutor/created_by)
      const members = channel.members || [];
      const student = members.find((m) => m.userType !== "tutor");
      return {
        name: student?.name || "Student",
        image: student?.image || "/images/exam-prep-icon.png",
        id: student?.id,
      };
    }
    return {
      name: channel.data?.name || channel.name || "Group",
      image: channel.data?.image || "/default-avatar.png",
      id: channel.id,
    };
  };

  // Helper function to extract the student from a channel
  const getStudentFromChannel = (channel) => {
    if (!channel || !user) return null;
    const members = Object.values(channel.state?.members || {});
    // Find the member who is not the tutor
    const student = members.find((m) => m.user?.id !== user.uid);
    if (student && student.user) {
      return {
        id: student.user.id,
        name: student.user.name,
        image: student.user.image,
        online: student.user.online || false,
      };
    }
    return {
      id: "",
      name: "Student",
      image: "/images/exam-prep-icon.png",
      online: false,
    };
  };

  const ChatItem = ({ channel }) => {
    let name = "Group";
    let image = "/default-avatar.png";
    if (channel.type === "exam_prep" || channel.type === "one_to_one_chat") {
      const student = getStudentFromChannel(channel);
      name =
        channel.type === "exam_prep"
          ? `Exam Prep - ${student.name}`
          : student.name;
      image = student.image;
    } else if (channel.data?.name) {
      name = channel.data.name;
      image = channel.data.image || "/default-avatar.png";
    }
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
            alt={name}
            className="h-12 w-12 rounded-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/default-avatar.png";
            }}
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{name}</h3>
          </div>
        </div>
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
                  name={
                    selectedChannel.type === "exam_prep"
                      ? `Exam Prep - ${getStudentFromChannel(selectedChannel)?.name || "Student"}`
                      : getChannelDisplayName(selectedChannel, user)
                  }
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
