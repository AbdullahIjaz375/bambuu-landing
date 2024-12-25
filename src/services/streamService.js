// src/services/streamService.js
import { streamClient, ChannelType } from "../config/stream";

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
    console.log("Creating channel with data:", {
      id,
      type,
      members,
      name,
      image,
      description,
      member_roles,
    });

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
    console.log("Channel watch response:", response);

    // Verify channel creation
    const createdChannel = await streamClient.queryChannels({ id: id });
    console.log("Query result:", createdChannel);

    return channel;
  } catch (error) {
    console.error("Error creating stream channel:", error.message);
    if (error.response) {
      console.error("Error response:", error.response);
    }
    throw error;
  }
};

export const addMemberToChannel = async (channelId, memberId) => {
  try {
    const channel = streamClient.channel("student_group_class", channelId);
    await channel.addMembers([memberId]);
    console.log("Member added to channel successfully:", memberId);
  } catch (error) {
    console.error("Error adding member to channel:", error);
    throw error;
  }
};

export const removeMemberFromChannel = async (channelId, memberId) => {
  try {
    const channel = streamClient.channel("student_group_class", channelId);
    await channel.removeMembers([memberId]);
    console.log("Member removed from channel successfully:", memberId);
  } catch (error) {
    console.error("Error removing member from channel:", error);
    throw error;
  }
};
