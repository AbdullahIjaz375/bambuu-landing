// src/components/Navbar.js
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebaseConfig";
import { signOut } from "firebase/auth";
import { toast } from "react-toastify";
import { FaBars, FaTimes } from "react-icons/fa";
import { Avatar, TextInput, Button } from "@mantine/core";
import { IoSearchOutline } from "react-icons/io5";

const Navbar = ({ user }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  return (
    <div className="w-full bg-white ">
      <div className="flex flex-col px-12 pt-4">
        <div className="flex items-center justify-between ">
          {/* Logo */}
          <Link
            to="/"
            className="text-4xl font-bold text-green-600 md:text-7xl "
          >
            bammbuu
          </Link>

          {/* Desktop Navigation Links */}
          <div className="items-center hidden mr-48 space-x-6 md:flex">
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
          </div>

          {/* Sign In/Out Button & Avatar */}
          <div className="items-center hidden space-x-4 md:flex">
            {user ? (
              <>
                <Button
                  onClick={handleSignOut}
                  variant="subtle"
                  className="text-lg text-gray-700 hover:text-green-600"
                >
                  Sign out
                </Button>
                <Avatar
                  src={user.photoUrl}
                  radius="xl"
                  onClick={() => navigate("/settings")}
                  className="hover:cursor-pointer"
                />
              </>
            ) : (
              <Link
                to="/login"
                className="text-lg text-gray-700 hover:text-green-600"
              >
                Sign in
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            className="text-gray-700 md:hidden"
            onClick={toggleMobileMenu}
          >
            {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>
        {/* <div className="flex items-center justify-center">
          {" "}
          <div className="items-center flex-grow hidden max-w-lg mx-4 md:flex">
            <TextInput
              placeholder="Ask SuperTutor"
              radius="md"
              size="lg"
              styles={{
                input: {
                  borderColor: "#14B82C", // Apply green color for the border
                  borderWidth: "1px", // Optional: to make the border thicker
                },
              }}
              leftSection={
                <IoSearchOutline className="text-3xl text-green-500" />
              }
              className="w-full border-green-500"
            />
          </div>
        </div> */}
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="px-4 py-2 bg-white border-t border-gray-200 md:hidden">
          <div className="flex flex-col space-y-4">
            {/* <TextInput
              placeholder="Ask SuperTutor"
              radius="md"
              size="md"
              leftSection={
                <IoSearchOutline className="text-xl text-green-500" />
              }
              className="w-full border-green-500"
              styles={{
                input: {
                  borderColor: "#14B82C", // Apply green color for the border
                  borderWidth: "1px", // Optional: to make the border thicker
                },
              }}
            /> */}

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
              to="/supertutor"
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
            {user ? (
              <>
                <Button
                  onClick={handleSignOut}
                  variant="subtle"
                  className="text-lg text-gray-700 hover:text-green-600"
                >
                  Sign out
                </Button>
                <Avatar
                  src={user.photoUrl}
                  radius="xl"
                  className="hover:cursor-pointer"
                  onClick={() => navigate("/settings")}
                />
              </>
            ) : (
              <Link
                to="/login"
                className="text-lg text-gray-700 hover:text-green-600"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
