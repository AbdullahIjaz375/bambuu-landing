import React, { useEffect, useState, useRef, useContext } from "react";
import { ClassContext } from "../../context/ClassContext";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import "stream-chat-react/dist/css/v2/index.css";
import "./VideoCallStudent.css";
import axios from "axios";

import { db } from "../../firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  Timestamp,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";

import {
  streamClient,
  streamVideoClient,
  fetchChatToken,
  fetchVideoToken,
} from "../../config/stream";

// Icons
import { CopyPlus, Users, LogOut, X, MessageSquare } from "lucide-react";
import EnhancedCallPreview from "../../components/CallPreview";

/* Utility to check breakout room creation permissions */
const canCreateBreakoutRooms = (classId) => {
  try {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (!user) return false;

    const { userType, adminOfClasses = [], tutorOfClasses = [] } = user;

    if (userType === "student") {
      return adminOfClasses.includes(classId);
    } else if (userType === "tutor") {
      return tutorOfClasses.includes(classId);
    }
    return false;
  } catch (error) {
    console.error("Error checking breakout room permissions:", error);
    return false;
  }
};

// Improved modal component with animation
const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    full: "max-w-full",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
      <div
        className={`${sizeClasses[size]} w-full bg-white rounded-xl shadow-2xl overflow-hidden animate-scale-in`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 rounded-full hover:bg-gray-100 transition duration-200"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

// Loading spinner component
const LoadingSpinner = ({ message }) => (
  <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-900">
    <div className="animate-pulse flex flex-col items-center text-center max-w-md">
      <div className="rounded-full bg-gray-800 h-24 w-24 mb-6 flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-blue-400"
        >
          <path d="M23 7l-7 5 7 5V7z"></path>
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
        </svg>
      </div>
      <h2 className="text-white text-2xl font-medium mb-2">
        {message || "Joining call..."}
      </h2>
      <p className="text-gray-400 mb-8">Setting up your video and audio</p>
      <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 animate-progress-bar"></div>
      </div>
    </div>
  </div>
);

const VideoCallStudent = () => {
  const { selectedClassId } = useContext(ClassContext);
  const [classData, setClassData] = useState(null);
  const [currentCall, setCurrentCall] = useState(null);
  const [isCallJoined, setIsCallJoined] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Joining call...");
  const [layout, setLayout] = useState("grid"); // 'grid' or 'speaker'

  // Chat related states
  const [chatChannel, setChatChannel] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Breakout room states
  const [breakoutRooms, setBreakoutRooms] = useState([]);
  const [hasBreakoutPermission, setHasBreakoutPermission] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [numRooms, setNumRooms] = useState(2);
  const [roomDuration, setRoomDuration] = useState(15);
  const [availableSlots, setAvailableSlots] = useState(5);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Other states
  const callInstanceRef = useRef(null);
  const videoContainerRef = useRef(null);
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

  const fetchToken = async (userId) => {
    try {
      const response = await axios.post(
        `https://generatechattoken-3idvfneyra-uc.a.run.app`,
        {
          userId,
          userName:
            JSON.parse(sessionStorage.getItem("user") || "{}").name || "User",
          userImage:
            JSON.parse(sessionStorage.getItem("user") || "{}").photoUrl || "",
        }
      );
      return response.data.token;
    } catch (error) {
      console.error("Failed to fetch token:", error);
      throw new Error("Could not fetch authentication token");
    }
  };

  const fetchVideoToken = async (userId) => {
    try {
      const response = await axios.post(
        `https://generatevideotoken-3idvfneyra-uc.a.run.app`,
        {
          userId,
        }
      );
      return response.data.token;
    } catch (error) {
      console.error("Failed to fetch video token:", error);
      throw new Error("Could not fetch video authentication token");
    }
  };

  // Fetch class data
  useEffect(() => {
    if (!selectedClassId) return;

    const fetchClassData = async () => {
      try {
        setLoadingMessage("Loading class data...");
        const classDocRef = doc(db, "classes", selectedClassId);
        const classDocSnap = await getDoc(classDocRef);

        if (classDocSnap.exists()) {
          setClassData(classDocSnap.data());
          // Default to the main class room ID
          setActiveRoomId(selectedClassId);

          // Fetch breakout rooms if they exist
          fetchBreakoutRooms();
        } else {
          console.log("No such class document!");
        }
      } catch (error) {
        console.error("Error fetching class data:", error);
      }
    };

    fetchClassData();

    // Check breakout room permissions
    setHasBreakoutPermission(canCreateBreakoutRooms(selectedClassId));
  }, [selectedClassId]);

  // Initialize chat channel when class data is available
  useEffect(() => {
    if (!streamClient || !classData || !user.uid) return;

    const initializeChannel = async () => {
      try {
        // Make sure user is connected to Stream Chat before initializing the channel
        if (!streamClient.userID) {
          console.log("[CHAT DEBUG] Connecting user to Stream Chat...");
          // Generate token for chat
          const token = await fetchToken(user.uid);

          // Connect user to chat
          await streamClient.connectUser(
            {
              id: user.uid,
              name: user.name || "User",
              image: user.photoUrl || "",
            },
            token
          );
          console.log(
            "[CHAT DEBUG] User connected to Stream Chat successfully"
          );
        }

        // Get the current day abbreviation
        const dayAbbreviations = [
          "Sun",
          "Mon",
          "Tue",
          "Wed",
          "Thu",
          "Fri",
          "Sat",
        ];
        const currentDay = dayAbbreviations[new Date().getDay()];

        // Now create or get the chat channel with day prefix
        // For main room: [DayAbbrev][ClassId]
        // For breakout room: [DayAbbrev][ClassId][BreakoutRoomId]
        const isBreakoutRoom = activeRoomId && activeRoomId !== selectedClassId;
        const channelId = isBreakoutRoom
          ? `${currentDay}${selectedClassId}${activeRoomId}`
          : `${currentDay}${selectedClassId}`;

        console.log(`[CHAT DEBUG] Looking for channel with ID: ${channelId}`);
        console.log(
          `[CHAT DEBUG] Day: ${currentDay}, ClassId: ${selectedClassId}, ActiveRoomId: ${activeRoomId}`
        );

        // IMPORTANT: First check if the channel already exists
        try {
          // Query to find the existing channel
          const filter = { type: "messaging", id: channelId };
          const sort = [{ field: "created_at", direction: -1 }];

          console.log(
            `[CHAT DEBUG] Querying for existing channel with filter:`,
            filter
          );
          const channels = await streamClient.queryChannels(filter, sort, {
            watch: true,
            state: true,
          });

          if (channels && channels.length > 0) {
            console.log(`[CHAT DEBUG] Found existing channel: ${channelId}`);
            const existingChannel = channels[0];

            // Make sure current user is a member
            await existingChannel.addMembers([user.uid]);
            console.log(
              `[CHAT DEBUG] Added current user to existing channel's members`
            );

            setChatChannel(existingChannel);
            return; // Exit early since we found and joined the channel
          } else {
            console.log(
              `[CHAT DEBUG] No existing channel found, will create new one`
            );
          }
        } catch (queryError) {
          console.error(`[CHAT DEBUG] Error querying channels:`, queryError);
          // Continue to channel creation if query fails
        }

        // If no existing channel was found, create a new one
        console.log(
          `[CHAT DEBUG] Creating new chat channel with ID: ${channelId}`
        );

        const chatRoomName = isBreakoutRoom
          ? `${
              breakoutRooms.find((room) => room.id === activeRoomId)
                ?.roomName || "Breakout Room"
            } Call Chat`
          : `Class ${selectedClassId} Chat`;

        const channel = streamClient.channel("messaging", channelId, {
          name: chatRoomName,
          members: [user.uid],
          created_by_id: user.uid,
        });

        await channel.watch();
        console.log(
          `[CHAT DEBUG] Successfully created and watching new channel: ${channelId}`
        );
        setChatChannel(channel);
      } catch (error) {
        console.error("[CHAT DEBUG] Error initializing chat channel:", error);
      }
    };

    initializeChannel();
  }, [
    classData,
    user.uid,
    selectedClassId,
    streamClient,
    activeRoomId,
    breakoutRooms,
  ]);

  // Listen for new messages when chat is not open
  useEffect(() => {
    if (!chatChannel || isChatOpen) return;

    const handleNewMessage = (event) => {
      // Only increment for messages from other users
      if (event.user.id !== streamClient.userID) {
        setUnreadMessages((prev) => prev + 1);
      }
    };

    chatChannel.on("message.new", handleNewMessage);

    return () => {
      chatChannel.off("message.new", handleNewMessage);
    };
  }, [chatChannel, isChatOpen, streamClient]);

  // Check for WebRTC support
  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert(
        "Your browser doesn't support video calls. Please use a modern browser like Chrome, Firefox, or Safari."
      );
      return;
    }

    // Check for permissions
    navigator.permissions
      .query({ name: "camera" })
      .then((cameraPermission) => {
        if (cameraPermission.state === "denied") {
          alert(
            "Camera permission is denied. Please enable camera access in your browser settings."
          );
        }
      })
      .catch((err) => console.log("Permission query not supported"));
  }, []);

  // Set up reconnection handler
  useEffect(() => {
    if (currentCall) {
      const handleReconnect = () => {
        setLoadingMessage("Reconnecting to call...");
        setIsLoading(true);
      };

      const handleReconnected = () => {
        setIsLoading(false);
      };

      currentCall.on("reconnecting", handleReconnect);
      currentCall.on("connected", handleReconnected);

      return () => {
        currentCall.off("reconnecting", handleReconnect);
        currentCall.off("connected", handleReconnected);
      };
    }
  }, [currentCall]);

  // Initialize call on mount
  useEffect(() => {
    if (selectedClassId && !isCallJoined) {
      joinRoom(selectedClassId);
    }

    return () => {
      if (callInstanceRef.current) {
        callInstanceRef.current.leave().catch(console.error);
      }
    };
  }, [selectedClassId]);

  // Join a room function
  const joinRoom = async (roomId) => {
    try {
      console.log("Joining room:", roomId);
      setIsLoading(true);
      setLoadingMessage("Connecting to call...");

      // Get user data once
      const user = JSON.parse(sessionStorage.getItem("user") || "{}");

      if (!user || !user.uid) {
        console.error("No valid user found in session storage");
        alert(
          "You need to be logged in to join a call. Please log in and try again."
        );
        setIsLoading(false);
        return;
      }

      // Make sure user is connected to Stream Chat
      if (!streamClient.userID) {
        console.log("Connecting user to Stream Chat first...");
        setLoadingMessage("Initializing chat...");

        try {
          // Generate token for chat
          const chatToken = await fetchToken(user.uid);

          // Connect user to chat
          await streamClient.connectUser(
            {
              id: user.uid,
              name: user.name || "User",
              image: user.photoUrl || "",
            },
            chatToken
          );
          console.log("User connected to Stream Chat successfully");
        } catch (chatErr) {
          console.error("Failed to connect user to Stream Chat:", chatErr);
          // Continue with video - chat error is not fatal
        }
      }

      // Check if we need to connect the user to Stream Video
      if (!streamVideoClient.user || streamVideoClient.user.id !== user.uid) {
        console.log("Connecting user to Stream Video...");
        setLoadingMessage("Authenticating...");

        try {
          // Disconnect any existing user to avoid the consecutive connect warning
          if (streamVideoClient.user) {
            await streamVideoClient.disconnectUser();
          }

          // Use the simplest token approach for development
          const token = await fetchVideoToken(user.uid);

          // Connect with increased timeout
          await streamVideoClient.connectUser(
            {
              id: user.uid,
              name: user.name || "User",
              image: user.photoUrl || "",
              userType: user.userType || "student",
            },
            token
          );

          console.log("User connected to Stream Video successfully");
        } catch (err) {
          console.error("Failed to connect user to Stream Video:", err);
          setIsLoading(false);
          alert("Could not connect to video service. Please try again later.");
          return;
        }
      }

      // Leave previous call if exists
      if (callInstanceRef.current) {
        console.log("Leaving previous call...");
        setLoadingMessage("Switching rooms...");
        await callInstanceRef.current.leave();
        callInstanceRef.current = null;
        setCurrentCall(null);
      }

      // Create and join call with increased timeout
      console.log("Creating call instance...");
      setLoadingMessage("Joining video call...");
      const call = streamVideoClient.call("default", roomId);

      try {
        console.log("Joining call with extended timeout...");

        // Get the current day abbreviation
        const dayAbbreviations = [
          "Sun",
          "Mon",
          "Tue",
          "Wed",
          "Thu",
          "Fri",
          "Sat",
        ];
        const currentDay = dayAbbreviations[new Date().getDay()];

        // Determine if we're in a breakout room
        const isBreakoutRoom = roomId !== selectedClassId;

        // The channel ID follows the format: [day][classId] or [day][classId][breakoutRoomId]
        const channelId = isBreakoutRoom
          ? `${currentDay}${selectedClassId}${roomId}`
          : `${currentDay}${selectedClassId}`;

        // Add custom data to link the video call with the chat channel
        // IMPORTANT: Must include "messaging:" prefix for the channel reference to work
        const callData = {
          custom: {
            channelCid: `${channelId}`,
            classId: selectedClassId,
          },
        };

        console.log(
          `[CHAT DEBUG] Setting call data with channelCid: messaging:${channelId}`
        );

        // Increase the timeout for joining
        await Promise.race([
          call.join({ create: true, data: callData }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Join call timeout")), 30000)
          ),
        ]);
        console.log("Call joined successfully");
      } catch (error) {
        console.error("Error joining call:", error);
        setIsLoading(false);
        if (error.message === "Join call timeout") {
          alert(
            "Connection timed out. Please check your network and try again."
          );
        } else {
          alert(
            "Could not join the video call. Please check your connection and try again."
          );
        }
        return;
      }

      // Now that we've successfully joined, update states
      callInstanceRef.current = call;
      setCurrentCall(call);
      setActiveRoomId(roomId);
      setIsCallJoined(true);

      // Enable devices after successful join
      setLoadingMessage("Enabling camera and microphone...");
      await enableDevices(call);

      setIsLoading(false);
    } catch (error) {
      console.error("Error in join room process:", error);
      setIsLoading(false);
      alert(
        "An error occurred while setting up the video call. Please refresh the page and try again."
      );
    }
  };

  // Toggle chat sidebar
  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);

    // Mark messages as read when opening chat
    if (!isChatOpen && chatChannel) {
      chatChannel.markRead();
      setUnreadMessages(0);
    }
  };

  // Enable camera and microphone
  const enableDevices = async (call) => {
    try {
      console.log("Enabling camera and microphone...");
      await call.camera.enable();
      await call.microphone.enable();
      console.log("Camera and microphone enabled successfully");
    } catch (err) {
      console.warn("Error enabling devices:", err);
    }
  };

  // Fetch breakout rooms
  const fetchBreakoutRooms = async () => {
    if (!selectedClassId) return;

    try {
      const breakoutRef = collection(
        db,
        "conference_calls",
        selectedClassId,
        "breakout_rooms"
      );
      const querySnapshot = await getDocs(breakoutRef);

      setBreakoutRooms(
        querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    } catch (error) {
      console.error("Error fetching breakout rooms:", error);
    }
  };

  // Create breakout rooms
  const createBreakoutRooms = async () => {
    setIsCreating(true);

    try {
      if (!classData) return;

      const conferenceDocRef = doc(db, "conference_calls", selectedClassId);
      const breakoutRoomsRef = collection(conferenceDocRef, "breakout_rooms");

      for (let i = 0; i < numRooms; i++) {
        const newRoomRef = await addDoc(breakoutRoomsRef, {
          availableSlots,
          classEndTime: null,
          startedAt: null,
          roomDuration,
          roomMembers: [],
          createdAt: Timestamp.now(),
          roomName: `Breakout Room ${i + 1}`,
        });

        await updateDoc(newRoomRef, { roomId: newRoomRef.id });
      }

      setIsModalOpen(false);
      await fetchBreakoutRooms();
      setIsViewModalOpen(true);
    } catch (error) {
      console.error("Error creating breakout rooms:", error);
    } finally {
      setIsCreating(false);
    }
  };

  // Update room members
  const updateRoomMembers = async (roomId, isJoining = true) => {
    try {
      const breakoutRoomRef = doc(
        db,
        "conference_calls",
        selectedClassId,
        "breakout_rooms",
        roomId
      );

      const roomDoc = await getDoc(breakoutRoomRef);
      if (!roomDoc.exists()) return;

      await updateDoc(breakoutRoomRef, {
        roomMembers: isJoining ? arrayUnion(user.uid) : arrayRemove(user.uid),
      });

      await fetchBreakoutRooms();
    } catch (error) {
      console.error("Error updating room members:", error);
    }
  };

  // Join a breakout room
  const handleJoinBreakoutRoom = async (room) => {
    // Check if room is full
    if (room.roomMembers.length >= room.availableSlots) {
      alert("This breakout room is full.");
      return;
    }

    // Initialize room start time if not started
    if (!room.startedAt) {
      const startedAt = Timestamp.now();
      const classEndTime = Timestamp.fromDate(
        new Date(startedAt.toDate().getTime() + room.roomDuration * 60 * 1000)
      );

      const breakoutRoomRef = doc(
        db,
        "conference_calls",
        selectedClassId,
        "breakout_rooms",
        room.id
      );

      await updateDoc(breakoutRoomRef, {
        startedAt,
        classEndTime,
      });

      room.startedAt = startedAt;
      room.classEndTime = classEndTime;
    }

    // Add user to room members
    await updateRoomMembers(room.id, true);

    // Join the room
    await joinRoom(room.id);
    setIsViewModalOpen(false);

    // Set up auto-return timer if room has an end time
    if (room.classEndTime) {
      const now = new Date();
      const endTime = room.classEndTime.toDate();
      const remainingMs = endTime - now;

      if (remainingMs > 0) {
        setTimeout(() => {
          joinMainClass();
        }, remainingMs);
      }
    }
  };

  // Return to main room
  const joinMainClass = async () => {
    // If in a breakout room, remove from members
    if (activeRoomId !== selectedClassId) {
      await updateRoomMembers(activeRoomId, false);
    }

    // Join main room
    await joinRoom(selectedClassId);
  };

  // Handle call leaving
  const handleLeaveCall = async () => {
    try {
      if (callInstanceRef.current) {
        // If in breakout room, update members
        if (activeRoomId !== selectedClassId) {
          await updateRoomMembers(activeRoomId, false);
        }

        // Leave call
        await callInstanceRef.current.leave();
        callInstanceRef.current = null;
        setCurrentCall(null);
        setIsCallJoined(false);

        // Redirect to dashboard
        window.location.href = "/dashboard";
      }
    } catch (error) {
      console.error("Error leaving call:", error);
    }
  };

  return (
    <div className="video-call-student" ref={videoContainerRef}>
      {currentCall && !isLoading ? (
        <>
          <EnhancedCallPreview
            streamVideoClient={streamVideoClient}
            currentCall={currentCall}
            chatClient={streamClient}
            chatChannel={chatChannel}
          />

          {/* Room indicator */}
          <div className="fixed top-8 left-8 z-[1000]">
            {activeRoomId !== selectedClassId && (
              <div className="px-4 py-2 text-white bg-green-600 rounded-xl">
                Breakout Room{" "}
                {breakoutRooms.findIndex((room) => room.id === activeRoomId) +
                  1}
              </div>
            )}
          </div>

          {/* Floating action buttons */}
          <div className="fixed bottom-4 left-12 flex gap-2 z-[1000]">
            {/* Create Breakout Rooms button (for users with permission) */}
            {hasBreakoutPermission && activeRoomId === selectedClassId && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center justify-center
                         bg-[#313443] hover:bg-[#404352]
                         text-white rounded-lg w-10 h-10
                         transition-colors duration-200
                         shadow-md"
                aria-label="Create Breakout Room"
              >
                <CopyPlus size={20} />
              </button>
            )}

            {/* View Breakout Rooms button */}
            {activeRoomId === selectedClassId && (
              <button
                onClick={() => {
                  fetchBreakoutRooms();
                  setIsViewModalOpen(true);
                }}
                className="flex items-center justify-center
                       bg-[#313443] hover:bg-[#404352]
                       text-white rounded-lg w-10 h-10
                       transition-colors duration-200
                       shadow-md"
                aria-label="View Breakout Rooms"
              >
                <Users size={20} />
              </button>
            )}

            {/* Return to Main Room button */}
            {activeRoomId !== selectedClassId && (
              <button
                onClick={joinMainClass}
                className="flex items-center justify-center
                     bg-[#313443] hover:bg-[#404352]
                     text-white rounded-lg w-10 h-10
                     transition-colors duration-200
                     shadow-md"
                aria-label="Return to Main Room"
              >
                <LogOut size={20} />
              </button>
            )}
          </div>
        </>
      ) : (
        // Loading state while connecting to call
        <LoadingSpinner message={loadingMessage} />
      )}

      {/* Create Breakout Rooms Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Breakout Rooms"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Number of Rooms
            </label>
            <div className="slider-container">
              <input
                type="range"
                min="1"
                max="10"
                value={numRooms}
                onChange={(e) => setNumRooms(parseInt(e.target.value))}
                className="w-full"
              />
              <span className="text-sm font-medium">{numRooms}</span>
            </div>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Room Duration (minutes)
            </label>
            <select
              value={roomDuration}
              onChange={(e) => setRoomDuration(parseInt(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="5">5 minutes</option>
              <option value="10">10 minutes</option>
              <option value="15">15 minutes</option>
              <option value="20">20 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">60 minutes</option>
            </select>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Available Slots per Room
            </label>
            <div className="slider-container">
              <input
                type="range"
                min="2"
                max="10"
                value={availableSlots}
                onChange={(e) => setAvailableSlots(parseInt(e.target.value))}
                className="w-full"
              />
              <span className="text-sm font-medium">{availableSlots}</span>
            </div>
          </div>

          {/* Preview of room distribution */}
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Room Preview:
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {Array.from({ length: Math.min(numRooms, 10) }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="p-2 bg-gray-100 rounded-md text-center"
                  >
                    <p className="text-sm font-medium">Room {index + 1}</p>
                    <p className="text-xs text-gray-500">
                      {availableSlots} slots
                    </p>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={createBreakoutRooms}
              disabled={isCreating}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
            >
              {isCreating ? (
                <>
                  <svg
                    className="w-4 h-4 mr-2 animate-spin"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Creating...
                </>
              ) : (
                "Create Rooms"
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* View/Join Breakout Rooms Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Breakout Rooms"
        size="lg"
      >
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {breakoutRooms.length > 0 ? (
            breakoutRooms.map((room, index) => {
              const isRoomExpired =
                room.startedAt &&
                new Date() > new Date(room.classEndTime?.toDate());

              let timeRemaining = null;
              if (room.startedAt && room.classEndTime) {
                const now = new Date();
                const endTime = room.classEndTime.toDate();
                const remainingMs = endTime - now;
                if (remainingMs > 0) {
                  const remainingMins = Math.ceil(remainingMs / (1000 * 60));
                  timeRemaining = `${remainingMins} min`;
                }
              }

              return (
                <div
                  key={room.id}
                  className="p-4 border rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {room.roomName || `Breakout Room ${index + 1}`}
                      </p>
                      <p className="text-gray-600 text-sm mt-1">
                        Members: {room.roomMembers.length}/{room.availableSlots}
                      </p>
                      {timeRemaining && (
                        <p className="text-gray-600 text-sm">
                          Ends in: {timeRemaining}
                        </p>
                      )}
                      {!room.startedAt && (
                        <p className="text-gray-600 text-sm">
                          Not started yet (Duration: {room.roomDuration} min)
                        </p>
                      )}
                    </div>

                    <button
                      className={`px-3 py-1 text-sm font-medium rounded ${
                        room.roomMembers.length >= room.availableSlots ||
                        isRoomExpired
                          ? "bg-gray-400 text-white cursor-not-allowed"
                          : room.id === activeRoomId
                          ? "bg-green-500 text-white"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                      onClick={() => {
                        if (room.id !== activeRoomId) {
                          handleJoinBreakoutRoom(room);
                          setIsViewModalOpen(false);
                        }
                      }}
                      disabled={
                        room.roomMembers.length >= room.availableSlots ||
                        isRoomExpired ||
                        room.id === activeRoomId
                      }
                    >
                      {room.roomMembers.length >= room.availableSlots
                        ? "Full"
                        : isRoomExpired
                        ? "Expired"
                        : room.id === activeRoomId
                        ? "Current"
                        : "Join"}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-4 text-center text-gray-500">
              No breakout rooms available
            </div>
          )}
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={() => setIsViewModalOpen(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default VideoCallStudent;
