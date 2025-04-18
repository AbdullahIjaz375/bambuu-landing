//BreakoutRoomUtils.js
/**
 * Utility functions for breakout room management in VideoCallTutor
 */

/**
 * Check if the current user has permission to create breakout rooms
 * @param {string} classId - The ID of the current class
 * @returns {boolean} - Whether the user has permission
 */
export const canCreateBreakoutRooms = (classId) => {
  try {
    const user = JSON.parse(sessionStorage.getItem("user"));
    console.log(
      "[PERMISSION DEBUG] canCreateBreakoutRooms called with classId:",
      classId
    );
    console.log("[PERMISSION DEBUG] User from sessionStorage:", user);

    if (!user) {
      console.log("[PERMISSION DEBUG] No user found in sessionStorage");
      return false;
    }

    const { userType, adminOfClasses = [], tutorOfClasses = [] } = user;
    console.log("[PERMISSION DEBUG] User details:", {
      userType,
      adminOfClasses,
      tutorOfClasses,
      classId,
    });

    // Students can create breakout rooms if they are class admins
    if (userType === "student") {
      const hasPermission = adminOfClasses.includes(classId);
      console.log(
        "[PERMISSION DEBUG] Student permission check:",
        hasPermission
      );
      return hasPermission;
    }
    // Tutors can create breakout rooms for their classes
    else if (userType === "tutor") {
      const hasPermission = tutorOfClasses.includes(classId);
      console.log("[PERMISSION DEBUG] Tutor permission check:", hasPermission);
      return hasPermission;
    }

    console.log("[PERMISSION DEBUG] User is neither student nor tutor");
    return false;
  } catch (error) {
    console.error(
      "[PERMISSION DEBUG] Error checking breakout room permissions:",
      error
    );
    return false;
  }
};

/**
 * Format a breakout room's end time for display
 * @param {Date} date - The end time date object
 * @returns {string} - Formatted time string
 */
export const formatRoomEndTime = (date) => {
  if (!date) return "Not started";

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Check if a breakout room has expired
 * @param {Object} room - The breakout room object
 * @returns {boolean} - Whether the room has expired
 */
export const isRoomExpired = (room) => {
  if (!room.startedAt || !room.classEndTime) return false;

  const now = new Date();
  const endTime = room.classEndTime.toDate();

  return now > endTime;
};

/**
 * Format the remaining time for a breakout room
 * @param {Object} room - The breakout room object
 * @returns {string} - Formatted remaining time
 */
export const formatRemainingTime = (room) => {
  if (!room.startedAt || !room.classEndTime) return "Not started";

  const now = new Date();
  const endTime = room.classEndTime.toDate();

  // If expired
  if (now > endTime) return "Expired";

  // Calculate remaining time
  const diffInMs = endTime - now;
  const diffInMinutes = Math.floor(diffInMs / 60000);
  const diffInSeconds = Math.floor((diffInMs % 60000) / 1000);

  if (diffInMinutes <= 0) {
    return `${diffInSeconds}s remaining`;
  }

  return `${diffInMinutes}m ${diffInSeconds}s remaining`;
};

/**
 * Calculate the remaining time in milliseconds for a breakout room
 * @param {Object} room - The breakout room object
 * @returns {number} - Remaining time in milliseconds, or 0 if expired/not started
 */
export const getRemainingTimeMs = (room) => {
  if (!room.startedAt || !room.classEndTime) return 0;

  const now = new Date();
  const endTime = room.classEndTime.toDate();

  // If expired
  if (now > endTime) return 0;

  // Calculate remaining time
  return endTime - now;
};

/**
 * Check if a user is in a particular breakout room
 * @param {string} userId - The user ID to check
 * @param {Object} room - The breakout room object
 * @returns {boolean} - Whether the user is in the room
 */
export const isUserInRoom = (userId, room) => {
  if (!room.roomMembers || !Array.isArray(room.roomMembers)) return false;

  return room.roomMembers.includes(userId);
};

/**
 * Check if a breakout room is full
 * @param {Object} room - The breakout room object
 * @returns {boolean} - Whether the room is full
 */
export const isRoomFull = (room) => {
  if (
    !room.roomMembers ||
    !Array.isArray(room.roomMembers) ||
    !room.availableSlots
  ) {
    return false;
  }

  return room.roomMembers.length >= room.availableSlots;
};

export default {
  canCreateBreakoutRooms,
  formatRoomEndTime,
  isRoomExpired,
  formatRemainingTime,
  getRemainingTimeMs,
  isUserInRoom,
  isRoomFull,
};
