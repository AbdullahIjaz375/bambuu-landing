// src/components/ProtectedRoute.js
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user } = useAuth();
  const userType = sessionStorage.getItem("userType");

  if (!user) {
    return <Navigate to="/login" />;
  }

  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

  if (roles.length > 0 && !roles.includes(userType)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

export default ProtectedRoute;
