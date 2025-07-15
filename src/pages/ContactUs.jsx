import React, { useRef } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import { Button, TextInput, Textarea } from "@mantine/core";
import "../styles/LandingStyles.css";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";

const ContactUs = () => {
  const form = useRef();

  const handleSubmit = (e) => {
    e.preventDefault();

    // Get form values using the name attributes
    const firstName = e.target.firstName.value;
    const lastName = e.target.lastName.value;
    const email = e.target.email.value;
    const phone = e.target.phone.value;
    const message = e.target.message.value;

    const mailtoLink = `mailto:admin@bammbuu.com?subject=${encodeURIComponent(
      "Contact Form Submission",
    )}&body=${encodeURIComponent(
      `Name: ${firstName} ${lastName}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}`,
    )}`;

    window.location.href = mailtoLink;

    e.target.reset(); // Reset the form after submission
  };
  return (
    <>
      <div className="overflow-hidden font-urbanist">
        {/* Contact Us Section */}
        <div className="bg-[#E6FDE9] pb-32">
          <div className="flex flex-col px-12 pt-4">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <Link
                to="/"
                className="text-4xl font-bold text-green-600 md:text-7xl"
              >
                <img
                  alt="bambuu"
                  src="/images/bambuu-new-logo.png"
                  className="h-auto w-40 md:w-auto"
                />
              </Link>

              <div className="items-center space-x-4">
                <Link className="text-base font-medium hover:text-green-600">
                  <Button
                    className="border border-[#042F0C] text-black"
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
          <div className="mt-8 flex flex-col items-center justify-center space-y-8 px-4 lg:mt-20 lg:space-y-16 lg:px-0">
            <div className="mb-6 flex flex-col items-center justify-center space-y-4">
              <h1 className="text-center text-lg font-semibold text-[#14B82C] lg:text-xl">
                Contact Us
              </h1>
              <h1 className="text-center text-xl font-bold text-[#042F0C] lg:text-5xl">
                We’d love to hear from you
              </h1>
              <h1 className="text-center text-lg text-black lg:text-2xl">
                Please fill out this form.
              </h1>
            </div>
          </div>
        </div>
        {/* Contact Form Section */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mx-auto mt-20 max-w-xl p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  placeholder="enter your first name"
                  className="w-full rounded-full border border-gray-200 px-4 py-3 focus:outline-none focus:ring-1 focus:ring-green-500"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  placeholder="enter your last name"
                  className="w-full rounded-full border border-gray-200 px-4 py-3 focus:outline-none focus:ring-1 focus:ring-green-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                placeholder="enter your email"
                className="w-full rounded-full border border-gray-200 px-4 py-3 focus:outline-none focus:ring-1 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                placeholder="enter your phone number"
                className="w-full rounded-full border border-gray-200 px-4 py-3 focus:outline-none focus:ring-1 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Message
              </label>
              <textarea
                name="message"
                placeholder="Leave us a message..."
                rows="4"
                className="w-full rounded-3xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-1 focus:ring-green-500"
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="privacy"
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                required
              />
              <label htmlFor="privacy" className="text-sm text-gray-600">
                You agree to our friendly{" "}
                <a href="#" className="underline">
                  privacy policy
                </a>
                .
              </label>
            </div>

            <button
              type="submit"
              className="w-full rounded-full border border-[#042F0C] bg-[#14B82C] px-4 py-3 text-black transition-colors hover:cursor-pointer"
            >
              Send message
            </button>
          </form>
        </motion.div>
      </div>
      <Footer />
    </>
  );
};

export default ContactUs;
