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
import { useLanguage } from "../../context/LanguageContext";

const LearnLanguageUser = () => {
  const [searchParams] = useSearchParams();
  const language = searchParams.get("language")?.toLowerCase() || null;
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("exploreBambuu");
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

  const { currentLanguage, changeLanguage } = useLanguage();

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

            // Added check for valid classDateTime
            const hasValidDateTime =
              classData.classDateTime &&
              typeof classData.classDateTime === "object" &&
              classData.classDateTime.seconds &&
              typeof classData.classDateTime.seconds === "number";

            // Only include classes with valid dates and matching language if specified
            if (
              hasValidDateTime &&
              (!language || classData.language?.toLowerCase() === language)
            ) {
              classesData.push(classData);
            }
          }
        }
        setMyClasses(classesData);
      } catch (error) {
        console.error("Error fetching classes:", error);
        setError(
          "Unable to fetch classes at this time. Please try again later.",
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
            (cls) => !language || cls.language?.toLowerCase() === language,
          )
          // Exclude introductory_call and exam_prep class types
          .filter(
            (cls) =>
              cls.classType !== "introductory_call" &&
              cls.classType !== "exam_prep",
          )
          // Add filter for classes with valid date/time
          .filter((cls) => {
            // Check if classDateTime exists and has seconds property
            return (
              cls.classDateTime &&
              typeof cls.classDateTime === "object" &&
              cls.classDateTime.seconds &&
              typeof cls.classDateTime.seconds === "number" &&
              // Ensure the class has a valid ID and name
              cls.id &&
              cls.className
            );
          });

        const allGroups = groupsSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((group) => !user?.joinedGroups?.includes(group.id))
          .filter(
            (group) =>
              !language ||
              group.groupLearningLanguage?.toLowerCase() === language,
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
      <div className="h-full w-[272px] flex-shrink-0 p-4">
        <Sidebar user={user} />
      </div>

      <div className="min-w-[calc(100% - 272px)] h-[calc(100vh-0px)] flex-1 overflow-x-auto p-4 pl-0">
        <div className="h-[calc(100vh-32px)] overflow-y-auto rounded-3xl border border-[#e7e7e7] bg-white p-[16px]">
          {/* Header */}
          <div className="mb-6 flex flex-col justify-between gap-4 border-b pb-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <button
                className="flex-shrink-0 rounded-full bg-gray-100 p-3 transition-colors hover:bg-gray-200"
                onClick={handleBack}
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <h1 className="whitespace-nowrap text-4xl font-semibold">
                {t("learnLanguage.title")}
              </h1>
            </div>
            <div className="flex w-full justify-center sm:w-auto">
              <div className="relative inline-flex rounded-full border border-gray-300 bg-gray-100 p-1">
                <div
                  className="absolute left-0 top-0 h-full rounded-full border border-[#042F0C] bg-[#FFBF00] transition-all duration-300 ease-in-out"
                  style={{
                    transform: `translateX(${
                      activeTab === "myBambuu" ? "0" : "100%"
                    })`,
                    width: "50%",
                  }}
                />
                <button
                  onClick={() => setActiveTab("myBambuu")}
                  className="text-md relative z-10 whitespace-nowrap rounded-full px-4 py-2 font-medium text-[#042F0C] transition-colors sm:px-6"
                >
                  {t("learnLanguage.tabs.myBambuu")}
                </button>
                <button
                  onClick={() => setActiveTab("exploreBambuu")}
                  className="text-md relative z-10 whitespace-nowrap rounded-full px-4 py-2 font-medium text-[#042F0C] transition-colors sm:px-6"
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
                <div className="w-full">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">
                      {t("learnLanguage.myClasses.title")}
                    </h2>
                    {myClasses.length > 0 && (
                      <button
                        className="rounded-full border border-[#5d5d5d] bg-[#e6fde9] px-4 py-2 text-base font-medium text-[#042f0c] hover:bg-[#ccfcd2]"
                        onClick={() =>
                          navigate(
                            `/classesUser${
                              language ? `?language=${language}` : ""
                            }`,
                          )
                        }
                      >
                        {t("learnLanguage.myClasses.viewAll")}
                      </button>
                    )}
                  </div>

                  {loading ? (
                    <div className="flex h-48 items-center justify-center">
                      <ClipLoader color="#14B82C" size={50} />
                    </div>
                  ) : error ? (
                    <div className="flex flex-col items-center justify-center space-y-4 rounded-lg bg-white p-8">
                      <p className="text-center text-red-500">{error}</p>
                      <button
                        className="rounded-full border border-[#5d5d5d] bg-[#e6fde9] px-4 py-2 text-base font-medium text-[#042f0c] hover:bg-[#ccfcd2]"
                        onClick={() => window.location.reload()}
                      >
                        {t("learnLanguage.myClasses.error.tryAgain")}
                      </button>
                    </div>
                  ) : myClasses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center space-y-4 rounded-lg bg-white p-8">
                      <EmptyState message="You have not joined any class yet!" />
                    </div>
                  ) : (
                    <div className="relative w-full">
                      <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-4">
                        {myClasses.map((classItem) => (
                          <div
                            key={classItem.id}
                            className="w-72 flex-none px-1 pt-3"
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
                <div className="w-full">
                  <div className="mb-1 flex items-center justify-between">
                    <h2 className="text-2xl font-bold">
                      {t("learnLanguage.myGroups.title")}
                    </h2>
                    {myGroups.length > 0 && (
                      <button
                        className="rounded-full border border-[#5d5d5d] bg-[#e6fde9] px-4 py-2 text-base font-medium text-[#042f0c] hover:bg-[#ccfcd2]"
                        onClick={() =>
                          navigate(
                            `/groupsUser${
                              language ? `?language=${language}` : ""
                            }`,
                          )
                        }
                      >
                        {t("learnLanguage.myGroups.viewAll")}
                      </button>
                    )}
                  </div>

                  {loadingGroups ? (
                    <div className="flex h-48 items-center justify-center">
                      <ClipLoader color="#14B82C" size={50} />
                    </div>
                  ) : errorGroups ? (
                    <div className="flex flex-col items-center justify-center space-y-4 rounded-lg bg-white p-8">
                      <p className="text-center text-red-500">{errorGroups}</p>
                      <button
                        className="rounded-full border border-[#5d5d5d] bg-[#e6fde9] px-4 py-2 text-base font-medium text-[#042f0c] hover:bg-[#ccfcd2]"
                        onClick={() => window.location.reload()}
                      >
                        {t("learnLanguage.myGroups.error.tryAgain")}
                      </button>
                    </div>
                  ) : myGroups.length === 0 ? (
                    <div className="flex flex-col items-center justify-center space-y-4 rounded-lg bg-white p-8">
                      <EmptyState message="You are not part of any group yet!" />
                      <button
                        onClick={() => navigate("/groupsUser")}
                        className="rounded-full border border-[#5d5d5d] bg-[#e6fde9] px-4 py-2 text-base font-medium text-[#042f0c] hover:bg-[#ccfcd2]"
                      >
                        {t("learnLanguage.myGroups.createGroup")}
                      </button>
                    </div>
                  ) : (
                    <div className="relative w-full">
                      <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-4">
                        {myGroups.map((group) => (
                          <div
                            key={group.id}
                            className="w-72 flex-none px-1 pt-2"
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
                <div className="w-full">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">
                      {t("learnLanguage.exploreClasses.title")}
                    </h2>
                    {exploreClasses.length > 0 && (
                      <button
                        className="rounded-full border border-[#5d5d5d] bg-[#e6fde9] px-4 py-2 text-base font-medium text-[#042f0c] hover:bg-[#ccfcd2]"
                        onClick={() =>
                          navigate(
                            `/exploreClassesUser${
                              language ? `?language=${language}` : ""
                            }`,
                          )
                        }
                      >
                        {t("learnLanguage.exploreClasses.viewAll")}
                      </button>
                    )}
                  </div>

                  {loadingExplore ? (
                    <div className="flex h-48 items-center justify-center">
                      <ClipLoader color="#14B82C" size={50} />
                    </div>
                  ) : errorExplore ? (
                    <div className="flex flex-col items-center justify-center space-y-4 rounded-lg bg-white p-8">
                      <p className="text-center text-red-500">{errorExplore}</p>
                      <button
                        className="rounded-full border border-[#5d5d5d] bg-[#e6fde9] px-4 py-2 text-base font-medium text-[#042f0c] hover:bg-[#ccfcd2]"
                        onClick={() => window.location.reload()}
                      >
                        {t("learnLanguage.exploreClasses.error.tryAgain")}
                      </button>
                    </div>
                  ) : exploreClasses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center space-y-4 rounded-lg bg-white p-8">
                      <EmptyState message="No available classes to explore at the moment!" />
                    </div>
                  ) : (
                    <div className="relative w-full">
                      <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-4">
                        {exploreClasses.map((classItem) => (
                          <div
                            key={classItem.id}
                            className="w-72 flex-none px-1 pt-3"
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
                <div className="w-full">
                  <div className="mb-1 flex items-center justify-between">
                    <h2 className="text-2xl font-bold">
                      {t("learnLanguage.exploreGroups.title")}
                    </h2>
                    {exploreGroups.length > 0 && (
                      <button
                        className="rounded-full border border-[#5d5d5d] bg-[#e6fde9] px-4 py-2 text-base font-medium text-[#042f0c] hover:bg-[#ccfcd2]"
                        onClick={() =>
                          navigate(
                            `/exploreGroupsUser${
                              language ? `?language=${language}` : ""
                            }`,
                          )
                        }
                      >
                        {t("learnLanguage.exploreGroups.title")}
                      </button>
                    )}
                  </div>

                  {loadingExplore ? (
                    <div className="flex h-48 items-center justify-center">
                      <ClipLoader color="#14B82C" size={50} />
                    </div>
                  ) : errorExplore ? (
                    <div className="flex flex-col items-center justify-center space-y-4 rounded-lg bg-white p-8">
                      <p className="text-center text-red-500">{errorExplore}</p>
                      <button
                        className="rounded-full border border-[#5d5d5d] bg-[#e6fde9] px-4 py-2 text-base font-medium text-[#042f0c] hover:bg-[#ccfcd2]"
                        onClick={() => window.location.reload()}
                      >
                        {t("learnLanguage.exploreGroups.error.tryAgain")}
                      </button>
                    </div>
                  ) : exploreGroups.length === 0 ? (
                    <div className="flex flex-col items-center justify-center space-y-4 rounded-lg bg-white p-8">
                      <EmptyState message="No available groups to explore at the moment!" />
                    </div>
                  ) : (
                    <div className="relative w-full">
                      <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-4">
                        {exploreGroups.map((group) => (
                          <div
                            key={group.id}
                            className="w-72 flex-none px-1 pt-2"
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
