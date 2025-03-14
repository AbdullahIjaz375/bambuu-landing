// src/components/CallPreview.js
import React, { useEffect, useState, useRef } from "react";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import {
  StreamVideo,
  StreamCall,
  CallControls,
  SpeakerLayout,
  StreamTheme,
} from "@stream-io/video-react-sdk";

// CSS for custom styling
import "./CallPreview.css";

const CallPreview = ({ streamVideoClient, currentCall }) => {

  return (
    <StreamVideo client={streamVideoClient}>
      <StreamTheme>
        <StreamCall call={currentCall}>
          <SpeakerLayout 
          participantsBarPosition={"bottom"}
          PictureInPicturePlaceholder={"bottom"}
          
          />
          <CallControls />
          
        </StreamCall>
      </StreamTheme>
    </StreamVideo>
  );
};

export default CallPreview;