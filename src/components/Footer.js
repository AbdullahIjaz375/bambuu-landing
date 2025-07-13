import { Link, useLocation } from "react-router-dom";
import "./FooterStyles.css";
import React from "react";

const Footer = () => {
  const location = useLocation();
  const { pathname } = location;

  return (
    <div className="footer-background mt-40 flex flex-col space-y-20 rounded-t-[20vh] border-t-8 border-[#B9F9C2] pb-12 pt-24">
      <div className="flex items-center justify-center">
        <img
          alt="bambuu"
          src="/images/bambuu-new-logo.png"
          className="h-auto w-auto"
        />
      </div>
      <div className="grid grid-cols-3 items-center px-20">
        <div className="flex gap-5">
          <h1 className="text-xl text-[#6D6D6D]">
            © 2024 All rights reserved
          </h1>
          <Link to="/contact-us" className="text-xl text-[#6D6D6D]">
            Contact Us
          </Link>
        </div>
        <div className="flex justify-center gap-6">
          <a href="https://www.instagram.com/bammbuu_languages/">
            {" "}
            <img
              alt="bambuu"
              src="/images/insta.png"
              className="h-auto w-auto"
            />
          </a>
          <a href="https://www.facebook.com/profile.php?id=61565466403338">
            {" "}
            <img alt="bambuu" src="/images/fb.png" className="h-auto w-auto" />
          </a>

          <a href="https://www.youtube.com/@bammbuu-languages">
            {" "}
            <img
              alt="bambuu"
              src="/images/youtube.png"
              className="h-auto w-[30px] opacity-65"
            />
          </a>
          {/* <img alt="bambuu" src="/images/x.png" className="w-auto h-auto" /> */}
        </div>

        <div className="flex justify-end gap-5">
          {" "}
          {pathname !== "/privacy-policy" && (
            <Link to="/privacy-policy">
              <h1 className="text-xl text-[#6D6D6D]">Privacy Policy</h1>
            </Link>
          )}
          {pathname !== "/terms-and-conditions" && (
            <Link to="/terms-and-conditions">
              <h1 className="text-xl text-[#6D6D6D]">Terms & Conditions</h1>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Footer;
