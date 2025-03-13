// src/config/stream.js
import { StreamChat } from "stream-chat";
import { StreamVideoClient } from "@stream-io/video-react-sdk";

// Get API key from environment variables
export const streamApiKey = process.env.REACT_APP_STREAM_API_KEY;

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

// Generate a token for Stream Video
// Note: In production, tokens should be generated server-side
export const generateStreamToken = (userId) => {
  if (!userId) {
    throw new Error("User ID is required to generate a token");
  }
  
  // For development only - this is NOT secure for production
  // Use the StreamChat client to generate a token instead since streamVideoClient.devToken isn't available
  return streamClient.devToken(userId);
};

// Helper function to safely connect user to Stream Video
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
    
    // Generate token using our helper function
    const token = generateStreamToken(user.uid);
    
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
  generateStreamToken
};