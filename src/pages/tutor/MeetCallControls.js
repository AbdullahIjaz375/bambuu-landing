// src/components/MeetCallControls.js
import React, { useState } from "react";
import { useCall, useCallStateHooks } from "@stream-io/video-react-sdk";
import { 
  Mic, MicOff, Video, VideoOff, 
  ScreenShare, PhoneOff, MessageSquare,
  Settings, Users, Grid, PictureInPicture,
  Hand, Info, MoreVertical
} from "lucide-react";

// Control Button Component
const ControlButton = ({ 
  icon, 
  activeIcon, 
  label, 
  onClick, 
  isActive = false, 
  variant = "default",
  disabled = false
}) => {
  const getButtonClasses = () => {
    if (disabled) return "bg-gray-400 text-gray-200 cursor-not-allowed";
    
    if (variant === "danger") {
      return isActive 
        ? "bg-red-500 hover:bg-red-600" 
        : "bg-red-500 hover:bg-red-600";
    }
    
    if (variant === "warning") {
      return isActive 
        ? "bg-yellow-500 hover:bg-yellow-600" 
        : "hover:bg-gray-700";
    }
    
    return isActive 
      ? "bg-blue-500 hover:bg-blue-600" 
      : "hover:bg-gray-700";
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-3 rounded-full flex flex-col items-center mx-1 transition duration-200 ${getButtonClasses()}`}
    >
      {isActive && activeIcon ? activeIcon : icon}
      <span className="text-white text-xs mt-1">{label}</span>
    </button>
  );
};

// More Options Menu Component
const MoreOptionsMenu = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="absolute bottom-24 bg-gray-800 rounded-lg shadow-lg py-2 z-50 animate-fade-in min-w-[180px]">
      {children}
    </div>
  );
};

// Menu Item Component
const MenuItem = ({ icon, label, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center w-full px-4 py-2 text-white hover:bg-gray-700 transition duration-200"
    >
      {icon}
      <span className="ml-3">{label}</span>
    </button>
  );
};

// Main Component
const MeetCallControls = ({ 
  onLayoutChange, 
  onToggleParticipants, 
  onToggleSettings,
  onToggleChat,
  onToggleFullscreen,
  onLeaveCall
}) => {
  // Get the call instance
  const call = useCall();
  
  // State for UI elements
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isScreenShareEnabled, setIsScreenShareEnabled] = useState(false);
  const [isRaisingHand, setIsRaisingHand] = useState(false);
  const [isGridView, setIsGridView] = useState(true);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  
  // Toggle microphone
  const toggleMicrophone = async () => {
    if (!call) return;
    
    try {
      if (isMicEnabled) {
        await call.microphone.disable();
      } else {
        await call.microphone.enable();
      }
      setIsMicEnabled(!isMicEnabled);
    } catch (error) {
      console.error("Error toggling microphone:", error);
    }
  };
  
  // Toggle camera
  const toggleCamera = async () => {
    if (!call) return;
    
    try {
      if (isCameraEnabled) {
        await call.camera.disable();
      } else {
        await call.camera.enable();
      }
      setIsCameraEnabled(!isCameraEnabled);
    } catch (error) {
      console.error("Error toggling camera:", error);
    }
  };
  
  // Toggle screen share
  const toggleScreenShare = async () => {
    if (!call) return;
    
    try {
      if (isScreenShareEnabled) {
        await call.stopScreenShare();
      } else {
        await call.startScreenShare();
      }
      setIsScreenShareEnabled(!isScreenShareEnabled);
    } catch (error) {
      console.error("Error toggling screen share:", error);
    }
  };
  
  // Toggle raise hand
  const toggleRaiseHand = () => {
    if (!call) return;
    
    setIsRaisingHand(!isRaisingHand);
    
    // Send custom event to other participants
    call.sendCustomEvent({
      type: 'hand-raise',
      data: { 
        userId: call.state?.localParticipant?.userId || 'unknown',
        userName: call.state?.localParticipant?.name || 'User',
        isRaised: !isRaisingHand 
      }
    }).catch(err => console.error("Error sending hand raise event:", err));
  };
  
  // Toggle layout view
  const toggleLayoutView = () => {
    const newView = isGridView ? 'speaker' : 'grid';
    setIsGridView(!isGridView);
    if (onLayoutChange) {
      onLayoutChange(newView);
    }
  };
  
  // If no call object yet, show disabled controls
  if (!call) {
    return (
      <div className="flex items-center justify-center bg-gray-900 bg-opacity-90 backdrop-blur-sm rounded-full px-2 py-1 shadow-lg">
        <ControlButton 
          icon={<Mic size={24} color="white" />}
          label="Mute"
          disabled={true}
        />
        <ControlButton 
          icon={<Video size={24} color="white" />}
          label="Video"
          disabled={true}
        />
        {/* Add other disabled buttons as needed */}
        <ControlButton 
          icon={<PhoneOff size={24} color="white" />}
          label="Leave"
          onClick={onLeaveCall}
          variant="danger"
        />
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center bg-gray-900 bg-opacity-90 backdrop-blur-sm rounded-full px-2 py-1 shadow-lg">
      {/* Microphone control */}
      <ControlButton 
        icon={<Mic size={24} color="white" />}
        activeIcon={<MicOff size={24} color="white" />}
        label={isMicEnabled ? "Mute" : "Unmute"}
        isActive={!isMicEnabled}
        onClick={toggleMicrophone}
        variant={!isMicEnabled ? "danger" : "default"}
      />
      
      {/* Camera control */}
      <ControlButton 
        icon={<Video size={24} color="white" />}
        activeIcon={<VideoOff size={24} color="white" />}
        label={isCameraEnabled ? "Stop Video" : "Start Video"}
        isActive={!isCameraEnabled}
        onClick={toggleCamera}
        variant={!isCameraEnabled ? "danger" : "default"}
      />
      
      {/* Screen share */}
      <ControlButton 
        icon={<ScreenShare size={24} color="white" />}
        label="Present"
        isActive={isScreenShareEnabled}
        onClick={toggleScreenShare}
      />
      
      {/* Raise hand */}
      <ControlButton 
        icon={<Hand size={24} color="white" />}
        label={isRaisingHand ? "Lower Hand" : "Raise Hand"}
        isActive={isRaisingHand}
        onClick={toggleRaiseHand}
        variant="warning"
      />
      
      {/* Layout toggle */}
      <ControlButton 
        icon={isGridView ? <PictureInPicture size={24} color="white" /> : <Grid size={24} color="white" />}
        label={isGridView ? "Speaker View" : "Grid View"}
        onClick={toggleLayoutView}
      />
      
      {/* Participants */}
      <ControlButton 
        icon={<Users size={24} color="white" />}
        label="Participants"
        onClick={onToggleParticipants}
      />
      
      {/* Chat */}
      <ControlButton 
        icon={<MessageSquare size={24} color="white" />}
        label="Chat"
        onClick={onToggleChat}
      />
      
      {/* More options */}
      <ControlButton 
        icon={<MoreVertical size={24} color="white" />}
        label="More"
        onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
        isActive={isMoreMenuOpen}
      />
      
      {/* Leave call */}
      <ControlButton 
        icon={<PhoneOff size={24} color="white" />}
        label="Leave"
        onClick={onLeaveCall}
        variant="danger"
      />
      
      {/* More Options Menu */}
      {isMoreMenuOpen && (
        <MoreOptionsMenu onClose={() => setIsMoreMenuOpen(false)}>
          <MenuItem 
            icon={<Settings size={18} />} 
            label="Settings" 
            onClick={() => {
              onToggleSettings();
              setIsMoreMenuOpen(false);
            }}
          />
          <MenuItem 
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"></path>
            </svg>} 
            label="Fullscreen" 
            onClick={() => {
              onToggleFullscreen();
              setIsMoreMenuOpen(false);
            }}
          />
          <MenuItem 
            icon={<Info size={18} />} 
            label="Meeting info" 
            onClick={() => {
              // Meeting info logic here
              setIsMoreMenuOpen(false);
            }}
          />
          <hr className="my-1 border-gray-700" />
          <MenuItem 
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
              <line x1="4" y1="22" x2="4" y2="15"></line>
            </svg>} 
            label="Report a problem" 
            onClick={() => {
              // Report problem logic here
              setIsMoreMenuOpen(false);
            }}
          />
        </MoreOptionsMenu>
      )}
    </div>
  );
};

export default MeetCallControls;