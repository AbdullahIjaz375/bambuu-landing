import { streamClient } from "../config/stream";

/**
 * Utility to explicitly update a Stream channel's local name from Firestore
 * This ensures the UI shows the correct name for group channels
 */
const updateChannelNameFromFirestore = async (channelId, channelType) => {
  try {
    // Get the channel object
    const channel = streamClient.channel(channelType, channelId);
    await channel.watch();

    // Get Firestore data based on channel type
    const { getDoc, doc } = await import("firebase/firestore");
    const { db } = await import("../firebaseConfig");

    if (channelType === "premium_group" || channelType === "standard_group") {
      // Get group data
      const groupDoc = await getDoc(doc(db, "groups", channelId));
      if (groupDoc.exists()) {
        const groupData = groupDoc.data();

        // Update the channel's local data to show the correct name in the UI
        if (groupData.groupName && channel.data.name !== groupData.groupName) {
          // Update local channel data
          channel.data.name = groupData.groupName;
          channel.data.image = groupData.imageUrl || channel.data.image;

          // Update description if available
          if (groupData.groupDescription) {
            channel.data.description = groupData.groupDescription;
          }

          // Force refresh
          await channel.watch();
          return { fixed: true, name: groupData.groupName };
        }
      }
    } else if (channelType === "premium_individual_class") {
      // Get class data
      const classDoc = await getDoc(doc(db, "classes", channelId));
      if (classDoc.exists()) {
        const classData = classDoc.data();

        // Update the channel's local data to show the correct name in the UI
        if (classData.className && channel.data.name !== classData.className) {
          // Update local channel data
          channel.data.name = classData.className;
          channel.data.image = classData.imageUrl || channel.data.image;

          // Update description if available
          if (classData.classDescription) {
            channel.data.description = classData.classDescription;
          }

          // Force refresh
          await channel.watch();
          return { fixed: true, name: classData.className };
        }
      }
    }

    return { fixed: false, message: "No update needed" };
  } catch (error) {
    console.error(`Error updating channel name: ${error.message}`);
    return { fixed: false, error: error.message };
  }
};

export default updateChannelNameFromFirestore;
