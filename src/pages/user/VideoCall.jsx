// import React, { useEffect, useRef } from 'react';
// import { useParams } from 'react-router-dom';
// import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';

// const ConferenceRoom = () => {
//   const { classId } = useParams();
//   const containerRef = useRef(null);

//   function generateToken(userId) {
//     return ZegoUIKitPrebuilt.generateKitTokenForProduction(
//       935277783, // Your appID
//       'cd76ad5234331089f178f0325c999090fc6fd6aee08f9132daf312d9462817c0', // Your serverSecret
//       classId,  // Room ID
//       userId,   // User ID
//     );
//   }

//   useEffect(() => {
//     const startCall = async () => {
//       try {
//         // Generate a unique user ID based on timestamp and random number
//         const userId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;

//         // Generate the token
//         const token = generateToken(userId);

//         // Create the Zego instance
//         const zp = ZegoUIKitPrebuilt.create(token);

//         // Join the room with specific configurations
//         await zp.joinRoom({
//           container: containerRef.current,
//           scenario: {
//             mode: ZegoUIKitPrebuilt.GroupCall,
//             config: {
//               role: ZegoUIKitPrebuilt.Host,
//             },
//           },
//           showPreJoinView: true,  // Show preview before joining
//           showScreenSharingButton: true,
//           showUserList: true,
//           showPreviewTitle: true,
//           showLayoutButton: true,
//           showLeaveRoomButton: true,
//           showRoomDetailsButton: true,
//           turnOnCameraWhenJoining: false,  // Let user choose
//           turnOnMicrophoneWhenJoining: false, // Let user choose
//           showNonVideoUser: true,
//           showVideoRecordingButton: true,
//           showInviteMemberButton: true,
//         });
//       } catch (error) {
//         console.error('Failed to join room:', error);
//         // Here you might want to show an error message to the user
//       }
//     };

//     if (containerRef.current) {
//       startCall();
//     }
//   }, [classId]);

//   return (
//     <div
//       ref={containerRef}
//       className="w-full h-screen"
//     />
//   );
// };

import React from "react";
import { useParams } from "react-router-dom";

import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";

const VideoCall = () => {
  const { classId } = useParams();

  const user = JSON.parse(sessionStorage.getItem("user"));

  const userId = user.uid;
  const userName = user.name;

  const myMeeting = async (element) => {
    const appId = parseInt(process.env.REACT_APP_ZEGO_APP_ID);
    const serverSecret = process.env.REACT_APP_ZEGO_SERVER_SECRET;

    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      appId,
      serverSecret,
      classId,
      userId,
      userName
    );

    const zp = ZegoUIKitPrebuilt.create(kitToken);
    zp.joinRoom({
      container: element,
      scenario: {
        mode: ZegoUIKitPrebuilt.VideoConference,
      },
    });
  };

  return (
    <div
      className="myCallContainer"
      ref={myMeeting}
      style={{ width: "100vw", height: "100vh" }}
    ></div>
  );
};

export default VideoCall;

// import React from "react";
// import { useParams } from "react-router-dom";
// import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";

// const VideoCall = () => {
//   const { classId } = useParams();
//   const user = JSON.parse(sessionStorage.getItem("user"));
//   const userId = user?.uid || Math.floor(Math.random() * 10000).toString();

//   const myMeeting = async (element) => {
//     // Use environment variables
//     const appId = parseInt(process.env.REACT_APP_ZEGO_APP_ID);
//     const serverSecret = process.env.REACT_APP_ZEGO_SERVER_SECRET;

//     try {
//       const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
//         appId,
//         serverSecret,
//         classId,
//         userId,
//         user?.name || "Guest User" // Add username for better identification
//       );

//       const zp = ZegoUIKitPrebuilt.create(kitToken);
//       zp.joinRoom({
//         container: element,
//         scenario: {
//           mode: ZegoUIKitPrebuilt.VideoConference,
//         },
//         showScreenSharingButton: true,
//         showPreJoinView: true,
//         showLeavingView: true,
//         showUserList: true,
//         showRoomTimer: true,
//         maxUsers: 50,
//         layout: "Grid",
//         showLayoutButton: true,
//         showRoomDetailsButton: true,
//         showMicrophoneStateButton: true,
//         showCameraStateButton: true,
//         showTextChat: true,
//         showAudioVideoSettingsButton: true,
//       });
//     } catch (error) {
//       console.error("Error joining room:", error);
//     }
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
