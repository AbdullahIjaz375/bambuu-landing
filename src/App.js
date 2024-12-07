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
import Landing from "./pages/Landing";
import PublicRoute from "./components/PublicRoute"; // Import PublicRoute
import LanguageGroups from "./pages/LanguageGroups";
import SuperTutor from "./pages/SuperTutor";
import ClassesUser from "./pages/user/ClassesUser";
import GroupsUser from "./pages/user/GroupsUser";
import Unauthorized from "./pages/Unauthorized";
import GroupDetailUser from "./pages/user/GroupDetailUser";
import ClassesDetailsUser from "./pages/user/ClassesDetailsUser";
import ForgotPassword from "./pages/ForgotPassword";
import LearnLanguageUser from "./pages/user/LearnLanguageUser";
import AddGroupsUser from "./pages/user/AddGroupsUser";
import ProfileUser from "./pages/user/ProfileUser";
import UserEditProfile from "./pages/user/UserEditProfile";
import UserSettings from "./pages/user/UserSettings";
import SuperTutorUser from "./pages/user/SuperTutorUser";
import CommunityUser from "./pages/user/CommunityUser";

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
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
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
          path="/superTutorUser"
          element={
            <ProtectedRoute requiredRole="user">
              <SuperTutorUser />
            </ProtectedRoute>
          }
        />

        <Route
          path="/communityUser"
          element={
            <ProtectedRoute requiredRole="user">
              <CommunityUser />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profileUser"
          element={
            <ProtectedRoute requiredRole="user">
              <ProfileUser />
            </ProtectedRoute>
          }
        />

        <Route
          path="/userEditProfile"
          element={
            <ProtectedRoute requiredRole="user">
              <UserEditProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/userSettings"
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
        <Route
          path="/addGroupsUser"
          element={
            <ProtectedRoute requiredRole="user">
              <AddGroupsUser />
            </ProtectedRoute>
          }
        />
        <Route
          path="/learnLanguageUser"
          element={
            <ProtectedRoute requiredRole="user">
              <LearnLanguageUser />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
};

export default App;
