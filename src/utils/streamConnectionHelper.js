// Stream connection helper utilities
import { fetchChatToken, fetchVideoToken } from "../config/stream";

// Retry logic with exponential backoff
export const connectWithRetry = async (
  connectFn,
  serviceName,
  maxRetries = 3
) => {
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      await connectFn();
      console.log(`Stream ${serviceName} connected successfully`);
      return;
    } catch (error) {
      retryCount++;
      console.error(
        `Stream ${serviceName} connection attempt ${retryCount} failed:`,
        error
      );

      if (retryCount >= maxRetries) {
        console.error(
          `Failed to connect Stream ${serviceName} after ${maxRetries} attempts`
        );
        throw error;
      }

      // Wait before retrying (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
    }
  }
};

// Store connection errors for later retry
export const storeConnectionError = (userId, service, error) => {
  if (userId) {
    sessionStorage.setItem(
      `stream${service}Error_${userId}`,
      JSON.stringify({
        error: error.message,
        timestamp: Date.now(),
      })
    );
  }
};

// Check if we should retry a connection based on stored error
export const shouldRetryConnection = (userId, service, maxAge = 300000) => {
  // 5 minutes
  const stored = sessionStorage.getItem(`stream${service}Error_${userId}`);
  if (!stored) return false;

  try {
    const errorData = JSON.parse(stored);
    return Date.now() - errorData.timestamp < maxAge;
  } catch {
    return false;
  }
};

// Clear stored connection errors
export const clearConnectionErrors = (userId) => {
  if (userId) {
    sessionStorage.removeItem(`streamChatError_${userId}`);
    sessionStorage.removeItem(`streamVideoError_${userId}`);
  }
};

// Enhanced Stream connection function
export const connectStreamUserWithRetry = async (
  streamClient,
  streamVideoClient,
  userData
) => {
  if (!userData?.uid) {
    console.log("No user data available for Stream connection");
    return;
  }

  const userStreamData = {
    id: userData.uid,
    name: userData.name || "",
    image: userData.photoUrl || "",
    userType: userData.userType,
  };

  // Connect to Stream Chat
  try {
    const chatToken = await fetchChatToken(userData.uid);

    // Check if already connected with the same user ID
    if (streamClient.userID === userData.uid && streamClient.isConnected) {
      console.log("Stream chat client already connected with the same user ID");
    } else {
      // Disconnect previous user if connected with different ID
      if (streamClient.userID && streamClient.userID !== userData.uid) {
        await streamClient.disconnectUser();
      }

      // Connect with retry logic
      await connectWithRetry(async () => {
        await streamClient.connectUser(userStreamData, chatToken);
      }, "chat");

      // Clear any previous errors on successful connection
      sessionStorage.removeItem(`streamChatError_${userData.uid}`);
    }
  } catch (chatError) {
    console.error("Error connecting Stream chat client:", chatError);
    storeConnectionError(userData.uid, "Chat", chatError);
    // Don't throw - allow auth to continue
  }

  // Connect to Stream Video
  try {
    const videoToken = await fetchVideoToken(userData.uid);

    await connectWithRetry(async () => {
      await streamVideoClient.connectUser(userStreamData, videoToken);
    }, "video");

    // Clear any previous errors on successful connection
    sessionStorage.removeItem(`streamVideoError_${userData.uid}`);
  } catch (videoError) {
    console.error("Error connecting Stream video client:", videoError);
    storeConnectionError(userData.uid, "Video", videoError);
    // Don't throw - allow auth to continue
  }
};
