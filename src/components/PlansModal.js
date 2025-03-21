import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import { X } from "lucide-react";
import { useAuth } from "../../src/context/AuthContext";
import { useTranslation } from "react-i18next";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { ClipLoader } from "react-spinners";
import { toast } from "react-toastify";

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
    maxHeight: "95vh",
    overflowY: "auto",
    width: "100%",
    padding: "16px", // Reduce padding
    borderRadius: "24px",
    backgroundColor: "white",
    border: "none",
  },
};

const PlansModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("offers");
  const { t } = useTranslation();
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [error, setError] = useState(null);
  const [offerPlans, setOfferPlans] = useState([]);
  const [showOffers, setShowOffers] = useState(false);

  const handlePurchase = async (plan, userId) => {
    try {
      // Handle free trial activation differently
      if (plan.type === "free_trial") {
        const userRef = doc(db, "students", userId);
        await updateDoc(userRef, {
          freeAccess: true,
          subscriptions: [
            {
              endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              startDate: new Date(),
              type: "Free Trial",
            },
          ],
        });

        toast.success("Free trial activated successfully!");
        onClose();

        // Reload the page to refresh user data
        window.location.reload();
        return;
      }

      // For paid plans, proceed with Stripe checkout
      const baseUrl = plan.stripeLink.split("?")[0];
      const url = new URL(baseUrl);
      url.searchParams.set("client_reference_id", userId);
      url.searchParams.set("prefilled_email", user?.email || "");
      url.searchParams.set("metadata[studentId]", userId);
      url.searchParams.set("metadata[paymentType]", plan.type);

      window.location.href = url.toString();
    } catch (error) {
      console.error("Error during purchase:", error);
      toast.error("Failed to process your request. Please try again.");
    }
  };

  // Add function to check if user is within 7 days of registration
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

        // Check if user is eligible for offers
        const isEligible = await checkNewUserEligibility(user?.uid);
        setShowOffers(isEligible);

        // If eligible, create the two specific offers
        if (isEligible) {
          const transformedOfferPlans = [];

          // Add free trial offer
          transformedOfferPlans.push({
            id: "free-trial",
            title: t("plans-modal.subscription-plans.group.title"),
            description: t("plans-modal.offer-plans.free.description"),
            price: 0,
            isPopular: false,
            type: "free_trial",
            body: t("plans-modal.offer-plans.free.body"),
          });

          // Fetch the "Buy one get 2 free" offer from Firestore
          const offersSnapshot = await getDocs(collection(db, "offer"));
          const offersData = offersSnapshot.docs[0]?.data()?.offerList || [];
          const buyOneGetTwoOffer = offersData.find(
            (plan) =>
              plan.type === "buy_one_get_two" ||
              plan.title?.includes("Buy one class credit get 2 classes free")
          );

          if (buyOneGetTwoOffer) {
            transformedOfferPlans.push({
              id: buyOneGetTwoOffer.offerId,
              title: t("plans-modal.offer-plans.premium.title"),
              description: t("plans-modal.offer-plans.premium.description"),
              price: buyOneGetTwoOffer.price,
              isPopular: true,
              type: "buy_one_get_two",
              stripeLink: buyOneGetTwoOffer.url,
              body: t("plans-modal.offer-plans.premium.body"),
            });
          }

          setOfferPlans(transformedOfferPlans);
        }

        // ... rest of the fetchPlans function for subscription and credit plans
      } catch (err) {
        console.error("Error fetching plans:", err);
        setError("Failed to load plans. Please try again later.");
      } finally {
        setIsLoadingPlans(false);
      }
    };

    fetchPlans();
  }, [user, t]);

  const SubscriptionPlan = ({ plan, userId }) => {
    const [isLoading, setIsLoading] = useState(false);
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
        {plan.isPopular ? (
          <div className="px-4 py-1.5 text-sm font-semibold bg-[#FFBF00] rounded-t-3xl text-center">
            {t("plans-modal.popular-badge")}
          </div>
        ) : (
          <div className="h-[30px]" />
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

          <button
            onClick={handleClick}
            disabled={isLoading}
            className="w-full py-2 text-[#042F0C] transition-colors bg-[#14B82C] rounded-full border border-[#042F0C] disabled:opacity-50"
          >
            {isLoading
              ? t("plans-modal.buttons.loading")
              : t("plans-modal.buttons.subscribe")}
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
        {plan.isPopular ? (
          <div className="px-4 py-1.5 text-sm font-semibold bg-[#FFBF00] rounded-t-3xl text-center">
            {t("plans-modal.popular-badge")}
          </div>
        ) : (
          <div className="h-[30px]" />
        )}
        <div className="flex flex-col flex-grow p-6 space-y-6 text-center">
          <div className="space-y-4">
            <div className="text-4xl font-bold">${plan.price}</div>
            <h3 className="text-lg font-medium">{plan.title}</h3>
            {plan.description && (
              <p className="text-sm text-black">{plan.description}</p>
            )}
          </div>

          <div className="flex-grow" />

          <button
            onClick={handleClick}
            disabled={isLoading}
            className="w-full py-3 text-[#042F0C] transition-colors bg-[#14B82C] rounded-full border border-[#042F0C] disabled:opacity-50"
          >
            {isLoading
              ? t("plans-modal.buttons.loading")
              : t("plans-modal.buttons.buy")}
          </button>
        </div>
      </div>
    );
  };

  const OfferPlan = ({ plan, userId }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = async () => {
      setIsLoading(true);
      try {
        if (plan.type === "free_trial") {
          // Show loading state with ClipLoader
          const userRef = doc(db, "students", userId);
          await updateDoc(userRef, {
            freeAccess: true,
            subscriptions: [
              {
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                startDate: new Date(),
                type: "Free Trial",
              },
            ],
          });

          toast.success("Free trial activated successfully!");
          onClose();

          // Add a small delay to ensure toast is visible
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          await handlePurchase(plan, userId);
        }
      } catch (error) {
        console.error("Error during purchase:", error);
        toast.error("Failed to process your request. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="flex flex-col h-full bg-white border border-[#B0B0B0] rounded-3xl">
        {plan.isPopular ? (
          <div className="px-4 py-1.5 text-sm font-semibold bg-[#FFBF00] rounded-t-3xl text-center">
            {t("plans-modal.popular-badge")}
          </div>
        ) : (
          <div className="h-[30px]" />
        )}

        <div className="flex flex-col flex-grow p-6 space-y-6 text-center">
          <div className="space-y-4">
            <div className="text-4xl font-bold">
              {plan.price === 0 ? "FREE" : `$${plan.price}`}
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">{plan.title}</h3>
              {plan.description && (
                <p className="text-sm text-black">{plan.description}</p>
              )}
            </div>
            {plan.body && <p className="text-sm text-black">{plan.body}</p>}
          </div>

          <div className="flex-grow" />

          <button
            onClick={handleClick}
            disabled={isLoading}
            className="w-full py-3 text-[#042F0C] transition-colors bg-[#14B82C] rounded-full border border-[#042F0C] disabled:opacity-50 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <ClipLoader color="#042F0C" size={20} className="mr-2" />
                <span>{t("plans-modal.buttons.loading")}</span>
              </>
            ) : (
              <span>
                {plan.type === "free_trial"
                  ? t("plans-modal.buttons.subscribe")
                  : t("plans-modal.buttons.buy")}
              </span>
            )}
          </button>
        </div>
      </div>
    );
  };

  const subscriptionPlans = [
    {
      title: t("plans-modal.subscription-plans.group.title"),
      description: t("plans-modal.subscription-plans.group.description"),
      price: 49.99,
      period: t("plans-modal.pricing.month"),
      isPopular: true,
      type: "monthly_subscription",
      stripeLink: "https://buy.stripe.com/test_14keVY9UVgHjapq4gi",
    },
    {
      title: t("plans-modal.subscription-plans.unlimited.title"),
      description: t("plans-modal.subscription-plans.unlimited.description"),
      price: 149.99,
      period: t("plans-modal.pricing.month"),
      isPopular: false,
      type: "yearly_subscription",
      stripeLink: "https://buy.stripe.com/test_00g29c2st3Ux5568wA",
    },
  ];

  const creditPlans = [
    {
      title: t("plans-modal.credit-plans.three.title"),
      description: t("plans-modal.credit-plans.three.description"),
      price: 59.99,
      isPopular: false,
      type: "3_credits",
      stripeLink: "https://buy.stripe.com/test_28o1581op4YB556000",
    },
    {
      title: t("plans-modal.credit-plans.five.title"),
      description: t("plans-modal.credit-plans.five.description"),
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-medium">{t("plans-modal.title")}</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex justify-center mb-4">
          <div className="inline-flex bg-gray-100 border border-gray-300 rounded-full">
            {showOffers && (
              <button
                className={`px-6 py-2 rounded-full text-[#042F0C] text-sm font-medium transition-colors ${
                  activeTab === "offers"
                    ? "bg-[#FFBF00] border border-[#042F0C]"
                    : "bg-transparent"
                }`}
                onClick={() => setActiveTab("offers")}
              >
                {t("plans-modal.tabs.offers")}
              </button>
            )}
            <button
              className={`px-6 py-1 rounded-full text-[#042F0C] text-sm font-medium transition-colors
                ${
                  activeTab === "subscriptions"
                    ? "bg-[#FFBF00] border border-[#042F0C]"
                    : "bg-transparent"
                }`}
              onClick={() => setActiveTab("subscriptions")}
            >
              {t("plans-modal.tabs.subscriptions")}
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
              {t("plans-modal.tabs.credits")}
            </button>
          </div>
        </div>

        {activeTab === "offers" && (
          <div className="grid grid-cols-2 gap-4">
            {offerPlans.map((plan, index) => (
              <OfferPlan key={index} plan={plan} userId={user?.uid} />
            ))}
          </div>
        )}

        {activeTab === "subscriptions" && (
          <div className="grid grid-cols-2 gap-4">
            {subscriptionPlans.map((plan, index) => (
              <SubscriptionPlan key={index} plan={plan} userId={user?.uid} />
            ))}
          </div>
        )}

        {activeTab === "credits" && (
          <>
            <div className="grid grid-cols-2 gap-2">
              {creditPlans.map((plan, index) => (
                <CreditPlan key={index} plan={plan} userId={user?.uid} />
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
      </div>
    </Modal>
  );
};

export default PlansModal;
