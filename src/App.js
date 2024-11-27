// src/App.js
import React from "react";
import { Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Learn from "./pages/Learn";
import Signup from "./pages/Signup";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext"; // Get useAuth in the component
import UserSettings from "./pages/UserSettings";
import Landing from "./pages/Landing";
import PublicRoute from "./components/PublicRoute"; // Import PublicRoute
import LanguageGroups from "./pages/LanguageGroups";
import SuperTutor from "./pages/SuperTutor";
import ClassesUser from "./pages/user/ClassesUser";
import GroupsUser from "./pages/user/GroupsUser";
import Unauthorized from "./pages/Unauthorized";
import GroupDetailUser from "./pages/user/GroupDetailUser";
import ClassesDetailsUser from "./pages/user/ClassesDetailsUser";

const App = () => {
  const { user } = useAuth(); // Use useAuth() inside the component

  return (
    <div className="font-urbanist">
      <ToastContainer position="top-right" autoClose={3000} />

      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          }
        />
        <Route
          path="/learn"
          element={
            <ProtectedRoute requiredRole="user">
              <Learn />
            </ProtectedRoute>
          }
        />
        <Route
          path="/languageGroups"
          element={
            <ProtectedRoute requiredRole="user">
              <LanguageGroups />
            </ProtectedRoute>
          }
        />

        <Route
          path="/superTutor"
          element={
            <ProtectedRoute requiredRole="tutor">
              <SuperTutor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute requiredRole="user">
              <UserSettings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/classesUser"
          element={
            <ProtectedRoute requiredRole="user">
              <ClassesUser />
            </ProtectedRoute>
          }
        />
        <Route
          path="/classesDetailsUser/:classId"
          element={
            <ProtectedRoute requiredRole="user">
              <ClassesDetailsUser />
            </ProtectedRoute>
          }
        />
        <Route
          path="/groupsUser"
          element={
            <ProtectedRoute requiredRole="user">
              <GroupsUser />
            </ProtectedRoute>
          }
        />
        <Route
          path="/groupDetailUser/:groupId"
          element={
            <ProtectedRoute requiredRole="user">
              <GroupDetailUser />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
};

export default App;
