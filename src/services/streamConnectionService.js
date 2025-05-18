import { streamClient, fetchChatToken } from "../config/stream";

let isConnecting = false;
let reconnectTimeout = null;
let lastUserId = null;

/**
 * Ensures the stream client is connected before performing operations
 * This prevents the "You can't use a channel after client.disconnect() was called" error
 * @param {Function} operation - The operation to perform with the stream client
 * @returns {Promise<any>} - The result of the operation
 */
export const ensureStreamConnection = async (operation) => {
  try {
    // If client is not connected and we're not already trying to connect
    if (!streamClient.isConnected && !isConnecting) {
      console.log("Stream client not connected, reconnecting...");
      isConnecting = true;

      try {
        // Get current user ID - userID is a property, not a method
        const userId = streamClient.userID || lastUserId;

        if (userId) {
          // Store the user ID for future reconnections
          lastUserId = userId;
          console.log(`Reconnecting as user ${userId}`);

          try {
            // Try to get user from session storage
            const userInfo = JSON.parse(sessionStorage.getItem("user") || "{}");

            // Get fresh token from backend (best practice)
            if (userInfo && userInfo.uid === userId) {
              try {
                // Get fresh token and reconnect
                const token = await fetchChatToken(userId);

                // Connect with basic user object (no role modifications)
                await streamClient.connectUser(
                  {
                    id: userId,
                  },
                  token
                );

                console.log(
                  "Stream client reconnected successfully with fresh token"
                );
              } catch (tokenError) {
                console.warn(
                  "Token fetch failed, using dev token fallback:",
                  tokenError.message
                );

                await streamClient.connectUser(
                  {
                    id: userId,
                  },
                  streamClient.devToken(userId)
                );
                console.log(
                  "Stream client reconnected with dev token fallback"
                );

                // No need to update user role after connection
                console.log("Using default user roles");
              }
            } else {
              // If no user info in session, use dev token
              await streamClient.connectUser(
                {
                  id: userId,
                },
                streamClient.devToken(userId)
              );
              console.log("Stream client reconnected with dev token");

              // No need to update user role - using default Stream permissions
              console.log("Using default Stream role settings");
            }
          } catch (connectionError) {
            console.error("Connection error:", connectionError);
            throw connectionError;
          }
        } else {
          console.error("Cannot reconnect Stream client: No user ID available");
          throw new Error("No user ID available for reconnection");
        }
      } catch (connectionError) {
        console.error("Error reconnecting to Stream:", connectionError);

        // Set up a reconnect attempt after a delay if not already trying
        if (!reconnectTimeout) {
          reconnectTimeout = setTimeout(() => {
            isConnecting = false;
            reconnectTimeout = null;
            // The next operation will trigger a reconnect attempt
          }, 5000);
        }

        throw connectionError;
      } finally {
        isConnecting = false;
      }
    }

    // Now perform the requested operation
    return await operation();
  } catch (error) {
    console.error("Error during Stream operation:", error);
    throw error;
  }
};

/**
 * Safely mark a channel as read by ensuring connection first
 */
export const safeMarkChannelRead = async (channel) => {
  return ensureStreamConnection(() => channel.markRead());
};

/**
 * Store the user ID when connecting, so we can use it for reconnection
 */
export const setLastUserId = (userId) => {
  if (userId) {
    lastUserId = userId;
  }
};
