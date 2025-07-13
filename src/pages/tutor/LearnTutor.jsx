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
import { useNavigate, Navigate } from "react-router-dom";
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
import { GroupSelectModal } from "../../components-tutor/AddClassFlow";
import GroupCardTutor from "../../components-tutor/GroupCardTutor";
import EmptyState from "../../components/EmptyState";
import CalenderTutor from "../../components-tutor/CalenderTutor";

const LearnTutor = () => {
  const { t } = useTranslation();
  const { user, setUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(
    t("learn-tutor.tabs.booked-classes"),
  );

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
          getDoc(doc(db, "classes", classId)),
        );

        // Fetch groups
        const groupPromises = tutorGroups.map((groupId) =>
          getDoc(doc(db, "groups", groupId)),
        );

        const [classSnapshots, groupSnapshots] = await Promise.all([
          Promise.all(classPromises),
          Promise.all(groupPromises),
        ]);

        // Filter out classes with classType "exam_prep" or "introductory_call"
        const fetchedClasses = classSnapshots
          .filter((doc) => doc.exists())
          .map((doc) => ({
            ...doc.data(),
            classId: doc.id,
          }))
          .filter(
            (class_) =>
              class_.classType !== "exam_prep" &&
              class_.classType !== "introductory_call",
          );

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
                (class_) => class_.classMemberIds?.length > 0,
              )
            : fetchedClasses.filter(
                (class_) => class_.classMemberIds?.length === 0,
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

  const [showGroupSelectModal, setShowGroupSelectModal] = useState(false);

  const handleGroupSelect = (group) => {
    setShowGroupSelectModal(false);
    navigate(`/addClassTutor?type=group&groupId=${group.id}`);
  };

  //------------------------------------------------------------------------------------//

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <ClipLoader color="#14b82c" size={50} />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login-tutor" replace />;
  }

  return (
    <>
      <div className="flex h-screen bg-white">
        <div className="h-full w-[272px] flex-shrink-0 p-4">
          <Sidebar user={user} />
        </div>

        <div className="min-w-[calc(100% - 272px)] h-[calc(100vh-0px)] flex-1 overflow-x-auto p-4 pl-0">
          <div className="h-[calc(100vh-32px)] overflow-y-auto rounded-3xl border border-[#e7e7e7] bg-white p-[16px]">
            <div className="mb-4 flex items-center justify-between border-b border-[#e7e7e7] pb-4">
              <div className="flex flex-row items-center space-x-4">
                <h1 className="text-3xl font-semibold">
                  {t("learn-tutor.greeting", { name: user.name })}
                </h1>
                <p className="text-lg text-[#616161]">
                  {t("learn-tutor.greeting-subtitle")}
                </p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-4">
                <NotificationDropdown />
              </div>
            </div>

            <CalenderTutor />

            <div className="w-full">
              <div className="flex flex-row items-center justify-between pt-4">
                <div className="relative inline-flex rounded-full border border-gray-300 bg-gray-100 p-1">
                  <div
                    className="absolute left-0 top-0 h-full rounded-full border border-[#042F0C] bg-[#FFBF00] transition-all duration-300 ease-in-out"
                    style={{
                      transform: `translateX(${
                        activeTab === t("learn-tutor.tabs.booked-classes")
                          ? "0"
                          : "100%"
                      })`,
                      width: "50%",
                    }}
                  />
                  <button
                    onClick={() =>
                      setActiveTab(t("learn-tutor.tabs.booked-classes"))
                    }
                    className="z-1 text-md relative whitespace-nowrap rounded-full px-4 py-2 font-medium text-[#042F0C] transition-colors sm:px-6"
                  >
                    {t("learn-tutor.tabs.booked-classes")}
                  </button>
                  <button
                    onClick={() =>
                      setActiveTab(t("learn-tutor.tabs.available-classes"))
                    }
                    className="z-1 text-md relative whitespace-nowrap rounded-full px-4 py-2 font-medium text-[#042F0C] transition-colors sm:px-6"
                  >
                    {t("learn-tutor.tabs.available-classes")}
                  </button>
                </div>
                <div className="flex flex-row items-center space-x-2">
                  <button
                    className="flex min-h-10 items-center rounded-3xl border-[0.75px] border-[#5D5D5D] bg-[#14b82c] px-4 py-1 text-base font-medium text-[#042f0c]"
                    onClick={() => setShowGroupSelectModal(true)}
                  >
                    <Plus /> {t("learn-tutor.actions.new-class")}
                  </button>

                  <button
                    className="flex min-h-10 items-center rounded-3xl border-[0.75px] border-[#5D5D5D] bg-[#e6fde9] px-4 py-1 text-base font-medium text-[#042f0c]"
                    onClick={() => navigate("/classesTutor")}
                  >
                    {t("learn-tutor.actions.view-all")}
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex h-48 items-center justify-center">
                  <ClipLoader color="#14b82c" />
                </div>
              ) : classes.length === 0 ? (
                <div className="flex flex-col items-center justify-center space-y-4 rounded-lg bg-white p-8">
                  <EmptyState message="No class yet!" />
                </div>
              ) : (
                <div className="relative mt-2 w-full">
                  <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-4">
                    {classes.map((classData) => (
                      <div
                        key={classData.classId}
                        className="w-72 flex-none px-1 pt-3"
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

            <div className="w-full">
              <div className="flex flex-row items-center justify-between pt-4">
                <div>
                  <h2 className="text-2xl font-bold">
                    {t("learn-tutor.sections.my-groups")}
                  </h2>
                </div>
                <div className="flex flex-row items-center space-x-2">
                  <button
                    className="flex min-h-10 items-center rounded-3xl border-[0.75px] border-[#5D5D5D] bg-[#14b82c] px-4 py-1 text-base font-medium text-[#042f0c]"
                    onClick={() => navigate("/addGroupsTutor")}
                  >
                    <Plus /> {t("learn-tutor.actions.new-group")}
                  </button>

                  <button
                    className="flex min-h-10 items-center rounded-3xl border-[0.75px] border-[#5D5D5D] bg-[#e6fde9] px-4 py-1 text-base font-medium text-[#042f0c]"
                    onClick={() => navigate("/groupsTutor")}
                  >
                    {t("learn-tutor.actions.view-all")}
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex h-48 items-center justify-center">
                  <ClipLoader color="#14b82c" size={50} />
                </div>
              ) : groups.length === 0 ? (
                <div className="flex flex-col items-center justify-center space-y-4 rounded-lg bg-white p-8">
                  <EmptyState message="No group yet!" />
                </div>
              ) : (
                <div className="relative w-full">
                  <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-4">
                    {groups.map((group) => (
                      <div
                        key={group.groupId}
                        className="w-72 flex-none px-1 pt-2"
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

        <GroupSelectModal
          isOpen={showGroupSelectModal}
          onClose={() => {
            setShowGroupSelectModal(false);
          }}
          onSelect={handleGroupSelect}
          groups={groups}
        />
      </div>
    </>
  );
};

export default LearnTutor;
