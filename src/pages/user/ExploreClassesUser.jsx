import React, { useEffect, useState } from "react";
import { Search, ArrowLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { ClipLoader } from "react-spinners";
import Sidebar from "../../components/Sidebar";
import ExploreClassCard from "../../components/ExploreClassCard";
import EmptyState from "../../components/EmptyState";
import { useTranslation } from "react-i18next";

const ExploreClassesUser = () => {
  const { user } = useAuth();
  const [exploreClasses, setExploreClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();
  const language = searchParams.get("language")?.toLowerCase() || null;
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleBack = () => {
    navigate(-1);
  };

  useEffect(() => {
    const fetchClasses = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const classesSnapshot = await getDocs(collection(db, "classes"));
        const allClasses = classesSnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
            classId: doc.id, // Ensure classId is always set
          }))
          .filter((cls) => !user.enrolledClasses?.includes(cls.id))
          .filter(
            (cls) => !language || cls.language?.toLowerCase() === language
          )
          // Enhanced filtering to remove classes with missing or invalid data
          .filter(
            (cls) =>
              // Make sure classDateTime exists and has seconds property (not TBD)
              cls.classDateTime &&
              typeof cls.classDateTime === "object" &&
              cls.classDateTime.seconds &&
              typeof cls.classDateTime.seconds === "number" &&
              // Ensure the class has a valid ID
              cls.id &&
              // Make sure className exists and is not empty
              cls.className &&
              typeof cls.className === "string" &&
              cls.className.trim() !== "" &&
              // Make sure we have a valid adminId or tutorId
              (cls.adminId || cls.tutorId) &&
              // Make sure we have valid language information
              cls.language &&
              typeof cls.language === "string"
          );

        setExploreClasses(allClasses);
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
  }, [user, language]);

  const isBambbuuPlusClass = (classType) => {
    return classType === "Individual Premium" || classType === "Group Premium";
  };

  const filteredClasses = exploreClasses.filter((classItem) => {
    const searchTerm = searchQuery.toLowerCase().trim();

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
                onClick={handleBack}
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-4xl font-semibold whitespace-nowrap">
                {t("exploreClasses.title")}
              </h1>
            </div>
          </div>

          {/* Search Section */}
          <div className="relative mb-6">
            <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
            <input
              type="text"
              placeholder={t("exploreClasses.search.placeholder")}
              className="w-full py-3 pl-10 pr-4 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>

          {/* Content */}
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
                      ? t("exploreClasses.empty.noResults")
                      : t("exploreClasses.empty.noClasses")
                  }
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredClasses.map((classItem) => (
                  <div key={classItem.id}>
                    <ExploreClassCard
                      {...classItem}
                      classId={classItem.id} // Explicitly pass the classId
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

export default ExploreClassesUser;
