import React, { useEffect, useState } from "react";
import {
  Chat,
  Channel,
  Window,
  ChannelHeader,
  MessageList,
  MessageInput,
  Thread,
} from "stream-chat-react";
import { useAuth } from "../context/AuthContext";
import "stream-chat-react/dist/css/v2/index.css";
import { ClipLoader } from "react-spinners";

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
    <div className="flex flex-col w-full h-screen max-h-[calc(100vh-145px)] overflow-hidden rounded-lg border border-gray-200 bg-white">
      <Chat client={streamClient}>
        <Channel channel={channel}>
          <Window>
            <div className="flex flex-col h-full">
              <div className="flex-none">
                <ChannelHeader />
              </div>
              <div className="flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <MessageList />
              </div>
              <div className="flex-none border-t border-gray-200">
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
  );
};

export default ChatComponent;
