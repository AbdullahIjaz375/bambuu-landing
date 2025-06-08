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
import ShowDescription from "../../components/ShowDescription";
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
          }),
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
        <div className="flex h-96 items-center justify-center">
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

        // Determine if this is a premium or standard group
        const channelType = group.isPremium
          ? ChannelType.PREMIUM_GROUP
          : ChannelType.STANDARD_GROUP;

        // Add the user to both Firestore and Stream
        try {
          // First update the group document to add the user's ID to memberIds
          await updateDoc(groupRef, {
            memberIds: arrayUnion(user.uid),
          });

          // Then update the user document to add the group ID to joinedGroups
          await updateDoc(userRef, {
            joinedGroups: arrayUnion(groupId),
          });

          // Now add to Stream channel (this uses our improved helper that handles permissions)
          await addMemberToStreamChannel({
            channelId: groupId,
            userId: user.uid,
            type: channelType,
            role: "channel_member",
          });
        } catch (error) {
          console.error("Error joining group:", error);
          throw new Error("Failed to join group");
        }

        // Update context and session storage (moved after all operations)
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
        user.subscriptions,
      );

      if (!eligibility.canJoin) {
        console.error("Cannot join group:", eligibility.message);
        setIsPlansModalOpen(true);
        return;
      } // Get references to the group and user documents
      const groupRef = doc(db, "groups", groupId);
      const userRef = doc(db, "students", user.uid);

      // Get the current group data to check if user is already a member
      const groupDoc = await getDoc(groupRef);
      const groupData = groupDoc.data();

      if (groupData.memberIds.includes(user.uid)) {
        return;
      }

      // Determine the channel type based on group's premium status
      const channelType = group.isPremium
        ? ChannelType.PREMIUM_GROUP
        : ChannelType.STANDARD_GROUP;

      try {
        // First update Firestore - this ensures data consistency
        // Update the group document to add the user's ID to memberIds
        await updateDoc(groupRef, {
          memberIds: arrayUnion(user.uid),
        });

        // Update the user document to add the group ID to joinedGroups
        await updateDoc(userRef, {
          joinedGroups: arrayUnion(groupId),
        });

        // Now try to add to Stream channel - but don't let Stream errors prevent joining
        try {
          await addMemberToStreamChannel({
            channelId: groupId,
            userId: user.uid,
            type: channelType,
            role: "channel_member",
          });
        } catch (streamError) {
          console.error("Stream error (continuing anyway):", streamError);
          // Don't throw here - we've already updated Firestore, which is the source of truth
        }
      } catch (error) {
        console.error("Error joining group:", error);
        throw new Error("Failed to join group");
      } // For premium groups, refresh channels to ensure they appear in the user's channel list
      if (group.isPremium) {
        try {
          // First disconnect the current token which doesn't have the group membership
          const { streamClient } = await import("../../config/stream");
          if (streamClient.userID) {
            await streamClient.disconnectUser();

            // Then connect with a fresh token that will have the updated permissions
            const { fetchChatToken } = await import("../../config/stream");
            const token = await fetchChatToken(user.uid);
            await streamClient.connectUser(
              {
                id: user.uid,
                name: user.name || "",
                image: user.photoUrl || "",
              },
              token,
            );

            // Now force refresh all channels for this user
            const { refreshUserChannels } = await import(
              "../../services/streamConnectionService"
            );
            await refreshUserChannels(user.uid);
          }
        } catch (tokenError) {
          console.error("Error refreshing Stream token:", tokenError);
        }
      }

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
      <div className="flex h-[100vh] items-center justify-center">
        <div className="rounded-lg bg-white p-8">
          <ClipLoader color="#FFB800" size={40} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="rounded-lg bg-white p-8">
          <p className="mb-4 text-red-500">{error}</p>
          <button
            onClick={onClose}
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
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
        <div className="m-6 flex flex-1 rounded-3xl border">
          <div className="mx-4 flex w-full flex-col rounded-3xl bg-white p-6">
            <div className="mb-6 flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-4">
                <button
                  className="rounded-full bg-gray-100 p-3"
                  onClick={handleBack}
                >
                  <ArrowLeft size="30" />
                </button>
                <h1 className="text-4xl font-semibold">
                  {t("group-details.title")}
                </h1>
              </div>
            </div>

            <div className="flex h-screen flex-1 gap-6 overflow-hidden">
              {/* Left sidebar */}
              <div
                className={`h-[90vh] w-1/4 shrink-0 rounded-3xl p-6 ${
                  group.isPremium ? "bg-[#e6fce8]" : "bg-[#ffffea]"
                }`}
              >
                {" "}
                <div className="flex h-full flex-col items-center justify-between text-center">
                  <div className="flex flex-col items-center text-center">
                    <img
                      src={group.imageUrl}
                      alt={group.groupName}
                      className="mb-4 h-24 w-24 rounded-full object-cover md:h-32 md:w-32"
                    />
                    <h3 className="mb-2 text-xl font-semibold md:text-2xl">
                      {group.groupName}
                    </h3>
                    <div className="mb-2 flex items-center gap-2">
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
                          className="h-5 w-5 sm:w-auto"
                        />
                        <span className="md:text-md text-sm">
                          {group.groupLearningLanguage}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-col items-center md:flex-row md:space-x-40">
                      <div className="mb-2 flex items-center gap-1 md:mb-4">
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
                      <div className="mb-2 flex items-center gap-1 md:mb-4">
                        <img
                          alt="bammbuu"
                          src="/svgs/users.svg"
                          className="w-4 md:w-5"
                        />
                        <span className="text-xs text-gray-800 md:text-sm">
                          {(() => {
                            // Handle all possible cases
                            if (!group.memberIds) return "0";
                            if (Array.isArray(group.memberIds))
                              return group.memberIds.length.toString();
                            if (typeof group.memberIds === "number")
                              return group.memberIds.toString();
                            return "0";
                          })()}{" "}
                        </span>
                      </div>
                    </div>

                    <ShowDescription
                      description={group.groupDescription}
                      maxHeight={100}
                    />
                  </div>

                  <div className="w-full space-y-4">
                    {" "}
                    {group.isPremium ? <GroupInfoCard group={group} /> : <></>}
                  </div>
                </div>
              </div>

              {/* Main content */}
              <div className="scrollbar-hide h-[90vh] flex-1 overflow-y-auto">
                <div className="scrollbar-hide h-full overflow-y-auto">
                  {loading ? (
                    <div className="flex h-full items-center justify-center">
                      <ClipLoader color="#FFB800" size={40} />
                    </div>
                  ) : (
                    <div className="pr-4">{renderClasses()}</div>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-2 flex flex-row items-center justify-between">
              <button
                className="rounded-full border border-black px-8 py-2 text-lg text-black"
                onClick={handleBack}
              >
                {t("group-details.buttons.cancel")}
              </button>
              <button
                className="rounded-full border border-black bg-[#ffbf00] px-8 py-2 text-lg text-black"
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
