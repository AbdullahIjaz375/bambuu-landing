import React, { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import LearnTutor from "./tutor/LearnTutor";
import LearnUser from "./user/LearnUser";
import { useLocation } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import i18n from "../i18n";

const Learn = () => {
  const { user } = useAuth();
  const userType = sessionStorage.getItem("userType");
  const location = useLocation();
  const { currentLanguage, changeLanguage } = useLanguage();

  // Ensure language is consistent when directed to this page
  useEffect(() => {
    // Check if language was passed in the location state (from profile setup or signup)
    if (location.state?.language) {
      const languageFromState = location.state.language;

      // Only change if it's different from current
      if (languageFromState !== currentLanguage) {
        changeLanguage(languageFromState);
        i18n.changeLanguage(languageFromState);
        localStorage.setItem("i18nextLng", languageFromState);
        document.documentElement.lang = languageFromState;
      }
    }
  }, [location.state, currentLanguage, changeLanguage]);

  // If user is not found, handle it (e.g., redirect to login)
  if (!user) {
    return <div>Please log in to view your courses.</div>;
  }

  // Pass all location props (including state with language) to child components
  return (
    <>
      {userType === "student" && <LearnUser key={location.key} {...location} />}
      {userType === "tutor" && <LearnTutor key={location.key} {...location} />}
    </>
  );
};

export default Learn;
