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
    subscriptionTypes: user?.subscriptions?.map((sub) => sub.type),
  });

  // Allow free access to Group Standard classes
  if (classType === "Group Standard") {
    console.log("✅ Group Standard Class - Access Granted");
    return { hasAccess: true, reason: "Group Standard classes are free" };
  }

  // Check if this is a premium class request
  if (contentType === "premium-class") {
    console.log("⚡ Checking Premium Class Access");

    // If it's a group class
    if (classType?.includes("Group")) {
      console.log("🔍 Checking Group Class Requirements");

      // For Premium Group classes, check all access methods
      if (classType === "Group Premium") {
        // Check free trial access
        if (user?.freeAccess) {
          console.log("✅ Free Trial User - Access Granted to Premium Group");
          return {
            hasAccess: true,
            reason: "Free trial access",
          };
        }

        // Check for valid group subscription
        const hasValidSubscription = user?.subscriptions?.some((sub) => {
          if (!sub.startDate || !sub.endDate || sub.type === "None")
            return false;
          const endDate = new Date(sub.endDate.seconds * 1000);
          const isValid =
            endDate > new Date() &&
            sub.type === "bammbuu+ Instructor-led group Classes";
          console.log("📅 Premium Group Subscription Check:", {
            type: sub.type,
            endDate,
            isValid,
          });
          return isValid;
        });

        if (hasValidSubscription) {
          console.log("✅ Valid Premium Group Subscription Found");
          return { hasAccess: true, reason: "Valid group subscription" };
        }

        // Check for credits
        if (user?.credits > 0) {
          console.log("✅ User Has Credits for Premium Group");
          return { hasAccess: true, reason: "Available credits" };
        }

        console.log("❌ No Valid Access Method Found for Premium Group");
        return {
          hasAccess: false,
          reason:
            "Premium group access requires subscription, credits, or free trial",
        };
      }
    }

    // If it's an individual premium class
    if (classType === "Individual Premium") {
      console.log("⚡ Checking Individual Premium Access");

      if (user?.freeAccess) {
        console.log("❌ Free Trial User - No Access to Individual Premium");
        return {
          hasAccess: false,
          reason: "Individual premium classes are not included in free trial",
        };
      }

      // Check for valid unlimited subscription
      const hasValidSubscription = user?.subscriptions?.some((sub) => {
        if (!sub.startDate || !sub.endDate || sub.type === "None") return false;
        const endDate = new Date(sub.endDate.seconds * 1000);
        const isValid =
          endDate > new Date() && sub.type === "Unlimited Credits";
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
  }

  // Handle standard content
  if (!contentType || contentType === "standard") {
    console.log("✅ Standard Content - Access Granted");
    return { hasAccess: true, reason: "Standard content" };
  }

  // Default deny access if we reach here
  console.log(
    "❌ Access Denied - Invalid content type or class type combination"
  );
  return { hasAccess: false, reason: "User does not have the required access" };
};
