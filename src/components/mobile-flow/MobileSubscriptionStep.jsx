import React, { useState } from "react";
import MobileModal from "../MobileModal";
import ClipLoader from "react-spinners/ClipLoader";
import MobileModalHeader from "./MobileModalHeader";
import { useAuth } from "../../context/AuthContext";
import { createCheckoutSession } from "../../api/paymentApi";

const MobileSubscriptionStep = ({ onNext, onBack, onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleEnroll = async () => {
    if (!user?.uid || !user?.email) {
      // Show error or prompt login
      return;
    }
    setLoading(true);
    try {
      const data = await createCheckoutSession({
        email: user.email,
        studentId: user.uid,
        context: "mobile",
      });

      if (data.url) {
        window.location.href = data.url;
      } else {
        // Show error
      }
    } catch (err) {
      // Show error
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileModal open={true} onClose={onClose} subscriptionStep={true}>
      <MobileModalHeader onClose={onClose} />
      <div className="px-6 pb-6 text-center">
        <div className="mx-auto mt-2 flex w-full max-w-xl flex-col items-center px-4">
          <div className="w-full max-w-xl overflow-hidden rounded-[32px] border border-[#14B82C] bg-[#E6FDE9] p-0 shadow-lg">
            <div className="rounded-t-[32px] bg-[#FFBF00] px-4 py-2 text-center">
              <span className="text-sm font-semibold text-black">
                Language Exams Package
              </span>
            </div>
            <div className="flex flex-col items-center px-6 py-8">
              <div className="mb-2 text-5xl font-bold text-black">$499</div>
              <div className="mb-2 text-xl font-semibold text-black">
                1 Month of Access
              </div>
              <div className="mb-4 text-center text-base text-black">
                Includes all listed features for intensive preparation.
              </div>
              <div className="mb-4 flex flex-col items-center">
                <span className="text-center text-xs text-black">
                  Package does not automatically renew.
                  <br />
                  We recommend 2 months of this package to achieve best results.
                </span>
              </div>
              <button
                className="mb-2 w-full rounded-full border border-[#042F0C] bg-[#14B82C] py-3 text-lg font-semibold text-black transition-colors hover:bg-green-700"
                onClick={handleEnroll}
                disabled={loading}
              >
                {loading ? <ClipLoader color="#fff" size={20} /> : "Register"}
              </button>
              <button
                className="w-full rounded-full border border-transparent bg-transparent py-2 text-base font-semibold text-[#12551E] hover:bg-green-50"
                onClick={() =>
                  window.open(
                    "https://calendly.com/bammbuu-languages/info-call-llamada-de-informacion",
                    "_blank",
                  )
                }
              >
                Schedule an Informational Call
              </button>
            </div>
          </div>
        </div>
      </div>
    </MobileModal>
  );
};

export default MobileSubscriptionStep;
