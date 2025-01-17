import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ClipLoader } from "react-spinners";
import { db } from "../../firebaseConfig";
import { collection, getDocs, query, limit, orderBy } from "firebase/firestore";
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
        // Fetch top 3 classes
        const classesQuery = query(
          collection(db, "classes"),
          orderBy("createdAt", "desc"),
          limit(3)
        );
        const classesSnapshot = await getDocs(classesQuery);
        const classesData = classesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Filter out enrolled classes
        const filteredClasses = classesData.filter(
          (cls) => !user?.enrolledClasses?.includes(cls.id)
        );
        setClasses(filteredClasses);

        // Fetch top 3 groups
        const groupsQuery = query(
          collection(db, "groups"),
          orderBy("createdAt", "desc"),
          limit(3)
        );

        console.log(groups);
        const groupsSnapshot = await getDocs(groupsQuery);
        const groupsData = groupsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log(groupsData);

        // Filter out joined groups
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
    navigate("/learn");
  };

  const handleNext = () => {
    if (currentView === "groups") {
      setCurrentView("classes");
    } else {
      navigate("/learn");
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
      <div className="w-full max-w-5xl px-4 py-8 mx-auto">
        <h1 className="mb-2 text-4xl font-bold text-center">Profile Setup</h1>
        <p className="mb-8 text-xl text-center text-gray-600">
          {currentView === "groups"
            ? "Let's join a few groups below."
            : "Let's book a few classes below."}
        </p>
        <div className="my-20">
          {/* Content Display */}
          {currentView === "groups" ? (
            groups.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-white rounded-lg">
                <img
                  alt="No groups"
                  src="/images/no-class.png"
                  className="w-auto h-auto"
                />
                <p className="text-center text-gray-600">
                  No groups available at the moment!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-3">
                {groups.map((group) => (
                  <ProfileSetupGroupCard key={group.id} group={group} />
                ))}
              </div>
            )
          ) : classes.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-white rounded-lg">
              <img
                alt="No classes"
                src="/images/no-class.png"
                className="w-auto h-auto"
              />
              <p className="text-center text-gray-600">
                No classes available at the moment!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-3">
              {classes.map((classItem) => (
                <ProfileSetupClassCard
                  key={classItem.id}
                  {...classItem}
                  isBammbuu={Boolean(classItem.tutorId)}
                />
              ))}
            </div>
          )}
        </div>
        {/* Navigation Buttons */}
        <div className="flex justify-between gap-4 mt-8 text-lg">
          <button
            onClick={handleSkip}
            className="px-12 py-2 text-black bg-white border border-black rounded-full hover:bg-gray-50"
          >
            Skip Now
          </button>
          <button
            onClick={handleNext}
            className="px-12 py-2 text-[#042F0C] bg-[#14B82C] border border-[#042F0C] rounded-full"
          >
            {currentView === "groups" ? "Next" : "Finish"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
