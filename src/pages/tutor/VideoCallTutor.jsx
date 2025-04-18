import React, { useEffect, useState, useRef, useContext } from "react";
import { ClassContext } from "../../context/ClassContext";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import "stream-chat-react/dist/css/v2/index.css";
import "./VideoCallTutor.css";
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

// Updated import to use the new token functions
import {
  streamClient,
  streamVideoClient,
  fetchChatToken,
  fetchVideoToken,
} from "../../config/stream";
import { canCreateBreakoutRooms } from "./BreakoutRoomUtils";

// Icons
import {
  Video,
  Grid3x3,
  Users,
  LayoutGrid,
  MessageSquare,
  Settings,
  Maximize,
  Minimize,
  X,
} from "lucide-react";
import EnhancedCallPreview from "../../components/CallPreview";

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
        <Video size={40} className="text-blue-400" />
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

// Main component
const VideoCallTutor = () => {
  const { tutorSelectedClassId } = useContext(ClassContext);
  const [classData, setClassData] = useState(null);
  const [currentCall, setCurrentCall] = useState(null);
  const [isCallJoined, setIsCallJoined] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Joining call...");
  const [layout, setLayout] = useState("grid"); // 'grid' or 'speaker'

  // Chat related states
  const [chatChannel, setChatChannel] = useState(null);

  // Breakout room states
  const [breakoutRooms, setBreakoutRooms] = useState([]);
  const [hasBreakoutPermission, setHasBreakoutPermission] = useState(false);
  const [isBreakoutModalOpen, setIsBreakoutModalOpen] = useState(false);
  const [isCreatingRooms, setIsCreatingRooms] = useState(false);
  const [numRooms, setNumRooms] = useState(2);
  const [roomDuration, setRoomDuration] = useState(15);
  const [availableSlots, setAvailableSlots] = useState(5);
  const [isBreakoutPanelOpen, setIsBreakoutPanelOpen] = useState(false);

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
    if (!tutorSelectedClassId) return;

    const fetchClassData = async () => {
      try {
        setLoadingMessage("Loading class data...");
        const classDocRef = doc(db, "classes", tutorSelectedClassId);
        const classDocSnap = await getDoc(classDocRef);

        if (classDocSnap.exists()) {
          setClassData(classDocSnap.data());
          // Default to the main class room ID
          setActiveRoomId(tutorSelectedClassId);

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

    // Add extensive debugging for breakout room permissions
    const userInfo = JSON.parse(sessionStorage.getItem("user") || "{}");
    console.log("[PERMISSION DEBUG] User info:", {
      uid: userInfo.uid,
      userType: userInfo.userType,
      adminOfClasses: userInfo.adminOfClasses || [],
      tutorOfClasses: userInfo.tutorOfClasses || [],
    });

    const hasPermission = canCreateBreakoutRooms(tutorSelectedClassId);
    console.log(
      "[PERMISSION DEBUG] Checking permission for class:",
      tutorSelectedClassId
    );
    console.log("[PERMISSION DEBUG] Permission result:", hasPermission);

    // For tutors, force permission if sessionStorage data confirms they're a tutor
    if (
      userInfo.userType === "tutor" &&
      userInfo.tutorOfClasses &&
      userInfo.tutorOfClasses.includes(tutorSelectedClassId)
    ) {
      console.log(
        "[PERMISSION DEBUG] User is confirmed tutor for this class, forcing permission"
      );
      setHasBreakoutPermission(true);
    } else {
      setHasBreakoutPermission(hasPermission);
    }
  }, [tutorSelectedClassId]);

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
        const isBreakoutRoom =
          activeRoomId && activeRoomId !== tutorSelectedClassId;
        const channelId = isBreakoutRoom
          ? `${currentDay}${tutorSelectedClassId}${activeRoomId}`
          : `${currentDay}${tutorSelectedClassId}`;

        console.log(`[CHAT DEBUG] Looking for channel with ID: ${channelId}`);
        console.log(
          `[CHAT DEBUG] Day: ${currentDay}, ClassId: ${tutorSelectedClassId}, ActiveRoomId: ${activeRoomId}`
        );

        // IMPORTANT: First check if the channel already exists
        try {
          // Query to find the existing channel
          const filter = { type: "messaging", id: channelId };
          // FIX: Change sort direction from -1 (number) to "-1" (string)
          const sort = [{ field: "created_at", direction: "-1" }];

          console.log(
            `[CHAT DEBUG] Querying for existing channel with filter:`,
            filter,
            "sort:",
            sort
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
            } Chat`
          : `Class ${tutorSelectedClassId} Chat`;

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
    tutorSelectedClassId,
    streamClient,
    activeRoomId,
    breakoutRooms,
  ]);

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
    if (tutorSelectedClassId && !isCallJoined) {
      joinRoom(tutorSelectedClassId);
    }

    return () => {
      if (callInstanceRef.current) {
        callInstanceRef.current.leave().catch(console.error);
      }
    };
  }, [tutorSelectedClassId]);

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
        const isBreakoutRoom = roomId !== tutorSelectedClassId;

        // The channel ID follows the format: [day][classId] or [day][classId][breakoutRoomId]
        const channelId = isBreakoutRoom
          ? `${currentDay}${tutorSelectedClassId}${roomId}`
          : `${currentDay}${tutorSelectedClassId}`;

        // Add custom data to link the video call with the chat channel
        const callData = {
          custom: {
            channelCid: `${channelId}`,
            classId: tutorSelectedClassId,
          },
        };

        console.log("Call data:", callData);

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
    if (!tutorSelectedClassId) return;

    try {
      const breakoutRef = collection(
        db,
        "conference_calls",
        tutorSelectedClassId,
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
    setIsCreatingRooms(true);

    try {
      if (!classData) return;

      const conferenceDocRef = doc(
        db,
        "conference_calls",
        tutorSelectedClassId
      );
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

      setIsBreakoutModalOpen(false);
      await fetchBreakoutRooms();
      setIsBreakoutPanelOpen(true);
    } catch (error) {
      console.error("Error creating breakout rooms:", error);
    } finally {
      setIsCreatingRooms(false);
    }
  };

  // Update room members
  const updateRoomMembers = async (roomId, isJoining = true) => {
    try {
      const breakoutRoomRef = doc(
        db,
        "conference_calls",
        tutorSelectedClassId,
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
  const joinBreakoutRoom = async (room) => {
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
        tutorSelectedClassId,
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
    setIsBreakoutPanelOpen(false);

    // Set up auto-return timer if room has an end time
    if (room.classEndTime) {
      const now = new Date();
      const endTime = room.classEndTime.toDate();
      const remainingMs = endTime - now;

      if (remainingMs > 0) {
        setTimeout(() => {
          joinMainRoom();
        }, remainingMs);
      }
    }
  };

  // Return to main room
  const joinMainRoom = async () => {
    // If in a breakout room, remove from members
    if (activeRoomId !== tutorSelectedClassId) {
      await updateRoomMembers(activeRoomId, false);
    }

    // Join main room
    await joinRoom(tutorSelectedClassId);
  };

  // Handle call leaving
  const handleLeaveCall = async () => {
    try {
      if (callInstanceRef.current) {
        // If in breakout room, update members
        if (activeRoomId !== tutorSelectedClassId) {
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

  // Render Breakout Rooms Panel
  const renderBreakoutPanel = () => {
    if (!isBreakoutPanelOpen) return null;

    return (
      <div className="breakout-panel">
        <div className="panel-header">
          <h3>Breakout Rooms</h3>
          <button onClick={() => setIsBreakoutPanelOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="panel-content">
          {/* Main Room Button */}
          <div className="room-item main-room">
            <button
              onClick={joinMainRoom}
              className={activeRoomId === tutorSelectedClassId ? "active" : ""}
            >
              <div className="room-name">Main Room</div>
              <div className="room-info">Return to main class</div>
              {activeRoomId === tutorSelectedClassId && (
                <span className="status-badge">Current</span>
              )}
            </button>
          </div>

          {/* Breakout Rooms */}
          <h4 className="section-title">Available Rooms:</h4>
          <div className="rooms-list">
            {breakoutRooms.length > 0 ? (
              breakoutRooms.map((room) => {
                const isFull = room.roomMembers.length >= room.availableSlots;
                const isActive = activeRoomId === room.id;
                const hasStarted = !!room.startedAt;

                let timeRemaining = null;
                if (hasStarted && room.classEndTime) {
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
                    className={`room-item ${isActive ? "active" : ""} ${
                      isFull ? "full" : ""
                    }`}
                  >
                    <div className="room-details">
                      <div className="room-name">
                        {room.roomName || `Breakout Room`}
                      </div>
                      <div className="room-info">
                        {room.roomMembers.length}/{room.availableSlots}{" "}
                        participants
                      </div>
                      {timeRemaining && (
                        <div className="time-remaining">
                          Ends in: {timeRemaining}
                        </div>
                      )}
                    </div>

                    <div className="room-actions">
                      {!isActive && !isFull && (
                        <button
                          onClick={() => joinBreakoutRoom(room)}
                          className="join-button"
                        >
                          Join
                        </button>
                      )}

                      {isActive && (
                        <span className="status-badge">Current</span>
                      )}

                      {!isActive && isFull && (
                        <span className="status-badge full">Full</span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-rooms">No breakout rooms available</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Main render
  return (
    <div className="video-call-tutor" ref={videoContainerRef}>
      {currentCall && !isLoading ? (
        <>
          <EnhancedCallPreview
            streamVideoClient={streamVideoClient}
            currentCall={currentCall}
            chatClient={streamClient}
            chatChannel={chatChannel}
          />

          {/* Floating action buttons */}
          <div className="floating-actions">
            {/* Breakout Rooms button for tutors */}
            {hasBreakoutPermission && (
              <button
                onClick={() => {
                  isBreakoutPanelOpen
                    ? setIsBreakoutPanelOpen(false)
                    : fetchBreakoutRooms().then(() =>
                        setIsBreakoutPanelOpen(true)
                      );
                }}
                className={`action-button ${
                  isBreakoutPanelOpen ? "active" : ""
                }`}
                title="Breakout Rooms"
              >
                <Grid3x3 size={22} />
              </button>
            )}

            {/* Create Breakout Rooms button for tutors */}
            {hasBreakoutPermission && (
              <button
                onClick={() => setIsBreakoutModalOpen(true)}
                className="action-button create-room"
                title="Create Breakout Rooms"
              >
                <Users size={22} />
              </button>
            )}
          </div>

          {/* Render Breakout Room panel if open */}
          {renderBreakoutPanel()}
        </>
      ) : (
        // Loading state while connecting to call
        <LoadingSpinner message={loadingMessage} />
      )}

      {/* Create Breakout Rooms Modal */}
      <Modal
        isOpen={isBreakoutModalOpen}
        onClose={() => setIsBreakoutModalOpen(false)}
        title="Create Breakout Rooms"
        size="lg"
      >
        <div className="breakout-modal">
          <div className="modal-section">
            <label className="section-label">Number of Rooms</label>
            <div className="slider-container">
              <input
                type="range"
                min="1"
                max="10"
                value={numRooms}
                onChange={(e) => setNumRooms(parseInt(e.target.value))}
                className="slider"
              />
              <span className="slider-value">{numRooms}</span>
            </div>
          </div>

          <div className="modal-section">
            <label className="section-label">Room Duration (minutes)</label>
            <select
              value={roomDuration}
              onChange={(e) => setRoomDuration(parseInt(e.target.value))}
              className="select-input"
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

          <div className="modal-section">
            <label className="section-label">Available Slots per Room</label>
            <div className="slider-container">
              <input
                type="range"
                min="2"
                max="10"
                value={availableSlots}
                onChange={(e) => setAvailableSlots(parseInt(e.target.value))}
                className="slider"
              />
              <span className="slider-value">{availableSlots}</span>
            </div>
          </div>

          {/* Preview of room distribution */}
          <div className="room-preview">
            <h3 className="preview-title">Room Preview:</h3>
            <div className="room-grid">
              {Array.from({ length: Math.min(numRooms, 10) }).map(
                (_, index) => (
                  <div key={index} className="room-preview-item">
                    <p className="room-number">Room {index + 1}</p>
                    <p className="room-slots">{availableSlots} slots</p>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="modal-actions">
            <button
              onClick={() => setIsBreakoutModalOpen(false)}
              className="cancel-button"
            >
              Cancel
            </button>
            <button
              onClick={createBreakoutRooms}
              disabled={isCreatingRooms}
              className="create-button"
            >
              {isCreatingRooms ? (
                <>
                  <svg className="spinner" viewBox="0 0 24 24">
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      fill="none"
                      strokeWidth="4"
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
    </div>
  );
};

export default VideoCallTutor;
