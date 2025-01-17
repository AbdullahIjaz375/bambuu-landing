import { Search } from "lucide-react";

import React, { useState, useEffect } from "react";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Users,
  BookOpen,
  Star,
  Database,
  UserCircle,
  User,
  ArrowLeft,
  Globe,
} from "lucide-react";
import { Settings, Edit, LogOut } from "lucide-react";
import { signOut } from "firebase/auth";
import { toast } from "react-toastify";
import { auth } from "../../firebaseConfig";
import { useTranslation } from "react-i18next";

import Sidebar from "../../components/Sidebar";
import ClassCard from "../../components/ClassCard";
import { useAuth } from "../../context/AuthContext";
import GroupCard from "../../components/GroupCard";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { ClipLoader } from "react-spinners";
const ProfileUser = () => {
  const { user, setUser } = useAuth();

  const navigate = useNavigate();
  const { t } = useTranslation();

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (user?.uid) {
          const userDoc = await getDoc(doc(db, "students", user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully!");
      sessionStorage.removeItem("userType"); // Remove userType from session storage
    } catch (error) {
      toast.error("Error during logout");
      console.error("Error during logout:", error);
    }
  };

  const navigationItems = [
    {
      path: "/userEditProfile",
      icon: "/svgs/edit.svg",
      label: t("profile.navigation.editProfile"),
    },
    {
      path: "/userSettings",
      icon: "/svgs/setting.svg",
      label: t("profile.navigation.settings"),
    },
    {
      path: "/aboutBambuuUser",
      icon: "/svgs/speedometer.svg",
      label: t("profile.navigation.aboutBammbuu"),
    },
    {
      path: "/privacyPolicyUser",
      icon: "/svgs/document-text.svg",
      label: t("profile.navigation.privacyPolicy"),
    },
  ];

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar user={user} />

      <div className="flex-1 p-8 bg-white border-2 border-[#e7e7e7] rounded-3xl ml-[17rem] m-2">
        <div className="flex items-center justify-between pb-4 mb-6 border-b">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-semibold">{t("profile.title")}</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="bg-[#e6fde9] rounded-3xl p-8 flex flex-col items-center">
            <div className="flex items-center justify-center w-32 h-32 mb-4 bg-white rounded-full">
              <img
                src={userData?.photoUrl || "/api/placeholder/96/96"}
                alt="Profile"
                className="object-cover w-full h-full rounded-full"
              />
            </div>

            <h2 className="mb-4 text-3xl font-semibold">
              {userData?.name || "User"}
            </h2>

            <div className="flex items-center gap-2 px-3 py-1 mb-6 text-xl bg-white rounded-full">
              <img alt="bambbuu" src="/svgs/fire.svg" className="w-6 h-6" />
              <span className="font-semibold text-[#6D6D6D]">
                {t("profile.appStreak")}
              </span>
              <span className="font-semibold text-green-600">
                {userData?.currentStreak || 0}
              </span>
            </div>

            <div className="grid w-full grid-cols-3 gap-4 mb-6 text-xl">
              <div className="flex items-center gap-1">
                <img
                  alt="bambbuu"
                  src="/svgs/language-circle.svg"
                  className="w-6 h-6"
                />
                <span className="font-semibold text-black">
                  {t("profile.native")}:
                </span>
                <span className="font-medium text-gray-600">
                  {userData?.nativeLanguage || "-"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <img
                  alt="bambbuu"
                  src="/svgs/language-circle.svg"
                  className="w-6 h-6"
                />
                <span className="font-semibold text-black">
                  {t("profile.learning")}:
                </span>
                <span className="font-medium text-gray-600">
                  {userData?.learningLanguage || "-"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <img
                  alt="bambbuu"
                  src="/svgs/location.svg"
                  className="w-6 h-6"
                />
                <span className="font-semibold text-black">
                  {t("profile.from")}:
                </span>
                <span className="font-medium text-gray-600">
                  {userData?.country || "-"}
                </span>
              </div>
            </div>

            <div className="grid w-full grid-cols-2 gap-4 text-xl">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-black">
                  {t("profile.stats.totalClassesJoined")}:
                </span>
                <span className="font-medium text-gray-600">
                  {userData?.enrolledClasses?.length || 0}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-black">
                  {t("profile.stats.totalGroupsJoined")}:
                </span>
                <span className="font-medium text-gray-600">
                  {userData?.joinedGroups?.length || 0}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-2 space-y-4">
            {navigationItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex items-center justify-between w-full px-6 py-4 text-green-600 border border-green-500 rounded-full hover:bg-green-50"
              >
                <div className="flex items-center gap-3">
                  <img alt="bammbuu" src={item.icon} className="w-6 h-6" />
                  <span className="text-xl text-black">{item.label}</span>
                </div>
                <ChevronRight className="text-black" />
              </button>
            ))}

            <button
              onClick={handleSignOut}
              className="flex items-center justify-between w-full px-6 py-4 text-red-600 border border-red-500 rounded-full hover:bg-red-50"
            >
              <div className="flex items-center gap-3">
                <img alt="bammbuu" src="/svgs/logout.svg" className="w-6 h-6" />
                <span className="text-xl">
                  {t("profile.navigation.logout")}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileUser;
