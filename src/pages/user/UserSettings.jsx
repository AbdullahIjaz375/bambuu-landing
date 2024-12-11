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

const TABS = ["App", "Account", "Notifications"];

const UserSettings = () => {
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
        {activeTab === "App" && (
          <div className="max-w-2xl space-y-4">
            {/* App Language Setting */}
            <div className="flex items-center justify-between p-4 text-lg bg-white border border-gray-200 rounded-full">
              <div className="flex items-center gap-3">
                <Globe2 className="w-5 h-5" />
                <span>App Language</span>
              </div>
              <div className="flex items-center gap-2">
                <span>ENG</span>
                <ArrowLeft className="w-5 h-5 rotate-180" />
              </div>
            </div>

            {/* Delete Account */}
            <div className="flex items-center justify-between p-4 text-lg bg-white border border-red-200 rounded-full">
              <div className="flex items-center gap-3 text-red-500">
                <UserMinus className="w-5 h-5" />
                <span>Delete Account</span>
              </div>
              <ArrowLeft className="w-5 h-5 rotate-180" />
            </div>
          </div>
        )}

        {/* Account Tab Content */}
        {activeTab === "Account" && (
          <div className="max-w-2xl space-y-4">
            {/* App Language Setting */}
            <div className="flex items-center justify-between p-4 text-lg bg-white border border-gray-200 rounded-full">
              <div className="flex items-center gap-3">
                <RectangleEllipsis className="w-5 h-5" />
                <span>Update Password</span>
              </div>
              <ArrowLeft className="w-5 h-5 rotate-180" />
            </div>

            {/* Delete Account */}
            <div className="flex items-center justify-between p-4 text-lg bg-white border rounded-full">
              <div className="flex items-center gap-3 text-black">
                <Crown className="w-5 h-5" />
                <span>Manage Membership</span>
              </div>
              <ArrowLeft className="w-5 h-5 rotate-180" />
            </div>
          </div>
        )}

        {/* Notifications Tab Content */}
        {activeTab === "Notifications" && (
          <div className="max-w-2xl">
            <h2 className="mb-6 text-xl font-medium">In-App Notification</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-2xl">
                <span className="text-lg">Class Reminder Notification</span>
                <Switch
                  checked={notifications.classReminder}
                  onChange={() => handleNotificationChange("classReminder")}
                  size="md"
                  color="green"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-2xl">
                <span className="text-lg">New Message Notification</span>
                <Switch
                  checked={notifications.newMessage}
                  onChange={() => handleNotificationChange("newMessage")}
                  size="md"
                  color="green"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-2xl">
                <span className="text-lg">Resource Assign Notification</span>
                <Switch
                  checked={notifications.resourceAssign}
                  onChange={() => handleNotificationChange("resourceAssign")}
                  size="md"
                  color="green"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-2xl">
                <span className="text-lg">Group Chat Notification</span>
                <Switch
                  checked={notifications.groupChat}
                  onChange={() => handleNotificationChange("groupChat")}
                  size="md"
                  color="green"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-2xl">
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
        )}
      </div>
    </div>
  );
};

export default UserSettings;
