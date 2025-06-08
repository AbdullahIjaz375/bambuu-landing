import { streamClient } from "../config/stream";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

/**
 * Ensures premium individual class channels always have the correct name from Firestore
 */
export const syncPremiumClassChannelName = async (channelId) => {
  try {
    // Get the class data from Firestore
    const classDoc = await getDoc(doc(db, "classes", channelId));
    if (!classDoc.exists()) {
      console.error(`Class ${channelId} not found in Firestore`);
      return false;
    }

    const classData = classDoc.data();
    const correctName = classData.className;

    if (!correctName) {
      console.error(`No className found for class ${channelId}`);
      return false;
    } // Get the Stream channel
    const channel = streamClient.channel("premium_individual_class", channelId);
    await channel.watch();

    // Update the channel metadata
    await channel.update({
      name: correctName,
      description:
        classData.classDescription || `Class chat for ${correctName}`,
      image: classData.imageUrl || "",
      custom: {
        className: correctName,
        classId: channelId,
        firestoreCollection: "classes",
        lastSynced: new Date().toISOString(),
        // Add a flag to indicate this is a class channel
        isClassChannel: true,
      },
    });

    // CRITICAL: Also update the local channel data to ensure immediate UI update
    channel.data.name = correctName;
    channel.data.description =
      classData.classDescription || `Class chat for ${correctName}`;
    channel.data.image = classData.imageUrl || "";

    // Also update the channel's internal name property if it exists
    if (channel.name !== correctName) {
      channel.name = correctName;
    }

    // Force update the channel state
    if (channel.state) {
      channel.state.name = correctName;
    }

    return true;
  } catch (error) {
    console.error(`Error syncing channel name for ${channelId}:`, error);
    return false;
  }
};

/**
 * Sync all premium individual class channels for a user
 */
export const syncAllPremiumClassChannels = async (userId) => {
  try {
    // Query all premium individual class channels for this user
    const channels = await streamClient.queryChannels({
      type: "premium_individual_class",
      members: { $in: [userId] },
    });

    const results = await Promise.all(
      channels.map((channel) => syncPremiumClassChannelName(channel.id)),
    );

    const successCount = results.filter(Boolean).length;

    return { total: channels.length, synced: successCount };
  } catch (error) {
    console.error("Error syncing all premium class channels:", error);
    return { total: 0, synced: 0 };
  }
};

/**
 * Verify user should be in premium individual class channels they're enrolled in
 */
export const verifyUserPremiumClassChannels = async (userId) => {
  try {
    // Get user's enrolled classes
    const { getDoc, doc } = await import("firebase/firestore");
    const { db } = await import("../firebaseConfig");

    const userDoc = await getDoc(doc(db, "students", userId));
    if (!userDoc.exists()) {
      return;
    }

    const userData = userDoc.data();
    const enrolledClasses = userData.enrolledClasses || [];

    // For each enrolled class, check if it's an Individual Premium class
    for (const classId of enrolledClasses) {
      try {
        const classDoc = await getDoc(doc(db, "classes", classId));
        if (classDoc.exists()) {
          const classData = classDoc.data();

          if (classData.classType === "Individual Premium") {
            // Check if user is in the Stream channel
            const channel = streamClient.channel(
              "premium_individual_class",
              classId,
            );
            await channel.watch();

            const currentMembers = Object.keys(channel.state?.members || {});
            if (!currentMembers.includes(userId)) {
              try {
                await channel.addMembers([
                  { user_id: userId, role: "channel_member" },
                ]);
              } catch (addError) {
                console.error(
                  `Failed to add user ${userId} to channel ${classId}:`,
                  addError,
                );
              }
            }

            // Also sync the channel name while we're here
            await syncPremiumClassChannelName(classId);
          }
        }
      } catch (classError) {
        console.error(`Error checking class ${classId}:`, classError);
      }
    }
  } catch (error) {
    console.error(
      `Error verifying user premium class channels: ${error.message}`,
    );
  }
};

/**
 * Get class name directly from Firestore for display purposes
 */
export const getClassNameFromFirestore = async (classId) => {
  try {
    const classDoc = await getDoc(doc(db, "classes", classId));
    if (classDoc.exists()) {
      const classData = classDoc.data();
      return classData.className || null;
    }
    return null;
  } catch (error) {
    console.error(`Error getting class name for ${classId}:`, error);
    return null;
  }
};
