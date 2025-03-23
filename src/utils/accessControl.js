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

  // Check for Group Standard classes first
  if (classType === "Group Standard" || classType === "Group Premium") {
    console.log("⚡ Checking Group Class Access");

    // Allow free trial users to access all group classes
    if (user?.freeAccess) {
      console.log("✅ Free Trial User - Access Granted to Group Class");
      return {
        hasAccess: true,
        reason: "Free trial access",
      };
    }

    // Check for valid group subscription
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

    // If it's a standard group class, allow access
    if (classType === "Group Standard") {
      console.log("✅ Standard Group Class - Access Granted");
      return { hasAccess: true, reason: "Standard group class" };
    }

    console.log("❌ No Valid Access Method Found for Premium Group");
    return {
      hasAccess: false,
      reason: "Premium group access requires subscription or free trial",
    };
  }

  // Handle individual premium class access
  if (contentType === "premium-class" || classType === "Individual Premium") {
    console.log("⚡ Checking Individual Premium Access");

    // Block free trial users from individual premium classes
    if (user?.freeAccess) {
      console.log("❌ Free Trial User - No Access to Individual Premium");
      return {
        hasAccess: false,
        reason: "Individual premium classes are not included in free trial",
      };
    }

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

  return { hasAccess: true, reason: "Standard content" };
};
