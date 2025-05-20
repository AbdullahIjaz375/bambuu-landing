import React, { useState, useEffect } from "react";
import { Users, User } from "lucide-react";

import { X } from "lucide-react";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { addMemberToStreamChannel } from "../services/streamService";
import { db } from "../firebaseConfig";
import { ClipLoader } from "react-spinners";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ChannelType } from "../config/stream";
import "react-datepicker/dist/react-datepicker.css";
import "react-datepicker/dist/react-datepicker-cssmodules.css";
import "react-time-picker/dist/TimePicker.css";
import "react-clock/dist/Clock.css";

import Modal from "react-modal";
import { useGroupJoining } from "../hooks/useGroupJoining";
import PlansModal from "./PlansModal";
Modal.setAppElement("#root");

const ExploreGroupDetailsModal = ({ group, onClose, onJoinClick }) => {
  const { user, setUser } = useAuth(); // Destructure setUser to update context

  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchData = async () => {
    try {
      // Fetch classes
      if (group.classIds && group.classIds?.length > 0) {
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

  const renderClasses = () => {
    if (classes.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">No classes available</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {classes.map((classItem) => (
          <div key={classItem.id} className="p-4 bg-white rounded-lg shadow">
            <div className="relative w-full h-48 mb-4 overflow-hidden rounded-lg">
              <img
                src={classItem.imageUrl || "/images/panda.png"}
                alt={classItem.className}
                className="object-cover w-full h-full"
              />
            </div>
            <h3 className="mb-2 text-xl font-medium">{classItem.className}</h3>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 text-sm bg-yellow-200 rounded-full">
                {group.groupLearningLanguage}
              </span>
              <span className="px-3 py-1 text-sm bg-yellow-200 rounded-full">
                Advanced
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={classItem.teacherImageUrl || "/images/panda.png"}
                  alt={classItem.teacherName}
                  className="w-6 h-6 rounded-full"
                />
                <span className="text-sm text-gray-600">
                  {classItem.teacherName} (Admin)
                </span>
              </div>
              <span className="text-sm text-gray-600">
                {classItem.maxStudents || 100}/100
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50">
        <div className="w-full max-w-5xl p-6 mx-4 bg-white rounded-3xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Group Details</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex gap-6">
            {/* Left sidebar */}
            <div className="w-1/3 p-6 bg-[#fffef0] rounded-2xl">
              <div className="flex flex-col items-center text-center">
                <img
                  src={group.imageUrl}
                  alt={group.groupName}
                  className="w-32 h-32 mb-4 rounded-full"
                />
                <h3 className="mb-2 text-2xl font-medium">{group.groupName}</h3>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 text-sm bg-yellow-200 rounded-full">
                    {group.groupLearningLanguage}
                  </span>
                  <span className="px-3 py-1 text-sm bg-yellow-200 rounded-full">
                    Advanced
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <img
                    src={group.groupAdminImageUrl || "/images/panda.png"}
                    alt={group.groupAdminName}
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="text-sm">
                    {group.groupAdminName} (Admin)
                  </span>
                </div>
                <p className="mb-6 text-gray-600">{group.groupDescription}</p>
              </div>
            </div>

            {/* Main content */}
            <div className="flex-1">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <ClipLoader color="#FFB800" size={40} />
                </div>
              ) : (
                <div className="overflow-y-auto max-h-[600px]">
                  {renderClasses()}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-row items-center justify-between">
            <button
              className="w-40 py-2 mt-2 font-medium text-black border border-black rounded-full"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="w-40 mt-2 py-2 font-medium text-black bg-[#ffbf00] rounded-full hover:bg-[#ffbf00] border border-black"
              onClick={onJoinClick}
            >
              Join
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const GroupCard = ({ group }) => {
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showJoinConfirmation, setShowJoinConfirmation] = useState(false);

  const [isJoining, setIsJoining] = useState(false);
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const {
    groupName,
    groupLearningLanguage,
    level = "",
    groupAdminName = "Admin",
    memberIds = [],
    imageUrl,
    isPremium,
    groupAdminImageUrl,
    groupDescription,
    id: groupId,
  } = group;

  const checkValidSubscription = () => {
    // Check freeAccess flag first
    if (user?.freeAccess) {
      return true;
    }

    // Check if user has any subscriptions
    if (!user.subscriptions || user.subscriptions.length === 0) {
      return false;
    }

    // Original subscription check
    // ...rest of the check
  };

  const handlePremiumAccess = () => {
    if (!isPremium) {
      return true;
    }

    const hasValidSubscription = checkValidSubscription();
    if (!hasValidSubscription) {
      navigate("/plans");
      return false;
    }

    return true;
  };

  const handleJoinClick = (e) => {
    e.stopPropagation(); // Prevent triggering the card click
    setShowJoinConfirmation(true);
  };

  const handleClick = () => {
    navigate(`/newGroupDetailsUser/${groupId}`);
  };

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

        setShowJoinConfirmation(false);
        setShowDetailsModal(false);
        return;
      }

      // First check eligibility
      const eligibility = checkJoiningEligibility(
        user,
        isPremium ? "Premium" : "Standard",
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

      const channel = isPremium
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

      // Close modals and reset state
      setShowJoinConfirmation(false);
      setShowDetailsModal(false);

      // Optional: Navigate to the group page or show success message
      // navigate(`/groups/${groupId}`);
    } catch (error) {
      console.error("Error joining group:", error);
      // Handle error appropriately - show error message to user
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <>
      <div
        className="w-full max-w-sm mx-auto hover:cursor-pointer"
        onClick={handleClick}
      >
        <div
          className={`flex flex-col items-center p-4 rounded-3xl h-[340px] ${
            isPremium
              ? "bg-[#e8feeb] border border-[#14b82c]"
              : "bg-white border border-[#ffc310]"
          }`}
        >
          {/* Group Image */}
          <div className="relative w-32 h-32 mb-4">
            {isPremium && (
              <div className="absolute z-10 -translate-x-1/2 w-28 left-1/2 -top-3">
                <img
                  alt="bammbuu"
                  src="/svgs/bammbuu-plus-grp-tag.svg"
                  className="w-28"
                />
              </div>
            )}
            <img
              src={imageUrl}
              alt={groupName}
              className="object-cover w-full h-full rounded-full"
            />
          </div>

          {/* Group Name */}
          <h2
            className="max-w-full mb-2 text-xl font-bold text-center text-gray-900 truncate"
            title={groupName}
          >
            {groupName}
          </h2>

          {/* Language and Level */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            <div className="flex items-center gap-2">
              <img
                src={
                  groupLearningLanguage === "English"
                    ? "/svgs/xs-us.svg"
                    : groupLearningLanguage === "Spanish"
                    ? "/svgs/xs-spain.svg"
                    : "/svgs/eng-spanish-xs.svg"
                }
                alt={
                  groupLearningLanguage === "English" ? "US Flag" : "Spain Flag"
                }
                className="w-4 h-4 sm:w-auto"
              />
              <span className="text-md text-green-900 truncate max-w-[120px]">
                {groupLearningLanguage}
              </span>
            </div>
            {level !== "" ? (
              <span className="px-3 py-1 text-xs text-gray-800 bg-[#fff885] rounded-full">
                {level}
              </span>
            ) : (
              <></>
            )}
          </div>

          {/* Admin and Members */}
          <div className="flex flex-wrap items-center justify-between w-full gap-4">
            <div className="flex items-center gap-2">
              {groupAdminImageUrl ? (
                <img
                  src={groupAdminImageUrl}
                  alt={groupAdminName}
                  className="object-cover w-5 h-5 rounded-full"
                />
              ) : (
                <User className="w-5 h-5 text-gray-600" />
              )}{" "}
              <span
                className="text-xs text-gray-700 truncate"
                title={groupAdminName}
              >
                {groupAdminName.length > 10
                  ? `${groupAdminName.slice(0, 10)}...`
                  : groupAdminName}{" "}
                <span className="text-gray-500">(Admin)</span>
              </span>
            </div>
            <div className="flex items-center gap-1">
              <img alt="user" src="/svgs/users.svg" />
              <span className="text-xs text-gray-700">
                {memberIds.length} members
              </span>
            </div>
          </div>

          {/* Join Button */}
          <div className="w-full ">
            <button
              className="w-full mt-4 py-2 font-medium text-black bg-[#ffbf00] rounded-full hover:bg-[#e5ae00] border border-black"
              onClick={handleJoinClick}
            >
              Join Group
            </button>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && (
        <ExploreGroupDetailsModal
          group={group}
          onClose={() => setShowDetailsModal(false)}
          onJoinClick={handleJoinClick}
        />
      )}

      {/* Join Confirmation Modal */}
      <Modal
        isOpen={showJoinConfirmation}
        onRequestClose={() => setShowJoinConfirmation(false)}
        className="z-50 max-w-sm p-6 mx-auto mt-40 bg-white outline-none rounded-3xl font-urbanist"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <div className="text-center">
          <h2 className="mb-4 text-xl font-semibold">
            Are you sure you want to join this group?
          </h2>
          <div className="flex flex-row gap-2">
            <button
              className="w-full py-2 font-medium border border-gray-300 rounded-full hover:bg-gray-50"
              onClick={() => setShowJoinConfirmation(false)}
            >
              No, Cancel
            </button>
            <button
              className="w-full py-2 font-medium text-black bg-[#14b82c] rounded-full hover:bg-[#119924] border border-[#042f0c]"
              onClick={handleJoinConfirm}
            >
              {isJoining ? "Joining..." : "Yes, Join"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Plans Modal */}
      <PlansModal
        isOpen={isPlansModalOpen}
        onClose={() => setIsPlansModalOpen(false)}
      />
    </>
  );
};

export default GroupCard;
