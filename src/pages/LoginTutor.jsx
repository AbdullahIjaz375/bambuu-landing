// src/LoginTutor.js
import React, { useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig";
import {
  GoogleAuthProvider,
  signInWithPopup,
  FacebookAuthProvider,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { Button, TextInput, Paper, Divider, Group, Title } from "@mantine/core";
import { FaFacebook } from "react-icons/fa6";
import { FaGoogle } from "react-icons/fa6";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import ClipLoader from "react-spinners/ClipLoader";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

const LoginTutor = () => {
  const googleProvider = new GoogleAuthProvider();
  const facebookProvider = new FacebookAuthProvider();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { user, loading, updateUserData } = useAuth(); // Destructure loading state

  const handleEmailLoginTutor = async (e) => {
    // const loadingToastId = toast.loading("Logging in...");
    e.preventDefault();

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      const tutorRef = doc(db, "tutors", user.uid);
      const tutorDoc = await getDoc(tutorRef);

      if (!tutorDoc.exists()) {
        toast.error("Tutor profile not found");
        await signOut(auth);
        return;
      }

      const userData = tutorDoc.data();

      // Just update last login time
      await updateDoc(tutorRef, {
        lastLoggedIn: serverTimestamp(),
      });

      const sessionUserData = {
        ...userData,
        uid: user.uid,
        userType: "tutor",
        lastLoggedIn: new Date(),
      };

      updateUserData(sessionUserData);

      toast.success("Logged in successfully!", { autoClose: 3000 });

      navigate("/learn", { replace: true });
    } catch (error) {
      console.error("Error during email login:", error);
      if (
        error.code === "auth/invalid-credential" ||
        error.message.includes("INVALID_LOGIN_CREDENTIALS")
      ) {
        setEmailError("Wrong email address.");
        setPasswordError("Wrong password.");
      } else if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/invalid-email"
      ) {
        setEmailError("Wrong email address.");
      } else if (error.code === "auth/wrong-password") {
        setPasswordError("Wrong password.");
      }

      toast.error("Invalid email or password", { autoClose: 5000 });
    }
  };

  const validateEmail = (email) => {
    if (!email) {
      setEmailError("Wrong email address.");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Wrong email address.");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validatePassword = (password) => {
    if (!password) {
      setPasswordError("Wrong password.");
      return false;
    }
    if (password.length < 6) {
      setPasswordError("Wrong password.");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (emailError) validateEmail(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (passwordError) validatePassword(e.target.value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ClipLoader color="#14B82C" size={50} />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 ">
      <div className="w-full max-w-md p-6 space-y-6 bg-white rounded-3xl border border-[#e7e7e7]">
        {/* Logo */}
        <div className="flex justify-center">
          <img alt="bambuu" src="/svgs/logo-login.svg" />
        </div>

        {/* Welcome Text */}
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Welcome Back!</h1>
          <p className="text-gray-600">Let's get you logged in.</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleEmailLoginTutor} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm text-gray-700">Email</label>
            <div className="relative">
              {" "}
              {/* Add this wrapper div */}
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="Enter your email"
                className={`w-full p-2 border rounded-3xl ${
                  emailError
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-300 focus:border-green-500"
                } focus:ring-0 focus:outline-none`}
                required
              />
              {emailError && (
                <div className="absolute transform -translate-y-1/2 right-3 top-1/2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5 text-red-500"
                  >
                    <path
                      fillRule="evenodd"
                      d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
            {emailError && <p className="text-sm text-red-500">{emailError}</p>}
          </div>
          <div className="space-y-1">
            <label className="block text-sm text-gray-700">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={handlePasswordChange}
                placeholder="Enter your password"
                className={`w-full p-2 border rounded-3xl ${
                  passwordError
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-300 focus:border-green-500"
                } focus:ring-0 focus:outline-none`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute transform -translate-y-1/2 right-3 top-1/2"
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5 text-gray-500"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5 text-gray-500"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                )}
              </button>
            </div>
            {passwordError && (
              <p className="text-sm text-red-500">{passwordError}</p>
            )}
          </div>
          {/* Links */}
          <div className="flex justify-between pb-4 text-sm">
            <Link to="/forgot-password" className="font-semibold text-red-500">
              Forgot Password?
            </Link>
            <Link to="/login" className="text-[#14b82c] font-semibold">
              Login as Student
            </Link>
          </div>
          {/* Login Button */}
          <button
            type="submit"
            className={`w-full py-3 rounded-full focus:outline-none border border-[#042F0C] text-[#042F0C] ${
              email && password ? " bg-[#14B82C] " : " bg-[#b9f9c2]"
            }`}
          >
            Login
          </button>
        </form>

        {/* Terms */}
        <div className=" text-sm text-center text-[#9e9e9e] pt-6">
          <p>
            By logging, you agree to our{" "}
            <a href="#" className="text-black">
              Terms & Conditions
            </a>
          </p>
          <p>
            and{" "}
            <a href="#" className="text-black">
              PrivacyPolicy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginTutor;
