import React, { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Switch } from "@mantine/core";
import { ClipLoader } from "react-spinners";

const NotificationsTab = () => {
  const [notifications, setNotifications] = useState({
    classReminder: true,
    newMessage: true,
    resourceAssign: true,
    groupChat: true,
    appUpdates: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotificationPreferences = async () => {
      try {
        const userId = JSON.parse(sessionStorage.getItem("user")).uid;
        const userDocRef = doc(db, "notification_preferences", userId);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
          setNotifications(docSnap.data());
        }
      } catch (error) {
        console.error("Error fetching notification preferences:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotificationPreferences();
  }, []);

  const handleNotificationChange = async (key) => {
    try {
      const userId = JSON.parse(sessionStorage.getItem("user")).uid;
      const userDocRef = doc(db, "notification_preferences", userId);

      const updatedNotifications = {
        ...notifications,
        [key]: !notifications[key],
      };

      await updateDoc(userDocRef, {
        [key]: !notifications[key],
      });

      setNotifications(updatedNotifications);
    } catch (error) {
      console.error("Error updating notification preference:", error);
      // Revert the state if update fails
      setNotifications(notifications);
    }
  };

  if (loading) {
    return (
      <div className="flex bg-white h-96">
        <div className="flex items-center justify-center flex-1">
          <ClipLoader color="#14B82C" size={50} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h2 className="mb-6 text-xl font-medium">In-App Notification</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-full">
          <span className="text-lg">Class Reminder Notification</span>
          <Switch
            checked={notifications.classReminder}
            onChange={() => handleNotificationChange("classReminder")}
            size="md"
            color="green"
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-full">
          <span className="text-lg">New Message Notification</span>
          <Switch
            checked={notifications.newMessage}
            onChange={() => handleNotificationChange("newMessage")}
            size="md"
            color="green"
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-full">
          <span className="text-lg">Resource Assign Notification</span>
          <Switch
            checked={notifications.resourceAssign}
            onChange={() => handleNotificationChange("resourceAssign")}
            size="md"
            color="green"
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-full">
          <span className="text-lg">Group Chat Notification</span>
          <Switch
            checked={notifications.groupChat}
            onChange={() => handleNotificationChange("groupChat")}
            size="md"
            color="green"
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-full">
          <span className="text-lg">App Updates</span>
          <Switch
            checked={notifications.appUpdates}
            onChange={() => handleNotificationChange("appUpdates")}
            size="md"
            color="green"
          />
        </div>
      </div>
    </div>
  );
};

export default NotificationsTab;
