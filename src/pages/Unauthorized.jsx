// src/pages/Unauthorized.js
import React from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Unauthorized = () => {
  const { user } = useAuth();
  // Defensive: if user is present and has a userType, redirect to /learn
  if (user && user.userType && user.userType !== "undefined") {
    return <Navigate to="/learn" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
        <h1 className="mb-4 text-3xl font-bold text-red-600">Access Denied</h1>
        <p className="mb-6 text-gray-600">
          You do not have permission to view this page.
        </p>
        <Link
          to="/"
          className="inline-block rounded-lg bg-blue-500 px-6 py-2 text-white hover:bg-blue-600"
        >
          Go to Home
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
