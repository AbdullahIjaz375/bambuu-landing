import React, { useEffect, useState } from "react";
import { Search, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { ClipLoader } from "react-spinners";
import Sidebar from "../../components/Sidebar";
import ExploreClassCard from "../../components/ExploreClassCard";

const ExploreClassesUser = () => {
  const { user } = useAuth();
  const [exploreClasses, setExploreClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

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
        // Fetch all classes
        const classesSnapshot = await getDocs(collection(db, "classes"));
        const allClasses = classesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Filter out classes the user is already enrolled in
        const nonEnrolledClasses = allClasses.filter(
          (cls) => !user.enrolledClasses?.includes(cls.id)
        );

        setExploreClasses(nonEnrolledClasses);
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
            <h1 className="text-4xl font-semibold">Explore Classes</h1>
          </div>
        </div>

        <div className="flex flex-row items-center justify-between">
          <div className="relative w-full mb-6">
            <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
            <input
              type="text"
              placeholder="Search classes by name"
              className="w-full py-3 pl-10 pr-4 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
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
              : "No available classes found."}
          </p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {filteredClasses.map((classItem) => (
              <div key={classItem.id} className="flex-none w-80">
                <ExploreClassCard
                  {...classItem}
                  isBammbuu={isBambbuuPlusClass(classItem.classType)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExploreClassesUser;
