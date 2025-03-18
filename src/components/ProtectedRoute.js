import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user } = useAuth();
  const userType = sessionStorage.getItem("userType");
  const currentUrl = window.location.href;

  // Save subscription URL if applicable.
  if (currentUrl.includes("subscriptions?offerId=")) {
    localStorage.setItem("selectedPackageUrl", currentUrl);
  }

  // Save class details URL if the pathname includes "/classDetailsTutor/"
  // and there's a "ref" query parameter present.
  try {
    const urlObj = new URL(currentUrl);
    const searchParams = new URLSearchParams(urlObj.search);
    if (urlObj.pathname.includes("/classDetailsUser/") && searchParams.has("ref")) {
      localStorage.setItem("selectedClassUrl", currentUrl);
    }
  } catch (error) {
    console.error("Invalid URL", error);
  }

  // If the user is not logged in, determine the proper login URL.
  if (!user) {
    let loginUrl = "/login";
    if (currentUrl.includes("subscriptions?offerId=")) {
      loginUrl = "/login?ref=sub";
    } else {
      try {
        const urlObj = new URL(currentUrl);
        const searchParams = new URLSearchParams(urlObj.search);
        if (urlObj.pathname.includes("/classDetailsUser/") && searchParams.has("ref")) {
          loginUrl = "/login?ref=class";
        }
      } catch (error) {
        console.error("Invalid URL", error);
      }
    }
    return <Navigate to={loginUrl} />;
  }

  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  if (roles.length > 0 && !roles.includes(userType)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

export default ProtectedRoute;
