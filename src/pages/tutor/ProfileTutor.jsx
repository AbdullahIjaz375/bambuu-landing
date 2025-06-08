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
const ProfileTutor = () => {
  const { user, setUser } = useAuth();
  const { t } = useTranslation();

  const navigate = useNavigate();

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (user?.uid) {
          const userDoc = await getDoc(doc(db, "tutors", user.uid));
          if (userDoc.exists()) {
            const tutorData = userDoc.data();
            setUserData(tutorData);
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
      // Clear all authentication-related data
      sessionStorage.removeItem("userType");
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("redirectAfterLogin");

      // Clear saved URLs that could cause redirection issues
      localStorage.removeItem("selectedClassUrl");
      localStorage.removeItem("selectedGroupUrl");
      localStorage.removeItem("selectedPackageUrl");
      localStorage.removeItem("fullRedirectUrl");

      toast.success("Logged out successfully!");
    } catch (error) {
      toast.error("Error during logout");
      console.error("Error during logout:", error);
    }
  };

  const handleItemClick = (path) => {
    if (path === "/privacyPolicytutor") {
      window.open("https://bammbuu.co/privacy-policy", "_blank");
    } else {
      navigate(path);
    }
  };
  const navigationItems = [
    {
      path: "/tutorEditProfile",
      icon: "/svgs/edit.svg",
      label: t("profile.navigation.editProfile"),
    },
    {
      path: "/tutorSettings",
      icon: "/svgs/setting.svg",
      label: t("profile.navigation.settings"),
    },
    {
      path: "/aboutBambuututor",
      icon: "/svgs/speedometer.svg",
      label: t("profile.navigation.aboutBammbuu"),
    },
    {
      path: "/privacyPolicytutor",
      icon: "/svgs/document-text.svg",
      label: t("profile.navigation.privacyPolicy"),
    },
  ];

  return (
    <div className="flex h-screen bg-white">
      <div className="h-full w-64 flex-shrink-0">
        <Sidebar user={user} />
      </div>

      <div className="h-full min-w-[calc(100%-16rem)] flex-1 overflow-x-auto">
        <div className="m-2 h-[calc(100vh-1rem)] overflow-y-auto rounded-3xl border-2 border-[#e7e7e7] bg-white p-8">
          <div className="mb-6 flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-semibold">{t("profile.title")}</h1>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10">
            {/* Profile Info Card */}
            <div className="flex flex-col items-center rounded-3xl bg-[#e6fde9] p-8">
              {" "}
              <div className="mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-white">
                <img
                  src={
                    userData?.photoUrl ||
                    user?.photoUrl ||
                    "/svgs/supertutor-panda.svg"
                  }
                  alt={t("instructor-profile.alt-text.profile-image", {
                    name: userData?.name || user?.name || "",
                  })}
                  className="h-full w-full rounded-full object-cover"
                  onError={(e) => {
                    e.target.src = "/svgs/supertutor-panda.svg";
                  }}
                  referrerPolicy="no-referrer"
                />
              </div>{" "}
              <h2 className="mb-4 text-3xl font-semibold">
                {userData?.name || user?.name || t("common.user", "User")}
              </h2>
              <div className="mb-6 flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xl">
                <img alt="bambbuu" src="/svgs/fire.svg" className="h-6 w-6" />
                <span className="font-semibold text-[#6D6D6D]">
                  {t("profile.appStreak")}
                </span>{" "}
                <span className="font-bold text-green-600">
                  {userData?.currentStreak || user?.currentStreak || 0}
                </span>
              </div>
              <div className="mb-6 grid w-full grid-cols-3 gap-4 text-xl">
                {/* Language and Location Info */}{" "}
                <div className="flex min-w-0 items-center gap-1">
                  <img
                    alt="bambbuu"
                    src="/svgs/language-circle.svg"
                    className="h-6 w-6 flex-shrink-0"
                  />
                  <span className="whitespace-nowrap font-semibold text-black">
                    {t("profile.native")}:
                  </span>
                  <span className="truncate font-medium text-gray-600">
                    {userData?.nativeLanguage || user?.nativeLanguage || "-"}
                  </span>
                </div>
                <div className="flex min-w-0 items-center gap-1">
                  <img
                    alt="bambbuu"
                    src="/svgs/language-circle.svg"
                    className="h-6 w-6 flex-shrink-0"
                  />
                  <span className="whitespace-nowrap font-semibold text-black">
                    {t("profile.teaching")}:
                  </span>
                  <span className="truncate font-medium text-gray-600">
                    {userData?.teachingLanguage ||
                      user?.teachingLanguage ||
                      "-"}
                  </span>
                </div>{" "}
                <div className="flex min-w-0 items-center gap-1">
                  <img
                    alt="bambbuu"
                    src="/svgs/location.svg"
                    className="h-6 w-6 flex-shrink-0"
                  />
                  <span className="whitespace-nowrap font-semibold text-black">
                    {t("profile.from")}:
                  </span>
                  <span className="truncate font-medium text-gray-600">
                    {userData?.country || user?.country || "-"}
                  </span>
                </div>
              </div>{" "}
              <div className="grid w-full grid-cols-2 gap-4 text-xl">
                <div className="flex items-center gap-2">
                  <span className="whitespace-nowrap font-semibold text-black">
                    {t("instructor-profile.stats.totalClassesTaught")}:
                  </span>
                  <span className="font-medium text-gray-600">
                    {userData?.tutorOfClasses?.length ||
                      user?.tutorOfClasses?.length ||
                      0}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="whitespace-nowrap font-semibold text-black">
                    {t("instructor-profile.stats.totalGroupsCreated")}:
                  </span>
                  <span className="font-medium text-gray-600">
                    {userData?.tutorOfGroups?.length ||
                      user?.tutorOfGroups?.length ||
                      0}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="mt-2 space-y-4">
              {navigationItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleItemClick(item.path)}
                  className="flex w-full items-center justify-between rounded-full border border-green-500 px-6 py-4 text-green-600 hover:bg-green-50"
                >
                  <div className="flex items-center gap-3">
                    <img alt="bambbuu" src={item.icon} className="h-6 w-6" />
                    <span className="text-xl text-black">{item.label}</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-black" />
                </button>
              ))}

              <button
                onClick={handleSignOut}
                className="flex w-full items-center justify-between rounded-full border border-red-500 px-6 py-4 text-red-600 hover:bg-red-50"
              >
                <div className="flex items-center gap-3">
                  <img
                    alt="bambbuu"
                    src="/svgs/logout.svg"
                    className="h-6 w-6"
                  />
                  <span className="text-xl">
                    {t("profile.navigation.logout")}
                  </span>
                </div>
                <ChevronRight className="h-5 w-5 text-red-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileTutor;
