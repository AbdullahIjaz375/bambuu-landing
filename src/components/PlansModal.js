import React, { useState } from "react";
import Modal from "react-modal";
import { X } from "lucide-react";
import { useAuth } from "../../src/context/AuthContext";

Modal.setAppElement("#root");

const customStyles = {
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    zIndex: 1000,
  },
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    transform: "translate(-50%, -50%)",
    maxWidth: "750px",
    width: "100%",
    padding: "24px",
    borderRadius: "24px",
    backgroundColor: "white",
    border: "none",
  },
};

const PlansModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("subscriptions");

  const handlePurchase = async (plan, userId) => {
    try {
      // Get the base URL without any query parameters
      const baseUrl = plan.stripeLink.split("?")[0];

      // Add metadata to the URL
      const url = new URL(baseUrl);
      url.searchParams.set("client_reference_id", userId);
      url.searchParams.set("prefilled_email", user?.email || "");
      // Add metadata that matches your webhook expectations
      url.searchParams.set("metadata[studentId]", userId);
      url.searchParams.set("metadata[paymentType]", plan.type);

      // Redirect to Stripe with metadata
      window.location.href = url.toString();
    } catch (error) {
      console.error("Error redirecting to checkout:", error);
      // Handle error (show error message to user)
    }
  };
  const SubscriptionPlan = ({ plan, userId }) => {
    const [isLoading, setIsLoading] = useState(false);
    const features = [
      {
        title: "SuperTutor",
        description: "Gemini based AI tutor",
      },
      {
        title: "Language Experts",
        description: "You'll have direct access to our language experts",
      },
      {
        title: "Saved Resources",
        description: "You can save resources in the app",
      },
      {
        title: plan.title.includes("Group")
          ? "bammbuu+ Group Classes"
          : "11 Classes",
        description: plan.title.includes("Group")
          ? "You can book bammbuu+ group classes"
          : "You can book 11 classes with language experts",
      },
    ];

    const handleClick = async () => {
      setIsLoading(true);
      try {
        await handlePurchase(plan, userId);
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="flex flex-col h-full border-[#B0B0B0] bg-white border rounded-3xl">
        {plan.isPopular && (
          <div className="px-4 py-1.5 text-sm font-semibold bg-[#FFBF00] rounded-t-3xl text-center">
            Most Popular
          </div>
        )}
        <div className="flex flex-col flex-grow p-6 space-y-6 text-center">
          <div className="space-y-4">
            <div className="text-5xl font-semibold">
              ${plan.price}
              <span className="text-base font-normal text-black">
                /{plan.period}
              </span>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-medium">{plan.title}</h3>
              <p className="text-sm text-black">{plan.description}</p>
            </div>
          </div>

          <div className="flex-grow space-y-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center justify-center gap-3 text-center"
              >
                <div className="flex flex-col items-center justify-center">
                  <img
                    alt="crown"
                    src="/svgs/crown-new.svg"
                    className="w-5 h-5"
                  />
                  <div>
                    <div className="font-medium">{feature.title}</div>
                    <div className="text-sm text-black">
                      {feature.description}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleClick}
            disabled={isLoading}
            className="w-full py-3 text-[#042F0C] transition-colors bg-[#14B82C] rounded-full border border-[#042F0C] disabled:opacity-50"
          >
            {isLoading ? "Loading..." : "Subscribe Now"}
          </button>
        </div>
      </div>
    );
  };

  const CreditPlan = ({ plan, userId }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = async () => {
      setIsLoading(true);
      try {
        await handlePurchase(plan, userId);
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="flex flex-col h-full bg-white border border-[#B0B0B0] rounded-3xl">
        {plan.isPopular && (
          <div className="px-4 py-1.5 text-sm font-semibold bg-[#FFBF00] rounded-t-3xl text-center">
            Most Popular
          </div>
        )}
        <div className="flex flex-col flex-grow p-6 space-y-6 text-center">
          <div className="space-y-4">
            <div className="text-5xl font-bold">${plan.price}</div>
            <h3 className="text-lg font-medium">{plan.title}</h3>
          </div>

          <div className="flex-grow" />

          <button
            onClick={handleClick}
            disabled={isLoading}
            className="w-full py-3 text-[#042F0C] transition-colors bg-[#14B82C] rounded-full border border-[#042F0C] disabled:opacity-50"
          >
            {isLoading ? "Loading..." : "Buy Now"}
          </button>
        </div>
      </div>
    );
  };

  const subscriptionPlans = [
    {
      title: "bammbuu+ Instructor-Led Group Classes",
      description: "Unlimited instructor-led group conversation classes",
      price: 49.99,
      period: "month",
      isPopular: true,
      type: "monthly_subscription",
      stripeLink: "https://buy.stripe.com/test_14keVY9UVgHjapq4gi",
    },
    {
      title: "Unlimited Class Credits",
      description: "11 private instructor classes",
      price: 149.99,
      period: "month",
      isPopular: false,
      type: "yearly_subscription",
      stripeLink: "https://buy.stripe.com/test_7sIaFIaYZ2QteFGaEH",
    },
  ];

  const creditPlans = [
    {
      title: "3 Class Credits",
      description: "bammbuu+ classes only",
      price: 59.99,
      isPopular: false,
      type: "3_credits",
      stripeLink: "https://buy.stripe.com/test_28o1581op4YB556000",
    },
    {
      title: "5 Class Credits",
      description: "bammbuu+ classes only",
      price: 99.99,
      isPopular: true,
      type: "5_credits",
      stripeLink: "https://buy.stripe.com/test_9AQdRU0kl2Qt9lmeUV",
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={customStyles}
      contentLabel="Membership Modal"
    >
      <div className="relative font-urbanist">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-medium">Membership</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex justify-center mb-6">
          <div className="inline-flex bg-gray-100 border border-gray-300 rounded-full">
            <button
              className={`px-6 py-2 rounded-full text-[#042F0C] text-md font-medium transition-colors
                ${
                  activeTab === "subscriptions"
                    ? "bg-[#FFBF00] border border-[#042F0C]"
                    : "bg-transparent"
                }`}
              onClick={() => setActiveTab("subscriptions")}
            >
              Subscriptions
            </button>
            <button
              className={`px-6 py-2 rounded-full text-[#042F0C] text-md font-medium transition-colors
                ${
                  activeTab === "credits"
                    ? "bg-[#FFBF00] border border-[#042F0C]"
                    : "bg-transparent"
                }`}
              onClick={() => setActiveTab("credits")}
            >
              Class Credits
            </button>
          </div>
        </div>

        {activeTab === "subscriptions" && (
          <div className="grid grid-cols-2 gap-4">
            {subscriptionPlans.map((plan, index) => (
              <SubscriptionPlan key={index} plan={plan} userId={user?.uid} />
            ))}
          </div>
        )}

        {activeTab === "credits" && (
          <>
            <div className="grid grid-cols-2 gap-4">
              {creditPlans.map((plan, index) => (
                <CreditPlan key={index} plan={plan} userId={user?.uid} />
              ))}
            </div>

            <div className="flex items-center gap-2 mt-4 text-sm text-red-500">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12" y2="16" />
              </svg>
              With class credits you can only book bammbuu+ classes other
              premium perks are not included.
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default PlansModal;
