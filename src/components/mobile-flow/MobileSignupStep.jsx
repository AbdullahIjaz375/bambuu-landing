import React, { useState, useEffect } from "react";
import MobileModal from "../MobileModal";
import { auth } from "../../firebaseConfig";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
} from "firebase/auth";
import { useLanguage } from "../../context/LanguageContext";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
import { toast } from "react-toastify";
import ClipLoader from "react-spinners/ClipLoader";
import MobileModalHeader from "./MobileModalHeader";

const MobileSignupStep = ({ onNext, onClose }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const { currentLanguage, changeLanguage } = useLanguage();
  const { t } = useTranslation();
  const googleProvider = new GoogleAuthProvider();
  const appleProvider = new OAuthProvider("apple.com");

  useEffect(() => {
    let verificationTimer;
    const checkEmailVerification = async () => {
      try {
        if (auth.currentUser) {
          await auth.currentUser.reload();
          if (auth.currentUser.emailVerified) {
            setIsEmailVerified(true);
            clearInterval(verificationTimer);
          }
        }
      } catch (error) {
        // ignore
      }
    };
    if (verificationSent && !isEmailVerified) {
      verificationTimer = setInterval(checkEmailVerification, 3000);
    }
    return () => {
      if (verificationTimer) clearInterval(verificationTimer);
    };
  }, [verificationSent, isEmailVerified]);

  useEffect(() => {
    if (isEmailVerified) {
      toast.success(t("signup.verification.success", "Email verified!"));
      onNext();
    }
  }, [isEmailVerified, onNext, t]);

  const handleLanguageChange = (lang) => {
    changeLanguage(lang);
    i18n.changeLanguage(lang);
    localStorage.setItem("i18nextLng", lang);
    document.documentElement.lang = lang;
  };

  const resetStates = async () => {
    try {
      if (auth.currentUser) await signOut(auth);
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setShowConfirmPassword(false);
      setVerificationSent(false);
      setIsEmailVerified(false);
    } catch (error) {}
  };

  const handleInitialSignup = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error(t("signup.passwordsNoMatch", "Passwords do not match!"));
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      await sendEmailVerification(userCredential.user);
      setVerificationSent(true);
      toast.success(t("signup.verification.sent", "Verification email sent!"));
    } catch (error) {
      toast.error(error.message);
      await resetStates();
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        toast.success(
          t("signup.verification.resent", "Verification email resent!"),
        );
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if this is a new user by trying to get existing user document
      const { doc, getDoc } = await import("firebase/firestore");
      const { db } = await import("../../firebaseConfig");

      const userRef = doc(db, "students", user.uid);
      const userDoc = await getDoc(userRef);

      // If this is a new user, create user_accounts document with correct signup method
      if (!userDoc.exists()) {
        const { setDoc, serverTimestamp } = await import("firebase/firestore");
        await setDoc(doc(db, "user_accounts", user.uid), {
          uid: user.uid,
          email: user.email,
          sign_up_method: "google",
          created_at: serverTimestamp(),
        });
      }

      if (auth.currentUser.emailVerified) {
        setIsEmailVerified(true);
      } else {
        setVerificationSent(true);
        await sendEmailVerification(auth.currentUser);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, appleProvider);
      const user = result.user;

      // Check if this is a new user by trying to get existing user document
      const { doc, getDoc } = await import("firebase/firestore");
      const { db } = await import("../../firebaseConfig");

      const userRef = doc(db, "students", user.uid);
      const userDoc = await getDoc(userRef);

      // If this is a new user, create user_accounts document with correct signup method
      if (!userDoc.exists()) {
        const { setDoc, serverTimestamp } = await import("firebase/firestore");
        await setDoc(doc(db, "user_accounts", user.uid), {
          uid: user.uid,
          email: user.email,
          sign_up_method: "apple",
          created_at: serverTimestamp(),
        });
      }

      if (auth.currentUser.emailVerified) {
        setIsEmailVerified(true);
      } else {
        setVerificationSent(true);
        await sendEmailVerification(auth.currentUser);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // UI
  return (
    <MobileModal open={true} onClose={onClose} subscriptionStep={false}>
      <MobileModalHeader onClose={onClose} subscriptionStep={false} />
      <div className="px-6 pb-6 text-center">
        <div className="mx-auto mt-2 flex w-full max-w-xs flex-col items-center px-6">
          <div className="mb-8 w-full space-y-2 text-center">
            <h1 className="text-3xl font-bold">Sign Up</h1>
            <p className="text-lg text-gray-600">Let's create a new account!</p>
          </div>
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <ClipLoader color="#14B82C" size={40} />
            </div>
          ) : verificationSent && !isEmailVerified ? (
            <div className="w-full max-w-xs text-center">
              <h2 className="mb-2 text-xl font-bold">Email Verification</h2>
              <p className="mb-4 text-gray-600">
                An email with verification link has been sent to {email}
              </p>
              <button
                onClick={handleResendEmail}
                className="mb-2 w-full rounded-full border border-black bg-[#ffbf00] py-3 text-black hover:bg-[#cc9900] focus:outline-none"
              >
                Resend Email
              </button>
              <button
                onClick={resetStates}
                className="w-full rounded-full border border-black py-3 text-black hover:bg-gray-100 focus:outline-none"
              >
                Sign up with different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleInitialSignup} className="w-full space-y-6">
              <div className="space-y-1">
                <label className="block text-sm font-medium">Email</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-5 w-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-.659 1.591l-7.5 7.5a2.25 2.25 0 01-3.182 0l-7.5-7.5A2.25 2.25 0 012.25 6.993V6.75"
                      />
                    </svg>
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="enter your email"
                    className="w-full rounded-3xl border border-gray-300 p-2 pl-10 focus:border-[#14B82C] focus:outline-none focus:ring-0"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium">Password</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-5 w-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.5 10.5V7.125A4.125 4.125 0 008.25 7.125V10.5m8.25 0a2.25 2.25 0 012.25 2.25v4.125a2.25 2.25 0 01-2.25 2.25H7.5a2.25 2.25 0 01-2.25-2.25V12.75a2.25 2.25 0 012.25-2.25m8.25 0h-8.25"
                      />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="enter your password"
                    className="w-full rounded-3xl border border-gray-300 p-2 pl-10 focus:border-[#14B82C] focus:outline-none focus:ring-0"
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
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-5 w-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.5 10.5V7.125A4.125 4.125 0 008.25 7.125V10.5m8.25 0a2.25 2.25 0 012.25 2.25v4.125a2.25 2.25 0 01-2.25 2.25H7.5a2.25 2.25 0 01-2.25-2.25V12.75a2.25 2.25 0 012.25-2.25m8.25 0h-8.25"
                      />
                    </svg>
                  </span>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="re-enter your password"
                    className="w-full rounded-3xl border border-gray-300 p-2 pl-10 focus:border-[#14B82C] focus:outline-none focus:ring-0"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transform text-gray-500"
                  >
                    {showConfirmPassword ? (
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
              </div>
              <button
                type="submit"
                className="mt-8 w-full rounded-full border border-black bg-[#14b82c] py-3 font-semibold text-white hover:bg-[#119523] focus:outline-none focus:ring-2 focus:ring-[#119523] focus:ring-offset-2"
              >
                Create an Account
              </button>
            </form>
          )}
          {/* Social Login Separator */}
          <div className="relative my-8 w-full">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">
                or sign up with
              </span>
            </div>
          </div>
          {/* Social Login Buttons */}
          <div className="grid w-full grid-cols-2 gap-4">
            <button
              onClick={handleGoogleLogin}
              className="flex items-center justify-center space-x-2 rounded-full border border-gray-300 bg-white px-4 py-2 hover:bg-gray-50"
            >
              <img
                alt="Google"
                src="/svgs/login-insta.svg"
                className="h-5 w-5"
              />
              <span className="font-medium text-black">Google</span>
            </button>
            <button
              onClick={handleAppleLogin}
              className="flex items-center justify-center space-x-2 rounded-full border border-gray-300 bg-white px-4 py-2 hover:bg-gray-50"
            >
              <img
                alt="Facebook"
                src="/svgs/facebook.svg"
                className="h-5 w-5"
              />
              <span className="font-medium text-black">Facebook</span>
            </button>
          </div>
          {/* Terms & Privacy */}
          <div className="mb-4 mt-6 w-full text-center text-xs text-gray-500">
            <p>
              By signing up, you agree to our{" "}
              <a href="/terms" className="text-black hover:underline">
                Terms & Conditions
              </a>{" "}
              and{" "}
              <a href="/privacy" className="text-black hover:underline">
                Privacy Policy
              </a>
              .
            </p>
          </div>
          {/* Login Link */}
          <div className="w-full text-center text-xs text-gray-600">
            Already have any account?{" "}
            <a
              href="/login"
              className="font-semibold text-green-600 hover:text-green-700"
            >
              Login
            </a>
          </div>
        </div>
      </div>
    </MobileModal>
  );
};

export default MobileSignupStep;
