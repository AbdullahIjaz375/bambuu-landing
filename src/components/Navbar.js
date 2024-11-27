// src/components/Navbar.js
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebaseConfig";
import { signOut } from "firebase/auth";
import { toast } from "react-toastify";
import { FaBars, FaTimes } from "react-icons/fa";
import { Avatar, TextInput, Button, Menu } from "@mantine/core";
import { IoSearchOutline } from "react-icons/io5";
import { LuCrown, LuLogOut } from "react-icons/lu";
import { TbLogout2 } from "react-icons/tb";
import { FaAngleDown } from "react-icons/fa6";

const Navbar = ({ user }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  console.log(user);

  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully!");
      navigate("/"); // Redirect to login after logout
    } catch (error) {
      toast.error("Error during logout");
      console.error("Error during logout:", error);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  return (
    <div className="w-full mt-4 bg-white">
      <div className="flex flex-col px-12 pt-4">
        <div className="flex items-center justify-between ">
          {/* Logo */}
          <Link
            to="/"
            className="text-4xl font-bold text-green-600 md:text-7xl "
          >
            <img
              alt="bambuu"
              src="/images/bambuu-new-logo.png"
              className="w-auto h-auto"
            />
          </Link>

          {/* Desktop Navigation Links */}
          {/* <div className="items-center hidden mr-48 space-x-6 md:flex">
            <Link
              to="/learn"
              className="text-lg text-gray-700 hover:text-green-600"
            >
              Learn
            </Link>
            <Link
              to="/languageGroups"
              className="text-lg text-gray-700 hover:text-green-600"
            >
              Language Groups
            </Link>
            <Link
              to="/superTutor"
              className="text-lg text-gray-700 hover:text-green-600"
            >
              SuperTutor
            </Link>
            <Link
              to="/bammbuu-plus"
              className="text-lg text-gray-700 hover:text-green-600"
            >
              bammbuu+
            </Link>
          </div> */}

          {/* Sign In/Out Button & Avatar */}
          <div className="items-center hidden space-x-4 md:flex">
            {user ? (
              <>
                <div className="relative">
                  <Menu
                    opened={dropdownOpen}
                    onOpen={toggleDropdown}
                    onClose={toggleDropdown}
                    position="bottom-end"
                    radius="lg"
                  >
                    <Menu.Target>
                      <div className="flex items-center space-x-2 cursor-pointer">
                        <Avatar
                          src={user.photoUrl}
                          radius="xl"
                          size="sm"
                          className=" hover:cursor-pointer"
                        />
                        <span className="ml-2 text-lg text-black">
                          {user.name || "User"}
                        </span>
                        <FaAngleDown />
                      </div>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        component={Link}
                        to="/membership"
                        className="text-[#042f0c]"
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
                </div>
              </>
            ) : (
              <Link
                to="/login"
                className="text-lg text-gray-700 hover:text-green-600"
              >
                <Button
                  className="text-black border-2 border-black"
                  size="md"
                  variant="filled"
                  color="#14b82c"
                  radius="xl"
                >
                  {" "}
                  Get Started
                </Button>{" "}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
