import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const splashContent = [
  {
    title: "Join Learning Groups",
    description:
      "In bammbuu join language learning groups to practice through live conversations with native speakers.",
  },
  {
    title: "Certified Instructors",
    description:
      "In bammbuu you can learn a new language from certified language instructors via 1:1 live classes.",
  },
  {
    title: "SuperTutor",
    description:
      "Your personal AI language tutor that is available to help you practice conversation 24/7.",
  },
  {
    title: "Start for Free",
    description:
      "You can start learning languages by joining free conversation classes and language groups today",
  },
];

const SplashScreen = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentStep === splashContent.length - 1) {
      navigate("/signup");
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    navigate("/signup");
  };

  const isLastStep = currentStep === splashContent.length - 1;

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#f0fdf1]">
      <div className="flex w-full max-w-sm flex-col items-center">
        {/* Top Section with Panda and Welcome */}
        <div className="mb-16 flex flex-col items-center">
          <div className="flex flex-col items-center gap-8">
            {/* Panda Mascot */}
            <div className="flex h-56 w-44 items-center justify-center">
              <img
                src="/svgs/panda-splash.svg"
                alt="Bammbuu Panda"
                className="w-full max-w-[177.5px]"
              />
            </div>

            {/* Welcome Text */}
            <div className="text-center">
              <h1 className="font-urbanist text-2xl font-semibold text-black">
                Hi, Welcome to
              </h1>
            </div>

            {/* Logo */}
            <div className="flex w-full justify-center">
              <img
                src="/svgs/logo-splash.svg"
                alt="Bammbuu Logo"
                className="h-10 w-64"
              />
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="mb-24 flex w-full flex-col items-center gap-6">
          {/* Slider Content */}
          <div className="w-full">
            {splashContent.map((content, index) => (
              <div
                key={index}
                className={`outline-none ${index === currentStep ? "block" : "hidden"}`}
              >
                <div className="space-y-4 text-center">
                  <h2 className="font-urbanist text-[32px] font-extrabold text-black">
                    {content.title}
                  </h2>
                  <p className="font-urbanist text-base font-normal leading-relaxed text-black">
                    {content.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Progress Dots */}
          <div className="flex items-center gap-1">
            {splashContent.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? "w-6 bg-[#14B82C]"
                    : "w-2 bg-[#83F292]"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex w-full flex-col items-center gap-4">
          <button
            onClick={handleNext}
            className="flex h-12 w-full items-center justify-center rounded-3xl border border-[#042F0C] bg-[#14B82C] px-4 transition-colors duration-200 hover:bg-[#12A228]"
          >
            <span className="font-urbanist text-base font-medium text-black">
              {isLastStep ? "Get Started" : "Next"}
            </span>
          </button>

          {!isLastStep && (
            <button
              onClick={handleSkip}
              className="w-full text-center font-urbanist text-sm font-normal text-[#042F0C] transition-colors duration-200 hover:text-[#146721]"
            >
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
