import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import {
  ArrowLeft,
  Edit,
  ChevronRight,
  Globe2,
  UserMinus,
  RectangleEllipsis,
  Crown,
} from "lucide-react";
import { Switch } from "@mantine/core";
import countryList from "react-select-country-list";
import ISO6391 from "iso-639-1";
import Sidebar from "../../components/Sidebar";
import AccountTab from "../../components/AccountTab";
import AppTab from "../../components/AppTab";
import NotificationsTab from "../../components/NotificationsTab";

const TABS = ["App", "Account", "Notifications"];

const TutorSettings = () => {
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

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar user={user} />

      <div className="flex-1 p-8 bg-white border-2 border-[#e7e7e7] rounded-3xl ml-[17rem] m-2">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-12 border-b">
          <div className="flex items-center gap-4">
            <button
              className="p-3 bg-gray-100 rounded-full"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-4xl font-semibold">Settings</h1>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex mb-8 bg-gray-100 border border-[#888888] rounded-full w-fit">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-12 py-2 rounded-full text-lg font-medium transition-all ${
                activeTab === tab
                  ? "bg-[#ffbf00] text-[#042f0c] border border-[#042f0c]"
                  : "text-[#042f0c] hover:text-black"
              }`}
            >
              {tab}
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
    </div>
  );
};

export default TutorSettings;
