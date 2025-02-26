/**
 * Checks if user has access to premium content based on subscription, credits, or freeAccess flag
 * @param {Object} user - The user object from auth context
 * @param {string} contentType - Type of content ("premium-group", "premium-class", etc.)
 * @returns {Object} - Access status and reason
 */
export const checkAccess = (user, contentType) => {
  // If user has freeAccess flag, allow access to everything
  if (user?.freeAccess) {
    return { hasAccess: true, reason: "Free access enabled" };
  }

  // Check for valid subscription
  const hasValidSubscription = user?.subscriptions?.some((sub) => {
    if (!sub.startDate || !sub.endDate) return false;
    const endDate = new Date(sub.endDate.seconds * 1000);
    return (
      endDate > new Date() &&
      (contentType === "premium-group"
        ? sub.type === "bammbuu+ Instructor-led group Classes"
        : contentType === "premium-class"
        ? sub.type === "Unlimited Credits"
        : false)
    );
  });

  if (hasValidSubscription) {
    return { hasAccess: true, reason: "Valid subscription" };
  }

  // Check for credits for classes
  if (contentType === "premium-class" && user?.credits > 0) {
    return { hasAccess: true, reason: "Available credits" };
  }

  return {
    hasAccess: false,
    reason: "No valid subscription, credits, or free access",
  };
};
