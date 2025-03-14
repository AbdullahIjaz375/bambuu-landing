// src/components/CallPreview.js
import React, { useEffect, useState, useRef } from "react";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import {
  StreamVideo,
  StreamCall,
  CallControls,
  PaginatedGridLayout,
  SpeakerLayout,
  ParticipantView,
  useCallStateHooks,
  useCall,
  CallParticipantsList,
  StreamTheme,
  SpeakingWhileMutedNotification,
  ToggleAudioPublishingButton,
  ToggleVideoPublishingButton,
  CancelCallButton,
  ScreenShareButton,
  DeviceSettings,
  RecordCallButton
} from "@stream-io/video-react-sdk";

// CSS for custom styling
import "./CallPreview.css";

const CallPreview = ({ streamVideoClient, currentCall }) => {
  const containerRef = useRef(null);
  const participantsBarRef = useRef(null);
  const [layout, setLayout] = useState("grid"); // 'grid' or 'speaker'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Custom Call UI Component
  const CustomCallUI = () => {
    const call = useCall();
    const { useParticipants, useLocalParticipant } = useCallStateHooks();
    const participants = useParticipants();
    const localParticipant = useLocalParticipant();
    const [participantInSpotlight, ...otherParticipants] = participants;
    
    // Determine if it's a 1:1 call
    const isOneToOneCall = participants.length === 2;
    
    // Set up participant sorting
    useEffect(() => {
      if (!call) return;
      
      // Custom sorting for participants
      const getCustomSortingPreset = (isOneToOne) => {
        if (isOneToOne) {
          return (a, b) => {
            if (a.isLocalParticipant) return 1;
            if (b.isLocalParticipant) return -1;
            return 0;
          };
        }
        
        // Group call sorting (simplified version)
        return call.defaultSortParticipantsBy;
      };
      
      call.setSortParticipantsBy(getCustomSortingPreset(isOneToOneCall));
    }, [call, isOneToOneCall]);
    
    // Viewport tracking for bandwidth optimization
    useEffect(() => {
      if (!participantsBarRef.current || !call) return;
      
      const cleanup = call.dynascaleManager.viewportTracker.setViewport(participantsBarRef.current);
      return () => cleanup();
    }, [call]);
    
    // Toggle fullscreen
    const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
      } else {
        document.exitFullscreen();
      }
    };
    
    if (!call) return null;

    return (
      <div className="call-container" ref={containerRef}>
        {/* Room header */}
        <div className="call-header">
          <div className="room-info">
            <span>{participants.length} participants</span>
          </div>
          
          <div className="header-actions">
            <button 
              className="header-button" 
              onClick={() => setLayout(layout === "grid" ? "speaker" : "grid")}
            >
              {layout === "grid" ? "Speaker View" : "Grid View"}
            </button>
            
            <button 
              className="header-button" 
              onClick={() => setIsParticipantsOpen(!isParticipantsOpen)}
            >
              Participants
            </button>
            
            <button 
              className="header-button" 
              onClick={toggleFullscreen}
            >
              {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            </button>
          </div>
        </div>
        
        {/* Main content area - either custom speaker view or grid layout */}
        <div className="call-content">
          {layout === "speaker" ? (
            <div className="speaker-view">
              {/* Participants bar (top row) */}
              {otherParticipants.length > 0 && (
                <div className="participants-bar" ref={participantsBarRef}>
                  {otherParticipants.map((participant) => (
                    <div className="participant-tile" key={participant.sessionId}>
                      <ParticipantView participant={participant} />
                      <div className="participant-name">{participant.name || participant.userId}</div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Spotlight view (main speaker) */}
              <div className="spotlight">
                {participantInSpotlight && (
                  <ParticipantView
                    participant={participantInSpotlight}
                    trackType={
                      participantInSpotlight.screenShareTrack
                        ? "screenShareTrack"
                        : "videoTrack"
                    }
                  />
                )}
                <div className="spotlight-name">
                  {participantInSpotlight?.name || participantInSpotlight?.userId || "No participants"}
                </div>
              </div>
            </div>
          ) : (
            <PaginatedGridLayout />
          )}
          
          {/* Participants panel (side panel) */}
          {isParticipantsOpen && (
            <div className="participants-panel">
              <div className="panel-header">
                <h3>Participants</h3>
                <button onClick={() => setIsParticipantsOpen(false)}>×</button>
              </div>
              <CallParticipantsList />
            </div>
          )}
        </div>
        
        {/* Call controls */}
        <div className="call-controls-wrapper">
          <CallControls />
        </div>
      </div>
    );
  };

  return (
    <StreamVideo client={streamVideoClient}>
      <StreamTheme>
        <StreamCall call={currentCall}>
          <CustomCallUI />
        </StreamCall>
      </StreamTheme>
    </StreamVideo>
  );
};

export default CallPreview;