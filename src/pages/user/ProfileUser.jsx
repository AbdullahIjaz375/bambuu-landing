import React, { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import { signOut } from "firebase/auth";
import { toast } from "react-toastify";
import { auth, db } from "../../firebaseConfig";
import { useTranslation } from "react-i18next";

import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { useLanguage } from "../../context/LanguageContext";

const ProfileUser = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { changeLanguage } = useLanguage();

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

  // Enhanced logic to check if user has Bammbuu+ subscription
  const hasBambuuPlus =
    user?.subscriptions?.some(
      (sub) =>
        sub.type === "bammbuu+ Instructor-led group Classes" ||
        sub.type === "individual_premium" ||
        sub.type === "group_premium" ||
        sub.type?.toLowerCase().includes("premium") ||
        sub.type?.toLowerCase().includes("bambuu+"),
    ) ||
    user?.isPremium === true ||
    userData?.isPremium === true;
  const handleSignOut = async () => {
    try {
      // Clear all authentication-related data
      sessionStorage.removeItem("userType");
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("redirectAfterLogin");

      // Clear saved URLs that could cause redirection issues
      localStorage.removeItem("selectedClassUrl");
      localStorage.removeItem("selectedGroupUrl");
      localStorage.removeItem("selectedPackageUrl");
      localStorage.removeItem("fullRedirectUrl");

      // Update the user context to null before sign out
      setUser(null);

      // Then perform the actual sign out
      await signOut(auth);

      // Navigate to login page (not landing page)
      navigate("/login");

      toast.success("Logged out successfully!");
    } catch (error) {
      toast.error("Error during logout");
      console.error("Error during logout:", error);
    }
  };

  const handleItemClick = (path) => {
    if (path === "/privacyPolicyUser") {
      window.open("https://bammbuu.co/privacy-policy", "_blank");
    } else {
      navigate(path);
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

          <div className="grid grid-cols-2 gap-6">
            {/* Profile Info Card */}
            <div className="flex flex-col items-center rounded-3xl bg-[#e6fde9] p-8">
              <div className="relative mb-4 flex h-32 w-32 items-center justify-center">
                {hasBambuuPlus && (
                  <div className="absolute -right-1 -top-1 z-10 h-8 w-8">
                    <img
                      alt="bambbuu plus"
                      src="/svgs/bambuu-plus-user.svg"
                      className="h-full w-full"
                    />
                  </div>
                )}
                <div
                  className={`h-32 w-32 rounded-full bg-white ${
                    hasBambuuPlus ? "ring-4 ring-green-500" : ""
                  }`}
                >
                  <img
                    src={user?.photoUrl || "/svgs/supertutor-panda.svg"}
                    alt="Profile"
                    className="h-full w-full rounded-full object-cover"
                  />
                </div>
              </div>

              <h2 className="mb-4 text-3xl font-semibold">
                {user?.name || "User"}
              </h2>

              <div className="mb-6 flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xl">
                <img alt="bambbuu" src="/svgs/fire.svg" className="h-6 w-6" />
                <span className="font-semibold text-[#6D6D6D]">
                  {t("profile.appStreak")}
                </span>
                <span className="font-bold text-green-600">
                  {user?.currentStreak || 0}
                </span>
              </div>

              <div className="mb-6 grid w-full grid-cols-3 gap-4 text-xl">
                {/* Language and Location Info */}
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
                    {user?.nativeLanguage || "-"}
                  </span>
                </div>
                <div className="flex min-w-0 items-center gap-1">
                  <img
                    alt="bambbuu"
                    src="/svgs/language-circle.svg"
                    className="h-6 w-6 flex-shrink-0"
                  />
                  <span className="whitespace-nowrap font-semibold text-black">
                    {t("profile.learning")}:
                  </span>
                  <span className="truncate font-medium text-gray-600">
                    {user?.learningLanguage || "-"}
                  </span>
                </div>
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
                    {user?.country || "-"}
                  </span>
                </div>
              </div>

              <div className="grid w-full grid-cols-2 gap-4 text-xl">
                <div className="flex items-center gap-2">
                  <span className="whitespace-nowrap font-semibold text-black">
                    {t("profile.stats.totalClassesJoined")}:
                  </span>
                  <span className="font-medium text-gray-600">
                    {user?.enrolledClasses?.length || 0}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="whitespace-nowrap font-semibold text-black">
                    {t("profile.stats.totalGroupsJoined")}:
                  </span>
                  <span className="font-medium text-gray-600">
                    {user?.joinedGroups?.length || 0}
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

export default ProfileUser;
