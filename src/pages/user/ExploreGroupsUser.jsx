import React, { useEffect, useState } from "react";
import { Search, ArrowLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { ClipLoader } from "react-spinners";
import Sidebar from "../../components/Sidebar";
import ExploreGroupCard from "../../components/ExploreGroupCard";
import EmptyState from "../../components/EmptyState";
import { useTranslation } from "react-i18next";

const ExploreGroupsUser = () => {
  const { user } = useAuth();
  const [exploreGroups, setExploreGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("premium"); // Default tab is premium
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlLanguage = searchParams.get("language")?.toLowerCase() || null;
  const { t } = useTranslation();

  const handleBack = () => {
    navigate(-1);
  };

  useEffect(() => {
    const fetchGroups = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const groupsSnapshot = await getDocs(collection(db, "groups"));
        const allGroups = groupsSnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((group) => !user?.joinedGroups?.includes(group.id));
        
        // Don't filter by language here, keep all groups and filter in the search/filter logic
        setExploreGroups(allGroups);
      } catch (error) {
        console.error("Error fetching groups:", error);
        setError(
          "Unable to fetch groups at this time. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [user]);

  // Effect to handle search filtering with loading state
  const [filteredGroups, setFilteredGroups] = useState([]);

  useEffect(() => {
    // Show loading state when filtering
    setSearchLoading(true);

    // Small timeout to show the loading state (improves UX)
    const timer = setTimeout(() => {
      const searchTerm = searchQuery.toLowerCase().trim();
      
      const filtered = exploreGroups
        .filter((group) => {
          // First apply tab filter (premium/free)
          if (activeTab === "premium" && !group.isPremium) return false;
          if (activeTab === "free" && group.isPremium) return false;
          
          // Then apply URL language filter if present
          if (urlLanguage && 
              group.groupLearningLanguage?.toLowerCase() !== urlLanguage) {
            return false;
          }
          
          // If there's a search query, search across multiple fields
          if (searchTerm) {
            return (
              group.groupName?.toLowerCase().includes(searchTerm) ||
              group.groupDescription?.toLowerCase().includes(searchTerm) ||
              group.groupLearningLanguage?.toLowerCase().includes(searchTerm) ||
              group.tutorName?.toLowerCase().includes(searchTerm) ||
              group.topics?.some(topic => 
                topic.toLowerCase().includes(searchTerm)
              )
            );
          }
          
          // If no search query, include the group (it passed tab and URL language filters)
          return true;
        });

      setFilteredGroups(filtered);
      setSearchLoading(false);
    }, 300); // Small delay for better user experience

    return () => clearTimeout(timer);
  }, [searchQuery, exploreGroups, activeTab, urlLanguage]);

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
                {t("exploreGroups.title")}
              </h1>
            </div>
          </div>

          {/* Search Section */}
          <div className="flex flex-row items-center justify-between mb-6">
            {/* Tabs Section */}
            <div className="flex justify-center w-full sm:w-auto">
              <div className="relative inline-flex p-1 bg-gray-100 border border-gray-300 rounded-full">
                <div
                  className="absolute top-0 left-0 h-full bg-[#FFBF00] border border-[#042F0C] rounded-full transition-all duration-300 ease-in-out"
                  style={{
                    transform: `translateX(${
                      activeTab === "premium" ? "0%" : "100%"
                    })`,
                    width: "50%",
                  }}
                />

                <button
                  onClick={() => setActiveTab("premium")}
                  className="relative z-10 px-4 sm:px-6 py-2 rounded-full text-[#042F0C] text-md font-medium transition-colors whitespace-nowrap"
                >
                  bammbuu+ Groups
                </button>
                <button
                  onClick={() => setActiveTab("free")}
                  className="relative z-10 px-4 sm:px-6 py-2 rounded-full text-[#042F0C] text-md font-medium transition-colors whitespace-nowrap"
                >
                  Standard Groups{" "}
                </button>
              </div>
            </div>
            <div className="relative w-[40%]">
              <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
              <input
                type="text"
                placeholder={t("exploreGroups.search.placeholder")}
                className="w-full py-3 pl-10 pr-4 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
                value={searchQuery}
                onChange={handleSearchChange}
              />
              {urlLanguage && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                  {urlLanguage.charAt(0).toUpperCase() + urlLanguage.slice(1)}
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="min-w-0">
            {loading ? (
              <div className="flex items-center justify-center min-h-[60vh]">
                <ClipLoader color="#14B82C" size={50} />
              </div>
            ) : searchLoading ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <ClipLoader color="#14B82C" size={40} />
                <p className="mt-4 text-gray-600">Searching groups...</p>
              </div>
            ) : error ? (
              <p className="text-center text-red-500">{error}</p>
            ) : filteredGroups.length === 0 ? (
              <div className="flex items-center justify-center min-h-[60vh]">
                <EmptyState
                  message={
                    searchQuery || urlLanguage
                      ? t("exploreGroups.empty.noResults")
                      : t("exploreGroups.empty.noGroups")
                  }
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredGroups.map((group) => (
                  <div key={group.id}>
                    <ExploreGroupCard group={group} />
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

export default ExploreGroupsUser;