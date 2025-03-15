import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useAuth } from "../../src/context/AuthContext";
import { useTranslation } from "react-i18next";
import { db } from "../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { ClipLoader } from "react-spinners";

const Subscriptions = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("subscriptions");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [creditPlans, setCreditPlans] = useState([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [error, setError] = useState(null);

  // Fetch plans from Firebase
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setIsLoadingPlans(true);
        setError(null);

        // Fetch subscription offers
        const subscriptionSnapshot = await getDocs(
          collection(db, "subscription_offer")
        );
        const subscriptionData =
          subscriptionSnapshot.docs[0]?.data()?.subscription_offer_list || [];

        // Transform subscription data
        const transformedSubscriptionPlans = subscriptionData.map((plan) => ({
          id: plan.offerId,
          title: plan.title,
          description: plan.subtitle,
          price: plan.price,
          period: t("plans-modal.pricing.month"),
          isPopular: plan.isPopular,
          type: "subscription",
          stripeLink: plan.stripeUrl,
        }));

        // Fetch credit offers
        const creditSnapshot = await getDocs(collection(db, "credit_offer"));
        const creditData =
          creditSnapshot.docs[0]?.data()?.credit_offer_list || [];

        // Transform credit data
        const transformedCreditPlans = creditData.map((plan) => ({
          id: plan.offerId,
          title:
            plan.numberOfCredits === 3
              ? t("plans-modal.credit-plans.three.title")
              : t("plans-modal.credit-plans.five.title"),
          description:
            plan.numberOfCredits === 3
              ? t("plans-modal.credit-plans.three.description")
              : t("plans-modal.credit-plans.five.description"),
          price: plan.price,
          isPopular: plan.isPopular,
          type: `${plan.numberOfCredits}_credits`,
          stripeLink: plan.stripeUrl,
        }));

        setSubscriptionPlans(transformedSubscriptionPlans);
        setCreditPlans(transformedCreditPlans);
      } catch (err) {
        console.error("Error fetching plans:", err);
        setError("Failed to load plans. Please try again later.");
      } finally {
        setIsLoadingPlans(false);
      }
    };

    fetchPlans();
  }, [t]);

  // Check URL params for plan selection
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const offerId = params.get("offerId");

    if (offerId && !isLoadingPlans) {
      // Check in subscription plans
      const subscriptionPlan = subscriptionPlans.find((p) => p.id === offerId);
      if (subscriptionPlan) {
        setSelectedPlan(subscriptionPlan);
        setActiveTab("subscriptions");
        return;
      }

      // Check in credit plans
      const creditPlan = creditPlans.find((p) => p.id === offerId);
      if (creditPlan) {
        setSelectedPlan(creditPlan);
        setActiveTab("credits");
        return;
      }
    }
  }, [subscriptionPlans, creditPlans, isLoadingPlans]);

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

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedPlan(null);
  };

  const SubscriptionPlan = ({ plan, userId, isSelected, onSelect }) => {
    const features = [
      {
        title: t("plans-modal.features.experts.title"),
        description: t("plans-modal.features.experts.description"),
      },
      {
        title: plan.title.includes("Group")
          ? t("plans-modal.features.classes.group.title")
          : t("plans-modal.features.classes.private.title"),
        description: plan.title.includes("Group")
          ? t("plans-modal.features.classes.group.description")
          : t("plans-modal.features.classes.private.description"),
      },
      {
        title: t("plans-modal.features.resources.title"),
        description: t("plans-modal.features.resources.description"),
      },
      {
        title: t("plans-modal.features.supertutor.title"),
        description: t("plans-modal.features.supertutor.description"),
      },
    ];

    return (
      <div
        onClick={() => onSelect(plan)}
        className={`flex flex-col h-full border-2 rounded-3xl cursor-pointer transition-all duration-200 ${
          isSelected
            ? "border-[#14B82C] shadow-lg transform scale-[1.02] bg-[#E6FDE9]"
            : "border-[#B0B0B0] hover:border-[#14B82C] hover:shadow-md bg-white"
        }`}
      >
        {plan.isPopular && (
          <div className="px-4 py-1 text-sm font-semibold bg-[#FFBF00] rounded-t-3xl text-center">
            {t("plans-modal.popular-badge")}
          </div>
        )}
        <div className="flex flex-col flex-grow p-5 space-y-4 text-center">
          <div className="space-y-4">
            <div className="text-4xl font-semibold">
              ${plan.price}
              <span className="text-base font-normal text-black">
                /{plan.period}
              </span>
            </div>
            <div>
              <h3 className="mb-2 font-medium text-md">{plan.title}</h3>
              <p className="text-sm text-black">{plan.description}</p>
            </div>
          </div>

          <div className="flex-grow space-y-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center justify-center gap-3 text-center"
              >
                <div className="flex flex-col items-center justify-center">
                  <img
                    alt="crown"
                    src="/svgs/crown-new.svg"
                    className="w-4 h-4"
                  />
                  <div>
                    <div className="font-sm">{feature.title}</div>
                    <div className="text-xs text-black">
                      {feature.description}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const CreditPlan = ({ plan, userId, isSelected, onSelect }) => {
    return (
      <div
        onClick={() => onSelect(plan)}
        className={`flex flex-col h-full rounded-3xl cursor-pointer transition-all duration-200 ${
          isSelected
            ? "border-2 border-[#14B82C] shadow-lg transform scale-[1.02] bg-[#E6FDE9]"
            : "border border-[#B0B0B0] hover:border-[#14B82C] hover:shadow-md bg-white"
        }`}
      >
        {plan.isPopular && (
          <div className="px-4 py-1.5 text-sm font-semibold bg-[#FFBF00] rounded-t-3xl text-center">
            {t("plans-modal.popular-badge")}
          </div>
        )}
        <div className="flex flex-col flex-grow p-6 space-y-6 text-center">
          <div className="space-y-4">
            <div className="text-4xl font-bold">${plan.price}</div>
            <h3 className="text-lg font-medium">{plan.title}</h3>
          </div>

          <div className="flex-grow" />
        </div>
      </div>
    );
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(selectedPlan?.id === plan.id ? null : plan);
  };

  const handleSubscribe = async () => {
    if (!selectedPlan) return;
    setIsLoading(true);
    try {
      await handlePurchase(selectedPlan, user?.uid);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingPlans) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ClipLoader color="#14B82C" size={50} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-[#042F0C] bg-[#14B82C] rounded-full"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-medium">{t("plans-modal.title")}</h2>
          {/* Optional: Back button */}
          <button
            onClick={() => window.history.back()}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex justify-center mb-4">
          <div className="inline-flex bg-gray-100 border border-gray-300 rounded-full">
            <button
              className={`px-6 py-1 rounded-full text-[#042F0C] text-sm font-medium transition-colors ${
                activeTab === "subscriptions"
                  ? "bg-[#FFBF00] border border-[#042F0C]"
                  : "bg-transparent"
              }`}
              onClick={() => handleTabChange("subscriptions")}
            >
              {t("plans-modal.tabs.subscriptions")}
            </button>
            <button
              className={`px-6 py-2 rounded-full text-[#042F0C] text-md font-medium transition-colors ${
                activeTab === "credits"
                  ? "bg-[#FFBF00] border border-[#042F0C]"
                  : "bg-transparent"
              }`}
              onClick={() => handleTabChange("credits")}
            >
              {t("plans-modal.tabs.credits")}
            </button>
          </div>
        </div>

        {activeTab === "subscriptions" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subscriptionPlans.map((plan, index) => (
              <SubscriptionPlan
                key={index}
                plan={plan}
                userId={user?.uid}
                isSelected={selectedPlan?.id === plan.id}
                onSelect={handlePlanSelect}
              />
            ))}
          </div>
        )}

        {activeTab === "credits" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {creditPlans.map((plan, index) => (
                <CreditPlan
                  key={index}
                  plan={plan}
                  userId={user?.uid}
                  isSelected={selectedPlan?.id === plan.id}
                  onSelect={handlePlanSelect}
                />
              ))}
            </div>

            <div className="flex items-center gap-2 mt-2 text-sm text-red-500">
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
              {t("plans-modal.credits-warning")}
            </div>
          </>
        )}

        {selectedPlan && (
          <div className="mt-8">
            <button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="w-full max-w-md mx-auto block py-3 text-[#042F0C] transition-colors bg-[#14B82C] rounded-full border border-[#042F0C] disabled:opacity-50 hover:bg-[#12a528]"
            >
              {isLoading
                ? t("plans-modal.buttons.loading")
                : `${t("plans-modal.buttons.subscribe")} - $${
                    selectedPlan.price
                  }`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Subscriptions;
