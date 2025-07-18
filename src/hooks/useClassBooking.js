import { useState } from "react";

export const useClassBooking = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const checkBookingEligibility = (
    user,
    classType,
    subscriptions,
    credits = 0,
  ) => {
    if (classType !== "Individual Premium" && classType !== "Group Premium") {
      return {
        canBook: true,
        useSubscription: false,
        useCredits: false,
        message: "Free class booking",
      };
    }

    // Check freeAccess flag first
    if (user?.freeAccess) {
      return {
        canBook: true,
        useSubscription: false,
        useCredits: false,
        message: "Free access enabled",
      };
    }

    // Continue with existing subscription and credits checks
    const currentDate = new Date();
    const validSubscriptions =
      subscriptions?.filter((sub) => {
        if (!sub.startDate || !sub.endDate) return false;
        const endDate = new Date(sub.endDate.seconds * 1000);
        return endDate > currentDate;
      }) || [];

    const hasValidSubscription = validSubscriptions.some((sub) => {
      if (classType === "Group Premium") {
        const type = sub.type.trim().toLowerCase();
        return (
          type === "bammbuu+ instructor-led group classes" ||
          type === "immersive exam prep" ||
          type === "bammbuu groups" ||
          type === "group_premium"
        );
      } else if (classType === "Individual Premium") {
        return sub.type === "Unlimited Credits";
      }
      return false;
    });

    if (hasValidSubscription) {
      return {
        canBook: true,
        useSubscription: true,
        useCredits: false,
        message: "Booking with subscription",
      };
    }

    if (credits > 0) {
      return {
        canBook: true,
        useSubscription: false,
        useCredits: true,
        message: "Booking with credits",
      };
    }

    return {
      canBook: false,
      useSubscription: false,
      useCredits: false,
      message: "No valid subscription or credits available",
    };
  };

  const handleClassBooking = async (
    user,
    classType,
    subscriptions,
    credits,
    onSuccess,
    onFailure,
    handleEnrollment,
  ) => {
    setIsProcessing(true);
    setError(null);

    try {
      const eligibility = checkBookingEligibility(
        user,
        classType,
        subscriptions,
        credits,
      );

      if (!eligibility.canBook) {
        setError(eligibility.message);
        onFailure?.(eligibility.message);
        return false;
      }

      // Pass useCredits flag to enrollment function
      const enrollmentSuccess = await handleEnrollment(eligibility.useCredits);

      if (enrollmentSuccess) {
        onSuccess?.();
        return {
          success: true,
          method: eligibility.useCredits ? "credits" : "subscription",
        };
      } else {
        throw new Error("Enrollment failed");
      }
    } catch (err) {
      setError(err.message);
      onFailure?.(err.message);
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    handleClassBooking,
    checkBookingEligibility,
    isProcessing,
    error,
  };
};
