// This is a utility function to update Stream chat channel names
import { streamClient } from "../../config/stream";

/**
 * Updates the name and metadata of a Stream chat channel
 * @param {string} channelType - The type of channel (e.g., "premium_individual_class")
 * @param {string} channelId - The ID of the channel to update
 * @param {object} updateData - Object containing name, description, and image properties
 * @returns {Promise} - Promise resolving to the updated channel
 */
export const updateStreamChannelMetadata = async (
  channelType,
  channelId,
  updateData,
) => {
  try {
    // Get a reference to the channel
    const channel = streamClient.channel(channelType, channelId);

    // Update the channel with the provided data
    await channel.update({
      name: updateData.name,
      description: updateData.description || "",
      image: updateData.image || "",
      // Add any other metadata you want to update
    });

    return channel;
  } catch (error) {
    console.error(`Error updating ${channelType} channel ${channelId}:`, error);
    throw error;
  }
};
