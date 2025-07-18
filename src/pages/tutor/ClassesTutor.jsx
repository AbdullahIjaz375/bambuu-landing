import React, { useEffect, useState } from "react";
import { Search, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { ClipLoader } from "react-spinners";
import ClassCardTutor from "../../components-tutor/ClassCardTutor";
import Sidebar from "../../components/Sidebar";
import {
  ClassTypeModal,
  GroupSelectModal,
} from "../../components-tutor/AddClassFlow";
import EmptyState from "../../components/EmptyState";
import { useTranslation } from "react-i18next";
import { shouldHidePremiumOneTimeClass } from "../../utils/accessControl";

const ClassesTutor = () => {
  const { t } = useTranslation();

  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("booked");
  const [searchQuery, setSearchQuery] = useState("");
  const [groups, setGroups] = useState([]);

  const [showClassTypeModal, setShowClassTypeModal] = useState(false);
  const [showGroupSelectModal, setShowGroupSelectModal] = useState(false);
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/learn");
  };

  useEffect(() => {
    const fetchClasses = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Get the tutor document
        const tutorDoc = await getDoc(doc(db, "tutors", user.uid));

        if (!tutorDoc.exists()) {
          console.error("Tutor document not found");
          setLoading(false);
          return;
        }

        const tutorData = tutorDoc.data();
        const tutorClasses = tutorData.tutorOfClasses || [];

        // Fetch all classes mentioned in tutorOfClasses array
        const classesData = [];
        for (const classId of tutorClasses) {
          const classRef = doc(db, "classes", classId);
          const classDoc = await getDoc(classRef);

          if (classDoc.exists()) {
            const classData = { id: classId, ...classDoc.data() };
            // Only add the class if it shouldn't be hidden (tutors can always see their own classes)
            if (!shouldHidePremiumOneTimeClass(classData, user)) {
              classesData.push(classData);
            }
          }
        }
        setClasses(classesData);
      } catch (error) {
        console.error("Error fetching classes:", error);
        setError(
          "Unable to fetch classes at this time. Please try again later.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [user]);

  useEffect(() => {
    const fetchGroups = async () => {
      if (!user) return;

      try {
        const tutorDoc = await getDoc(doc(db, "tutors", user.uid));
        if (tutorDoc.exists()) {
          const tutorData = tutorDoc.data();
          const tutorGroups = tutorData.tutorOfGroups || [];

          const groupsData = [];
          for (const groupId of tutorGroups) {
            const groupDoc = await getDoc(doc(db, "groups", groupId));
            if (groupDoc.exists()) {
              groupsData.push({ id: groupId, ...groupDoc.data() });
            }
          }
          setGroups(groupsData);
        }
      } catch (error) {
        console.error("Error fetching groups:", error);
      }
    };

    fetchGroups();
  }, [user]);

  const filteredClasses = classes.filter((classItem) => {
    const searchTerm = searchQuery.toLowerCase().trim();
    const isAvailable =
      !classItem.classMemberIds || classItem.classMemberIds.length === 0;

    // First filter by tab
    if (activeTab === "booked" && isAvailable) return false;
    if (activeTab === "available" && !isAvailable) return false;

    // Then filter by search term
    if (!searchTerm) return true;

    return (
      classItem.className?.toLowerCase().includes(searchTerm) ||
      classItem.language?.toLowerCase().includes(searchTerm) ||
      classItem.languageLevel?.toLowerCase().includes(searchTerm)
    );
  });

  //--------------------------------------------adding class----------------------------//
  // Add these handlers
  const handleClassTypeSelect = (type) => {
    setShowClassTypeModal(false);
    if (type === "group") {
      setShowGroupSelectModal(true);
    } else {
      navigate(`/addClassTutor?type=individual`);
    }
  };

  const handleGroupSelect = (group) => {
    setShowGroupSelectModal(false);
    navigate(`/addClassTutor?type=group&groupId=${group.id}`);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  //-------------------------------------------------------------------------------//

  return (
    <>
      <div className="flex h-screen bg-white">
        <div className="h-full w-[272px] flex-shrink-0 p-4">
          <Sidebar user={user} />
        </div>

        <div className="min-w-[calc(100% - 272px)] h-[calc(100vh-0px)] flex-1 overflow-x-auto p-4 pl-0">
          <div className="h-[calc(100vh-32px)] overflow-y-auto rounded-3xl border border-[#e7e7e7] bg-white p-[16px]">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-4">
                <button
                  className="flex-shrink-0 rounded-full bg-gray-100 p-3 transition-colors hover:bg-gray-200"
                  onClick={handleBack}
                  aria-label={t("classes-tutor.actions.back")}
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <h1 className="whitespace-nowrap text-4xl font-semibold">
                  {t("classes-tutor.title")}
                </h1>
              </div>
              <button
                className="whitespace-nowrap rounded-full border border-[#5d5d5d] bg-white px-6 py-3 text-xl font-medium text-[#042f0c]"
                onClick={() => setShowClassTypeModal(true)}
              >
                {t("classes-tutor.actions.add-new")}
              </button>
            </div>

            {/* Filter and Search Section */}
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex justify-center lg:justify-start">
                <div className="relative inline-flex rounded-full border border-gray-300 bg-gray-100 p-1">
                  <div
                    className="absolute left-0 top-0 h-full rounded-full border border-[#042F0C] bg-[#FFBF00] transition-all duration-300 ease-in-out"
                    style={{
                      transform: `translateX(${
                        activeTab === "booked" ? "0" : "100%"
                      })`,
                      width: "50%",
                    }}
                  />
                  <button
                    onClick={() => setActiveTab("booked")}
                    className="text-md relative z-10 whitespace-nowrap rounded-full px-4 py-2 font-medium text-[#042F0C] transition-colors sm:px-6"
                  >
                    {t("learn-tutor.tabs.booked-classes")}
                  </button>
                  <button
                    onClick={() => setActiveTab("available")}
                    className="text-md relative z-10 whitespace-nowrap rounded-full px-4 py-2 font-medium text-[#042F0C] transition-colors sm:px-6"
                  >
                    {t("learn-tutor.tabs.available-classes")}
                  </button>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
                <input
                  type="text"
                  placeholder={t("classes-tutor.search.placeholder")}
                  className="w-full rounded-3xl border border-gray-200 py-3 pl-12 pr-4 focus:border-[#14B82C] focus:outline-none focus:ring-0 lg:w-[40vh]"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
            </div>

            {/* Content Section */}
            <div className="min-w-0">
              {loading ? (
                <div className="flex min-h-[60vh] items-center justify-center">
                  <ClipLoader color="#14B82C" size={50} />
                </div>
              ) : error ? (
                <p className="text-center text-red-500">{error}</p>
              ) : filteredClasses.length === 0 ? (
                <div className="flex min-h-[60vh] items-center justify-center">
                  <EmptyState
                    message={
                      searchQuery
                        ? t("classes-tutor.states.empty.no-results")
                        : t("classes-tutor.states.empty.no-classes")
                    }
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredClasses.map((classItem) => (
                    <ClassCardTutor
                      key={classItem.id}
                      {...classItem}
                      classId={classItem.id}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ClassTypeModal
        isOpen={showClassTypeModal}
        onClose={() => setShowClassTypeModal(false)}
        onSelect={handleClassTypeSelect}
      />

      <GroupSelectModal
        isOpen={showGroupSelectModal}
        onClose={() => {
          setShowGroupSelectModal(false);
          setShowClassTypeModal(true);
        }}
        onSelect={handleGroupSelect}
        groups={groups}
      />
    </>
  );
};

export default ClassesTutor;
