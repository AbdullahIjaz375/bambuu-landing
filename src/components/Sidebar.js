import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import TutorialOverlay from "./TutorialOverlay";

const Sidebar = ({ user, onExamPrepClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
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
      onClick: () => {
        localStorage.setItem("activetab", "standard");
        navigate("/messagesUser");
      },
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
    {
      path: "/examPreparationUser/:tutorId",
      translationKey: "sidebar.tutor.examPreparation",
      lightImage: "/svgs/exam-preparation-light.svg",
      darkImage: "/svgs/exam-preparation-dark.svg",
      onClick: onExamPrepClick,
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
    {
      path: "/examPreparation",
      translationKey: "sidebar.tutor.examPreparation",
      lightImage: "/svgs/exam-preparation-light.svg",
      darkImage: "/svgs/exam-preparation-dark.svg",
    },
  ];

  const truncateEmail = (email) => {
    return email && email.length > 20 ? `${email.slice(0, 20)}...` : email;
  };

  // Function to check if user has Bammbuu+ subscription
  const hasBambuuPlus =
    user?.subscriptions?.some(
      (sub) =>
        sub.type === "bammbuu+ Instructor-led group Classes" ||
        sub.type === "individual_premium" ||
        sub.type === "group_premium" ||
        sub.type?.toLowerCase().includes("premium") ||
        sub.type?.toLowerCase().includes("bambuu+"),
    ) || user?.isPremium === true;

  // Determine the appropriate navigation items based on user type
  const menuItems =
    user?.userType === "tutor" ? tutorMenuItems : studentMenuItems;
  const profilePath =
    user?.userType === "tutor" ? "/profileTutor" : "/profileUser";

  return (
    <div className="sticky left-2 top-2 ml-2 flex h-[calc(100vh-1rem)] min-w-[15.5rem] max-w-[15.5rem] flex-col overflow-y-auto rounded-3xl border-2 border-[#b9f9c2] bg-[#e6fde9] pb-4 pt-6">
      {/* Logo */}
      <Link to="/" className="mb-8 px-6">
        <img
          alt="bambuu"
          src="/svgs/bammbuu-dashboard-logo.svg"
          className="w-full max-w-[12rem]"
        />
      </Link>

      {/* Navigation Menu */}
      <nav className="relative flex-1 overflow-y-auto px-4">
        <div>
          <TutorialOverlay />
        </div>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <div key={item.path} onClick={item.onClick} className="mb-2">
              {item.onClick ? (
                <div
                  className={`flex cursor-pointer items-center gap-3 rounded-full py-2 pl-3 text-base transition-colors lg:text-lg ${
                    isActive
                      ? "bg-[#14B82C] text-white"
                      : "text-[#042F0C] hover:bg-[#6fdb55]"
                  }`}
                >
                  <img
                    src={isActive ? item.lightImage : item.darkImage}
                    alt={t(item.translationKey)}
                    className="h-6 w-6"
                  />
                  <span>{t(item.translationKey)}</span>
                </div>
              ) : (
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 rounded-full py-2 pl-3 text-base transition-colors lg:text-lg ${
                    isActive
                      ? "bg-[#14B82C] text-white"
                      : "text-[#042F0C] hover:bg-[#6fdb55]"
                  }`}
                >
                  <img
                    src={isActive ? item.lightImage : item.darkImage}
                    alt={t(item.translationKey)}
                    className="h-6 w-6"
                  />
                  <span>{t(item.translationKey)}</span>
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className="px-3">
        {user ? (
          <Link
            to={profilePath}
            className="flex items-center justify-between rounded-2xl bg-white p-2 transition-colors"
          >
            <div className="flex flex-row items-center space-x-2">
              <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-white lg:h-10 lg:w-10">
                {hasBambuuPlus && (
                  <div className="absolute -right-1 -top-1 z-10 h-4 w-4 lg:h-5 lg:w-5">
                    <img
                      alt="bammbuu plus"
                      src="/svgs/bambuu-plus-user.svg"
                      className="h-full w-full"
                    />
                  </div>
                )}
                <div
                  className={`h-full w-full rounded-full ${
                    hasBambuuPlus ? "ring-2 ring-green-500" : ""
                  }`}
                >
                  <img
                    src={user?.photoUrl || "/svgs/supertutor-panda.svg"}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
              <div className="flex min-w-0 max-w-[8rem] flex-col">
                {" "}
                {/* limit width here */}
                <span className="overflow-hidden truncate whitespace-nowrap text-base font-semibold text-black lg:text-lg">
                  {user.name || "User"}
                </span>
                <span className="overflow-hidden truncate whitespace-nowrap text-xs text-gray-700 lg:text-sm">
                  {truncateEmail(user.email) || "email"}
                </span>
              </div>
            </div>
            <div className="flex-shrink-0">
              <ChevronRight className="h-5 w-5 text-[#14B82C]" />
            </div>
          </Link>
        ) : null}
      </div>
    </div>
  );
};

export default Sidebar;
