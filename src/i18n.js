// src/i18n.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enTranslations from "./locales/en/translation.json";
import esTranslations from "./locales/es/translation.json";

// Get the language from localStorage or default to English
const savedLanguage = localStorage.getItem("i18nextLng");
const userLanguage = savedLanguage || navigator.language.split("-")[0];
const supportedLanguages = ["en", "es"];
const initialLanguage = supportedLanguages.includes(userLanguage)
  ? userLanguage
  : "en";

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: enTranslations,
    },
    es: {
      translation: esTranslations,
    },
  },
  lng: initialLanguage, // Use detected language or default to 'en'
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

// Save selected language to localStorage whenever it changes
i18n.on("languageChanged", (lng) => {
  localStorage.setItem("i18nextLng", lng);
});

export default i18n;
