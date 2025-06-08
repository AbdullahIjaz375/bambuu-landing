// src/components/PublicRoute.js
import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  // If user is logged in, check for redirect paths and navigate accordingly
  if (user) {
    // Check if user is in mobile modal flow and should not be redirected
    const inMobileFlow = localStorage.getItem("inMobileModalFlow");
    if (inMobileFlow === "true") {
      // Don't redirect if user is in mobile modal flow
      return children;
    }

    // Check for sessionStorage redirect path first (this is most reliable)
    const redirectPath = sessionStorage.getItem("redirectAfterLogin");

    if (redirectPath) {
      sessionStorage.removeItem("redirectAfterLogin");
      if (isValidRedirectPath(redirectPath)) {
        return <Navigate to={redirectPath} />;
      } else {
        return <Navigate to="/learn" />;
      }
    }

    // Check for backup full URL in localStorage
    const fullRedirectUrl = localStorage.getItem("fullRedirectUrl");
    if (fullRedirectUrl) {
      try {
        const parsedUrl = new URL(fullRedirectUrl);
        const path = parsedUrl.pathname + parsedUrl.search + parsedUrl.hash;
        localStorage.removeItem("fullRedirectUrl");
        if (isValidRedirectPath(path)) {
          return <Navigate to={path} />;
        } else {
          return <Navigate to="/learn" />;
        }
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
          localStorage.removeItem("selectedPackageUrl");
          if (isValidRedirectPath(path)) {
            return <Navigate to={path} />;
          } else {
            return <Navigate to="/learn" />;
          }
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
          localStorage.removeItem("selectedClassUrl");
          if (isValidRedirectPath(path)) {
            return <Navigate to={path} />;
          } else {
            return <Navigate to="/learn" />;
          }
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
          localStorage.removeItem("selectedGroupUrl");
          if (isValidRedirectPath(path)) {
            return <Navigate to={path} />;
          } else {
            return <Navigate to="/learn" />;
          }
        } catch (error) {
          console.error("Error parsing group URL:", error);
          localStorage.removeItem("selectedGroupUrl"); // Always clear if error
        }
      } else {
        localStorage.removeItem("selectedGroupUrl"); // Clear if not valid
      }
    }

    // If user is on /login or /signup, redirect to /learn
    if (location.pathname === "/login" || location.pathname === "/signup") {
      return <Navigate to="/learn" />;
    }

    // Default fallback redirect for logged-in users
    return <Navigate to="/learn" />;
  }

  // If user is not logged in, render the children (public content)
  return children;
};

export default PublicRoute;
