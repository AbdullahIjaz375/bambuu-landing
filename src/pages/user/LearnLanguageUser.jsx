import { Search } from "lucide-react";
import React, { useState, useEffect } from "react";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Users,
  BookOpen,
  Star,
  Database,
  UserCircle,
  User,
  ArrowLeft,
} from "lucide-react";
import Sidebar from "../../components/Sidebar";
import ClassCard from "../../components/ClassCard";
import { useAuth } from "../../context/AuthContext";
import GroupCard from "../../components/GroupCard";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebaseConfig";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { ClipLoader } from "react-spinners";
import ExploreClassCard from "../../components/ExploreClassCard";
import ExploreGroupCard from "../../components/ExploreGroupCard";

const LearnLanguageUser = () => {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState("myBambuu");
  const navigate = useNavigate();

  // States for My Classes and Groups
  const [myClasses, setMyClasses] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [error, setError] = useState(null);
  const [errorGroups, setErrorGroups] = useState(null);

  // States for Explore Classes and Groups
  const [exploreClasses, setExploreClasses] = useState([]);
  const [exploreGroups, setExploreGroups] = useState([]);
  const [loadingExplore, setLoadingExplore] = useState(true);
  const [errorExplore, setErrorExplore] = useState(null);

  // Fetch My Classes
  useEffect(() => {
    const fetchMyClasses = async () => {
      if (!user || !user.enrolledClasses) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const classesData = [];

      try {
        for (const classId of user.enrolledClasses) {
          const classRef = doc(db, "classes", classId);
          const classDoc = await getDoc(classRef);

          if (classDoc.exists()) {
            classesData.push({ id: classId, ...classDoc.data() });
          }
        }
        setMyClasses(classesData);
      } catch (error) {
        console.error("Error fetching classes:", error);
        setError(
          "Unable to fetch classes at this time. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMyClasses();
  }, [user]);

  // Fetch My Groups
  useEffect(() => {
    const fetchMyGroups = async () => {
      if (!user?.joinedGroups?.length) {
        setLoadingGroups(false);
        return;
      }

      try {
        const fetchedGroups = [];
        const groupsToFetch = user.joinedGroups;

        for (let groupId of groupsToFetch) {
          const groupRef = doc(db, "groups", groupId);
          const groupDoc = await getDoc(groupRef);

          if (groupDoc.exists()) {
            fetchedGroups.push({ id: groupDoc.id, ...groupDoc.data() });
          }
        }

        setMyGroups(fetchedGroups);
        setErrorGroups(null);
      } catch (error) {
        console.error("Error fetching groups:", error);
        setErrorGroups("Failed to load groups. Please try again.");
      } finally {
        setLoadingGroups(false);
      }
    };

    fetchMyGroups();
  }, [user]);

  // Fetch Explore Classes and Groups
  useEffect(() => {
    const fetchExploreContent = async () => {
      if (activeTab !== "exploreBambuu") return;

      setLoadingExplore(true);
      try {
        // Fetch all classes
        const classesSnapshot = await getDocs(collection(db, "classes"));
        const allClasses = classesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Filter out enrolled classes
        const otherClasses = allClasses.filter(
          (cls) => !user?.enrolledClasses?.includes(cls.id)
        );
        setExploreClasses(otherClasses);

        // Fetch all groups
        const groupsSnapshot = await getDocs(collection(db, "groups"));
        const allGroups = groupsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Filter out joined groups
        const otherGroups = allGroups.filter(
          (group) => !user?.joinedGroups?.includes(group.id)
        );
        setExploreGroups(otherGroups);
        console.log(exploreClasses);
        setErrorExplore(null);
      } catch (error) {
        console.error("Error fetching explore content:", error);
        setErrorExplore("Failed to load content. Please try again.");
      } finally {
        setLoadingExplore(false);
      }
    };

    fetchExploreContent();
  }, [activeTab, user]);

  const handleBack = () => {
    navigate(-1);
  };

  const renderContent = () => {
    if (activeTab === "myBambuu") {
      return (
        <>
          {/* My Classes Section */}
          <div className="w-full max-w-[160vh] mx-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">My Classes</h2>
              {myClasses.length > 0 && (
                <button
                  className="px-4 py-2 text-base border border-[#5d5d5d] font-medium text-[#042f0c] bg-[#e6fde9] rounded-full hover:bg-[#ccfcd2]"
                  onClick={() => navigate("/classesUser")}
                >
                  View All
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-48">
                <ClipLoader color="#14B82C" size={50} />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-white rounded-lg">
                <p className="text-center text-red-500">{error}</p>
                <button
                  className="px-4 py-2 text-base border border-[#5d5d5d] font-medium text-[#042f0c] bg-[#e6fde9] rounded-full hover:bg-[#ccfcd2]"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </button>
              </div>
            ) : myClasses.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-white rounded-lg">
                <img
                  alt="bambuu"
                  src="/images/no-class.png"
                  className="w-auto h-auto"
                />
                <p className="text-center text-gray-600">
                  You have not booked a class yet!
                </p>
              </div>
            ) : (
              <div className="relative w-full">
                <div className="flex gap-2 pb-4 overflow-x-auto scrollbar-hide">
                  {myClasses.map((classItem) => (
                    <div key={classItem.id} className="flex-none px-1 pt-3 ">
                      <ClassCard
                        {...classItem}
                        isBammbuu={Boolean(classItem.tutorId)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* My Groups Section */}
          <div className="w-full max-w-[160vh] mx-auto">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-2xl font-bold">My Groups</h2>
              {myGroups.length > 0 && (
                <button
                  className="px-4 py-2 text-base border border-[#5d5d5d] font-medium text-[#042f0c] bg-[#e6fde9] rounded-full hover:bg-[#ccfcd2]"
                  onClick={() => navigate("/groupsUser")}
                >
                  View All
                </button>
              )}
            </div>

            {loadingGroups ? (
              <div className="flex items-center justify-center h-48">
                <ClipLoader color="#14B82C" size={50} />
              </div>
            ) : errorGroups ? (
              <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-white rounded-lg">
                <p className="text-center text-red-500">{errorGroups}</p>
                <button
                  className="px-4 py-2 text-base border border-[#5d5d5d] font-medium text-[#042f0c] bg-[#e6fde9] rounded-full hover:bg-[#ccfcd2]"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </button>
              </div>
            ) : myGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-white rounded-lg">
                <img
                  alt="No groups"
                  src="/images/no-class.png"
                  className="w-auto h-auto"
                />
                <p className="text-center text-gray-600">
                  You are not part of any group yet!
                </p>
                <div className="flex flex-row items-center justify-center space-x-4">
                  <button
                    onClick={() => navigate("/groupsUser")}
                    className="px-4 py-2 text-base border border-[#5d5d5d] font-medium text-[#042f0c] bg-[#e6fde9] rounded-full hover:bg-[#ccfcd2]"
                  >
                    Create a Group
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative w-full">
                <div className="flex gap-2 pb-4 overflow-x-auto scrollbar-hide">
                  {myGroups.map((group) => (
                    <div key={group.id} className="flex-none px-1 pt-2">
                      <GroupCard group={group} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      );
    } else {
      return (
        <>
          {/* Explore Classes Section */}
          <div className="w-full max-w-[160vh] mx-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Explore Classes</h2>
              {exploreClasses.length > 0 && (
                <button
                  className="px-4 py-2 text-base border border-[#5d5d5d] font-medium text-[#042f0c] bg-[#e6fde9] rounded-full hover:bg-[#ccfcd2]"
                  onClick={() => navigate("/exploreClassesUser")}
                >
                  View All
                </button>
              )}
            </div>

            {loadingExplore ? (
              <div className="flex items-center justify-center h-48">
                <ClipLoader color="#14B82C" size={50} />
              </div>
            ) : errorExplore ? (
              <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-white rounded-lg">
                <p className="text-center text-red-500">{errorExplore}</p>
                <button
                  className="px-4 py-2 text-base border border-[#5d5d5d] font-medium text-[#042f0c] bg-[#e6fde9] rounded-full hover:bg-[#ccfcd2]"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </button>
              </div>
            ) : exploreClasses.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-white rounded-lg">
                <img
                  alt="No classes"
                  src="/images/no-class.png"
                  className="w-auto h-auto"
                />
                <p className="text-center text-gray-600">
                  No available classes to explore at the moment!
                </p>
              </div>
            ) : (
              <div className="relative w-full">
                <div className="flex gap-2 pb-4 overflow-x-auto scrollbar-hide">
                  {exploreClasses.map((classItem) => (
                    <div key={classItem.id} className="flex-none px-1 pt-3 ">
                      <ExploreClassCard
                        {...classItem}
                        isBammbuu={Boolean(classItem.tutorId)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Explore Groups Section */}
          <div className="w-full max-w-[160vh] mx-auto mt-8">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-2xl font-bold">Explore Groups</h2>
              {exploreGroups.length > 0 && (
                <button
                  className="px-4 py-2 text-base border border-[#5d5d5d] font-medium text-[#042f0c] bg-[#e6fde9] rounded-full hover:bg-[#ccfcd2]"
                  onClick={() => navigate("/exploreGroupsUser")}
                >
                  View All
                </button>
              )}
            </div>

            {loadingExplore ? (
              <div className="flex items-center justify-center h-48">
                <ClipLoader color="#14B82C" size={50} />
              </div>
            ) : errorExplore ? (
              <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-white rounded-lg">
                <p className="text-center text-red-500">{errorExplore}</p>
                <button
                  className="px-4 py-2 text-base border border-[#5d5d5d] font-medium text-[#042f0c] bg-[#e6fde9] rounded-full hover:bg-[#ccfcd2]"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </button>
              </div>
            ) : exploreGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-white rounded-lg">
                <img
                  alt="No groups"
                  src="/images/no-class.png"
                  className="w-auto h-auto"
                />
                <p className="text-center text-gray-600">
                  No available groups to explore at the moment!
                </p>
              </div>
            ) : (
              <div className="relative w-full">
                <div className="flex gap-2 pb-4 overflow-x-auto scrollbar-hide">
                  {exploreGroups.map((group) => (
                    <div key={group.id} className="flex-none px-1 pt-2">
                      <ExploreGroupCard group={group} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      );
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <Sidebar user={user} />

      {/* Main Content */}
      <div className="flex-1 p-8 bg-white border-2 border-[#e7e7e7] rounded-3xl ml-[17rem] m-2">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b">
          <div className="flex items-center gap-4">
            <button
              className="p-3 bg-gray-100 rounded-full"
              onClick={handleBack}
            >
              <ArrowLeft size="30" />
            </button>
            <h1 className="text-4xl font-semibold">Learn Language</h1>
          </div>
          <div className="flex flex-row items-center justify-center space-x-4">
            <div className="flex justify-center">
              <div className="inline-flex bg-gray-100 border border-gray-300 rounded-full">
                <button
                  onClick={() => setActiveTab("myBambuu")}
                  className={`px-6 py-2 rounded-full text-[#042F0C] text-md font-medium transition-colors
            ${
              activeTab === "myBambuu"
                ? "bg-[#FFBF00] border border-[#042F0C]"
                : "bg-transparent"
            }`}
                >
                  My Bambuuu
                </button>
                <button
                  onClick={() => setActiveTab("exploreBambuu")}
                  className={`px-6 py-2 rounded-full text-[#042F0C] text-md font-medium transition-colors
            ${
              activeTab === "exploreBambuu"
                ? "bg-[#FFBF00] border border-[#042F0C]"
                : "bg-transparent"
            }`}
                >
                  Explore Bambuuu
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {renderContent()}
      </div>
    </div>
  );
};

export default LearnLanguageUser;
