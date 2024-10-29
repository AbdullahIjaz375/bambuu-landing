// src/pages/Landing.js
import React from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { db, auth } from "../firebaseConfig";

const Landing = () => {
  const { user } = useAuth(); // Use useAuth() inside the component

  return (
    <>
      <Navbar user={auth.currentUser} />
      <div className="container p-6 mx-auto text-center">
        <h1 className="text-4xl font-bold">Welcome to Our App</h1>
        <p className="mt-4 text-lg text-gray-700">
          Discover our features and how we can help you.
        </p>
      </div>
    </>
  );
};

export default Landing;
