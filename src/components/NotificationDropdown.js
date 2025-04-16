import React, { useState, useEffect } from "react";
import { Bell, ChevronRight, X } from "lucide-react";
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { format, isValid, isToday, isSameDay } from "date-fns";
import { useNavigate } from "react-router-dom";

// Import SVGs
const getNotificationSvg = (event) => {
  switch (event) {
    case "CLASS_IS_STARTING":
      return "/svgs/class-reminder-started.svg";
    case "NEW_CREDITS_ADDED":
      return "/svgs/credits-related.svg";
    case "RESOURCE_SENT_BY_TUTOR":
      return "/svgs/new-resource-assigned.svg";
    case "CLASS_SLOTS_COMPLETED":
      return "/svgs/class-group-joined.svg";
    case "GROUP_CLASS_THRESHOLD_MET":
      return "/svgs/class-group-joined.svg";
    case "PAYMENT_COULD_NOT_GO_THROUGH":
      return "/svgs/credits-related.svg";
    case "PAYMENT_WAS_SUCCESSFUL":
      return "/svgs/credits-related.svg";
    case "SOMEONE_JOINED_YOUR_GROUP":
    case "SOMEONE_JOINED_YOUR_CLASS":
      return "/svgs/class-group-joined.svg";
    default:
      return "/svgs/notification.svg";
  }
};

// Helper function to format date based on how recent it is
const formatTimestamp = (timestamp) => {
  try {
    let date;
    
    // Handle Firestore timestamp objects
    if (timestamp && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } 
    // Handle string timestamps
    else if (timestamp && typeof timestamp === 'string') {
      date = new Date(timestamp);
    }
    // Handle number timestamps
    else if (timestamp && typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else {
      return "Just now";
    }
    
    // Check if the date is valid
    if (!isValid(date)) {
      return "Just now";
    }
    
    // If the notification is from today, show only the time
    if (isToday(date)) {
      return format(date, "HH:mm");
    }
    
    // For older notifications, show date and time
    return format(date, "dd MMM, HH:mm");
    
  } catch (error) {
    console.error("Error formatting timestamp:", error);
    return "Just now";
  }
};

const NotificationDropdown = () => {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem("user"));
  const userType = sessionStorage.getItem("userType");

  const userId = user?.uid;
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const docRef = doc(db, "user_notifications", userId);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const notificationList = data.notification_list || [];
        
        // Sort notifications safely by handling various timestamp formats
        const sortedNotifications = [...notificationList].sort((a, b) => {
          // Handle Firestore timestamp objects
          if (a.timestamp && typeof a.timestamp.toDate === 'function' &&
              b.timestamp && typeof b.timestamp.toDate === 'function') {
            return b.timestamp.toDate() - a.timestamp.toDate();
          }
          
          // Handle string timestamps
          const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0);
          const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
          
          // Check if dates are valid before comparing
          if (isValid(dateA) && isValid(dateB)) {
            return dateB - dateA;
          }
          
          // If dates are invalid, maintain original order
          return 0;
        });
        
        setNotifications(sortedNotifications);
        setUnreadCount(data.unreadCount || 0);
      }
    });

    return () => unsubscribe();
  }, [userId]);

  const handleNavigateToPage = (notification) => {
    const { event, data } = notification;
    const isTutor = userType === "tutor";
    switch (event) {
      case "SOMEONE_JOINED_YOUR_GROUP":
        navigate(
          isTutor
            ? `/groupDetailsTutor/${data.groupId}`
            : `/groupDetailsUser/${data.groupId}`
        );
        break;
      case "SOMEONE_JOINED_YOUR_CLASS":
        navigate(
          isTutor
            ? `/classDetailsTutor/${data.classId}`
            : `/classDetailsUser/${data.classId}`
        );
        break;
      case "CLASS_IS_STARTING":
        navigate(
          isTutor
            ? `/classDetailsTutor/${data.classId}`
            : `/classDetailsUser/${data.classId}`
        );
        break;
      case "RESOURCE_SENT_BY_TUTOR":
        navigate(isTutor ? `/savedResourcesTutor` : `/savedResourcesUser`);
        break;
      case "PAYMENT_WAS_SUCCESSFUL":
      case "PAYMENT_COULD_NOT_GO_THROUGH":
      case "NEW_CREDITS_ADDED":
        break;
      case "CLASS_SLOTS_COMPLETED":
      case "GROUP_CLASS_THRESHOLD_MET":
        navigate(
          isTutor
            ? `/classDetailsTutor/${data.classId}`
            : `/classDetailsUser/${data.classId}`
        );
        break;
      default:
        // navigate(isTutor ? "/tutorDashboard" : "/dashboard");
        break;
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      // First update the read status if notification is unread
      if (!notification.isRead) {
        const docRef = doc(db, "user_notifications", userId);
        const updatedNotifications = notifications.map((n) =>
          n.notificationId === notification.notificationId
            ? { ...n, isRead: true }
            : n
        );

        const newUnreadCount = Math.max(0, unreadCount - 1);
        await updateDoc(docRef, {
          notification_list: updatedNotifications,
          unreadCount: newUnreadCount,
        });
      }

      // Then navigate to the appropriate page
      handleNavigateToPage(notification);

      // Close the dropdown after navigation
      setIsOpen(false);
    } catch (error) {
      console.error("Error updating notification:", error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full hover:bg-gray-100 border border-[#ffbf00] p-2 relative"
      >
        <img
          alt="bammbuu"
          src="/svgs/notification-bell.svg"
          className="w-[31px]"
        />
        {unreadCount > 0 && (
          <span className="absolute w-2 h-2 bg-amber-400 rounded-full top-2 right-1/2 translate-x-[6px]" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 px-5 mt-2 bg-white border shadow-lg border-gray-50 w-[350px] rounded-2xl">
          <div className="flex items-center justify-between py-4">
            <h2 className="text-lg font-medium">Notifications</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="max-h-[400px] overflow-y-auto space-y-1 pb-4 scrollbar-hide">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.notificationId}
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex items-start justify-between p-3 rounded-xl cursor-pointer ${
                    !notification.isRead ? "bg-[#e6fde9]" : "bg-gray-50"
                  } hover:bg-gray-100`}
                >
                  <div className="flex flex-grow pr-2">
                    <div className="flex-shrink-0 mr-3">
                      <img
                        src={getNotificationSvg(notification.event)}
                        alt={notification.event}
                        className="w-6 h-6"
                      />
                    </div>
                    
                    <div>
                      <p className="font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600">
                        {notification.body}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end min-w-[60px]">
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {formatTimestamp(notification.timestamp)}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400 mt-3" />
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;