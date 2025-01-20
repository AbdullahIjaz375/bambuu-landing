import React, { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Switch } from "@mantine/core";
import { ClipLoader } from "react-spinners";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

const NotificationsTab = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState({
    classReminder: true,
    newMessage: true,
    resourceAssign: true,
    groupChat: true,
    appUpdates: true,
  });
  const [loading, setLoading] = useState(true);

  // Define notification types for mapping
  const notificationTypes = [
    "classReminder",
    "newMessage",
    "resourceAssign",
    "groupChat",
    "appUpdates",
  ];

  useEffect(() => {
    const fetchNotificationPreferences = async () => {
      try {
        const userDocRef = doc(db, "notification_preferences", user.uid);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
          setNotifications(docSnap.data());
        }
      } catch (error) {
        console.error("Error fetching notification preferences:", error);
        toast.error(t("notifications.errors.fetchError"));
      } finally {
        setLoading(false);
      }
    };

    if (user?.uid) {
      fetchNotificationPreferences();
    }
  }, [user?.uid, t]);

  const handleNotificationChange = async (key) => {
    try {
      const userDocRef = doc(db, "notification_preferences", user.uid);

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
      toast.error(t("notifications.errors.updateError"));
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
      <h2 className="mb-6 text-xl font-medium">{t("notifications.title")}</h2>
      <div className="space-y-4">
        {notificationTypes.map((type) => (
          <div
            key={type}
            className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-full"
          >
            <span className="text-lg">{t(`notifications.types.${type}`)}</span>
            <Switch
              checked={notifications[type]}
              onChange={() => handleNotificationChange(type)}
              size="md"
              color="green"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationsTab;
