import { streamClient } from "../config/stream";

/**
 * Simple helper function to setup a channel (without modifying user roles)
 */
export const setupChannelProperties = async (channel, type, creatorId) => {
  try {
    // No role modifications - just ensuring basic channel settings
    const updates = {
      frozen: false, // Ensure channel is not frozen
    };

    // Update channel if needed
    await channel.update(updates);
    return true;
  } catch (error) {
    console.error(`Error setting up channel: ${error.message}`);
    return false;
  }
};

/**
 * Add a user to a channel following Stream Chat best practices
 * Uses Firestore first approach to ensure consistency
 */
export const addUserToChannel = async (
  channelId,
  userId,
  type,
  role = "channel_member",
) => {
  try {
    // IMPORTANT: Update Firestore first to maintain data consistency
    if (type === "premium_individual_class") {
      try {
        const { updateDoc, arrayUnion, doc } = await import(
          "firebase/firestore"
        );
        const { db } = await import("../firebaseConfig");

        // Update the class document to include the new member
        const classRef = doc(db, "classes", channelId);
        await updateDoc(classRef, {
          classMemberIds: arrayUnion(userId),
        });
      } catch (firestoreError) {
        console.error(`Firestore update failed: ${firestoreError.message}`);
        // Continue with Stream operations
      }
    }

    // Import streamClient here to avoid circular imports
    const { streamClient } = await import("../config/stream");

    // Get or create the Stream channel
    const channel = streamClient.channel(type, channelId);

    // For premium individual classes, we need special handling
    if (type === "premium_individual_class") {
      try {
        // First ensure the channel exists and watch it
        await channel.watch();

        // Check if user is already a member
        const currentMembers = Object.keys(channel.state?.members || {});
        if (currentMembers.includes(userId)) {
          return { success: true, message: "User already a member" };
        }

        // Get the class data to ensure correct channel metadata
        const { getDoc, doc } = await import("firebase/firestore");
        const { db } = await import("../firebaseConfig");

        const classDoc = await getDoc(doc(db, "classes", channelId));
        if (classDoc.exists()) {
          const classData = classDoc.data();

          // Update channel metadata to ensure correct name and members list
          await channel.update({
            name: classData.className,
            description:
              classData.classDescription ||
              `Class chat for ${classData.className}`,
            image: classData.imageUrl || "",
            // IMPORTANT: Add the user to the members list in the update
            add_members: [{ user_id: userId, role: role }],
          });
        } else {
          // If no class data, just add the member
          await channel.addMembers([{ user_id: userId, role: role }]);
        }

        // Force the channel to refresh and ensure the user can see it
        await channel.watch();

        return {
          success: true,
          message: "User successfully added to premium class channel",
          channel: { id: channelId, type, name: channel.data.name },
        };
      } catch (premiumError) {
        console.error(`Premium channel error: ${premiumError.message}`);

        // Alternative approach: Create channel with user as member
        try {
          // Get class data for channel creation
          const { getDoc, doc } = await import("firebase/firestore");
          const { db } = await import("../firebaseConfig");
          const classDoc = await getDoc(doc(db, "classes", channelId));

          if (classDoc.exists()) {
            const classData = classDoc.data();
            const allMembers = [classData.adminId, userId]; // Include both tutor and student

            // Create/update channel with both members
            const channelWithMembers = streamClient.channel(type, channelId, {
              name: classData.className,
              description:
                classData.classDescription ||
                `Class chat for ${classData.className}`,
              image: classData.imageUrl || "",
              members: allMembers,
              created_by_id: classData.adminId,
            });

            await channelWithMembers.create();
            await channelWithMembers.watch();

            return {
              success: true,
              message: "Channel created with user as member",
              channel: { id: channelId, type },
            };
          }
        } catch (alternativeError) {
          console.error(
            `Alternative approach failed: ${alternativeError.message}`,
          );
          throw alternativeError;
        }
      }
    }

    // For other channel types, use standard approach
    try {
      await channel.watch();
      const addResult = await channel.addMembers([
        { user_id: userId, role: role },
      ]);
      return addResult;
    } catch (standardError) {
      console.error(
        `Standard channel addition failed: ${standardError.message}`,
      );
      throw standardError;
    }
  } catch (error) {
    console.error(
      `Failed to add user ${userId} to channel ${channelId}: ${error.message}`,
    );
    throw error;
  }
};
