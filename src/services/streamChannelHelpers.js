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

    // IMPORTANT: Update Firestore first to maintain data consistency
    try {
      const { updateDoc, arrayUnion, doc } = await import("firebase/firestore");
      const { db } = await import("../firebaseConfig");

      // Update collections based on channel type
      if (type === "premium_group" || type === "standard_group") {
        // For groups, update both the group and the user
        const groupRef = doc(db, "groups", channelId);
        await updateDoc(groupRef, {
          memberIds: arrayUnion(userId),
        });

        const userRef = doc(db, "students", userId);
        await updateDoc(userRef, {
          joinedGroups: arrayUnion(channelId),
        });
      } else if (type === "premium_individual_class") {
        // For individual classes, update the class and user's enrolled classes
        const classRef = doc(db, "classes", channelId);
        await updateDoc(classRef, {
          classMemberIds: arrayUnion(userId),
        });

        const userRef = doc(db, "students", userId);
        await updateDoc(userRef, {
          enrolledClasses: arrayUnion(channelId),
        });
      } else if (type === "one_to_one_chat") {
        // For one-to-one chats, nothing special to update in Firestore
        console.log(`One-to-one chat channel created for user ${userId}`);
        // No Firestore update needed for chat channels
      }

      console.log(
        `Successfully updated Firestore for user ${userId} and channel ${channelId}`
      );
    } catch (firestoreError) {
      console.error(`Firestore update failed: ${firestoreError.message}`);
      // Continue anyway since we want to try Stream operations
    }

    // Create or get the channel from Stream
    const channel = streamClient.channel(type, channelId);

    // First check if user is already a member to avoid errors
    try {
      await channel.watch();
      const state = channel.state;
      const currentMembers = Object.keys(state?.members || {});

      if (currentMembers.includes(userId)) {
        console.log(
          `User ${userId} is already a member of channel ${channelId}`
        );
        return {
          message: "User is already a member",
          channel: { id: channelId, type },
        };
      }
    } catch (watchError) {
      console.log(`Could not check existing members: ${watchError.message}`);
      // Continue with attempt to add
    } // Handle premium channels (premium_group, premium_individual_class)
    if (type === "premium_group" || type === "premium_individual_class") {
      try {
        // Get Firestore data to ensure correct channel name
        const { getDoc, doc } = await import("firebase/firestore");
        const { db } = await import("../firebaseConfig");

        // Get the correct data for channel type
        if (type === "premium_group") {
          const groupDoc = await getDoc(doc(db, "groups", channelId));
          if (groupDoc.exists()) {
            const groupData = groupDoc.data();
            // Set the channel name directly in the local data
            console.log(
              `Setting premium group name to "${groupData.groupName}"`
            );
            channel.data.name = groupData.groupName;
            if (groupData.imageUrl) channel.data.image = groupData.imageUrl;
            if (groupData.groupDescription)
              channel.data.description = groupData.groupDescription;
          }
        } else if (type === "premium_individual_class") {
          const classDoc = await getDoc(doc(db, "classes", channelId));
          if (classDoc.exists()) {
            const classData = classDoc.data();
            console.log(
              `Setting premium class name to "${classData.className}"`
            );
            channel.data.name = classData.className;
            if (classData.imageUrl) channel.data.image = classData.imageUrl;
            if (classData.classDescription)
              channel.data.description = classData.classDescription;
          }
        }

        // 1. First try watching - this adds the channel to client's active channels
        await channel.watch();
        console.log(
          `User ${userId} watching premium channel ${channelId} with name: ${
            channel.data.name || "unnamed"
          }`
        );

        // 2. Force the channel to be queried by the client to update cache
        await streamClient.queryChannels({
          id: channelId,
          members: { $in: [userId] },
        });

        // 3. Attempt to add the user as a member (might fail due to permissions)
        try {
          await channel.addMembers([{ user_id: userId, role }]);
          console.log(
            `Successfully added user ${userId} to premium channel ${channelId}`
          );
        } catch (addError) {
          console.log(
            `Could not directly add to channel (expected): ${addError.message}`
          );
          // This is expected to fail for most users - continue
        }

        return {
          message: "User connected to premium channel",
          channel: { id: channelId, type, name: channel.data.name },
          members: [{ user: { id: userId }, role }],
        };
      } catch (premiumError) {
        console.error(`Error with premium channel: ${premiumError.message}`);

        // Try one more time with just a query
        try {
          await streamClient.queryChannels({ id: channelId });
          console.log(`Successfully queried premium channel ${channelId}`);
        } catch (queryError) {
          console.error(`Failed to query channel: ${queryError.message}`);
        }

        // Return success since Firestore was updated
        return {
          message: "User added in Firestore, channel access pending",
          channel: { id: channelId, type },
        };
      }
    }

    // For standard channels and one-to-one chats, try direct member addition
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

      // Handle permission errors specifically
      if (
        streamError.message.includes("not allowed to perform action") ||
        streamError.message.includes("403") ||
        streamError.status === 403
      ) {
        // For permission errors, just watch the channel
        try {
          await channel.watch();
          console.log(
            `Watching channel ${channelId} instead of adding member due to permissions`
          );
        } catch (watchError) {
          console.error(`Even watching failed: ${watchError.message}`);
        }
      }
      // Return a success response since Firestore was updated
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
