import { useState } from "react";
import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "../firebaseConfig";

export const useClassBooking = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const checkBookingEligibility = (
    user,
    classType,
    subscriptions,
    credits = 0
  ) => {
    // If class is not premium, allow booking
    if (classType !== "Individual Premium" && classType !== "Group Premium") {
      return {
        canBook: true,
        useSubscription: false,
        useCredits: false,
        message: "Free class booking",
      };
    }

    // Check for valid subscriptions
    const currentDate = new Date();
    const validSubscriptions =
      subscriptions?.filter((sub) => {
        if (!sub.startDate || !sub.endDate) return false;
        const endDate = new Date(sub.endDate.seconds * 1000);
        return endDate > currentDate;
      }) || [];

    // Check subscription type based on class type
    const hasValidSubscription = validSubscriptions.some((sub) => {
      if (classType === "Group Premium") {
        return sub.type === "bammbuu+ Instructor-led group Classes";
      } else if (classType === "Individual Premium") {
        return sub.type === "Unlimited Class Credits";
      }
      return false;
    });

    // If has valid subscription, allow booking with subscription
    if (hasValidSubscription) {
      return {
        canBook: true,
        useSubscription: true,
        useCredits: false,
        message: "Booking with subscription",
      };
    }

    // If has credits, allow booking with credits
    if (credits > 0) {
      return {
        canBook: true,
        useSubscription: false,
        useCredits: true,
        message: "Booking with credits",
      };
    }

    // No valid subscription or credits
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
    handleEnrollment
  ) => {
    setIsProcessing(true);
    setError(null);

    try {
      const eligibility = checkBookingEligibility(
        user,
        classType,
        subscriptions,
        credits
      );

      if (!eligibility.canBook) {
        setError(eligibility.message);
        onFailure?.(eligibility.message);
        return false;
      }

      // If using credits, decrement them
      if (eligibility.useCredits) {
        const userRef = doc(db, "students", user.uid);
        await updateDoc(userRef, {
          credits: increment(-1),
        });
      }

      // Proceed with enrollment
      const enrollmentSuccess = await handleEnrollment();

      if (enrollmentSuccess) {
        onSuccess?.();
        return true;
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
    iserror: error, // Rename during return
  };
};
