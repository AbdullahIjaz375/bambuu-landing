// import React, { useEffect, useState, useContext, useRef } from "react";
// import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt"; // No longer using ZegoMenuBarButtonName
// import { ClassContext } from "../../context/ClassContext";
// import { db } from "../../firebaseConfig";
// import {
//   collection,
//   addDoc,
//   getDocs,
//   query,
//   where,
//   Timestamp,
//   doc,
//   updateDoc,
//   getDoc,
// } from "firebase/firestore";
// import Modal from "react-modal";
// import { CopyPlus, Grid, Users } from "lucide-react";

// Modal.setAppElement("#root");

// const canCreateBreakoutRooms = (classId) => {
//   try {
//     // Get user from session storage
//     const user = JSON.parse(sessionStorage.getItem("user"));
//     if (!user) return false;

//     const { userType, adminOfClasses = [], tutorOfClasses = [] } = user;

//     // Check permissions based on user type
//     if (userType === "student") {
//       return adminOfClasses.includes(classId);
//     } else if (userType === "tutor") {
//       return tutorOfClasses.includes(classId);
//     }

//     return false;
//   } catch (error) {
//     console.error("Error checking breakout room permissions:", error);
//     return false;
//   }
// };

// const buttonClass = `
// flex items-center justify-center
// bg-[#313443] hover:bg-[#404352]
// text-white rounded-lg
// w-10 h-10
// transition-colors duration-200
// shadow-md
// `;

// const containerClass = `
// fixed bottom-4 left-12
// flex gap-2
// z-[1000]
// `;

// // Tooltip styles
// const tooltipClass = `
// group relative
// cursor-pointer
// `;

// const tooltipTextClass = `
// invisible group-hover:visible
// absolute -top-8 left-1/2 -translate-x-1/2
// bg-black/75 text-white
// text-xs py-1 px-2 rounded
// whitespace-nowrap
// `;

// const VideoCallTutor = () => {
//   const { tutorSelectedClassId } = useContext(ClassContext);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [numRooms, setNumRooms] = useState(2);
//   const [roomDuration, setRoomDuration] = useState(15);
//   const [availableSlots, setAvailableSlots] = useState(5);
//   const [classData, setClassData] = useState(null);
//   const [isViewModalOpen, setIsViewModalOpen] = useState(false);
//   const [isCallJoined, setIsCallJoined] = useState(false);
//   const [breakoutRooms, setBreakoutRooms] = useState([]);
//   const user = JSON.parse(sessionStorage.getItem("user"));
//   const [hasBreakoutPermission, setHasBreakoutPermission] = useState(false);
//   const [isCreating, setIsCreating] = useState(false);

//   const callContainerRef = useRef(null);

//   useEffect(() => {
//     // Check permissions when component mounts or classId changes
//     const checkPermissions = () => {
//       const hasPermission = canCreateBreakoutRooms(tutorSelectedClassId);
//       setHasBreakoutPermission(hasPermission);
//     };

//     checkPermissions();
//   }, [tutorSelectedClassId]);

//   useEffect(() => {
//     const fetchClassData = async () => {
//       try {
//         const classDocRef = doc(db, "classes", tutorSelectedClassId); // Reference to the document
//         const classDoc = await getDoc(classDocRef); // Fetch the document
//         if (classDoc.exists()) {
//           setClassData(classDoc.data());
//           console.log(classDoc.data());
//         } else {
//           console.log("No such document!");
//           setClassData(null);
//         }
//       } catch (error) {
//         console.error("Error fetching class data:", error);
//       }
//     };
//     fetchClassData();
//   }, [tutorSelectedClassId]);

//   useEffect(() => {
//     console.log("In VideoCallTutor: selectedClassId =", tutorSelectedClassId);
//   }, [tutorSelectedClassId]);

//   const createBreakoutRooms = async () => {
//     setIsCreating(true);

//     try {
//       if (!classData) return;
//       const currentTime = new Date();
//       const endTime = new Date(
//         currentTime.getTime() + roomDuration * 60 * 1000
//       );

//       const conferenceDocRef = doc(
//         db,
//         "conference_calls",
//         tutorSelectedClassId
//       );
//       const breakoutRoomsRef = collection(conferenceDocRef, "breakout_rooms");

//       for (let i = 0; i < numRooms; i++) {
//         const newRoomRef = await addDoc(breakoutRoomsRef, {
//           availableSlots,
//           classEndTime: Timestamp.fromDate(endTime), // Using the new end time
//           roomDuration,
//           roomMembers: [],
//           createdAt: Timestamp.now(),
//         });
//         await updateDoc(newRoomRef, { roomId: newRoomRef.id });
//       }

//       setIsModalOpen(false);
//       fetchBreakoutRooms();
//     } catch (error) {
//       console.error("Error creating breakout rooms:", error);
//     } finally {
//       setIsCreating(false);
//     }
//   };

//   const fetchBreakoutRooms = async () => {
//     try {
//       const breakoutRef = collection(
//         db,
//         "conference_calls",
//         tutorSelectedClassId,
//         "breakout_rooms"
//       );
//       const querySnapshot = await getDocs(breakoutRef);
//       setBreakoutRooms(
//         querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
//       );
//       setIsViewModalOpen(true);
//     } catch (error) {
//       console.error("Error fetching breakout rooms:", error);
//     }
//   };

//   const startZegoCall = () => {
//     if (!callContainerRef.current) return;

//     const appId = parseInt(process.env.REACT_APP_ZEGO_APP_ID);
//     const serverSecret = process.env.REACT_APP_ZEGO_SERVER_SECRET;

//     // Generate kit token
//     const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
//       appId,
//       serverSecret,
//       tutorSelectedClassId, // your roomID
//       user.uid,
//       user.name
//     );

//     // Create instance
//     const zp = ZegoUIKitPrebuilt.create(kitToken);

//     // Join with your config
//     zp.joinRoom({
//       container: callContainerRef.current,
//       turnOnMicrophoneWhenJoining: true,
//       turnOnCameraWhenJoining: true,
//       showMyCameraToggleButton: true,
//       showMyMicrophoneToggleButton: true,
//       showAudioVideoSettingsButton: true,
//       showScreenSharingButton: true,
//       showTextChat: true,
//       showUserList: true,
//       maxUsers: 50,
//       layout: "Auto",
//       showLayoutButton: true,
//       scenario: {
//         mode: "GroupCall",
//         config: {
//           role: "Host",
//         },
//       },
//       // If you want to control bottom menu bar visibility or built-in button set:
//       bottomMenuBarConfig: {
//         isVisible: true,
//         maxButtons: 6,
//         // you can list built-in buttons as strings here
//         buttons: [
//           "toggleCameraButton",
//           "toggleMicrophoneButton",
//           "switchAudioOutputButton",
//           "leaveButton",
//         ],
//       },
// onJoinRoom: () => {
//   setIsCallJoined(true);
// },
//     });
//   };

//   useEffect(() => {
//     // Initialize the call UI as soon as the component mounts.
//     startZegoCall();
//   }, []);

//   return (
//     <>
//       {/* Our custom controls above (or anywhere outside) the ZEGOCLOUD UI container */}
//       {isCallJoined && (
//         <div className={containerClass}>
//           {/* Create Breakout Room - only shown to admins/tutors */}
//           {hasBreakoutPermission && (
//             <div className={tooltipClass}>
//               <button
//                 onClick={() => setIsModalOpen(true)}
//                 className={buttonClass}
//                 aria-label="Create Breakout Room"
//               >
//                 <CopyPlus size={20} />
//               </button>
//               <span className={tooltipTextClass}>Create Breakout Room</span>
//             </div>
//           )}

//           {/* View Breakout Rooms - shown to everyone */}
//           <div className={tooltipClass}>
//             <button
//               onClick={fetchBreakoutRooms}
//               className={buttonClass}
//               aria-label="View Breakout Rooms"
//             >
//               <Users size={20} />
//             </button>
//             <span className={tooltipTextClass}>View Breakout Rooms</span>
//           </div>
//         </div>
//       )}

//       {/* ZEGOCLOUD UI container */}
//       <div ref={callContainerRef} style={{ width: "100vw", height: "100vh" }} />

//       {/* Breakout Room Modal */}
// <Modal
//   isOpen={isModalOpen}
//   onRequestClose={() => setIsModalOpen(false)}
//   style={{
//     overlay: {
//       zIndex: 9999,
//       backgroundColor: "rgba(0,0,0,0.5)",
//     },
//     content: {
//       position: "absolute",
//       zIndex: 10000,
//       top: "50%",
//       left: "50%",
//       right: "auto",
//       bottom: "auto",
//       marginRight: "-50%",
//       transform: "translate(-50%, -50%)",
//       padding: 0,
//       border: "none",
//       background: "transparent",
//       maxHeight: "90vh",
//       maxWidth: "90vw",
//       overflow: "visible",
//     },
//   }}
// >
//   <div className="p-8 bg-white rounded-lg w-96 font-urbanist">
//     <h2 className="mb-6 text-xl font-bold">Create Breakout Rooms</h2>

//     <div className="space-y-4">
//       <div>
//         <label className="block mb-1 text-sm font-medium text-gray-700">
//           Number of Rooms
//         </label>
//         <input
//           type="number"
//           value={numRooms}
//           onChange={(e) => setNumRooms(parseInt(e.target.value))}
//           className="w-full px-3 py-2 border border-gray-300 rounded-md"
//         />
//       </div>

//       <div>
//         <label className="block mb-1 text-sm font-medium text-gray-700">
//           Room Duration (minutes)
//         </label>
//         <input
//           type="number"
//           value={roomDuration}
//           onChange={(e) => setRoomDuration(parseInt(e.target.value))}
//           className="w-full px-3 py-2 border border-gray-300 rounded-md"
//         />
//       </div>

//       <div>
//         <label className="block mb-1 text-sm font-medium text-gray-700">
//           Available Slots
//         </label>
//         <input
//           type="number"
//           value={availableSlots}
//           onChange={(e) => setAvailableSlots(parseInt(e.target.value))}
//           className="w-full px-3 py-2 border border-gray-300 rounded-md"
//         />
//       </div>
//     </div>

//     <div className="flex justify-end mt-6 space-x-3">
//       <button
//         onClick={() => setIsModalOpen(false)}
//         className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
//       >
//         Cancel
//       </button>
//       <button
//         onClick={createBreakoutRooms}
//         disabled={isCreating}
//         className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
//       >
//         {isCreating ? (
//           <>
//             <svg
//               className="w-4 h-4 mr-2 animate-spin"
//               viewBox="0 0 24 24"
//             >
//               <circle
//                 className="opacity-25"
//                 cx="12"
//                 cy="12"
//                 r="10"
//                 stroke="currentColor"
//                 strokeWidth="4"
//                 fill="none"
//               />
//               <path
//                 className="opacity-75"
//                 fill="currentColor"
//                 d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
//               />
//             </svg>
//             Creating...
//           </>
//         ) : (
//           "Create Rooms"
//         )}{" "}
//       </button>
//     </div>
//   </div>
// </Modal>

// <Modal
//   isOpen={isViewModalOpen}
//   onRequestClose={() => setIsViewModalOpen(false)}
//   style={{
//     overlay: {
//       zIndex: 9999,
//       backgroundColor: "rgba(0,0,0,0.5)",
//       overflow: "hidden",
//     },
//     content: {
//       position: "absolute",
//       zIndex: 10000,
//       top: "50%",
//       left: "50%",
//       right: "auto",
//       bottom: "auto",
//       marginRight: "-50%",
//       transform: "translate(-50%, -50%)",
//       padding: 0,
//       border: "none",
//       background: "transparent",
//       maxHeight: "90vh",
//       maxWidth: "90vw",
//       overflow: "visible",
//     },
//   }}
// >
//   <div className="bg-white rounded-2xl shadow-xl w-full sm:w-96 max-h-[90vh] flex flex-col font-urbanist">
//     <div className="p-6 border-b">
//       <h2 className="text-xl font-bold text-gray-900">Breakout Rooms</h2>
//     </div>

//     <div className="flex-1 p-6 overflow-y-auto">
//       <div className="space-y-4">
//         {breakoutRooms.map((room) => (
//           <div
//             key={room.id}
//             className="p-4 transition-colors border rounded-xl bg-gray-50 hover:bg-gray-100"
//           >
//             <div className="space-y-2">
//               <p className="font-medium text-gray-900">
//                 Room ID: {room.id}
//               </p>
//               <p className="text-gray-600">
//                 Available Slots: {room.availableSlots}
//               </p>
//               <p className="text-gray-600">
//                 Duration: {room.roomDuration} minutes
//               </p>
//               <p className="text-gray-600">
//                 Members: {room.roomMembers.length}
//               </p>
//               <p className="text-gray-600">
//                 Ends at: {room.classEndTime.toDate().toLocaleString()}
//               </p>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>

//     <div className="p-6 border-t bg-gray-50 rounded-b-2xl">
//       <div className="flex justify-end">
//         <button
//           onClick={() => setIsViewModalOpen(false)}
//           className="px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
//         >
//           Close
//         </button>
//       </div>
//     </div>
//   </div>
// </Modal>
//     </>
//   );
// };

// export default VideoCallTutor;

import React, { useEffect, useState, useRef, useContext } from "react";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
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
import { CopyPlus, Users } from "lucide-react";

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

  // We’ll keep a reference to the Zego instance so we can leave/destroy it when switching rooms.
  const zegoInstanceRef = useRef(null);
  const callContainerRef = useRef(null);

  // Current user
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

  const updateRoomMembers = (roomId, isJoining = true) => {
    try {
      const breakoutRoomRef = doc(
        db,
        "conference_calls",
        tutorSelectedClassId,
        "breakout_rooms",
        roomId
      );

      updateDoc(breakoutRoomRef, {
        roomMembers: isJoining ? arrayUnion(user.uid) : arrayRemove(user.uid),
      });
    } catch (error) {
      console.error("Error updating room members:", error);
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
      setIsViewModalOpen(true);
    } catch (error) {
      console.error("Error fetching breakout rooms:", error);
    }
  };

  // -----------------------------------------
  //  Join any room by roomId (Main or Breakout)
  // -----------------------------------------
  const joinRoom = (roomId) => {
    setIsInMainCall(false);

    // 1) If there's a previous instance, leave the old room
    if (zegoInstanceRef.current) {
      // zegoInstanceRef.current.leaveRoom();
      zegoInstanceRef.current.destroy();

      // If you want to fully destroy the engine:
      // zegoInstanceRef.current.destroyEngine();
      zegoInstanceRef.current = null;
    }

    // 2) Generate new kit token for the new room
    const appId = parseInt(process.env.REACT_APP_ZEGO_APP_ID);
    const serverSecret = process.env.REACT_APP_ZEGO_SERVER_SECRET;

    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      appId,
      serverSecret,
      roomId, // the new room ID
      user.uid, // user ID
      user.name // user name
    );

    // 3) Create a brand-new ZegoUIKitPrebuilt instance
    const zp = ZegoUIKitPrebuilt.create(kitToken);

    // 4) Join the new room with your config
    zp.joinRoom({
      container: callContainerRef.current,
      turnOnMicrophoneWhenJoining: true,
      turnOnCameraWhenJoining: true,
      showMyCameraToggleButton: true,
      showMyMicrophoneToggleButton: true,
      showAudioVideoSettingsButton: true,
      showScreenSharingButton: true,
      showTextChat: true,
      showUserList: true,
      maxUsers: 50,
      layout: "Auto",
      showLayoutButton: true,
      scenario: {
        mode: "GroupCall",
        config: {
          role: "Host",
        },
      },
      bottomMenuBarConfig: {
        isVisible: true,
        maxButtons: 6,
        buttons: [
          "toggleCameraButton",
          "toggleMicrophoneButton",
          "switchAudioOutputButton",
          "leaveButton",
        ],
      },
      onJoinRoom: () => {
        setIsCallJoined(true);
        if (roomId === tutorSelectedClassId) {
          setIsInMainCall(true);
        }
      },
      onLeaveRoom: () => {
        // Reset flags when leaving any room
        setIsCallJoined(false);
        setIsInMainCall(false);
      },
    });

    // 5) Remember this instance so we can leave/destroy it next time
    zegoInstanceRef.current = zp;

    // 6) Update activeRoomId state
    setActiveRoomId(roomId);
  };

  // Convenience method to switch back to the main class
  const joinMainClass = () => {
    joinRoom(tutorSelectedClassId);
  };

  // -----------------------------------------
  //   If user clicks on a breakout room
  // -----------------------------------------
  // const handleJoinBreakoutRoom = (room) => {
  //   // If the breakout room's end time is in the future, join it
  //   const now = new Date();
  //   const endTime = room.classEndTime?.toDate?.() || null;
  //   if (!endTime || endTime < now) {
  //     alert("This breakout room is expired or has no valid end time.");
  //     return;
  //   }

  //   // Check available slots
  //   if (room.roomMembers.length >= room.availableSlots) {
  //     alert("This breakout room is full.");
  //     return;
  //   }

  //   // If user is already in this room, don't rejoin
  //   if (room.roomMembers.includes(user.uid)) {
  //     alert("You are already in this room.");
  //     return;
  //   }

  //   updateRoomMembers(room.id, true);

  //   // Switch to that breakout room
  //   joinRoom(room.id);

  //   // Calculate how long until it ends
  //   const remainingMs = endTime - now;
  //   // Once the time is up, automatically bring the user back to the main room
  //   setTimeout(() => {
  //     // (Optional) Only force them back if they are still in that breakout
  //     // E.g.: if (activeRoomId === room.id) joinMainClass();
  //     joinMainClass();
  //   }, remainingMs);
  // };
  const handleJoinBreakoutRoom = async (room) => {
    const now = new Date();
    const endTime = room.classEndTime?.toDate?.() || null;

    // If the room has not started yet, set the startedAt and classEndTime
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

      // Update the local state to reflect the changes
      room.startedAt = startedAt;
      room.classEndTime = classEndTime;
    }

    // Check available slots
    if (room.roomMembers.length >= room.availableSlots) {
      alert("This breakout room is full.");
      return;
    }

    // If user is already in this room, don't rejoin
    if (room.roomMembers.includes(user.uid)) {
      alert("You are already in this room.");
      return;
    }

    updateRoomMembers(room.id, true);

    // Switch to that breakout room
    joinRoom(room.id);

    // Calculate how long until it ends
    const remainingMs = room.classEndTime.toDate() - now;
    // Once the time is up, automatically bring the user back to the main room
    setTimeout(() => {
      joinMainClass();
    }, remainingMs);
  };
  // -----------------------------------------
  //   Mount: start in the main class call
  // -----------------------------------------
  useEffect(() => {
    // On first mount, join the main class
    if (tutorSelectedClassId) {
      joinMainClass();
    }
    // Cleanup on unmount
    return () => {
      if (zegoInstanceRef.current) {
        zegoInstanceRef.current.destroy();
        zegoInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line
  }, [tutorSelectedClassId]);

  // -----------------------------------------
  //   Render
  // -----------------------------------------
  return (
    <>
      {/* The container where Zego’s UI will appear */}
      <div ref={callContainerRef} style={{ width: "100vw", height: "100vh" }} />

      {/* If you want custom floating buttons */}
      {activeRoomId === tutorSelectedClassId &&
        isCallJoined &&
        isInMainCall && (
          <div className="fixed bottom-4 left-12 flex gap-2 z-[1000]">
            {/* Create Breakout Rooms (admins/tutors only) */}
            {hasBreakoutPermission && (
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

            {/* View/Join Breakout Rooms */}
            <button
              onClick={fetchBreakoutRooms}
              className="flex items-center justify-center
                       bg-[#313443] hover:bg-[#404352]
                       text-white rounded-lg w-10 h-10
                       transition-colors duration-200
                       shadow-md"
              aria-label="View Breakout Rooms"
            >
              <Users size={20} />
            </button>
          </div>
        )}

      {/* ------------------------
          Modal: Create Breakout Rooms 
      ------------------------ */}
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

      {/* ------------------------
          Modal: View/Join Breakout Rooms
      ------------------------ */}
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
                      <p className="font-medium text-gray-900">
                        Breakout Room {index + 1}{" "}
                        {/* Dynamically generate room name */}
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
                          ? "bg-green-500 cursor-not-allowed"
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
