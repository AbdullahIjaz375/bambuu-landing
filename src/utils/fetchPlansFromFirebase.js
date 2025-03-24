import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";

export const fetchPlansFromFirebase = async (t) => {
  try {
    // Fetch subscription plans
    const subscriptionSnapshot = await getDocs(
      collection(db, "subscription_offer")
    );
    const subscriptionData =
      subscriptionSnapshot.docs[0]?.data()?.subscription_offer_list || [];

    console.log("Raw subscription data:", subscriptionData);

    const transformedSubscriptionPlans = subscriptionData.map((plan) => ({
      id: plan.offerId,
      title: plan.title,
      description: plan.subtitle,
      price: plan.price,
      period: t("plans-modal.pricing.month"),
      isPopular: plan.isPopular,
      type: plan.type || "subscription",
      stripeLink: plan.stripeUrl,
      stripeUrl: plan.stripeUrl,
    }));

    console.log(
      "Transformed subscription plans:",
      transformedSubscriptionPlans
    );

    // Fetch credit plans
    const creditSnapshot = await getDocs(collection(db, "credit_offer"));
    const creditData = creditSnapshot.docs[0]?.data()?.credit_offer_list || [];

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
      numberOfCredits: plan.numberOfCredits,
    }));

    // Fetch offers with exact URLs
    const offersSnapshot = await getDocs(collection(db, "offer"));
    const offersData = offersSnapshot.docs[0]?.data()?.offerList || [];

    return {
      subscriptionPlans: transformedSubscriptionPlans,
      creditPlans: transformedCreditPlans,
      offersData,
    };
  } catch (error) {
    console.error("Error fetching plans:", error);
    throw error;
  }
};
