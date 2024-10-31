// src/pages/Unauthorized.js
import React from "react";
import { Link } from "react-router-dom";

const Unauthorized = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="max-w-md p-8 text-center bg-white rounded-lg shadow-lg">
        <h1 className="mb-4 text-3xl font-bold text-red-600">Access Denied</h1>
        <p className="mb-6 text-gray-600">
          You do not have permission to view this page.
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600"
        >
          Go to Home
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
