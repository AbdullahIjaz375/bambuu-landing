// src/config/stream.js
import { StreamChat } from "stream-chat";

export const streamApiKey = process.env.REACT_APP_STREAM_API_KEY;
export const streamClient = StreamChat.getInstance(streamApiKey, {
  timeout: 20000,
  axiosRequestConfig: {
    timeout: 20000,
  },
});

export const ChannelType = {
  STANDARD_GROUP: "standard_group",
  PREMIUM_GROUP: "premium_group",
  PREMIUM_INDIVIDUAL_CLASS: "premium_individual_class",
  ONE_TO_ONE_CHAT: "one_to_one_chat",
};
