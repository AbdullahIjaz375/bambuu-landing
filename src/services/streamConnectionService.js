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

/**
 * Force refresh channels for a user to ensure all membership changes are reflected
 * This is especially important after joining a premium group
 */
export const refreshUserChannels = async (userId) => {
  try {
    console.log(`Refreshing channels for user ${userId}`);

    // Step 1: Make sure we have a fresh token that includes the new group membership
    // Disconnect and reconnect to refresh the token
    if (streamClient.userID) {
      await streamClient.disconnectUser();
    }

    // Get a fresh token from the backend
    const { fetchChatToken } = await import("../config/stream");
    const token = await fetchChatToken(userId);

    // Connect with the fresh token
    await streamClient.connectUser(
      {
        id: userId,
      },
      token
    );

    console.log(`Reconnected with fresh token for user ${userId}`);

    // Step 2: Now query all channels with this fresh connection
    const filter = {
      members: { $in: [userId] },
      type: {
        $in: [
          "standard_group",
          "premium_group",
          "premium_individual_class",
          "one_to_one_chat",
        ],
      },
    };

    // Step 3: Force a clean query with watching enabled - increase limit to catch more channels
    const channels = await streamClient.queryChannels(
      filter,
      { last_message_at: -1 },
      {
        watch: true,
        state: true,
        presence: true,
        limit: 100, // Increased limit to catch more channels
      }
    );

    // Step 4: Update channel names from Firestore for all channels
    const { db } = await import("../firebaseConfig");
    const { doc, getDoc } = await import("firebase/firestore");

    // Import enhanced channel update utility
    const { enforceChannelNameFromFirestore } = await import(
      "../utils/channelRefreshUtil"
    );

    // Process all channels, not just premium ones
    for (const channel of channels) {
      try {
        // Use the enhanced channel name enforcement utility
        const result = await enforceChannelNameFromFirestore(channel);
        console.log(`Channel name enforcement result: `, result);

        // Additional fallback - for groups, sync with groups collection
        if (
          channel.type === "premium_group" ||
          channel.type === "standard_group"
        ) {
          const groupDoc = await getDoc(doc(db, "groups", channel.id));
          if (groupDoc.exists()) {
            const groupData = groupDoc.data();
            if (groupData.groupName) {
              // Update the channel data locally - this affects the UI display
              console.log(
                `Ensuring channel name: "${groupData.groupName}" (was: "${
                  channel.data.name || "unnamed"
                }")`
              );
              channel.data.name = groupData.groupName;
              if (channel.name !== groupData.groupName) {
                channel.name = groupData.groupName; // Also set directly on channel object
              }
              channel.data.image = groupData.imageUrl || channel.data.image;

              // Force update the state
              if (channel.state) {
                channel.state.name = groupData.groupName;
              }
            }
          }
        }
        // For classes, sync with classes collection
        else if (channel.type === "premium_individual_class") {
          const classDoc = await getDoc(doc(db, "classes", channel.id));
          if (classDoc.exists()) {
            const classData = classDoc.data();
            if (classData.className) {
              console.log(
                `Ensuring class channel name: "${classData.className}" (was: "${
                  channel.data.name || "unnamed"
                }")`
              );
              channel.data.name = classData.className;
              if (channel.name !== classData.className) {
                channel.name = classData.className; // Also set directly on channel object
              }
              channel.data.image = classData.imageUrl || channel.data.image;

              // Force update the state
              if (channel.state) {
                channel.state.name = classData.className;
              }
            }
          }
        }

        // Force watch the channel to refresh local state
        await channel.watch();
        console.log(
          `Force watched channel: ${channel.id} with name: ${
            channel.data.name || "unnamed"
          }`
        );
      } catch (error) {
        console.error(`Error updating channel ${channel.id}: ${error.message}`);
      }
    }

    console.log(`Refreshed ${channels.length} channels for user ${userId}`);

    // Return detailed channel info for debugging
    return channels.map((channel) => ({
      id: channel.id,
      type: channel.type,
      name: channel.data?.name,
      members: Object.keys(channel.state?.members || {}).length,
    }));
  } catch (error) {
    console.error(`Error refreshing channels: ${error.message}`);
    return false;
  }
};
