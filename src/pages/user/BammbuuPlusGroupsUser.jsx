import React, { useState, useEffect } from "react";
import { Search, ArrowLeft } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import GroupCard from "../../components/GroupCard";
import { collection, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { ClipLoader } from "react-spinners";
import EmptyState from "../../components/EmptyState";
import { useTranslation } from "react-i18next";

const BammbuuPlusGroupsUser = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { t } = useTranslation();

  useEffect(() => {
    if (user && user.joinedGroups) {
      const fetchGroups = async () => {
        const fetchedGroups = [];
        for (let groupId of user.joinedGroups) {
          const groupRef = doc(db, "groups", groupId);
          const groupDoc = await getDoc(groupRef);
          if (groupDoc.exists() && groupDoc.data().isPremium === true) {
            fetchedGroups.push({ id: groupDoc.id, ...groupDoc.data() });
          }
        }
        setGroups(fetchedGroups);
        setFilteredGroups(fetchedGroups);
        setLoadingGroups(false);
      };
      fetchGroups();
    } else {
      setLoadingGroups(false);
    }
  }, [user]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = groups.filter((group) =>
        group.groupName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredGroups(filtered);
    } else {
      setFilteredGroups(groups);
    }
  }, [searchQuery, groups]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleCreateGroup = () => {
    navigate("/addGroupsUser");
  };

  const handleJoinGroup = () => {
    navigate("/learnLanguageUser");
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
                {t("bammbuu-groups.title")}
              </h1>
            </div>
            <div className="flex flex-row items-center justify-center space-x-4">
              <button
                onClick={handleCreateGroup}
                className="px-6 py-3 text-[#042f0c] text-xl font-medium bg-white border border-[#5d5d5d] rounded-full hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                {t("bammbuu-groups.buttons.create")}
              </button>
              <button
                onClick={handleJoinGroup}
                className="px-6 py-3 text-[#042f0c] text-xl font-medium bg-white border border-[#5d5d5d] rounded-full hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                {t("bammbuu-groups.buttons.join")}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
            <input
              type="text"
              placeholder={t("bammbuu-groups.search.placeholder")}
              className="w-full py-3 pl-10 pr-4 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Content Area */}
          {loadingGroups ? (
            <div className="flex items-center justify-center flex-1 min-h-[50vh]">
              <ClipLoader color="#14B82C" size={50} />
            </div>
          ) : filteredGroups.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredGroups.map((group) => (
                <div key={group.id}>
                  <GroupCard group={group} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center min-h-[50vh]">
              <EmptyState
                message={t(
                  searchQuery
                    ? "bammbuu-groups.empty-state.no-results"
                    : "bammbuu-groups.empty-state.no-groups"
                )}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BammbuuPlusGroupsUser;
