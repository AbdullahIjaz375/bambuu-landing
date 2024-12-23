// src/config/stream.js
import { StreamChat } from "stream-chat";

export const streamApiKey = process.env.REACT_APP_STREAM_API_KEY;
export const streamClient = StreamChat.getInstance(streamApiKey);

export const ChannelType = {
  STUDENT_GROUP_CLASS: "student_group_class",
  PREMIUM_GROUP_CLASS: "premium_group_class",
  PREMIUM_INDIVIDUAL_CLASS: "premium_individual_class",
  ONE_TO_ONE_CHAT: "one_to_one_chat",
};
