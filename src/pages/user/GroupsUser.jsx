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

const GroupsUser = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user && user.joinedGroups) {
      const fetchGroups = async () => {
        const fetchedGroups = [];

        for (let groupId of user.joinedGroups) {
          const groupRef = doc(db, "groups", groupId);
          const groupDoc = await getDoc(groupRef);

          if (groupDoc.exists()) {
            fetchedGroups.push({ id: groupDoc.id, ...groupDoc.data() });
          }
        }

        setGroups(fetchedGroups);
        setFilteredGroups(fetchedGroups);
        setLoadingGroups(false);
        console.log("my groups", groups);
      };

      fetchGroups();
    } else {
      setLoadingGroups(false);
    }
  }, [user]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = groups.filter(
        (group) =>
          group.groupName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (group.groupLearningLanguage &&
            group.groupLearningLanguage
              .toLowerCase()
              .includes(searchQuery.toLowerCase()))
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
    navigate("/addGroupsUser"); // Update with your actual route
  };

  const handleJoinGroup = () => {
    navigate("/exploreGroupsUser"); // Update with your actual route
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
                My Groups
              </h1>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-4">
              <button
                onClick={handleCreateGroup}
                className="px-6 py-3 text-[#042f0c] text-xl font-medium bg-white border border-[#5d5d5d] rounded-full whitespace-nowrap"
              >
                Create New Group
              </button>
              <button
                onClick={handleJoinGroup}
                className="px-6 py-3 text-[#042f0c] text-xl font-medium bg-white border border-[#5d5d5d] rounded-full whitespace-nowrap"
              >
                Join a Group
              </button>
            </div>
          </div>

          {/* Search Section */}
          <div className="relative mb-6">
            <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
            <input
              type="text"
              placeholder="Search groups by name"
              className="w-full py-3 pl-10 pr-4 border border-gray-200 rounded-3xl focus:border-[#14B82C] focus:ring-0 focus:outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Content Section */}
          <div className="min-w-0">
            {loadingGroups ? (
              <div className="flex items-center justify-center min-h-[60vh]">
                <ClipLoader color="#14B82C" size={50} />
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="flex items-center justify-center min-h-[60vh]">
                <EmptyState
                  message={
                    searchQuery
                      ? "No results found."
                      : "You haven't joined any groups yet. Start by joining or creating a group!"
                  }
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredGroups.map((group) => (
                  <div key={group.id}>
                    <GroupCard group={group} />
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

export default GroupsUser;
