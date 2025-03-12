// src/components/EnhancedCallControls.js
import React, { useState } from "react";
import { 
  Mic, MicOff, Video, VideoOff, ScreenShare, PhoneOff,
  MessageSquare, Settings, Hand, Grid, Maximize, 
  MoreVertical, Info, Users, X
} from "lucide-react";
import { useCall, DeviceSettings } from "@stream-io/video-react-sdk";

// Reusable Control Button Component
const ControlButton = ({ 
  icon, 
  activeIcon = null, 
  label, 
  isActive = false, 
  onClick, 
  variant = "default" 
}) => {
  // Determine background color based on variant and active state
  const getBgColor = () => {
    if (variant === "danger") return isActive ? "bg-red-500 hover:bg-red-600" : "bg-red-500 hover:bg-red-600";
    if (variant === "success") return isActive ? "bg-green-500 hover:bg-green-600" : "bg-gray-700 hover:bg-gray-600";
    if (variant === "warning") return isActive ? "bg-yellow-500 hover:bg-yellow-600" : "bg-gray-700 hover:bg-gray-600";
    if (variant === "info") return isActive ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-700 hover:bg-gray-600";
    return isActive ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-700 hover:bg-gray-600";
  };

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-3 px-14 rounded-full transition-colors ${getBgColor()}`}
      aria-label={label}
      title={label} // Added tooltip
    >
      {isActive && activeIcon ? activeIcon : icon}
      <span className="text-xs text-white mt-1">{label}</span>
    </button>
  );
};

// Sidebar Component
const Sidebar = ({ title, isOpen, onClose, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed top-0 right-0 bottom-0 w-80 bg-white shadow-lg z-40 flex flex-col animate-slide-in">
      <div className="p-4 border-b bg-gray-50">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      {children}
    </div>
  );
};

// Modal Component
const Modal = ({ title, isOpen, onClose, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-black bg-opacity-50 z-50 animate-fade-in">
      <div className="bg-white p-6 rounded-lg max-w-lg w-full shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// Dropdown Menu Component
const DropdownMenu = ({ isOpen, position, onClose, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className={`absolute ${position} bg-gray-800 rounded-lg p-2 shadow-lg z-50 animate-fade-in`}>
      {children}
      
      <button
        onClick={onClose}
        className="flex items-center w-full p-2 hover:bg-gray-700 rounded mt-2 border-t border-gray-700 pt-2"
      >
        <X size={16} className="mr-2" color="white" />
        <span className="text-white">Close</span>
      </button>
    </div>
  );
};

// Main Controls Component
const EnhancedCallControls = ({ onLeaveCall, onLayoutChange }) => {
  const call = useCall();
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRaisingHand, setIsRaisingHand] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGridView, setIsGridView] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  // Consolidated toggle functions
  const toggleState = {
    mic: async () => {
      try {
        isMuted ? await call.microphone.enable() : await call.microphone.disable();
        setIsMuted(!isMuted);
      } catch (error) {
        console.error("Error toggling microphone:", error);
      }
    },
    camera: async () => {
      try {
        isCameraOff ? await call.camera.enable() : await call.camera.disable();
        setIsCameraOff(!isCameraOff);
      } catch (error) {
        console.error("Error toggling camera:", error);
      }
    },
    screenShare: async () => {
      try {
        isScreenSharing ? await call.stopScreenShare() : await call.startScreenShare();
        setIsScreenSharing(!isScreenSharing);
      } catch (error) {
        console.error("Error toggling screen share:", error);
      }
    },
    raiseHand: () => setIsRaisingHand(!isRaisingHand),
    chat: () => setIsChatOpen(!isChatOpen),
    participants: () => setShowParticipants(!showParticipants),
    grid: () => {
      setIsGridView(!isGridView);
      if (onLayoutChange) {
        onLayoutChange(isGridView ? 'speaker' : 'grid');
      }
    },
    moreOptions: () => setShowMoreOptions(!showMoreOptions),
    settings: () => {
      setIsSettingsOpen(!isSettingsOpen);
      if (showMoreOptions) setShowMoreOptions(false);
    },
    fullscreen: () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
      if (showMoreOptions) setShowMoreOptions(false);
    }
  };

  return (
    <>
      {/* Main control bar */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center items-center p-4 bg-gray-900 bg-opacity-95 backdrop-blur-sm z-50 shadow-lg">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <ControlButton 
            icon={<Mic size={24} color="white" />}
            activeIcon={<MicOff size={24} color="white" />}
            label={isMuted ? "Unmute" : "Mute"}
            isActive={isMuted}
            onClick={toggleState.mic}
            variant={isMuted ? "danger" : "default"}
          />
          
          <ControlButton 
            icon={<Video size={24} color="white" />}
            activeIcon={<VideoOff size={24} color="white" />}
            label={isCameraOff ? "Start Video" : "Stop Video"}
            isActive={isCameraOff}
            onClick={toggleState.camera}
            variant={isCameraOff ? "danger" : "default"}
          />
          
          <ControlButton 
            icon={<ScreenShare size={24} color="white" />}
            label="Share Screen"
            isActive={isScreenSharing}
            onClick={toggleState.screenShare}
            variant={isScreenSharing ? "success" : "default"}
          />

          <ControlButton 
            icon={<Hand size={24} color="white" />}
            label={isRaisingHand ? "Lower Hand" : "Raise Hand"}
            isActive={isRaisingHand}
            onClick={toggleState.raiseHand}
            variant={isRaisingHand ? "warning" : "default"}
          />

          <ControlButton 
            icon={<Users size={24} color="white" />}
            label="Participants"
            isActive={showParticipants}
            onClick={toggleState.participants}
            variant={showParticipants ? "info" : "default"}
          />

          <ControlButton 
            icon={<MessageSquare size={24} color="white" />}
            label="Chat"
            isActive={isChatOpen}
            onClick={toggleState.chat}
            variant={isChatOpen ? "info" : "default"}
          />

          <ControlButton 
            icon={<Grid size={24} color="white" />}
            label={isGridView ? "Speaker View" : "Grid View"}
            isActive={isGridView}
            onClick={toggleState.grid}
            variant={isGridView ? "info" : "default"}
          />

          <ControlButton 
            icon={<MoreVertical size={24} color="white" />}
            label="More"
            isActive={showMoreOptions}
            onClick={toggleState.moreOptions}
          />

          <ControlButton 
            icon={<PhoneOff size={24} color="white" />}
            label="Leave"
            onClick={onLeaveCall}
            variant="danger"
          />
        </div>
      </div>

      {/* More options dropdown */}
      <DropdownMenu 
        isOpen={showMoreOptions} 
        position="bottom-24 right-1/2 transform translate-x-1/2" 
        onClose={() => setShowMoreOptions(false)}
      >
        <button
          onClick={toggleState.settings}
          className="flex items-center w-full p-2 hover:bg-gray-700 rounded"
        >
          <Settings size={20} className="mr-2" color="white" />
          <span className="text-white">Settings</span>
        </button>
        <button
          onClick={toggleState.fullscreen}
          className="flex items-center w-full p-2 hover:bg-gray-700 rounded"
        >
          <Maximize size={20} className="mr-2" color="white" />
          <span className="text-white">Fullscreen</span>
        </button>
        <button
          onClick={() => setShowMoreOptions(false)}
          className="flex items-center w-full p-2 hover:bg-gray-700 rounded"
        >
          <Info size={20} className="mr-2" color="white" />
          <span className="text-white">Meeting info</span>
        </button>
      </DropdownMenu>
      
      {/* Settings modal */}
      <Modal
        title="Settings"
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      >
        <DeviceSettings />
        <button
          onClick={() => setIsSettingsOpen(false)}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Close
        </button>
      </Modal>
      
      {/* Participants sidebar */}
      <Sidebar
        title="Participants"
        isOpen={showParticipants}
        onClose={() => setShowParticipants(false)}
      >
        <div className="p-4 flex-1 overflow-y-auto">
          {call?.state?.participants ? (
            <ul className="space-y-3">
              {Object.values(call.state.participants).map((participant) => (
                <li key={participant.userId} className="flex items-center p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3 text-blue-600 font-semibold">
                    {participant.name ? participant.name[0].toUpperCase() : "U"}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{participant.name || "Unknown User"}</p>
                    <div className="flex items-center text-xs text-gray-500">
                      {participant.isSpeaking && (
                        <span className="flex items-center mr-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                          Speaking
                        </span>
                      )}
                      {participant.isLocalParticipant && <span>You</span>}
                    </div>
                  </div>
                  {participant.isMicrophoneEnabled === false && <MicOff size={16} className="text-gray-400 ml-2" />}
                  {participant.isCameraEnabled === false && <VideoOff size={16} className="text-gray-400 ml-2" />}
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-10 text-gray-500">
              <Users size={40} className="mb-4 opacity-50" />
              <p>No participants found</p>
            </div>
          )}
        </div>
      </Sidebar>
      
      {/* Chat sidebar */}
      <Sidebar
        title="Chat"
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      >
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="flex flex-col items-center justify-center h-full py-10 text-gray-500">
            <MessageSquare size={40} className="mb-4 opacity-50" />
            <p>Messages will appear here</p>
          </div>
        </div>
        <div className="p-4 border-t bg-gray-50">
          <div className="flex">
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </Sidebar>
    </>
  );
};

// Optional: Add these animations to your CSSs
// .animate-slide-in { animation: slideIn 0.3s ease-out; }
// .animate-fade-in { animation: fadeIn 0.2s ease-out; }
// @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
// @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

export default EnhancedCallControls;