import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ClipLoader } from "react-spinners";
import { db } from "../../firebaseConfig";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import ProfileSetupClassCard from "../../components/ProfileSetupClassCard";
import ProfileSetupGroupCard from "../../components/ProfileSetupGroupCard";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../../context/LanguageContext";

const ProfileSetup = () => {
  const [currentView, setCurrentView] = useState("groups");
  const [groups, setGroups] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const { currentLanguage, changeLanguage } = useLanguage();

  // Apply language from navigation state and ensure it's properly set
  useEffect(() => {
    // Check if language was passed in navigation state or use the one from localStorage
    const languageToUse =
      location.state?.language || localStorage.getItem("i18nextLng") || "en";

    // Immediately apply the language to prevent flicker
    if (currentLanguage !== languageToUse) {
      changeLanguage(languageToUse);

      // Additional measure to ensure language is applied
      setTimeout(() => {
        if (i18n.language !== languageToUse) {
          i18n.changeLanguage(languageToUse);
          document.documentElement.lang = languageToUse;
        }
      }, 50);
    }

    // Ensure language is explicitly saved to localStorage
    localStorage.setItem("i18nextLng", languageToUse);
  }, [location.state, changeLanguage, currentLanguage, i18n]);

  // Handle language change with stronger persistence
  const handleLanguageChange = (lang) => {
    changeLanguage(lang);
    // Ensure immediate language switching
    i18n.changeLanguage(lang);
    // Double ensure persistence
    localStorage.setItem("i18nextLng", lang);
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    const fetchTopContent = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch random classes
        const classesQuery = query(
          collection(db, "classes"),
          where("availableSpots", ">", 0), // Only filter by availableSpots
          limit(3) // Limit the results
        );
        const classesSnapshot = await getDocs(classesQuery);
        const classesData = classesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const filteredClasses = classesData.filter(
          (cls) => !user?.enrolledClasses?.includes(cls.id)
        );
        setClasses(filteredClasses);

        // Fetch random groups
        const groupsQuery = query(
          collection(db, "groups"),
          where("isPremium", "==", false), // Only filter by isPremium
          limit(3) // Limit the results
        );

        const groupsSnapshot = await getDocs(groupsQuery);
        const groupsData = groupsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const filteredGroups = groupsData.filter(
          (group) => !user?.joinedGroups?.includes(group.id)
        );
        setGroups(filteredGroups);
      } catch (error) {
        console.error("Error fetching content:", error);
        setError("Failed to load content. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchTopContent();
  }, [user]);

  const handleSkip = () => {
    // Navigate to learn and include language preference
    navigate("/learn", {
      state: {
        fromSetup: true,
        language: currentLanguage,
      },
    });
  };

  const handleNext = () => {
    if (currentView === "groups") {
      setCurrentView("classes");
    } else {
      // Navigate to learn and include language preference
      navigate("/learn", {
        state: {
          fromSetup: true,
          language: currentLanguage,
        },
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <ClipLoader color="#14B82C" size={50} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gray-100">
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-base border border-[#5d5d5d] font-medium text-[#042f0c] bg-[#e6fde9] rounded-full hover:bg-[#ccfcd2]"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      {/* Language Selector */}
      <div className="absolute top-4 right-4">
        <select
          value={currentLanguage}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="px-2 py-1 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-1 focus:ring-green-500"
        >
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
      </div>

      <div className="w-full max-w-5xl px-4 py-8 mx-auto">
        <h1 className="mb-2 text-4xl font-bold text-center">
          {t("profileSetup.title", "Profile Setup")}
        </h1>
        <p className="mb-8 text-xl text-center text-gray-600">
          {currentView === "groups"
            ? t("profileSetup.joinGroups", "Let's join a few groups below.")
            : t("profileSetup.bookClasses", "Let's book a few classes below.")}
        </p>

        {/* Grid of cards */}
        <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-3">
          {currentView === "groups" ? (
            groups.length > 0 ? (
              groups.map((group) => (
                <ProfileSetupGroupCard key={group.id} group={group} />
              ))
            ) : (
              <div className="col-span-3 text-center text-gray-500">
                {t(
                  "profileSetup.noGroups",
                  "No groups available to join at the moment."
                )}
              </div>
            )
          ) : classes.length > 0 ? (
            classes.map((classItem) => (
              <ProfileSetupClassCard
                key={classItem.id}
                {...classItem}
                isBammbuu={Boolean(classItem.tutorId)}
              />
            ))
          ) : (
            <div className="col-span-3 text-center text-gray-500">
              {t(
                "profileSetup.noClasses",
                "No classes available to book at the moment."
              )}
            </div>
          )}
        </div>

        {/* Positioned tooltip based on current view */}
        <div
          className={`flex ${
            currentView === "groups" ? "justify-start" : "justify-center"
          } mt-8 mb-4`}
        >
          <div className="relative">
            <div className="p-5 bg-[#042F0C] text-white rounded-2xl max-w-md">
              <h3 className="mb-2 text-sm font-medium">
                {currentView === "groups"
                  ? t(
                      "profileSetup.tooltips.joinGroups.title",
                      "Join 1 or more language learning groups."
                    )
                  : t(
                      "profileSetup.tooltips.bookClasses.title",
                      "Book 1 or more classes."
                    )}
              </h3>
              <p className="mb-4 text-sm">
                {currentView === "groups"
                  ? t(
                      "profileSetup.tooltips.joinGroups.description",
                      "Description: Make the most out of bammbuu. Community language groups are free to create and join. They allow you to connect with native speakers to practice language through live conversation."
                    )
                  : t(
                      "profileSetup.tooltips.bookClasses.description",
                      "Book unlimited live group conversation classes hosted by certified language instructors for one monthly price. These classes are more structured and expert feedback is provided to help with your learning."
                    )}
              </p>
              <div className="flex items-center justify-between">
                <button
                  onClick={handleSkip}
                  className="text-white hover:underline"
                >
                  {t("profileSetup.buttons.skip", "Skip")}
                </button>
                <button
                  onClick={handleNext}
                  className="px-4 py-1 bg-white text-[#043D11] rounded-full hover:bg-opacity-90"
                >
                  {currentView === "groups"
                    ? t("profileSetup.buttons.nextStep", "Next (1/4)")
                    : t("profileSetup.buttons.nextStep2", "Next (2/4)")}
                </button>
              </div>
            </div>
            {/* Notch positioned to correspond with the correct card */}
            <div
              className={`absolute -top-2 ${
                currentView === "groups" ? "left-1/4" : "right-1/4"
              } transform ${
                currentView === "groups"
                  ? "-translate-x-1/2"
                  : "translate-x-1/2"
              }`}
            >
              <div className="w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-[#042F0C]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
