import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

import Sidebar from "../../components/Sidebar";
import NotificationsTab from "../../components/NotificationsTab";
import AccountTab from "../../components/AccountTab";
import AppTab from "../../components/AppTab";

const UserSettings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const TABS = [
    { id: "App", translationKey: "user-settings.tabs.app" },
    { id: "Account", translationKey: "user-settings.tabs.account" },
    { id: "Notifications", translationKey: "user-settings.tabs.notifications" },
  ];

  const [activeTab, setActiveTab] = useState("App");

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
                className="flex-shrink-0 p-3 transition-colors bg-gray-100 rounded-full hover:bg-gray-200"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-4xl font-semibold whitespace-nowrap">
                {t("user-settings.title")}
              </h1>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex mb-8 bg-gray-100 border border-[#888888] rounded-full  w-fit">
            <div className="flex">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-12 py-1 rounded-full text-lg font-medium transition-all whitespace-nowrap
                    ${
                      activeTab === tab.id
                        ? "bg-[#ffbf00] text-[#042f0c] border border-[#042f0c]"
                        : "text-[#042f0c] hover:text-black"
                    }`}
                >
                  {t(tab.translationKey)}
                </button>
              ))}
            </div>
          </div>

          {/* Settings Content */}
          <div className="max-w-lg">
            {activeTab === "App" && <AppTab />}
            {activeTab === "Account" && <AccountTab />}
            {activeTab === "Notifications" && <NotificationsTab />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;
