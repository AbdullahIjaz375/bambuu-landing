// src/components/VideoCallTutor.js
import React, { useEffect, useState, useRef, useContext } from "react";
import Modal from "react-modal";
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
import { ClassContext } from "../../context/ClassContext";
import { 
  CopyPlus, 
  LogOut, 
  Users, 
  Video,
  X,
  Grid,
  PictureInPicture
} from "lucide-react";
import { streamVideoClient, streamClient } from "../../config/stream";
import {
  StreamVideo,
  StreamCall,
  OwnCapability,
  SpeakerLayout,
  PaginatedGridLayout
} from "@stream-io/video-react-sdk";

import EnhancedCallControls from "./EnhancedCallControls";
import { canCreateBreakoutRooms } from "./BreakoutRoomUtils";

Modal.setAppElement("#root");

// Reusable Button Component
const FloatingButton = ({ icon, label, onClick, variant = "primary" }) => {
  const getColorClass = () => {
    switch (variant) {
      case "success": return "bg-green-600 hover:bg-green-700";
      case "danger": return "bg-red-600 hover:bg-red-700";
      case "warning": return "bg-yellow-600 hover:bg-yellow-700";
      default: return "bg-gray-800 hover:bg-gray-700";
    }
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center ${getColorClass()} text-white rounded-full py-2 px-4 transition-colors duration-200 shadow-lg`}
      aria-label={label}
    >
      {icon}
      <span className="ml-2 font-medium">{label}</span>
    </button>
  );
};

// Custom Modal Component
const CustomModal = ({ isOpen, onClose, title, subtitle, children, width = "md" }) => {
  const getWidthClass = () => {
    switch (width) {
      case "sm": return "max-w-sm";
      case "lg": return "max-w-lg";
      case "xl": return "max-w-xl";
      default: return "max-w-md";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-75 animate-fade-in">
      <div className={`bg-white rounded-2xl shadow-xl w-full ${getWidthClass()} max-h-[90vh] flex flex-col font-urbanist animate-scale-in`}>
        <div className="p-6 border-b relative">
          <button 
            onClick={onClose}
            className="absolute right-4 top-4 p-1 rounded-full hover:bg-gray-200 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
};

const VideoCallTutor = () => {
  const { tutorSelectedClassId } = useContext(ClassContext);
  const [classData, setClassData] = useState(null);

  // Breakout creation form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [numRooms, setNumRooms] = useState(2);
  const [roomDuration, setRoomDuration] = useState(15);
  const [availableSlots, setAvailableSlots] = useState(5);
  const [isCallJoined, setIsCallJoined] = useState(false);
  const [isRoomJoined, setIsRoomJoined] = useState(false);
  const [isInMainCall, setIsInMainCall] = useState(false);

  // Viewing breakout rooms
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [breakoutRooms, setBreakoutRooms] = useState([]);

  // Permission checks
  const [hasBreakoutPermission, setHasBreakoutPermission] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // View mode: 'speaker' or 'grid'
  const [viewMode, setViewMode] = useState('grid');
  
  // Video display states
  const [isCameraDisabled, setIsCameraDisabled] = useState(false);
  const [isFullscreenMode, setIsFullscreenMode] = useState(false);

  // Track which room we are in right now:
  // By default, we start in the main class room (tutorSelectedClassId).
  const [activeRoomId, setActiveRoomId] = useState(tutorSelectedClassId);

  // Keep a reference to the current call instance from GetStream.
  const callInstanceRef = useRef(null);
  const [currentCall, setCurrentCall] = useState(null);
  const videoContainerRef = useRef(null);

  // Current user from Firebase (using uid as unique identifier)
  const user = JSON.parse(sessionStorage.getItem("user"));

  // -----------------------------
  //   Fetch the Class Data
  // -----------------------------
  useEffect(() => {
    const fetchClassData = async () => {
      try {
        const classDocRef = doc(db, "classes", tutorSelectedClassId);
        const classDocSnap = await getDoc(classDocRef);
        if (classDocSnap.exists()) {
          setClassData(classDocSnap.data());
        } else {
          console.log("No such document!");
          setClassData(null);
        }
      } catch (error) {
        console.error("Error fetching class data:", error);
      }
    };
    if (tutorSelectedClassId) {
      fetchClassData();
    }
  }, [tutorSelectedClassId]);

  // -----------------------------
  //   Permission for Breakouts
  // -----------------------------
  useEffect(() => {
    setHasBreakoutPermission(canCreateBreakoutRooms(tutorSelectedClassId));
  }, [tutorSelectedClassId]);

  // -----------------------------
  //   Create Breakout Rooms
  // -----------------------------
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
      if (!roomDoc.exists()) {
        return;
      }

      await updateDoc(breakoutRoomRef, {
        roomMembers: isJoining ? arrayUnion(user.uid) : arrayRemove(user.uid),
      });

      await getDoc(breakoutRoomRef);
      await fetchBreakoutRooms();
    } catch (error) {
      console.error("Error in updateRoomMembers:", {
        error,
        roomId,
        isJoining,
        userId: user?.uid,
      });
    }
  };

  const createBreakoutRooms = async () => {
    setIsCreating(true);
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
          classEndTime: null, // Initialize classEndTime as null
          startedAt: null, // Initialize startedAt as null
          roomDuration,
          roomMembers: [],
          createdAt: Timestamp.now(),
        });
        await updateDoc(newRoomRef, { roomId: newRoomRef.id });
      }

      setIsModalOpen(false);
      fetchBreakoutRooms();
    } catch (error) {
      console.error("Error creating breakout rooms:", error);
    } finally {
      setIsCreating(false);
    }
  };

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
        querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    } catch (error) {
      console.error("Error fetching breakout rooms:", error);
    }
  };

  // -----------------------------------------
  //  Join any room by roomId (Main or Breakout)
  // -----------------------------------------
  const joinRoom = async (roomId) => {
    try {
      // Ensure the Stream Video client is connected
      if (!streamVideoClient.user || !streamVideoClient.user.id) {
        const token = streamClient.devToken(user.uid);
        await streamVideoClient.connectUser(
          {
            id: user.uid,
            name: user.name || "",
            image: user.photoUrl || "",
            userType: user.userType,
          },
          token
        );
      }

      // Leave previous call if it exists
      if (callInstanceRef.current) {
        await callInstanceRef.current.leave();
        callInstanceRef.current = null;
        setCurrentCall(null);
      }

      // Create a new call instance using the provided roomId
      const call = streamVideoClient.call("default", roomId);

      // Join the call; if it doesn't exist, create it
      try {
        await call.join({ create: true });
      } catch (error) {
        console.error("Error joining the call:", error);
        return;
      }

      callInstanceRef.current = call;
      setCurrentCall(call);

      // Check for permissions before publishing
      const canSendAudio = call.permissionsContext.hasPermission(
        OwnCapability.SEND_AUDIO
      );
      const canSendVideo = call.permissionsContext.hasPermission(
        OwnCapability.SEND_VIDEO
      );

      // Obtain media stream from user's devices
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: canSendVideo,
        audio: canSendAudio,
      });

      const videoTracks = mediaStream.getVideoTracks();
      const audioTracks = mediaStream.getAudioTracks();

      if (videoTracks.length === 0) {
        console.warn("No video tracks available.");
        setIsCameraDisabled(true);
      } else {
        setIsCameraDisabled(false);
      }

      // Create a new MediaStream for each track and publish
      if (videoTracks.length > 0 && canSendVideo) {
        const videoStream = new MediaStream([videoTracks[0]]);
        await call.publish(videoStream, 2);
      }
      
      if (audioTracks.length > 0 && canSendAudio) {
        const audioStream = new MediaStream([audioTracks[0]]);
        await call.publish(audioStream, 1);
      }

      // Update UI state
      if (roomId === tutorSelectedClassId) {
        setIsCallJoined(true);
        setIsInMainCall(true);
      } else {
        setIsRoomJoined(true);
      }
      setActiveRoomId(roomId);
      
      // Subscribe to participant count to update grid layout
      call.state.on('participantsUpdated', () => {
        updateLayoutBasedOnParticipants(call);
      });
      
    } catch (error) {
      console.error("Error in joinRoom function:", error);
    }
  };
  
  // Helper to update layout based on participant count
  const updateLayoutBasedOnParticipants = (call) => {
    if (!call?.state?.participants) return;
    
    const participantCount = Object.keys(call.state.participants).length;
    
    // If there's only one or two participants, default to speaker view
    // otherwise use grid view for better visibility of multiple participants
    if (participantCount <= 2) {
      setViewMode('speaker');
    } else {
      setViewMode('grid');
    }
  };

  // Convenience method to switch back to the main class
  const joinMainClass = async () => {
    if (activeRoomId !== tutorSelectedClassId) {
      await updateRoomMembers(activeRoomId, false);
    }
    joinRoom(tutorSelectedClassId);
  };

  // Handler for leaving the call completely
  const handleLeaveCall = async () => {
    try {
      if (callInstanceRef.current) {
        // If in a breakout room, update member status
        if (activeRoomId !== tutorSelectedClassId) {
          await updateRoomMembers(activeRoomId, false);
        }
        
        // Leave the call
        await callInstanceRef.current.leave();
        callInstanceRef.current = null;
        setCurrentCall(null);
        
        // Navigate away or show a post-call screen
        window.location.href = '/dashboard'; // Example redirect
      }
    } catch (error) {
      console.error("Error leaving call:", error);
    }
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
    setIsFullscreenMode(!isFullscreenMode);
  };

  // -----------------------------------------
  //   If user clicks on a breakout room
  // -----------------------------------------
  const handleJoinBreakoutRoom = async (room) => {
    const now = new Date();
    const endTime = room.classEndTime?.toDate?.() || null;

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

    if (room.roomMembers.length >= room.availableSlots) {
      alert("This breakout room is full.");
      return;
    }

    await updateRoomMembers(room.id, true);
    joinRoom(room.id);

    const remainingMs = room.classEndTime.toDate() - now;
    setTimeout(() => {
      joinMainClass();
    }, remainingMs);
  };

  // -----------------------------------------
  //   Mount: start in the main class call
  // -----------------------------------------
  useEffect(() => {
    if (tutorSelectedClassId) {
      joinMainClass();
    }
    
    // Setup fullscreen change listener
    const handleFullscreenChange = () => {
      setIsFullscreenMode(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      if (callInstanceRef.current) {
        callInstanceRef.current.leave();
        callInstanceRef.current = null;
        setCurrentCall(null);
      }
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
    // eslint-disable-next-line
  }, [tutorSelectedClassId]);

  // -----------------------------------------
  //   Render
  // -----------------------------------------
  return (
    <>
      {currentCall ? (
        // Fill entire screen with a dark background
        <div
          ref={videoContainerRef}
          className={`absolute inset-0 bg-gray-900 overflow-hidden ${isFullscreenMode ? 'fullscreen' : ''}`}
        >
          <StreamVideo client={streamVideoClient}>
            <StreamCall call={currentCall}>
              {/* Choose layout based on viewMode state */}
              <div className={`w-full h-full ${isCameraDisabled ? 'grid-fallback' : ''}`}>
                {viewMode === 'speaker' ? (
                  <SpeakerLayout />
                ) : (
                  <PaginatedGridLayout />
                )}
                
                {/* Empty video fallback grid */}
                {isCameraDisabled && (
                  <div className="absolute inset-0 grid place-items-center bg-gray-800">
                    <div className="text-center">
                      <div className="mb-4 bg-gray-700 rounded-full h-24 w-24 mx-auto flex items-center justify-center">
                        <Video size={36} className="text-gray-400" />
                      </div>
                      <p className="text-white text-lg">Camera is turned off</p>
                      <p className="text-gray-400 mt-2">Turn on your camera to share video</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Custom call controls instead of default */}
              <EnhancedCallControls 
                onLeaveCall={handleLeaveCall} 
                onLayoutChange={layout => setViewMode(layout)}
                onCameraToggle={disabled => setIsCameraDisabled(disabled)}
              />
            </StreamCall>
          </StreamVideo>
          
          {/* Room Control Buttons - Top Right */}
          <div className="fixed top-4 right-4 flex gap-2 z-[999]">
            {activeRoomId === tutorSelectedClassId && isCallJoined && isInMainCall && (
              <>
                {/* Room Management */}
                <div className="flex items-center space-x-2">
                  {hasBreakoutPermission && (
                    <FloatingButton
                      icon={<CopyPlus size={18} />}
                      label="Create Rooms"
                      onClick={() => setIsModalOpen(true)}
                    />
                  )}
                  <FloatingButton
                    icon={<Users size={18} />}
                    label="View Rooms"
                    onClick={() => {
                      fetchBreakoutRooms();
                      setIsViewModalOpen(true);
                    }}
                  />
                </div>
                
                {/* View Controls */}
                <div className="flex items-center ml-2 space-x-2">
                  <FloatingButton
                    icon={viewMode === 'grid' ? <PictureInPicture size={18} /> : <Grid size={18} />}
                    label={viewMode === 'grid' ? "Speaker View" : "Grid View"}
                    onClick={() => setViewMode(viewMode === 'grid' ? 'speaker' : 'grid')}
                    variant="warning"
                  />
                </div>
              </>
            )}
          </div>
          
          {/* Breakout Room Indicator and Return Button */}
          {activeRoomId !== tutorSelectedClassId && (
            <>
              {/* Room indicator - Top right */}
              <div className="fixed top-4 right-4 z-[999]">
                <div className="px-4 py-2 text-white bg-green-600 rounded-full shadow-lg flex items-center">
                  <Users size={18} className="mr-2" />
                  Breakout Room {breakoutRooms.findIndex((room) => room.id === activeRoomId) + 1}
                </div>
              </div>
              
              {/* Return to main room - Bottom center */}
              {isCallJoined && isRoomJoined && (
                <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-[999]">
                  <FloatingButton
                    icon={<LogOut size={18} />}
                    label="Return to Main Room"
                    onClick={joinMainClass}
                    variant="warning"
                  />
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        // "Joining call..." fallback with improved UI
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
      )}

      {/* Modal: Create Breakout Rooms - Improved UI */}
      <CustomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Breakout Rooms"
        subtitle="Configure your breakout room settings"
        width="md"
      >
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="space-y-5">
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
                  max="20"
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
          </div>
        </div>
        
        <div className="p-6 border-t bg-gray-50 rounded-b-2xl">
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={createBreakoutRooms}
              disabled={isCreating}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px] transition-colors"
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
      </CustomModal>

      {/* Modal: View/Join Breakout Rooms - Improved Google Meet style */}
      <CustomModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Breakout Rooms"
        subtitle="Select a room to join"
        width="md"
      >
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-4">
            {breakoutRooms.length > 0 ? (
              breakoutRooms.map((room, index) => {
                const isRoomExpired =
                  room.startedAt &&
                  new Date() > new Date(room.classEndTime.toDate());
                  
                const isUserInRoom = room.roomMembers.includes(user.uid);
                const isFull = room.roomMembers.length >= room.availableSlots;
                const occupancyPercentage = Math.round((room.roomMembers.length / room.availableSlots) * 100);
                
                return (
                  <div
                    key={room.id}
                    className={`p-4 transition-colors border rounded-xl ${
                      isUserInRoom 
                        ? "bg-green-50 border-green-200" 
                        : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                            isUserInRoom ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}>
                            <span className="font-bold">{index + 1}</span>
                          </div>
                          <p className="font-semibold text-gray-900">
                            Breakout Room {index + 1}
                          </p>
                        </div>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          isUserInRoom
                            ? "bg-green-100 text-green-800"
                            : isFull
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                        }`}>
                          {isUserInRoom 
                            ? "You are here" 
                            : isFull 
                              ? "Full" 
                              : `${room.roomMembers.length}/${room.availableSlots}`}
                        </span>
                      </div>
                      
                      {/* Participant progress bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${
                            occupancyPercentage >= 80 
                              ? "bg-red-500" 
                              : occupancyPercentage >= 50 
                                ? "bg-yellow-500" 
                                : "bg-green-500"
                          }`}
                          style={{ width: `${occupancyPercentage}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between items-center text-gray-600 text-sm">
                        <div className="flex items-center">
                          <Users size={16} className="mr-2" />
                          <p>{room.roomMembers.length} participant{room.roomMembers.length !== 1 ? 's' : ''}</p>
                        </div>
                        
                        <p className="flex items-center">
                          <span className={`inline-block w-2 h-2 mr-2 rounded-full ${
                            isRoomExpired 
                              ? "bg-red-500" 
                              : room.startedAt 
                                ? "bg-green-500" 
                                : "bg-yellow-500"
                          }`}></span>
                          {isRoomExpired
                            ? "Expired"
                            : room.startedAt
                              ? `Ends: ${new Date(room.classEndTime.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
                              : "Not started yet"}
                        </p>
                      </div>
                      
                      <button
                        className={`w-full px-4 py-2 mt-3 text-sm font-medium rounded-lg transition-colors ${
                          isFull || isRoomExpired
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : isUserInRoom
                              ? "bg-green-600 hover:bg-green-700 text-white"
                              : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                        onClick={() => {
                          handleJoinBreakoutRoom(room);
                          setIsViewModalOpen(false);
                        }}
                        disabled={isFull || isRoomExpired}
                      >
                        {isFull
                          ? "Room Full"
                          : isRoomExpired
                            ? "Room Expired"
                            : isUserInRoom
                              ? "Return to Room"
                              : "Join Room"}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-gray-500 bg-gray-50 rounded-xl">
                <Users size={48} className="mb-4 opacity-50" />
                <p className="text-center text-lg font-medium">No breakout rooms available</p>
                <p className="text-center text-sm mt-2">Create breakout rooms to get started</p>
                {hasBreakoutPermission && (
                  <button
                    onClick={() => {
                      setIsViewModalOpen(false);
                      setIsModalOpen(true);
                    }}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Create Rooms
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="p-6 border-t bg-gray-50 rounded-b-2xl">
          <div className="flex justify-end">
            <button
              onClick={() => setIsViewModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </CustomModal>
      
      {/* Add these animations to your CSS */}
      <style jsx>{`
        @keyframes progress-bar {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        
        .animate-progress-bar {
          animation: progress-bar 2s infinite linear;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        
        .animate-scale-in {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default VideoCallTutor;