import { Link } from "react-router-dom";
import "./FooterStyles.css";
import React from "react";

const Footer = () => {
  return (
    <div className="border-t-8 flex flex-col space-y-20  border-[#B9F9C2] rounded-t-[20vh] mt-40 pt-24 pb-12 footer-background">
      <div className="flex items-center justify-center">
        <img
          alt="bambuu"
          src="/images/bambuu-new-logo.png"
          className="w-auto h-auto"
        />
      </div>
      <div className="flex flex-row items-center justify-between px-10">
        <h1 className="text-xl text-[#6D6D6D]">© 2024 All rights reserved</h1>
        <div className="flex flex-row items-center justify-center space-x-12">
          <img alt="bambuu" src="/images/insta.png" className="w-auto h-auto" />
          <img alt="bambuu" src="/images/x.png" className="w-auto h-auto" />
          <img alt="bambuu" src="/images/fb.png" className="w-auto h-auto" />
        </div>
        <h1 className="text-xl text-[#6D6D6D]">Privacy Policy</h1>
      </div>
    </div>
  );
};

export default Footer;
