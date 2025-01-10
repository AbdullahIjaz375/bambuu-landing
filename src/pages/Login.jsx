// src/Login.js
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
import { getMessaging, getToken } from "firebase/messaging";
const Login = () => {
  const googleProvider = new GoogleAuthProvider();
  const facebookProvider = new FacebookAuthProvider();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { user, loading, updateUserData } = useAuth(); // Destructure loading state

  const getFCMToken = async () => {
    try {
      const messaging = getMessaging();
      const currentToken = await getToken(messaging, {
        vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY,
      });

      if (currentToken) {
        return currentToken;
      }

      console.log("No registration token available.");
      return null;
    } catch (error) {
      console.error("Error getting FCM token:", error);
      return null;
    }
  };
  const handleGoogleLoginStudent = async () => {
    const loadingToastId = toast.loading("Logging in...");

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userRef = doc(db, "students", user.uid);
      const userDoc = await getDoc(userRef);

      const notificationPrefsRef = doc(
        db,
        "notification_preferences",
        user.uid
      );
      const notificationPrefsDoc = await getDoc(notificationPrefsRef);

      let isFirstTimeLogin = false;
      const fcmToken = await getFCMToken(); // Call getFCMToken here

      if (!userDoc.exists()) {
        isFirstTimeLogin = true;
        // Create new user document
        const newUserData = {
          email: user.email,
          name: user.displayName || "",
          uid: user.uid,
          enrolledClasses: [],
          joinedGroups: [],
          adminOfClasses: [],
          adminOfGroups: [],
          lastLoggedIn: serverTimestamp(),
          learningLanguage: "",
          learningLanguageProficiency: "Beginner",
          nativeLanguage: "",
          country: "",
          photoUrl: "",
          savedDocuments: [],
          tier: 1,
          currentStreak: 1,
          fcmToken: fcmToken || "", // Add FCM token
          credits: 0,
          subscriptions: [
            {
              endDate: null,
              startDate: null,
              type: "None",
            },
          ],
        };

        await setDoc(userRef, newUserData);

        if (!notificationPrefsDoc.exists()) {
          await setDoc(notificationPrefsRef, {
            userId: user.uid,
            appUpdates: true,
            classReminder: true,
            groupChat: true,
            newMessages: true,
            resourceAssign: true,
          });
        }

        // Update session with new user data
        updateUserData({
          ...newUserData,
          lastLoggedIn: new Date(),
        });
      } else {
        // Update existing user
        const userData = userDoc.data();
        const lastLoggedIn = userData.lastLoggedIn
          ? userData.lastLoggedIn.toDate()
          : null;
        const currentStreak = userData.currentStreak || 0;

        const now = new Date();
        let updatedStreak = currentStreak;

        if (lastLoggedIn) {
          const lastLoginDate = new Date(
            lastLoggedIn.getFullYear(),
            lastLoggedIn.getMonth(),
            lastLoggedIn.getDate()
          );
          const currentDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );

          const differenceInDays =
            (currentDate - lastLoginDate) / (1000 * 60 * 60 * 24);

          if (differenceInDays === 1) {
            updatedStreak = currentStreak + 1;
          } else if (differenceInDays > 1) {
            updatedStreak = 1;
          }
        } else {
          updatedStreak = 1;
        }

        // Update Firestore
        await updateDoc(userRef, {
          lastLoggedIn: serverTimestamp(),
          currentStreak: updatedStreak,
          // userType: "student", // Ensure userType is stored in Firestore
        });

        // Update session with updated user data
        updateUserData({
          ...userData,
          currentStreak: updatedStreak,
          lastLoggedIn: now,
          userType: "student",
        });
      }

      toast.update(loadingToastId, {
        render: "Logged in successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      if (isFirstTimeLogin) {
        navigate("/userEditProfile", { replace: true });
      } else {
        navigate("/learn", { replace: true });
      }
    } catch (error) {
      console.error("Error during Google login:", error);
      updateUserData(null);

      toast.update(loadingToastId, {
        render: `Login error: ${error.message}`,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    }
  };

  const handleEmailLoginStudent = async (e) => {
    const loadingToastId = toast.loading("Logging in...");
    e.preventDefault();

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      const userRef = doc(db, "students", user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        toast.error("User profile not found");
        await signOut(auth);
        return;
      }

      const userData = userDoc.data();
      const lastLoggedIn = userData.lastLoggedIn
        ? userData.lastLoggedIn.toDate()
        : null;
      const now = new Date();
      const currentStreak = userData.currentStreak || 0;

      // Calculate streak
      let updatedStreak = currentStreak;
      if (lastLoggedIn) {
        const lastLoginDate = new Date(
          lastLoggedIn.getFullYear(),
          lastLoggedIn.getMonth(),
          lastLoggedIn.getDate()
        );
        const currentDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );
        const differenceInDays =
          (currentDate - lastLoginDate) / (1000 * 60 * 60 * 24);

        if (differenceInDays === 1) {
          updatedStreak = currentStreak + 1;
        } else if (differenceInDays > 1) {
          updatedStreak = 1;
        }
      } else {
        updatedStreak = 1;
      }

      // Update Firestore
      await updateDoc(userRef, {
        lastLoggedIn: serverTimestamp(),
        currentStreak: updatedStreak,
        // userType: "student", // Ensure userType is stored in Firestore
      });

      // Store complete user data
      const sessionUserData = {
        ...userData,
        uid: user.uid,
        currentStreak: updatedStreak,
        lastLoggedIn: now,
        userType: "student",
      };

      // Use AuthContext's updateUserData
      updateUserData(sessionUserData);

      toast.update(loadingToastId, {
        render: "Logged in successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

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

      toast.update(loadingToastId, {
        render: "Invalid email or password",
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    }
  };

  const handleFacebookLogin = async () => {
    const facebookProvider = new FacebookAuthProvider();
    try {
      const result = await signInWithPopup(auth, facebookProvider);
      const user = result.user;

      // Check if user data already exists in Firestore
      const userDoc = await getDoc(doc(db, "students", user.uid));
      if (!userDoc.exists()) {
        // Set initial data with empty values if it doesn't exist
        await setDoc(doc(db, "students", user.uid), {
          email: user.email,
          nickname: "",
          country: "",
          learningLanguage: "",
          nativeLanguage: "",
          accountType: "user",
          timeZone: "",
          createdAt: new Date(),
        });
      }

      navigate("/learn", { replace: true });
    } catch (error) {
      console.error("Error during Facebook login:", error);
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
      <div className="w-full max-w-md p-6 space-y-4 bg-white rounded-3xl border border-[#e7e7e7]">
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
        <form onSubmit={handleEmailLoginStudent} className="space-y-4">
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
                className={`w-full px-4 py-2 rounded-full border ${
                  emailError ? "border-red-500" : "border-gray-300"
                } focus:outline-none focus:ring-2 ${
                  emailError ? "focus:ring-red-500" : "focus:ring-green-500"
                }`}
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
                className={`w-full px-4 py-2 rounded-full border ${
                  passwordError ? "border-red-500" : "border-gray-300"
                } focus:outline-none focus:ring-2 ${
                  passwordError ? "focus:ring-red-500" : "focus:ring-green-500"
                }`}
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
            <Link to="/login-tutor" className="text-[#14b82c] font-semibold">
              Login as Tutor
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

        {/* Social Login */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 text-gray-500 bg-white">or sign in with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleGoogleLoginStudent}
            className="flex items-center justify-center px-4 py-2 space-x-4 border border-gray-300 rounded-full hover:bg-gray-50"
          >
            <img alt="google" src="/svgs/login-insta.svg" />
            <span>Google</span>
          </button>
          <button
            onClick={handleFacebookLogin}
            className="flex items-center justify-center px-4 py-2 space-x-4 border border-gray-300 rounded-full hover:bg-gray-50"
          >
            <img alt="google" src="/svgs/login-fb.svg" />
            <span>Facebook</span>
          </button>
        </div>

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

        {/* Sign Up Link */}
        <div className="text-sm text-center text-[#5d5d5d]">
          <p>
            Don't have any account?{" "}
            <Link to="/signup" className="text-[#14B82C]">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
