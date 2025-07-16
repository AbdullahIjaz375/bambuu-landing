import React, { useState, useEffect } from "react";
import { Users, User } from "lucide-react";

import { X } from "lucide-react";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { addMemberToStreamChannel } from "../services/streamService";
import { db, storage } from "../firebaseConfig";
import { ClipLoader } from "react-spinners";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Import useAuth to access context
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

  const renderClasses = () => {
    if (classes.length === 0) {
      return (
        <div className="flex h-64 items-center justify-center">
          <p className="text-gray-500">No classes available</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {classes.map((classItem) => (
          <div key={classItem.id} className="rounded-lg bg-white p-4 shadow">
            <div className="relative mb-4 h-48 w-full overflow-hidden rounded-lg">
              <img
                src={classItem.imageUrl || "/images/panda.png"}
                alt={classItem.className}
                className="h-full w-full object-cover"
              />
            </div>
            <h3 className="mb-2 text-xl font-medium">{classItem.className}</h3>
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full bg-yellow-200 px-3 py-1 text-sm">
                {group.groupLearningLanguage}
              </span>
              <span className="rounded-full bg-yellow-200 px-3 py-1 text-sm">
                Advanced
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={classItem.teacherImageUrl || "/images/panda.png"}
                  alt={classItem.teacherName}
                  className="h-6 w-6 rounded-full"
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
        <div className="mx-4 w-full max-w-5xl rounded-3xl bg-white p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Group Details</h2>
            <button
              onClick={onClose}
              className="rounded-full p-2 hover:bg-gray-100"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex gap-6">
            {/* Left sidebar */}
            <div className="w-1/3 rounded-2xl bg-[#fffef0] p-6">
              <div className="flex flex-col items-center text-center">
                <img
                  src={group.imageUrl}
                  alt={group.groupName}
                  className="mb-4 h-32 w-32 rounded-full"
                />
                <h3 className="mb-2 text-2xl font-medium">{group.groupName}</h3>
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-full bg-yellow-200 px-3 py-1 text-sm">
                    {group.groupLearningLanguage}
                  </span>
                  <span className="rounded-full bg-yellow-200 px-3 py-1 text-sm">
                    Advanced
                  </span>
                </div>
                <div className="mb-4 flex items-center gap-2">
                  <img
                    src={group.groupAdminImageUrl || "/images/panda.png"}
                    alt={group.groupAdminName}
                    className="h-6 w-6 rounded-full"
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
                <div className="flex h-64 items-center justify-center">
                  <ClipLoader color="#FFB800" size={40} />
                </div>
              ) : (
                <div className="max-h-[600px] overflow-y-auto">
                  {renderClasses()}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-row items-center justify-between">
            <button
              className="mt-2 w-40 rounded-full border border-black py-2 font-medium text-black"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="mt-2 w-40 rounded-full border border-black bg-[#ffbf00] py-2 font-medium text-black hover:bg-[#ffbf00]"
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

const ProfileSetupGroupCard = ({ group }) => {
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showJoinConfirmation, setShowJoinConfirmation] = useState(false);

  const [isJoining, setIsJoining] = useState(false);
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const {
    groupName,
    groupLearningLanguage,
    level = " specified",
    groupAdminName = "Admin",
    memberIds = [],
    imageUrl,
    isPremium,
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

    // Find a valid subscription that grants premium group access
    return user.subscriptions.some((sub) => {
      if (
        !sub.startDate ||
        !sub.endDate ||
        sub.type === "None" ||
        sub.type === "none"
      ) {
        return false;
      }
      const endDate = new Date(sub.endDate.seconds * 1000);
      const startDate = new Date(sub.startDate.seconds * 1000);
      const now = new Date();

      // Check if subscription is active
      if (endDate <= now || startDate > now) {
        return false;
      }

      const type = sub.type.trim().toLowerCase();
      return (
        type === "bammbuu groups" ||
        type === "immersive exam prep" ||
        type === "bammbuu+ instructor-led group classes" ||
        type === "group_premium"
      );
    });
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

      // First check eligibility
      const eligibility = checkJoiningEligibility(
        user,
        isPremium ? "Premium" : "Standard",
        user.subscriptions,
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
      <div className="mt-1 max-w-md hover:cursor-pointer">
        <div
          className={`max-w-sm rounded-3xl p-4 ${
            isPremium
              ? "border border-[#14b82c] bg-[#e8feeb]"
              : "border border-[#ffc310] bg-white"
          }`}
        >
          {/* Rest of your existing GroupCard code */}
          <div className="flex flex-col items-center">
            <div className="relative mb-4 h-40 w-40">
              {/* Bambuu+ Tag */}
              {isPremium && (
                <div className="absolute -top-3 left-1/2 z-10 w-28 -translate-x-1/2">
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
                className="h-full w-full rounded-full object-cover"
              />
            </div>

            <h2 className="mb-2 text-2xl font-medium text-gray-900">
              {groupName}
            </h2>

            <div className="mb-2 flex items-center gap-2">
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
                    groupLearningLanguage === "English"
                      ? "US Flag"
                      : "Spain Flag"
                  }
                  className="h-4 w-4 sm:w-auto"
                />
                <span className="text-md max-w-[120px] truncate text-green-900">
                  {groupLearningLanguage}
                </span>
              </div>
              {/* <span className="px-3 py-1 text-gray-800 bg-[#fff885] rounded-full">
                {level}
              </span> */}
            </div>

            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-2">
                <User />
                <span className="text-md text-gray-700">
                  {groupAdminName}{" "}
                  <span className="text-gray-500">(Admin)</span>
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-gray-600" />
                <span className="text-md text-gray-700">
                  {memberIds.length} members
                </span>
              </div>
            </div>
            <button
              className="mt-2 w-full rounded-full border border-black bg-[#ffbf00] py-2 font-medium text-black hover:bg-[#ffbf00]"
              onClick={handleJoinClick}
            >
              Join Group
            </button>
          </div>
        </div>
      </div>
      {showDetailsModal && (
        <ExploreGroupDetailsModal
          group={group}
          onClose={() => setShowDetailsModal(false)}
          onJoinClick={handleJoinClick}
        />
      )}
      <Modal
        isOpen={showJoinConfirmation}
        onRequestClose={() => setShowJoinConfirmation(false)}
        className="z-50 mx-auto mt-40 max-w-sm rounded-3xl bg-white p-6 font-urbanist outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        style={{
          overlay: {
            zIndex: 60, // Higher than the details modal
          },
          content: {
            border: "none",
            padding: "24px",
            maxWidth: "420px",
            position: "relative", // Needed for z-index to work
            zIndex: 61, // Higher than the overlay
          },
        }}
      >
        <div className="text-center">
          <h2 className="mb-4 text-xl font-semibold">
            Are you sure you want to join this group?
          </h2>
          <div className="flex flex-row gap-2">
            <button
              className="w-full rounded-full border border-gray-300 py-2 font-medium hover:bg-gray-50"
              onClick={() => setShowJoinConfirmation(false)}
            >
              No, Cancel
            </button>
            <button
              className="w-full rounded-full border border-[#042f0c] bg-[#14b82c] py-2 font-medium text-black hover:bg-[#119924]"
              onClick={handleJoinConfirm}
            >
              {isJoining ? "Joining...." : "Yes, Join"}
            </button>
          </div>
        </div>
      </Modal>
      <PlansModal
        isOpen={isPlansModalOpen}
        onClose={() => setIsPlansModalOpen(false)}
      />
    </>
  );
};

export default ProfileSetupGroupCard;
