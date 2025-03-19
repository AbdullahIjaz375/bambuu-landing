import React from "react";
import { useAuth } from "../context/AuthContext";
import LearnTutor from "./tutor/LearnTutor";
import LearnUser from "./user/LearnUser";
import { useLocation } from "react-router-dom";

const Learn = () => {
  const { user } = useAuth();
  const userType = sessionStorage.getItem("userType");
  const location = useLocation();
  
  // If user is not found, handle it (e.g., redirect to login)
  if (!user) {
    return <div>Please log in to view your courses.</div>;
  }

  // We'll pass the query parameters directly to the child components
  // This ensures the fromSetup parameter is passed to LearnUser
  
  return (
    <>
      {userType === "student" && <LearnUser />}
      {userType === "tutor" && <LearnTutor />}
    </>
  );
};

export default Learn;