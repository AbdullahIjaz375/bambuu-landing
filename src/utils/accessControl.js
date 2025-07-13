/**
 * @param {Object} user
 * @param {string} contentType
 * @param {string} [classType=null]
 * @returns {Object}
 */
export const checkAccess = (user, contentType, classType = null) => {
  console.log("[accessControl] User:", user);
  console.log("[accessControl] Subscriptions:", user?.subscriptions);

  // Universal credit check - if user has credits, they can join any class
  if (user?.credits > 0) {
    console.log("[accessControl] Access granted: Available credits");
    return { hasAccess: true, reason: "Available credits" };
  }

  // Always allow free access to Group Standard classes
  if (classType === "Group Standard") {
    console.log(
      "[accessControl] Access granted: Group Standard classes are free",
    );
    return { hasAccess: true, reason: "Group Standard classes are free" };
  }

  // Check for Immersive Exam Prep plan (allows all premium groups)
  const hasExamPrepPlan = user?.subscriptions?.some((sub) => {
    if (
      !sub.startDate ||
      !sub.endDate ||
      sub.type === "None" ||
      sub.type === "none"
    )
      return false;
    const endDate = new Date(sub.endDate.seconds * 1000);
    return endDate > new Date() && sub.type === "Immersive Exam Prep";
  });
  console.log("[accessControl] hasExamPrepPlan:", hasExamPrepPlan);

  // Check for bammbuu+ group class subscription (allows premium group classes)
  const hasGroupSubscription = user?.subscriptions?.some((sub) => {
    if (
      !sub.startDate ||
      !sub.endDate ||
      !sub.type ||
      sub.type.toLowerCase() === "none"
    )
      return false;
    const endDate = new Date(sub.endDate.seconds * 1000);
    const type = sub.type.trim().toLowerCase();
    return (
      endDate > new Date() &&
      (type === "bammbuu+ instructor-led group classes".toLowerCase() ||
        type === "group_premium")
    );
  });
  console.log("[accessControl] hasGroupSubscription:", hasGroupSubscription);

  if (contentType === "premium-class") {
    // Handle Group Premium classes
    if (classType === "Group Premium") {
      if (hasExamPrepPlan) {
        console.log(
          "[accessControl] Access granted: Immersive Exam Prep plan allows premium group access",
        );
        return {
          hasAccess: true,
          reason: "Immersive Exam Prep plan allows premium group access",
        };
      }
      if (hasGroupSubscription) {
        console.log("[accessControl] Access granted: Valid group subscription");
        return { hasAccess: true, reason: "Valid group subscription" };
      }
      console.log(
        "[accessControl] Access denied: Premium group access requires exam prep plan, group class subscription, or credits",
      );
      return {
        hasAccess: false,
        reason:
          "Premium group access requires exam prep plan, group class subscription, or credits",
      };
    }
    // Handle Individual Premium classes
    else if (classType === "Individual Premium") {
      if (hasExamPrepPlan) {
        console.log(
          "[accessControl] Access granted: Immersive Exam Prep plan allows individual premium class access",
        );
        return {
          hasAccess: true,
          reason:
            "Immersive Exam Prep plan allows individual premium class access",
        };
      }
      console.log(
        "[accessControl] Access denied: Individual premium classes require credits or Immersive Exam Prep plan",
      );
      return {
        hasAccess: false,
        reason:
          "Individual premium classes require credits or Immersive Exam Prep plan",
      };
    }
  }

  // Handle standard content
  if (!contentType || contentType === "standard") {
    console.log("[accessControl] Access granted: Standard content");
    return { hasAccess: true, reason: "Standard content" };
  }

  console.log(
    "[accessControl] Access denied: User does not have the required access",
  );
  return { hasAccess: false, reason: "User does not have the required access" };
};
