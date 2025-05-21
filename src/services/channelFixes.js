/**
 * Utility functions for fixing channel display issues
 * These can be called directly to fix channels that are showing incorrect names
 */
import { streamClient } from "../config/stream";

/**
 * Force refresh a specific channel's metadata from Firestore
 * This can be used to fix channels that are showing the wrong name
 * @param {string} channelId - The id of the channel to refresh
 * @param {string} type - The channel type (premium_group, standard_group, premium_individual_class, etc)
 * @returns {Promise<boolean>} - Whether the refresh was successful
 */
export const refreshChannelMetadata = async (channelId, type) => {
  try {
    console.log(
      `Refreshing channel metadata for channel: ${channelId} (${type})`
    );

    // Step 1: Get channel from Stream
    const channel = streamClient.channel(type, channelId);
    await channel.watch();

    // Step 2: Get metadata from Firestore
    const { getDoc, doc } = await import("firebase/firestore");
    const { db } = await import("../firebaseConfig");

    let firestoreData = null;

    // Get the correct data for channel type
    if (type === "premium_group" || type === "standard_group") {
      const groupDoc = await getDoc(doc(db, "groups", channelId));
      if (groupDoc.exists()) {
        firestoreData = groupDoc.data();
        console.log(
          `Found group data for ${channelId}: ${
            firestoreData.groupName || "unnamed"
          }`
        );
      }
    } else if (type === "premium_individual_class") {
      const classDoc = await getDoc(doc(db, "classes", channelId));
      if (classDoc.exists()) {
        firestoreData = classDoc.data();
        console.log(
          `Found class data for ${channelId}: ${
            firestoreData.className || "unnamed"
          }`
        );
      }
    }

    if (!firestoreData) {
      console.log(`No Firestore data found for channel ${channelId}`);
      return false;
    }

    // Step 3: Update channel's local data
    if (type === "premium_group" || type === "standard_group") {
      channel.data.name = firestoreData.groupName;
      console.log(`Updated channel name to: ${firestoreData.groupName}`);
      if (firestoreData.imageUrl) channel.data.image = firestoreData.imageUrl;
      if (firestoreData.groupDescription)
        channel.data.description = firestoreData.groupDescription;
    } else if (type === "premium_individual_class") {
      channel.data.name = firestoreData.className;
      console.log(`Updated channel name to: ${firestoreData.className}`);
      if (firestoreData.imageUrl) channel.data.image = firestoreData.imageUrl;
      if (firestoreData.classDescription)
        channel.data.description = firestoreData.classDescription;
    }

    // Step 4: Force refresh with watch
    await channel.watch();

    return true;
  } catch (error) {
    console.error(`Error refreshing channel metadata: ${error.message}`);
    return false;
  }
};

/**
 * Fix all channel names for a user by forcing refresh from Firestore
 * This is useful if a user's channels are showing incorrect names
 * @param {string} userId - The user whose channels should be refreshed
 * @returns {Promise<Array>} - Array of refreshed channels
 */
export const fixAllChannelNames = async (userId) => {
  try {
    console.log(`Fixing all channel names for user ${userId}`);

    // Query all channels for this user
    const filter = {
      members: { $in: [userId] },
      type: {
        $in: ["standard_group", "premium_group", "premium_individual_class"],
      },
    };

    // Force a clean query with watching enabled
    const channels = await streamClient.queryChannels(
      filter,
      { last_message_at: -1 },
      {
        watch: true,
        state: true,
      }
    );

    console.log(`Found ${channels.length} channels to fix`);

    // Get Firestore data for each channel
    const { getDoc, doc } = await import("firebase/firestore");
    const { db } = await import("../firebaseConfig");

    const results = [];

    for (const channel of channels) {
      try {
        // Different handling based on channel type
        if (
          channel.type === "premium_group" ||
          channel.type === "standard_group"
        ) {
          const groupDoc = await getDoc(doc(db, "groups", channel.id));
          if (groupDoc.exists()) {
            const groupData = groupDoc.data();
            const oldName = channel.data.name;
            channel.data.name = groupData.groupName;
            if (groupData.imageUrl) channel.data.image = groupData.imageUrl;
            await channel.watch();

            results.push({
              id: channel.id,
              type: channel.type,
              oldName,
              newName: channel.data.name,
              fixed: true,
            });

            console.log(
              `Fixed group channel name: "${oldName}" → "${channel.data.name}"`
            );
          }
        } else if (channel.type === "premium_individual_class") {
          const classDoc = await getDoc(doc(db, "classes", channel.id));
          if (classDoc.exists()) {
            const classData = classDoc.data();
            const oldName = channel.data.name;
            channel.data.name = classData.className;
            if (classData.imageUrl) channel.data.image = classData.imageUrl;
            await channel.watch();

            results.push({
              id: channel.id,
              type: channel.type,
              oldName,
              newName: channel.data.name,
              fixed: true,
            });

            console.log(
              `Fixed class channel name: "${oldName}" → "${channel.data.name}"`
            );
          }
        }
      } catch (error) {
        console.error(`Error fixing channel ${channel.id}: ${error.message}`);
        results.push({
          id: channel.id,
          type: channel.type,
          error: error.message,
          fixed: false,
        });
      }
    }

    return results;
  } catch (error) {
    console.error(`Error fixing channel names: ${error.message}`);
    return [{ error: error.message, fixed: false }];
  }
};
