// import React from "react";
// import { useLocation, useParams } from "react-router-dom";

// import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";

// const VideoCallTutor = () => {
//   const location = useLocation();
//   const classId = location.state?.classId;

//   console.log("Class ID:", classId);
//   const user = JSON.parse(sessionStorage.getItem("user"));

//   const userId = user.uid;
//   const userName = user.name;

//   const myMeeting = async (element) => {
//     const appId = parseInt(process.env.REACT_APP_ZEGO_APP_ID);
//     const serverSecret = process.env.REACT_APP_ZEGO_SERVER_SECRET;

//     const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
//       appId,
//       serverSecret,
//       classId,
//       userId,
//       userName
//     );

//     const zp = ZegoUIKitPrebuilt.create(kitToken);
//     zp.joinRoom({
//       container: element,
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
//     });
//   };

//   return (
//     <div
//       className="myCallContainer"
//       ref={myMeeting}
//       style={{ width: "100vw", height: "100vh" }}
//     ></div>
//   );
// };

// export default VideoCallTutor;

import React, { useEffect, useState, useContext } from "react";
import {
  ZegoUIKitPrebuilt,
  ZegoMenuBarButtonName,
} from "@zegocloud/zego-uikit-prebuilt";
import { ClassContext } from "../../context/ClassContext";
import { db } from "../../firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import Modal from "react-modal";

Modal.setAppElement("#root");

const VideoCallTutor = () => {
  const { tutorSelectedClassId } = useContext(ClassContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [numRooms, setNumRooms] = useState(2);
  const [roomDuration, setRoomDuration] = useState(15);
  const [availableSlots, setAvailableSlots] = useState(5);

  useEffect(() => {
    console.log("In VideoCall:", tutorSelectedClassId);
  }, [tutorSelectedClassId]);
  const [breakoutRooms, setBreakoutRooms] = useState([]);
  const user = JSON.parse(sessionStorage.getItem("user"));

  useEffect(() => {
    const hasRefreshed = sessionStorage.getItem("hasRefreshed");
    if (!hasRefreshed) {
      sessionStorage.setItem("hasRefreshed", "true");
      window.location.reload();
      return;
    }
    return () => sessionStorage.removeItem("hasRefreshed");
  }, []);

  const createBreakoutRooms = async () => {
    try {
      const classRef = collection(db, "classes");
      const q = query(classRef, where("classId", "==", tutorSelectedClassId));
      const querySnapshot = await getDocs(q);
      const classData = querySnapshot.docs[0].data();
      // const classDateTime = classData.classDateTime; // You can use this if needed
      const breakoutRef = collection(
        db,
        "conference_call",
        tutorSelectedClassId,
        "breakout_rooms"
      );

      for (let i = 0; i < numRooms; i++) {
        const roomRef = await addDoc(breakoutRef, {
          availableSlots,
          classEndTime: Timestamp.fromDate(
            new Date(Date.now() + roomDuration * 60000)
          ),
          roomDuration,
          roomMembers: [],
        });

        // Store additional sub-collections or sub-documents if you need them
        await addDoc(collection(breakoutRef, roomRef.id), {
          roomId: roomRef.id,
        });
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error("Error creating breakout rooms:", error);
    }
  };

  const fetchBreakoutRooms = async () => {
    try {
      const breakoutRef = collection(
        db,
        "conference_call",
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

  const myMeeting = async (element) => {
    const appId = parseInt(process.env.REACT_APP_ZEGO_APP_ID);
    const serverSecret = process.env.REACT_APP_ZEGO_SERVER_SECRET;

    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      appId,
      serverSecret,
      tutorSelectedClassId, // your roomID or some identifier
      user.uid,
      user.name
    );

    const zp = ZegoUIKitPrebuilt.create(kitToken);

    zp.joinRoom({
      container: element,
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
        maxButtons: 10, // see "2. Check for Overflow" below
        // Your custom button:
        buttons: ["toggleCameraButton", "toggleMicrophoneButton"],
        extendButtons: [
          {
            icon: <img alt="button" src="/svgs/users/svg" />, // or a component, or an SVG
            text: "Create Breakout Room",
            onClick: () => setIsModalOpen(true),
          },
          {
            icon: <img alt="button" src="/svgs/users/svg" />, // or a component, or an SVG
            text: "View Breakout Rooms",
            onClick: fetchBreakoutRooms,
          },
        ],
      },
    });
  };

  return (
    <>
      <div
        className="myCallContainer"
        ref={myMeeting}
        style={{ width: "100vw", height: "100vh" }}
      />

      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        className="fixed inset-0 flex items-center justify-center"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50"
      >
        <div className="p-8 bg-white rounded-lg w-96">
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
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Create Rooms
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default VideoCallTutor;

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

// Modal.setAppElement("#root");

// const VideoCallTutor = () => {
//   const { tutorSelectedClassId } = useContext(ClassContext);

//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [numRooms, setNumRooms] = useState(2);
//   const [roomDuration, setRoomDuration] = useState(15);
//   const [availableSlots, setAvailableSlots] = useState(5);
//   const [classData, setClassData] = useState(null);
//   const [isViewModalOpen, setIsViewModalOpen] = useState(false);

//   const [breakoutRooms, setBreakoutRooms] = useState([]);
//   const user = JSON.parse(sessionStorage.getItem("user"));

//   const callContainerRef = useRef(null);

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
//     // Only reload once to fix known refresh issue
//     const hasRefreshed = sessionStorage.getItem("hasRefreshed");
//     if (!hasRefreshed) {
//       sessionStorage.setItem("hasRefreshed", "true");
//       window.location.reload();
//       return;
//     }
//     return () => sessionStorage.removeItem("hasRefreshed");
//   }, []);

//   useEffect(() => {
//     console.log("In VideoCallTutor: selectedClassId =", tutorSelectedClassId);
//   }, [tutorSelectedClassId]);

//   const createBreakoutRooms = async () => {
//     try {
//       if (!classData) return;
//       const classStartTimestamp = classData.classDateTime;
//       const classEndTime = new Date(
//         (classStartTimestamp.seconds + classData.classDuration * 60) * 1000
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
//           classEndTime: Timestamp.fromDate(classEndTime),
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
//     });
//   };

//   useEffect(() => {
//     // Initialize the call UI as soon as the component mounts.
//     startZegoCall();
//   }, []);

//   return (
//     <>
//       {/* Our custom controls above (or anywhere outside) the ZEGOCLOUD UI container */}
//       <div style={{ padding: "10px", backgroundColor: "#f1f1f1" }}>
//         <button
//           onClick={() => setIsModalOpen(true)}
//           style={{ marginRight: "10px" }}
//         >
//           Create Breakout Room
//         </button>
//         <button onClick={fetchBreakoutRooms}>View Breakout Rooms</button>
//       </div>

//       {/* ZEGOCLOUD UI container */}
//       <div
//         ref={callContainerRef}
//         style={{ width: "100vw", height: "95.3vh" }}
//       />

//       {/* Breakout Room Modal */}
//       <Modal
//         isOpen={isModalOpen}
//         onRequestClose={() => setIsModalOpen(false)}
//         style={{
//           overlay: {
//             zIndex: 9999,
//             backgroundColor: "rgba(0,0,0,0.5)",
//           },
//           content: {
//             zIndex: 10000,
//             top: "50%",
//             left: "50%",
//             right: "auto",
//             bottom: "auto",
//             marginRight: "-50%",
//             transform: "translate(-50%, -50%)",
//           },
//         }}
//       >
//         <div className="p-8 bg-white rounded-lg w-96">
//           <h2 className="mb-6 text-xl font-bold">Create Breakout Rooms</h2>

//           <div className="space-y-4">
//             <div>
//               <label className="block mb-1 text-sm font-medium text-gray-700">
//                 Number of Rooms
//               </label>
//               <input
//                 type="number"
//                 value={numRooms}
//                 onChange={(e) => setNumRooms(parseInt(e.target.value))}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md"
//               />
//             </div>

//             <div>
//               <label className="block mb-1 text-sm font-medium text-gray-700">
//                 Room Duration (minutes)
//               </label>
//               <input
//                 type="number"
//                 value={roomDuration}
//                 onChange={(e) => setRoomDuration(parseInt(e.target.value))}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md"
//               />
//             </div>

//             <div>
//               <label className="block mb-1 text-sm font-medium text-gray-700">
//                 Available Slots
//               </label>
//               <input
//                 type="number"
//                 value={availableSlots}
//                 onChange={(e) => setAvailableSlots(parseInt(e.target.value))}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md"
//               />
//             </div>
//           </div>

//           <div className="flex justify-end mt-6 space-x-3">
//             <button
//               onClick={() => setIsModalOpen(false)}
//               className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
//             >
//               Cancel
//             </button>
//             <button
//               onClick={createBreakoutRooms}
//               className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
//             >
//               Create Rooms
//             </button>
//           </div>
//         </div>
//       </Modal>

//       <Modal
//         isOpen={isViewModalOpen}
//         onRequestClose={() => setIsViewModalOpen(false)}
//         style={{
//           overlay: { zIndex: 9999, backgroundColor: "rgba(0,0,0,0.5)" },
//           content: {
//             zIndex: 10000,
//             top: "50%",
//             left: "50%",
//             right: "auto",
//             bottom: "auto",
//             marginRight: "-50%",
//             transform: "translate(-50%, -50%)",
//           },
//         }}
//       >
//         <div className="p-8 bg-white rounded-lg w-96">
//           <h2 className="mb-6 text-xl font-bold">Breakout Rooms</h2>
//           <div className="space-y-4">
//             {breakoutRooms.map((room) => (
//               <div key={room.id} className="p-4 border rounded-lg">
//                 <p className="font-medium">Room ID: {room.id}</p>
//                 <p>Available Slots: {room.availableSlots}</p>
//                 <p>Duration: {room.roomDuration} minutes</p>
//                 <p>Members: {room.roomMembers.length}</p>
//                 <p>Ends at: {room.classEndTime.toDate().toLocaleString()}</p>
//               </div>
//             ))}
//           </div>
//           <div className="flex justify-end mt-6">
//             <button
//               onClick={() => setIsViewModalOpen(false)}
//               className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
//             >
//               Close
//             </button>
//           </div>
//         </div>
//       </Modal>
//     </>
//   );
// };

// export default VideoCallTutor;
