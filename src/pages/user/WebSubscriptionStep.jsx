import React, { useState } from "react";
import ClipLoader from "react-spinners/ClipLoader";
import { useAuth } from "../../context/AuthContext";
import { Info } from "lucide-react";
import { createCheckoutSession } from "../../api/paymentApi";

const WebSubscriptionStep = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleEnroll = async () => {
    if (!user?.uid || !user?.email) {
      // TODO: Show error or prompt login
      return;
    }
    setLoading(true);
    try {
      const data = await createCheckoutSession({
        email: user.email,
        studentId: user.uid,
        context: "web", // For web flow
      });

      if (data.url) {
        window.location.href = data.url;
      } else {
        // TODO: Show error
        console.error("Failed to create checkout session");
      }
    } catch (err) {
      // TODO: Show error
      console.error("Error during enrollment:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl space-y-8">
        <div className="w-full max-w-xl overflow-hidden rounded-[32px] border border-[#14B82C] bg-[#E6FDE9] p-0 shadow-lg">
          <div className="rounded-t-[32px] bg-[#FFBF00] px-4 py-3 text-center">
            <span className="text-base font-semibold text-black">
              Language Exams Package
            </span>
          </div>
          <div className="flex flex-col items-center px-6 py-8 sm:p-10">
            <div className="mb-2 text-6xl font-bold text-black">$499</div>
            <div className="mb-2 text-2xl font-semibold text-black">
              1 Month of Access
            </div>
            <div className="mb-6 text-center text-lg text-black">
              Includes all listed features for intensive preparation.
            </div>
            <div className="mb-6 flex flex-col items-center gap-2">
              <Info className="h-5 w-5 text-yellow-500" />
              <span className="text-center text-sm text-black">
                Package does not automatically renew.
                <br />
                We recommend 2 months of this package to achieve best results.
              </span>
            </div>
            <button
              className="mb-3 w-full rounded-full border border-[#042F0C] bg-[#14B82C] py-3 text-lg font-semibold text-black transition-colors hover:bg-green-700 disabled:opacity-50"
              onClick={handleEnroll}
              disabled={loading}
            >
              {loading ? <ClipLoader color="#fff" size={20} /> : "Enroll Today"}
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
  );
};

export default WebSubscriptionStep;
