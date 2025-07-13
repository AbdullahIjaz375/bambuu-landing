import React, { useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { OAuthProvider } from "firebase/auth";

import { messaging } from "../firebaseConfig";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import ClipLoader from "react-spinners/ClipLoader";
import { setDoc } from "firebase/firestore";
import { doc } from "firebase/firestore";
import { getToken } from "firebase/messaging";
import Modal from "react-modal";
import { updateDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { COUNTRIES } from "../config/contries";
import { LANGUAGES } from "../config/languages";
import { TEACHINGLANGUAGES } from "../config/teachingLanguages";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../context/LanguageContext";
import MobileModal from "../components/MobileModal";
import WebSubscriptionStep from "./user/WebSubscriptionStep";

Modal.setAppElement("#root");

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);
  return isMobile;
}

const Signup = ({ onNext, onClose, isModal = false }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const appleProvider = new OAuthProvider("apple.com");
  const { currentLanguage, changeLanguage } = useLanguage();
  const { t } = useTranslation();

  const [profileData, setProfileData] = useState({
    name: "",
    nativeLanguage: "",
    learningLanguage: "",
    proficiency: "Beginner",
    country: "",
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const navigate = useNavigate();
  const { user, loading, updateUserData } = useAuth();
  const [loading1, setLoading1] = useState(false);
  const location = useLocation();

  const isMobile = useIsMobile();

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
        console.error("Error checking verification:", error);
      }
    };

    if (verificationSent && !isEmailVerified) {
      verificationTimer = setInterval(checkEmailVerification, 3000);
    }

    return () => {
      if (verificationTimer) {
        clearInterval(verificationTimer);
      }
    };
  }, [verificationSent, isEmailVerified]);

  const handleLanguageChange = (lang) => {
    changeLanguage(lang);
    document.documentElement.lang = lang;
  };

  const resetStates = async () => {
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setShowConfirmPassword(false);
      setVerificationSent(false);
      setIsEmailVerified(false);
      setHasProfile(false);
      setShowPaywall(false);
      setProfileData({
        name: "",
        nativeLanguage: "",
        learningLanguage: "",
        proficiency: "Normal",
        country: "",
      });
    } catch (error) {
      console.error("Error resetting states:", error);
    }
  };

  const handleInitialSignup = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    setLoading1(true);
    toast.info("Creating temporary account for verification...");

    try {
      // Create a temporary account for verification
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      // Send verification email
      await sendEmailVerification(userCredential.user);

      setVerificationSent(true);
      toast.success("Verification email sent!");
    } catch (error) {
      toast.error(`Signup error: ${error.message}`);
      await resetStates();
    } finally {
      setLoading1(false);
    }
  };

  const handleResendEmail = async () => {
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        toast.success("Verification email resent!");
      } else {
        // If user session expired, create new temporary account
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        await sendEmailVerification(userCredential.user);
        toast.success("Verification email sent to new account!");
      }
    } catch (error) {
      toast.error(`Error sending verification email: ${error.message}`);
    }
  };

  const getFCMToken = async () => {
    try {
      const currentToken = await getToken(messaging, {
        vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY,
      });
      return currentToken || null;
    } catch (error) {
      console.error("Error getting FCM token:", error);
      return null;
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading1(true);
    const loadingToastId = toast.loading("Completing account setup...");

    try {
      if (!auth.currentUser || !auth.currentUser.emailVerified) {
        throw new Error("Please verify your email first");
      }
      const fcmToken = await getFCMToken();

      // Set app language based on the user's selection
      // If the user selects Spanish as native language, set the app language to Spanish
      const selectedNativeLanguage = profileData.nativeLanguage;
      let appLanguageCode = localStorage.getItem("i18nextLng") || "en";

      // If native language is Spanish, set app language to Spanish
      if (selectedNativeLanguage === "Spanish") {
        appLanguageCode = "es";
        changeLanguage("es");
        document.documentElement.lang = "es";
      }

      const userData = {
        adminOfClasses: [],
        adminOfGroups: [],
        country: profileData.country,
        currentStreak: 1, // Set initial streak to 1 for first login
        email: auth.currentUser.email || "",
        name:
          profileData.name ||
          (auth.currentUser.email
            ? auth.currentUser.email.split("@")[0]
            : "User"),
        enrolledClasses: [],
        joinedGroups: [],
        lastLoggedIn: new Date(),
        learningLanguage: profileData.learningLanguage,
        learningLanguageProficiency: profileData.proficiency,
        nativeLanguage: profileData.nativeLanguage,
        photoUrl: "/images/panda.png",
        savedDocuments: [],
        freeAccess: false,
        uid: auth.currentUser.uid,
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

      await setDoc(doc(db, "students", auth.currentUser.uid), userData);

      const notificationPreferences = {
        appUpdates: true,
        classReminder: true,
        groupChat: true,
        newMessages: true,
        resourceAssign: true,
        userId: auth.currentUser.uid,
      };

      await setDoc(
        doc(db, "notification_preferences", auth.currentUser.uid),
        notificationPreferences,
      );

      const userAccountRef = doc(db, "user_accounts", auth.currentUser.uid);
      const userAccountDoc = await getDoc(userAccountRef);

      if (!userAccountDoc.exists()) {
        await setDoc(userAccountRef, {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email,
          sign_up_method: "email",
          created_at: serverTimestamp(),
        });
      }

      const sessionUserData = {
        ...userData,
        userType: "student",
      };
      updateUserData(sessionUserData);

      toast.update(loadingToastId, {
        render: "Account created successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      // Show success modal instead of navigating
      setHasProfile(true);
      setShowSuccessModal(true);

      const examPrepFlow = location.state?.flow === "exam-prep";

      if (isModal) {
        onNext && onNext();
      } else {
        if (examPrepFlow) {
          setShowPaywall(true);
        } else {
          if (!sessionUserData.name || !sessionUserData.email) {
            navigate("/userEditProfile", { replace: true });
          } else {
            navigate("/learn", {
              replace: true,
              state: { language: appLanguageCode },
            });
          }
        }
      }
    } catch (error) {
      toast.update(loadingToastId, {
        render: `Profile creation failed: ${error.message}`,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
      console.error(error);
    } finally {
      setLoading1(false);
    }
  };

  const handleSkip = () => {
    const currentLanguageToUse = localStorage.getItem("i18nextLng") || "en";
    navigate("/learn", {
      replace: true,
      state: { language: currentLanguageToUse },
    });
  };

  const handleOnboarding = () => {
    const currentLanguageToUse = localStorage.getItem("i18nextLng") || "en";
    navigate("/onboarding", {
      replace: true,
      state: { language: currentLanguageToUse },
    });
  };

  const handleBackToSignup = async () => {
    await resetStates();
  };

  //------------------------------------------------google and fb---------------------------------//
  const googleProvider = new GoogleAuthProvider();

  const handleGoogleLoginStudent = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Get the provider data to confirm Google sign-in
      const providerData = user.providerData;
      const isGoogleProvider = providerData.some(
        (provider) => provider.providerId === "google.com",
      );

      // Log authentication information for debugging

      const userRef = doc(db, "students", user.uid);
      const userDoc = await getDoc(userRef);

      const notificationPrefsRef = doc(
        db,
        "notification_preferences",
        user.uid,
      );
      const notificationPrefsDoc = await getDoc(notificationPrefsRef);

      let isFirstTimeLogin = false;
      const fcmToken = await getFCMToken();

      if (!userDoc.exists()) {
        isFirstTimeLogin = true;
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
          freeAccess: false,
          country: "",
          photoUrl: "/images/panda.png",
          savedDocuments: [],
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

        // Use the confirmed provider information
        const signUpMethod = isGoogleProvider ? "google" : "email";

        // Create user_accounts document with correct signup method
        await setDoc(doc(db, "user_accounts", user.uid), {
          uid: user.uid,
          email: user.email,
          sign_up_method: signUpMethod,
          created_at: serverTimestamp(),
        });

        // Log what was actually stored
        const userAccountDoc = await getDoc(doc(db, "user_accounts", user.uid));
        if (userAccountDoc.exists()) {
        } else {
          console.log(
            "Failed to retrieve user account document for Google login",
          );
        }

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

        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          const fcmToken = await getToken(messaging, {
            vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY,
          });

          await updateDoc(userRef, {
            fcmToken: fcmToken,
          });
        } else {
          console.warn("Notification permission not granted");
        }

        updateUserData({
          ...userData,
          currentStreak: updatedStreak,
          lastLoggedIn: now,
          userType: "student",
        });
      }

      toast.success("Logged in successfully!", { autoClose: 3000 });

      if (isModal) {
        if (isFirstTimeLogin || !userDoc.data().name) {
          setIsEmailVerified(true);
          setHasProfile(false);
        } else {
          onNext();
        }
      } else {
        if (isFirstTimeLogin || !userDoc.data().name) {
          setIsEmailVerified(true);
          setHasProfile(false);
        } else {
          navigate("/learn", { replace: true });
        }
      }
    } catch (error) {
      console.error("Error during Google login:", error);
      updateUserData(null);

      toast.error("Invalid email or password", { autoClose: 5000 });
    }
  };

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

      let isFirstTimeLogin = false;
      const fcmToken = await getFCMToken();

      if (!userDoc.exists()) {
        isFirstTimeLogin = true;
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
          freeAccess: false,
          country: "",
          photoUrl: "/images/panda.png",
          savedDocuments: [],
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

        await setDoc(doc(db, "user_accounts", user.uid), {
          uid: user.uid,
          email: user.email,
          sign_up_method: "apple",
          created_at: serverTimestamp(),
        });

        const userAccountDoc = await getDoc(doc(db, "user_accounts", user.uid));
        if (userAccountDoc.exists()) {
          console.log(
            "User account data from database (Apple):",
            userAccountDoc.data(),
          );
        } else {
          console.log(
            "Failed to retrieve user account document for Apple login",
          );
        }

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

        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          const fcmToken = await getToken(messaging, {
            vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY,
          });

          await updateDoc(userRef, {
            fcmToken: fcmToken,
          });
        } else {
          console.warn("Notification permission not granted");
        }

        updateUserData({
          ...userData,
          currentStreak: updatedStreak,
          lastLoggedIn: now,
          userType: "student",
        });
      }

      toast.success("Logged in successfully!", { autoClose: 3000 });

      if (isModal) {
        if (isFirstTimeLogin || !userDoc.data().name) {
          setIsEmailVerified(true);
          setHasProfile(false);
        } else {
          onNext();
        }
      } else {
        if (isFirstTimeLogin || !userDoc.data().name) {
          setIsEmailVerified(true);
          setHasProfile(false);
        } else {
          navigate("/learn", { replace: true });
        }
      }
    } catch (error) {
      console.error("Error during Apple login:", error);
      updateUserData(null);

      toast.error("Failed to log in with Apple", { autoClose: 5000 });
    }
  };

  //---------------------------------------------------------------------------------------------------//

  if (loading || loading1) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <ClipLoader color="#14B82C" size={50} />
      </div>
    );
  }

  if (verificationSent && !isEmailVerified) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="w-full max-w-md rounded-3xl border border-[#e7e7e7] bg-white p-8">
          <div className="space-y-4 text-center">
            <div className="mb-6 flex justify-center">
              <img alt="bambuu" src="/svgs/email-verify.svg" />
            </div>
            <h2 className="text-3xl font-bold">
              {t("signup.verification.title", "Email Verification")}
            </h2>
            <p className="text-lg text-gray-600">
              {t(
                "signup.verification.message",
                "An email with verification link has been sent to",
              )}{" "}
              {email}
            </p>
            <button
              onClick={handleBackToSignup}
              className="w-full rounded-full border border-black bg-[#ffbf00] py-3 text-black hover:bg-[#cc9900] focus:outline-none"
            >
              {t(
                "signup.verification.changeEmail",
                "Sign up with different email",
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isEmailVerified && !hasProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-4">
        <div className="my-4 w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6">
          <div className="space-y-3">
            <div className="flex justify-center">
              <img alt="babuu" src="/svgs/signup.svg" />
            </div>

            <h2 className="text-center text-2xl font-bold md:text-3xl">
              {t("signup.profile.title", "Complete Profile")}
            </h2>
            <p className="text-center text-sm text-gray-600 md:text-base">
              {t(
                "signup.profile.subtitle",
                "Add your personal details to gets started.",
              )}
            </p>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-sm font-semibold">
                  {t("signup.profile.name", "Name")}
                </label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) =>
                    setProfileData({ ...profileData, name: e.target.value })
                  }
                  placeholder={t(
                    "signup.profile.namePlaceholder",
                    "enter your name",
                  )}
                  className="w-full rounded-3xl border border-gray-300 p-2 focus:border-[#14B82C] focus:outline-none focus:ring-0"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium">
                  {t("signup.profile.nativeLanguage", "Native Language")}
                </label>
                <select
                  value={profileData.nativeLanguage}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      nativeLanguage: e.target.value,
                    })
                  }
                  className="w-full rounded-full border border-gray-200 px-4 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">
                    {t(
                      "signup.profile.selectNativeLanguage",
                      "Select your native language",
                    )}
                  </option>
                  {LANGUAGES.map((language) => (
                    <option key={language.code} value={language.name}>
                      {language.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium">
                  {t("signup.profile.learningLanguage", "Learning Language")}
                </label>
                <select
                  value={profileData.learningLanguage}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      learningLanguage: e.target.value,
                    })
                  }
                  className="w-full rounded-full border border-gray-200 px-4 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">
                    {t(
                      "signup.profile.selectLearningLanguage",
                      "Select language you want to learn",
                    )}
                  </option>
                  {TEACHINGLANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium">
                  {t("signup.profile.proficiency", "Your Proficiency in")}{" "}
                  {profileData.learningLanguage || "[x]"}
                </label>
                <div className="flex gap-2">
                  {["Beginner", "Intermediate", "Advanced"].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() =>
                        setProfileData({ ...profileData, proficiency: level })
                      }
                      className={`flex-1 rounded-full border px-2 py-1.5 text-sm ${
                        profileData.proficiency === level
                          ? "border-green-500 bg-green-50 text-green-600"
                          : "border-gray-200 text-gray-600"
                      }`}
                    >
                      {t(`signup.profile.levels.${level.toLowerCase()}`, level)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium">
                  {t("signup.profile.country", "Country")}
                </label>
                <select
                  value={profileData.country}
                  onChange={(e) =>
                    setProfileData({ ...profileData, country: e.target.value })
                  }
                  className="w-full rounded-full border border-gray-200 px-4 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">
                    {t("signup.profile.selectCountry", "Select your country")}
                  </option>
                  {COUNTRIES.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="ageVerification"
                    className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    required
                  />
                  <label
                    htmlFor="ageVerification"
                    className="ml-2 text-sm font-medium text-gray-700"
                  >
                    {t(
                      "signup.profile.ageVerification",
                      "Are you at least 18 years of age?",
                    )}
                  </label>
                </div>
                <p
                  className="text-sm text-red-500"
                  id="ageWarning"
                  style={{ display: "none" }}
                >
                  {t(
                    "signup.profile.ageWarning",
                    "You must be at least 18 years old to use this application.",
                  )}
                </p>
              </div>

              <button
                type="submit"
                className="mt-4 w-full rounded-full border border-black bg-[#14B82C] py-2.5 text-black focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                onClick={(e) => {
                  const checkbox = document.getElementById("ageVerification");
                  const warning = document.getElementById("ageWarning");

                  if (!checkbox.checked) {
                    e.preventDefault();
                    warning.style.display = "block";
                  } else {
                    warning.style.display = "none";
                  }
                }}
              >
                {t("signup.profile.submit", "Submit")}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (showPaywall) {
    return <WebSubscriptionStep />;
  }

  if (isMobile) {
    return (
      <MobileModal open={true} onClose={() => {}}>
        <div className="flex w-full flex-col items-center justify-center p-8">
          <div className="mb-4 flex w-full justify-end">
            <select
              value={currentLanguage}
              onChange={(e) => changeLanguage(e.target.value)}
              className="rounded-full border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </div>
          <div className="mb-8 w-full space-y-2 text-center">
            <h1 className="text-3xl font-bold">
              {t("signup.title", "Sign Up")}
            </h1>
            <p className="text-lg text-gray-600">
              {t("signup.subtitle", "Let's create a new account!")}
            </p>
          </div>
          <form onSubmit={handleInitialSignup} className="w-full space-y-6">
            <div className="space-y-1">
              <label className="block text-sm font-medium">Email</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <img src="/svgs/email-icon.svg" alt="Email" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full rounded-3xl border border-gray-300 p-2 pl-10 focus:border-[#14B82C] focus:outline-none focus:ring-0"
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium">Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <img src="/svgs/lock-icon.svg" alt="Lock" />
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
                    <img src="/svgs/eye-open.svg" alt="eye-open" />
                  ) : (
                    <img src="/svgs/eye-closed.svg" alt="eye-closed" />
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
                  <img src="/svgs/lock-icon.svg" alt="Lock" />
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
                    <img src="/svgs/eye-open.svg" alt="eye-open" />
                  ) : (
                    <img src="/svgs/eye-closed.svg" alt="eye-closed" />
                  )}
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="mt-8 w-full rounded-full border border-black bg-[#14b82c] py-3 text-black hover:bg-[#119523] focus:outline-none focus:ring-2 focus:ring-[#119523] focus:ring-offset-2"
            >
              Create an Account
            </button>
          </form>
          <div className="relative my-8 w-full">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">
                {t("signup.orSignUpWith", "or sign up with")}
              </span>
            </div>
          </div>
          <div className="grid w-full grid-cols-2 gap-4">
            <button
              onClick={handleGoogleLoginStudent}
              className="flex items-center justify-center space-x-4 rounded-full border border-gray-300 px-4 py-2 hover:bg-gray-50"
            >
              <img alt="google" src="/svgs/login-insta.svg" />
              <span>{t("signup.google", "google")}</span>
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
              <span>{t("signup.apple", "apple")}</span>
            </button>
          </div>
          <div className="mb-4 mt-10 w-full text-center text-sm text-gray-500">
            <p>
              {t("signup.termsConditions", "By signing up, you agree to our")}{" "}
              <Link to="/terms" className="text-black hover:underline">
                {t("signup.terms", "Terms & Conditions")}
              </Link>{" "}
              {t("signup.and", "and")}{" "}
              <Link to="/privacy" className="text-black hover:underline">
                {t("signup.privacyPolicy", "Privacy Policy")}
              </Link>
              .
            </p>
          </div>
          <div className="w-full text-center text-sm text-gray-600">
            {t("signup.haveAccount", "Already have an account?")}{" "}
            <Link
              to="/login"
              className="font-semibold text-green-600 hover:text-green-700"
            >
              {t("signup.login", "Login")}
            </Link>
          </div>
        </div>
      </MobileModal>
    );
  }

  return (
    <>
      <div className="flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md space-y-4 rounded-[40px] border border-[#e7e7e7] bg-white p-6">
          {/* Language Selector */}
          <div className="mb-4 flex justify-end">
            <select
              value={currentLanguage}
              onChange={(e) => changeLanguage(e.target.value)}
              className="rounded-full border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </div>

          <div className="mb-8 space-y-2 text-center">
            <h1 className="text-3xl font-bold">
              {t("signup.title", "Sign Up")}
            </h1>
            <p className="text-lg text-gray-600">
              {t("signup.subtitle", "Let's create a new account!")}
            </p>
          </div>

          <form onSubmit={handleInitialSignup} className="space-y-6">
            <div className="space-y-1">
              <label className="block text-sm font-semibold leading-6">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="enter your email"
                className="w-full rounded-3xl border border-gray-300 p-2 focus:border-[#14B82C] focus:outline-none focus:ring-0"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold leading-6">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="enter your password"
                  className="w-full rounded-3xl border border-gray-300 p-2 focus:border-[#14B82C] focus:outline-none focus:ring-0"
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
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold leading-6">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="re-enter your password"
                  className="w-full rounded-3xl border border-gray-300 p-2 focus:border-[#14B82C] focus:outline-none focus:ring-0"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transform text-gray-500"
                >
                  {showConfirmPassword ? (
                    <img src="/svgs/eye-closed.svg" alt="eye-open" />
                  ) : (
                    <img src="/svgs/eye-open.svg" alt="eye-closed" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="mt-8 w-full rounded-[24px] border border-black bg-[#14b82c] py-3 text-black hover:bg-[#119523] focus:outline-none focus:ring-2 focus:ring-[#119523] focus:ring-offset-2"
            >
              Create An Account
            </button>
          </form>

          {/* Social Login Separator */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">
                {t("signup.orSignUpWith", "or continue with")}
              </span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleGoogleLoginStudent}
              className="flex items-center justify-center space-x-4 rounded-full border border-gray-300 px-4 py-2 hover:bg-gray-50"
            >
              <img alt="google" src="/svgs/login-insta.svg" />
              <span>{t("signup.google", "google")}</span>
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
              <span>{t("signup.apple", "apple")}</span>
            </button>
          </div>

          {/* Terms & Privacy */}
          <div className="mb-4 text-center text-sm text-gray-500">
            <p>
              {t("signup.termsConditions", "By signing up, you agree to our")}{" "}
              <Link to="/terms" className="text-black hover:underline">
                {t("signup.terms", "Terms & Conditions")}
              </Link>{" "}
              {t("signup.and", "and")}{" "}
              <Link to="/privacy" className="text-black hover:underline">
                {t("signup.privacyPolicy", "Privacy Policy")}
              </Link>
              .
            </p>
          </div>

          {/* Login Link */}
          <div className="text-center text-sm text-gray-600">
            {t("signup.haveAccount", "Already have an account?")}{" "}
            <Link
              to="/login"
              className="font-semibold text-green-600 hover:text-green-700"
            >
              {t("signup.login", "Login")}
            </Link>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showSuccessModal}
        onRequestClose={() => {}}
        className="fixed left-1/2 top-1/2 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 transform rounded-3xl bg-white p-6 font-urbanist outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-[1000]"
        shouldCloseOnOverlayClick={false}
        shouldCloseOnEsc={false}
      >
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <img alt="bammbuu" src="/svgs/account-created.svg" />
          </div>

          <h2 className="mb-2 text-2xl font-semibold text-gray-900">
            {t("signup.successModal.title", "Account Created Successfully!")}
          </h2>

          <p className="mb-6 text-gray-600">
            {t(
              "signup.successModal.description",
              "Great! All set. You can book your first class and start learning.",
            )}
          </p>

          <div className="flex flex-row items-center space-x-3">
            <button
              onClick={handleSkip}
              className="w-full rounded-full border border-[#042F0C] py-2 font-medium text-[#042F0C]"
            >
              {t("signup.successModal.skipButton", "Skip Now")}
            </button>

            <button
              onClick={handleOnboarding}
              className="w-full rounded-full border border-[#042F0C] bg-[#14B82C] px-2 py-2 font-medium text-[#042F0C]"
            >
              {t(
                "signup.successModal.startLearningButton",
                "Start Learning with bammbuu",
              )}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Signup;
