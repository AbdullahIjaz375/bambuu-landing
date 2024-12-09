import React, { useEffect, useRef, useState } from "react";
import { Search, ArrowLeft, RotateCw, Send, Ellipsis } from "lucide-react";
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
      {message ? (
        <p className="text-lg">{message}</p>
      ) : (
        <Ellipsis className="w-6 h-6 text-gray-600 animate-spin" />
      )}
    </div>
  </div>
);

const SuperTutorChat = () => {
  const [messages, setMessages] = useState([
    {
      text: "Hi, I'm your language SuperTutor. Here to help you practice your language conversation skills. Just tell me which language you want to practice and we can get started.",
      isBot: true,
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const generateGeminiResponse = async (userInput) => {
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    if (!apiKey) {
      console.error("Gemini API key not found");
      return "I'm sorry, I'm having trouble connecting right now. Please try again later.";
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are a helpful language tutor. Respond to: ${userInput}`,
                  },
                ],
              },
            ],
          }),
        }
      );

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      return "I apologize, but I'm having trouble responding right now. Please try again.";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    // Add user message
    const newMessages = [...messages, { text: inputText, isBot: false }];
    setMessages(newMessages);
    setInputText("");
    setIsLoading(true);

    // Get and add bot response
    const botResponse = await generateGeminiResponse(inputText);
    setMessages([...newMessages, { text: botResponse, isBot: true }]);
    setIsLoading(false);
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
        {isLoading && <ChatMessage isBot={true} />}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="mt-4">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message..."
            className="w-full px-4 py-3 pr-12 text-[#2c2c2c] bg-white border rounded-full focus:outline-none focus:border-green-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            className={`p-2 text-white bg-yellow-500 rounded-full ${
              isLoading
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-yellow-600"
            }`}
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
        </div>
        <SuperTutorChat />
      </div>
    </div>
  );
};

export default SuperTutorUser;
