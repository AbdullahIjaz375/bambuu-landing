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
          "Unable to fetch classes at this time. Please try again later.",
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
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <h1 className="whitespace-nowrap text-4xl font-semibold">
                My Classes
              </h1>
            </div>
            <button
              className="whitespace-nowrap rounded-full border border-[#5d5d5d] bg-white px-6 py-3 text-xl font-medium text-[#042f0c]"
              onClick={handleBookNewClass}
            >
              Book New Class
            </button>
          </div>

          {/* Filter and Search Section */}
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex justify-center lg:justify-start">
              <div className="flex w-full justify-center sm:w-auto">
                <div className="relative inline-flex rounded-full border border-gray-300 bg-gray-100 p-1">
                  <div
                    className="absolute left-0 top-0 h-full rounded-full border border-[#042F0C] bg-[#FFBF00] transition-all duration-300 ease-in-out"
                    style={{
                      transform: `translateX(${
                        activeTab === "group" ? "0" : "100%"
                      })`,
                      width: "50%",
                    }}
                  />
                  <button
                    onClick={() => setActiveTab("group")}
                    className="text-md relative z-10 whitespace-nowrap rounded-full px-4 py-2 font-medium text-[#042F0C] transition-colors sm:px-4"
                  >
                    Group Conversation Classes
                  </button>
                  <button
                    onClick={() => setActiveTab("bammbuu")}
                    className="text-md relative z-10 whitespace-nowrap rounded-full px-4 py-2 font-medium text-[#042F0C] transition-colors sm:px-8"
                  >
                    bammbuu+ Classes
                  </button>
                </div>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
              <input
                type="text"
                placeholder="Search classes by name"
                className="w-full rounded-3xl border border-gray-200 py-3 pl-10 pr-4 focus:border-[#14B82C] focus:outline-none focus:ring-0 lg:w-[40vh]"
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
