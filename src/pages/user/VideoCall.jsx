// import React from "react";
// import { useLocation, useParams } from "react-router-dom";

// import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";

// const VideoCall = () => {
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

// export default VideoCall;

// import React, { useEffect } from "react";
// import { useLocation } from "react-router-dom";
// import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";

// const VideoCall = () => {
//   const location = useLocation();
//   const classId = location.state?.classId;

//   // Add useEffect for page refresh
//   useEffect(() => {
//     const hasRefreshed = sessionStorage.getItem("hasRefreshed");
//     if (!hasRefreshed) {
//       sessionStorage.setItem("hasRefreshed", "true");
//       window.location.reload();
//       return;
//     }
//     // Clean up the refresh flag when component unmounts
//     return () => {
//       sessionStorage.removeItem("hasRefreshed");
//     };
//   }, []);

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

// export default VideoCall;

// VideoCall.js

import React, { useEffect, useState, useContext } from "react";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
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

const VideoCall = () => {
  const { selectedClassId, setSelectedClassId } = useContext(ClassContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [numRooms, setNumRooms] = useState(2);
  const [roomDuration, setRoomDuration] = useState(15);
  const [availableSlots, setAvailableSlots] = useState(5);
  const [classId, setClassId] = useState(null);

  const [breakoutRooms, setBreakoutRooms] = useState([]);
  console.log(selectedClassId);
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

  useEffect(() => {
    // Try context first, then localStorage
    const id = selectedClassId || localStorage.getItem("currentClassId");
    setClassId(id);
    if (!selectedClassId && id) {
      setSelectedClassId(id);
    }
  }, [selectedClassId, setSelectedClassId]);

  const createBreakoutRooms = async () => {
    try {
      const classRef = collection(db, "classes");
      const q = query(classRef, where("classId", "==", selectedClassId));
      const querySnapshot = await getDocs(q);
      const classData = querySnapshot.docs[0].data();
      const classDateTime = classData.classDateTime;

      const breakoutRef = collection(
        db,
        "conference_call",
        selectedClassId,
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
        selectedClassId,
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
      "56gt76hyb",
      user.uid,
      user.name
    );

    const zp = ZegoUIKitPrebuilt.create(kitToken);

    const bottomButtons = [
      {
        text: "Create Breakout Room",
        onClick: () => setIsModalOpen(true),
      },
      {
        text: "View Breakout Rooms",
        onClick: fetchBreakoutRooms,
      },
    ];

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
      topMenuBarButtons: [
        {
          name: "CreateBreakoutRoom",
          text: "Create Breakout Room",
          icon: [], // You can add an icon array if needed
          onClick: () => setIsModalOpen(true),
        },
        {
          name: "ViewBreakoutRooms",
          text: "View Breakout Rooms",
          icon: [],
          onClick: fetchBreakoutRooms,
        },
      ],
      bottomMenuButtons: [
        {
          name: "CreateBreakoutRoom",
          text: "Breakout Room",
          icon: [],
          onClick: () => setIsModalOpen(true),
        },
      ],
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

export default VideoCall;
// VideoCall.js

// import React, { useEffect, useState, useContext } from "react";
// import {
//   ZegoUIKitPrebuilt,
//   ZegoMenuBarButtonName,
// } from "@zegocloud/zego-uikit-prebuilt";
// import { ClassContext } from "../../context/ClassContext";
// import { db } from "../../firebaseConfig";
// import {
//   collection,
//   addDoc,
//   getDocs,
//   query,
//   where,
//   Timestamp,
// } from "firebase/firestore";
// import Modal from "react-modal";

// Modal.setAppElement("#root");

// const VideoCall = () => {
//   const { selectedClassId } = useContext(ClassContext);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [numRooms, setNumRooms] = useState(2);
//   const [roomDuration, setRoomDuration] = useState(15);
//   const [availableSlots, setAvailableSlots] = useState(5);

//   useEffect(() => {
//     console.log("In VideoCall:", selectedClassId);
//   }, [selectedClassId]);
//   const [breakoutRooms, setBreakoutRooms] = useState([]);
//   const user = JSON.parse(sessionStorage.getItem("user"));

//   useEffect(() => {
//     const hasRefreshed = sessionStorage.getItem("hasRefreshed");
//     if (!hasRefreshed) {
//       sessionStorage.setItem("hasRefreshed", "true");
//       window.location.reload();
//       return;
//     }
//     return () => sessionStorage.removeItem("hasRefreshed");
//   }, []);

//   const createBreakoutRooms = async () => {
//     try {
//       const classRef = collection(db, "classes");
//       const q = query(classRef, where("classId", "==", selectedClassId));
//       const querySnapshot = await getDocs(q);
//       const classData = querySnapshot.docs[0].data();
//       // const classDateTime = classData.classDateTime; // You can use this if needed
//       const breakoutRef = collection(
//         db,
//         "conference_call",
//         selectedClassId,
//         "breakout_rooms"
//       );

//       for (let i = 0; i < numRooms; i++) {
//         const roomRef = await addDoc(breakoutRef, {
//           availableSlots,
//           classEndTime: Timestamp.fromDate(
//             new Date(Date.now() + roomDuration * 60000)
//           ),
//           roomDuration,
//           roomMembers: [],
//         });

//         // Store additional sub-collections or sub-documents if you need them
//         await addDoc(collection(breakoutRef, roomRef.id), {
//           roomId: roomRef.id,
//         });
//       }

//       setIsModalOpen(false);
//     } catch (error) {
//       console.error("Error creating breakout rooms:", error);
//     }
//   };

//   const fetchBreakoutRooms = async () => {
//     try {
//       const breakoutRef = collection(
//         db,
//         "conference_call",
//         selectedClassId,
//         "breakout_rooms"
//       );
//       const querySnapshot = await getDocs(breakoutRef);
//       setBreakoutRooms(
//         querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
//       );
//     } catch (error) {
//       console.error("Error fetching breakout rooms:", error);
//     }
//   };

//   const myMeeting = async (element) => {
//     const appId = parseInt(process.env.REACT_APP_ZEGO_APP_ID);
//     const serverSecret = process.env.REACT_APP_ZEGO_SERVER_SECRET;

//     const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
//       appId,
//       serverSecret,
//       selectedClassId, // your roomID or some identifier
//       user.uid,
//       user.name
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

//       // ---- THIS IS THE IMPORTANT PART FOR CUSTOM BUTTONS ----
//       topMenuBarConfig: {
//         isVisible: true,
//         buttons: [
//           // Custom Buttons
//           {
//             icon: "", // Optionally provide an icon URL or component
//             text: "Create Breakout Room",
//             onClick: () => setIsModalOpen(true),
//           },
//           {
//             icon: "",
//             text: "View Breakout Rooms",
//             onClick: fetchBreakoutRooms,
//           },
//         ],
//       },
//       bottomMenuBarConfig: {
//         isVisible: true,
//         buttons: [
//           // Custom Button
//           {
//             icon: "",
//             text: "Breakout Room",
//             onClick: () => setIsModalOpen(true),
//           },
//         ],
//       },
//     });
//   };

//   return (
//     <>
//       <div
//         className="myCallContainer"
//         ref={myMeeting}
//         style={{ width: "100vw", height: "100vh" }}
//       />

//       <Modal
//         isOpen={isModalOpen}
//         onRequestClose={() => setIsModalOpen(false)}
//         className="fixed inset-0 flex items-center justify-center"
//         overlayClassName="fixed inset-0 bg-black bg-opacity-50"
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
//     </>
//   );
// };

// export default VideoCall;
