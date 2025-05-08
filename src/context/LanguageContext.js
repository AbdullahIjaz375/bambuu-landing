import React, { createContext, useContext, useState, useEffect } from "react";
import i18n from "../i18n";

// Create the language context
const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  // Initialize state from localStorage or default to 'en'
  const [currentLanguage, setCurrentLanguage] = useState(
    localStorage.getItem("i18nextLng") || "en"
  );

  // Function to change language throughout the app
  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    setCurrentLanguage(lang);
    localStorage.setItem("i18nextLng", lang);
  };

  // Sync state with i18n on language change
  useEffect(() => {
    const handleLanguageChanged = (lng) => {
      setCurrentLanguage(lng);
    };

    i18n.on("languageChanged", handleLanguageChanged);

    return () => {
      i18n.off("languageChanged", handleLanguageChanged);
    };
  }, []);

  // Initialize on first load
  useEffect(() => {
    const savedLanguage = localStorage.getItem("i18nextLng");
    if (savedLanguage && savedLanguage !== currentLanguage) {
      changeLanguage(savedLanguage);
    }
  }, [currentLanguage]);

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        changeLanguage,
        supportedLanguages: ["en", "es"],
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
