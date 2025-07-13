import React, { useState, useEffect } from "react";
import { Search, ArrowLeft } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import GroupCard from "../../components/GroupCard";
import { collection, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { ClipLoader } from "react-spinners";
import EmptyState from "../../components/EmptyState";

const GroupsUser = () => {
  const { user, setUser } = useAuth();
  const [searchParams] = useSearchParams();
  const language = searchParams.get("language")?.toLowerCase() || null;
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
        const filteredByLanguage = language
          ? fetchedGroups.filter(
              (group) =>
                group.groupLearningLanguage?.toLowerCase() === language,
            )
          : fetchedGroups;

        setGroups(filteredByLanguage);
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
      const filtered = groups.filter(
        (group) =>
          group.groupName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (group.groupLearningLanguage &&
            group.groupLearningLanguage
              .toLowerCase()
              .includes(searchQuery.toLowerCase())),
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
    navigate("/exploreGroupsUser");
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
                My Groups
              </h1>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-4">
              <button
                onClick={handleCreateGroup}
                className="whitespace-nowrap rounded-full border border-[#5d5d5d] bg-white px-6 py-3 text-xl font-medium text-[#042f0c]"
              >
                Create New Group
              </button>
              <button
                onClick={handleJoinGroup}
                className="whitespace-nowrap rounded-full border border-[#5d5d5d] bg-white px-6 py-3 text-xl font-medium text-[#042f0c]"
              >
                Join a Group
              </button>
            </div>
          </div>

          {/* Search Section */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
            <input
              type="text"
              placeholder="Search groups by name"
              className="w-full rounded-3xl border border-gray-200 py-3 pl-10 pr-4 focus:border-[#14B82C] focus:outline-none focus:ring-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Content Section */}
          <div className="min-w-0">
            {loadingGroups ? (
              <div className="flex min-h-[60vh] items-center justify-center">
                <ClipLoader color="#14B82C" size={50} />
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="flex min-h-[60vh] items-center justify-center">
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
