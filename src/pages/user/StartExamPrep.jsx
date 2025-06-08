import { useState } from "react";
import Modal from "react-modal";
import ExploreInstructors from "./ExploreInstructors";

const StartExamPrep = ({
  showExamPrepModal,
  setShowExamPrepModal,
  onFindTutor,
  currentApiStep = 0,
}) => {
  // List of steps for the onboarding
  const steps = [
    "Sign up.",
    "Find a tutor that fits your needs.",
    "Schedule an introductory call to assess your language level and goals.",
    "Personalized learning plan created to help you achieve your goals.",
    "Begin 1:1 live classes with your tutor.",
    "Practice what you're learning through live instructor-led group conversation classes with native speakers.",
    "You're well on your way to fluency and achieving your goals!",
  ];
  return (
    <Modal
      isOpen={showExamPrepModal}
      onRequestClose={() => setShowExamPrepModal(false)}
      className="absolute left-1/2 top-1/2 w-full max-w-[784px] -translate-x-1/2 -translate-y-1/2 transform rounded-[2.5rem] bg-white p-0 font-urbanist shadow-xl outline-none"
      overlayClassName="fixed inset-0 bg-black bg-opacity-20 z-50 flex items-center justify-center backdrop-blur-sm"
      ariaHideApp={false}
    >
      <div className="flex w-full flex-col items-center px-8 py-4">
        <img src="/svgs/success-icon.svg" alt="Exam Prep" className="mb-7" />
        <h2 className="mb-2 text-center text-[32px] font-bold">
          Start Exam Prep.
        </h2>
        <p className="mb-5 max-w-md text-center text-base font-normal text-[#5D5D5D]">
          Our process is designed to provide a<br /> completely customized
          approach to help you
          <br /> achieve your learning goals.
        </p>
        <ol className="mb-6 w-full max-w-[320px] space-y-3 text-base font-normal text-[#5D5D5D]">
          {steps.map((stepLabel, idx) => (
            <li className="flex items-start gap-2" key={idx}>
              <img
                className="mt-1"
                src={
                  idx < currentApiStep
                    ? "/svgs/tick-circle-filled.svg"
                    : "/svgs/tick-circle.svg"
                }
                alt="Check"
              />
              <span>{stepLabel}</span>
            </li>
          ))}
        </ol>
        <button
          className="mb-4 w-full max-w-md rounded-full bg-[#14B82C] py-3 text-base font-medium text-black transition-colors hover:bg-[#12a528]"
          onClick={() => {
            if (onFindTutor) onFindTutor();
            setShowExamPrepModal(false);
          }}
        >
          Find your tutor
        </button>
        <div className="w-full max-w-md text-center text-base/5 font-normal text-[#5D5D5D]">
          Questions or need assistance?{" "}
          <a
            href="https://calendly.com/bammbuu-languages/info-call-llamada-de-informacion"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 text-base/5 font-semibold text-[#14B82C]"
          >
            Schedule a Call
          </a>
        </div>
      </div>
    </Modal>
  );
};

export default StartExamPrep;
