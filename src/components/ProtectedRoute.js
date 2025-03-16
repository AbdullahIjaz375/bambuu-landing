// src/components/ProtectedRoute.js
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user } = useAuth();
  const userType = sessionStorage.getItem("userType");
  // Get the current URL
  const currentUrl = window.location.href;
  if (currentUrl.includes("subscriptions?offerId=")) {
    localStorage.setItem("selectedPackageUrl", currentUrl);
  }
  
  // If the user is not logged in, redirect to login with the ref query param if needed
  if (!user) {
    const loginUrl = currentUrl.includes("subscriptions?offerId=")
      ? "/login?ref=sub"
      : "/login";
    return <Navigate to={loginUrl} />;
  }

  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  if (roles.length > 0 && !roles.includes(userType)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

export default ProtectedRoute;
