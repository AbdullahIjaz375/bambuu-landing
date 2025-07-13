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
      <div className="h-full w-[272px] flex-shrink-0 p-4">
        <Sidebar user={user} />
      </div>

      <div className="min-w-[calc(100% - 272px)] h-[calc(100vh-0px)] flex-1 overflow-x-auto p-4 pl-0">
        <div className="h-[calc(100vh-32px)] overflow-y-auto rounded-3xl border border-[#e7e7e7] bg-white p-[16px]">
          {/* Header */}
          <div className="mb-12 flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-4">
              <button
                className="flex-shrink-0 rounded-full bg-gray-100 p-3 transition-colors hover:bg-gray-200"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <h1 className="whitespace-nowrap text-4xl font-semibold">
                {t("user-settings.title")}
              </h1>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="mb-8 flex w-fit rounded-full border border-[#888888] bg-gray-100">
            <div className="flex">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap rounded-full px-12 py-1 text-lg font-medium transition-all ${
                    activeTab === tab.id
                      ? "border border-[#042f0c] bg-[#ffbf00] text-[#042f0c]"
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
