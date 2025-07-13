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
      <div className="h-full w-[272px] flex-shrink-0 p-4">
        <Sidebar user={user} />
      </div>

      <div className="min-w-[calc(100% - 272px)] h-[calc(100vh-0px)] flex-1 overflow-x-auto p-4 pl-0">
        <div className="h-[calc(100vh-32px)] overflow-y-auto rounded-3xl border border-[#e7e7e7] bg-white p-[16px]">
          <div className="mb-6 flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-semibold">{t("profile.title")}</h1>
            </div>
          </div>

          <div className="mx-auto grid max-w-[1024px] grid-cols-2 gap-[48px]">
            {/* Profile Info Card */}
            <div className="flex flex-col items-center rounded-[20px] bg-[#e6fde9] px-4 py-6">
              <div className="relative mb-4 flex h-[120px] w-[120px] items-center justify-center">
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
              <h2 className="mb-1 text-2xl font-semibold leading-[29px] text-black">
                {userData?.name || user?.name || t("common.user", "User")}
              </h2>
              <div className="mb-4 flex items-center gap-1 rounded-[44px] bg-white px-2 py-1">
                <img alt="bambbuu" src="/svgs/fire.svg" className="h-6 w-6" />
                <span className="text-base font-medium text-[#6D6D6D]">
                  {t("profile.appStreak")}
                </span>{" "}
                <span className="text-base font-bold text-[#14B82C]">
                  {userData?.currentStreak || user?.currentStreak || 0}
                </span>
              </div>
              <div className="mb-4 grid w-full grid-cols-3 gap-4 text-xl">
                {/* Language and Location Info */}{" "}
                <div className="flex min-w-0 items-center gap-1">
                  <img
                    alt="bambbuu"
                    src="/svgs/language-circle.svg"
                    className="h-4 w-4 flex-shrink-0"
                  />
                  <span className="whitespace-nowrap text-sm font-semibold leading-[17px] text-black">
                    {t("profile.native")}:
                  </span>
                  <span className="truncate text-sm font-medium text-[#454545]">
                    {userData?.nativeLanguage || user?.nativeLanguage || "-"}
                  </span>
                </div>
                <div className="flex min-w-0 items-center justify-center gap-1">
                  <img
                    alt="bambbuu"
                    src="/svgs/language-circle.svg"
                    className="h-4 w-4 flex-shrink-0"
                  />
                  <span className="whitespace-nowrap text-sm font-semibold leading-[17px] text-black">
                    {t("profile.teaching")}:
                  </span>
                  <span className="truncate text-sm font-medium leading-[17px] text-[#454545]">
                    {userData?.teachingLanguage ||
                      user?.teachingLanguage ||
                      "-"}
                  </span>
                </div>{" "}
                <div className="flex min-w-0 items-center justify-end gap-1">
                  <img
                    alt="bambbuu"
                    src="/svgs/location.svg"
                    className="h-4 w-4 flex-shrink-0"
                  />
                  <span className="whitespace-nowrap text-[14px] font-semibold leading-[17px] text-black">
                    {t("profile.from")}:
                  </span>
                  <span className="truncate text-sm font-medium leading-[17px] text-[#454545]">
                    {userData?.country || user?.country || "-"}
                  </span>
                </div>
              </div>{" "}
              <div className="grid w-full grid-cols-2 justify-between gap-4 text-xl">
                <div className="flex items-center gap-2">
                  <span className="whitespace-nowrap text-[14px] font-semibold leading-[17px] text-black">
                    {t("instructor-profile.stats.totalClassesTaught")}:
                  </span>
                  <span className="text-[14px] font-medium leading-[17px] text-gray-600">
                    {userData?.tutorOfClasses?.length ||
                      user?.tutorOfClasses?.length ||
                      0}
                  </span>
                </div>
                <div className="flex items-end justify-end gap-2">
                  <span className="whitespace-nowrap text-[14px] font-semibold leading-[17px] text-black">
                    {t("instructor-profile.stats.totalGroupsCreated")}:
                  </span>
                  <span className="text-[14px] font-medium leading-[17px] text-gray-600">
                    {userData?.tutorOfGroups?.length ||
                      user?.tutorOfGroups?.length ||
                      0}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="space-y-[18px]">
              {navigationItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleItemClick(item.path)}
                  className="flex w-full items-center justify-between rounded-full border border-[#14B82C] px-[23px] py-[11px] text-green-600 hover:bg-green-50"
                >
                  <div className="flex items-center gap-3">
                    <img alt="bambbuu" src={item.icon} className="h-6 w-6" />
                    <span className="text-base leading-6 text-black">
                      {item.label}
                    </span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-[#042F0C]" />
                </button>
              ))}

              <button
                onClick={handleSignOut}
                className="flex w-full items-center justify-between rounded-full border border-[#F04438] px-[21px] py-[11px] text-[#F04438] hover:bg-red-50"
              >
                <div className="flex items-center gap-3">
                  <img
                    alt="bambbuu"
                    src="/svgs/logout.svg"
                    className="h-5 w-5"
                  />
                  <span className="text-base leading-6">
                    {t("profile.navigation.logout")}
                  </span>
                </div>
                <ChevronRight className="h-5 w-5 text-[#F04438]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileTutor;
