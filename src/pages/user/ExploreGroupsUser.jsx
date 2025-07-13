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
          "Unable to fetch groups at this time. Please try again later.",
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

      const filtered = exploreGroups.filter((group) => {
        // First apply tab filter (premium/free)
        if (activeTab === "premium" && !group.isPremium) return false;
        if (activeTab === "free" && group.isPremium) return false;

        // Then apply URL language filter if present
        if (
          urlLanguage &&
          group.groupLearningLanguage?.toLowerCase() !== urlLanguage
        ) {
          return false;
        }

        // If there's a search query, search across multiple fields
        if (searchTerm) {
          return (
            group.groupName?.toLowerCase().includes(searchTerm) ||
            group.groupDescription?.toLowerCase().includes(searchTerm) ||
            group.groupLearningLanguage?.toLowerCase().includes(searchTerm) ||
            group.tutorName?.toLowerCase().includes(searchTerm) ||
            group.topics?.some((topic) =>
              topic.toLowerCase().includes(searchTerm),
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
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <h1 className="whitespace-nowrap text-4xl font-semibold">
                {t("exploreGroups.title")}
              </h1>
            </div>
          </div>

          {/* Search Section */}
          <div className="mb-6 flex flex-row items-center justify-between">
            {/* Tabs Section */}
            <div className="flex w-full justify-center sm:w-auto">
              <div className="relative inline-flex rounded-full border border-gray-300 bg-gray-100 p-1">
                <div
                  className="absolute left-0 top-0 h-full rounded-full border border-[#042F0C] bg-[#FFBF00] transition-all duration-300 ease-in-out"
                  style={{
                    transform: `translateX(${
                      activeTab === "premium" ? "0%" : "100%"
                    })`,
                    width: "50%",
                  }}
                />

                <button
                  onClick={() => setActiveTab("premium")}
                  className="text-md relative z-10 whitespace-nowrap rounded-full px-4 py-2 font-medium text-[#042F0C] transition-colors sm:px-6"
                >
                  bammbuu+ Groups
                </button>
                <button
                  onClick={() => setActiveTab("free")}
                  className="text-md relative z-10 whitespace-nowrap rounded-full px-4 py-2 font-medium text-[#042F0C] transition-colors sm:px-6"
                >
                  Standard Groups{" "}
                </button>
              </div>
            </div>
            <div className="relative w-[40%]">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
              <input
                type="text"
                placeholder={t("exploreGroups.search.placeholder")}
                className="w-full rounded-full border border-gray-200 py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                value={searchQuery}
                onChange={handleSearchChange}
              />
              {urlLanguage && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 transform rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
                  {urlLanguage.charAt(0).toUpperCase() + urlLanguage.slice(1)}
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="min-w-0">
            {loading ? (
              <div className="flex min-h-[60vh] items-center justify-center">
                <ClipLoader color="#14B82C" size={50} />
              </div>
            ) : searchLoading ? (
              <div className="flex min-h-[60vh] flex-col items-center justify-center">
                <ClipLoader color="#14B82C" size={40} />
                <p className="mt-4 text-gray-600">Searching groups...</p>
              </div>
            ) : error ? (
              <p className="text-center text-red-500">{error}</p>
            ) : filteredGroups.length === 0 ? (
              <div className="flex min-h-[60vh] items-center justify-center">
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
