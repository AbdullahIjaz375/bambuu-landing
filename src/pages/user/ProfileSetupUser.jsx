
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ClipLoader } from "react-spinners";
import { db } from "../../firebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
} from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import ProfileSetupClassCard from "../../components/ProfileSetupClassCard";
import ProfileSetupGroupCard from "../../components/ProfileSetupGroupCard";

const ProfileSetup = () => {
  const [currentView, setCurrentView] = useState("groups");
  const [groups, setGroups] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

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
    // Navigate to learn and include fromSetup=true to indicate we're coming from setup
    navigate("/learn?fromSetup=true");
  };

  const handleNext = () => {
    if (currentView === "groups") {
      setCurrentView("classes");
    } else {
      // Navigate to learn and include fromSetup=true to indicate we're coming from setup
      navigate("/learn?fromSetup=true");
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
  const TooltipOverlay = () => {
    const noContentMessage =
      currentView === "groups"
        ? groups.length === 0
          ? "No groups currently available."
          : "Join 1 or more groups."
        : classes.length === 0
        ? "No classes currently available."
        : "Book 1 or more Classes";

    const tooltipDescription =
      currentView === "groups"
        ? "Make the most out of bammbuu. Learn and practice languages through conversation."
        : "Book unlimited live group conversation classes hosted by certified language instructors for one monthly price. These classes are more structured and expert feedback is provided to help with your learning.";

    return (
      <div className="absolute z-50 transform -translate-y-full left-4 top-4">
        <div className="p-5 bg-[#042F0C] text-white rounded-2xl w-96">
          <h3 className="mb-2 text-sm font-medium">{noContentMessage}</h3>
          {/* Conditionally render the description only if there are groups or classes */}
          {(currentView === "groups" && groups.length > 0) ||
          (currentView === "classes" && classes.length > 0) ? (
            <p className="mb-4 text-sm">{tooltipDescription}</p>
          ) : null}
          <div className="flex items-center justify-between">
            <button onClick={handleSkip} className="text-white hover:underline">
              Skip
            </button>
            <div className="flex items-center gap-4">
              <button
                onClick={handleNext}
                className="px-4 py-1 bg-white text-[#043D11] rounded-full hover:bg-opacity-90"
              >
                {currentView === "groups" ? "Next (1/2)" : "Next (2/2)"}
              </button>
            </div>
          </div>
        </div>
        <div className="absolute -bottom-2 left-12">
          <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-[#042F0C]" />
        </div>
      </div>
    );
  };
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-5xl px-4 py-8 mx-auto">
        <h1 className="mb-2 text-4xl font-bold text-center">Profile Setup</h1>
        <p className="mb-8 text-xl text-center text-gray-600">
          {currentView === "groups"
            ? "Let's join a few groups below."
            : "Let's book a few classes below."}
        </p>
        <div className="relative my-20">
          {currentView === "groups" ? (
            <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-3">
              {groups.length > 0 ? (
                groups.map((group) => (
                  <ProfileSetupGroupCard key={group.id} group={group} />
                ))
              ) : (
                <div className="col-span-3 text-center text-gray-500">
                  No groups available to join at the moment.
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-3">
              {classes.length > 0 ? (
                classes.map((classItem) => (
                  <ProfileSetupClassCard
                    key={classItem.id}
                    {...classItem}
                    isBammbuu={Boolean(classItem.tutorId)}
                  />
                ))
              ) : (
                <div className="col-span-3 text-center text-gray-500">
                  No classes available to book at the moment.
                </div>
              )}
            </div>
          )}
          <TooltipOverlay />
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;