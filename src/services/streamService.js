// src/services/streamService.js
import { streamClient } from "../config/stream";

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
    // Create the channel with the provided data
    const channel = streamClient.channel(type, id, {
      name,
      members,
      image,
      description,
      member_roles,
    });

    // Watch the channel
    const response = await channel.watch();

    // Verify channel creation
    const createdChannel = await streamClient.queryChannels({ id: id });

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
    const channel = streamClient.channel(type, channelId);
    await channel.watch();

    const response = await channel.addMembers([
      {
        user_id: userId,
        role: role,
      },
    ]);

    return response;
  } catch (error) {
    console.error("Error adding member to stream channel:", error.message);
    if (error.response) {
      console.error("Error response:", error.response);
    }
    throw error;
  }
};

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
