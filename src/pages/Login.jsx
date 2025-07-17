// src/Login.js
import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { auth, db, messaging } from "../firebaseConfig";
import {
  GoogleAuthProvider,
  signInWithPopup,
  FacebookAuthProvider,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { OAuthProvider } from "firebase/auth";
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
import { useTranslation } from "react-i18next";
import { useLanguage } from "../context/LanguageContext";

// Helper: Updates the current query string by replacing any existing "ref" value with the provided newRef.
const getUpdatedQuery = (locationSearch, newRef) => {
  const params = new URLSearchParams(locationSearch);
  params.set("ref", newRef);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
};

// Utility function to validate redirect paths
const isValidRedirectPath = (path) => {
  if (!path || typeof path !== "string") return false;
  // Whitelist of valid routes
  const validPrefixes = [
    "/groupDetailsUser/",
    "/classDetailsUser/",
    "/newGroupDetailsUser/",
    "/learn",
    "/learn-tutor",
    "/userEditProfile",
    "/groupsUser",
    "/classesUser",
    "/messagesUser",
    "/profileUser",
    "/profileTutor",
    "/groupDetailsTutor/",
    "/classDetailsTutor/",
    "/newGroupDetailsTutor/",
    "/unauthorized",
  ];
  return validPrefixes.some((prefix) => path.startsWith(prefix));
};

const Login = () => {
  const googleProvider = new GoogleAuthProvider();
  const appleProvider = new OAuthProvider("apple.com");
  const { user, loading, updateUserData } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [redirected, setRedirected] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { currentLanguage, changeLanguage } = useLanguage();
  const { t } = useTranslation();

  // Ensure that if a class URL was saved, the student login URL keeps ?ref=class.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    // If no "ref" exists and a selectedClassUrl is present, force ref=class.
    if (!params.has("ref") && localStorage.getItem("selectedClassUrl")) {
      params.set("ref", "class");
      navigate(`/login?${params.toString()}`, { replace: true });
    }
  }, [location.search, navigate]);
  const redirectAfterLogin = useCallback(
    (isFirstTimeLogin = false) => {
      // Check for saved redirect paths with priority order
      const sessionRedirectPath = sessionStorage.getItem("redirectAfterLogin");
      const localRedirectPath = localStorage.getItem("redirectAfterLogin");
      const redirectTimestamp = localStorage.getItem("redirectTimestamp");
      const redirectUsed = localStorage.getItem("redirectUsed");

      // Use session storage first (most recent), then local storage if not too old
      let savedRedirectPath = sessionRedirectPath;
      if (!savedRedirectPath && localRedirectPath && !redirectUsed) {
        // Check if the redirect is not too old (within 24 hours)
        const now = Date.now();
        const savedTime = redirectTimestamp ? parseInt(redirectTimestamp) : 0;
        const hoursDiff = (now - savedTime) / (1000 * 60 * 60);

        if (hoursDiff < 24) {
          savedRedirectPath = localRedirectPath;
        }
      }

      // Only use the saved redirect path if it is valid
      if (savedRedirectPath && isValidRedirectPath(savedRedirectPath)) {
        // Clear all redirect data
        sessionStorage.removeItem("redirectAfterLogin");
        localStorage.removeItem("redirectAfterLogin");
        localStorage.removeItem("redirectTimestamp");
        localStorage.setItem("redirectUsed", "true");

        navigate(savedRedirectPath, { replace: true });
        setRedirected(true);
        return;
      }

      // Clear any remaining redirect data
      sessionStorage.removeItem("redirectAfterLogin");
      localStorage.removeItem("redirectAfterLogin");
      localStorage.removeItem("redirectTimestamp");

      // Continue with existing special case handling
      const params = new URLSearchParams(location.search);
      if (!params.get("ref") && localStorage.getItem("selectedClassUrl")) {
        params.set("ref", "class");
      }
      if (params.get("ref") === "sub") {
        const savedUrl = localStorage.getItem("selectedPackageUrl");
        if (savedUrl) {
          try {
            const parsedUrl = new URL(savedUrl);
            const path = parsedUrl.pathname + parsedUrl.search;
            localStorage.removeItem("selectedPackageUrl");
            navigate(path, { replace: true });
            setRedirected(true);
            return;
          } catch (error) {
            console.error("Error parsing saved subscription URL:", error);
          }
        }
      } else if (params.get("ref") === "class") {
        const savedClassUrl = localStorage.getItem("selectedClassUrl");
        if (savedClassUrl) {
          try {
            const parsedUrl = new URL(savedClassUrl);
            const path = parsedUrl.pathname + parsedUrl.search;
            localStorage.removeItem("selectedClassUrl");
            navigate(path, { replace: true });
            setRedirected(true);
            return;
          } catch (error) {
            console.error("Error parsing saved class URL:", error);
          }
        }
      } else if (params.get("ref") === "group") {
        const savedGroupUrl = localStorage.getItem("selectedGroupUrl");
        if (savedGroupUrl) {
          try {
            const parsedUrl = new URL(savedGroupUrl);
            const path = parsedUrl.pathname + parsedUrl.search;
            localStorage.removeItem("selectedGroupUrl");
            navigate(path, { replace: true });
            setRedirected(true);
            return;
          } catch (error) {
            console.error("Error parsing saved group URL:", error);
          }
        }
      }

      // Fallback redirection.
      if (isFirstTimeLogin) {
        navigate("/userEditProfile", { replace: true });
      } else {
        navigate("/learn", { replace: true });
      }
      setRedirected(true);
    },
    [location, navigate, setRedirected],
  ); // Automatically redirect if the user is already logged in.
  useEffect(() => {
    if (user && !redirected) {
      redirectAfterLogin(false);
    }
  }, [user, redirected, redirectAfterLogin]);
  // Helper to get FCM token with proper authentication check.
  const getFCMToken = async () => {
    try {
      // Only request FCM token if user is authenticated
      if (!auth.currentUser) {
        console.log("No authenticated user, skipping FCM token request");
        return null;
      }

      const messaging = getMessaging();
      const currentToken = await getToken(messaging, {
        vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY,
      });
      if (currentToken) {
        return currentToken;
      }
      return null;
    } catch (error) {
      console.error("Error getting FCM token:", error);
      // Don't throw the error, just return null to allow login to proceed
      return null;
    }
  };

  // Apple login
  const handleAppleLoginStudent = async () => {
    try {
      const result = await signInWithPopup(auth, appleProvider);
      const user = result.user;
      const userRef = doc(db, "students", user.uid);
      const userDoc = await getDoc(userRef);
      const notificationPrefsRef = doc(
        db,
        "notification_preferences",
        user.uid,
      );
      const notificationPrefsDoc = await getDoc(notificationPrefsRef);
      const userAccountRef = doc(db, "user_accounts", user.uid);
      let isFirstTimeLogin = false;
      const fcmToken = await getFCMToken();

      if (!userDoc.exists()) {
        isFirstTimeLogin = true;
        const newUserData = {
          email: user.email || "",
          name:
            user.displayName ||
            (user.email ? user.email.split("@")[0] : "User"),
          uid: user.uid,
          enrolledClasses: [],
          joinedGroups: [],
          adminOfClasses: [],
          adminOfGroups: [],
          lastLoggedIn: serverTimestamp(),
          learningLanguage: "",
          learningLanguageProficiency: "Beginner",
          nativeLanguage: "",
          freeAccess: false,
          country: "",
          photoUrl: "/images/panda.png",
          savedDocuments: [],
          tier: 1,
          currentStreak: 1,
          fcmToken: fcmToken || "",
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
        await setDoc(userAccountRef, {
          uid: user.uid,
          sign_up_method: "apple",
          created_at: serverTimestamp(),
        });
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
        updateUserData({
          ...newUserData,
          lastLoggedIn: new Date(),
          userType: "student",
        });
      } else {
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
            lastLoggedIn.getDate(),
          );
          const currentDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
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
        await updateDoc(userRef, {
          lastLoggedIn: serverTimestamp(),
          currentStreak: updatedStreak,
        });

        // Request notification permission and FCM token after successful authentication
        try {
          const permission = await Notification.requestPermission();
          if (permission === "granted") {
            const fcmToken = await getFCMToken();
            if (fcmToken) {
              await updateDoc(userRef, {
                fcmToken: fcmToken,
              });
            }
          } else {
            console.warn("Notification permission not granted");
          }
        } catch (notificationError) {
          console.error("Error handling notifications:", notificationError);
          // Don't let notification errors break the login flow
        }
        const sessionUserData = {
          ...userData,
          uid: user.uid,
          currentStreak: updatedStreak,
          lastLoggedIn: now,
          userType: "student",
        };
        updateUserData(sessionUserData);
        toast.success("Logged in successfully!", { autoClose: 3000 });

        // Use a try-catch for the redirect to prevent auth errors from breaking login flow
        try {
          if (!sessionUserData.name || !sessionUserData.email) {
            navigate("/userEditProfile", { replace: true });
          } else {
            redirectAfterLogin(false);
          }
        } catch (redirectError) {
          console.error("Error during redirect after login:", redirectError);
          // If redirect fails, go to the default page
          navigate("/learn", { replace: true });
        }
      }
    } catch (error) {
      console.error("Error during Apple login:", error);
      updateUserData(null);
      toast.error("Failed to log in with Apple", { autoClose: 5000 });
    }
  };

  // Google login
  const handleGoogleLoginStudent = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userRef = doc(db, "students", user.uid);
      const userDoc = await getDoc(userRef);
      const notificationPrefsRef = doc(
        db,
        "notification_preferences",
        user.uid,
      );
      const notificationPrefsDoc = await getDoc(notificationPrefsRef);
      const userAccountRef = doc(db, "user_accounts", user.uid);
      let isFirstTimeLogin = false;
      const fcmToken = await getFCMToken();
      if (!userDoc.exists()) {
        isFirstTimeLogin = true;
        const newUserData = {
          email: user.email || "",
          name:
            user.displayName ||
            (user.email ? user.email.split("@")[0] : "User"),
          uid: user.uid,
          enrolledClasses: [],
          joinedGroups: [],
          freeAccess: false, // Ensure freeAccess is set to false
          adminOfClasses: [],
          adminOfGroups: [],
          lastLoggedIn: serverTimestamp(),
          learningLanguage: "",
          learningLanguageProficiency: "Beginner",
          nativeLanguage: "",
          country: "",
          photoUrl: "/images/panda.png",
          savedDocuments: [],
          tier: 1,
          currentStreak: 1,
          fcmToken: fcmToken || "",
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
        await setDoc(userAccountRef, {
          uid: user.uid,
          sign_up_method: "google",
          created_at: serverTimestamp(),
        });
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
        updateUserData({
          ...newUserData,
          lastLoggedIn: new Date(),
          userType: "student",
        });
      } else {
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
            lastLoggedIn.getDate(),
          );
          const currentDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
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
        await updateDoc(userRef, {
          lastLoggedIn: serverTimestamp(),
          currentStreak: updatedStreak,
        });

        // Request notification permission and FCM token after successful authentication
        try {
          const permission = await Notification.requestPermission();
          if (permission === "granted") {
            const fcmToken = await getFCMToken();
            if (fcmToken) {
              await updateDoc(userRef, { fcmToken });
            }
          } else {
            console.warn("Notification permission not granted");
          }
        } catch (notificationError) {
          console.error("Error handling notifications:", notificationError);
          // Don't let notification errors break the login flow
        }
        const sessionUserData = {
          ...userData,
          uid: user.uid,
          currentStreak: updatedStreak,
          lastLoggedIn: now,
          userType: "student",
        };
        updateUserData(sessionUserData);
        toast.success("Logged in successfully!", { autoClose: 3000 });

        // Use a try-catch for the redirect to prevent auth errors from breaking login flow
        try {
          if (!sessionUserData.name || !sessionUserData.email) {
            navigate("/userEditProfile", { replace: true });
          } else {
            redirectAfterLogin(false);
          }
        } catch (redirectError) {
          console.error("Error during redirect after login:", redirectError);
          // If redirect fails, go to the default page
          navigate("/learn", { replace: true });
        }
      }
    } catch (error) {
      console.error("Error during Google login:", error);
      updateUserData(null); // Enhanced error handling for Google login
      switch (error.code) {
        case "auth/popup-closed-by-user":
          toast.warning("Login was canceled. Please try again.", {
            autoClose: 3000,
          });
          break;
        case "auth/popup-blocked":
          toast.error(
            "Popup was blocked by your browser. Please allow popups for this site and try again.",
            {
              autoClose: 7000,
            },
          );
          break;
        case "auth/invalid-credential":
          toast.error(
            "Invalid credentials. Please try again or use a different login method.",
            {
              autoClose: 5000,
            },
          );
          break;
        case "auth/network-request-failed":
          toast.error(
            "Network error. Please check your internet connection and try again.",
            {
              autoClose: 5000,
            },
          );
          break;
        case "auth/too-many-requests":
          toast.error(
            "Too many failed attempts. Please wait a moment and try again.",
            {
              autoClose: 5000,
            },
          );
          break;
        case "auth/operation-not-allowed":
          toast.error("Google login is not enabled. Please contact support.", {
            autoClose: 5000,
          });
          break;
        case "auth/user-disabled":
          toast.error(
            "This account has been disabled. Please contact support.",
            {
              autoClose: 5000,
            },
          );
          break;
        default:
          console.warn("Non-critical error during login:", error);
          navigate("/learn", { replace: true });
          break;
      }
    }
  };

  // Email login
  const handleEmailLoginStudent = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
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
      let updatedStreak = currentStreak;
      if (lastLoggedIn) {
        const lastLoginDate = new Date(
          lastLoggedIn.getFullYear(),
          lastLoggedIn.getMonth(),
          lastLoggedIn.getDate(),
        );
        const currentDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
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
      await updateDoc(userRef, {
        lastLoggedIn: serverTimestamp(),
        currentStreak: updatedStreak,
        freeAccess: false,
      });
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        const fcmToken = await getToken(messaging, {
          vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY,
        });
        await updateDoc(userRef, { fcmToken });
      } else {
        console.warn("Notification permission not granted");
      }
      const sessionUserData = {
        ...userData,
        uid: user.uid,
        currentStreak: updatedStreak,
        lastLoggedIn: now,
        userType: "student",
      };
      updateUserData(sessionUserData);
      toast.success("Logged in successfully!", { autoClose: 3000 });

      // Use a try-catch for the redirect to prevent auth errors from breaking login flow
      try {
        if (!sessionUserData.name || !sessionUserData.email) {
          navigate("/userEditProfile", { replace: true });
        } else {
          redirectAfterLogin(false);
        }
      } catch (redirectError) {
        console.error("Error during redirect after login:", redirectError);
        // If redirect fails, go to the default page
        navigate("/learn", { replace: true });
      }
    } catch (error) {
      console.error("Error during email login:", error);

      // Clear user data on authentication errors
      if (
        error.code === "auth/invalid-credential" ||
        error.message?.includes("INVALID_LOGIN_CREDENTIALS")
      ) {
        updateUserData(null);
        setEmailError("Wrong email address.");
        setPasswordError("Wrong password.");
      } else if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/invalid-email"
      ) {
        setEmailError("Wrong email address.");
      } else if (error.code === "auth/wrong-password") {
        setPasswordError("Wrong password.");
      } else {
        // For other errors, do not show a warning toast, just proceed to /learn
        console.warn("Non-critical error during login:", error);
        navigate("/learn", { replace: true });
      }
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
      <div className="flex min-h-screen items-center justify-center">
        <ClipLoader color="#14B82C" size={50} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-4 rounded-[40px] border border-[#e7e7e7] bg-white p-6">
        {/* Language Selector */}
        <div className="flex justify-end">
          <select
            value={currentLanguage}
            onChange={(e) => changeLanguage(e.target.value)}
            className="rounded-full border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
          </select>
        </div>

        {/* Logo */}
        <div className="flex justify-center">
          <img
            alt="bambuu"
            src="/svgs/logo-login.svg"
            className="hover:cursor-pointer"
            onClick={() => {
              navigate("/");
            }}
          />
        </div>

        {/* Welcome Text */}
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">
            {t("login.title", "Welcome Back!")}
          </h1>
          <p className="text-gray-600">
            {t("login.subtitle", "Let's get you logged in.")}
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleEmailLoginStudent} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-semibold leading-5 text-[#3D3D3D]">
              {t("login.email", "Email")}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <img src="/svgs/email-icon.svg" alt="Email" />
              </span>
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder={t("login.emailPlaceholder", "enter your email")}
                className={`w-full rounded-3xl border p-2 pl-10 ${
                  emailError
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-300 focus:border-green-500"
                } focus:outline-none focus:ring-0`}
                required
              />
              {emailError && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 transform">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-5 w-5 text-red-500"
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
            {emailError && (
              <p className="text-sm text-red-500">
                {t(`login.errors.wrongEmail`, emailError)}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-semibold leading-5 text-[#3D3D3D]">
              {t("login.password", "Password")}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <img src="/svgs/lock-icon.svg" alt="Lock" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={handlePasswordChange}
                placeholder={t(
                  "login.passwordPlaceholder",
                  "enter your password",
                )}
                className={`w-full rounded-3xl border p-2 pl-10 ${
                  passwordError
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-300 focus:border-green-500"
                } focus:outline-none focus:ring-0`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transform"
              >
                {showPassword ? (
                  <img src="/svgs/eye-open.svg" alt="eye-open" />
                ) : (
                  <img src="/svgs/eye-closed.svg" alt="eye-closed" />
                )}
              </button>
            </div>
            {passwordError && (
              <p className="text-sm text-red-500">
                {t(`login.errors.wrongPassword`, passwordError)}
              </p>
            )}
          </div>
          {/* Links */}
          <div className="flex justify-between pb-4 text-sm">
            <Link to="/forgot-password" className="font-semibold text-red-500">
              {t("login.forgotPassword", "Forgot Password?")}
            </Link>
            {/* When switching to tutor login, update the query string to set ref=tutor */}
            <Link
              to={`/login-tutor${getUpdatedQuery(location.search, "class")}`}
              className="font-semibold text-[#14b82c]"
            >
              {t("login.loginAsTutor", "Login as Tutor")}
            </Link>
          </div>
          {/* Login Button */}
          <button
            type="submit"
            className={`w-full rounded-full border border-[#042F0C] py-3 text-[#042F0C] focus:outline-none ${
              email && password ? "bg-[#14B82C]" : "bg-[#b9f9c2]"
            }`}
          >
            {t("login.loginButton", "Login")}
          </button>
        </form>

        {/* Social Login */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">
              {t("login.orSignInWith", "or sign in with")}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleGoogleLoginStudent}
            className="flex items-center justify-center space-x-4 rounded-full border border-gray-300 px-4 py-2 hover:bg-gray-50"
          >
            <img alt="google" src="/svgs/login-insta.svg" />
            <span>{t("login.google", "Google")}</span>
          </button>
          <button
            onClick={handleAppleLoginStudent}
            className="flex items-center justify-center space-x-4 rounded-full border border-black bg-black px-4 py-2 text-white"
          >
            <img
              alt="apple"
              className="h-6 w-auto"
              src="/images/apple-white.png"
            />
            <span>{t("login.apple", "Apple")}</span>
          </button>
        </div>

        {/* Terms */}
        <div className="px-[42px] pt-8 text-center text-sm/[160%] text-[#9e9e9e]">
          <p>
            {t("login.termsConditions", "By logging, you agree to our")}{" "}
            <a href="#" className="text-black">
              {t("login.terms", "Terms & Conditions")}
            </a>
          </p>
          <p>
            {t("login.and", "and")}{" "}
            <a href="#" className="text-black">
              {t("login.privacyPolicy", "Privacy Policy")}
            </a>
            .
          </p>
        </div>

        {/* Sign Up Link */}
        <div className="text-center text-sm text-[#5d5d5d]">
          <p>
            {t("login.noAccount", "Don't have an account?")}{" "}
            <Link to="/signup" className="text-[#14B82C]">
              {t("login.signUp", "Sign up")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
