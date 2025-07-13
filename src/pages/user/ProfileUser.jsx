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
      <div className="h-full w-[272px] flex-shrink-0 p-4">
        <Sidebar user={user} />
      </div>

      <div className="min-w-[calc(100% - 272px)] h-[calc(100vh-0px)] flex-1 overflow-x-auto p-4 pl-0">
        <div className="h-[calc(100vh-32px)] overflow-y-auto rounded-3xl border border-[#e7e7e7] bg-white p-[16px]">
          <div className="mb-10 flex items-center justify-between border-b pb-6 pt-[9px]">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-medium text-black">
                {t("profile.title")}
              </h1>
            </div>
          </div>

          <div className="mx-auto grid max-w-[1024px] grid-cols-2 gap-[48px]">
            {/* Profile Info Card */}
            <div className="flex flex-col items-center rounded-[20px] bg-[#e6fde9] px-4 py-6">
              <div className="relative mb-4 flex h-[120px] w-[120px] items-center justify-center">
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
                  className={`h-[120px] w-[120px] rounded-full bg-white ${
                    hasBambuuPlus ? "ring-4 ring-green-500" : ""
                  }`}
                >
                  <img
                    src={user?.photoUrl || "/svgs/supertutor-panda.svg"}
                    alt="Profile"
                    className="h-[120px] w-[120px] rounded-full object-cover"
                  />
                </div>
              </div>

              <h2 className="mb-1 text-2xl font-semibold leading-[29px] text-black">
                {user?.name || "User"}
              </h2>

              <div className="mb-4 flex items-center gap-1 rounded-[44px] bg-white px-2 py-1">
                <img alt="bambbuu" src="/svgs/fire.svg" className="h-4 w-4" />
                <span className="text-base font-medium text-[#6D6D6D]">
                  {t("profile.appStreak")}
                </span>
                <span className="text-base font-bold text-[#14B82C]">
                  {user?.currentStreak < 10
                    ? `0${user?.currentStreak}`
                    : user?.currentStreak}
                </span>
              </div>

              <div className="mb-4 grid w-full grid-cols-3 gap-4 text-xl">
                {/* Language and Location Info */}
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
                    {user?.nativeLanguage || "-"}
                  </span>
                </div>
                <div className="flex min-w-0 items-center justify-center gap-1">
                  <img
                    alt="bambbuu"
                    src="/svgs/language-circle.svg"
                    className="h-4 w-4 flex-shrink-0"
                  />
                  <span className="whitespace-nowrap text-sm font-semibold leading-[17px] text-black">
                    {t("profile.learning")}:
                  </span>
                  <span className="truncate text-sm font-medium leading-[17px] text-[#454545]">
                    {user?.learningLanguage || "-"}
                  </span>
                </div>
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
                    {user?.country || "-"}
                  </span>
                </div>
              </div>

              <div className="grid w-full grid-cols-2 justify-between gap-4 text-xl">
                <div className="flex items-center gap-2">
                  <span className="whitespace-nowrap text-[14px] font-semibold leading-[17px] text-black">
                    {t("profile.stats.totalClassesJoined")}:
                  </span>
                  <span className="text-[14px] font-medium leading-[17px] text-gray-600">
                    {user?.enrolledClasses?.length || 0}
                  </span>
                </div>
                <div className="flex items-end justify-end gap-2">
                  <span className="whitespace-nowrap text-[14px] font-semibold leading-[17px] text-black">
                    {t("profile.stats.totalGroupsJoined")}:
                  </span>
                  <span className="text-[14px] font-medium leading-[17px] text-gray-600">
                    {user?.joinedGroups?.length || 0}
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

export default ProfileUser;
