// src/components/ProtectedRoute.js
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user } = useAuth();
  const userType = sessionStorage.getItem("userType");
  // If there's no user, redirect to the login page
  if (!user) {
    return <Navigate to="/login" />;
  }

  // If user is logged in but does not have the required role, redirect to a different page (e.g., landing page)
  if (requiredRole && userType !== requiredRole) {
    return <Navigate to="/unauthorized" />;
  }

  // If user has the required role, render the children components (protected content)
  return children;
};

export default ProtectedRoute;
