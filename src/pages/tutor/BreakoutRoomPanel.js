// src/components/BreakoutRoomPanel.js
import React from "react";
import { Users } from "lucide-react";
import { formatRemainingTime, isRoomExpired } from "./BreakoutRoomUtils";

const BreakoutRoomPanel = ({ 
  rooms = [], 
  onJoinRoom, 
  onCreateRooms, 
  hasPermission = false,
  currentUserId
}) => {
  return (
    <div className="flex flex-col h-full">
      {hasPermission && (
        <button
          onClick={onCreateRooms}
          className="w-full mb-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 transition duration-200 flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Create Breakout Rooms
        </button>
      )}

      {rooms.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Available Rooms
          </h3>
          
          {rooms.map((room, index) => {
            const isUserInRoom = room.roomMembers?.includes(currentUserId);
            const isFull = room.roomMembers?.length >= room.availableSlots;
            const roomExpired = isRoomExpired(room);
            const occupancyPercentage = Math.round((room.roomMembers?.length || 0) / room.availableSlots * 100);
            
            return (
              <div
                key={room.id}
                className={`p-4 border rounded-lg ${
                  isUserInRoom 
                    ? "border-green-200 bg-green-50" 
                    : "border-gray-200 bg-gray-50"
                } hover:shadow-md transition duration-200`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-2 ${
                        isUserInRoom ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}>
                        <span className="font-medium">{index + 1}</span>
                      </div>
                      <h3 className="font-medium">Breakout Room {index + 1}</h3>
                    </div>
                    
                    <div className="mt-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Users size={14} className="mr-1" />
                        <span>
                          {room.roomMembers?.length || 0}/{room.availableSlots} participants
                        </span>
                      </div>
                      
                      {room.startedAt && (
                        <div className="mt-1 flex items-center">
                          <span className={`h-2 w-2 rounded-full mr-1 ${
                            roomExpired 
                              ? "bg-red-500" 
                              : "bg-green-500 animate-pulse"
                          }`}></span>
                          <span className={roomExpired ? "text-red-600" : "text-green-600"}>
                            {formatRemainingTime(room)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                      isUserInRoom
                        ? "bg-green-100 text-green-800"
                        : isFull
                          ? "bg-red-100 text-red-800"
                          : "bg-blue-100 text-blue-800"
                    }`}>
                      {isUserInRoom ? "You are here" : isFull ? "Full" : "Available"}
                    </span>
                  </div>
                </div>
                
                {/* Progress bar for occupancy */}
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-3">
                  <div 
                    className={`h-1.5 rounded-full ${
                      occupancyPercentage >= 80 
                        ? "bg-red-500" 
                        : occupancyPercentage >= 50 
                          ? "bg-yellow-500" 
                          : "bg-green-500"
                    }`}
                    style={{ width: `${occupancyPercentage}%` }}
                  ></div>
                </div>
                
                <div className="mt-3">
                  <button
                    onClick={() => onJoinRoom(room)}
                    disabled={isFull || roomExpired}
                    className={`w-full py-1.5 px-3 rounded text-sm font-medium ${
                      isFull || roomExpired
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : isUserInRoom
                          ? "bg-green-500 hover:bg-green-600 text-white"
                          : "bg-blue-500 hover:bg-blue-600 text-white"
                    } transition duration-200`}
                  >
                    {isFull
                      ? "Room Full"
                      : roomExpired
                        ? "Room Expired"
                        : isUserInRoom
                          ? "Return to Room"
                          : "Join Room"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500 flex-1">
          <Users size={48} className="mb-4 text-gray-300" />
          <p className="text-center mb-2">No breakout rooms available</p>
          {hasPermission && (
            <p className="text-center text-sm">Click the button above to create breakout rooms</p>
          )}
        </div>
      )}
    </div>
  );
};

export default BreakoutRoomPanel;