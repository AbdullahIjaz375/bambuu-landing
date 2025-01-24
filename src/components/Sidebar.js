// import React, { useState } from "react";
// import { Link, useNavigate, useLocation } from "react-router-dom";
// import { auth } from "../firebaseConfig";
// import { signOut } from "firebase/auth";
// import { toast } from "react-toastify";
// import { Menu, Avatar } from "@mantine/core";
// import { ChevronRight } from "lucide-react";
// import { useTranslation } from "react-i18next";

// const Sidebar = ({ user }) => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   const { t } = useTranslation();

//   // Define menu items for each user type with both light and dark images
//   const studentMenuItems = [
//     {
//       path: "/learn",
//       translationKey: "sidebar.student.learn",
//       lightImage: "/svgs/learn-light.svg",
//       darkImage: "/svgs/learn-dark.svg",
//     },
//     {
//       path: "/communityUser",
//       translationKey: "sidebar.student.community",
//       lightImage: "/svgs/community-light.svg",
//       darkImage: "/svgs/community-dark.svg",
//     },
//     {
//       path: "/superTutorUser",
//       translationKey: "sidebar.student.superTutor",
//       lightImage: "/svgs/suprtutor-light.svg",
//       darkImage: "/svgs/supertutor-dark.svg",
//     },
//     {
//       path: "/languageExpertsUser",
//       translationKey: "sidebar.student.languageExperts",
//       lightImage: "/svgs/language-expert-light.svg",
//       darkImage: "/svgs/language-expoert-dark.svg",
//     },
//     {
//       path: "/savedRecourcesUser",
//       translationKey: "sidebar.student.savedResources",
//       lightImage: "/svgs/saved-resources-light.svg",
//       darkImage: "/svgs/saved-resources-dark.svg",
//     },
//     {
//       path: "/bammbuuPlusGroupsUser",
//       translationKey: "sidebar.student.bambuuGroups",
//       lightImage: "/svgs/bambuu-plu-groups-light.svg",
//       darkImage: "/svgs/bambuu-plu-groups-dark.svg",
//     },
//   ];

//   const tutorMenuItems = [
//     {
//       path: "/learn",
//       translationKey: "sidebar.tutor.home",
//       lightImage: "/svgs/home-dark.svg",
//       darkImage: "/svgs/home-light.svg",
//     },
//     {
//       path: "/studentsTutor",
//       translationKey: "sidebar.tutor.students",
//       lightImage: "/svgs/community-light.svg",
//       darkImage: "/svgs/community-dark.svg",
//     },
//     {
//       path: "/savedRecourcesTutor",
//       translationKey: "sidebar.tutor.resources",
//       lightImage: "/svgs/saved-resources-light.svg",
//       darkImage: "/svgs/saved-resources-dark.svg",
//     },
//   ];

//   // Select menu items based on user type
//   const menuItems =
//     user?.userType === "tutor" ? tutorMenuItems : studentMenuItems;
//   const profilePath =
//     user?.userType === "tutor" ? "/profileTutor" : "/profileUser";

//   return (
//     <div className="fixed top-2 left-2 flex flex-col h-[calc(100vh-1rem)] bg-[#e6fde9] w-64 pt-6 pb-4 rounded-3xl border-2 border-[#b9f9c2]">
//       {/* Logo */}
//       <Link to="/" className="px-6 mb-8">
//         <img
//           alt="bambuu"
//           src="/svgs/bammbuu-dashboard-logo.svg"
//           className="w-48"
//         />
//       </Link>

//       {/* Navigation Menu */}
//       <nav className="flex-1 px-4">
//         {menuItems.map((item) => {
//           const isActive = location.pathname === item.path;
//           return (
//             <Link
//               key={item.path}
//               to={item.path}
//               className={`flex text-lg items-center gap-3 pl-3 py-2 mb-2 transition-colors rounded-full
//                 ${
//                   isActive
//                     ? "bg-[#14B82C] text-white"
//                     : "text-[#042F0C] hover:bg-[#6fdb55]"
//                 }`}
//             >
//               <img
//                 src={isActive ? item.lightImage : item.darkImage}
//                 alt={t(item.translationKey)}
//                 className="w-6 h-6"
//               />
//               <span>{t(item.translationKey)}</span>
//             </Link>
//           );
//         })}
//       </nav>

//       {/* User Profile Section */}
//       <div className="px-3">
//         {user ? (
//           <Link
//             to={profilePath}
//             className="flex items-center justify-between p-2 transition-colors bg-white rounded-2xl"
//           >
//             <div className="flex flex-row items-center space-x-2">
//               <div className="w-10 h-10 overflow-hidden bg-white rounded-full">
//                 <img src={user.photoUrl} alt="Profile" className="w-10 h-10" />
//               </div>
//               <div className="flex flex-col">
//                 <span className="text-lg font-semibold text-black">
//                   {user.name || "User"}
//                 </span>
//                 <span className="text-sm text-gray-700">
//                   {user.email
//                     ? user.email.length > 18
//                       ? user.email.substring(0, 18) + "..."
//                       : user.email
//                     : "email"}
//                 </span>
//               </div>
//             </div>

//             <div>
//               <ChevronRight className="text-[#14B82C]" />
//             </div>
//           </Link>
//         ) : (
//           <Link to="/login" className="flex items-center space-x-2">
//             <Avatar radius="xl" size="sm" />
//             <span className="text-lg text-gray-700">Jones Mike</span>
//             <span className="text-sm text-gray-500">jones.m@gmail.com</span>
//           </Link>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Sidebar;

import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

const Sidebar = ({ user }) => {
  const location = useLocation();
  const { t } = useTranslation();
  console.log("Current user type:", user?.userType);
  const studentMenuItems = [
    {
      path: "/learn",
      translationKey: "sidebar.student.learn",
      lightImage: "/svgs/learn-light.svg",
      darkImage: "/svgs/learn-dark.svg",
    },
    {
      path: "/communityUser",
      translationKey: "sidebar.student.community",
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
      <nav className="flex-1 px-4 overflow-y-auto">
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

      {/* User Profile Section */}

      <div className="px-3">
        {user ? (
          <Link
            to={profilePath}
            className="flex items-center justify-between p-2 transition-colors bg-white rounded-2xl"
          >
            <div className="flex flex-row items-center space-x-2">
              <div className="flex-shrink-0 w-8 h-8 overflow-hidden bg-white rounded-full lg:w-10 lg:h-10">
                <img
                  src={user.photoUrl}
                  alt="Profile"
                  className="object-cover w-full h-full"
                />
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
