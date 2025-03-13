// src/components/CallHeader.js
import React, { useState, useEffect } from "react";
import { useCall, useCallStateHooks } from "@stream-io/video-react-sdk";
import { Users, Info, Timer, Clock } from "lucide-react";

const CallHeader = ({ 
  classData, 
  isBreakoutRoom = false, 
  roomName = "", 
  onOpenBreakoutPanel,
  hasBreakoutPermission = false
}) => {
  const call = useCall();
  const { useParticipantCount } = useCallStateHooks();
  const participantCount = useParticipantCount();
  
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  
  // Format elapsed time
  const formatElapsedTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return [
      hours > 0 ? hours.toString().padStart(2, '0') : null,
      minutes.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].filter(Boolean).join(':');
  };
  
  // Start timer when call joins
  useEffect(() => {
    if (!call) return;
    
    const startTime = Date.now();
    
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(elapsed);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [call]);
  
  // Info dropdown
  const CallInfo = () => (
    <div className="absolute top-12 right-0 bg-white rounded-lg shadow-lg p-3 z-50 w-72 animate-fade-in">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium">Meeting details</h3>
        <button
          onClick={() => setIsInfoOpen(false)}
          className="p-1 hover:bg-gray-100 rounded-full"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <div className="space-y-2 text-sm">
        <div>
          <p className="text-gray-500">Meeting name</p>
          <p className="font-medium">{isBreakoutRoom ? roomName : classData?.className || 'Class Session'}</p>
        </div>
        
        <div>
          <p className="text-gray-500">Meeting ID</p>
          <div className="flex items-center">
            <p className="font-medium font-mono">{call?.id?.substring(0, 12) || 'Unknown'}</p>
            <button className="ml-2 text-blue-500 hover:text-blue-600 text-xs">
              Copy
            </button>
          </div>
        </div>
        
        <div>
          <p className="text-gray-500">Participants</p>
          <p className="font-medium">{participantCount} connected</p>
        </div>
        
        <div>
          <p className="text-gray-500">Started</p>
          <p className="font-medium">{new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center">
        {isBreakoutRoom ? (
          <div className="flex items-center">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 mr-2">
              <Users size={16} />
            </div>
            <h1 className="text-white text-lg font-medium">{roomName}</h1>
          </div>
        ) : (
          <h1 className="text-white text-lg font-medium">{classData?.className || "Class Session"}</h1>
        )}
        
        <div className="ml-4 flex items-center text-gray-300 text-sm">
          <Clock size={16} className="mr-1" />
          <span>{formatElapsedTime(elapsedTime)}</span>
        </div>
        
        <div className="ml-4 flex items-center text-gray-300 text-sm">
          <Users size={16} className="mr-1" />
          <span>{participantCount}</span>
        </div>
      </div>
      
      <div className="flex space-x-2 relative">
        {!isBreakoutRoom && hasBreakoutPermission && (
          <button
            onClick={onOpenBreakoutPanel}
            className="flex items-center bg-gray-800 hover:bg-gray-700 text-white rounded-full px-4 py-2 text-sm transition duration-200"
          >
            <Users size={16} className="mr-2" />
            Breakout Rooms
          </button>
        )}
        
        <button 
          onClick={() => setIsInfoOpen(!isInfoOpen)}
          className="flex items-center justify-center h-9 w-9 bg-gray-800 hover:bg-gray-700 text-white rounded-full transition duration-200"
        >
          <Info size={18} />
        </button>
        
        {isInfoOpen && <CallInfo />}
      </div>
    </div>
  );
};

export default CallHeader;