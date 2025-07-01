// src/LoginTutor.js
import React, { useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig";
import {
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { useNavigate, Link, useLocation } from "react-router-dom";
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
import { useTranslation } from "react-i18next";
import { useLanguage } from "../context/LanguageContext";

// Helper: Update query string by setting a new ref value.
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
    "/groupDetailsTutor/",
    "/classDetailsTutor/",
    "/newGroupDetailsTutor/",
    "/learn",
    "/learn-tutor",
    "/userEditProfile",
    "/groupsTutor",
    "/classesTutor",
    "/messagesTutor",
    "/profileTutor",
    "/unauthorized",
  ];
  return validPrefixes.some((prefix) => path.startsWith(prefix));
};

const LoginTutor = () => {
  const googleProvider = new GoogleAuthProvider();
  const facebookProvider = new FacebookAuthProvider();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { user, loading, updateUserData } = useAuth();
  const { currentLanguage, changeLanguage } = useLanguage();
  const { t } = useTranslation();

  // Handle language change
  const handleLanguageChange = (lang) => {
    changeLanguage(lang);
  };

  // Helper: Redirect after login.
  // Check for saved redirect path first, then fallback to other methods
  const redirectAfterLogin = () => {
    // First check for the general redirect path saved in sessionStorage
    const savedRedirectPath = sessionStorage.getItem("redirectAfterLogin");
    if (savedRedirectPath && isValidRedirectPath(savedRedirectPath)) {
      sessionStorage.removeItem("redirectAfterLogin");
      navigate(savedRedirectPath, { replace: true });
      return;
    }

    // Continue with existing special case handling
    const params = new URLSearchParams(location.search);
    if (params.get("ref") === "sub") {
      const savedUrl = localStorage.getItem("selectedPackageUrl");
      if (savedUrl) {
        try {
          const parsedUrl = new URL(savedUrl);
          const path = parsedUrl.pathname + parsedUrl.search;
          localStorage.removeItem("selectedPackageUrl");
          navigate(path, { replace: true });
          return;
        } catch (error) {
          console.error("Error parsing saved subscription URL:", error);
        }
      }
    } else if (params.get("ref") === "class") {
      const savedUrl = localStorage.getItem("selectedClassUrl");
      if (savedUrl) {
        try {
          const parsedUrl = new URL(savedUrl);
          const path = parsedUrl.pathname + parsedUrl.search;
          localStorage.removeItem("selectedClassUrl");
          navigate(path, { replace: true });
          return;
        } catch (error) {
          console.error("Error parsing saved class URL:", error);
        }
      }
    } else if (params.get("ref") === "group") {
      const savedUrl = localStorage.getItem("selectedGroupUrl");
      if (
        savedUrl &&
        (savedUrl.includes("/groupDetailsTutor/") ||
          savedUrl.includes("/groupDetailsUser/") ||
          savedUrl.includes("/newGroupDetailsUser/"))
      ) {
        try {
          const parsedUrl = new URL(savedUrl);
          const path = parsedUrl.pathname + parsedUrl.search;
          localStorage.removeItem("selectedGroupUrl");
          navigate(path, { replace: true });
          return;
        } catch (error) {
          console.error("Error parsing saved group URL:", error);
          localStorage.removeItem("selectedGroupUrl"); // Always clear if error
        }
      } else {
        localStorage.removeItem("selectedGroupUrl"); // Clear if not valid
      }
    }
    // Fallback: Redirect to the tutor landing page.
    navigate("/learn", { replace: true });
  };

  // If a tutor is already logged in, redirect accordingly.
  useEffect(() => {
    if (user) {
      redirectAfterLogin();
    }
  }, [user]);

  const handleEmailLoginTutor = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
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

      // Update last login time.
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
      redirectAfterLogin();
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
      <div className="flex min-h-screen items-center justify-center">
        <ClipLoader color="#14B82C" size={50} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-[#e7e7e7] bg-white p-6">
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
          <img alt="bambuu" src="/svgs/logo-login.svg" />
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
        <form onSubmit={handleEmailLoginTutor} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm text-gray-700">
              {t("login.email", "Email")}
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder={t("login.emailPlaceholder", "Enter your email")}
                className={`w-full rounded-3xl border p-2 ${
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
            <label className="block text-sm text-gray-700">
              {t("login.password", "Password")}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={handlePasswordChange}
                placeholder={t(
                  "login.passwordPlaceholder",
                  "Enter your password",
                )}
                className={`w-full rounded-3xl border p-2 ${
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
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-5 w-5 text-gray-500"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-5 w-5 text-gray-500"
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
            {/* Switch to Student Login:
                If the current URL contains ref=class, preserve it;
                otherwise if it contains ref=sub, preserve that;
                else default to "/login". */}
            <Link
              to={
                location.search.includes("ref=class")
                  ? "/login?ref=class"
                  : location.search.includes("ref=sub")
                    ? "/login?ref=sub"
                    : "/login"
              }
              className="font-semibold text-[#14b82c]"
            >
              {t("loginTutor.loginAsStudent", "Login as Student")}
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
      </div>
    </div>
  );
};

export default LoginTutor;
