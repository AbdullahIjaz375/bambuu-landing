import { streamClient } from "../config/stream";
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
  member_roles,
}) => {
  try {
    // Ensure all members exist in Stream before creating the channel
    await Promise.all(members.map((userId) => ensureUserExists(userId)));

    // Before creating the channel, make sure we have the latest data from Firestore
    // This ensures that the channel name and image are correctly set
    let firestoreData = null;
    try {
      if (type === "standard_group" || type === "premium_group") {
        // It's a group channel - fetch from groups collection
        const groupDoc = await getDoc(doc(db, "groups", id));
        if (groupDoc.exists()) {
          firestoreData = groupDoc.data();
          console.log(
            `Found Firestore group data for ${id}: ${firestoreData.groupName}`
          );
          // Update parameters with Firestore data
          name = firestoreData.groupName || name;
          image = firestoreData.imageUrl || image;
          description = firestoreData.groupDescription || description;
        }
      } else if (type === "premium_individual_class") {
        // It's a class channel - fetch from classes collection
        const classDoc = await getDoc(doc(db, "classes", id));
        if (classDoc.exists()) {
          firestoreData = classDoc.data();
          console.log(
            `Found Firestore class data for ${id}: ${firestoreData.className}`
          );
          // Update parameters with Firestore data
          name = firestoreData.className || name;
          image = firestoreData.imageUrl || image;
          description = firestoreData.classDescription || description;
        }
      }
    } catch (firestoreErr) {
      console.error(
        `Failed to fetch Firestore data for channel ${id}:`,
        firestoreErr
      );
    }

    console.log(
      `Creating channel ${id} with name: "${name}", image: "${image}"`
    ); // Create the channel with the provided data
    const channel = streamClient.channel(type, id, {
      name,
      members,
      image,
      description,
      member_roles,
    });

    // Watch the channel
    await channel.watch(); // For premium groups and classes, use simple configuration without permission changes
    if (type === "premium_group" || type === "premium_individual_class") {
      try {
        // Get the creator ID (usually the first member or explicitly provided)
        const creatorId = members && members.length > 0 ? members[0] : null;

        // Import helper dynamically to avoid circular dependencies
        const { setupChannelProperties } = await import(
          "./streamChannelHelpers"
        );

        // Set up channel properties (without modifying permissions)
        await setupChannelProperties(channel, type, creatorId);

        console.log(`Premium channel ${id} configured`);
      } catch (error) {
        console.error(`Failed to configure premium channel: ${error.message}`);
        // Continue anyway - the channel is created
      }
    }

    // Verify channel creation (but don't need to save the result)
    await streamClient.queryChannels({ id });

    return channel;
  } catch (error) {
    console.error("Error creating stream channel:", error.message);
    if (error.response) {
      console.error("Error response:", error.response);
    }
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

    // Fetch the group or class data from Firestore to sync with Stream
    let firestoreData = null;
    let groupAdminId = null;

    try {
      if (type === "standard_group" || type === "premium_group") {
        // It's a group channel - fetch from groups collection
        const groupDoc = await getDoc(doc(db, "groups", channelId));
        if (groupDoc.exists()) {
          firestoreData = groupDoc.data();
          groupAdminId = firestoreData.groupAdminId;
          console.log(
            `Found Firestore group data for ${channelId}: ${firestoreData.groupName}`
          );
        }
      } else if (type === "premium_individual_class") {
        // It's a class channel - fetch from classes collection
        const classDoc = await getDoc(doc(db, "classes", channelId));
        if (classDoc.exists()) {
          firestoreData = classDoc.data();
          console.log(
            `Found Firestore class data for ${channelId}: ${firestoreData.className}`
          );
        }
      }
    } catch (firestoreErr) {
      console.error(
        `Failed to fetch Firestore data for channel ${channelId}:`,
        firestoreErr
      );
    }
    // New approach - use a simple and direct method without modifying permissions
    let response;
    try {
      // Import helper dynamically to avoid circular dependencies
      const { addUserToChannel } = await import("./streamChannelHelpers");

      if (type === "premium_group" || type === "premium_individual_class") {
        console.log(`Using direct approach for premium content type: ${type}`);

        // Determine the appropriate role (admin gets channel_moderator)
        const memberRole =
          groupAdminId === userId
            ? "channel_moderator"
            : role || "channel_member";

        // Use the direct helper to add user
        response = await addUserToChannel(channelId, userId, type, memberRole);
        // For premium channels, we don't try to update the channel directly
        // as regular users don't have permission to do this
        if (response && firestoreData) {
          console.log(
            `Channel ${channelId} was updated in Firestore - Stream will sync via backend`
          );
        }
      } else {
        // For standard channels, proceed as normal
        const channel = streamClient.channel(type, channelId);
        await channel.watch();

        // Log current members before adding
        const state = channel.state;
        const currentMembers = Object.keys(state?.members || {});
        console.log(`Current channel members: ${currentMembers.join(", ")}`);

        // Update channel data from Firestore if available
        if (firestoreData) {
          await updateChannelWithFirestoreData(channel, firestoreData);
        }

        response = await channel.addMembers([{ user_id: userId, role: role }]);

        console.log(
          `Successfully added user ${userId} to channel ${channelId}`
        );
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
  } // Only update if we have something to update
  if (Object.keys(updateData).length > 0) {
    try {
      // Check if the type is premium - if so, avoid direct updates which require elevated permissions
      if (
        channel.type === "premium_group" ||
        channel.type === "premium_individual_class"
      ) {
        console.log(
          `Skipping direct channel update for ${channel.id} as it's a premium channel`
        );
        // Just return the data without trying to update (avoid permission errors)
        return updateData;
      } else {
        // For standard channels, we can update directly
        console.log(`Updating channel ${channel.id} with data:`, updateData);
        await channel.update(updateData);
      }
    } catch (updateErr) {
      console.error(
        `Failed to update channel ${channel.id} with Firestore data:`,
        updateErr
      );
      // Continue anyway as this is not critical
    }
  }
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
            `Premium channel ${channelId} update - skipping direct update to avoid permission errors`
          );

          try {
            // Get the admin ID for this channel
            const adminId = firestoreData.groupAdminId || null;

            // For premium channels, just log the update data
            console.log(
              `Firestore data for premium channel ${channelId}:`,
              updateData
            );

            // If this user is the admin, they might be able to update properties
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
              `Skipped channel property updates: ${permError.message}`
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

        return {
          success: true,
          message: "Channel updated successfully",
          data: updateData,
        };
      }

      return { success: true, message: "No updates needed" };
    } catch (error) {
      console.error(
        `Error syncing channel ${channelId} with Firestore:`,
        error
      );
      return { success: false, message: error.message };
    }
  });
};

// This function was replaced by addUserToChannel in streamChannelHelpers.js
