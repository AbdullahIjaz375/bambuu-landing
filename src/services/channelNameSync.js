import { streamClient } from "../config/stream";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

/**
 * Ensures premium individual class channels always have the correct name from Firestore
 */
export const syncPremiumClassChannelName = async (channelId) => {
  try {
    console.log(`Syncing channel name for premium class: ${channelId}`);

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
    }    // Get the Stream channel
    const channel = streamClient.channel("premium_individual_class", channelId);
    await channel.watch();

    console.log(`Current channel name: "${channel.data.name || 'unnamed'}"`);
    console.log(`Target name from Firestore: "${correctName}"`);

    // ALWAYS update the channel name to ensure it matches Firestore
    console.log(
      `Updating channel name from "${
        channel.data.name || "unnamed"
      }" to "${correctName}"`
    );

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

    console.log(`Successfully updated channel name to: ${correctName}`);
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

    console.log(`Found ${channels.length} premium class channels to sync`);

    const results = await Promise.all(
      channels.map((channel) => syncPremiumClassChannelName(channel.id))
    );

    const successCount = results.filter(Boolean).length;
    console.log(
      `Successfully synced ${successCount}/${channels.length} channels`
    );

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
    console.log(`Verifying premium class channels for user ${userId}`);

    // Get user's enrolled classes
    const { getDoc, doc } = await import("firebase/firestore");
    const { db } = await import("../firebaseConfig");

    const userDoc = await getDoc(doc(db, "students", userId));
    if (!userDoc.exists()) {
      console.log(`User ${userId} not found in students collection`);
      return;
    }

    const userData = userDoc.data();
    const enrolledClasses = userData.enrolledClasses || [];

    console.log(`User ${userId} is enrolled in classes: ${enrolledClasses}`);

    // For each enrolled class, check if it's an Individual Premium class
    for (const classId of enrolledClasses) {
      try {
        const classDoc = await getDoc(doc(db, "classes", classId));
        if (classDoc.exists()) {
          const classData = classDoc.data();

          if (classData.classType === "Individual Premium") {
            console.log(
              `Checking premium class channel ${classId} for user ${userId}`
            );

            // Check if user is in the Stream channel
            const channel = streamClient.channel(
              "premium_individual_class",
              classId
            );
            await channel.watch();

            const currentMembers = Object.keys(channel.state?.members || {});
            if (!currentMembers.includes(userId)) {
              console.log(
                `User ${userId} missing from channel ${classId}, adding...`
              );

              try {
                await channel.addMembers([
                  { user_id: userId, role: "channel_member" },
                ]);
                console.log(
                  `Successfully added user ${userId} to channel ${classId}`
                );
              } catch (addError) {
                console.error(
                  `Failed to add user ${userId} to channel ${classId}:`,
                  addError
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
      `Error verifying user premium class channels: ${error.message}`
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
