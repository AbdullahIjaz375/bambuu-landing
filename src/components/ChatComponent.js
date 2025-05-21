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

const CustomChatComponent = ({ channelId, type, onChannelLeave, chatInfo }) => {
  const { user, streamClient } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isStudentsTutorPage = location.pathname.includes("/studentsTutor");
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

  const dropdownRef = useRef(null);
  const messagesEndRef = useRef(null);

  const chatPartner = chatInfo || {
    id: "",
    name: "",
    online: false,
    image: "",
  };

  useEffect(() => {
    if (streamClient?.disconnected && user) {
      streamClient.connectUser(
        { id: user.uid },
        streamClient.devToken(user.uid)
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
        const channelMessages = state.messages || [];

        const formattedMessages = channelMessages.map((msg) => ({
          id: msg.id,
          text: msg.text,
          sender: msg.user.id === user.uid ? "self" : "other",
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
              { hour: "2-digit", minute: "2-digit" }
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
  }, [channelId, streamClient, type, user, isStudentsTutorPage]);

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
    if (!inputMessage.trim() || !channel) return;

    try {
      await channel.sendMessage({
        text: inputMessage,
      });

      setInputMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
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

      if (!chatPartner || !chatPartner.id) {
        console.error("Chat partner ID is missing");
        toast.error("Unable to view profile: user information missing");
        return;
      }

      const studentDoc = await getDoc(doc(db, "students", chatPartner.id));

      if (!studentDoc.exists()) {
        console.error("Student document doesn't exist for ID:", chatPartner.id);
        toast.error("Student profile not found");
        return;
      }

      const studentData = studentDoc.data();

      // Check if we have at least some basic data
      if (!studentData) {
        console.error("Student data is empty for ID:", chatPartner.id);
        toast.error("Student profile data is incomplete");
        return;
      }

      // Set the profile data and open modal
      setStudentProfile({
        ...studentData,
        id: chatPartner.id,
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
        : [...prev, resource]
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
    resource.documentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-full min-h-64">
        <ClipLoader color="#FFB800" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-full min-h-64">
        <div className="text-lg text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!channel && !isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-full min-h-64">
        <div className="text-lg text-gray-600">No channel selected</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-screen max-h-[calc(100vh-125px)] overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 overflow-hidden bg-purple-100 rounded-full">
            {chatPartner.image ? (
              <img
                src={chatPartner.image}
                alt={chatPartner.name || "User"}
                className="object-cover w-full h-full"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/default-avatar.png";
                }}
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full text-gray-500 bg-gray-200"></div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">
              {chatPartner.name || "User"}
            </h3>
            <span className="text-xs text-gray-500">
              {chatPartner.online ? "Online" : "Offline"}
            </span>
          </div>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            className="p-2 transition-colors rounded-full hover:bg-gray-200"
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
            <div className="absolute right-0 z-10 w-40 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
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
      <div className="flex-1 p-4 overflow-y-auto bg-white">
        <div className="flex flex-col gap-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === "self" ? "justify-end" : "justify-start"
              }`}
            >
              <div className="max-w-[70%]">
                <div
                  className={`px-4 py-2 rounded-2xl ${
                    message.sender === "self"
                      ? "bg-green-500 text-white rounded-br-none"
                      : "bg-gray-100 text-gray-800 rounded-bl-none"
                  }`}
                >
                  {message.text}
                </div>
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-gray-500">{message.date}</span>
                  {message.sender === "self" && (
                    <span className="ml-2 text-xs text-green-500">✓</span>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="px-4 py-3 bg-white border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex items-center">
          <div className="relative flex items-center flex-1">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              className="w-full px-4 py-3 pr-20 border border-gray-200 rounded-full focus:outline-none focus:ring-1 focus:ring-green-500"
            />
            <div className="absolute right-3 flex items-center space-x-2">
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z"
                    stroke="#6D6D6D"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 10C10.1046 10 11 9.10457 11 8C11 6.89543 10.1046 6 9 6C7.89543 6 7 6.89543 7 8C7 9.10457 7.89543 10 9 10Z"
                    stroke="#6D6D6D"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2.67004 18.9501L7.60004 15.6401C8.39004 15.1101 9.53004 15.1701 10.24 15.7801L10.57 16.0701C11.35 16.7401 12.61 16.7401 13.39 16.0701L17.55 12.5001C18.33 11.8301 19.59 11.8301 20.37 12.5001L22 13.9001"
                    stroke="#6D6D6D"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600"
              >
                <Smile className="w-5 h-5" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="p-3 ml-3 text-black bg-[#FFBF00] rounded-full hover:bg-yellow-500"
            disabled={!inputMessage.trim()}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M16.2982 3.43438L16.2978 3.43454L7.2687 6.43423C7.26857 6.43427 7.26843 6.43432 7.2683 6.43436C5.783 6.93113 4.70809 7.49414 4.01435 8.06773C3.31885 8.64278 3.05762 9.18205 3.05762 9.64379C3.05762 10.1054 3.3187 10.644 4.01397 11.2177C4.70757 11.79 5.78238 12.3512 7.2677 12.8455L16.2982 3.43438ZM16.2982 3.43438C18.2462 2.78505 19.5701 3.04994 20.2626 3.74335C20.9555 4.43727 21.22 5.76424 20.5757 7.71222C20.5756 7.71248 20.5755 7.71273 20.5754 7.71298L17.5658 16.7318L17.5657 16.7322M16.2982 3.43438L17.5657 16.7322M17.5657 16.7322C17.0714 18.2175 16.5096 19.2923 15.9365 19.986M17.5657 16.7322L15.9365 19.986M15.9365 19.986C15.3621 20.6812 14.8226 20.9425 14.3601 20.9425M15.9365 19.986L14.3601 20.9425M14.3601 20.9425C13.8976 20.9425 13.3581 20.6812 12.7837 19.986M14.3601 20.9425L12.7837 19.986M12.7837 19.986C12.2107 19.2924 11.6489 18.2176 11.1546 16.7325L12.7837 19.986ZM9.9477 13.7355L7.268 12.8456L11.1545 16.7322L10.2646 14.0525L10.1856 13.8145L9.9477 13.7355ZM13.0137 12.5136L13.0146 12.5127L16.8137 8.6936C16.8138 8.69346 16.814 8.69332 16.8141 8.69318C17.2989 8.20787 17.2988 7.41161 16.8137 6.92649C16.3284 6.44123 15.5318 6.44123 15.0466 6.92649L15.0456 6.92742L11.2466 10.7465C11.2465 10.7466 11.2464 10.7466 11.2464 10.7467C10.7613 11.232 10.7614 12.0284 11.2466 12.5136C11.4953 12.7623 11.8147 12.88 12.1301 12.88C12.4456 12.88 12.765 12.7623 13.0137 12.5136Z"
                fill="black"
                stroke="black"
              />
            </svg>
          </button>
        </form>
      </div>
      {/* Delete/Leave Chat Modal */}{" "}
      <Modal
        isOpen={showConfirmModal}
        onRequestClose={() => setShowConfirmModal(false)}
        className="z-50 max-w-sm p-6 mx-auto mt-40 bg-white outline-none rounded-3xl font-urbanist"
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
              className="w-full py-2 font-medium border border-gray-300 rounded-full hover:bg-gray-50"
              onClick={() => setShowConfirmModal(false)}
            >
              {t("chat.confirmDelete.cancel")}
            </button>
            <button
              className="w-full py-2 font-medium text-black bg-[#ff4d4d] rounded-full hover:bg-[#ff3333] border border-[#8b0000]"
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
          className="z-50 max-w-lg p-6 mx-auto mt-40 bg-white outline-none rounded-3xl"
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
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-2xl font-bold">
                  {t("chat.profile.title")}
                </h2>
                <div className="flex items-center">
                  <div className="flex items-center bg-blue-100 rounded-full px-2 py-1 mr-2">
                    <span className="text-blue-500 font-medium text-sm">B</span>
                  </div>
                  <button
                    onClick={() => setShowProfileModal(false)}
                    className="p-1 rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-4 bg-green-50">
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 bg-green-500 rounded-full mb-2 flex items-center justify-center">
                    {studentProfile.photoUrl ? (
                      <img
                        src={studentProfile.photoUrl}
                        alt={studentProfile.name}
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/default-avatar.png";
                        }}
                      />
                    ) : (
                      <div className="text-white text-4xl font-bold">
                        {studentProfile.name?.charAt(0) || "S"}
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-bold">
                    {studentProfile.name || "Student"}
                  </h3>
                  <div className="flex items-center mt-1">
                    <svg
                      className="w-5 h-5 mr-1"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z"
                        stroke="black"
                        strokeWidth="1.5"
                        strokeMiterlimit="10"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M13.75 12C13.75 12.97 12.97 13.75 12 13.75C11.03 13.75 10.25 12.97 10.25 12V7C10.25 6.59 10.59 6.25 11 6.25H12C12.97 6.25 13.75 7.03 13.75 8V12Z"
                        stroke="black"
                        strokeWidth="1.5"
                        strokeMiterlimit="10"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M10.25 4V2.75"
                        stroke="black"
                        strokeWidth="1.5"
                        strokeMiterlimit="10"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M13.75 4V2.75"
                        stroke="black"
                        strokeWidth="1.5"
                        strokeMiterlimit="10"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M10.25 12V17"
                        stroke="black"
                        strokeWidth="1.5"
                        strokeMiterlimit="10"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M13.75 12V17"
                        stroke="black"
                        strokeWidth="1.5"
                        strokeMiterlimit="10"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="text-sm">
                      From: {studentProfile.country || "Not specified"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-16 mt-4 w-full">
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 mr-1"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M22 10V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22H11"
                          stroke="black"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M15.5 18.5C16.6 18.5 17.5 17.6 17.5 16.5C17.5 15.4 16.6 14.5 15.5 14.5C14.4 14.5 13.5 15.4 13.5 16.5C13.5 17.6 14.4 18.5 15.5 18.5Z"
                          stroke="black"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M20.5 21.5C21.6 21.5 22.5 20.6 22.5 19.5C22.5 18.4 21.6 17.5 20.5 17.5C19.4 17.5 18.5 18.4 18.5 19.5C18.5 20.6 19.4 21.5 20.5 21.5Z"
                          stroke="black"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M22.5 16.5L18.5 14.5"
                          stroke="black"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M13.5 18.5L17.5 20.5"
                          stroke="black"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="text-sm">
                        Native:{" "}
                        {studentProfile.nativeLanguage || "Not specified"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 mr-1"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12.37 2.15009L21.37 5.75006C21.72 5.89006 22 6.31006 22 6.68006V10.0001"
                          stroke="black"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M12.37 2.15009L3.37 5.75006C3.02 5.89006 2.75 6.31006 2.75 6.68006V16.2501C2.75 16.7401 3.13 17.2801 3.57 17.4701L11.57 21.1001C11.84 21.2201 12.3 21.2201 12.57 21.1001L20.57 17.4701C21.01 17.2801 21.39 16.7401 21.39 16.2501"
                          stroke="black"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M8.93 10.8301L15.53 7.48009"
                          stroke="black"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M8.93 14.1801L15.53 10.8301"
                          stroke="black"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M8.93 17.5298L15.53 14.1798"
                          stroke="black"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="text-sm">
                        Learning:{" "}
                        {studentProfile.learningLanguage || "Not specified"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-lg font-semibold mb-3">
                  Your classes booked by this student
                </h3>

                {studentProfile.classes && studentProfile.classes.length > 0 ? (
                  <div className="space-y-3">
                    {studentProfile.classes.map((classItem, index) => (
                      <div
                        key={index}
                        className="border border-green-300 rounded-lg p-3 bg-[#f8fff9]"
                      >
                        {/* Class details here */}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No classes booked yet</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8">
              <div className="w-12 h-12 border-4 border-t-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
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
          className="z-50  w-[350px]  max-w-md p-6 mx-auto mt-40 bg-white outline-none rounded-3xl"
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {t("chat.resources.assign")}
              </h2>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-1 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative mb-4">
              <Search className="absolute w-5 h-5 text-gray-400 left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder={t("chat.resources.searchPlaceholder")}
                className="w-full py-2 pl-10 pr-4 border border-gray-200 rounded-full focus:outline-none focus:ring-1 focus:ring-green-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">
                  {t("chat.resources.myResources")}
                </h3>
                <button
                  className="text-sm text-green-600 bg-green-100 rounded-full px-3 py-1"
                  onClick={() => {
                    navigate("/savedRecourcesTutor");
                    setShowAssignModal(false);
                  }}
                >
                  + {t("chat.resources.newResource")}
                </button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredResources.length > 0 ? (
                  filteredResources.map((resource) => (
                    <div
                      key={resource.docId}
                      className={`p-3 rounded-lg border cursor-pointer ${
                        selectedResources.some(
                          (res) => res.docId === resource.docId
                        )
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 bg-yellow-50"
                      }`}
                      onClick={() => toggleResource(resource)}
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 flex items-center justify-center bg-yellow-200 rounded-md mr-2">
                          <img
                            src={
                              resource.documentType.toLowerCase() === "pdf"
                                ? "svgs/png-logo.svg"
                                : "/svgs/word-logo.svg"
                            }
                            alt={resource.documentType}
                            className="w-5 h-5"
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
                                  resource.createdAt.seconds * 1000
                                ).toLocaleDateString()
                              : "Recent"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No resources found
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <button
                className="px-6 py-2 border border-gray-300 rounded-full"
                onClick={() => setShowAssignModal(false)}
              >
                Cancel
              </button>
              <button
                className={`px-6 py-2 rounded-full ${
                  selectedResources.length > 0
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
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
