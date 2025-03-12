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
import { CopyPlus, LogOut, Users } from "lucide-react";
import { streamVideoClient, streamClient } from "../../config/stream";
import {
  StreamVideo,
  StreamCall,
  OwnCapability,
  CallControls,
  SpeakerLayout,
} from "@stream-io/video-react-sdk";

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

Modal.setAppElement("#root");

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

  // Track which room we are in right now:
  // By default, we start in the main class room (tutorSelectedClassId).
  const [activeRoomId, setActiveRoomId] = useState(tutorSelectedClassId);

  // Keep a reference to the current call instance from GetStream.
  const callInstanceRef = useRef(null);
  const [currentCall, setCurrentCall] = useState(null);

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
    console.log(`updateRoomMembers called with:`, {
      roomId,
      isJoining,
      tutorSelectedClassId,
      userId: user?.uid,
    });

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
      const currentTime = new Date();
      const endTime = new Date(
        currentTime.getTime() + roomDuration * 60 * 1000
      );

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

      // Join the call; if it doesn’t exist, create it
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
      }
      if (audioTracks.length === 0) {
        console.warn("No audio tracks available.");
      }

      console.log("Publishing tracks to call:", videoTracks[0], audioTracks[0]);

      // Create a new MediaStream for each track and publish using numeric constants:
      // 2 for video and 1 for audio.
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
    } catch (error) {
      console.error("Error in joinRoom function:", error);
    }
  };

  // Convenience method to switch back to the main class
  const joinMainClass = async () => {
    if (activeRoomId !== tutorSelectedClassId) {
      await updateRoomMembers(activeRoomId, false);
    }
    joinRoom(tutorSelectedClassId);
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
    return () => {
      if (callInstanceRef.current) {
        callInstanceRef.current.leave();
        callInstanceRef.current = null;
        setCurrentCall(null);
      }
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
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            overflow: "hidden",
            backgroundColor: "#111", // Dark background
          }}
        >
          <StreamVideo client={streamVideoClient}>
            <StreamCall call={currentCall}>
              {/* Large tile for active speaker, smaller tiles for others */}
              <SpeakerLayout />
              {/* Default call controls at the bottom (mic, camera, leave, etc.) */}
              <CallControls />
            </StreamCall>
          </StreamVideo>
        </div>
      ) : (
        // "Joining call..." fallback
        <div
          style={{
            width: "100vw",
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#111",
          }}
        >
          <p style={{ color: "#fff" }}>Joining call...</p>
        </div>
      )}

      {/* Button to leave breakout room and return to main call */}
      {activeRoomId !== tutorSelectedClassId &&
        isCallJoined &&
        isRoomJoined && (
          <div className="fixed bottom-4 left-12 flex gap-2 z-[1000]">
            <button
              onClick={joinMainClass}
              className="flex items-center justify-center bg-[#313443] hover:bg-[#404352] text-white rounded-lg w-10 h-10 transition-colors duration-200 shadow-md"
              aria-label="Leave Breakout Room"
            >
              <LogOut size={20} />
            </button>
          </div>
        )}

      {/* Floating buttons when in main class call */}
      {activeRoomId === tutorSelectedClassId &&
        isCallJoined &&
        isInMainCall && (
          <div className="fixed bottom-4 left-12 flex gap-2 z-[1000]">
            {hasBreakoutPermission && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center justify-center bg-[#313443] hover:bg-[#404352] text-white rounded-lg w-10 h-10 transition-colors duration-200 shadow-md"
                aria-label="Create Breakout Room"
              >
                <CopyPlus size={20} />
              </button>
            )}
            <button
              onClick={() => {
                fetchBreakoutRooms();
                setIsViewModalOpen(true);
              }}
              className="flex items-center justify-center bg-[#313443] hover:bg-[#404352] text-white rounded-lg w-10 h-10 transition-colors duration-200 shadow-md"
              aria-label="View Breakout Rooms"
            >
              <Users size={20} />
            </button>
          </div>
        )}

      {/* Show which breakout room you're in */}
      <div className="fixed top-8 left-8 flex gap-2 z-[1000]">
        {activeRoomId === tutorSelectedClassId ? null : (
          <div className="px-4 py-2 text-white bg-green-600 rounded-xl">
            Breakout Room{" "}
            {breakoutRooms.findIndex((room) => room.id === activeRoomId) + 1}
          </div>
        )}
      </div>

      {/* Modal: Create Breakout Rooms */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        style={{
          overlay: {
            zIndex: 9999,
            backgroundColor: "rgba(0,0,0,0.5)",
            overflow: "hidden",
          },
          content: {
            position: "absolute",
            zIndex: 10000,
            top: "50%",
            left: "50%",
            right: "auto",
            bottom: "auto",
            marginRight: "-50%",
            transform: "translate(-50%, -50%)",
            padding: 0,
            border: "none",
            background: "transparent",
            maxHeight: "90vh",
            maxWidth: "90vw",
            overflow: "visible",
          },
        }}
      >
        <div className="p-8 bg-white rounded-lg w-96 font-urbanist">
          <h2 className="mb-6 text-xl font-bold">Create Breakout Rooms</h2>
          <div className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Number of Rooms
              </label>
              <input
                type="number"
                value={numRooms}
                onChange={(e) => setNumRooms(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Room Duration (minutes)
              </label>
              <input
                type="number"
                value={roomDuration}
                onChange={(e) => setRoomDuration(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Available Slots
              </label>
              <input
                type="number"
                value={availableSlots}
                onChange={(e) => setAvailableSlots(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <div className="flex justify-end mt-6 space-x-3">
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

      {/* Modal: View/Join Breakout Rooms */}
      <Modal
        isOpen={isViewModalOpen}
        onRequestClose={() => setIsViewModalOpen(false)}
        style={{
          overlay: {
            zIndex: 9999,
            backgroundColor: "rgba(0,0,0,0.5)",
            overflow: "hidden",
          },
          content: {
            position: "absolute",
            zIndex: 10000,
            top: "50%",
            left: "50%",
            right: "auto",
            bottom: "auto",
            marginRight: "-50%",
            transform: "translate(-50%, -50%)",
            padding: 0,
            border: "none",
            background: "transparent",
            maxHeight: "90vh",
            maxWidth: "90vw",
            overflow: "visible",
          },
        }}
      >
        <div className="bg-white rounded-2xl shadow-xl w-full sm:w-96 max-h-[90vh] flex flex-col font-urbanist">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">Breakout Rooms</h2>
          </div>
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-4">
              {breakoutRooms.map((room, index) => {
                const isRoomExpired =
                  room.startedAt &&
                  new Date() > new Date(room.classEndTime.toDate());
                return (
                  <div
                    key={room.id}
                    className="p-4 transition-colors border rounded-xl bg-gray-50 hover:bg-gray-100"
                  >
                    <div className="space-y-2">
                      <p className="font-semibold text-gray-900">
                        Breakout Room {index + 1}
                      </p>
                      <p className="text-gray-600">
                        Available Slots: {room.availableSlots}
                      </p>
                      <p className="text-gray-600">
                        Duration: {room.roomDuration} minutes
                      </p>
                      <p className="text-gray-600">
                        Members: {room.roomMembers.length}
                      </p>
                      <p className="text-gray-600">
                        {room.startedAt
                          ? `Ends at: ${room.classEndTime
                              .toDate()
                              .toLocaleString()}`
                          : "Not started yet"}
                      </p>
                    </div>
                    <button
                      className={`px-3 py-1 mt-3 text-sm font-medium rounded ${
                        room.roomMembers.length >= room.availableSlots ||
                        isRoomExpired
                          ? "bg-gray-400 cursor-not-allowed"
                          : room.roomMembers.includes(user.uid)
                          ? "bg-green-500"
                          : "bg-blue-600 hover:bg-blue-700"
                      } text-white`}
                      onClick={() => {
                        handleJoinBreakoutRoom(room);
                        setIsViewModalOpen(false);
                      }}
                      disabled={
                        room.roomMembers.length >= room.availableSlots ||
                        isRoomExpired
                      }
                    >
                      {room.roomMembers.length >= room.availableSlots
                        ? "Room Full"
                        : isRoomExpired
                        ? "Room Expired"
                        : "Join"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="p-6 border-t bg-gray-50 rounded-b-2xl">
            <div className="flex justify-end">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default VideoCallTutor;
