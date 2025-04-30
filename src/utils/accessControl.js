/**
 * @param {Object} user
 * @param {string} contentType
 * @param {string} [classType=null]
 * @returns {Object}
 */
export const checkAccess = (user, contentType, classType = null) => {
  // Universal credit check - if user has credits, they can join any class
  if (user?.credits > 0) {
    return { hasAccess: true, reason: "Available credits" };
  }

  // Always allow free access to Group Standard classes
  if (classType === "Group Standard") {
    return { hasAccess: true, reason: "Group Standard classes are free" };
  }

  // Check for unlimited subscription which allows access to any class type
  const hasUnlimitedSubscription = user?.subscriptions?.some((sub) => {
    if (!sub.startDate || !sub.endDate || sub.type === "None") return false;
    const endDate = new Date(sub.endDate.seconds * 1000);
    return endDate > new Date() && sub.type === "Unlimited Credits";
  });

  if (hasUnlimitedSubscription) {
    return { hasAccess: true, reason: "Unlimited subscription" };
  }

  if (contentType === "premium-class") {
    // Handle Group Premium classes
    if (classType === "Group Premium") {
      // Free access allows joining Group Premium classes
      if (user?.freeAccess === true) {
        return {
          hasAccess: true,
          reason: "Free trial access",
        };
      }

      // Check for bammbuu+ group class subscription
      const hasGroupSubscription = user?.subscriptions?.some((sub) => {
        if (!sub.startDate || !sub.endDate || sub.type === "None") return false;
        const endDate = new Date(sub.endDate.seconds * 1000);
        return (
          endDate > new Date() &&
          sub.type === "bammbuu+ Instructor-led group Classes"
        );
      });

      if (hasGroupSubscription) {
        return { hasAccess: true, reason: "Valid group subscription" };
      }

      return {
        hasAccess: false,
        reason:
          "Premium group access requires subscription, credits, or free trial",
      };
    }

    // Handle Individual Premium classes
    else if (classType === "Individual Premium") {
      // Free access does NOT allow joining Individual Premium classes
      if (user?.freeAccess) {
        return {
          hasAccess: false,
          reason: "Individual premium classes are not included in free trial",
        };
      }

      // Group subscription doesn't work for individual classes
      return {
        hasAccess: false,
        reason:
          "Individual premium classes require credits or unlimited subscription",
      };
    }
  }

  // Handle standard content
  if (!contentType || contentType === "standard") {
    return { hasAccess: true, reason: "Standard content" };
  }

  return { hasAccess: false, reason: "User does not have the required access" };
};
