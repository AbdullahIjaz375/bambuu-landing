import { useState } from "react";

export const useGroupJoining = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const checkJoiningEligibility = (user, groupType, subscriptions) => {
    // If group is not premium, allow joining without subscription check
    if (groupType !== "Premium") {
      return {
        canJoin: true,
        useSubscription: false,
        message: "Standard group joining",
      };
    }

    // First check freeAccess flag
    if (user?.freeAccess) {
      return {
        canJoin: true,
        useSubscription: false,
        message: "Free access enabled",
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

    // For premium groups, check for specific subscription type
    const hasValidSubscription = validSubscriptions.some(
      (sub) => sub.type === "bammbuu+ Instructor-led group Classes"
    );

    // If has valid subscription, allow joining
    if (hasValidSubscription) {
      return {
        canJoin: true,
        useSubscription: true,
        message: "Premium group joining with subscription",
      };
    }

    // No valid subscription for premium group
    return {
      canJoin: false,
      useSubscription: false,
      message: "No valid subscription for premium group",
    };
  };

  const handleGroupJoining = async (
    user,
    groupType,
    subscriptions,
    onSuccess,
    onFailure,
    handleJoinGroup
  ) => {
    setIsProcessing(true);
    setError(null);

    try {
      const eligibility = checkJoiningEligibility(
        user,
        groupType,
        subscriptions
      );

      if (!eligibility.canJoin) {
        setError(eligibility.message);
        onFailure?.(eligibility.message);
        return false;
      }

      // Proceed with group joining
      const joiningSuccess = await handleJoinGroup();

      if (joiningSuccess) {
        onSuccess?.();
        return true;
      } else {
        throw new Error("Group joining failed");
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
    handleGroupJoining,
    checkJoiningEligibility,
    isProcessing,
    error,
  };
};
