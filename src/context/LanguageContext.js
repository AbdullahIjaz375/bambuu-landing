import React, { createContext, useContext, useState, useEffect } from "react";
import i18n from "../i18n";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

// Create the language context
const LanguageContext = createContext();

export const LanguageProvider = ({ children, user, setUser }) => {
  const supportedLanguages = ["en", "es"];

  // Helper to get initial language
  const getInitialLanguage = () => {
    if (
      user &&
      user.languagePreference &&
      supportedLanguages.includes(user.languagePreference)
    ) {
      return user.languagePreference;
    }
    const localStorageLang = localStorage.getItem("i18nextLng");
    if (localStorageLang && supportedLanguages.includes(localStorageLang)) {
      return localStorageLang;
    }
    const browserLang = navigator.language.split("-")[0];
    if (supportedLanguages.includes(browserLang)) {
      return browserLang;
    }
    return "en";
  };

  const [currentLanguage, setCurrentLanguage] = useState(getInitialLanguage());

  // Central language change function
  const changeLanguage = async (lang) => {
    if (!supportedLanguages.includes(lang)) return;
    i18n.changeLanguage(lang);
    setCurrentLanguage(lang);
    localStorage.setItem("i18nextLng", lang);
    document.documentElement.lang = lang;

    // Update sessionStorage user
    const sessionUser = sessionStorage.getItem("user");
    if (sessionUser) {
      const parsedUser = JSON.parse(sessionUser);
      parsedUser.languagePreference = lang;
      sessionStorage.setItem("user", JSON.stringify(parsedUser));
      if (setUser) setUser(parsedUser);
    }

    // Update Firestore if logged in
    if (user && user.uid) {
      const collectionName = user.userType === "tutor" ? "tutors" : "students";
      try {
        await updateDoc(doc(db, collectionName, user.uid), {
          languagePreference: lang,
        });
      } catch (e) {
        // Ignore Firestore errors for unauthenticated flows
      }
    }
  };

  // On mount or user change, sync language from best source
  useEffect(() => {
    const lang = getInitialLanguage();
    if (lang !== currentLanguage) {
      changeLanguage(lang);
    } else {
      i18n.changeLanguage(lang);
      document.documentElement.lang = lang;
    }
  }, [user]);

  // Listen to i18n language changes (external)
  useEffect(() => {
    const handleLanguageChanged = (lng) => {
      setCurrentLanguage(lng);
      document.documentElement.lang = lng;
    };
    i18n.on("languageChanged", handleLanguageChanged);
    return () => {
      i18n.off("languageChanged", handleLanguageChanged);
    };
  }, []);

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        changeLanguage,
        supportedLanguages,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
