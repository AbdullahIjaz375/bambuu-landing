// src/App.js
import React, { useEffect } from "react";
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
import PrivacyPolicyUser from "./pages/user/PrivacyPolicyUser";
import AboutBambuuUser from "./pages/user/AboutBambuuUser";
import LoginTutor from "./pages/LoginTutor";
import ProfileTutor from "./pages/tutor/ProfileTutor";
import EditProfileTutor from "./pages/tutor/EditProfileTutor";
import TutorSettings from "./pages/tutor/SettingsTutor";
import PrivacyPolicyTutor from "./pages/tutor/PrivacyPolicyTutor";
import AboutBambuuTutor from "./pages/tutor/AboutBambuuTutor";
import SavedResourcesTutor from "./pages/tutor/SavedResourcesTutor";
import StudentsTutor from "./pages/tutor/StudentsTutor";
import InstructorProfileUser from "./pages/user/InstructorProfileUser";
import BecomeAnExpertUser from "./pages/user/BecomeAnExpertUser";
import AddClassTutor from "./pages/tutor/AddClassTutor";
import ClassesTutor from "./pages/tutor/ClassesTutor";
import GroupsTutor from "./pages/tutor/GroupsTutor";
import GroupDetailsTutor from "./pages/tutor/GroupDetailsTutor";
import AddGroupsTutor from "./pages/tutor/AddGroupsTutor";
import { Chat } from "stream-chat-react";
import GroupDetailsNotJoinedUser from "./pages/user/GroupDetailsNotJoinedUser";
import ClassDetailsUser from "./pages/user/ClassDetailsUser";
import ClassDetailsNotJoinedUser from "./pages/user/ClassDetailsNotJoinedUser";
import ClassDetailsTutor from "./pages/tutor/ClassDetailsTutor";
import ExploreClassesUser from "./pages/user/ExploreClassesUser";
import ExploreGroupsUser from "./pages/user/ExploreGroupsUser";
import VideoCall from "./pages/user/VideoCall";
import { Video } from "lucide-react";
import BammbuuPlusGroupsUser from "./pages/user/BammbuuPlusGroupsUser";
import SingupSplash from "./pages/SignupSplash";
import EditGroupsUser from "./pages/user/EditGroupUser";
import EditGroupsTutor from "./pages/tutor/EditGroupTutor";
import EditClassPage from "./pages/tutor/EditClassDetails";
import ProfileSetup from "./pages/user/ProfileSetupUser";
import DeleteAccout from "./pages/user/DeleteAccout";
import TutorDeleteAccount from "./pages/tutor/TutorDeleteAccount";
import { ClassProvider } from "./context/ClassContext";
import VideoCallTutor from "./pages/tutor/VideoCallTutor";
import LanguagesUser from "./pages/user/LanguagesUser";
import { messaging } from "./firebaseConfig";
import { toast } from "react-toastify";
import { onMessage } from "firebase/messaging";

const App = () => {
  const { user, streamClient } = useAuth(); // Use useAuth() inside the component

  useEffect(() => {
    // This listener gets triggered when a new message arrives in the foreground.
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("Foreground message received:", payload);
      if (payload.notification) {
        const { title, body } = payload.notification;

        // For example, show a toast. Or you could show a custom in-app alert.
        toast.info(`${title} - ${body}`);
      }
    });

    // Clean up the listener on unmount
    return () => unsubscribe();
  }, []);
  if (!streamClient) {
    return <div>Loading...</div>;
  }

  return (
    <Chat client={streamClient}>
      <ClassProvider>
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
              path="/login-tutor"
              element={
                <PublicRoute>
                  <LoginTutor />
                </PublicRoute>
              }
            />
            <Route path="/signup" element={<Signup />} />
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
                <ProtectedRoute requiredRole={["student", "tutor"]}>
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
              path="/communityUser/:channelId?"
              element={
                <ProtectedRoute requiredRole="student">
                  <CommunityUser />
                </ProtectedRoute>
              }
            />

            <Route
              path="/studentsTutor"
              element={
                <ProtectedRoute requiredRole="tutor">
                  <StudentsTutor />
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
              path="/addClassTutor"
              element={
                <ProtectedRoute requiredRole="tutor">
                  <AddClassTutor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tutor/:tutorId"
              element={
                <ProtectedRoute requiredRole="student">
                  <InstructorProfileUser />
                </ProtectedRoute>
              }
            />
            <Route
              path="/becomeAnExpert"
              element={
                <ProtectedRoute requiredRole="student">
                  <BecomeAnExpertUser />
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
              path="/savedRecourcesTutor"
              element={
                <ProtectedRoute requiredRole="tutor">
                  <SavedResourcesTutor />
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
              path="/profileTutor"
              element={
                <ProtectedRoute requiredRole="tutor">
                  <ProfileTutor />
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
              path="/tutorEditProfile"
              element={
                <ProtectedRoute requiredRole="tutor">
                  <EditProfileTutor />
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
              path="/tutorSettings"
              element={
                <ProtectedRoute requiredRole="tutor">
                  <TutorSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/privacyPolicyUser"
              element={
                <ProtectedRoute requiredRole="student">
                  <PrivacyPolicyUser />
                </ProtectedRoute>
              }
            />

            <Route
              path="/privacyPolicyTutor"
              element={
                <ProtectedRoute requiredRole="tutor">
                  <PrivacyPolicyTutor />
                </ProtectedRoute>
              }
            />

            <Route
              path="/aboutBambuuUser"
              element={
                <ProtectedRoute requiredRole="student">
                  <AboutBambuuUser />
                </ProtectedRoute>
              }
            />
            <Route
              path="/aboutBambuuTutor"
              element={
                <ProtectedRoute requiredRole="tutor">
                  <AboutBambuuTutor />
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
              path="/classDetailsUser/:classId"
              element={
                <ProtectedRoute requiredRole="student">
                  <ClassDetailsUser />
                </ProtectedRoute>
              }
            />
            <Route
              path="/classDetailsTutor/:classId"
              element={
                <ProtectedRoute requiredRole="tutor">
                  <ClassDetailsTutor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/newClassDetailsUser/:classId"
              element={
                <ProtectedRoute requiredRole="student">
                  <ClassDetailsNotJoinedUser />
                </ProtectedRoute>
              }
            />
            <Route
              path="/classesTutor"
              element={
                <ProtectedRoute requiredRole="tutor">
                  <ClassesTutor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/exploreClassesUser"
              element={
                <ProtectedRoute requiredRole="student">
                  <ExploreClassesUser />
                </ProtectedRoute>
              }
            />
            <Route
              path="/exploreGroupsUser"
              element={
                <ProtectedRoute requiredRole="student">
                  <ExploreGroupsUser />
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
              path="/groupsTutor"
              element={
                <ProtectedRoute requiredRole="tutor">
                  <GroupsTutor />
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
              path="/newGroupDetailsUser/:groupId"
              element={
                <ProtectedRoute requiredRole="student">
                  <GroupDetailsNotJoinedUser />
                </ProtectedRoute>
              }
            />
            <Route
              path="/groupDetailsTutor/:groupId"
              element={
                <ProtectedRoute requiredRole="tutor">
                  <GroupDetailsTutor />
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
              path="/addGroupsTutor"
              element={
                <ProtectedRoute requiredRole="tutor">
                  <AddGroupsTutor />
                </ProtectedRoute>
              }
            />

            <Route
              path="/onboarding"
              element={
                <ProtectedRoute requiredRole="student">
                  <SingupSplash />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile-setup"
              element={
                <ProtectedRoute requiredRole="student">
                  <ProfileSetup />
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

            <Route
              path="/languages"
              element={
                <ProtectedRoute requiredRole="student">
                  <LanguagesUser />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bammbuuPlusGroupsUser"
              element={
                <ProtectedRoute requiredRole="student">
                  <BammbuuPlusGroupsUser />
                </ProtectedRoute>
              }
            />
            <Route
              path="/call"
              element={
                <ProtectedRoute requiredRole="student">
                  <VideoCall />
                </ProtectedRoute>
              }
            />
            <Route
              path="/callTutor"
              element={
                <ProtectedRoute requiredRole="tutor">
                  <VideoCallTutor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/editGroup/:groupId"
              element={
                <ProtectedRoute requiredRole="student">
                  {<EditGroupsUser />}
                </ProtectedRoute>
              }
            />
            <Route
              path="/editGroupTutor/:groupId"
              element={
                <ProtectedRoute requiredRole="tutor">
                  {<EditGroupsTutor />}
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit-class/:classId"
              element={
                <ProtectedRoute requiredRole="tutor">
                  {<EditClassPage />}
                </ProtectedRoute>
              }
            />

            <Route
              path="/deleteAccountTutor"
              element={
                <ProtectedRoute requiredRole={["tutor"]}>
                  <TutorDeleteAccount />
                </ProtectedRoute>
              }
            />

            <Route
              path="/deleteAccount"
              element={
                <ProtectedRoute requiredRole={["student"]}>
                  <DeleteAccout />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </ClassProvider>
    </Chat>
  );
};

export default App;
