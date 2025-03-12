import React from "react";
import {
  StreamVideo,
  StreamCall,
  SpeakerLayout,
  CallControls,
} from "@stream-io/video-react-sdk";

const VideoCallUI = ({ currentCall, streamVideoClient }) => {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <StreamVideo client={streamVideoClient}>
        <StreamCall call={currentCall}>
          {/* Shows active speaker in a large tile and other participants in smaller tiles */}
          <SpeakerLayout />

          {/* Renders default call controls (mute/unmute, camera toggle, etc.) at bottom */}
          <CallControls />
        </StreamCall>
      </StreamVideo>
    </div>
  );
};

export default VideoCallUI;
