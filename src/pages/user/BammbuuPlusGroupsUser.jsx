import React, { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import ExploreGroupCard from "../../components/ExploreGroupCard";
import GroupCard from "../../components/GroupCard";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { ClipLoader } from "react-spinners";
import EmptyState from "../../components/EmptyState";
import { useTranslation } from "react-i18next";

const BammbuuPlusGroupsUser = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [myGroups, setMyGroups] = useState([]);
  const [otherPremiumGroups, setOtherPremiumGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { t } = useTranslation();

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        // Fetch user's joined groups
        const userGroups = [];
        if (user && user.joinedGroups) {
          for (let groupId of user.joinedGroups) {
            const groupRef = doc(db, "groups", groupId);
            const groupDoc = await getDoc(groupRef);
            if (groupDoc.exists() && groupDoc.data().isPremium === true) {
              userGroups.push({ id: groupDoc.id, ...groupDoc.data() });
            }
          }
        }
        setMyGroups(userGroups);

        // Fetch all premium groups
        const groupsRef = collection(db, "groups");
        const premiumQuery = query(groupsRef, where("isPremium", "==", true));
        const querySnapshot = await getDocs(premiumQuery);

        const otherGroups = [];
        querySnapshot.forEach((doc) => {
          // Only add groups user hasn't joined
          if (!user?.joinedGroups?.includes(doc.id)) {
            otherGroups.push({ id: doc.id, ...doc.data() });
          }
        });
        setOtherPremiumGroups(otherGroups);
      } catch (error) {
        console.error("Error fetching groups:", error);
      } finally {
        setLoadingGroups(false);
      }
    };

    fetchGroups();
  }, [user]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleCreateGroup = () => {
    navigate("/addGroupsUser");
  };

  const handleJoinGroup = () => {
    navigate("/learnLanguageUser");
  };

  const filterGroups = (groups) => {
    if (!searchQuery.trim()) return groups;
    return groups.filter((group) =>
      group.groupName.toLowerCase().includes(searchQuery.toLowerCase())
    );
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
            {/* <div className="flex flex-row items-center justify-center space-x-4">
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
            </div> */}
          </div>

          {/* My Groups */}
          <div className="my-6">
            <h2 className="text-3xl font-semibold">My Groups</h2>
          </div>

          {loadingGroups ? (
            <div className="flex items-center justify-center flex-1 min-h-[50vh]">
              <ClipLoader color="#14B82C" size={50} />
            </div>
          ) : filterGroups(myGroups).length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filterGroups(myGroups).map((group) => (
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

          {/* More Groups */}
          <div className="my-6">
            <h2 className="text-3xl font-semibold">More Groups</h2>
          </div>

          {loadingGroups ? (
            <div className="flex items-center justify-center flex-1 min-h-[50vh]">
              <ClipLoader color="#14B82C" size={50} />
            </div>
          ) : filterGroups(otherPremiumGroups).length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filterGroups(otherPremiumGroups).map((group) => (
                <div key={group.id}>
                  <ExploreGroupCard group={group} />
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
