import { Link } from "react-router-dom";
import React from "react";

const Footer = () => {
  return (
    <div className="flex flex-col px-6 pt-20 pb-16 sm:px-10 md:px-20 lg:px-40">
      <div className="flex flex-col md:flex-row items-center justify-between border-b border-[#444444] pb-8">
        <h2 className="text-4xl font-bold text-green-500 md:text-6xl">
          bambbuu
        </h2>

        <div className="flex flex-row items-center mt-4 space-x-4 md:mt-0">
          <img
            src="/images/insta-footer.png"
            alt="Instagram"
            className="w-8 h-8 md:w-10 md:h-10 hover:cursor-pointer"
          />
          <img
            src="/images/fb-footer.png"
            alt="Facebook"
            className="w-8 h-8 md:w-10 md:h-10 hover:cursor-pointer"
          />
        </div>
      </div>

      <div className="flex flex-col items-center justify-between pt-8 md:flex-row">
        <h1 className="text-sm text-center text-gray-500 md:text-xl md:text-left">
          ©2024 Capital H LLC. All Rights Reserved.
        </h1>
        <div className="flex flex-col items-center mt-4 space-y-4 md:flex-row md:space-y-0 md:space-x-8 md:mt-0">
          <Link to="/" className="text-lg font-semibold text-black md:text-2xl">
            About us
          </Link>
          <Link to="/" className="text-lg font-semibold text-black md:text-2xl">
            Terms of service
          </Link>
          <Link to="/" className="text-lg font-semibold text-black md:text-2xl">
            Privacy Policy
          </Link>
          <Link to="/" className="text-lg font-semibold text-black md:text-2xl">
            Cookie Notice
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Footer;
