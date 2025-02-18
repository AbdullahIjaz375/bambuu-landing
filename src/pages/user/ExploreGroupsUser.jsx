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
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // State for active tab
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const language = searchParams.get("language")?.toLowerCase() || null;
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
          .filter((group) => !user?.joinedGroups?.includes(group.id))
          .filter(
            (group) =>
              !language ||
              group.groupLearningLanguage?.toLowerCase() === language
          );

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
  }, [user, language]);

  const filteredGroups = exploreGroups
    .filter((group) => {
      const searchTerm = searchQuery.toLowerCase().trim();

      if (!searchTerm) return true;

      // Adjust these fields based on your group data structure
      return (
        group.name?.toLowerCase().includes(searchTerm) ||
        group.description?.toLowerCase().includes(searchTerm) ||
        group.category?.toLowerCase().includes(searchTerm)
      );
    })
    .filter((group) => {
      if (activeTab === "all") return true;
      if (activeTab === "premium") return group.isPremium;
      if (activeTab === "free") return !group.isPremium;
      return true;
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
            </div>
          </div>

          {/* Content */}
          <div className="min-w-0">
            {loading ? (
              <div className="flex items-center justify-center min-h-[60vh]">
                <ClipLoader color="#14B82C" size={50} />
              </div>
            ) : error ? (
              <p className="text-center text-red-500">{error}</p>
            ) : filteredGroups.length === 0 ? (
              <div className="flex items-center justify-center min-h-[60vh]">
                <EmptyState
                  message={
                    searchQuery
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
