import React, { useEffect, useState } from "react";
import { Search, ArrowLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { ClipLoader } from "react-spinners";
import ClassCard from "../../components/ClassCard";
import Sidebar from "../../components/Sidebar";
import EmptyState from "../../components/EmptyState";

const ClassesUser = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const language = searchParams.get("language")?.toLowerCase() || null;
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("group");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  const handleBookNewClass = () => {
    navigate("/exploreClassesUser");
  };

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
            if (!language || classData.language?.toLowerCase() === language) {
              classesData.push({ id: classId, ...classData });
            }
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

  const isBambbuuPlusClass = (classType) => {
    return classType === "Individual Premium" || classType === "Group Premium";
  };

  const filteredClasses = classes.filter((classItem) => {
    const searchTerm = searchQuery.toLowerCase().trim();
    const isBambuuPlus = isBambbuuPlusClass(classItem.classType);

    // First filter by tab
    if (activeTab === "bammbuu" && !isBambuuPlus) return false;
    if (activeTab === "group" && isBambuuPlus) return false;

    // Then filter by search term
    if (!searchTerm) return true;

    return (
      classItem.className?.toLowerCase().includes(searchTerm) ||
      classItem.language?.toLowerCase().includes(searchTerm) ||
      classItem.languageLevel?.toLowerCase().includes(searchTerm)
    );
  });

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="flex h-screen bg-white">
      <div className="flex-shrink-0 w-64 h-full">
        <Sidebar user={user} />
      </div>

      <div className="flex-1 overflow-x-auto min-w-[calc(100%-16rem)] h-full">
        <div className="h-[calc(100vh-1rem)] p-8 bg-white border-2 border-[#e7e7e7] rounded-3xl m-2 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b">
            <div className="flex items-center gap-4">
              <button
                className="flex-shrink-0 p-3 transition-colors bg-gray-100 rounded-full hover:bg-gray-200"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-4xl font-semibold whitespace-nowrap">
                My Classes
              </h1>
            </div>
            <button
              className="px-6 py-3 text-[#042f0c] text-xl font-medium bg-white border border-[#5d5d5d] rounded-full whitespace-nowrap"
              onClick={handleBookNewClass}
            >
              Book New Class
            </button>
          </div>

          {/* Filter and Search Section */}
          <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex justify-center lg:justify-start">
              <div className="flex justify-center w-full sm:w-auto">
                <div className="relative inline-flex p-1 bg-gray-100 border border-gray-300 rounded-full">
                  <div
                    className="absolute top-0 left-0 h-full bg-[#FFBF00] border border-[#042F0C] rounded-full transition-all duration-300 ease-in-out"
                    style={{
                      transform: `translateX(${
                        activeTab === "group" ? "0" : "100%"
                      })`,
                      width: "50%",
                    }}
                  />
                  <button
                    onClick={() => setActiveTab("group")}
                    className="relative z-10 px-4 sm:px-4 py-2 rounded-full text-[#042F0C] text-md font-medium transition-colors whitespace-nowrap"
                  >
                    Group Conversation Classes
                  </button>
                  <button
                    onClick={() => setActiveTab("bammbuu")}
                    className="relative z-10 px-4 sm:px-8 py-2 rounded-full text-[#042F0C] text-md font-medium transition-colors whitespace-nowrap"
                  >
                    bammbuu+ Classes
                  </button>
                </div>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
              <input
                type="text"
                placeholder="Search classes by name"
                className="w-full lg:w-[40vh] py-3 pl-10 pr-4 border border-gray-200 rounded-3xl focus:border-[#14B82C] focus:ring-0 focus:outline-none"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
          </div>

          {/* Content Section */}
          <div className="min-w-0">
            {loading ? (
              <div className="flex items-center justify-center min-h-[60vh]">
                <ClipLoader color="#14B82C" size={50} />
              </div>
            ) : error ? (
              <p className="text-center text-red-500">{error}</p>
            ) : filteredClasses.length === 0 ? (
              <div className="flex items-center justify-center min-h-[60vh]">
                <EmptyState
                  message={
                    searchQuery
                      ? "No results found."
                      : `No ${
                          activeTab === "bammbuu" ? "bammbuu+" : "group"
                        } classes found.`
                  }
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredClasses.map((classItem) => (
                  <div key={classItem.id}>
                    <ClassCard
                      {...classItem}
                      isBammbuu={isBambbuuPlusClass(classItem.classType)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassesUser;
