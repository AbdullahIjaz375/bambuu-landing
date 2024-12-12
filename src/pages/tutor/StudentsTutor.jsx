import React, { useState } from "react";
import { Search, Bell, MoreVertical, Smile, Send, User } from "lucide-react";

import { useAuth } from "../../context/AuthContext";

import Sidebar from "../../components/Sidebar";

const StudentsTutor = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("bammbuuu");
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState({});

  const instructors = [
    {
      id: 1,
      name: "Esther Howard",
      message: "Hello! How can I help you today?",
      time: "10:20",
      online: true,
    },
    {
      id: 2,
      name: "Brandon Arcand",
      message: "Let's practice conversation!",
      time: "10:20",
      online: true,
    },
    {
      id: 3,
      name: "Zain Press",
      message: "Great progress in today's lesson!",
      time: "10:20",
      online: false,
    },
    {
      id: 4,
      name: "Roger Calzoni",
      message: "Don't forget to review the materials",
      time: "10:20",
      online: false,
    },
  ];

  // Initialize dummy messages for each chat
  const initializeMessages = (chatId) => {
    if (!messages[chatId]) {
      setMessages((prev) => ({
        ...prev,
        [chatId]: [
          {
            id: 1,
            sender: "other",
            text: "Welcome to the chat!",
            time: "10:00",
          },
          {
            id: 2,
            sender: "other",
            text: "How can we help you today?",
            time: "10:01",
          },
          {
            id: 3,
            sender: "user",
            text: "Thanks for having me here!",
            time: "10:02",
          },
        ],
      }));
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedChat) return;

    const newMessage = {
      id: Date.now(),
      sender: "user",
      text: messageInput,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => ({
      ...prev,
      [selectedChat.id]: [...(prev[selectedChat.id] || []), newMessage],
    }));

    setMessageInput("");

    // Simulate response after 1 second
    setTimeout(() => {
      const response = {
        id: Date.now() + 1,
        sender: "other",
        text: `Response to: ${messageInput}`,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => ({
        ...prev,
        [selectedChat.id]: [...(prev[selectedChat.id] || []), response],
      }));
    }, 1000);
  };

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    initializeMessages(chat.id);
  };

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar user={user} />

      <div className="flex-1 px-8 pt-8 pb-4 bg-white border-2 border-[#e7e7e7] rounded-3xl ml-[17rem] m-2">
        <div className="flex items-center justify-between pb-4 mb-6 border-b">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-semibold">Students</h1>
          </div>
          <button className=" rounded-full hover:bg-gray-100 border border-[#ffbf00] p-2">
            <Bell className="w-6 h-6" />
          </button>
        </div>{" "}
        <div className="flex gap-6 h-[calc(100vh-155px)]">
          {/* Left Panel */}
          <div className="p-4 bg-[#f6f6f6] w-96 rounded-2xl overflow-hidden flex flex-col">
            <div className="relative mb-4">
              <Search className="absolute w-5 h-5 text-[#5d5d5d] left-3 top-3" />
              <input
                type="text"
                placeholder="Search student"
                className="w-full py-2 pl-10 pr-4 bg-gray-100 border border-[#d1d1d1] rounded-full"
              />
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto">
              {instructors.map((instructor) => (
                <div
                  key={instructor.id}
                  className={`flex items-center gap-3 p-3 border  border-[#22bf37] cursor-pointer rounded-3xl ${
                    selectedChat?.id === instructor.id ? "bg-[#f0fdf1]" : ""
                  }`}
                  onClick={() => handleChatSelect(instructor)}
                >
                  <div className="relative">
                    <div className="w-12 h-12 bg-gray-200 rounded-full" />
                    {instructor.online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h3 className="font-semibold">{instructor.name}</h3>
                      <span className="text-xs text-gray-500">
                        {instructor.time}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {instructor.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel - Chat Area */}
          <div className="flex flex-col flex-1 h-full bg-white border rounded-2xl ">
            {selectedChat ? (
              <>
                <div className="flex items-center justify-between bg-[#f6f6f6] p-4 rounded-t-2xl">
                  <div>
                    <h2 className="text-xl font-semibold">
                      {selectedChat.name}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {activeTab === "group" ? "Group Chat" : "Instructor Chat"}
                    </p>
                  </div>
                  <button className="p-2 rounded-full hover:bg-gray-200">
                    <MoreVertical className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex-1 p-4 space-y-4 overflow-y-auto scrollbar-hide">
                  {messages[selectedChat.id]?.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                          message.sender === "user"
                            ? "bg-green-500 text-white"
                            : "bg-gray-100"
                        }`}
                      >
                        <p>{message.text}</p>
                        <span className="text-xs opacity-70">
                          {message.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendMessage} className="p-4 border-t">
                  <div className="flex items-center gap-2 p-2 border rounded-full bg-gray-50">
                    <button
                      type="button"
                      className="p-2 rounded-full hover:bg-gray-200"
                    >
                      <Smile className="w-6 h-6 text-gray-400" />
                    </button>
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 bg-transparent outline-none"
                    />
                    <button
                      type="submit"
                      className="p-2 bg-yellow-400 rounded-full hover:bg-yellow-500"
                      disabled={!messageInput.trim()}
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="flex items-center justify-center w-16 h-16 mb-4 bg-yellow-100 rounded-full">
                  <span className="text-2xl">ℹ️</span>
                </div>
                <p>Select a chat to start messaging!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentsTutor;
