import React, { useState } from "react";
import { Bell, X } from "lucide-react";

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);

  const notifications = [
    {
      id: 1,
      type: "message",
      title: "Received a new message",
      description: "Bryson just send you a message",
      time: "10:20",
    },
    {
      id: 2,
      type: "resource",
      title: "New Resources Assigned",
      description: "Bryson just assigned a new resource",
      time: "10:20",
    },
    {
      id: 3,
      type: "group",
      title: "Received a new group message",
      description: "Bryson just send group message",
      time: "10:20",
    },
    {
      id: 4,
      type: "reminder",
      title: "Class Reminder",
      description: "Your class will be start in 5 minutes",
      time: "10:20",
    },
    {
      id: 5,
      type: "message",
      title: "Received a new message",
      description: "Bryson just send you a message",
      time: "10:20",
    },
    {
      id: 6,
      type: "message",
      title: "Received a new message",
      description: "Bryson just send you a message",
      time: "10:20",
    },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full hover:bg-gray-100 border border-[#ffbf00] p-2"
      >
        <Bell className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 bg-white border border-gray-200 shadow-lg w-96 rounded-xl">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold">Notifications</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="max-h-[480px] overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="flex items-center justify-between p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-[#ffbf00]/10 p-2 rounded-full">
                    <Bell className="w-5 h-5 text-[#ffbf00]" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      {notification.description}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {notification.time}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-center p-3 border-t border-gray-100">
            <button className="text-sm text-[#ffbf00] hover:text-[#e6ac00] font-medium">
              View All
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
