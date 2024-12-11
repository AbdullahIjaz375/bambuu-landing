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
import Splash from "./pages/Splash";
import LanguageExpertsUser from "./pages/user/LanguageExpertsUser";
import SavedRecourcesUser from "./pages/user/SavedRecourcesUser";

const App = () => {
  const { user } = useAuth(); // Use useAuth() inside the component

  return (
    <div className="font-urbanist">
      <ToastContainer position="top-right" autoClose={3000} />

      <Routes>
        <Route
          path="/"
          element={
            <PublicRoute>
              <Splash />
            </PublicRoute>
          }
        />
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
            <ProtectedRoute requiredRole="student">
              <Learn />
            </ProtectedRoute>
          }
        />
        <Route
          path="/languageGroups"
          element={
            <ProtectedRoute requiredRole="student">
              <LanguageGroups />
            </ProtectedRoute>
          }
        />

        <Route
          path="/superTutorUser"
          element={
            <ProtectedRoute requiredRole="student">
              <SuperTutorUser />
            </ProtectedRoute>
          }
        />

        <Route
          path="/communityUser"
          element={
            <ProtectedRoute requiredRole="student">
              <CommunityUser />
            </ProtectedRoute>
          }
        />
        <Route
          path="/languageExpertsUser"
          element={
            <ProtectedRoute requiredRole="student">
              <LanguageExpertsUser />
            </ProtectedRoute>
          }
        />
        <Route
          path="/savedRecourcesUser"
          element={
            <ProtectedRoute requiredRole="student">
              <SavedRecourcesUser />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profileUser"
          element={
            <ProtectedRoute requiredRole="student">
              <ProfileUser />
            </ProtectedRoute>
          }
        />

        <Route
          path="/userEditProfile"
          element={
            <ProtectedRoute requiredRole="student">
              <UserEditProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/userSettings"
          element={
            <ProtectedRoute requiredRole="student">
              <UserSettings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/classesUser"
          element={
            <ProtectedRoute requiredRole="student">
              <ClassesUser />
            </ProtectedRoute>
          }
        />
        <Route
          path="/classesDetailsUser/:classId"
          element={
            <ProtectedRoute requiredRole="student">
              <ClassesDetailsUser />
            </ProtectedRoute>
          }
        />

        <Route
          path="/groupsUser"
          element={
            <ProtectedRoute requiredRole="student">
              <GroupsUser />
            </ProtectedRoute>
          }
        />

        <Route
          path="/groupDetailsUser/:groupId"
          element={
            <ProtectedRoute requiredRole="student">
              <GroupDetailUser />
            </ProtectedRoute>
          }
        />
        <Route
          path="/addGroupsUser"
          element={
            <ProtectedRoute requiredRole="student">
              <AddGroupsUser />
            </ProtectedRoute>
          }
        />
        <Route
          path="/learnLanguageUser"
          element={
            <ProtectedRoute requiredRole="student">
              <LearnLanguageUser />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
};

export default App;
