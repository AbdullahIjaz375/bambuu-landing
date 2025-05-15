import { StreamChat } from "stream-chat";
import { StreamVideoClient } from "@stream-io/video-react-sdk";
import axios from "axios";

export const streamApiKey = process.env.REACT_APP_STREAM_API_KEY;
export const apiBaseUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
export const videotokenUrl = process.env.REACT_APP_VIDEO_TOKEN_URL;
export const chattokenUrl = process.env.REACT_APP_CHAT_TOKEN_URL;

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

// Improved token fetching with better error handling
export const fetchChatToken = async (userId) => {
  try {
    if (!userId) {
      throw new Error("User ID is required to generate a token");
    }

    const userInfo = JSON.parse(sessionStorage.getItem("user") || "{}");
    
    const response = await axios.post(
      chattokenUrl,
      {
        userId,
        userName: userInfo.name || "User",
        userImage: userInfo.photoUrl || "",
      }, 
      {
        timeout: 10000, // Add timeout to prevent long hanging requests
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.data?.token) {
      console.error("Invalid token response:", response.data);
      throw new Error("Invalid token response from server");
    }

    return response.data.token;
  } catch (error) {
    console.error("Failed to fetch Stream chat token:", error);
    
    // More specific error messaging
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("Server returned error:", error.response.status, error.response.data);
      throw new Error(`Token service error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
    } else if (error.request) {
      // The request was made but no response was received
      console.error("No response from token server");
      throw new Error("Token service unavailable. Please check your connection and try again.");
    } else {
      // Something happened in setting up the request that triggered an Error
      throw new Error(`Token fetch error: ${error.message}`);
    }
  }
};

export const fetchVideoToken = async (userId) => {
  try {
    if (!userId) {
      throw new Error("User ID is required to generate a token");
    }

    const response = await axios.post(
      videotokenUrl,
      {
        userId,
      },
      {
        timeout: 10000, // Add timeout to prevent long hanging requests
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.data?.token) {
      console.error("Invalid video token response:", response.data);
      throw new Error("Invalid token response from server");
    }

    return response.data.token;
  } catch (error) {
    console.error("Failed to fetch Stream video token:", error);
    
    // More specific error messaging
    if (error.response) {
      console.error("Server returned error:", error.response.status, error.response.data);
      throw new Error(`Video token service error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
    } else if (error.request) {
      console.error("No response from video token server");
      throw new Error("Video token service unavailable. Please check your connection and try again.");
    } else {
      throw new Error(`Video token fetch error: ${error.message}`);
    }
  }
};

// Never use devToken in production - Important fix for your error
export const generateStreamToken = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required to generate a token");
  }

  // Always try to get a proper token first
  try {
    return await fetchVideoToken(userId);
  } catch (error) {
    console.warn("Failed to fetch token from backend:", error);

    // ONLY use devToken in development, NEVER in production
    if (process.env.NODE_ENV === "development") {
      console.warn("⚠️ USING DEV TOKEN - NOT SECURE FOR PRODUCTION ⚠️");
      
      // This is the line that causes your error in production
      // Only use it in development
      return streamClient.devToken(userId);
    } else {
      // In production, we must have a proper token
      throw new Error("Authentication service unavailable. Please try again later.");
    }
  }
};

// Improved user connection function
export const connectStreamUser = async (user) => {
  if (!user || !user.uid) {
    console.error("Invalid user object for Stream connection", user);
    throw new Error("Invalid user object");
  }

  try {
    // If already connected with this user, don't reconnect
    if (streamClient.userID === user.uid) {
      console.log("User already connected to Stream Chat");
      return true;
    }

    // Get a production token (not a dev token)
    const token = await fetchChatToken(user.uid);

    // Connect the user
    await streamClient.connectUser(
      {
        id: user.uid,
        name: user.name || "User",
        image: user.photoUrl || "",
        userType: user.userType || "guest",
      },
      token
    );

    console.log("User successfully connected to Stream Chat");
    return true;
  } catch (error) {
    console.error("Failed to connect to Stream Chat:", error);
    throw error;
  }
};

export const connectStreamVideoUser = async (user) => {
  if (!user || !user.uid) {
    console.error("Invalid user object for Stream Video connection", user);
    throw new Error("Invalid user object");
  }

  try {
    // If already connected with this user, don't reconnect
    if (streamVideoClient.user?.id === user.uid) {
      console.log("User already connected to Stream Video");
      return true;
    }

    // Get a production token (not a dev token)
    const token = await fetchVideoToken(user.uid);

    // Connect the user
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

    console.log("User successfully connected to Stream Video");
    return true;
  } catch (error) {
    console.error("Failed to connect to Stream Video:", error);
    throw error;
  }
};

// Disconnect function to clean up connections
export const disconnectStreamUser = async () => {
  try {
    await streamClient.disconnectUser();
    console.log("User disconnected from Stream Chat");
    return true;
  } catch (error) {
    console.error("Error disconnecting from Stream Chat:", error);
    return false;
  }
};

// Disconnect function for video
export const disconnectStreamVideoUser = async () => {
  try {
    await streamVideoClient.disconnectUser();
    console.log("User disconnected from Stream Video");
    return true;
  } catch (error) {
    console.error("Error disconnecting from Stream Video:", error);
    return false;
  }
};

const streamConfig = {
  streamApiKey,
  streamClient,
  streamVideoClient,
  ChannelType,
  connectStreamUser,
  connectStreamVideoUser,
  disconnectStreamUser,
  disconnectStreamVideoUser,
  generateStreamToken,
  fetchChatToken,
  fetchVideoToken,
  videotokenUrl,
  chattokenUrl,
};

export default streamConfig;