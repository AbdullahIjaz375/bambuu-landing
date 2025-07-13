import React, { useState, useEffect } from "react";
import { Search, ArrowLeft } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import GroupCardTutor from "../../components-tutor/GroupCardTutor";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { ClipLoader } from "react-spinners";
import EmptyState from "../../components/EmptyState";
import { useTranslation } from "react-i18next";

const GroupsTutor = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { t } = useTranslation();

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
        group.groupName.toLowerCase().includes(searchQuery.toLowerCase()),
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
                aria-label={t("groups-tutor.actions.back")}
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <h1 className="whitespace-nowrap text-4xl font-semibold">
                {t("groups-tutor.title")}
              </h1>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-4">
              <button
                onClick={handleCreateGroup}
                className="whitespace-nowrap rounded-full border border-[#5d5d5d] bg-white px-6 py-3 text-xl font-medium text-[#042f0c]"
              >
                {t("groups-tutor.actions.create-new")}
              </button>
            </div>
          </div>

          {/* Search Section */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
            <input
              type="text"
              placeholder={t("groups-tutor.search.placeholder")}
              className="w-full rounded-3xl border border-gray-200 py-3 pl-12 pr-4 focus:border-[#14B82C] focus:outline-none focus:ring-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Content Section */}
          <div className="min-w-0">
            {loading ? (
              <div className="flex min-h-[60vh] items-center justify-center">
                <ClipLoader color="#14B82C" size={50} />
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="flex min-h-[60vh] items-center justify-center">
                <EmptyState
                  message={
                    searchQuery
                      ? t("groups-tutor.states.empty.no-results")
                      : t("groups-tutor.states.empty.no-groups")
                  }
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredGroups.map((group) => (
                  <div key={group.id}>
                    <GroupCardTutor group={group} />
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

export default GroupsTutor;
