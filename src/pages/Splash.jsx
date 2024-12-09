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
      navigate("/login");
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    navigate("/login");
  };

  const isLastStep = currentStep === splashContent.length - 1;

  return (
    <div className="bg-[#14b82c] min-h-screen flex flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center w-full max-w-md space-y-8">
        {/* Panda Mascot */}
        <div className="">
          <img
            src="/images/panda-large.png"
            alt="Bammbuu Panda"
            className="w-full h-auto"
          />
        </div>

        {/* Welcome Text */}
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-semibold text-white">Hi, Welcome to</h1>
          <div className="">
            <img
              src="/images/bambuu-large.png"
              alt="Bammbuu Panda"
              className="w-full h-auto"
            />
          </div>
        </div>

        {/* Content */}
        <div className="text-center space-y-4 min-h-[120px]">
          <h2 className="text-3xl font-semibold text-white">
            {splashContent[currentStep].title}
          </h2>
          <p className="px-4 text-lg text-center text-white">
            {splashContent[currentStep].description}
          </p>
        </div>

        {/* Progress Dots */}
        <div className="flex space-x-2">
          {splashContent.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-2 rounded-full ${
                index === currentStep ? "bg-white" : "bg-white/50"
              }`}
            />
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="w-full space-y-6">
          <button
            onClick={handleNext}
            className="w-full py-3 font-semibold text-black bg-[#ffbf00] rounded-full border border-black"
          >
            {isLastStep ? "Get Started" : "Next"}
          </button>
          {!isLastStep && (
            <button
              onClick={handleSkip}
              className="w-full text-sm text-[#146721] hover:cursor-pointer"
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
