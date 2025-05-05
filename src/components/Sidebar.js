import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import TutorialOverlay from "./TutorialOverlay";

const Sidebar = ({ user }) => {
  const location = useLocation();
  const { t } = useTranslation();
  const studentMenuItems = [
    {
      path: "/learn",
      translationKey: "sidebar.student.learn",
      lightImage: "/svgs/learn-light.svg",
      darkImage: "/svgs/learn-dark.svg",
    },
    {
      path: "/messagesUser",
      translationKey: "sidebar.student.messages",
      lightImage: "/svgs/community-light.svg",
      darkImage: "/svgs/community-dark.svg",
    },
    {
      path: "/superTutorUser",
      translationKey: "sidebar.student.superTutor",
      lightImage: "/svgs/suprtutor-light.svg",
      darkImage: "/svgs/supertutor-dark.svg",
    },
    {
      path: "/languageExpertsUser",
      translationKey: "sidebar.student.languageExperts",
      lightImage: "/svgs/language-expert-light.svg",
      darkImage: "/svgs/language-expoert-dark.svg",
    },
    {
      path: "/savedRecourcesUser",
      translationKey: "sidebar.student.savedResources",
      lightImage: "/svgs/saved-resources-light.svg",
      darkImage: "/svgs/saved-resources-dark.svg",
    },
    {
      path: "/bammbuuPlusGroupsUser",
      translationKey: "sidebar.student.bambuuGroups",
      lightImage: "/svgs/bambuu-plu-groups-light.svg",
      darkImage: "/svgs/bambuu-plu-groups-dark.svg",
    },
  ];

  const tutorMenuItems = [
    {
      path: "/learn",
      translationKey: "sidebar.tutor.home",
      lightImage: "/svgs/home-dark.svg",
      darkImage: "/svgs/home-light.svg",
    },
    {
      path: "/studentsTutor",
      translationKey: "sidebar.tutor.students",
      lightImage: "/svgs/community-light.svg",
      darkImage: "/svgs/community-dark.svg",
    },
    {
      path: "/savedRecourcesTutor",
      translationKey: "sidebar.tutor.resources",
      lightImage: "/svgs/saved-resources-light.svg",
      darkImage: "/svgs/saved-resources-dark.svg",
    },
  ];
  const truncateEmail = (email) => {
    return email && email.length > 20 ? `${email.slice(0, 20)}...` : email;
  };

  // Function to check if user has Bammbuu+ subscription
  const hasBambbuuPlus = user?.subscriptions?.some(
    (sub) =>
      sub.type === "bammbuu+ Instructor-led group Classes" ||
      sub.type === "individual_premium" ||
      sub.type === "group_premium" ||
      sub.type?.toLowerCase().includes("premium") ||
      sub.type?.toLowerCase().includes("bambuu+")
  );

  // Determine the appropriate navigation items based on user type
  const menuItems =
    user?.userType === "tutor" ? tutorMenuItems : studentMenuItems;
  const profilePath =
    user?.userType === "tutor" ? "/profileTutor" : "/profileUser";

  return (
    <div className="sticky ml-2 top-2 left-2 flex flex-col h-[calc(100vh-1rem)] min-w-[15.5rem] max-w-[15.5rem] bg-[#e6fde9] pt-6 pb-4 rounded-3xl border-2 border-[#b9f9c2] overflow-y-auto">
      {/* Logo */}
      <Link to="/" className="px-6 mb-8">
        <img
          alt="bambuu"
          src="/svgs/bammbuu-dashboard-logo.svg"
          className="w-full max-w-[12rem]"
        />
      </Link>

      {/* Navigation Menu */}
      <nav className="relative flex-1 px-4 overflow-y-auto">
        <div>
          <TutorialOverlay />
        </div>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex text-base lg:text-lg items-center gap-3 pl-3 py-2 mb-2 transition-colors rounded-full
                ${
                  isActive
                    ? "bg-[#14B82C] text-white"
                    : "text-[#042F0C] hover:bg-[#6fdb55]"
                }`}
            >
              <img
                src={isActive ? item.lightImage : item.darkImage}
                alt={t(item.translationKey)}
                className="w-6 h-6"
              />
              <span>{t(item.translationKey)}</span>
            </Link>
          );
        })}
      </nav>
      {/* Tutorial overlay */}

      {/* User Profile Section */}

      <div className="px-3">
        {user ? (
          <Link
            to={profilePath}
            className="flex items-center justify-between p-2 transition-colors bg-white rounded-2xl"
          >
            <div className="flex flex-row items-center space-x-2">
              <div className="relative flex-shrink-0 w-8 h-8 overflow-hidden bg-white rounded-full lg:w-10 lg:h-10">
                {hasBambbuuPlus && (
                  <div className="absolute z-10 -top-1 -right-1 w-4 h-4 lg:w-5 lg:h-5">
                    <img
                      alt="bambbuu plus"
                      src="/svgs/bambuu-plus-user.svg"
                      className="w-full h-full"
                    />
                  </div>
                )}
                <div
                  className={`w-full h-full rounded-full ${
                    hasBambbuuPlus ? "ring-2 ring-green-500" : ""
                  }`}
                >
                  <img
                    src={user?.photoUrl || "/svgs/supertutor-panda.svg"}
                    alt="Profile"
                    className="object-cover w-full h-full"
                  />
                </div>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-base font-semibold text-black truncate lg:text-lg">
                  {user.name || "User"}
                </span>
                <span className="text-xs text-gray-700 truncate lg:text-sm">
                  {truncateEmail(user.email) || "email"}
                </span>
              </div>
            </div>
            <div className="flex-shrink-0">
              <ChevronRight className="text-[#14B82C] w-5 h-5" />
            </div>
          </Link>
        ) : null}
      </div>
    </div>
  );
};

export default Sidebar;
