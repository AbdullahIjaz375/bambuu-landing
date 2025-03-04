import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Slider from "react-slick";

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
      sliderRef.current.slickNext();
    }
  };

  const handleSkip = () => {
    navigate("/signup");
  };

  const settings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    swipe: true,
    beforeChange: (oldIndex, newIndex) => setCurrentStep(newIndex),
    arrows: false,
  };

  const sliderRef = React.useRef();
  const isLastStep = currentStep === splashContent.length - 1;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-[#f0fdf1]">
      <div className="flex flex-col items-center w-full max-w-md space-y-8">
        {/* Panda Mascot */}
        <div className="">
          <img
            src="/svgs/panda-splash.svg"
            alt="Bammbuu Panda"
            className="w-full h-auto"
          />
        </div>

        {/* Welcome Text */}
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-semibold text-black">Hi, Welcome to</h1>
          <div className="">
            <img
              src="/svgs/logo-splash.svg"
              alt="Bammbuu Panda"
              className="w-full h-auto"
            />
          </div>
        </div>

        {/* Slider Content */}
        <div className="w-full">
          <Slider ref={sliderRef} {...settings}>
            {splashContent.map((content, index) => (
              <div key={index} className="outline-none">
                <div className="text-center space-y-4 min-h-[120px]">
                  <h2 className="text-3xl font-semibold text-black">
                    {content.title}
                  </h2>
                  <p className="px-4 text-lg text-center text-black">
                    {content.description}
                  </p>
                </div>
              </div>
            ))}
          </Slider>
        </div>

        {/* Progress Dots */}
        <div className="flex space-x-2">
          {splashContent.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-2 rounded-full ${
                index === currentStep ? "bg-[#14B82C]" : "bg-[#83F292]"
              }`}
            />
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="w-full space-y-6">
          <button
            onClick={handleNext}
            className="w-full py-3 font-semibold text-black bg-[#14B82C] rounded-full border border-black"
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
