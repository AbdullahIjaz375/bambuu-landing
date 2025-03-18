import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useAuth } from "../../src/context/AuthContext";
import { useTranslation } from "react-i18next";
import { db } from "../firebaseConfig";
import { toast } from "react-toastify";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { ClipLoader } from "react-spinners";
import Modal from "react-modal";

Modal.setAppElement("#root"); // Ensure this matches your app's root element

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
  const [offerPlans, setOfferPlans] = useState([]);
  const [showOffers, setShowOffers] = useState(false);
  const [showFreeTrialModal, setShowFreeTrialModal] = useState(false);
  const [freeTrialActivated, setFreeTrialActivated] = useState(false);
  const [hasActiveFreeTrial, setHasActiveFreeTrial] = useState(false);

  // Add this function to check if user is within 7 days of registration
  const checkNewUserEligibility = async (userId) => {
    try {
      const userDoc = await getDocs(
        query(collection(db, "user_accounts"), where("email", "==", user.email))
      );

      if (!userDoc.empty) {
        const userData = userDoc.docs[0].data();
        const createdAt = userData.created_at?.toDate() || new Date();
        const daysSinceCreation =
          (new Date() - createdAt) / (1000 * 60 * 60 * 24);
        return daysSinceCreation <= 7;
      }
      return false;
    } catch (error) {
      console.error("Error checking user eligibility:", error);
      return false;
    }
  };

  // Fetch plans and check user's subscription status
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setIsLoadingPlans(true);
        setError(null);
        
        // Check if user already has free access
        if (user?.uid) {
          const userRef = doc(db, "students", user.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            // Check if user already has free access enabled
            setHasActiveFreeTrial(userData.freeAccess === true);
          }
        }

        // Check if user is eligible for offers
        const isEligible = await checkNewUserEligibility(user?.uid);
        setShowOffers(isEligible);

        // Fetch offers if eligible
        if (isEligible) {
          const offersSnapshot = await getDocs(collection(db, "offer"));
          const offersData = offersSnapshot.docs[0]?.data()?.offerList || [];

          const transformedOfferPlans = offersData.map((plan) => ({
            id: plan.offerId,
            title: plan.title,
            description: plan.subtitle || "",
            price: plan.price,
            isPopular: plan.isPopular,
            type: plan.type,
            stripeLink: plan.url,
            body: plan.body,
          }));

          setOfferPlans(transformedOfferPlans);
        }

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
  }, [t, user]);

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

  // Activate free trial
  const activateFreeTrial = async () => {
    setIsLoading(true);
    try {
      // Update the user's document to set freeAccess to true
      const userRef = doc(db, "students", user.uid);
      await updateDoc(userRef, {
        freeAccess: true,
        subscriptions: [
          {
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            startDate: new Date(),
            type: "Free Trial",
          },
        ],
      });
      
      setFreeTrialActivated(true);
    } catch (error) {
      console.error("Error activating free trial:", error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleSubscribe = async () => {
    if (!selectedPlan) return;
    
    // Check if this is a free plan
    if (selectedPlan.price === 0 || selectedPlan.title.toLowerCase().includes('free')) {
      // Check if user already has active free trial
      if (hasActiveFreeTrial) {
        toast.warning("You already have an active free subscription");
        return;
      }
      setShowFreeTrialModal(true);
      return;
    }
    
    setIsLoading(true);
    try {
      await handlePurchase(selectedPlan, user?.uid);
    } finally {
      setIsLoading(false);
    }
  };

  const SubscriptionPlan = ({ plan, userId, isSelected, onSelect }) => {
    const isFree = plan.price === 0 || plan.title.toLowerCase().includes('free');
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
        } ${isFree && hasActiveFreeTrial ? "relative" : ""}`}
      >
        {isFree && hasActiveFreeTrial && (
          <div className="absolute inset-0 bg-gray-200 bg-opacity-50 rounded-3xl flex items-center justify-center">
            <div className="px-4 py-2 bg-orange-100 border border-orange-400 rounded-lg text-orange-800 font-medium">
              Already Activated
            </div>
          </div>
        )}
        {plan.isPopular && (
          <div className="px-4 py-1 text-sm font-semibold bg-[#FFBF00] rounded-t-3xl text-center">
            {t("plans-modal.popular-badge")}
          </div>
        )}
        <div className="flex flex-col flex-grow p-5 space-y-4 text-center">
          <div className="space-y-4">
            <div className="text-4xl font-semibold">
              {plan.price === 0 ? "FREE" : `$${plan.price}`}
              {plan.price !== 0 && (
                <span className="text-base font-normal text-black">
                  /{plan.period}
                </span>
              )}
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
            <div className="text-4xl font-bold">
              {plan.price === 0 ? "FREE" : `$${plan.price}`}
            </div>
            <h3 className="text-lg font-medium">{plan.title}</h3>
          </div>

          <div className="flex-grow" />
        </div>
      </div>
    );
  };

  const OfferPlan = ({ plan, userId, isSelected, onSelect }) => {
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
            <div className="flex flex-col items-center">
              <div className="text-4xl font-bold">
                {plan.price === 0 ? "FREE" : `$${plan.price}`}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium">{plan.title}</h3>
              {plan.description && (
                <p className="text-sm text-black mt-2">{plan.description}</p>
              )}
            </div>
          </div>
          {plan.body && (
            <p className="text-sm text-black mt-auto">{plan.body}</p>
          )}
        </div>
      </div>
    );
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(selectedPlan?.id === plan.id ? null : plan);
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
            {showOffers && (
              <button
                className={`px-6 py-2 rounded-full text-[#042F0C] text-sm font-medium transition-colors ${
                  activeTab === "offers"
                    ? "bg-[#FFBF00] border border-[#042F0C]"
                    : "bg-transparent"
                }`}
                onClick={() => handleTabChange("offers")}
              >
                {t("plans-modal.tabs.offers")}
              </button>
            )}
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

        {activeTab === "offers" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {offerPlans.map((plan, index) => (
              <OfferPlan
                key={index}
                plan={plan}
                userId={user?.uid}
                isSelected={selectedPlan?.id === plan.id}
                onSelect={handlePlanSelect}
              />
            ))}
          </div>
        )}

        {selectedPlan && (
          <div className="mt-8">
            <button
              onClick={handleSubscribe}
              disabled={isLoading || (hasActiveFreeTrial && selectedPlan.price === 0)}
              className={`w-full max-w-md mx-auto block py-3 text-[#042F0C] transition-colors ${
                hasActiveFreeTrial && selectedPlan.price === 0
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-[#14B82C] hover:bg-[#12a528]"
              } rounded-full border border-[#042F0C] disabled:opacity-50`}
            >
              {isLoading
                ? t("plans-modal.buttons.loading")
                : hasActiveFreeTrial && selectedPlan.price === 0
                ? "Already Activated"
                : selectedPlan.price === 0
                ? t("plans-modal.buttons.activate-free")
                : `${t("plans-modal.buttons.subscribe")} - ${selectedPlan.price}`}
            </button>
            {hasActiveFreeTrial && selectedPlan.price === 0 && (
              <p className="mt-2 text-sm text-center text-orange-500">
                You already have an active free subscription
              </p>
            )}
          </div>
        )}
      </div>

      {/* Free Trial Confirmation Modal */}
      <Modal
        isOpen={showFreeTrialModal}
        onRequestClose={() => !isLoading && setShowFreeTrialModal(false)}
        className="fixed w-full max-w-md p-6 transform -translate-x-1/2 -translate-y-1/2 bg-white outline-none top-1/2 left-1/2 rounded-3xl"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-50"
      >
        <div className="text-center">
          {!freeTrialActivated ? (
            <>
              <div className="flex justify-center mb-4">
                <img alt="Free Trial" src="/svgs/account-created.svg" />
              </div>
              <h2 className="mb-4 text-2xl font-semibold">Activate Free Trial</h2>
              <p className="mb-6 text-gray-600">
                You're about to activate your 7-day free trial subscription. Would you like to continue?
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowFreeTrialModal(false)}
                  disabled={isLoading}
                  className="w-full py-2 text-gray-700 bg-gray-200 rounded-full hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={activateFreeTrial}
                  disabled={isLoading}
                  className="w-full py-2 text-[#042F0C] bg-[#14B82C] rounded-full border border-[#042F0C] disabled:opacity-50"
                >
                  {isLoading ? "Activating..." : "Activate"}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-4">
                <img alt="Success" src="/svgs/account-created.svg" />
              </div>
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                Free Trial Activated!
              </h2>
              <p className="mb-6 text-gray-600">
                Your 7-day free trial has been successfully activated. You now have access to premium features.
              </p>
              <button
                onClick={() => {
                  setShowFreeTrialModal(false);
                  window.location.href = "/learn";
                }}
                className="w-full py-2 text-[#042F0C] bg-[#14B82C] rounded-full border border-[#042F0C]"
              >
                Start Learning
              </button>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Subscriptions;