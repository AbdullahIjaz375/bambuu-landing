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

const ClassesTutor = () => {
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
            classesData.push({ id: classId, ...classDoc.data() });
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
      <div className="flex min-h-screen bg-white">
        <Sidebar user={user} />

        <div className="flex-1 p-8 bg-white border-2 border-[#e7e7e7] rounded-3xl ml-[17rem] m-2">
          <div className="flex items-center justify-between pb-4 mb-6 border-b">
            <div className="flex items-center gap-4">
              <button
                className="p-3 bg-gray-100 rounded-full"
                onClick={handleBack}
              >
                <ArrowLeft size="30" />
              </button>
              <h1 className="text-4xl font-semibold">My Classes</h1>
            </div>
            <button
              className="px-6 py-3 text-[#042f0c] text-xl font-medium bg-white border border-[#5d5d5d] rounded-full"
              onClick={() => setShowClassTypeModal(true)}
            >
              Add New Class
            </button>
          </div>

          <div className="flex flex-row items-center justify-between">
            <div className="flex justify-center">
              <div className="inline-flex bg-gray-100 border border-gray-300 rounded-full">
                <button
                  onClick={() => setActiveTab("booked")}
                  className={`px-6 py-2 rounded-full text-[#042F0C] text-md font-medium transition-colors
            ${
              activeTab === "booked"
                ? "bg-[#FFBF00] border border-[#042F0C]"
                : "bg-transparent"
            }`}
                >
                  Booked Classes
                </button>
                <button
                  onClick={() => setActiveTab("available")}
                  className={`px-6 py-2 rounded-full text-[#042F0C] text-md font-medium transition-colors
            ${
              activeTab === "available"
                ? "bg-[#FFBF00] border border-[#042F0C]"
                : "bg-transparent"
            }`}
                >
                  Available Classes
                </button>
              </div>
            </div>
            <div className="relative mb-6">
              <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
              <input
                type="text"
                placeholder="Search classes by name, language, or level"
                className="w-[40vh] py-3 pl-10 pr-4 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center min-h-[50vh]">
              <ClipLoader color="#14B82C" size={50} />
            </div>
          ) : error ? (
            <p className="text-center text-red-500">{error}</p>
          ) : filteredClasses.length === 0 ? (
            <p className="text-center text-gray-500">
              {searchQuery
                ? "No classes found matching your search."
                : `No ${activeTab} classes found.`}
            </p>
          ) : (
            <div className="flex flex-wrap gap-4">
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
