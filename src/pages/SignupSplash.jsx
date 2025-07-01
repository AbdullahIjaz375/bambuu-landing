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
        "Make the most out of bammbuu. Learn and practice languages through conversation. Read the following directions to learn how!",
      ),
    },
    {
      title: t("onboarding.screens.2.title", ""),
      description: t(
        "onboarding.screens.2.description",
        "Create or join a language learning group for free! Join live conversation classes to practice with native speakers.",
      ),
    },
    {
      title: t("onboarding.screens.3.title", ""),
      description: t(
        "onboarding.screens.3.description",
        "Join unlimited live group conversation classes hosted by certified language instructors for one monthly price. These classes are more structured and expert feedback is provided to help with your learning.",
      ),
    },
    {
      title: t("onboarding.screens.4.title", ""),
      description: t(
        "onboarding.screens.4.description",
        "Book live 1:1 language classes with certified instructors to bring your language learning to the next level. Practice 24/7 with our AI language SuperTutor.",
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
    <div className="flex min-h-screen items-center justify-center bg-[#dbdbdb] p-4">
      <div className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-md">
        {/* Language Selector */}
        <div className="absolute right-4 top-4">
          <select
            value={currentLanguage}
            onChange={(e) => changeLanguage(e.target.value)}
            className="rounded-full border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
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
          <h2 className="mb-4 text-center text-2xl font-bold">
            {screens[currentStep].title}
          </h2>

          <p className="mb-8 max-w-sm text-center text-black">
            {screens[currentStep].description}
          </p>

          {/* Progress dots */}
          <div className="mb-8 flex justify-center space-x-2">
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
          <div className="flex w-full flex-row items-center space-x-4">
            <button
              onClick={handleSkip}
              className="w-full rounded-full border border-[#042F0C] py-2 text-[#042F0C]"
            >
              {t("onboarding.buttons.skip", "Skip")}
            </button>

            <button
              onClick={handleNext}
              className="w-full rounded-full border border-[#042F0C] bg-[#14B82C] py-2 font-medium text-[#042F0C]"
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
