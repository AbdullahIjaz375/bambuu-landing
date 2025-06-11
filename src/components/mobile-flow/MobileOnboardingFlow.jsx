import React, { useState } from "react";
import MobileProfileStep from "./MobileProfileStep";
import MobileSubscriptionStep from "./MobileSubscriptionStep";
import MobileConfirmationStep from "./MobileConfirmationStep";

const MobileOnboardingFlow = ({ onClose }) => {
  const [step, setStep] = useState(0);

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);

  return (
    <>
      {step === 0 && (
        <MobileProfileStep onNext={handleNext} onClose={onClose} />
      )}
      {step === 1 && (
        <MobileSubscriptionStep
          onNext={handleNext}
          onBack={handleBack}
          onClose={onClose}
          defaultTab="exam"
        />
      )}
      {step === 2 && <MobileConfirmationStep onClose={onClose} />}
    </>
  );
};

export default MobileOnboardingFlow;
