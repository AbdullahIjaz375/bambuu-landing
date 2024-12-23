// src/services/streamService.js
import { streamClient, ChannelType } from "../config/stream";

export const createStreamChannel = async ({
  channelId,
  channelName,
  channelType = ChannelType.STUDENT_GROUP_CLASS,
  members,
  adminId,
  imageUrl,
  description,
}) => {
  try {
    // Create member roles array with admin as moderator
    const memberRoles = members.map((memberId) => ({
      user_id: memberId,
      role: memberId === adminId ? "moderator" : "member",
    }));

    // Create the channel
    const channel = streamClient.channel(channelType, channelId, {
      name: channelName,
      members,
      image: imageUrl,
      description,
      member_roles: memberRoles,
    });

    // Watch the channel
    await channel.watch();
    console.log("Channel successfully created:", channelId);
    return channel;
  } catch (error) {
    console.error("Error creating stream channel:", error);
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
