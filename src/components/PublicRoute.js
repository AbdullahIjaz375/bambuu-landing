// src/components/PublicRoute.js
import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  // If user is logged in, check for redirect paths and navigate accordingly
  if (user) {
    // Check for sessionStorage redirect path first (this is most reliable)
    const redirectPath = sessionStorage.getItem("redirectAfterLogin");

    if (redirectPath) {
      console.log("Redirecting to saved path:", redirectPath); // Debug log
      sessionStorage.removeItem("redirectAfterLogin");
      return <Navigate to={redirectPath} />;
    }

    // Check for backup full URL in localStorage
    const fullRedirectUrl = localStorage.getItem("fullRedirectUrl");
    if (fullRedirectUrl) {
      try {
        const parsedUrl = new URL(fullRedirectUrl);
        const path = parsedUrl.pathname + parsedUrl.search + parsedUrl.hash;
        console.log("Redirecting to backup full URL path:", path); // Debug log
        localStorage.removeItem("fullRedirectUrl");
        return <Navigate to={path} />;
      } catch (error) {
        console.error("Error parsing full redirect URL:", error);
      }
    }

    // Check special case redirects based on query parameters
    const params = new URLSearchParams(location.search);

    if (params.get("ref") === "sub") {
      const subUrl = localStorage.getItem("selectedPackageUrl");
      if (subUrl) {
        try {
          const parsedUrl = new URL(subUrl);
          const path = parsedUrl.pathname + parsedUrl.search;
          console.log("Redirecting to subscription URL:", path); // Debug log
          localStorage.removeItem("selectedPackageUrl");
          return <Navigate to={path} />;
        } catch (error) {
          console.error("Error parsing subscription URL:", error);
        }
      }
    }

    if (params.get("ref") === "class") {
      const classUrl = localStorage.getItem("selectedClassUrl");
      if (classUrl) {
        try {
          const parsedUrl = new URL(classUrl);
          const path = parsedUrl.pathname + parsedUrl.search;
          console.log("Redirecting to class URL:", path); // Debug log
          localStorage.removeItem("selectedClassUrl");
          return <Navigate to={path} />;
        } catch (error) {
          console.error("Error parsing class URL:", error);
        }
      }
    }

    if (params.get("ref") === "group") {
      const groupUrl = localStorage.getItem("selectedGroupUrl");
      if (
        groupUrl &&
        (groupUrl.includes("/groupDetailsTutor/") ||
          groupUrl.includes("/groupDetailsUser/") ||
          groupUrl.includes("/newGroupDetailsUser/"))
      ) {
        try {
          const parsedUrl = new URL(groupUrl);
          const path = parsedUrl.pathname + parsedUrl.search;
          console.log("Redirecting to group URL:", path); // Debug log
          localStorage.removeItem("selectedGroupUrl");
          return <Navigate to={path} />;
        } catch (error) {
          console.error("Error parsing group URL:", error);
          localStorage.removeItem("selectedGroupUrl"); // Always clear if error
        }
      } else {
        localStorage.removeItem("selectedGroupUrl"); // Clear if not valid
      }
    }

    // Default fallback redirect for logged-in users
    return <Navigate to="/learn" />;
  }

  // If user is not logged in, render the children (public content)
  return children;
};

export default PublicRoute;
