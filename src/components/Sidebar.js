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
} from "lucide-react";
import { LuCrown, LuLogOut } from "react-icons/lu";
import { FaAngleDown } from "react-icons/fa6";

const Sidebar = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const menuItems = [
    { path: "/learn", label: "Learn", icon: BookOpen },
    { path: "/community", label: "Community", icon: Users },
    { path: "/super-tutor", label: "SuperTutor", icon: GraduationCap },
    { path: "/language-experts", label: "Language Experts", icon: Languages },
    { path: "/saved-resources", label: "Saved Resources", icon: BookmarkPlus },
  ];

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

  return (
    <div className=" fixed top-2 left-2 flex flex-col h-[calc(100vh-1rem)] bg-[#e6fde9] w-64 py-6 rounded-3xl border-2 border-[#b9f9c2]">
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
      <div className="px-6">
        {user ? (
          <Menu
            opened={dropdownOpen}
            onOpen={toggleDropdown}
            onClose={toggleDropdown}
            position="right-end"
            radius="lg"
          >
            <Menu.Target>
              <div className="flex items-center p-3 space-x-2 bg-white cursor-pointer rounded-2xl">
                <Avatar
                  src={user.photoUrl}
                  radius="xl"
                  size="sm"
                  className="hover:cursor-pointer"
                />
                <span className="text-lg text-black">
                  {user.name || "User"}
                </span>
                <FaAngleDown />
              </div>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                component={Link}
                to="/membership"
                className={`text-[#042f0c] ${
                  location.pathname === "/membership" ? "bg-green-100" : ""
                }`}
                leftSection={<LuCrown />}
              >
                Membership
              </Menu.Item>
              <Menu.Item
                onClick={handleSignOut}
                color="#f04438"
                leftSection={<LuLogOut />}
              >
                Logout
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
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
