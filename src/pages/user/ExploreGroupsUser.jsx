import React, { useEffect, useState } from "react";
import { Search, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { ClipLoader } from "react-spinners";
import Sidebar from "../../components/Sidebar";
import ExploreGroupCard from "../../components/ExploreGroupCard";

const ExploreGroupsUser = () => {
  const { user } = useAuth();
  const [exploreGroups, setExploreGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

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
        // Fetch all groups
        const groupsSnapshot = await getDocs(collection(db, "groups"));
        const allGroups = groupsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Filter out groups that the user has already joined
        const availableGroups = allGroups.filter(
          (group) => !user?.joinedGroups?.includes(group.id)
        );
        setExploreGroups(availableGroups);
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

  const filteredGroups = exploreGroups.filter((group) => {
    const searchTerm = searchQuery.toLowerCase().trim();

    if (!searchTerm) return true;

    // Adjust these fields based on your group data structure
    return (
      group.name?.toLowerCase().includes(searchTerm) ||
      group.description?.toLowerCase().includes(searchTerm) ||
      group.category?.toLowerCase().includes(searchTerm)
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
            <h1 className="text-4xl font-semibold">Explore Groups</h1>
          </div>
        </div>

        <div className="flex flex-row items-center justify-between">
          <div className="relative w-full mb-6">
            <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
            <input
              type="text"
              placeholder="Search groups by name or category"
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
        ) : filteredGroups.length === 0 ? (
          <p className="text-center text-gray-500">
            {searchQuery
              ? "No groups found matching your search."
              : "No available groups found."}
          </p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {filteredGroups.map((group) => (
              <div key={group.id} className="flex-none w-80">
                <ExploreGroupCard group={group} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExploreGroupsUser;
