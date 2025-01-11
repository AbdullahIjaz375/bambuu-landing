import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const SingupSplash = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const screens = [
    {
      title: "Let's get Started!",
      description:
        "Make the most out of bammbuu. Learn and practice languages through conversation. Read the following directions to learn how!",
    },
    {
      title: "",
      description:
        "Create or join a language learning group for free! Join live conversation classes to practice with native speakers.",
    },
    {
      title: "",
      description:
        "Join unlimited live group conversation classes hosted by certified language instructors for one monthly price. These classes are more structured and expert feedback is provided to help with your learning.",
    },
    {
      title: "",
      description:
        "Book live 1:1 language classes with certified instructors to bring your language learning to the next level.  Practice 24/7 with our AI language SuperTutor.",
    },
  ];

  const handleSkip = () => {
    navigate("/learn", { replace: true });
  };

  const handleNext = () => {
    if (currentStep < screens.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Navigate to learn page on the last step
      navigate("/learn", { replace: true });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-[#dbdbdb]">
      <div className="flex flex-col overflow-hidden bg-white shadow-md rounded-3xl">
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
              Skip
            </button>

            <button
              onClick={handleNext}
              className="w-full py-2 font-medium text-[#042F0C] bg-[#14B82C] border-[#042F0C] border rounded-full"
            >
              {currentStep === screens.length - 1 ? "Get Started" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingupSplash;
