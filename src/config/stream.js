import { StreamChat } from "stream-chat";
import { StreamVideoClient } from "@stream-io/video-react-sdk";
import axios from "axios";

export const streamApiKey = process.env.REACT_APP_STREAM_API_KEY;
export const apiBaseUrl =
  process.env.REACT_APP_API_URL || "http://localhost:5000";

const DEBUG = process.env.NODE_ENV === "development";

export const streamClient = StreamChat.getInstance(streamApiKey, {
  timeout: 20000,
  axiosRequestConfig: {
    timeout: 20000,
  },
  enableInsights: true,
  enableWSFallback: true,
  retryInterval: 2000,
  maxRetries: 5,
});

export const streamVideoClient = new StreamVideoClient({
  apiKey: streamApiKey,
  logLevel: DEBUG ? "debug" : "error",
  options: {
    timeout: 20000,
    reconnectionDelay: 2000,
    maxReconnectionAttempts: 5,
  },
});

export const ChannelType = {
  STANDARD_GROUP: "standard_group",
  PREMIUM_GROUP: "premium_group",
  PREMIUM_INDIVIDUAL_CLASS: "premium_individual_class",
  ONE_TO_ONE_CHAT: "one_to_one_chat",
};

export const fetchChatToken = async (userId) => {
  try {
    if (!userId) {
      throw new Error("User ID is required to generate a token");
    }

    const response = await axios.post(
      `https://generatechattoken-3idvfneyra-uc.a.run.app`,
      {
        userId,
        userName:
          JSON.parse(sessionStorage.getItem("user") || "{}").name || "User",
        userImage:
          JSON.parse(sessionStorage.getItem("user") || "{}").photoUrl || "",
      }
    );

    if (!response.data?.token) {
      throw new Error("Invalid token response from server");
    }

    return response.data.token;
  } catch (error) {
    console.error("Failed to fetch Stream chat token:", error);
    throw new Error("Could not fetch authentication token for chat");
  }
};

export const fetchVideoToken = async (userId) => {
  try {
    if (!userId) {
      throw new Error("User ID is required to generate a token");
    }

    const response = await axios.post(
      `https://generatevideotoken-3idvfneyra-uc.a.run.app`,
      {
        userId,
      }
    );

    if (!response.data?.token) {
      throw new Error("Invalid token response from server");
    }

    return response.data.token;
  } catch (error) {
    console.error("Failed to fetch Stream video token:", error);
    throw new Error("Could not fetch authentication token for video");
  }
};

export const generateStreamToken = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required to generate a token");
  }

  try {
    return await fetchVideoToken(userId);
  } catch (error) {
    console.warn(
      "Failed to fetch token from backend, using dev token as fallback:",
      error
    );

    if (process.env.NODE_ENV === "development") {
      console.warn("⚠️ USING DEV TOKEN - NOT SECURE FOR PRODUCTION ⚠️");
      return streamClient.devToken(userId);
    } else {
      throw new Error("Token service unavailable. Please try again later.");
    }
  }
};

export const connectStreamVideoUser = async (user) => {
  if (!user || !user.uid) {
    console.error("Invalid user object for Stream connection", user);
    throw new Error("Invalid user object");
  }

  try {
    if (streamVideoClient.user?.id === user.uid) {
      return true;
    }

    const token = await fetchVideoToken(user.uid);

    await streamVideoClient.connectUser(
      {
        id: user.uid,
        name: user.name || "User",
        image: user.photoUrl || "",
        userType: user.userType || "guest",
        custom: {
          email: user.email || "",
        },
      },
      token
    );

    return true;
  } catch (error) {
    console.error("Failed to connect to Stream Video:", error);
    throw error;
  }
};

const streamConfig = {
  streamApiKey,
  streamClient,
  streamVideoClient,
  ChannelType,
  connectStreamVideoUser,
  generateStreamToken,
  fetchChatToken,
  fetchVideoToken,
};

export default streamConfig;
