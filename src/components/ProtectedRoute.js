import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user } = useAuth();
  const userType = sessionStorage.getItem("userType");
  const location = useLocation();
  const currentUrl = window.location.href;
  const currentPath = location.pathname + location.search + location.hash;

  // Save the current path for redirection after login - using useEffect to ensure this runs once
  useEffect(() => {
    if (!user) {
      console.log("Saving redirect path:", currentPath); // Debug log
      sessionStorage.setItem("redirectAfterLogin", currentPath);

      // Also save the full URL just for backup
      localStorage.setItem("fullRedirectUrl", currentUrl);
    }
  }, [user, currentPath, currentUrl]);

  // Keep existing special case handling
  // Save subscription URL if applicable.
  if (currentUrl.includes("subscriptions?offerId=")) {
    localStorage.setItem("selectedPackageUrl", currentUrl);
  }

  // Save class details URL if the pathname includes "/classDetailsUser/"
  // and there's a "ref" query parameter present.
  try {
    const urlObj = new URL(currentUrl);
    const searchParams = new URLSearchParams(urlObj.search);

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

  // Role-based access checks
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  if (roles.length > 0 && !roles.includes(userType)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

export default ProtectedRoute;
