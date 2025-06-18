import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { ClipLoader } from "react-spinners";
import { MoreVertical, Paperclip, Smile, Send, X, Search } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  removeMemberFromStreamChannel,
  deleteStreamChannel,
} from "../services/streamService";
import Modal from "react-modal";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTranslation } from "react-i18next";
Modal.setAppElement("#root");

const CustomChatComponent = ({
  channelId,
  type,
  onChannelLeave,
  chatInfo,
  description,
  name,
}) => {
  const { user, streamClient } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isStudentsTutorPage = location.pathname.includes("/studentsTutor");
  const isMessagesUserPage = location.pathname.includes("/messagesUser");
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(true);
  const [channel, setChannel] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [error, setError] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [savedResources, setSavedResources] = useState([]);
  const [selectedResources, setSelectedResources] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSending, setIsSending] = useState(false);

  const dropdownRef = useRef(null);
  const messagesEndRef = useRef(null);

  const chatPartner = chatInfo || {
    id: "",
    name: "",
    online: false,
    image: "",
  };

  const isGroupChat = type === "standard_group" || type === "premium_group";
  const isOneToOne =
    type === "one_to_one_chat" || type === "premium_individual_class";

  useEffect(() => {
    if (streamClient?.disconnected && user) {
      streamClient.connectUser(
        { id: user.uid },
        streamClient.devToken(user.uid),
      );
    }
  }, [streamClient, user]);

  useEffect(() => {
    const initChannel = async () => {
      if (!channelId || !streamClient) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Check if type is provided
        const channelType = type || "messaging";

        if (streamClient.disconnected) {
          await streamClient.connectUser({ id: user.uid }, user.streamToken);
        }

        const channelObj = streamClient.channel(channelType, channelId);
        await channelObj.watch();

        const state = channelObj.state;
        let channelMessages = state.messages || [];

        // Filter out the first message if it's a system/hidden message and on StudentsTutor or MessagesUser page, but only for exam_prep channels
        if (
          (isStudentsTutorPage || isMessagesUserPage) &&
          channelType === "exam_prep" &&
          channelMessages.length > 0
        ) {
          const firstMsg = channelMessages[0];
          if (firstMsg.type === "system" && firstMsg.hidden === true) {
            channelMessages = channelMessages.slice(1);
          }
        }

        const formattedMessages = channelMessages.map((msg) => ({
          id: msg.id,
          text: msg.text,
          sender: msg.user && msg.user.id === user.uid ? "self" : "other",
          senderName: msg.user ? msg.user.name : msg.user_id || "Unknown",
          senderImage: msg.user ? msg.user.image : null,
          timestamp: new Date(msg.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          date: new Date(msg.created_at).toLocaleDateString([], {
            weekday: "long",
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
        }));

        setMessages(formattedMessages);
        setChannel(channelObj);

        // Create event handler reference - will be cleaned up properly
        const handleNewMessage = (event) => {
          const newMsg = {
            id: event.message.id,
            text: event.message.text,
            sender: event.user.id === user.uid ? "self" : "other",
            timestamp: new Date(event.message.created_at).toLocaleTimeString(
              [],
              { hour: "2-digit", minute: "2-digit" },
            ),
            date: new Date(event.message.created_at).toLocaleDateString([], {
              weekday: "long",
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
          };

          // Use a callback that gets current messages state to properly check for duplicates
          setMessages((prevMessages) => {
            // Check if this message ID already exists
            if (prevMessages.some((msg) => msg.id === newMsg.id)) {
              return prevMessages; // Don't add duplicates
            }
            return [...prevMessages, newMsg];
          });
        };

        // Register event handler
        channelObj.on("message.new", handleNewMessage);

        // If in tutor page, fetch tutor's saved resources
        if (isStudentsTutorPage && user?.uid) {
          const tutorDoc = await getDoc(doc(db, "tutors", user.uid));
          if (tutorDoc.exists()) {
            const tutorData = tutorDoc.data();
            const resources = tutorData.savedDocuments || [];
            setSavedResources(resources);
          }
        }
      } catch (error) {
        console.error("Error loading channel:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    initChannel();

    return () => {
      if (channel) {
        // Clean up event handler to prevent multiple listeners
        channel.off("message.new");
        channel.stopWatching().catch(console.error);
      }
    };
  }, [
    channelId,
    streamClient,
    type,
    user,
    isStudentsTutorPage,
    isMessagesUserPage,
  ]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !channel || isSending) return;
    setIsSending(true);
    try {
      await channel.sendMessage({
        text: inputMessage,
      });
      setInputMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleLeaveChat = async () => {
    try {
      setIsLoading(true);

      if (!user || !user.uid) {
        throw new Error("User not found");
      }

      const currentChannelId = channelId;
      const channelType = type || "messaging";

      if (channel) {
        await channel.stopWatching();
      }

      if (user.userType === "student") {
        await removeMemberFromStreamChannel({
          channelId: currentChannelId,
          userId: user.uid,
          type: channelType,
        });
      } else if (user.userType === "tutor") {
        await deleteStreamChannel({
          channelId: currentChannelId,
          type: channelType,
        });
      } else {
        throw new Error("Invalid user type");
      }

      if (onChannelLeave) {
        onChannelLeave(currentChannelId);
      }
    } catch (error) {
      console.error("Error leaving chat:", error);
    } finally {
      setIsLoading(false);
      setShowConfirmModal(false);
    }
  };
  const handleViewProfile = async () => {
    // For group chats, navigate to group details page
    if (type === "standard_group" || type === "premium_group") {
      // If user is a tutor and in the tutor interface, navigate to tutor group details
      if (user?.userType === "tutor" && isStudentsTutorPage) {
        navigate(`/group-details-tutor/${channelId}`);
      } else {
        navigate(`/groupDetailsUser/${channelId}`);
      }
      setShowDropdown(false);
      return;
    }

    if (!isStudentsTutorPage) {
      // Navigate to profile if not in students tutor page
      if (chatPartner && chatPartner.id) {
        navigate(`/tutor/${chatPartner.id}`);
      }
      return;
    }

    // For StudentsTutor page, show the profile modal
    try {
      setIsLoading(true);
      setShowDropdown(false); // Close dropdown immediately

      // Use getStudentFromChannel to get the correct student ID
      let studentId = null;
      if (isStudentsTutorPage && channel) {
        // getStudentFromChannel expects a channel with .state.members
        const getStudentFromChannel = (channel) => {
          const members = Object.values(channel.state?.members || {});
          const student = members.find((m) => m.user?.userType !== "tutor");
          return student && student.user ? student.user : null;
        };
        const student = getStudentFromChannel(channel);
        studentId = student?.id;
      }
      if (!studentId) {
        console.error("Student ID is missing");
        toast.error("Unable to view profile: user information missing");
        return;
      }
      const studentDoc = await getDoc(doc(db, "students", studentId));

      if (!studentDoc.exists()) {
        console.error("Student document doesn't exist for ID:", studentId);
        toast.error("Student profile not found");
        return;
      }

      const studentData = studentDoc.data();

      // Check if we have at least some basic data
      if (!studentData) {
        console.error("Student data is empty for ID:", studentId);
        toast.error("Student profile data is incomplete");
        return;
      }

      // Set the profile data and open modal
      setStudentProfile({
        ...studentData,
        id: studentId,
        // Provide defaults for essential fields
        name: studentData.name || "Student",
        photoUrl: studentData.photoUrl || null,
        country: studentData.country || "Not specified",
        nativeLanguage: studentData.nativeLanguage || "Not specified",
        learningLanguage: studentData.learningLanguage || "Not specified",
      });

      // Use a short timeout to ensure state is updated before showing modal
      setTimeout(() => {
        setShowProfileModal(true);
      }, 100);
    } catch (error) {
      console.error("Error fetching student profile:", error);
      toast.error("Error loading student profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignResources = () => {
    setShowAssignModal(true);
    setShowDropdown(false);
  };

  const toggleResource = (resource) => {
    setSelectedResources((prev) =>
      prev.some((res) => res.docId === resource.docId)
        ? prev.filter((res) => res.docId !== resource.docId)
        : [...prev, resource],
    );
  };

  const handleAssign = async () => {
    if (!chatPartner.id || selectedResources.length === 0) return;

    try {
      setIsLoading(true);
      const studentRef = doc(db, "students", chatPartner.id);

      for (const resource of selectedResources) {
        const documentWithTimestamp = {
          ...resource,
          createdAt: Timestamp.now(), // Use Timestamp.now() instead of serverTimestamp()
        };

        await updateDoc(studentRef, {
          savedDocuments: arrayUnion(documentWithTimestamp),
        });
      }

      setShowAssignModal(false);
      setSelectedResources([]);
      setSearchQuery("");
    } catch (error) {
      console.error("Error assigning resources:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredResources = savedResources.filter((resource) =>
    resource.documentName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (isLoading) {
    return (
      <div className="flex h-full min-h-64 w-full items-center justify-center">
        <ClipLoader color="#FFB800" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full min-h-64 w-full items-center justify-center">
        <div className="text-lg text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!channel && !isLoading) {
    return (
      <div className="flex h-full min-h-64 w-full items-center justify-center">
        <div className="text-lg text-gray-600">No channel selected</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen max-h-[calc(100vh-125px)] w-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white">
      {/* Header */}
      <div
        className="flex items-center justify-between border-b border-gray-200 px-6 py-4"
        style={{ background: "#F6F6F6" }}
      >
        <div className="flex items-center gap-3">
          {isOneToOne && chatPartner?.image && (
            <img
              src={chatPartner.image}
              alt={chatPartner.name}
              className="h-10 w-10 rounded-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/default-avatar.png";
              }}
            />
          )}
          <div className="flex flex-col gap-0">
            <h3 className="font-semibold text-gray-800">{name || "Chat"}</h3>
            {description && (
              <span className="block max-w-xs truncate text-xs text-gray-500">
                {description}
              </span>
            )}
          </div>
        </div>
        <div className="relative" ref={dropdownRef}>
          <button
            className="rounded-full p-2 transition-colors hover:bg-gray-200"
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={isLoading}
          >
            <svg
              width="40"
              height="41"
              viewBox="0 0 40 41"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect y="0.5" width="40" height="40" rx="20" fill="white" />
              <path
                d="M25.1666 16.4001C25.1666 17.2138 24.507 17.8734 23.6933 17.8734C22.8796 17.8734 22.22 17.2138 22.22 16.4001C22.22 15.5864 22.8796 14.9268 23.6933 14.9268C24.507 14.9268 25.1666 15.5864 25.1666 16.4001Z"
                fill="#292D32"
                stroke="#3D3D3D"
              />
              <path
                d="M16.3066 18.3734C17.3964 18.3734 18.2799 17.4899 18.2799 16.4001C18.2799 15.3102 17.3964 14.4268 16.3066 14.4268C15.2167 14.4268 14.3333 15.3102 14.3333 16.4001C14.3333 17.4899 15.2167 18.3734 16.3066 18.3734Z"
                fill="#292D32"
              />
              <path
                d="M23.6933 26.5731C24.7831 26.5731 25.6666 25.6896 25.6666 24.5998C25.6666 23.51 24.7831 22.6265 23.6933 22.6265C22.6035 22.6265 21.72 23.51 21.72 24.5998C21.72 25.6896 22.6035 26.5731 23.6933 26.5731Z"
                fill="#292D32"
              />
              <path
                d="M16.3066 26.5731C17.3964 26.5731 18.2799 25.6896 18.2799 24.5998C18.2799 23.51 17.3964 22.6265 16.3066 22.6265C15.2167 22.6265 14.3333 23.51 14.3333 24.5998C14.3333 25.6896 15.2167 26.5731 16.3066 26.5731Z"
                fill="#292D32"
              />
            </svg>
          </button>{" "}
          {showDropdown && (
            <div className="absolute right-0 z-10 mt-2 w-40 rounded-lg border border-gray-200 bg-white shadow-lg">
              {" "}
              <button
                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50"
                onClick={handleViewProfile}
              >
                {type === "standard_group" || type === "premium_group"
                  ? t("chat.dropdownOptions.viewGroup")
                  : t("chat.dropdownOptions.viewProfile")}
              </button>
              {isStudentsTutorPage && (
                <button
                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50"
                  onClick={handleAssignResources}
                >
                  {t("chat.dropdownOptions.assignResources")}
                </button>
              )}
              <button
                className="w-full px-4 py-2 text-left text-red-500 hover:bg-gray-50"
                onClick={() => {
                  setShowConfirmModal(true);
                  setShowDropdown(false);
                }}
                disabled={isLoading}
              >
                {user?.userType === "tutor"
                  ? t("chat.dropdownOptions.deleteChat")
                  : t("chat.dropdownOptions.leaveChat")}
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto bg-white p-4">
        <div className="flex flex-col gap-3">
          {/* Date separator logic */}
          {messages.map((message, idx) => {
            const prevMsg = messages[idx - 1];
            const currDate = new Date(message.date).toDateString();
            const prevDate = prevMsg
              ? new Date(prevMsg.date).toDateString()
              : null;
            let showDateSeparator = false;
            if (idx === 0 || currDate !== prevDate) showDateSeparator = true;
            // Date label logic
            let dateLabel = currDate;
            const today = new Date().toDateString();
            const yesterday = new Date(Date.now() - 86400000).toDateString();
            if (currDate === today) dateLabel = "Today";
            else if (currDate === yesterday) dateLabel = "Yesterday";
            if (isGroupChat && message.sender !== "self") {
            }
            // Get sender info for group chats
            let senderName = message.senderName || "Unknown";
            let senderImage = message.senderImage || null;
            return (
              <React.Fragment key={message.id}>
                {showDateSeparator && (
                  <div className="my-2 flex justify-center">
                    <span className="rounded-full bg-gray-200 px-3 py-1 text-xs text-gray-600">
                      {dateLabel}
                    </span>
                  </div>
                )}
                <div
                  className={`flex ${
                    message.sender === "self" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div className="max-w-[70%]">
                    {/* Group chat: show actual sender avatar above message */}
                    {isGroupChat && message.sender !== "self" && (
                      <div className="mb-1 flex items-center">
                        {senderImage && (
                          <img
                            src={senderImage}
                            alt={senderName}
                            className="mr-2 h-6 w-6 rounded-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "/default-avatar.png";
                            }}
                          />
                        )}
                        <span className="text-xs font-medium text-gray-700">
                          {senderName}
                        </span>
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        message.sender === "self"
                          ? "rounded-br-none bg-green-500 text-white"
                          : "rounded-bl-none bg-gray-100 text-gray-800"
                      }`}
                    >
                      {message.text}
                    </div>
                    <div className="mt-1 flex justify-end">
                      <span className="text-xs text-gray-500">
                        {message.timestamp}
                      </span>
                      {message.sender === "self" && (
                        <span className="ml-2 text-xs text-green-500">✓</span>
                      )}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="border-t border-gray-200 bg-white px-4 py-3">
        <form onSubmit={handleSendMessage} className="flex items-center">
          <div className="relative flex flex-1 items-center">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              className="w-full rounded-full border border-gray-200 px-4 py-3 pr-20 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
            <div className="absolute right-3 flex items-center space-x-2">
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                <img
                  src="/svgs/link-circle.svg"
                  alt="Attach link"
                  className="h-6 w-6"
                />
              </button>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                <img
                  src="/svgs/gallery.svg"
                  alt="Gallery"
                  className="h-6 w-6"
                />
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="ml-3 rounded-full bg-[#FFBF00] p-3 text-black hover:bg-yellow-500"
            disabled={!inputMessage.trim() || isSending}
          >
            <img src="/svgs/chat-send.svg" alt="Send" className="h-6 w-6" />
          </button>
        </form>
      </div>
      {/* Delete/Leave Chat Modal */}{" "}
      <Modal
        isOpen={showConfirmModal}
        onRequestClose={() => setShowConfirmModal(false)}
        className="z-50 mx-auto mt-40 max-w-sm rounded-3xl bg-white p-6 font-urbanist outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        style={{
          overlay: {
            zIndex: 60,
          },
          content: {
            border: "none",
            padding: "24px",
            maxWidth: "420px",
            position: "relative",
            zIndex: 61,
          },
        }}
      >
        <div className="text-center">
          <h2 className="mb-4 text-xl font-semibold">
            {t("chat.confirmDelete.title")}
          </h2>
          <div className="flex flex-row gap-2">
            <button
              className="w-full rounded-full border border-gray-300 py-2 font-medium hover:bg-gray-50"
              onClick={() => setShowConfirmModal(false)}
            >
              {t("chat.confirmDelete.cancel")}
            </button>
            <button
              className="w-full rounded-full border border-[#8b0000] bg-[#ff4d4d] py-2 font-medium text-black hover:bg-[#ff3333]"
              onClick={handleLeaveChat}
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : t("chat.confirmDelete.confirm")}
            </button>
          </div>
        </div>
      </Modal>
      {/* Student Profile Modal */}
      {/* Student Profile Modal */}
      {isStudentsTutorPage && (
        <Modal
          isOpen={showProfileModal}
          onRequestClose={() => setShowProfileModal(false)}
          className="z-50 mx-auto mt-20 max-w-md rounded-3xl bg-white p-0 outline-none"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          style={{
            overlay: {
              zIndex: 60,
            },
            content: {
              border: "none",
              padding: "0",
              maxWidth: "480px",
              position: "relative",
              zIndex: 61,
            },
          }}
        >
          {studentProfile ? (
            <div className="font-urbanist">
              <div className="flex items-center justify-between px-6 pt-6">
                <h2 className="text-2xl font-medium">
                  {t("chat.profile.title")}
                </h2>
                <div className="flex items-center justify-center">
                  <button
                    onClick={() => setShowProfileModal(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F6F6F6] hover:bg-gray-100"
                  >
                    <X className="text-[#3D3D3D]" />
                  </button>
                </div>
              </div>

              <div className="bg-green-50 p-4">
                <div className="flex flex-col items-center">
                  <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-green-500">
                    {studentProfile.photoUrl ? (
                      <img
                        src={studentProfile.photoUrl}
                        alt={studentProfile.name}
                        className="h-full w-full rounded-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/default-avatar.png";
                        }}
                      />
                    ) : (
                      <div className="text-4xl font-bold text-white">
                        {studentProfile.name?.charAt(0) || "S"}
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-bold">
                    {studentProfile.name || "Student"}
                  </h3>
                  <div className="mt-1 flex items-center">
                    <img
                      src="/svgs/location.svg"
                      alt="location"
                      className="mr-1 h-5 w-5"
                    />
                    <span className="text-sm">
                      From: {studentProfile.country || "Not specified"}
                    </span>
                  </div>
                  <div className="mt-4 grid w-full grid-cols-2 gap-16">
                    <div className="flex items-center">
                      <img
                        src="/svgs/language-circle.svg"
                        alt="language"
                        className="mr-1 h-5 w-5"
                      />
                      <span className="text-sm">
                        Native:{" "}
                        {studentProfile.nativeLanguage || "Not specified"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <img
                        src="/svgs/language-square.svg"
                        alt="language"
                        className="mr-1 h-5 w-5"
                      />
                      <span className="text-sm">
                        Learning:{" "}
                        {studentProfile.learningLanguage || "Not specified"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <h3 className="mb-3 text-lg font-semibold">
                  Your classes booked by this student
                </h3>

                {studentProfile.classes && studentProfile.classes.length > 0 ? (
                  <div className="space-y-3">
                    {studentProfile.classes.map((classItem, index) => (
                      <div
                        key={index}
                        className="rounded-lg border border-green-300 bg-[#f8fff9] p-3"
                      >
                        {/* Class details here */}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg bg-gray-50 py-4 text-center">
                    <p className="text-gray-500">No classes booked yet</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8">
              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-t-4 border-gray-200 border-t-blue-500"></div>
              <p>Loading student profile...</p>
            </div>
          )}
        </Modal>
      )}{" "}
      {/* Assign Resources Modal */}
      {isStudentsTutorPage && (
        <Modal
          isOpen={showAssignModal}
          onRequestClose={() => setShowAssignModal(false)}
          className="z-50 mx-auto mt-40 w-[350px] max-w-md rounded-3xl bg-white p-6 outline-none"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          style={{
            overlay: {
              zIndex: 60,
            },
            content: {
              border: "none",
              padding: "0",
              maxWidth: "480px",
              position: "relative",
              zIndex: 61,
            },
          }}
        >
          <div className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {t("chat.resources.assign")}
              </h2>
              <button
                onClick={() => setShowAssignModal(false)}
                className="rounded-full p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
              <input
                type="text"
                placeholder={t("chat.resources.searchPlaceholder")}
                className="w-full rounded-full border border-gray-200 py-2 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-green-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold">
                  {t("chat.resources.myResources")}
                </h3>
                <button
                  className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-600"
                  onClick={() => {
                    navigate("/savedRecourcesTutor");
                    setShowAssignModal(false);
                  }}
                >
                  + {t("chat.resources.newResource")}
                </button>
              </div>
              <div className="max-h-60 space-y-2 overflow-y-auto">
                {filteredResources.length > 0 ? (
                  filteredResources.map((resource) => (
                    <div
                      key={resource.docId}
                      className={`cursor-pointer rounded-lg border p-3 ${
                        selectedResources.some(
                          (res) => res.docId === resource.docId,
                        )
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 bg-yellow-50"
                      }`}
                      onClick={() => toggleResource(resource)}
                    >
                      <div className="flex items-center">
                        <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-md bg-yellow-200">
                          <img
                            src={
                              resource.documentType.toLowerCase() === "pdf"
                                ? "svgs/png-logo.svg"
                                : "/svgs/word-logo.svg"
                            }
                            alt={resource.documentType}
                            className="h-5 w-5"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">
                            {resource.documentName}
                          </h4>
                          <p className="text-xs text-gray-500">
                            Uploaded:{" "}
                            {resource.createdAt
                              ? new Date(
                                  resource.createdAt.seconds * 1000,
                                ).toLocaleDateString()
                              : "Recent"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center text-gray-500">
                    No resources found
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <button
                className="rounded-full border border-gray-300 px-6 py-2"
                onClick={() => setShowAssignModal(false)}
              >
                Cancel
              </button>
              <button
                className={`rounded-full px-6 py-2 ${
                  selectedResources.length > 0
                    ? "bg-green-500 text-white"
                    : "cursor-not-allowed bg-gray-200 text-gray-500"
                }`}
                disabled={selectedResources.length === 0}
                onClick={handleAssign}
              >
                Assign
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CustomChatComponent;
