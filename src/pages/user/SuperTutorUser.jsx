import React, { useEffect, useRef, useState } from "react";
import { Search, ArrowLeft, RotateCw, Send, Ellipsis } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../../components/Sidebar";
import { Tooltip } from "react-tooltip";

const ChatMessage = ({ message, isBot }) => (
  <div className={`flex ${isBot ? "justify-start" : "justify-end"} mb-4`}>
    <div
      className={`max-w-[80%] p-3 ${
        isBot
          ? "rounded-bl-2xl rounded-br-2xl rounded-tr-2xl border bg-gray-100 text-[#2c2c2c]"
          : "rounded-bl-2xl rounded-br-2xl rounded-tl-2xl border border-[#14561d] bg-[#14b82c] text-white"
      }`}
    >
      {message ? (
        <p className="text-lg">{message}</p>
      ) : (
        <Ellipsis className="h-6 w-6 animate-spin text-gray-600" />
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
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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
        },
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
    <div className="flex h-[calc(100vh-180px)] flex-col">
      <div className="scrollbar-hide flex-1 overflow-y-auto px-4">
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
            className="w-full rounded-full border bg-white px-4 py-3 pr-12 text-[#2c2c2c] focus:border-green-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isLoading}
            className={`rounded-full bg-yellow-500 p-2 text-white ${
              isLoading
                ? "cursor-not-allowed opacity-50"
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
    <>
      <Tooltip />

      <div className="flex h-screen bg-white">
        <div className="h-full w-[272px] flex-shrink-0 p-4">
          <Sidebar user={user} />
        </div>
        <div className="min-w-[calc(100% - 272px)] h-[calc(100vh-0px)] flex-1 overflow-x-auto p-4 pl-0">
          <div className="h-[calc(100vh-32px)] overflow-y-auto rounded-3xl border border-[#e7e7e7] bg-white p-[16px]">
            <div className="mb-6 flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2">
                <img
                  alt="supertutor"
                  src="/svgs/supertutor-panda.svg"
                  className="h-auto w-auto"
                />
                <h1 className="ml-1 text-4xl font-semibold">Super Tutor</h1>

                <div className="flex flex-col items-center gap-4">
                  <img
                    alt="supertutor"
                    src="/svgs/info-circle.svg"
                    className="w-6"
                    data-tooltip-id="image-tooltip"
                    data-tooltip-place="right" // or "bottom", "left", "right"
                    data-tooltip-content="LLM models, including bammbuu, can sometimes provide inaccurate or incomplete information."
                  />
                  <Tooltip id="image-tooltip" />
                </div>
              </div>
              <button className="rounded-full bg-gray-100 p-3 text-xl font-medium text-black">
                <RotateCw />
              </button>
            </div>
            <SuperTutorChat />
          </div>{" "}
        </div>
      </div>
    </>
  );
};

export default SuperTutorUser;
