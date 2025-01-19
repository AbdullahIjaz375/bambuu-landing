import React, { useState, useEffect } from "react";
import { Bell, ChevronRight, X } from "lucide-react";
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { format } from "date-fns";
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
        const sortedNotifications = notificationList.sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );
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
        <div className="absolute right-0 z-50 px-5 mt-2 bg-white border shadow-lg border-gray-50 w-[50vh] rounded-2xl">
          <div className="flex items-center justify-between py-6">
            <h2 className="text-xl">Notifications</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-full bg-[#F6F6F6]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="max-h-[600px] overflow-y-auto space-y-2 pb-4 scrollbar-hide">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.notificationId}
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer ${
                    !notification.isRead ? "bg-[#E6FDE9]" : "bg-[#F6F6F6]"
                  }`}
                >
                  <div className="flex items-center mr-4 space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full">
                      <img
                        src={getNotificationSvg(notification.event)}
                        alt={notification.event}
                        className="w-6 h-6"
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 font-sm">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {notification.body}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between space-y-3">
                    <span className="text-xs text-gray-400">
                      {notification.data.timestamp
                        ? format(new Date(notification.data.timestamp), "HH:mm")
                        : "Just now"}
                    </span>
                    <ChevronRight className="w-4 h-4" />
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
