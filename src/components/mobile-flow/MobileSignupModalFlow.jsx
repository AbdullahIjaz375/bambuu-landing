import { useState, useEffect } from "react";
import MobileConfirmationStep from "./MobileConfirmationStep";
import MobileSubscriptionStep from "./MobileSubscriptionStep";
import Signup from "../../pages/Signup";

const MobileSignupModalFlow = ({ onClose }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    sessionStorage.setItem("signupInModal", "true");
    return () => {
      sessionStorage.removeItem("signupInModal");
    };
  }, []);

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);
  const handleClose = () => {
    sessionStorage.removeItem("signupInModal");
    onClose && onClose();
  };

  return (
    <>
      {step === 0 && (
        <Signup onNext={handleNext} onClose={handleClose} isModal={true} />
      )}
      {step === 1 && (
        <MobileSubscriptionStep
          onNext={handleNext}
          onBack={handleBack}
          onClose={handleClose}
          isModal={true}
        />
      )}
      {step === 2 && <MobileConfirmationStep onClose={handleClose} />}
    </>
  );
};

export default MobileSignupModalFlow;
