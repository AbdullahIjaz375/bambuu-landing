import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../context/LanguageContext";

const SignupSplash = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { currentLanguage, changeLanguage } = useLanguage();

  // Ensure language is consistently applied when component mounts
  useEffect(() => {
    const savedLanguage = localStorage.getItem("i18nextLng");
    if (savedLanguage) {
      // Force language application on component mount
      changeLanguage(savedLanguage);
      // Add small delay to ensure language is applied
      setTimeout(() => {
        if (i18n.language !== savedLanguage) {
          i18n.changeLanguage(savedLanguage);
        }
      }, 50);
    }
  }, [changeLanguage, i18n]);

  // Handle language change with stronger persistence
  const handleLanguageChange = (lang) => {
    changeLanguage(lang);
    // Ensure immediate language switching
    i18n.changeLanguage(lang);
    // Double ensure persistence
    localStorage.setItem("i18nextLng", lang);
    document.documentElement.lang = lang;
  };

  // Setup screens with translation keys
  const screens = [
    {
      title: t("onboarding.screens.1.title", "Let's get Started!"),
      description: t(
        "onboarding.screens.1.description",
        "Make the most out of bammbuu. Learn and practice languages through conversation. Read the following directions to learn how!"
      ),
    },
    {
      title: t("onboarding.screens.2.title", ""),
      description: t(
        "onboarding.screens.2.description",
        "Create or join a language learning group for free! Join live conversation classes to practice with native speakers."
      ),
    },
    {
      title: t("onboarding.screens.3.title", ""),
      description: t(
        "onboarding.screens.3.description",
        "Join unlimited live group conversation classes hosted by certified language instructors for one monthly price. These classes are more structured and expert feedback is provided to help with your learning."
      ),
    },
    {
      title: t("onboarding.screens.4.title", ""),
      description: t(
        "onboarding.screens.4.description",
        "Book live 1:1 language classes with certified instructors to bring your language learning to the next level. Practice 24/7 with our AI language SuperTutor."
      ),
    },
  ];

  const handleSkip = () => {
    // Pass the language preference in the state object when navigating
    navigate("/profile-setup", {
      replace: true,
      state: { language: currentLanguage },
    });
  };

  const handleNext = () => {
    if (currentStep < screens.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Navigate to profile setup page on the last step with language preference
      navigate("/profile-setup", {
        replace: true,
        state: { language: currentLanguage },
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-[#dbdbdb]">
      <div className="flex flex-col overflow-hidden bg-white shadow-md rounded-3xl">
        {/* Language Selector */}
        <div className="absolute top-4 right-4">
          <select
            value={currentLanguage}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="px-2 py-1 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
          </select>
        </div>

        {/* Top half - static image */}
        <div>
          <img src="/svgs/onboarding.svg" alt="App interface" />
        </div>

        {/* Bottom half - interactive content */}
        <div className="flex flex-col items-center p-8">
          <h2 className="mb-4 text-2xl font-bold text-center">
            {screens[currentStep].title}
          </h2>

          <p className="max-w-sm mb-8 text-center text-black">
            {screens[currentStep].description}
          </p>

          {/* Progress dots */}
          <div className="flex justify-center mb-8 space-x-2">
            {screens.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full ${
                  index === currentStep ? "bg-green-500" : "bg-green-200"
                }`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex flex-row items-center w-full space-x-4">
            <button
              onClick={handleSkip}
              className="w-full py-2 border-[#042F0C] border text-[#042F0C] rounded-full"
            >
              {t("onboarding.buttons.skip", "Skip")}
            </button>

            <button
              onClick={handleNext}
              className="w-full py-2 font-medium text-[#042F0C] bg-[#14B82C] border-[#042F0C] border rounded-full"
            >
              {currentStep === screens.length - 1
                ? t("onboarding.buttons.getStarted", "Get Started")
                : t("onboarding.buttons.next", "Next")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupSplash;
