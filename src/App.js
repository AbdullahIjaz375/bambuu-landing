// src/App.js
import React from "react";
import { Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Landing from "./pages/Landing";

const App = () => {
  return (
    <div className="font-urbanist">
      <ToastContainer position="top-right" autoClose={3000} />

      <Routes>
        <Route path="/" element={<Landing />} />
      </Routes>
    </div>
  );
};

export default App;
