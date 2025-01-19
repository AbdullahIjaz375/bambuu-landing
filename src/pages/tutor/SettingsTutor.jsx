import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

import Sidebar from "../../components/Sidebar";
import AccountTab from "../../components/AccountTab";
import AppTab from "../../components/AppTab";
import NotificationsTab from "../../components/NotificationsTab";

const TABS = ["App", "Account", "Notifications"];

const TutorSettings = () => {
  const { t } = useTranslation();

  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("App");
  const [appLanguage, setAppLanguage] = useState("ENG");
  const [notifications, setNotifications] = useState({
    classReminder: true,
    newMessage: true,
    resourceAssign: true,
    groupChat: false,
    appUpdates: false,
  });

  const handleNotificationChange = (key) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const TABS = [
    { id: "App", translationKey: "user-settings.tabs.app" },
    { id: "Account", translationKey: "user-settings.tabs.account" },
    { id: "Notifications", translationKey: "user-settings.tabs.notifications" },
  ];

  return (
    <div className="flex h-screen bg-white">
      <div className="flex-shrink-0 w-64 h-full">
        <Sidebar user={user} />
      </div>
      <div className="flex-1 overflow-x-auto min-w-[calc(100%-16rem)] h-full">
        <div className="h-[calc(100vh-1rem)] p-8 bg-white border-2 border-[#e7e7e7] rounded-3xl m-2 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-12 border-b">
            <div className="flex items-center gap-4">
              <button
                className="p-3 bg-gray-100 rounded-full"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-4xl font-semibold">
                {" "}
                {t("user-settings.title")}
              </h1>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex mb-8 bg-gray-100 border border-[#888888] rounded-full w-fit">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-12 py-2 rounded-full text-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-[#ffbf00] text-[#042f0c] border border-[#042f0c]"
                    : "text-[#042f0c] hover:text-black"
                }`}
              >
                {t(tab.translationKey)}
              </button>
            ))}
          </div>

          {/* Settings Content */}
          {activeTab === "App" && <AppTab />}

          {/* Account Tab Content */}
          {activeTab === "Account" && <AccountTab />}

          {/* Notifications Tab Content */}
          {activeTab === "Notifications" && <NotificationsTab />}
        </div>
      </div>{" "}
    </div>
  );
};

export default TutorSettings;
