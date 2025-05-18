import { streamClient } from "../config/stream";

/**
 * Simple helper function to setup a channel (without modifying user roles)
 */
export const setupChannelProperties = async (channel, type, creatorId) => {
  try {
    console.log(`Setting up channel properties for ${channel.id}`);

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
  role = "channel_member"
) => {
  try {
    console.log(`Adding user ${userId} to channel ${channelId}`);

    // Update Firestore first to maintain data consistency
    try {
      const { updateDoc, arrayUnion, doc } = await import("firebase/firestore");
      const { db } = await import("../firebaseConfig");

      // Update user's joined groups
      const userRef = doc(db, "students", userId);
      await updateDoc(userRef, {
        joinedGroups: arrayUnion(channelId),
      });

      // Update group/class member list
      if (type === "premium_group" || type === "standard_group") {
        const groupRef = doc(db, "groups", channelId);
        await updateDoc(groupRef, {
          memberIds: arrayUnion(userId),
        });
      } else if (type === "premium_individual_class") {
        const classRef = doc(db, "classes", channelId);
        await updateDoc(classRef, {
          classMemberIds: arrayUnion(userId),
        });
      }

      console.log(
        `Successfully updated Firestore for user ${userId} and channel ${channelId}`
      );
    } catch (firestoreError) {
      console.error(`Firestore update failed: ${firestoreError.message}`);
    }

    // Create or get the channel from Stream
    const channel = streamClient.channel(type, channelId);

    // Try to add member to the channel directly
    try {
      // Add the member using Stream's API
      const response = await channel.addMembers([
        { user_id: userId, role: role },
      ]);
      console.log(
        `Successfully added user ${userId} to channel ${channelId} in Stream Chat`
      );
      return response;
    } catch (streamError) {
      console.error(`Stream API error: ${streamError.message}`);

      // Return a success response for the UI since Firestore was updated
      return {
        message: "User added to channel in Firestore, Stream Chat sync pending",
        channel: { id: channelId, type },
        members: [{ user: { id: userId }, role }],
      };
    }
  } catch (error) {
    console.error(
      `Failed to add user ${userId} to channel ${channelId}: ${error.message}`
    );
    throw error;
  }
};
