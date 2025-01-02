import React, { useEffect, useState } from "react";
import {
  Chat,
  Channel,
  Window,
  useChannelStateContext,
  MessageList,
  MessageInput,
  Thread,
} from "stream-chat-react";
import { useAuth } from "../context/AuthContext";
import "stream-chat-react/dist/css/v2/index.css";
import { ClipLoader } from "react-spinners";

// Add custom styles to override Stream Chat default styling
const customStyles = `
  .str-chat__message-textarea-container {
    // border-color: #1a472a !important;
    padding: 0.1rem 0 !important;
    margin: 0.7rem 0.1rem !important;
  }
  
  // .str-chat__send-button {
  //   background-color: #FFBF00 !important;
  // }

  // .str-chat__send-button svg {
  //   fill: #000000 !important;
  // }

  // .str-chat__send-button:disabled {
  //   background-color: #FFBF00 !important;
  //   opacity: 0.7;
  // }

  .str-chat__send-button:disabled svg {
    fill: #000000 !important;
  }

  .str-chat__file-input-label {
    border-radius: 50% !important;
    padding: 2px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }

  .str-chat__file-input-label svg {
    width: 32px !important;
    height: 32px !important;
  }

  // .str-chat__message--me .str-chat__message-text {
  //   background-color: #90EE90 !important;
  //   border: 2px solid #1a472a !important;
  //   border-radius: 12px !important;
  // }

  // .str-chat__message--me .str-chat__message-text-inner {
  //   background: none !important;
  //   color: #1a472a !important;
  //   font-weight: 500 !important;
  // }
`;

const CustomChannelHeader = () => {
  const { channel } = useChannelStateContext();

  return (
    <div className="flex items-center px-6 py-4 bg-gray-100 border-b border-gray-200">
      <div className="flex-1 space-y-1">
        <div className="text-xl font-semibold text-[#3D3D3D]">
          {channel?.data?.name || "Untitled Channel"}
        </div>
        <div className="text-sm text-gray-500">
          <p className="text-sm text-gray-500 truncate">
            {channel.data.description
              ? channel.data.description.length > 40
                ? channel.data.description.slice(0, 40) + "..."
                : channel.data.description
              : "No description"}
          </p>{" "}
        </div>
      </div>
    </div>
  );
};

const ChatComponent = ({ channelId, type }) => {
  const { streamClient, user } = useAuth();
  const [channel, setChannel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initChannel = async () => {
      if (!channelId || !streamClient) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        if (!type) {
          throw new Error("Channel type is required");
        }

        const channel = streamClient.channel(type, channelId);
        await channel.watch();
        setChannel(channel);
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
        channel.stopWatching();
      }
    };
  }, [channelId, streamClient, type]);

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

  if (!channel || !streamClient) {
    return (
      <div className="flex items-center justify-center w-full h-full min-h-64">
        <div className="text-lg text-gray-600">No channel selected</div>
      </div>
    );
  }

  return (
    <>
      <style>{customStyles}</style>
      <div className="flex flex-col w-full h-screen max-h-[calc(100vh-145px)] overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <Chat client={streamClient}>
          <Channel channel={channel}>
            <Window>
              <div className="flex flex-col h-full">
                <CustomChannelHeader />
                <div className="flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  <MessageList />
                </div>
                <div className="flex-none border-t">
                  <MessageInput
                    focus
                    additionalTextareaProps={{
                      placeholder: "Type your message...",
                    }}
                  />
                </div>
              </div>
            </Window>
            <Thread />
          </Channel>
        </Chat>
      </div>
    </>
  );
};

export default ChatComponent;
