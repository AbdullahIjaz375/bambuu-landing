// import React, { useState } from "react";
// import { Link, useNavigate, useLocation } from "react-router-dom";
// import { auth } from "../firebaseConfig";
// import { signOut } from "firebase/auth";
// import { toast } from "react-toastify";
// import { Menu, Avatar } from "@mantine/core";
// import {
//   BookOpen,
//   Users,
//   GraduationCap,
//   Languages,
//   BookmarkPlus,
// } from "lucide-react";
// import { LuCrown, LuLogOut } from "react-icons/lu";
// import { FaAngleDown } from "react-icons/fa6";

// const Sidebar = ({ user }) => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [dropdownOpen, setDropdownOpen] = useState(false);

//   const menuItems = [
//     { path: "/learn", label: "Learn", icon: BookOpen },
//     { path: "/communityUser", label: "Community", icon: Users },
//     { path: "/superTutorUser", label: "SuperTutor", icon: GraduationCap },
//     {
//       path: "/languageExpertsUser",
//       label: "Language Experts",
//       icon: Languages,
//     },
//     {
//       path: "/savedRecourcesUser",
//       label: "Saved Resources",
//       icon: BookmarkPlus,
//     },
//   ];

//   const handleSignOut = async () => {
//     try {
//       await signOut(auth);
//       toast.success("Logged out successfully!");
//       navigate("/");
//     } catch (error) {
//       toast.error("Error during logout");
//       console.error("Error during logout:", error);
//     }
//   };

//   const toggleDropdown = () => {
//     setDropdownOpen(!dropdownOpen);
//   };

//   return (
//     <div className=" fixed top-2 left-2 flex flex-col h-[calc(100vh-1rem)] bg-[#e6fde9] w-64 py-6 rounded-3xl border-2 border-[#b9f9c2]">
//       {/* Logo */}
//       <Link to="/" className="px-6 mb-8">
//         <img alt="bambuu" src="/images/bambuu-new-logo.png" />
//       </Link>

//       {/* Navigation Menu */}
//       <nav className="flex-1 px-4">
//         {menuItems.map((item) => {
//           const Icon = item.icon;
//           const isActive = location.pathname === item.path;
//           return (
//             <Link
//               key={item.path}
//               to={item.path}
//               className={`flex items-center gap-3 px-4 py-2 mb-2 transition-colors rounded-2xl
//                 ${
//                   isActive
//                     ? "bg-green-500 text-white"
//                     : "text-[#072f0f] hover:bg-green-500 hover:text-white"
//                 }`}
//             >
//               <Icon size={20} />
//               <span>{item.label}</span>
//             </Link>
//           );
//         })}
//       </nav>

//       {/* User Profile Section */}
//       <div className="px-2">
//         {user ? (
//           <Link
//             to="/profileUser"
//             className="flex items-center p-2 space-x-3 transition-colors bg-green-500 rounded-3xl hover:bg-green-600"
//           >
//             <div className="w-10 h-10 overflow-hidden bg-white rounded-full">
//               <img src={user.photoUrl} alt="Profile" className="w-10 h-10 " />
//             </div>
//             <div className="flex flex-col">
//               <span className="text-sm font-medium text-black ">
//                 {" "}
//                 {user.name || "User"}
//               </span>
//               <span className="text-sm text-gray-700">
//                 {" "}
//                 {user.email || "email"}
//               </span>
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
import { Link, useNavigate, useLocation } from "react-router-dom";
import { auth } from "../firebaseConfig";
import { signOut } from "firebase/auth";
import { toast } from "react-toastify";
import { Menu, Avatar } from "@mantine/core";
import {
  BookOpen,
  Users,
  GraduationCap,
  Languages,
  BookmarkPlus,
  Calendar,
  Settings,
  FileText,
  Users2,
  Home,
} from "lucide-react";
import { LuCrown, LuLogOut } from "react-icons/lu";
import { FaAngleDown } from "react-icons/fa6";

const Sidebar = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Define menu items for each user type
  const studentMenuItems = [
    { path: "/learn", label: "Learn", icon: BookOpen },
    { path: "/communityUser", label: "Community", icon: Users },
    { path: "/superTutorUser", label: "SuperTutor", icon: GraduationCap },
    {
      path: "/languageExpertsUser",
      label: "Language Experts",
      icon: Languages,
    },
    {
      path: "/savedRecourcesUser",
      label: "Saved Resources",
      icon: BookmarkPlus,
    },
  ];

  const tutorMenuItems = [
    { path: "/learn", label: "Home", icon: Home },
    { path: "/studentsTutor", label: "Students", icon: Users2 },
    { path: "/savedRecourcesTutor", label: "Resources", icon: BookmarkPlus },
  ];

  // Select menu items based on user type
  const menuItems =
    user?.userType === "tutor" ? tutorMenuItems : studentMenuItems;

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully!");
      navigate("/");
    } catch (error) {
      toast.error("Error during logout");
      console.error("Error during logout:", error);
    }
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const profilePath =
    user?.userType === "tutor" ? "/profileTutor" : "/profileUser";

  return (
    <div className="fixed top-2 left-2 flex flex-col h-[calc(100vh-1rem)] bg-[#e6fde9] w-64 py-6 rounded-3xl border-2 border-[#b9f9c2]">
      {/* Logo */}
      <Link to="/" className="px-6 mb-8">
        <img alt="bambuu" src="/images/bambuu-new-logo.png" />
      </Link>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2 mb-2 transition-colors rounded-2xl
                ${
                  isActive
                    ? "bg-green-500 text-white"
                    : "text-[#072f0f] hover:bg-green-500 hover:text-white"
                }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className="px-2">
        {user ? (
          <Link
            to={profilePath}
            className="flex items-center p-2 space-x-3 transition-colors bg-green-500 rounded-3xl hover:bg-green-600"
          >
            <div className="w-10 h-10 overflow-hidden bg-white rounded-full">
              <img src={user.photoUrl} alt="Profile" className="w-10 h-10" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-black">
                {user.name || "User"}
              </span>
              <span className="text-sm text-gray-700">
                {user.email || "email"}
              </span>
            </div>
          </Link>
        ) : (
          <Link to="/login" className="flex items-center space-x-2">
            <Avatar radius="xl" size="sm" />
            <span className="text-lg text-gray-700">Jones Mike</span>
            <span className="text-sm text-gray-500">jones.m@gmail.com</span>
          </Link>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
