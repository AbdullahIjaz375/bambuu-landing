// src/components/PublicRoute.js
import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // If there are subscription parameters in the URL, store them
    const params = new URLSearchParams(window.location.search);
    const offerId = params.get("offerId");
    if (offerId) {
      sessionStorage.setItem("pendingSubscription", offerId);
    }
  }, []);

  if (user) {
    // Check if there's a pending subscription
    const pendingSubscription = sessionStorage.getItem("pendingSubscription");
    if (pendingSubscription) {
      // Clear the stored subscription
      sessionStorage.removeItem("pendingSubscription");
      // Redirect to subscriptions with the stored parameter
      return (
        <Navigate
          to={`/subscriptions?offerId=${pendingSubscription}`}
          replace
        />
      );
    }
    // Default redirect if no pending subscription
    return <Navigate to="/learn" replace />;
  }

  return children;
};

export default PublicRoute;
