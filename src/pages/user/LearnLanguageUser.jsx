import React, { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import Sidebar from "../../components/Sidebar";
import ClassCard from "../../components/ClassCard";
import { useAuth } from "../../context/AuthContext";
import GroupCard from "../../components/GroupCard";
import { useNavigate, useSearchParams } from "react-router-dom";
import { db } from "../../firebaseConfig";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { ClipLoader } from "react-spinners";
import ExploreClassCard from "../../components/ExploreClassCard";
import ExploreGroupCard from "../../components/ExploreGroupCard";
import EmptyState from "../../components/EmptyState";

const LearnLanguageUser = () => {
  const [searchParams] = useSearchParams();
  const language = searchParams.get("language")?.toLowerCase() || null;
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
  const { t } = useTranslation();

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
            const classData = { id: classId, ...classDoc.data() };
            if (!language || classData.language?.toLowerCase() === language) {
              classesData.push(classData);
            }
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
  }, [user, language]);

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
            const groupData = { id: groupDoc.id, ...groupDoc.data() };
            if (
              !language ||
              groupData.groupLearningLanguage?.toLowerCase() === language
            ) {
              fetchedGroups.push(groupData);
            }
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
  }, [user, language]);

  // Fetch Explore Classes and Groups
  useEffect(() => {
    const fetchExploreContent = async () => {
      if (activeTab !== "exploreBambuu") return;

      setLoadingExplore(true);
      try {
        const classesSnapshot = await getDocs(collection(db, "classes"));
        const groupsSnapshot = await getDocs(collection(db, "groups"));

        const allClasses = classesSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((cls) => !user?.enrolledClasses?.includes(cls.id))
          .filter(
            (cls) => !language || cls.language?.toLowerCase() === language
          );

        const allGroups = groupsSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((group) => !user?.joinedGroups?.includes(group.id))
          .filter(
            (group) =>
              !language ||
              group.groupLearningLanguage?.toLowerCase() === language
          );

        setExploreClasses(allClasses);
        setExploreGroups(allGroups);
        setErrorExplore(null);
      } catch (error) {
        console.error("Error fetching explore content:", error);
        setErrorExplore("Failed to load content. Please try again.");
      } finally {
        setLoadingExplore(false);
      }
    };

    fetchExploreContent();
  }, [activeTab, user, language]);

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="flex h-screen bg-white">
      <div className="flex-shrink-0 w-64 h-full">
        <Sidebar user={user} />
      </div>

      <div className="flex-1 overflow-x-auto min-w-[calc(100%-16rem)] h-full">
        <div className="h-[calc(100vh-1rem)] p-8 bg-white border-2 border-[#e7e7e7] rounded-3xl m-2 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col justify-between gap-4 pb-4 mb-6 border-b sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <button
                className="flex-shrink-0 p-3 transition-colors bg-gray-100 rounded-full hover:bg-gray-200"
                onClick={handleBack}
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-4xl font-semibold whitespace-nowrap">
                {t("learnLanguage.title")}
              </h1>
            </div>
            <div className="flex justify-center w-full sm:w-auto">
              <div className="relative inline-flex p-1 bg-gray-100 border border-gray-300 rounded-full">
                <div
                  className="absolute top-0 left-0 h-full bg-[#FFBF00] border border-[#042F0C] rounded-full transition-all duration-300 ease-in-out"
                  style={{
                    transform: `translateX(${
                      activeTab === "myBambuu" ? "0" : "100%"
                    })`,
                    width: "50%",
                  }}
                />
                <button
                  onClick={() => setActiveTab("myBambuu")}
                  className="relative z-10 px-4 sm:px-6 py-2 rounded-full text-[#042F0C] text-md font-medium transition-colors whitespace-nowrap"
                >
                  {t("learnLanguage.tabs.myBambuu")}
                </button>
                <button
                  onClick={() => setActiveTab("exploreBambuu")}
                  className="relative z-10 px-4 sm:px-6 py-2 rounded-full text-[#042F0C] text-md font-medium transition-colors whitespace-nowrap"
                >
                  {t("learnLanguage.tabs.exploreBambuu")}
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-8">
            {activeTab === "myBambuu" ? (
              <>
                {/* My Classes Section */}
                <div className="w-full max-w-[160vh] mx-auto">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">
                      {t("learnLanguage.myClasses.title")}
                    </h2>
                    {myClasses.length > 0 && (
                      <button
                        className="px-4 py-2 text-base border border-[#5d5d5d] font-medium text-[#042f0c] bg-[#e6fde9] rounded-full hover:bg-[#ccfcd2]"
                        onClick={() =>
                          navigate(
                            `/classesUser${
                              language ? `?language=${language}` : ""
                            }`
                          )
                        }
                      >
                        {t("learnLanguage.myClasses.viewAll")}
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
                        {t("learnLanguage.myClasses.error.tryAgain")}
                      </button>
                    </div>
                  ) : myClasses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-white rounded-lg">
                      <EmptyState message="You have not joined any class yet!" />
                    </div>
                  ) : (
                    <div className="relative w-full">
                      <div className="flex gap-2 pb-4 overflow-x-auto scrollbar-hide">
                        {myClasses.map((classItem) => (
                          <div
                            key={classItem.id}
                            className="flex-none px-1 pt-3 w-72"
                          >
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
                    <h2 className="text-2xl font-bold">
                      {t("learnLanguage.myGroups.title")}
                    </h2>
                    {myGroups.length > 0 && (
                      <button
                        className="px-4 py-2 text-base border border-[#5d5d5d] font-medium text-[#042f0c] bg-[#e6fde9] rounded-full hover:bg-[#ccfcd2]"
                        onClick={() =>
                          navigate(
                            `/groupsUser${
                              language ? `?language=${language}` : ""
                            }`
                          )
                        }
                      >
                        {t("learnLanguage.myGroups.viewAll")}
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
                        {t("learnLanguage.myGroups.error.tryAgain")}
                      </button>
                    </div>
                  ) : myGroups.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-white rounded-lg">
                      <EmptyState message="You are not part of any group yet!" />
                      <button
                        onClick={() => navigate("/groupsUser")}
                        className="px-4 py-2 text-base border border-[#5d5d5d] font-medium text-[#042f0c] bg-[#e6fde9] rounded-full hover:bg-[#ccfcd2]"
                      >
                        {t("learnLanguage.myGroups.createGroup")}
                      </button>
                    </div>
                  ) : (
                    <div className="relative w-full">
                      <div className="flex gap-2 pb-4 overflow-x-auto scrollbar-hide">
                        {myGroups.map((group) => (
                          <div
                            key={group.id}
                            className="flex-none px-1 pt-2 w-72"
                          >
                            <GroupCard group={group} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Explore Classes Section */}
                <div className="w-full max-w-[160vh] mx-auto">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">
                      {t("learnLanguage.exploreClasses.title")}
                    </h2>
                    {exploreClasses.length > 0 && (
                      <button
                        className="px-4 py-2 text-base border border-[#5d5d5d] font-medium text-[#042f0c] bg-[#e6fde9] rounded-full hover:bg-[#ccfcd2]"
                        onClick={() =>
                          navigate(
                            `/exploreClassesUser${
                              language ? `?language=${language}` : ""
                            }`
                          )
                        }
                      >
                        {t("learnLanguage.exploreClasses.viewAll")}
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
                        {t("learnLanguage.exploreClasses.error.tryAgain")}
                      </button>
                    </div>
                  ) : exploreClasses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-white rounded-lg">
                      <EmptyState message="No available classes to explore at the moment!" />
                    </div>
                  ) : (
                    <div className="relative w-full">
                      <div className="flex gap-2 pb-4 overflow-x-auto scrollbar-hide">
                        {exploreClasses.map((classItem) => (
                          <div
                            key={classItem.id}
                            className="flex-none px-1 pt-3 w-72"
                          >
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
                <div className="w-full max-w-[160vh] mx-auto">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-2xl font-bold">
                      {t("learnLanguage.exploreGroups.title")}
                    </h2>
                    {exploreGroups.length > 0 && (
                      <button
                        className="px-4 py-2 text-base border border-[#5d5d5d] font-medium text-[#042f0c] bg-[#e6fde9] rounded-full hover:bg-[#ccfcd2]"
                        onClick={() =>
                          navigate(
                            `/exploreGroupsUser${
                              language ? `?language=${language}` : ""
                            }`
                          )
                        }
                      >
                        {t("learnLanguage.exploreGroups.title")}
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
                        {t("learnLanguage.exploreGroups.error.tryAgain")}
                      </button>
                    </div>
                  ) : exploreGroups.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-white rounded-lg">
                      <EmptyState message="No available groups to explore at the moment!" />
                    </div>
                  ) : (
                    <div className="relative w-full">
                      <div className="flex gap-2 pb-4 overflow-x-auto scrollbar-hide">
                        {exploreGroups.map((group) => (
                          <div
                            key={group.id}
                            className="flex-none px-1 pt-2 w-72"
                          >
                            <ExploreGroupCard group={group} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearnLanguageUser;
