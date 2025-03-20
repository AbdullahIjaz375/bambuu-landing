// src/config/stream.js
import { StreamChat } from "stream-chat";
import { StreamVideoClient } from "@stream-io/video-react-sdk";
import axios from "axios";

// Get API key from environment variables
export const streamApiKey = process.env.REACT_APP_STREAM_API_KEY;
export const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Enable debugging in development environment
const DEBUG = process.env.NODE_ENV === 'development';

// Initialize Stream Chat client with improved configuration
export const streamClient = StreamChat.getInstance(streamApiKey, {
  timeout: 20000,
  axiosRequestConfig: {
    timeout: 20000,
  },
  // Add additional reliability options
  enableInsights: true,
  enableWSFallback: true,
  retryInterval: 2000,
  maxRetries: 5,
});

// Initialize Stream Video client with improved configuration
export const streamVideoClient = new StreamVideoClient({
  apiKey: streamApiKey,
  // Add additional configuration for better reliability
  logLevel: DEBUG ? 'debug' : 'error',
  options: {
    timeout: 20000,
    reconnectionDelay: 2000,
    maxReconnectionAttempts: 5
  }
});

// Define Channel Types
export const ChannelType = {
  STANDARD_GROUP: "standard_group",
  PREMIUM_GROUP: "premium_group",
  PREMIUM_INDIVIDUAL_CLASS: "premium_individual_class",
  ONE_TO_ONE_CHAT: "one_to_one_chat",
};

// Token fetching functions using the backend endpoint
export const fetchChatToken = async (userId) => {
  try {
    if (!userId) {
      throw new Error("User ID is required to generate a token");
    }
    
    const response = await axios.post(`${apiBaseUrl}/api/chat-token`, {
      userId,
      userName: JSON.parse(sessionStorage.getItem("user") || "{}").name || "User",
      userImage: JSON.parse(sessionStorage.getItem("user") || "{}").photoUrl || "",
    });
    
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
    
    const response = await axios.post(`${apiBaseUrl}/api/video-token`, {
      userId,
    });
    
    if (!response.data?.token) {
      throw new Error("Invalid token response from server");
    }
    
    return response.data.token;
  } catch (error) {
    console.error("Failed to fetch Stream video token:", error);
    throw new Error("Could not fetch authentication token for video");
  }
};

// Generate a token for Stream Video (FOR BACKWARD COMPATIBILITY ONLY)
// This fallback should only be used if the backend token service is unavailable
export const generateStreamToken = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required to generate a token");
  }

  try {
    // Try to get a real token from the backend first
    return await fetchVideoToken(userId);
  } catch (error) {
    console.warn("Failed to fetch token from backend, using dev token as fallback:", error);
    
    // Fallback to dev token only if in development mode
    if (process.env.NODE_ENV === 'development') {
      console.warn("⚠️ USING DEV TOKEN - NOT SECURE FOR PRODUCTION ⚠️");
      return streamClient.devToken(userId);
    } else {
      // In production, we should never use dev tokens
      throw new Error("Token service unavailable. Please try again later.");
    }
  }
};

// Helper function to safely connect user to Stream Video with real tokens
export const connectStreamVideoUser = async (user) => {
  if (!user || !user.uid) {
    console.error("Invalid user object for Stream connection", user);
    throw new Error("Invalid user object");
  }

  try {
    // Check if already connected with correct user
    if (streamVideoClient.user?.id === user.uid) {
      console.log("User already connected to Stream Video");
      return true;
    }

    // Generate token using our backend service
    const token = await fetchVideoToken(user.uid);

    // Connect user to Stream Video
    await streamVideoClient.connectUser(
      {
        id: user.uid,
        name: user.name || "User",
        image: user.photoUrl || "",
        userType: user.userType || "guest",
        custom: {
          email: user.email || "",
        }
      },
      token
    );

    console.log("User connected to Stream Video successfully", user.uid);
    return true;
  } catch (error) {
    console.error("Failed to connect to Stream Video:", error);
    throw error;
  }
};

// Export all components
export default {
  streamApiKey,
  streamClient,
  streamVideoClient,
  ChannelType,
  connectStreamVideoUser,
  generateStreamToken,
  fetchChatToken,
  fetchVideoToken
};