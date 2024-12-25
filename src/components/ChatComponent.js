import React, { useEffect, useState } from "react";
import {
  Chat,
  Channel,
  Window,
  ChannelHeader,
  MessageList,
  MessageInput,
  Thread,
  ChannelList,
} from "stream-chat-react";
import { useAuth } from "../context/AuthContext";
import "stream-chat-react/dist/css/v2/index.css";

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

        // Ensure we have both the channelId and type
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

    // Cleanup function
    return () => {
      if (channel) {
        // Properly cleanup the channel subscription
        channel.stopWatching();
      }
    };
  }, [channelId, streamClient, type]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600">Loading channel...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!channel || !streamClient) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600">No channel selected</div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <Chat client={streamClient}>
        <Channel channel={channel}>
          <Window>
            <ChannelHeader />
            <MessageList />
            <MessageInput focus />
          </Window>
          <Thread />
        </Channel>
      </Chat>
    </div>
  );
};

export default ChatComponent;
