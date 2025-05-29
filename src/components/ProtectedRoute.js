import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  const userType = sessionStorage.getItem("userType");
  const location = useLocation();
  const currentUrl = window.location.href;
  const currentPath = location.pathname + location.search + location.hash;
  useEffect(() => {
    if (!user) {
      console.log("Saving redirect path:", currentPath);
      // Save both session and local storage for better persistence
      sessionStorage.setItem("redirectAfterLogin", currentPath);
      localStorage.setItem("redirectAfterLogin", currentPath);
      localStorage.setItem("fullRedirectUrl", currentUrl);

      // Add timestamp to know when this was saved
      localStorage.setItem("redirectTimestamp", Date.now().toString());
    } else {
      // Clear redirect data when user is logged in
      sessionStorage.removeItem("redirectAfterLogin");
      // Keep localStorage redirect for longer persistence but mark as used
      localStorage.setItem("redirectUsed", "true");
    }
  }, [user, currentPath, currentUrl]);

  // Keep existing special case handling
  // Save subscription URL if applicable.
  if (currentUrl.includes("subscriptions?offerId=")) {
    localStorage.setItem("selectedPackageUrl", currentUrl);
  }
  // Save class details URL if the pathname includes "/classDetailsUser/"
  try {
    const urlObj = new URL(currentUrl);

    // Save all class detail URLs regardless of query params
    if (
      urlObj.pathname.includes("/classDetailsUser/") ||
      urlObj.pathname.includes("/newClassDetailsUser/")
    ) {
      localStorage.setItem("selectedClassUrl", currentUrl);
    }

    // Save group detail URL ONLY if user is not logged in and path is a group details page
    if (
      !user &&
      (currentPath.includes("/groupDetailsTutor/") ||
        currentPath.includes("/groupDetailsUser/") ||
        currentPath.includes("/newGroupDetailsUser/"))
    ) {
      localStorage.setItem("selectedGroupUrl", currentUrl);
    }
  } catch (error) {
    console.error("Invalid URL", error);
  }

  // Utility function to validate redirect paths
  const isValidRedirectPath = (path) => {
    if (!path || typeof path !== "string") return false;
    // Whitelist of valid routes
    const validPrefixes = [
      "/groupDetailsUser/",
      "/classDetailsUser/",
      "/newGroupDetailsUser/",
      "/learn",
      "/learn-tutor",
      "/userEditProfile",
      "/groupsUser",
      "/classesUser",
      "/messagesUser",
      "/profileUser",
      "/profileTutor",
      "/groupDetailsTutor/",
      "/classDetailsTutor/",
      "/newGroupDetailsTutor/",
      "/unauthorized",
    ];
    return validPrefixes.some((prefix) => path.startsWith(prefix));
  };

  // If the user is not logged in, redirect to login page with appropriate query param
  if (!user) {
    // Determine the login URL with appropriate query parameter
    let loginUrl = "/login";

    if (currentUrl.includes("subscriptions?offerId=")) {
      loginUrl = "/login?ref=sub";
    } else if (
      currentPath.includes("/classDetailsUser/") ||
      currentPath.includes("/newClassDetailsUser/")
    ) {
      loginUrl = "/login?ref=class";
    } else if (
      currentPath.includes("/groupDetailsTutor/") ||
      currentPath.includes("/groupDetailsUser/") ||
      currentPath.includes("/newGroupDetailsUser/")
    ) {
      loginUrl = "/login?ref=group";
    }

    return <Navigate to={loginUrl} />;
  }
  // If the user is logged in and the current path is /login or /signup, redirect to /learn
  if (location.pathname === "/login" || location.pathname === "/signup") {
    return <Navigate to="/learn" />;
  }
  // Role-based access checks
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

  // Get authentication loading state
  // Don't redirect during loading - fixes the flash to /unauthorized
  if (loading) {
    // Show a loading indicator or nothing while authentication data is being loaded
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }
  // Only perform role checks if there are required roles and we're not in a loading state
  if (roles.length > 0) {
    // Get user type from context first, then fallback to sessionStorage
    const userTypeFromContext = user?.userType;
    const effectiveUserType = userTypeFromContext || userType;

    // If we still don't have a user type, or it's not in the allowed roles
    if (!effectiveUserType || !roles.includes(effectiveUserType)) {
      console.log(
        "Access denied: Required role(s):",
        roles,
        "User type:",
        effectiveUserType
      );

      // Instead of immediately redirecting to unauthorized, redirect to login if it seems
      // like there might be authentication problems
      if (!effectiveUserType || effectiveUserType === "undefined") {
        console.log(
          "No user type detected, redirecting to login instead of unauthorized"
        );
        return <Navigate to="/login" />;
      } else {
        return <Navigate to="/unauthorized" />;
      }
    }
  }

  return children;
};

export default ProtectedRoute;
