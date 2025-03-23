/**
 * Checks if user has access to premium content based on subscription, credits, or freeAccess flag
 * @param {Object} user - The user object from auth context
 * @param {string} contentType - Type of content ("premium-group", "premium-class", etc.)
 * @param {string} [classType=null] - Type of class ("Individual Premium", "Group Premium", etc.)
 * @returns {Object} - Access status and reason
 */
export const checkAccess = (user, contentType, classType = null) => {
  console.log("🔒 Access Check Started:", {
    contentType,
    classType,
    userFreeAccess: user?.freeAccess,
    userCredits: user?.credits,
    hasSubscriptions: user?.subscriptions?.length > 0,
  });

  // First check if it's any type of group class
  if (classType?.includes("Group")) {
    console.log("⚡ Checking Group Class Access");

    // Free trial users can access all group classes
    if (user?.freeAccess) {
      console.log("✅ Free Trial User - Access Granted to Group Class");
      return {
        hasAccess: true,
        reason: "Free trial access",
      };
    }

    // If it's a standard group class, allow access
    if (classType === "Group Standard") {
      console.log("✅ Standard Group Class - Access Granted");
      return { hasAccess: true, reason: "Standard group class" };
    }

    // For premium groups, check subscription
    if (classType === "Group Premium") {
      const hasValidSubscription = user?.subscriptions?.some((sub) => {
        if (!sub.startDate || !sub.endDate) return false;
        const endDate = new Date(sub.endDate.seconds * 1000);
        const isValid =
          endDate > new Date() &&
          sub.type === "bammbuu+ Instructor-led group Classes";
        console.log("📅 Group Subscription Check:", {
          type: sub.type,
          endDate,
          isValid,
        });
        return isValid;
      });

      if (hasValidSubscription) {
        console.log("✅ Valid Group Subscription Found");
        return { hasAccess: true, reason: "Valid group subscription" };
      }
    }

    return {
      hasAccess: false,
      reason: "Premium group access requires subscription or free trial",
    };
  }

  // Then check for individual premium classes
  if (classType === "Individual Premium") {
    console.log("⚡ Checking Individual Premium Access");

    if (user?.freeAccess) {
      console.log("❌ Free Trial User - No Access to Individual Premium");
      return {
        hasAccess: false,
        reason: "Individual premium classes are not included in free trial",
      };
    }

    // Rest of individual premium logic remains the same
    // Check for valid unlimited subscription first
    const hasValidSubscription = user?.subscriptions?.some((sub) => {
      if (!sub.startDate || !sub.endDate) return false;
      const endDate = new Date(sub.endDate.seconds * 1000);
      const isValid = endDate > new Date() && sub.type === "Unlimited Credits";
      console.log("📅 Subscription Check:", {
        type: sub.type,
        endDate,
        isValid,
      });
      return isValid;
    });

    if (hasValidSubscription) {
      console.log("✅ Valid Unlimited Subscription Found");
      return { hasAccess: true, reason: "Valid unlimited subscription" };
    }

    // Check for available credits
    if (user?.credits > 0) {
      console.log("✅ User Has Credits:", user.credits);
      return { hasAccess: true, reason: "Available credits" };
    }

    console.log("❌ No Valid Access Method Found for Individual Premium");
    return {
      hasAccess: false,
      reason:
        "Individual premium classes require credits or unlimited subscription",
    };
  }

  // Default case for standard content
  return { hasAccess: true, reason: "Standard content" };
};
