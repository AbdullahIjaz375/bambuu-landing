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

const ChatComponent = ({ channelId }) => {
  const { streamClient, user } = useAuth();
  const [channel, setChannel] = useState(null);

  useEffect(() => {
    const initChannel = async () => {
      if (!channelId || !streamClient) return;

      try {
        const channel = streamClient.channel("student_group_class", channelId);
        await channel.watch();
        setChannel(channel);
      } catch (error) {
        console.error("Error loading channel:", error);
      }
    };

    initChannel();
  }, [channelId, streamClient]);

  if (!channel) return <div>Loading...</div>;

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
