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
        <div className="flex flex-row space-x-8">
          <h1 className="text-xl text-[#6D6D6D]">© 2024 All rights reserved</h1>
          <Link to="/contact-us" className="text-xl text-[#6D6D6D]">
            Contact Us
          </Link>
        </div>
        <div className="flex flex-row items-center justify-center space-x-12">
          <a href="https://www.instagram.com/bammbuu_languages/">
            {" "}
            <img
              alt="bambuu"
              src="/images/insta.png"
              className="w-auto h-auto"
            />
          </a>
          <a href="https://www.facebook.com/profile.php?id=61565466403338">
            {" "}
            <img alt="bambuu" src="/images/fb.png" className="w-auto h-auto" />
          </a>

          <a href="https://www.youtube.com/@bammbuu-languages">
            {" "}
            <img alt="bambuu" src="/images/youtube.png" className="w-[30px] h-auto opacity-65" />
          </a>
          {/* <img alt="bambuu" src="/images/x.png" className="w-auto h-auto" /> */}
        </div>
        
        <div className="flex flex-row items-center space-x-6">
          {" "}
          <Link to="/privacy-policy">
            <h1 className="text-xl text-[#6D6D6D]">Privacy Policy</h1>
          </Link>
          <Link to="/terms-and-conditions">
            <h1 className="text-xl text-[#6D6D6D]">Terms & Conditions</h1>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Footer;
