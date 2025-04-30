import React, { useState, useEffect } from "react";
import {
  X,
  Clock,
  Calendar,
  User,
  Users,
  Camera,
  MapPin,
  ArrowLeft,
} from "lucide-react";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { useTranslation } from "react-i18next";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { ChannelType } from "../../config/stream";
import { addMemberToStreamChannel } from "../../services/streamService";
import { db, storage } from "../../firebaseConfig";
import { ClipLoader } from "react-spinners";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import { TimeInput } from "@mantine/dates";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "react-datepicker/dist/react-datepicker-cssmodules.css";
import TimePicker from "react-time-picker";
import "react-time-picker/dist/TimePicker.css";
import "react-clock/dist/Clock.css";
import { Radio, Group } from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { useParams } from "react-router-dom";
import ClassCard from "../../components/ClassCard";
import Modal from "react-modal";
import ExploreClassCard from "../../components/ExploreClassCard";
import PlansModal from "../../components/PlansModal";
import { useGroupJoining } from "../../hooks/useGroupJoining";
import EmptyState from "../../components/EmptyState";
import ClassInfoCard from "../../components/ClassInfoCard";
import GroupInfoCard from "../../components/GroupInfoCard";
Modal.setAppElement("#root");

const GroupDetailsNotJoinedUser = ({ onClose }) => {
  const { user, setUser } = useAuth(); // Destructure setUser to update context

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Classes");
  const [classes, setClasses] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  //------------------------------------------fetching groups-----------------------------------------//

  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [error, setError] = useState(null);
  const fetchGroup = async () => {
    if (!groupId) {
      setError("No group ID provided");
      setLoading(false);
      return;
    }

    try {
      const groupDoc = await getDoc(doc(db, "groups", groupId));

      if (!groupDoc.exists()) {
        setError("Group not found");
        setLoading(false);
        return;
      }

      setGroup({ id: groupDoc.id, ...groupDoc.data() });
    } catch (err) {
      console.error("Error fetching group:", err);
      setError("Failed to fetch group details");
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchGroup();
  }, [groupId]);

  //-----------------------------getting tutor details------------------------------------------//

  const [groupTutor, setGroupTutor] = useState(null);

  const fetchGroupTutor = async () => {
    if (!group?.groupAdminId) return;

    try {
      // Check in tutors collection
      const tutorDoc = await getDoc(doc(db, "tutors", group.groupAdminId));
      if (tutorDoc.exists()) {
        setGroupTutor({ id: tutorDoc.id, ...tutorDoc.data() });
        return;
      }

      // If not found in tutors, check students collection
      const studentDoc = await getDoc(doc(db, "students", group.groupAdminId));
      if (studentDoc.exists()) {
        setGroupTutor({ id: studentDoc.id, ...studentDoc.data() });
      }
    } catch (error) {
      console.error("Error fetching group admin:", error);
    }
  };

  useEffect(() => {
    if (group) {
      fetchGroupTutor();
    }
  }, [group]);

  //---------------------------------------------------------------------------------------------------//

  const fetchData = async () => {
    if (!group) return;

    try {
      // Fetch classes
      if (group.classIds && group.classIds.length > 0) {
        const classesData = await Promise.all(
          group.classIds.map(async (classId) => {
            const classDoc = await getDoc(doc(db, "classes", classId));
            return classDoc.exists()
              ? { id: classDoc.id, ...classDoc.data() }
              : null;
          })
        );
        setClasses(classesData.filter(Boolean));
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [group]);

  //--------------------------------------------------adding a class--------------------------------------------//

  const renderClasses = () => {
    if (classes.length === 0) {
      return (
        <div className="flex items-center justify-center h-96">
          <EmptyState message="No classes available" />
        </div>
      );
    }

    // Get enrolled classes from localStorage
    const user = JSON.parse(sessionStorage.getItem("user"));
    const enrolledClasses = user?.enrolledClasses || [];

    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {classes.map((classItem) => {
          const isEnrolled = enrolledClasses.includes(classItem.classId);

          return isEnrolled ? (
            <ClassCard
              key={classItem.classId}
              classId={classItem.classId}
              className={classItem.className}
              language={classItem.language}
              languageLevel={classItem.languageLevel}
              classDateTime={classItem.classDateTime}
              classDuration={classItem.classDuration}
              adminId={classItem.adminId}
              adminName={classItem.adminName}
              adminImageUrl={classItem.adminImageUrl}
              classMemberIds={classItem.classMemberIds}
              availableSpots={classItem.availableSpots}
              imageUrl={classItem.imageUrl}
              classDescription={classItem.classDescription}
              classAddress={classItem.classAddress}
              groupId={classItem.groupId}
              recurrenceType={classItem.recurrenceType}
              classType={classItem.classType}
              classLocation={classItem.classLocation}
            />
          ) : (
            <ExploreClassCard
              key={classItem.classId}
              classId={classItem.classId}
              className={classItem.className}
              language={classItem.language}
              languageLevel={classItem.languageLevel}
              classDateTime={classItem.classDateTime}
              classDuration={classItem.classDuration}
              adminId={classItem.adminId}
              adminName={classItem.adminName}
              adminImageUrl={classItem.adminImageUrl}
              classMemberIds={classItem.classMemberIds}
              availableSpots={classItem.availableSpots}
              imageUrl={classItem.imageUrl}
              classDescription={classItem.classDescription}
              classAddress={classItem.classAddress}
              groupId={classItem.groupId}
              recurrenceType={classItem.recurrenceType}
              classType={classItem.classType}
              classLocation={classItem.classLocation}
            />
          );
        })}
      </div>
    );
  };
  const handleBack = () => {
    navigate(-1);
  };

  //---------------------------------joining group----------------------------//\

  const updateContextAndSession = (newGroupId) => {
    // Create updated user object with new group
    const updatedUser = {
      ...user,
      joinedGroups: [...(user.joinedGroups || []), newGroupId],
    };

    // Update context
    setUser(updatedUser);

    // Update session storage
    const storedUser = JSON.parse(sessionStorage.getItem("user") || "{}");
    const updatedStoredUser = {
      ...storedUser,
      joinedGroups: [...(storedUser.joinedGroups || []), newGroupId],
    };
    sessionStorage.setItem("user", JSON.stringify(updatedStoredUser));
  };
  const [isJoining, setIsJoining] = useState(false);

  const { handleGroupJoining, checkJoiningEligibility } = useGroupJoining();
  const [isPlansModalOpen, setIsPlansModalOpen] = useState(false);

  const handleJoinConfirm = async () => {
    try {
      setIsJoining(true);

      if (user.freeAccess) {
        // Allow user to join the group immediately
        const groupRef = doc(db, "groups", groupId);
        const userRef = doc(db, "students", user.uid);

        // Get the current group data to check if user is already a member
        const groupDoc = await getDoc(groupRef);
        const groupData = groupDoc.data();

        if (groupData.memberIds.includes(user.uid)) {
          return;
        }

        const channel = group.isPremium
          ? ChannelType.PREMIUM_GROUP
          : ChannelType.STANDARD_GROUP;

        try {
          await addMemberToStreamChannel({
            channelId: groupId,
            userId: user.uid,
            type: channel,
            role: "channel_member",
          });
        } catch (streamError) {
          console.error("Error adding to stream channel:", streamError);
          throw new Error("Failed to join group chat");
        }

        // Update the group document to add the user's ID to memberIds
        await updateDoc(groupRef, {
          memberIds: arrayUnion(user.uid),
        });

        // Update the user document to add the group ID to joinedGroups
        await updateDoc(userRef, {
          joinedGroups: arrayUnion(groupId),
        });

        // Update context and session storage
        updateContextAndSession(groupId);

        navigate(`/groupDetailsUser/${groupId}`, { replace: true });
        return;
      }

      // First check eligibility
      const eligibility = checkJoiningEligibility(
        user,
        group.isPremium ? "Premium" : "Standard",
        user.subscriptions
      );

      if (!eligibility.canJoin) {
        console.error("Cannot join group:", eligibility.message);
        setIsPlansModalOpen(true);
        return;
      }

      // Get references to the group and user documents
      const groupRef = doc(db, "groups", groupId);
      const userRef = doc(db, "students", user.uid);

      // Get the current group data to check if user is already a member
      const groupDoc = await getDoc(groupRef);
      const groupData = groupDoc.data();

      if (groupData.memberIds.includes(user.uid)) {
        return;
      }

      const channel = group.isPremium
        ? ChannelType.PREMIUM_GROUP
        : ChannelType.STANDARD_GROUP;

      try {
        await addMemberToStreamChannel({
          channelId: groupId,
          userId: user.uid,
          type: channel,
          role: "channel_member",
        });
      } catch (streamError) {
        console.error("Error adding to stream channel:", streamError);
        throw new Error("Failed to join group chat");
      }

      // Update the group document to add the user's ID to memberIds
      await updateDoc(groupRef, {
        memberIds: arrayUnion(user.uid),
      });

      // Update the user document to add the group ID to joinedGroups
      await updateDoc(userRef, {
        joinedGroups: arrayUnion(groupId),
      });

      // Update context and session storage
      updateContextAndSession(groupId);

      navigate(`/groupDetailsUser/${groupId}`, { replace: true });
    } catch (error) {
      console.error("Error joining group:", error);
      // Handle error appropriately - show error message to user
    } finally {
      setIsJoining(false);
    }
  };

  //-----------------------------------------------------------------------//

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[100vh] ">
        <div className="p-8 bg-white rounded-lg">
          <ClipLoader color="#FFB800" size={40} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="p-8 bg-white rounded-lg">
          <p className="mb-4 text-red-500">{error}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!group) {
    return null;
  }

  return (
    <>
      <div className="flex min-h-screen">
        <div className="flex flex-1 m-6 border rounded-3xl">
          <div className="flex flex-col w-full p-6 mx-4 bg-white rounded-3xl">
            <div className="flex items-center justify-between pb-4 mb-6 border-b">
              <div className="flex items-center gap-4">
                <button
                  className="p-3 bg-gray-100 rounded-full"
                  onClick={handleBack}
                >
                  <ArrowLeft size="30" />
                </button>
                <h1 className="text-4xl font-semibold">
                  {t("group-details.title")}
                </h1>
              </div>
            </div>

            <div className="flex flex-1 h-screen gap-6 overflow-hidden">
              {/* Left sidebar */}
              <div
                className={`w-1/4 h-[90vh]  p-6 rounded-3xl shrink-0 ${
                  group.isPremium ? "bg-[#e6fce8]" : "bg-[#ffffea]"
                }`}
              >
                {" "}
                <div className="flex flex-col items-center justify-between h-full text-center">
                  <div className="flex flex-col items-center text-center">
                    <img
                      src={group.imageUrl}
                      alt={group.groupName}
                      className="object-cover w-24 h-24 mb-4 rounded-full md:w-32 md:h-32"
                    />
                    <h3 className="mb-2 text-xl font-semibold md:text-2xl">
                      {group.groupName}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex flex-row items-center space-x-1">
                        <img
                          src={
                            group.groupLearningLanguage === "English"
                              ? "/svgs/xs-us.svg"
                              : group.groupLearningLanguage === "Spanish"
                              ? "/svgs/xs-spain.svg"
                              : "/svgs/eng-spanish-xs.svg"
                          }
                          alt={
                            group.groupLearningLanguage === "English"
                              ? "US Flag"
                              : "Spain Flag"
                          }
                          className="w-5 h-5 sm:w-auto"
                        />
                        <span className="text-sm md:text-md">
                          {group.groupLearningLanguage}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center mt-2 md:flex-row md:space-x-40">
                      <div className="flex items-center gap-1 mb-2 md:mb-4">
                        <img
                          src={group.groupAdminImageUrl}
                          alt="admin"
                          className="w-4 rounded-full md:w-5"
                        />
                        <span className="text-xs text-gray-800 md:text-sm">
                          {group.groupAdminName}{" "}
                          {t("group-details.admin-label")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mb-2 md:mb-4">
                        <img
                          alt="bammbuu"
                          src="/svgs/users.svg"
                          className="w-4 md:w-5"
                        />
                        <span className="text-xs text-gray-800 md:text-sm">
                          {t("group-details.members")}
                        </span>
                      </div>
                    </div>

                    <p className="mb-6 text-sm text-gray-600 md:text-base">
                      {group.groupDescription}
                    </p>
                  </div>

                  <div className="w-full space-y-4">
                    {" "}
                    {group.isPremium ? <GroupInfoCard group={group} /> : <></>}
                  </div>
                </div>
              </div>

              {/* Main content */}
              <div className="flex-1 h-[90vh] overflow-y-auto scrollbar-hide">
                <div className="h-full overflow-y-auto scrollbar-hide">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <ClipLoader color="#FFB800" size={40} />
                    </div>
                  ) : (
                    <div className="pr-4">{renderClasses()}</div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-row items-center justify-between mt-2">
              <button
                className="px-8 py-2 text-lg text-black border border-black rounded-full "
                onClick={handleBack}
              >
                {t("group-details.buttons.cancel")}
              </button>
              <button
                className="px-8 text-lg py-2 text-black bg-[#ffbf00] border border-black rounded-full "
                onClick={handleJoinConfirm}
              >
                {isJoining
                  ? t("group-details.buttons.join.loading")
                  : t("group-details.buttons.join.default")}
              </button>
            </div>
          </div>
        </div>
      </div>
      <PlansModal
        isOpen={isPlansModalOpen}
        onClose={() => setIsPlansModalOpen(false)}
      />
    </>
  );
};

export default GroupDetailsNotJoinedUser;
