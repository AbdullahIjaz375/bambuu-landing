// src/components/PublicRoute.js
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PublicRoute = ({ children }) => {
  const { user } = useAuth();

  // If user is logged in, redirect to the learn page
  if (user) {
    return <Navigate to="/learn" />;
  }

  // If not logged in, render the children components (public content)
  return children;
};

export default PublicRoute;
