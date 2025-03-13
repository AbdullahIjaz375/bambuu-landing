// src/components/VideoCallTutor.js
import React, { useEffect, useState, useRef, useContext } from "react";
import { ClassContext } from "../../context/ClassContext";
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
  arrayRemove
} from "firebase/firestore";

// GetStream components
import {
  StreamVideo,
  StreamCall,
  useCall,
  SpeakerLayout,
  PaginatedGridLayout,
  CallControls,
  CallParticipantsList,
  DeviceSettings,
  useCallStateHooks,
  OwnCapability
} from "@stream-io/video-react-sdk";
import { streamClient, streamVideoClient } from "../../config/stream";

// UI components
import CallHeader from "./CallHeader";
import MeetCallControls from "./MeetCallControls";
import BreakoutRoomPanel from "./BreakoutRoomPanel";
import { canCreateBreakoutRooms } from "./BreakoutRoomUtils";

// Icons
import {
  Users,
  LogOut,
  Grid,
  Layout,
  PictureInPicture,
  ChevronRight,
  Video
} from "lucide-react";

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
    full: "max-w-full"
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
      <div className={`${sizeClasses[size]} w-full bg-white rounded-xl shadow-2xl overflow-hidden animate-scale-in`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 rounded-full hover:bg-gray-100 transition duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

const VideoCallTutor = () => {
  const { tutorSelectedClassId } = useContext(ClassContext);
  const [classData, setClassData] = useState(null);
  const [currentCall, setCurrentCall] = useState(null);
  const [isCallJoined, setIsCallJoined] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // grid or speaker
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Added loading state

  // Breakout room states
  const [breakoutRooms, setBreakoutRooms] = useState([]);
  const [hasBreakoutPermission, setHasBreakoutPermission] = useState(false);
  const [isBreakoutModalOpen, setIsBreakoutModalOpen] = useState(false);
  const [isCreatingRooms, setIsCreatingRooms] = useState(false);
  const [numRooms, setNumRooms] = useState(2);
  const [roomDuration, setRoomDuration] = useState(15);
  const [availableSlots, setAvailableSlots] = useState(5);

  // UI states
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBreakoutPanelOpen, setIsBreakoutPanelOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false); // Added for Chat toggle

  // Other states
  const callInstanceRef = useRef(null);
  const videoContainerRef = useRef(null);
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

  // Fetch class data
  useEffect(() => {
    if (!tutorSelectedClassId) return;

    const fetchClassData = async () => {
      try {
        const classDocRef = doc(db, "classes", tutorSelectedClassId);
        const classDocSnap = await getDoc(classDocRef);

        if (classDocSnap.exists()) {
          setClassData(classDocSnap.data());
          // Default to the main class room ID
          setActiveRoomId(tutorSelectedClassId);
        } else {
          console.log("No such class document!");
        }
      } catch (error) {
        console.error("Error fetching class data:", error);
      }
    };

    fetchClassData();

    // Check breakout room permissions
    setHasBreakoutPermission(canCreateBreakoutRooms(tutorSelectedClassId));

  }, [tutorSelectedClassId]);

  // Add this near the top of your component
  useEffect(() => {
    // Check for WebRTC support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Your browser doesn't support video calls. Please use a modern browser like Chrome, Firefox, or Safari.");
      return;
    }

    // Check for permissions
    navigator.permissions.query({ name: 'camera' })
      .then(cameraPermission => {
        if (cameraPermission.state === 'denied') {
          alert("Camera permission is denied. Please enable camera access in your browser settings.");
        }
      })
      .catch(err => console.log("Permission query not supported"));
  }, []);

  useEffect(() => {
    if (currentCall) {
      // Set up reconnection handler
      const handleReconnect = () => {
        console.log("Attempting to reconnect to call...");
      };

      currentCall.on('reconnecting', handleReconnect);

      return () => {
        currentCall.off('reconnecting', handleReconnect);
      };
    }
  }, [currentCall]);
  // Handle fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

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

  // Update your joinRoom function with better timeout handling and connection state management

  const joinRoom = async (roomId) => {
    try {
      console.log("Joining room:", roomId);
      setIsLoading(true);

      // Get user data once
      const user = JSON.parse(sessionStorage.getItem("user") || "{}");

      if (!user || !user.uid) {
        console.error("No valid user found in session storage");
        alert("You need to be logged in to join a call. Please log in and try again.");
        setIsLoading(false);
        return;
      }

      // Check if we need to connect the user
      if (!streamVideoClient.user || streamVideoClient.user.id !== user.uid) {
        console.log("Connecting user to Stream...");

        try {
          // Disconnect any existing user to avoid the consecutive connect warning
          if (streamVideoClient.user) {
            await streamVideoClient.disconnectUser();
          }

          // Use the simplest token approach for development
          const token = streamClient.devToken(user.uid);

          // Connect with increased timeout
          await streamVideoClient.connectUser(
            {
              id: user.uid,
              name: user.name || "User",
              image: user.photoUrl || "",
              userType: user.userType || "student"
            },
            token
          );

          console.log("User connected to Stream successfully");
        } catch (err) {
          console.error("Failed to connect user to Stream:", err);
          setIsLoading(false);
          alert("Could not connect to video service. Please try again later.");
          return;
        }
      }

      // Leave previous call if exists
      if (callInstanceRef.current) {
        console.log("Leaving previous call...");
        await callInstanceRef.current.leave();
        callInstanceRef.current = null;
        setCurrentCall(null);
      }

      // Create and join call with increased timeout
      console.log("Creating call instance...");
      const call = streamVideoClient.call("default", roomId);

      try {
        console.log("Joining call with extended timeout...");
        // Increase the timeout for joining
        await Promise.race([
          call.join({ create: true }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Join call timeout")), 30000)
          )
        ]);
        console.log("Call joined successfully");
      } catch (error) {
        console.error("Error joining call:", error);
        setIsLoading(false);
        if (error.message === "Join call timeout") {
          alert("Connection timed out. Please check your network and try again.");
        } else {
          alert("Could not join the video call. Please check your connection and try again.");
        }
        return;
      }

      // Now that we've successfully joined, update states
      callInstanceRef.current = call;
      setCurrentCall(call);
      setActiveRoomId(roomId);
      setIsCallJoined(true);
      setIsLoading(false);

      // Enable devices after successful join
      enableDevices(call);
    } catch (error) {
      console.error("Error in join room process:", error);
      setIsLoading(false);
      alert("An error occurred while setting up the video call. Please refresh the page and try again.");
    }
  };

  // Separate function to enable devices
  const enableDevices = async (call) => {
    try {
      console.log("Enabling camera and microphone...");
      const camEnabled = await call.camera.enable();
      const micEnabled = await call.microphone.enable();
      setIsCameraOff(!camEnabled);
      setIsMuted(!micEnabled);
      console.log("Camera enabled:", camEnabled, "Microphone enabled:", micEnabled);
    } catch (err) {
      console.warn("Error enabling devices:", err);
    }
  };

  // Fetch breakout rooms
  const fetchBreakoutRooms = async () => {
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
          ...doc.data()
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

      const conferenceDocRef = doc(db, "conference_calls", tutorSelectedClassId);
      const breakoutRoomsRef = collection(conferenceDocRef, "breakout_rooms");

      for (let i = 0; i < numRooms; i++) {
        const newRoomRef = await addDoc(breakoutRoomsRef, {
          availableSlots,
          classEndTime: null,
          startedAt: null,
          roomDuration,
          roomMembers: [],
          createdAt: Timestamp.now()
        });

        await updateDoc(newRoomRef, { roomId: newRoomRef.id });
      }

      setIsBreakoutModalOpen(false);
      fetchBreakoutRooms();
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
        roomMembers: isJoining ? arrayUnion(user.uid) : arrayRemove(user.uid)
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
        classEndTime
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

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
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
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error("Error leaving call:", error);
    }
  };

  // Main render
  return (
    <div className="fixed inset-0 bg-black overflow-hidden" ref={videoContainerRef}>
      {currentCall && !isLoading ? (
        <StreamVideo client={streamVideoClient} className="w-full h-full">
          <StreamCall call={currentCall} className="w-full h-full">
            {/* Call Header */}
            <div className="absolute top-0 left-0 right-0 z-20 p-4">
              <CallHeader
                classData={classData}
                isBreakoutRoom={activeRoomId !== tutorSelectedClassId}
                roomName={`Breakout Room ${breakoutRooms.findIndex(r => r.id === activeRoomId) + 1}`}
                onOpenBreakoutPanel={() => {
                  fetchBreakoutRooms();
                  setIsBreakoutPanelOpen(true);
                }}
                hasBreakoutPermission={hasBreakoutPermission}
              />
            </div>

            {/* Video Layout */}
            <div className="absolute inset-0 w-full h-full">
              {viewMode === 'speaker' ? (
                <div className="w-full h-full">
                  <SpeakerLayout />
                </div>
              ) : (
                <div className="w-full h-full">
                  <PaginatedGridLayout />
                </div>
              )}
            </div>

            {/* Custom Call Controls */}
            <div className="absolute bottom-0 left-0 right-0 z-20 p-4 flex justify-center">
              <MeetCallControls
                onLayoutChange={(mode) => setViewMode(mode)}
                onToggleParticipants={() => setIsParticipantsOpen(!isParticipantsOpen)}
                onToggleSettings={() => setIsSettingsOpen(!isSettingsOpen)}
                onToggleChat={() => setIsChatOpen(!isChatOpen)}
                onToggleFullscreen={toggleFullscreen}
                onLeaveCall={handleLeaveCall}
              />
            </div>

            {/* Return to Main Room Button (if in breakout room) */}
            {activeRoomId !== tutorSelectedClassId && (
              <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-20">
                <button
                  onClick={joinMainRoom}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-full px-4 py-2 flex items-center transition duration-200 shadow-lg"
                >
                  <LogOut size={18} className="mr-2" />
                  Return to Main Room
                </button>
              </div>
            )}

            {/* Side Panels */}
            {isParticipantsOpen && (
              <div className="absolute top-0 right-0 bottom-0 w-80 bg-white z-30 shadow-xl flex flex-col animate-slide-in">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-lg font-medium">Participants</h2>
                  <button
                    onClick={() => setIsParticipantsOpen(false)}
                    className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                  <CallParticipantsList />
                </div>
              </div>
            )}

            {/* Settings Panel */}
            {isSettingsOpen && (
              <div className="absolute top-0 right-0 bottom-0 w-96 bg-white z-30 shadow-xl flex flex-col animate-slide-in">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-lg font-medium">Settings</h2>
                  <button
                    onClick={() => setIsSettingsOpen(false)}
                    className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <DeviceSettings />
                </div>
              </div>
            )}

            {/* Chat Panel */}
            {isChatOpen && (
              <div className="absolute top-0 right-0 bottom-0 w-80 bg-white z-30 shadow-xl flex flex-col animate-slide-in">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-lg font-medium">Chat</h2>
                  <button
                    onClick={() => setIsChatOpen(false)}
                    className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 flex flex-col">
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-gray-300">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      </svg>
                      <p>No messages yet</p>
                      <p className="text-sm mt-2">Chat with participants in this room</p>
                    </div>
                  </div>
                  <div className="mt-auto border-t pt-4">
                    <div className="flex">
                      <input
                        type="text"
                        placeholder="Type a message..."
                        className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600 transition duration-200">
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Breakout Room Panel */}
            {isBreakoutPanelOpen && (
              <div className="absolute top-0 right-0 bottom-0 w-96 bg-white z-30 shadow-xl flex flex-col animate-slide-in">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-lg font-medium">Breakout Rooms</h2>
                  <button
                    onClick={() => setIsBreakoutPanelOpen(false)}
                    className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  <BreakoutRoomPanel
                    rooms={breakoutRooms}
                    onJoinRoom={joinBreakoutRoom}
                    onCreateRooms={() => setIsBreakoutModalOpen(true)}
                    hasPermission={hasBreakoutPermission}
                    currentUserId={user.uid}
                  />
                </div>
              </div>
            )}
          </StreamCall>
        </StreamVideo>
      ) : (
        // Loading state while connecting to call
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900">
          <div className="text-center">
        
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-900">
          <div className="animate-pulse flex flex-col items-center text-center max-w-md">
            <div className="rounded-full bg-gray-800 h-24 w-24 mb-6 flex items-center justify-center">
              <Video size={40} className="text-blue-400" />
            </div>
            <h2 className="text-white text-2xl font-medium mb-2">Joining call...</h2>
            <p className="text-gray-400 mb-8">Setting up your video and audio</p>
            <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 animate-progress-bar"></div>
            </div>
            </div>
            </div>


          </div>
        </div>
      )}

      {/* Create Breakout Rooms Modal */}
      <Modal
        isOpen={isBreakoutModalOpen}
        onClose={() => setIsBreakoutModalOpen(false)}
        title="Create Breakout Rooms"
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Number of Rooms
            </label>
            <div className="flex items-center">
              <input
                type="range"
                min="1"
                max="10"
                value={numRooms}
                onChange={(e) => setNumRooms(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="ml-4 w-10 text-center font-medium">{numRooms}</span>
            </div>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Room Duration (minutes)
            </label>
            <select
              value={roomDuration}
              onChange={(e) => setRoomDuration(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Available Slots per Room
            </label>
            <div className="flex items-center">
              <input
                type="range"
                min="2"
                max="10"
                value={availableSlots}
                onChange={(e) => setAvailableSlots(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="ml-4 w-10 text-center font-medium">{availableSlots}</span>
            </div>
          </div>

          {/* Preview of room distribution */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Room Preview:</h3>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: Math.min(numRooms, 10) }).map((_, index) => (
                <div
                  key={index}
                  className="bg-blue-100 border border-blue-200 rounded-lg p-2 text-center"
                >
                  <p className="text-xs font-medium text-blue-800">Room {index + 1}</p>
                  <p className="text-xs text-blue-600">{availableSlots} slots</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-4">
            <button
              onClick={() => setIsBreakoutModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition duration-200"
            >
              Cancel
            </button>
            <button
              onClick={createBreakoutRooms}
              disabled={isCreatingRooms}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isCreatingRooms ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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

      {/* Add animations and styles */}
      <style jsx>{`
  @keyframes slideIn {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes scaleIn {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  
  .animate-slide-in {
    animation: slideIn 0.3s ease-out forwards;
  }
  
  .animate-fade-in {
    animation: fadeIn 0.3s ease-out forwards;
  }
  
  .animate-scale-in {
    animation: scaleIn 0.3s ease-out forwards;
  }
  
  /* Progress bar animation */
  @keyframes progressBar {
    0% { width: 0%; }
    100% { width: 100%; }
  }
  
  .animate-progress {
    animation: progressBar 2s linear infinite;
  }
  
  /* Corrected selector */
  .str-video__video .str-video__video--mirror {
    width: 100% !important;
  }
`}</style>

    </div>
  );
};

export default VideoCallTutor;