import React, { useState, useEffect } from "react";
import { Search, ArrowLeft } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import GroupCardTutor from "../../components-tutor/GroupCardTutor";
import { collection, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { ClipLoader } from "react-spinners";

const GroupsTutor = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);

        // Get the tutor document
        const tutorDoc = await getDoc(doc(db, "tutors", user.uid));

        if (!tutorDoc.exists()) {
          console.error("Tutor document not found");
          setLoading(false);
          return;
        }

        const tutorData = tutorDoc.data();
        const tutorGroups = tutorData.tutorOfGroups || [];

        // Fetch all groups from tutorOfGroups array
        const fetchedGroups = [];
        for (const groupId of tutorGroups) {
          const groupRef = doc(db, "groups", groupId);
          const groupDoc = await getDoc(groupRef);

          if (groupDoc.exists()) {
            fetchedGroups.push({ id: groupId, ...groupDoc.data() });
          }
        }

        setGroups(fetchedGroups);
        setFilteredGroups(fetchedGroups);
      } catch (error) {
        console.error("Error fetching groups:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchGroups();
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
    navigate("/learn");
  };

  const handleCreateGroup = () => {
    navigate("/addGroupsTutor");
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
            <h1 className="text-4xl font-semibold">My Groups</h1>
          </div>
          <div className="flex flex-row items-center justify-center space-x-4">
            <button
              onClick={handleCreateGroup}
              className="px-6 py-3 text-[#042f0c] text-xl font-medium bg-white border border-[#5d5d5d] rounded-full"
            >
              Create New Group
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

        {loading ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <ClipLoader color="#14B82C" size={50} />
          </div>
        ) : filteredGroups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
            {filteredGroups.map((group) => (
              <GroupCardTutor key={group.id} group={group} />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-[30vh]">
            <p className="text-xl text-gray-500">
              {searchQuery
                ? "No groups found matching your search."
                : "You haven't created any groups yet. Start by creating a new group!"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupsTutor;
