import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { TextInput } from "@mantine/core";
import { IoSearchOutline } from "react-icons/io5";
import { BsChatRight } from "react-icons/bs";

const initialConversations = [
  {
    id: 1,
    title: "Help me understand quadratic...",
    section: "Today",
    messages: [],
  },
  {
    id: 2,
    title: "What are the main theories of...",
    section: "Today",
    active: true,
    messages: [],
  },
  {
    id: 3,
    title: "The events that led to World W...",
    section: "Last week",
    messages: [],
  },
  // ...other conversations
];

function SuperTutor() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState(initialConversations);
  const [activeConversation, setActiveConversation] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const chatContainerRef = useRef(null);

  const handleSend = () => {
    if (newMessage.trim() === "") return;

    let updatedConversations;
    let currentConversation = activeConversation;

    // If no active conversation, start a new one and add the message
    if (!currentConversation) {
      currentConversation = {
        id: conversations.length + 1,
        title: "New Chat",
        section: "Today",
        messages: [{ text: newMessage, sender: "user" }],
      };
      updatedConversations = [currentConversation, ...conversations];
      setActiveConversation(currentConversation);
    } else {
      // If there's already an active conversation, add the message to it
      currentConversation = {
        ...currentConversation,
        messages: [
          ...currentConversation.messages,
          { text: newMessage, sender: "user" },
        ],
      };
      updatedConversations = conversations.map((conv) =>
        conv.id === currentConversation.id ? currentConversation : conv
      );
      setActiveConversation(currentConversation);
    }

    // Update conversations state and clear the new message input
    setConversations(updatedConversations);
    setNewMessage("");
  };

  const handleNewChat = () => {
    const newChat = {
      id: conversations.length + 1,
      title: "New Chat",
      section: "Today",
      messages: [{ text: "Hi, how can I assist you?", sender: "bot" }],
    };
    setConversations([newChat, ...conversations]);
    setActiveConversation(newChat);
  };

  const handleSelectChat = (conversation) => {
    setActiveConversation(conversation);
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [activeConversation?.messages]);
  return (
    <>
      <Navbar user={user} />
      <div className="flex h-[calc(100vh-88px)] pt-4">
        {/* Left Panel */}
        <div className="w-1/5 p-4 overflow-y-auto bg-[#f2f2f2] border-r border-gray-200">
          <div className="mb-4">
            <TextInput
              placeholder="Search Conversations"
              radius="md"
              size="lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftSection={
                <IoSearchOutline className="text-3xl text-green-500" />
              }
            />
          </div>
          {["Today", "Last week", "Last month"].map((section) => (
            <div key={section} className="mb-4">
              <h2 className="mb-2 text-xs font-semibold text-gray-500">
                {section}
              </h2>
              {filteredConversations
                .filter((conv) => conv.section === section)
                .map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectChat(conv)}
                    className={`flex items-center p-2 rounded-lg cursor-pointer ${
                      activeConversation?.id === conv.id
                        ? "bg-green-100 text-green-500"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <span className="mr-2 text-gray-500">
                      <BsChatRight />
                    </span>
                    <p className="truncate text-md">{conv.title}</p>
                  </div>
                ))}
            </div>
          ))}
          <button
            onClick={handleNewChat}
            className="fixed flex items-center justify-center w-10 h-10 text-lg text-white bg-green-400 rounded-full bottom-6 left-4 hover:bg-green-500"
          >
            +
          </button>
        </div>
        {/* Chat Area */}
        <div className="flex flex-col flex-1 p-4">
          <div
            className="flex-1 p-4 overflow-y-auto bg-white rounded-md"
            ref={chatContainerRef} // Attach the ref to the chat container
          >
            {activeConversation ? (
              activeConversation.messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex items-end ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  } mb-4`}
                >
                  {" "}
                  {message.sender === "bot" && (
                    <img
                      alt="Bot Avatar"
                      className="w-10 h-10 mr-2 rounded-full"
                      src="/images/smallOwl.png"
                    />
                  )}
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      message.sender === "user"
                        ? "bg-green-200 text-right"
                        : "bg-gray-200"
                    }`}
                  >
                    {message.text}
                  </div>
                  {message.sender === "user" && (
                    <img
                      src={user.photoUrl}
                      alt="User Avatar"
                      className="w-10 h-10 ml-2 rounded-full"
                    />
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">
                Select a conversation to start chatting
              </p>
            )}
          </div>
          <div className="flex mt-4">
            <input
              type="text"
              placeholder="Type here..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:border-green-400"
            />
            <button
              onClick={handleSend}
              className="px-4 py-2 text-white bg-green-400 rounded-r-lg hover:bg-green-500"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default SuperTutor;
