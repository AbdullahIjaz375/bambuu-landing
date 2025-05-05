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

  const hasBambbuuPlus = user?.subscriptions?.some(
    (sub) =>
      sub.type === "bammbuu+ Instructor-led group Classes" ||
      sub.type === "individual_premium" ||
      sub.type === "group_premium" ||
      sub.type?.toLowerCase().includes("premium") ||
      sub.type?.toLowerCase().includes("bambuu+")
  );

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully!");
      sessionStorage.removeItem("userType");
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
      <div className="flex-shrink-0 w-64 h-full">
        <Sidebar user={user} />
      </div>

      <div className="flex-1 overflow-x-auto min-w-[calc(100%-16rem)] h-full">
        <div className="h-[calc(100vh-1rem)] p-8 bg-white border-2 border-[#e7e7e7] rounded-3xl m-2 overflow-y-auto">
          <div className="flex items-center justify-between pb-4 mb-6 border-b">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-semibold">{t("profile.title")}</h1>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Profile Info Card */}
            <div className="bg-[#e6fde9] rounded-3xl p-8 flex flex-col items-center">
              <div className="relative flex items-center justify-center w-32 h-32 mb-4">
                {hasBambbuuPlus && (
                  <div className="absolute z-10 -top-1 -right-1">
                    <img alt="bambbuu" src="/svgs/bambuu-plus-user.svg" />
                  </div>
                )}
                <div
                  className={`w-32 h-32 bg-white rounded-full ${
                    hasBambbuuPlus ? "ring-4 ring-green-500" : ""
                  }`}
                >
                  <img
                    src={user?.photoUrl || "/svgs/supertutor-panda.svg"}
                    alt="Profile"
                    className="object-cover w-full h-full rounded-full"
                  />
                </div>
              </div>

              <h2 className="mb-4 text-3xl font-semibold">
                {user?.name || "User"}
              </h2>

              <div className="flex items-center gap-2 px-3 py-1 mb-6 text-xl bg-white rounded-full">
                <img alt="bambbuu" src="/svgs/fire.svg" className="w-6 h-6" />
                <span className="font-semibold text-[#6D6D6D]">
                  {t("profile.appStreak")}
                </span>
                <span className="font-bold text-green-600 ">
                  {user?.currentStreak || 0}
                </span>
              </div>

              <div className="grid w-full grid-cols-3 gap-4 mb-6 text-xl">
                {/* Language and Location Info */}
                <div className="flex items-center min-w-0 gap-1">
                  <img
                    alt="bambbuu"
                    src="/svgs/language-circle.svg"
                    className="flex-shrink-0 w-6 h-6"
                  />
                  <span className="font-semibold text-black whitespace-nowrap">
                    {t("profile.native")}:
                  </span>
                  <span className="font-medium text-gray-600 truncate">
                    {user?.nativeLanguage || "-"}
                  </span>
                </div>
                <div className="flex items-center min-w-0 gap-1">
                  <img
                    alt="bambbuu"
                    src="/svgs/language-circle.svg"
                    className="flex-shrink-0 w-6 h-6"
                  />
                  <span className="font-semibold text-black whitespace-nowrap">
                    {t("profile.learning")}:
                  </span>
                  <span className="font-medium text-gray-600 truncate">
                    {user?.learningLanguage || "-"}
                  </span>
                </div>
                <div className="flex items-center min-w-0 gap-1">
                  <img
                    alt="bambbuu"
                    src="/svgs/location.svg"
                    className="flex-shrink-0 w-6 h-6"
                  />
                  <span className="font-semibold text-black whitespace-nowrap">
                    {t("profile.from")}:
                  </span>
                  <span className="font-medium text-gray-600 truncate">
                    {user?.country || "-"}
                  </span>
                </div>
              </div>

              <div className="grid w-full grid-cols-2 gap-4 text-xl">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-black whitespace-nowrap">
                    {t("profile.stats.totalClassesJoined")}:
                  </span>
                  <span className="font-medium text-gray-600">
                    {user?.enrolledClasses?.length || 0}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-black whitespace-nowrap">
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
                  className="flex items-center justify-between w-full px-6 py-4 text-green-600 border border-green-500 rounded-full hover:bg-green-50"
                >
                  <div className="flex items-center gap-3">
                    <img alt="bambbuu" src={item.icon} className="w-6 h-6" />
                    <span className="text-xl text-black">{item.label}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-black" />
                </button>
              ))}

              <button
                onClick={handleSignOut}
                className="flex items-center justify-between w-full px-6 py-4 text-red-600 border border-red-500 rounded-full hover:bg-red-50"
              >
                <div className="flex items-center gap-3">
                  <img
                    alt="bambbuu"
                    src="/svgs/logout.svg"
                    className="w-6 h-6"
                  />
                  <span className="text-xl">
                    {t("profile.navigation.logout")}
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-red-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileUser;
