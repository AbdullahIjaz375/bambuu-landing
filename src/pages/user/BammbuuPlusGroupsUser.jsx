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

const BammbuuPlusGroupsUser = () => {
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

          if (groupDoc.exists() && groupDoc.data().isPremium === true) {
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
    navigate("/addGroupsUser"); // Update with your actual route
  };

  const handleJoinGroup = () => {
    navigate("/learnLanguageUser"); // Update with your actual route
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
            <h1 className="text-4xl font-semibold">bammbuu+ Groups</h1>
          </div>
          <div className="flex flex-row items-center justify-center space-x-4">
            <button
              onClick={handleCreateGroup}
              className="px-6 py-3 text-[#042f0c] text-xl font-medium bg-white border border-[#5d5d5d] rounded-full"
            >
              Create New Group
            </button>
            <button
              onClick={handleJoinGroup}
              className="px-6 py-3 text-[#042f0c] text-xl font-medium bg-white border border-[#5d5d5d] rounded-full"
            >
              Join a Group
            </button>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
          <input
            type="text"
            placeholder="Search groups by name"
            className="w-full py-3 pl-10 pr-4 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loadingGroups ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <ClipLoader color="#14B82C" size={50} />
          </div>
        ) : filteredGroups.length > 0 ? (
          <div className="flex flex-wrap gap-4">
            {filteredGroups.map((group) => (
              <div key={group.id} className="flex-none w-80">
                <GroupCard group={group} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-[50vh]">
            <EmptyState
              message={searchQuery ? "No results found." : "No groups yet."}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default BammbuuPlusGroupsUser;
