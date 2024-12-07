import React, { useEffect, useState } from "react";
import { Search, ArrowLeft, RotateCw, Send } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

import Sidebar from "../../components/Sidebar";

const ChatMessage = ({ message, isBot }) => (
  <div className={`flex ${isBot ? "justify-start" : "justify-end"} mb-4`}>
    <div
      className={`max-w-[80%] p-3 ${
        isBot
          ? "bg-gray-100 text-[#2c2c2c] border rounded-tr-2xl rounded-bl-2xl rounded-br-2xl"
          : "bg-[#14b82c] text-white border border-[#14561d] rounded-tl-2xl rounded-bl-2xl rounded-br-2xl"
      }`}
    >
      <p className="text-lg">{message}</p>
    </div>
  </div>
);

const SuperTutorChat = () => {
  const [messages, setMessages] = useState([
    {
      text: "Hi, I'm your language SuperTutor. Here to help you practice your language conversation skills. Just tell me which language you want to practice and we can get started.",
      isBot: true,
    },
    {
      text: "English",
      isBot: false,
    },
    {
      text: "Nice! Are there any specific areas you're finding difficult, like grammar or pronunciation?",
      isBot: true,
    },
    {
      text: "Hi, I'm your language SuperTutor. Here to help you practice your language conversation skills. Just tell me which language you want to practice and we can get started.",
      isBot: true,
    },
    {
      text: "English",
      isBot: false,
    },
    {
      text: "Nice! Are there any specific areas you're finding difficult, like grammar or pronunciation?",
      isBot: true,
    },
    {
      text: "Hi, I'm your language SuperTutor. Here to help you practice your language conversation skills. Just tell me which language you want to practice and we can get started.",
      isBot: true,
    },
    {
      text: "English",
      isBot: false,
    },
    {
      text: "Nice! Are there any specific areas you're finding difficult, like grammar or pronunciation?",
      isBot: true,
    },
    {
      text: "Hi, I'm your language SuperTutor. Here to help you practice your language conversation skills. Just tell me which language you want to practice and we can get started.",
      isBot: true,
    },
    {
      text: "English",
      isBot: false,
    },
    {
      text: "Nice! Are there any specific areas you're finding difficult, like grammar or pronunciation?",
      isBot: true,
    },
  ]);
  const [inputText, setInputText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setMessages([...messages, { text: inputText, isBot: false }]);
    setInputText("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)]">
      <div className="flex-1 px-4 overflow-y-auto scrollbar-hide">
        {messages.map((message, index) => (
          <ChatMessage
            key={index}
            message={message.text}
            isBot={message.isBot}
          />
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 ">
        <div className="flex items-center space-x-2 ">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message..."
            className="w-full px-4 py-3 pr-12 text-[#2c2c2c] bg-white border rounded-full focus:outline-none focus:border-green-500"
          />
          <button
            type="submit"
            className="p-2 text-white bg-yellow-500 rounded-full hover:bg-yellow-600"
          >
            <Send size={24} className="text-black" />
          </button>
        </div>
      </form>
    </div>
  );
};

const SuperTutorUser = () => {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar user={user} />

      <div className="flex-1 p-8 bg-white border-2 border-[#e7e7e7] rounded-3xl ml-[17rem] m-2">
        <div className="flex items-center justify-between pb-4 mb-6 border-b">
          <div className="flex items-center gap-4">
            <img
              alt="supertutor"
              src="/images/panda.png"
              className="w-auto h-auto"
            />
            <h1 className="text-4xl font-semibold">Super Tutor</h1>
          </div>
          <button className="p-3 text-xl font-medium text-black bg-gray-100 rounded-full">
            <RotateCw />
          </button>
        </div>{" "}
        <SuperTutorChat />
      </div>
    </div>
  );
};

export default SuperTutorUser;
