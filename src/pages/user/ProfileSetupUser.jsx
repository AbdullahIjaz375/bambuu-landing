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
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useLanguage();

  useEffect(() => {
    const fetchTopContent = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch random classes
        const classesQuery = query(
          collection(db, "classes"),
          where("availableSpots", ">", 0), // Only filter by availableSpots
          limit(3), // Limit the results
        );
        const classesSnapshot = await getDocs(classesQuery);
        const classesData = classesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const filteredClasses = classesData.filter(
          (cls) => !user?.enrolledClasses?.includes(cls.id),
        );
        setClasses(filteredClasses);

        // Fetch random groups
        const groupsQuery = query(
          collection(db, "groups"),
          where("isPremium", "==", false), // Only filter by isPremium
          limit(3), // Limit the results
        );

        const groupsSnapshot = await getDocs(groupsQuery);
        const groupsData = groupsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const filteredGroups = groupsData.filter(
          (group) => !user?.joinedGroups?.includes(group.id),
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

  // Handle language change with context only
  const handleLanguageChange = (lang) => {
    changeLanguage(lang);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <ClipLoader color="#14B82C" size={50} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-100">
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-full border border-[#5d5d5d] bg-[#e6fde9] px-4 py-2 text-base font-medium text-[#042f0c] hover:bg-[#ccfcd2]"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
      {/* Language Selector */}
      <div className="absolute right-4 top-4">
        <select
          value={currentLanguage}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="rounded-full border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
        >
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <h1 className="mb-2 text-center text-4xl font-bold">
          {t("profileSetup.title", "Profile Setup")}
        </h1>
        <p className="mb-8 text-center text-xl text-gray-600">
          {currentView === "groups"
            ? t("profileSetup.joinGroups", "Let's join a few groups below.")
            : t("profileSetup.bookClasses", "Let's book a few classes below.")}
        </p>

        {/* Grid of cards */}
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          {currentView === "groups" ? (
            groups.length > 0 ? (
              groups.map((group) => (
                <ProfileSetupGroupCard key={group.id} group={group} />
              ))
            ) : (
              <div className="col-span-3 text-center text-gray-500">
                {t(
                  "profileSetup.noGroups",
                  "No groups available to join at the moment.",
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
                "No classes available to book at the moment.",
              )}
            </div>
          )}
        </div>

        {/* Positioned tooltip based on current view */}
        <div
          className={`flex ${
            currentView === "groups" ? "justify-start" : "justify-center"
          } mb-4 mt-8`}
        >
          <div className="relative">
            <div className="max-w-md rounded-2xl bg-[#042F0C] p-5 text-white">
              <h3 className="mb-2 text-sm font-medium">
                {currentView === "groups"
                  ? t(
                      "profileSetup.tooltips.joinGroups.title",
                      "Join 1 or more language learning groups.",
                    )
                  : t(
                      "profileSetup.tooltips.bookClasses.title",
                      "Book 1 or more classes.",
                    )}
              </h3>
              <p className="mb-4 text-sm">
                {currentView === "groups"
                  ? t(
                      "profileSetup.tooltips.joinGroups.description",
                      "Description: Make the most out of bammbuu. Community language groups are free to create and join. They allow you to connect with native speakers to practice language through live conversation.",
                    )
                  : t(
                      "profileSetup.tooltips.bookClasses.description",
                      "Book unlimited live group conversation classes hosted by certified language instructors for one monthly price. These classes are more structured and expert feedback is provided to help with your learning.",
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
                  className="rounded-full bg-white px-4 py-1 text-[#043D11] hover:bg-opacity-90"
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
              <div className="h-0 w-0 border-b-8 border-l-8 border-r-8 border-transparent border-b-[#042F0C]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
