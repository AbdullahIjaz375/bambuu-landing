/**
 * @param {Object} user
 * @param {string} contentType
 * @param {string} [classType=null]
 * @returns {Object}
 */
export const checkAccess = (user, contentType, classType = null) => {
  console.log("🔒 Access Check Started:", {
    contentType,
    classType,
    userFreeAccess: user?.freeAccess,
    userCredits: user?.credits,
    hasSubscriptions: user?.subscriptions?.length > 0,
  });

  if (classType?.includes("Group")) {
    console.log("⚡ Checking Group Class Access");

    if (user?.freeAccess) {
      console.log("✅ Free Trial User - Access Granted to Group Class");
      return {
        hasAccess: true,
        reason: "Free trial access",
      };
    }

    if (classType === "Group Standard") {
      console.log("✅ Standard Group Class - Access Granted");
      return { hasAccess: true, reason: "Standard group class" };
    }

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

  if (classType === "Individual Premium") {
    console.log("⚡ Checking Individual Premium Access");

    if (user?.freeAccess) {
      console.log("❌ Free Trial User - No Access to Individual Premium");
      return {
        hasAccess: false,
        reason: "Individual premium classes are not included in free trial",
      };
    }

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
