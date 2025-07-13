import React, { useState } from "react";
import MobileModal from "../MobileModal";
import { useLanguage } from "../../context/LanguageContext";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
import { COUNTRIES } from "../../config/contries";
import { LANGUAGES } from "../../config/languages";
import { TEACHINGLANGUAGES } from "../../config/teachingLanguages";
import { toast } from "react-toastify";
import ClipLoader from "react-spinners/ClipLoader";
import { auth, db } from "../../firebaseConfig";
import { setDoc, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { getToken } from "firebase/messaging";
import { messaging } from "../../firebaseConfig";
import MobileModalHeader from "./MobileModalHeader";

const MobileProfileStep = ({ onNext, onBack, onClose }) => {
  const { currentLanguage, changeLanguage } = useLanguage();
  const { t } = useTranslation();
  const { updateUserData } = useAuth();
  const [profileData, setProfileData] = useState({
    name: "",
    nativeLanguage: "",
    learningLanguage: "",
    proficiency: "Beginner",
    country: "",
    ageVerified: false,
  });
  const [loading, setLoading] = useState(false);

  const handleLanguageChange = (lang) => {
    changeLanguage(lang);
    i18n.changeLanguage(lang);
    localStorage.setItem("i18nextLng", lang);
    document.documentElement.lang = lang;
  };

  const getFCMToken = async () => {
    try {
      const currentToken = await getToken(messaging, {
        vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY,
      });
      return currentToken || null;
    } catch (error) {
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!profileData.ageVerified) {
      toast.error(
        t(
          "signup.profile.ageWarning",
          "You must be at least 18 years old to use this application.",
        ),
      );
      return;
    }
    if (
      !profileData.name ||
      !profileData.nativeLanguage ||
      !profileData.learningLanguage ||
      !profileData.country
    ) {
      toast.error(
        t("signup.profile.incomplete", "Please fill all required fields."),
      );
      return;
    }
    setLoading(true);
    try {
      if (!auth.currentUser || !auth.currentUser.emailVerified) {
        throw new Error("Please verify your email first");
      }
      const fcmToken = await getFCMToken();
      let appLanguageCode =
        currentLanguage || localStorage.getItem("i18nextLng") || "en";
      if (profileData.nativeLanguage === "Spanish") {
        appLanguageCode = "es";
        changeLanguage("es");
        i18n.changeLanguage("es");
        localStorage.setItem("i18nextLng", "es");
        document.documentElement.lang = "es";
      }
      const userData = {
        adminOfClasses: [],
        adminOfGroups: [],
        country: profileData.country,
        currentStreak: 1,
        email: auth.currentUser.email,
        enrolledClasses: [],
        joinedGroups: [],
        lastLoggedIn: new Date(),
        learningLanguage: profileData.learningLanguage,
        learningLanguageProficiency: profileData.proficiency,
        name: profileData.name,
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
      toast.success(
        t("signup.profile.success", "Profile created successfully!"),
      );
      setLoading(false);
      onNext();
    } catch (error) {
      setLoading(false);
      toast.error(
        t("signup.profile.failed", "Profile creation failed: ") + error.message,
      );
    }
  };

  return (
    <MobileModal open={true} onClose={onClose}>
      <MobileModalHeader onClose={onClose} />
      <div className="px-6 pb-6 text-center">
        <form
          className="flex w-full flex-col items-center"
          onSubmit={handleSubmit}
        >
          <div className="mb-2 flex w-full justify-end">
            <select
              value={currentLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="rounded-full border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </div>
          <div className="mx-auto mt-2 flex w-full max-w-xs flex-col items-center px-4">
            <div className="mb-4 flex justify-center">
              <img alt="profile" src="/svgs/signup.svg" className="h-24" />
            </div>

            <h2 className="mb-1 text-2xl font-bold">
              {t("signup.profile.title", "Complete Profile")}
            </h2>
            <p className="mb-4 text-center text-sm text-gray-600">
              {t(
                "signup.profile.subtitle",
                "Add your personal details to gets started.",
              )}
            </p>

            <div className="w-full space-y-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium">
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
                    checked={profileData.ageVerified}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        ageVerified: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    required
                  />
                  <label
                    htmlFor="ageVerification"
                    className="ml-2 text-sm font-medium text-gray-700"
                  >
                    {t(
                      "signup.profile.ageVerification",
                      "I confirm that I am at least 18 years old",
                    )}
                  </label>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="mt-8 w-full rounded-full border border-black bg-[#14B82C] py-3 text-black hover:bg-[#119523] focus:outline-none focus:ring-2 focus:ring-[#119523] focus:ring-offset-2"
              disabled={loading}
            >
              {loading ? (
                <ClipLoader color="#fff" size={20} />
              ) : (
                t("signup.profile.submit", "Submit")
              )}
            </button>
          </div>
        </form>
      </div>
    </MobileModal>
  );
};

export default MobileProfileStep;
