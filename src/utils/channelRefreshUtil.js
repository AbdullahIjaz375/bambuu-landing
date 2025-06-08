import { streamClient } from "../config/stream";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { ensureStreamConnection } from "../services/streamConnectionService";

/**
 * Comprehensive utility to fix and enforce channel names across the app
 * This addresses issues where premium group channels show tutor names instead of group names
 * and ensures consistent channel visibility and naming for both students and tutors
 */
export const enforceChannelNameFromFirestore = async (channel) => {
  if (!channel) return { fixed: false, error: "No channel provided" };

  try {
    await ensureStreamConnection(async () => {
      // Make sure channel is being watched
      await channel.watch();

      // Get the correct Firestore data based on channel type
      let firestoreData = null;
      let collectionName = null;

      if (
        channel.type === "premium_group" ||
        channel.type === "standard_group"
      ) {
        collectionName = "groups";
      } else if (channel.type === "premium_individual_class") {
        collectionName = "classes";
      } else {
        // One-to-one chats don't need name fixing
        return { fixed: false, message: "Not a group or class channel" };
      }

      if (collectionName) {
        const docRef = doc(db, collectionName, channel.id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          firestoreData = docSnap.data();

          // Extract the correct name based on collection type
          const correctName =
            collectionName === "groups"
              ? firestoreData.groupName
              : firestoreData.className;

          const correctImage = firestoreData.imageUrl || null;
          const correctDescription =
            collectionName === "groups"
              ? firestoreData.groupDescription
              : firestoreData.classDescription;

          // Check if the channel name is incorrect
          if (correctName && channel.data.name !== correctName) {
            // Fix local state - this is what affects the UI immediately
            channel.data.name = correctName;
            if (correctImage) channel.data.image = correctImage;
            if (correctDescription)
              channel.data.description = correctDescription;

            // Try server-side update (may fail due to permissions for premium channels)
            try {
              await channel.update({
                name: correctName,
                image: correctImage,
                description: correctDescription,
              });
            } catch (updateError) {
              console.warn(
                `Server-side update failed, but local data was fixed: ${updateError.message}`,
              );
              // We don't reject here since local data is more important for UI
            }

            return { fixed: true, name: correctName };
          } else {
            return { fixed: false, message: "Name already correct" };
          }
        } else {
          console.warn(
            `No Firestore document found for ${channel.id} in ${collectionName}`,
          );
          return { fixed: false, error: "No Firestore data found" };
        }
      }
    });

    // Force refresh after update
    await channel.watch();

    return { success: true };
  } catch (error) {
    console.error(`Error enforcing channel name: ${error.message}`);
    return { fixed: false, error: error.message };
  }
};

/**
 * Function to ensure a tutor can see a channel when a student sends first message
 * This addresses the issue where tutors can't see channels in their list
 */
export const ensureTutorCanSeeChannel = async (channelId, channelType) => {
  try {
    // Connect to the channel
    const channel = streamClient.channel(channelType, channelId);

    // Force a watch operation which should make the channel visible in the UI
    await channel.watch();

    // Force a query which makes the client refresh its channel list
    await streamClient.queryChannels({ id: channelId });

    // Ensure channel data is fixed
    await enforceChannelNameFromFirestore(channel);

    return { success: true };
  } catch (error) {
    console.error(`Error ensuring tutor can see channel: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Utility to refresh all channels for a user, with proper name sync
 * This is useful after logging in or when channels aren't showing properly
 */
export const refreshUserChannels = async () => {
  try {
    // Get current user ID from Stream client
    const userId = streamClient.userID;
    if (!userId) {
      return { success: false, error: "No user logged in" };
    }

    // Query all channels the user is a member of
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

    const sort = { last_message_at: -1 };

    // Force a clean query with watching enabled
    const channels = await streamClient.queryChannels(filter, sort, {
      watch: true,
      state: true,
      presence: true,
    });

    // Process all channels, not just premium ones
    const results = [];
    for (const channel of channels) {
      try {
        const result = await enforceChannelNameFromFirestore(channel);
        results.push({
          id: channel.id,
          type: channel.type,
          name: channel.data?.name,
          result,
        });
      } catch (error) {
        console.error(
          `Error refreshing channel ${channel.id}: ${error.message}`,
        );
        results.push({
          id: channel.id,
          type: channel.type,
          error: error.message,
        });
      }
    }

    return {
      success: true,
      message: `Refreshed ${channels.length} channels`,
      results,
    };
  } catch (error) {
    console.error(`Error refreshing channels: ${error.message}`);
    return { success: false, error: error.message };
  }
};

export default {
  enforceChannelNameFromFirestore,
  ensureTutorCanSeeChannel,
  refreshUserChannels,
};
