// src/components/Navbar.js
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@mantine/core";

const Navbar = () => {
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
              className="w-40 h-auto md:w-auto"
            />
          </Link>

          <div className="items-center space-x-4 ">
            <Link className="text-sm text-gray-700 md:text-lg hover:text-green-600">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
