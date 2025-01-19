import { Search, Plus } from "lucide-react";
import NotificationDropdown from "../../components/NotificationDropdown";
import React, { useState, useEffect } from "react";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Users,
  BookOpen,
  Star,
  Database,
  UserCircle,
  User,
} from "lucide-react";
import Sidebar from "../../components/Sidebar";
import ClassCardTutor from "../../components-tutor/ClassCardTutor";
import { useAuth } from "../../context/AuthContext";
import GroupCard from "../../components/GroupCard";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebaseConfig";
import { useTranslation } from "react-i18next";

import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { ClipLoader } from "react-spinners";
import {
  ClassTypeModal,
  GroupSelectModal,
} from "../../components-tutor/AddClassFlow";
import GroupCardTutor from "../../components-tutor/GroupCardTutor";
import EmptyState from "../../components/EmptyState";
import CalenderTutor from "../../components-tutor/CalenderTutor";

const LearnTutor = () => {
  const { t } = useTranslation();

  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(
    t("learn-tutor.tabs.booked-classes")
  );
  const TABS = [
    t("learn-tutor.tabs.booked-classes"),
    t("learn-tutor.tabs.available-classes"),
  ];
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    const fetchClassesAndGroupsData = async () => {
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
        const tutorClasses = tutorData.tutorOfClasses || [];
        const tutorGroups = tutorData.tutorOfGroups || [];

        // Fetch classes
        const classPromises = tutorClasses.map((classId) =>
          getDoc(doc(db, "classes", classId))
        );

        // Fetch groups
        const groupPromises = tutorGroups.map((groupId) =>
          getDoc(doc(db, "groups", groupId))
        );

        const [classSnapshots, groupSnapshots] = await Promise.all([
          Promise.all(classPromises),
          Promise.all(groupPromises),
        ]);

        const fetchedClasses = classSnapshots
          .filter((doc) => doc.exists())
          .map((doc) => ({
            ...doc.data(),
            classId: doc.id,
          }));

        const fetchedGroups = groupSnapshots
          .filter((doc) => doc.exists())
          .map((doc) => ({
            ...doc.data(),
            groupId: doc.id,
          }));

        // Filter classes based on active tab
        const filteredClasses =
          activeTab === "Booked Classes"
            ? fetchedClasses.filter(
                (class_) => class_.classMemberIds?.length > 0
              )
            : fetchedClasses.filter(
                (class_) => class_.classMemberIds?.length === 0
              );

        setClasses(filteredClasses);
        setGroups(fetchedGroups);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClassesAndGroupsData();
  }, [user.uid, activeTab]);

  //--------------------------------------------adding class----------------------------//

  const [showClassTypeModal, setShowClassTypeModal] = useState(false);
  const [showGroupSelectModal, setShowGroupSelectModal] = useState(false);
  // Add these handlers
  const handleClassTypeSelect = (type) => {
    setShowClassTypeModal(false);
    if (type === "group") {
      setShowGroupSelectModal(true);
    } else {
      navigate(`/addClassTutor?type=individual`);
    }
  };

  const handleGroupSelect = (group) => {
    setShowGroupSelectModal(false);
    navigate(`/addClassTutor?type=group&groupId=${group.id}`);
  };

  //------------------------------------------------------------------------------------//

  return (
    <>
      <div className="flex h-screen bg-white">
        <div className="flex-shrink-0 w-64 h-full">
          <Sidebar user={user} />
        </div>

        <div className="flex-1 overflow-x-auto min-w-[calc(100%-16rem)] h-full">
          <div className="h-[calc(100vh-1rem)] p-8 bg-white border-2 border-[#e7e7e7] rounded-3xl m-2 overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-[#e7e7e7] pb-4">
              <div className="flex flex-row items-center space-x-4">
                <h1 className="text-3xl font-semibold">
                  {t("learn-tutor.greeting", { name: user.name })}
                </h1>
                <p className="text-[#616161] text-lg">
                  {t("learn-tutor.greeting-subtitle")}
                </p>
              </div>
              <div className="flex items-center flex-shrink-0 gap-4">
                <NotificationDropdown />
              </div>
            </div>

            <CalenderTutor />

            <div className="w-full max-w-[160vh] mx-auto">
              <div className="flex flex-row items-center justify-between pt-4">
                <div className="flex bg-gray-100 border border-[#888888] rounded-full w-fit">
                  {TABS.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-12 py-2 rounded-full text-lg font-medium transition-all ${
                        activeTab === tab
                          ? "bg-[#ffbf00] text-[#042f0c] border border-[#042f0c]"
                          : "text-[#042f0c] hover:text-black"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="flex flex-row items-center space-x-2">
                  <button
                    className="px-3 py-2 text-[#042f0c] text-lg font-semibold bg-[#14b82c] border border-black rounded-full flex items-center"
                    onClick={() => setShowClassTypeModal(true)}
                  >
                    <Plus /> {t("learn-tutor.actions.new-class")}
                  </button>

                  <button
                    className="px-3 py-2 text-[#042f0c] text-lg font-semibold bg-[#e6fde9] border border-black rounded-full flex items-center"
                    onClick={() => navigate("/classesTutor")}
                  >
                    {t("learn-tutor.actions.view-all")}
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-48">
                  <ClipLoader color="#14b82c" />
                </div>
              ) : classes.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-white rounded-lg">
                  <EmptyState message="No class yet!" />
                </div>
              ) : (
                <div className="relative w-full mt-2">
                  <div className="flex gap-2 pb-4 overflow-x-auto scrollbar-hide">
                    {classes.map((classData) => (
                      <div
                        key={classData.classId}
                        className="flex-none px-1 pt-3 w-72"
                      >
                        <ClassCardTutor
                          {...classData}
                          isBammbuu={Boolean(classData.tutorId)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="w-full max-w-[160vh] mx-auto">
              <div className="flex flex-row items-center justify-between pt-4">
                <div>
                  <h2 className="text-2xl font-bold">
                    {t("learn-tutor.sections.my-groups")}
                  </h2>
                </div>
                <div className="flex flex-row items-center space-x-2">
                  <button
                    className="px-3 py-2 text-[#042f0c] text-lg font-semibold bg-[#14b82c] border border-black rounded-full flex items-center"
                    onClick={() => navigate("/addGroupsTutor")}
                  >
                    <Plus /> {t("learn-tutor.actions.new-group")}
                  </button>

                  <button
                    className="px-3 py-2 text-[#042f0c] text-lg font-semibold bg-[#e6fde9] border border-black rounded-full flex items-center"
                    onClick={() => navigate("/groupsTutor")}
                  >
                    {t("learn-tutor.actions.view-all")}
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-48">
                  <ClipLoader color="#14b82c" size={50} />
                </div>
              ) : groups.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-white rounded-lg">
                  <EmptyState message="No group yet!" />
                </div>
              ) : (
                <div className="relative w-full">
                  <div className="flex gap-2 pb-4 overflow-x-auto scrollbar-hide">
                    {groups.map((group) => (
                      <div
                        key={group.groupId}
                        className="flex-none px-1 pt-2 w-72"
                      >
                        <GroupCardTutor group={group} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <ClassTypeModal
          isOpen={showClassTypeModal}
          onClose={() => setShowClassTypeModal(false)}
          onSelect={handleClassTypeSelect}
        />

        <GroupSelectModal
          isOpen={showGroupSelectModal}
          onClose={() => {
            setShowGroupSelectModal(false);
            setShowClassTypeModal(true);
          }}
          onSelect={handleGroupSelect}
          groups={groups}
        />
      </div>
    </>
  );
};

export default LearnTutor;
