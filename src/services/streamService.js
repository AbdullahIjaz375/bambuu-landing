import { streamClient, ChannelType } from "../config/stream";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { ensureStreamConnection } from "./streamConnectionService";

const ensureUserExists = async (userId) => {
  try {
    try {
      const { users } = await streamClient.queryUsers({ id: userId });
      if (users && users.length > 0) {
        console.log(`User ${userId} already exists in Stream`);
        return true; // User exists
      }
      console.log(`User ${userId} not found in Stream, creating...`);
    } catch (error) {
      console.log(`Error querying user ${userId} in Stream:`, error.message);
    }

    const userDoc = await getDoc(doc(db, "tutors", userId));
    if (!userDoc.exists()) {
      const studentDoc = await getDoc(doc(db, "students", userId));
      if (!studentDoc.exists()) {
        throw new Error(`User ${userId} does not exist in Firebase`);
      }
      return createStreamUser(studentDoc.id, studentDoc.data());
    }
    return createStreamUser(userDoc.id, userDoc.data());
  } catch (error) {
    console.error(`Failed to ensure user ${userId} exists in Stream:`, error);
    throw error;
  }
};

const createStreamUser = async (userId, userData) => {
  try {
    // Create or update the user in Stream with basic information (no role modification)
    await streamClient.upsertUser({
      id: userId,
      name: userData.name || "User",
      image: userData.photoUrl || "",
      userType: userData.userType || "guest", // Keep the original userType for reference
    });

    console.log(`Successfully created/updated user ${userId} in Stream`);
    return true;
  } catch (error) {
    console.error(`Failed to create user ${userId} in Stream:`, error);
    throw error;
  }
};

export const createStreamChannel = async ({
  id,
  type,
  members,
  name,
  image,
  description,
  created_by_id,
  member_roles,
}) => {
  try {
    // Ensure all members are unique
    const uniqueMembers = Array.from(new Set(members));
    // For group/class channels, ensure all members are added
    if (
      type === ChannelType.PREMIUM_GROUP ||
      type === ChannelType.STANDARD_GROUP ||
      type === ChannelType.PREMIUM_INDIVIDUAL_CLASS
    ) {
      // Log members being added
      console.log(
        `[StreamService] Creating channel ${id} with members:`,
        uniqueMembers
      );
    }
    // Ensure all members exist in Stream before creating the channel
    await Promise.all(uniqueMembers.map((userId) => ensureUserExists(userId)));
    // Create the channel with all members
    const channel = streamClient.channel(type, id, {
      name,
      members: uniqueMembers,
      image,
      description,
      member_roles,
    });
    // Watch the channel after creation
    await channel.watch();
    // Log current members after watch
    const currentMembers = Object.keys(channel.state?.members || {});
    console.log(
      `[StreamService] Channel ${id} current members after watch:`,
      currentMembers
    );
    return channel;
  } catch (error) {
    console.error(`[StreamService] Error creating channel:`, error);
    throw error;
  }
};

export const addMemberToStreamChannel = async ({
  channelId,
  userId,
  role,
  type,
}) => {
  try {
    // First ensure the user exists in Stream
    try {
      await ensureUserExists(userId);
    } catch (userError) {
      console.error(`Failed to ensure user exists: ${userError.message}`);
      // Continue anyway - the Stream API will handle missing users
    }

    console.log(
      `Adding user ${userId} to channel ${channelId} with type ${type}`
    );

    // Validate inputs - make sure we have valid channel types
    if (!Object.values(ChannelType).includes(type)) {
      console.error(`Invalid channel type: ${type}`);
      throw new Error(`Invalid channel type: ${type}`);
    }

    // Fetch the group or class data from Firestore to sync with Stream
    let firestoreData = null;
    let groupAdminId = null;

    try {
      if (
        type === ChannelType.STANDARD_GROUP ||
        type === ChannelType.PREMIUM_GROUP
      ) {
        // It's a group channel - fetch from groups collection
        const groupDoc = await getDoc(doc(db, "groups", channelId));
        if (groupDoc.exists()) {
          firestoreData = groupDoc.data();
          groupAdminId = firestoreData.groupAdminId;
          console.log(
            `Found Firestore group data for ${channelId}: ${firestoreData.groupName}`
          );
        }
      } else if (type === ChannelType.PREMIUM_INDIVIDUAL_CLASS) {
        // It's a class channel - fetch from classes collection
        const classDoc = await getDoc(doc(db, "classes", channelId));
        if (classDoc.exists()) {
          firestoreData = classDoc.data();
          console.log(
            `Found Firestore class data for ${channelId}: ${firestoreData.className}`
          );
        }
      }
      // One-to-one chat channels don't need Firestore data
    } catch (firestoreErr) {
      console.error(
        `Failed to fetch Firestore data for channel ${channelId}:`,
        firestoreErr
      );
    } // Special handling for premium channels - make sure the channel exists and is watched
    if (
      type === ChannelType.PREMIUM_GROUP ||
      type === ChannelType.PREMIUM_INDIVIDUAL_CLASS
    ) {
      try {
        // Get the channel first to ensure it exists
        const channel = streamClient.channel(type, channelId);
        await channel.watch(); // If we have Firestore data, update the channel metadata to ensure proper display
        if (firestoreData) {
          if (type === ChannelType.PREMIUM_GROUP && firestoreData.groupName) {
            await channel.update({
              name: firestoreData.groupName,
              description:
                firestoreData.groupDescription ||
                `Group chat for ${firestoreData.groupName}`,
              image: firestoreData.imageUrl || "",
            });
            console.log(
              `Updated premium group channel name to "${firestoreData.groupName}"`
            );
          } else if (
            type === ChannelType.PREMIUM_INDIVIDUAL_CLASS &&
            firestoreData.className
          ) {
            await channel.update({
              name: firestoreData.className,
              description:
                firestoreData.classDescription ||
                `Class chat for ${firestoreData.className}`,
              image: firestoreData.imageUrl || "",
            });
            console.log(
              `Updated premium class channel name to "${firestoreData.className}"`
            );
          } else {
            // Fallback if we have firestoreData but name is missing
            const fallbackName =
              type === ChannelType.PREMIUM_GROUP
                ? "Premium Group Chat"
                : "Premium Individual Class";

            await channel.update({
              name: fallbackName,
              description: `Chat for ${fallbackName}`,
              image: firestoreData.imageUrl || "",
            });
            console.log(
              `Updated channel ${channelId} with fallback name "${fallbackName}" because the original name was undefined`
            );
          }
        } else {
          // No Firestore data available, set a default name
          const defaultName =
            type === ChannelType.PREMIUM_GROUP
              ? "Premium Group Chat"
              : "Premium Individual Class";

          await channel.update({
            name: defaultName,
            description: `Chat for ${defaultName}`,
          });
          console.log(
            `No Firestore data found, set default name "${defaultName}" for channel ${channelId}`
          );
        }

        // Force a query to refresh the client's cache
        await streamClient.queryChannels({ id: channelId });

        console.log(
          `Verified premium channel ${channelId} exists and is being watched`
        );
      } catch (watchError) {
        console.error(
          `Error watching channel ${channelId}: ${watchError.message}`
        );
      }
    }

    // Use the streamChannelHelpers method for all channel types consistently
    let response;
    try {
      // Import helper dynamically to avoid circular dependencies
      const { addUserToChannel } = await import("./streamChannelHelpers");

      // Determine the appropriate role (admin gets channel_moderator)
      const memberRole =
        groupAdminId === userId
          ? "channel_moderator"
          : role || "channel_member";

      // Use the helper to add user correctly based on channel type
      response = await addUserToChannel(channelId, userId, type, memberRole);

      if (response && firestoreData) {
        console.log(
          `Channel ${channelId} was updated in Firestore - Stream will sync via backend`
        );
      }

      // For non-premium channels, we can try to update channel metadata directly
      if (
        type === ChannelType.STANDARD_GROUP ||
        type === ChannelType.ONE_TO_ONE_CHAT
      ) {
        try {
          const channel = streamClient.channel(type, channelId);
          await channel.watch();

          // Update channel data from Firestore if available
          if (firestoreData) {
            await updateChannelWithFirestoreData(channel, firestoreData);
          }

          console.log(`Updated channel metadata for ${channelId}`);
        } catch (updateError) {
          console.warn(
            `Failed to update channel metadata: ${updateError.message}`
          );
          // Continue anyway as this is not critical
        }
      }
    } catch (error) {
      console.error(`Failed to add member to channel: ${error.message}`);
      throw error;
    }

    // Verify the user was added
    try {
      const updatedChannel = streamClient.channel(type, channelId);
      await updatedChannel.watch();
      const updatedMembers = Object.keys(updatedChannel.state?.members || {});
      console.log(`Updated channel members: ${updatedMembers.join(", ")}`);
    } catch (verifyError) {
      console.warn(`Could not verify member addition: ${verifyError.message}`);
      // Continue anyway since the initial operation succeeded
    }

    return response;
  } catch (error) {
    console.error("Error adding member to stream channel:", error.message);
    if (error.response) {
      console.error("Error response:", error.response);
    }
    throw error;
  }
};

// Helper function to update a channel with Firestore data
async function updateChannelWithFirestoreData(channel, firestoreData) {
  const updateData = {};

  // Update name based on the document type
  if (firestoreData.groupName) {
    updateData.name = firestoreData.groupName;
  } else if (firestoreData.className) {
    updateData.name = firestoreData.className;
  }

  // Update image if available
  if (firestoreData.imageUrl) {
    updateData.image = firestoreData.imageUrl;
  }

  // Update description if available
  if (firestoreData.groupDescription) {
    updateData.description = firestoreData.groupDescription;
  } else if (firestoreData.classDescription) {
    updateData.description = firestoreData.classDescription;
  }

  // Only update if we have something to update
  if (Object.keys(updateData).length > 0) {
    try {
      // CRITICAL FIX: For ALL channel types - update local data first which affects the UI
      // This will ensure the chat shows the correct name regardless of server update permissions
      console.log(
        `Ensuring local data for ${channel.id} shows name "${updateData.name}"`
      );

      // DIRECTLY UPDATE CHANNEL DATA OBJECT - this is what the UI uses
      if (updateData.name) {
        channel.data = channel.data || {};
        channel.data.name = updateData.name;

        // Also set it on the channel object directly for some Stream Chat versions
        if (channel.name !== updateData.name) {
          console.log(`Also updating channel object name property`);
          channel.name = updateData.name;
        }
      }

      // Update other properties
      if (updateData.image) channel.data.image = updateData.image;
      if (updateData.description)
        channel.data.description = updateData.description;

      // Force the channel state to update
      if (channel.state) {
        channel.state.name = updateData.name;
      }

      // Check if the type is premium - if so, avoid server updates which require elevated permissions
      if (
        channel.type === "premium_group" ||
        channel.type === "premium_individual_class"
      ) {
        console.log(
          `Skipping server update for ${channel.id} as it's a premium channel`
        );
        // Just return the data without trying to update (avoid permission errors)
        return updateData;
      } else {
        // For standard channels, we can update the server directly
        console.log(
          `Updating standard channel ${channel.id} with data:`,
          updateData
        );
        await channel.update(updateData);
      }

      // Force a watch to refresh channel data
      await channel.watch();
    } catch (updateErr) {
      console.error(
        `Failed to update channel ${channel.id} with Firestore data:`,
        updateErr
      );
      // We already updated the local data, so the UI should show correctly
      console.log("Local data was updated but server update failed");
    }
  }

  return updateData;
}

export const removeMemberFromStreamChannel = async ({
  channelId,
  userId,
  type,
}) => {
  try {
    const channel = streamClient.channel(type, channelId);
    await channel.watch();

    const response = await channel.removeMembers([userId]);

    return response;
  } catch (error) {
    console.error("Error removing member from stream channel:", error.message);
    if (error.response) {
      console.error("Error response:", error.response);
    }
    throw error;
  }
};

export const deleteStreamChannel = async ({ channelId, type }) => {
  try {
    const channel = streamClient.channel(type, channelId);
    await channel.watch();

    // Stop watching before deletion
    await channel.watch({ timeout: 10000 }); // Increased timeout to 10s

    const response = await channel.delete();

    return response;
  } catch (error) {
    console.error("Error deleting stream channel:", error.message);
    if (error.response) {
      console.error("Error response:", error.response);
    }
    throw error;
  }
};

/**
 * Updates a Stream channel with the latest data from Firestore
 * This is useful to ensure group names, images, and descriptions are in sync
 */
export const syncChannelWithFirestore = async ({ channelId, type }) => {
  return ensureStreamConnection(async () => {
    try {
      console.log(`Syncing channel ${channelId} (${type}) with Firestore`);

      // Fetch data from Firestore based on channel type
      let firestoreData = null;

      if (type === "standard_group" || type === "premium_group") {
        const groupDoc = await getDoc(doc(db, "groups", channelId));
        if (groupDoc.exists()) {
          firestoreData = groupDoc.data();
          console.log(
            `Found group data for ${channelId}: ${firestoreData.groupName}`
          );
        }
      } else if (type === "premium_individual_class") {
        const classDoc = await getDoc(doc(db, "classes", channelId));
        if (classDoc.exists()) {
          firestoreData = classDoc.data();
          console.log(
            `Found class data for ${channelId}: ${firestoreData.className}`
          );
        }
      } else if (type === "one_to_one_chat") {
        // One-to-one chats don't have corresponding Firestore documents
        return {
          success: true,
          message: "No Firestore data for one-to-one chats",
        };
      }

      if (!firestoreData) {
        return { success: false, message: "No Firestore data found" };
      }

      // Get the Stream channel
      const channel = streamClient.channel(type, channelId);
      await channel.watch();

      // Prepare the update data
      const updateData = {};

      // Set name based on document type
      if (firestoreData.groupName) {
        updateData.name = firestoreData.groupName;
      } else if (firestoreData.className) {
        updateData.name = firestoreData.className;
      }

      // Set image if available
      if (firestoreData.imageUrl) {
        updateData.image = firestoreData.imageUrl;
      }

      // Set description if available
      if (firestoreData.groupDescription) {
        updateData.description = firestoreData.groupDescription;
      } else if (firestoreData.classDescription) {
        updateData.description = firestoreData.classDescription;
      }

      // Only update if we have data to update
      if (Object.keys(updateData).length > 0) {
        // For premium channels, we need special handling
        if (type === "premium_group" || type === "premium_individual_class") {
          console.log(
            `Premium channel ${channelId} update - may have limited permissions`
          );

          try {
            // Get the admin ID for this channel
            const adminId = firestoreData.groupAdminId || null;

            // Always update the local channel data properties - this affects the UI
            // This doesn't actually change server data but updates what's shown in the UI
            console.log(
              `Ensuring local channel data for ${channelId} shows name "${updateData.name}"`
            );
            channel.data.name = updateData.name;
            if (updateData.image) channel.data.image = updateData.image;
            if (updateData.description)
              channel.data.description = updateData.description;

            // If this user is the admin, they might be able to update properties on the server
            if (streamClient.userID === adminId) {
              try {
                await channel.update(updateData);
                console.log(`Admin successfully updated channel ${channelId}`);
              } catch (adminUpdateError) {
                console.warn(
                  `Even admin couldn't update channel: ${adminUpdateError.message}`
                );
                // Continue without throwing error
              }
            }
          } catch (permError) {
            console.warn(
              `Skipped channel server updates: ${permError.message}`
            );
            // Continue anyway as this is not critical
          }
        } else {
          // For standard channels, we can update directly
          console.log(
            `Updating standard channel ${channelId} with data:`,
            updateData
          );
          await channel.update(updateData);
        }
      }
    } catch (error) {
      console.error(
        `Error syncing channel ${channelId} (${type}) with Firestore:`,
        error.message
      );
      return { success: false, message: error.message };
    }

    return { success: true, message: "Channel synced successfully" };
  });
};

export function getChannelDisplayName(channel, user) {
  if (channel.type === "one_to_one_chat") {
    const members = Object.values(channel.state?.members || {});
    const otherMember = members.find((member) => member.user?.id !== user.uid);
    return otherMember && otherMember.user ? otherMember.user.name : "Chat";
  }
  if (channel.data?.name && channel.data.name.trim() !== "") {
    return channel.data.name;
  }
  if (channel.type === "premium_group" || channel.type === "standard_group") {
    return "Group Chat";
  }
  if (channel.type === "premium_individual_class") {
    return "Class Chat";
  }
  return "Chat";
}

// Helper to add a user to a channel only if not already a member
export const addUserToChannelIfNeeded = async (channelId, userId, type) => {
  try {
    const channel = streamClient.channel(type, channelId);
    await channel.watch();
    const currentMembers = Object.keys(channel.state?.members || {});
    if (!currentMembers.includes(userId)) {
      console.log(
        `[StreamService] Adding user ${userId} to channel ${channelId}`
      );
      await channel.addMembers([userId]);
      await channel.watch();
      const updatedMembers = Object.keys(channel.state?.members || {});
      console.log(
        `[StreamService] Channel ${channelId} members after add:`,
        updatedMembers
      );
    } else {
      console.log(
        `[StreamService] User ${userId} already a member of channel ${channelId}`
      );
    }
  } catch (error) {
    console.error(`[StreamService] Error adding user to channel:`, error);
    throw error;
  }
};

async function joinChannelIfNeeded(channelId, userId, type) {
  const channel = streamClient.channel(type, channelId);
  await channel.watch();
  const currentMembers = Object.keys(channel.state?.members || {});
  if (!currentMembers.includes(userId)) {
    await channel.addMembers([userId]);
    await channel.watch(); // Only if needed
  }
}
