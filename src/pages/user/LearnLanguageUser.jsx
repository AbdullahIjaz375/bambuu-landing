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
import { doc, getDoc } from "firebase/firestore";
import { ClipLoader } from "react-spinners";
const LearnLanguageUser = () => {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState("myBambuu");

  const navigate = useNavigate();

  //---------------------------------getting my classes--------------------------------------------//

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClasses = async () => {
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
            const classData = classDoc.data();
            classesData.push({ id: classId, ...classData });
          }
        }
        setClasses(classesData);
      } catch (error) {
        console.error("Error fetching classes:", error);
        setError(
          "Unable to fetch classes at this time. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [user]);

  //------------------------------------getting my groups-------------------------------------------//
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [errorGroups, setErrorGroups] = useState(null);

  useEffect(() => {
    const fetchGroups = async () => {
      if (!user?.joinedGroups?.length) {
        setLoadingGroups(false);
        return;
      }

      try {
        const fetchedGroups = [];
        const groupsToFetch = user.joinedGroups.slice(0, 6);

        for (let groupId of groupsToFetch) {
          const groupRef = doc(db, "groups", groupId);
          const groupDoc = await getDoc(groupRef);

          if (groupDoc.exists()) {
            fetchedGroups.push({
              id: groupDoc.id,
              ...groupDoc.data(),
            });
          }
        }

        setGroups(fetchedGroups);
        setErrorGroups(null);
      } catch (error) {
        console.error("Error fetching groups:", error);
        setErrorGroups("Failed to load groups. Please try again.");
      } finally {
        setLoadingGroups(false);
      }
    };

    fetchGroups();
  }, [user]);

  //---------------------------navigation---------------------------------------------------//

  //--------------------------------------learning language----------------------------------//

  const students = Array(8).fill(null); // 8 student icons per language

  //------------------------------------------------------------------------------------------//

  const handleBack = () => {
    navigate(-1);
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
            <div className="flex max-w-2xl gap-3 p-1 mb-6">
              <button
                onClick={() => setActiveTab("myBambuu")}
                className={`px-6 py-2.5 text-md font-medium rounded-full transition-all duration-200 ${
                  activeTab === "myBambuu"
                    ? "bg-[#ffbf00] text-[#042f0c] border border-[#042f0c]"
                    : "bg-white text-[#042f0c] border border-gray-200 hover:bg-gray-50"
                }`}
              >
                My Bambuuu
              </button>
              <button
                onClick={() => setActiveTab("exploreBambuu")}
                className={`px-6 py-2.5 text-md font-medium rounded-full transition-all duration-200 ${
                  activeTab === "exploreBambuu"
                    ? "bg-[#ffbf00] text-[#042f0c] border border-[#042f0c]"
                    : "bg-white text-[#042f0c] border border-gray-200 hover:bg-gray-50"
                }`}
              >
                Explore Bambuuu
              </button>
            </div>
          </div>
        </div>

        {/* My Classes */}
        <div className="w-full max-w-[160vh] mx-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">My Classes</h2>
            {classes.length > 0 && (
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
          ) : classes.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-white rounded-lg">
              <img
                alt="bambuu"
                src="/images/no-class.png"
                className="w-auto h-auto"
              />
              <p className="text-center text-gray-600">
                You have not booked a class yet!
              </p>
              <button
                className="px-4 py-2 text-base border border-[#5d5d5d] font-medium text-[#042f0c] bg-[#e6fde9] rounded-full hover:bg-[#ccfcd2]"
                onClick={() => navigate("/classes")}
              >
                Book a Class
              </button>
            </div>
          ) : (
            <div className="relative w-full">
              <div className="flex gap-2 pb-4 overflow-x-auto scrollbar-hide">
                {classes.map((classItem) => (
                  <div
                    key={classItem.id}
                    className="flex-none px-2 pt-3 w-[22rem]"
                  >
                    <ClassCard
                      {...classItem}
                      onClick={() =>
                        navigate(`/classesDetailsUser/${classItem.id}`)
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* My Groups */}
        <div className="w-full max-w-[160vh] mx-auto">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-2xl font-bold">My Groups</h2>
            {groups.length > 0 && (
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
          ) : groups.length === 0 ? (
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
                  onClick={() => navigate("/join-group")}
                  className="px-4 py-2 text-base border border-[#5d5d5d] font-medium text-[#042f0c] bg-[#e6fde9] rounded-full hover:bg-[#ccfcd2]"
                >
                  Join a Group
                </button>
                <button
                  onClick={() => navigate("/create-group")}
                  className="px-4 py-2 text-base border border-[#5d5d5d] font-medium text-[#042f0c] bg-[#e6fde9] rounded-full hover:bg-[#ccfcd2]"
                >
                  Create a Group
                </button>
              </div>
            </div>
          ) : (
            <div className="relative w-full">
              <div className="flex gap-2 pb-4 overflow-x-auto scrollbar-hide">
                {groups.map((group) => (
                  <div key={group.id} className="flex-none px-2 pt-2 w-[22rem]">
                    <GroupCard group={group} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearnLanguageUser;
