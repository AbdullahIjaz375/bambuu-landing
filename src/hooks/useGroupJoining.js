import { useState } from "react";
import { checkAccess } from "../utils/accessControl";

export const useGroupJoining = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const checkJoiningEligibility = (user, group) => {
    // Use the centralized access control function
    const isPremium = group.isPremium === true;
    const groupType = isPremium ? "Group Premium" : "Group Standard";
    const contentType = isPremium ? "premium-class" : "standard";

    const accessResult = checkAccess(user, contentType, groupType);

    return {
      canJoin: accessResult.hasAccess,
      useSubscription:
        accessResult.reason === "Valid group subscription" ||
        accessResult.reason === "Unlimited subscription",
      message: accessResult.reason,
    };
  };

  const handleGroupJoining = async (
    user,
    group,
    onSuccess,
    onFailure,
    handleJoinGroup
  ) => {
    setIsProcessing(true);
    setError(null);

    try {
      const eligibility = checkJoiningEligibility(user, group);

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
