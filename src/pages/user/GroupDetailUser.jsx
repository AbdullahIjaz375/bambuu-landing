import React, { useState, useEffect } from "react";
import { X, Camera, ArrowLeft, EllipsisVertical } from "lucide-react";
import { Menu, NumberInput } from "@mantine/core";

import {
  doc,
  getDoc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { ChannelType } from "../../config/stream";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  deleteStreamChannel,
  removeMemberFromStreamChannel,
} from "../../services/streamService";
import { db, storage } from "../../firebaseConfig";
import { ClipLoader } from "react-spinners";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "react-datepicker/dist/react-datepicker.css";
import "react-datepicker/dist/react-datepicker-cssmodules.css";
import "react-time-picker/dist/TimePicker.css";
import { useTranslation } from "react-i18next";

import "react-clock/dist/Clock.css";
import { useParams } from "react-router-dom";
import ClassCard from "../../components/ClassCard";
import Modal from "react-modal";
import ExploreClassCard from "../../components/ExploreClassCard";
import EmptyState from "../../components/EmptyState";
import GroupInfoCard from "../../components/GroupInfoCard";
import ShowDescription from "../../components/ShowDescription";
Modal.setAppElement("#root");

const GroupDetailsUser = ({ onClose }) => {
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

      // Fetch members
      // Fetch members
      if (group.memberIds && group.memberIds.length > 0) {
        const membersData = await Promise.all(
          group.memberIds.map(async (memberId) => {
            const userDoc = await getDoc(doc(db, "students", memberId));

            return userDoc.exists()
              ? { id: userDoc.id, ...userDoc.data() }
              : null;
          }),
        );
        setMembers(membersData.filter(Boolean));
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

  //---------------------------------------------------leaving a group-------------------------------------------//

  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleLeaveGroup = async () => {
    try {
      setIsLeaving(true);

      // Get references to the group and user documents
      const groupRef = doc(db, "groups", group.id);
      const userRef = doc(db, "students", user.uid);

      // Get current group data
      const groupDoc = await getDoc(groupRef);
      const groupData = groupDoc.data();

      const channel = group.isPremium
        ? ChannelType.PREMIUM_GROUP
        : ChannelType.STANDARD_GROUP;

      try {
        await removeMemberFromStreamChannel({
          channelId: group.id,
          userId: user.uid,
          type: channel,
        });
      } catch (streamError) {
        console.error("Error removing from stream channel:", streamError);
        throw new Error("Failed to leave group chat");
      }

      // Remove user from group's memberIds
      const updatedMemberIds = groupData.memberIds.filter(
        (id) => id !== user.uid,
      );
      await updateDoc(groupRef, {
        memberIds: updatedMemberIds,
      });

      // Remove group from user's joinedGroups
      const updatedJoinedGroups = (user.joinedGroups || []).filter(
        (id) => id !== group.id,
      );

      // Update user document
      await updateDoc(userRef, {
        joinedGroups: updatedJoinedGroups,
      });

      // Update context and session storage
      const updatedUser = {
        ...user,
        joinedGroups: updatedJoinedGroups,
      };
      setUser(updatedUser);
      sessionStorage.setItem("user", JSON.stringify(updatedUser));
      navigate(-1);

      // Close modals and navigate
      setShowLeaveConfirmation(false);
      onClose();
    } catch (error) {
      console.error("Error leaving group:", error);
    } finally {
      setIsLeaving(false);
    }
  };

  //----------------------------------------------------removing user from group-------------------------------//

  const [showRemoveConfirmation, setShowRemoveConfirmation] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Add function to handle user removal
  const handleRemoveUser = async (userId) => {
    try {
      setIsRemoving(true);

      // Get references to the group and user documents
      const groupRef = doc(db, "groups", group.id);
      const userRef = doc(db, "students", userId);

      // Get current group data
      const groupDoc = await getDoc(groupRef);
      const groupData = groupDoc.data();

      // Remove user from group's memberIds
      const updatedMemberIds = groupData.memberIds.filter(
        (id) => id !== userId,
      );
      await updateDoc(groupRef, {
        memberIds: updatedMemberIds,
      });

      // Get user data and update their joinedGroups
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      const updatedJoinedGroups = (userData.joinedGroups || []).filter(
        (id) => id !== group.id,
      );

      // Update user document
      await updateDoc(userRef, {
        joinedGroups: updatedJoinedGroups,
      });

      // Update local state
      setMembers((prevMembers) =>
        prevMembers.filter((member) => member.id !== userId),
      );
      setShowRemoveConfirmation(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Error removing user:", error);
    } finally {
      setIsRemoving(false);
    }
  };

  //--------------------------------------------------adding a class--------------------------------------------//
  const [isFormValid, setIsFormValid] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isAddClassModalOpen, setAddClassModalOpen] = useState(false);
  const [classImage, setClassImage] = useState(null);
  const [classPreviewImage, setClassPreviewImage] = useState(null);
  const [classData, setClassData] = useState({
    className: "",
    classDescription: "",
    language: "English",
    languageLevel: "Beginner",
    availableSpots: 5,
    classDuration: 60,
    classDateTime: new Date(),
    recurrenceTypes: ["One-time"],
    selectedRecurrenceType: "",
    recurringSlots: [],
    classLocation: "Virtual",
    classType: "Group Standard",
    classAddress: "",
    imageUrl: "",
  });

  const handleClassImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setClassImage(file);
      setClassPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleClassDataChange = (field, value) => {
    setClassData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddClassButtonClick = () => {
    setAddClassModalOpen(true);
  };

  useEffect(() => {
    const validateForm = () => {
      const requiredFields = {
        className: !!classData.className.trim(),
        classDescription: !!classData.classDescription.trim(),
        language: !!classData.language,
        languageLevel: !!classData.languageLevel,
        availableSpots:
          !!classData.availableSpots && classData.availableSpots > 0,
        classDuration: !!classData.classDuration,
        classDateTime: !!classData.classDateTime,
        recurrenceTypes: !!classData.recurrenceTypes,
        classLocation: !!classData.classLocation,
        classType: !!classData.classType,
        classAddress:
          classData.classLocation === "Physical"
            ? !!classData.classAddress.trim()
            : true,
        classImage: !!classImage,
      };

      return Object.values(requiredFields).every((field) => field === true);
    };

    setIsFormValid(validateForm());
  }, [classData, classImage]);

  const handleSaveClass = async () => {
    if (!isFormValid || isCreating) return;
    setIsCreating(true);

    try {
      let imageUrl = "";
      const classRef = await addDoc(collection(db, "classes"), {});
      const classId = classRef.id;

      if (classImage) {
        const imageRef = ref(
          storage,
          `classes/${classId}/image_${Date.now()}_${classImage.name}`,
        );
        await uploadBytes(imageRef, classImage);
        imageUrl = await getDownloadURL(imageRef);
      }

      const classAddress =
        classData.classLocation === "Virtual" ? "" : classData.classAddress;

      // Parse the date and time inputs to create a combined datetime
      const dateValue = new Date(classData.classDateTime);
      const timeValue = document.querySelector('input[type="time"]').value;
      const [hours, minutes] = timeValue.split(":").map(Number);

      // Set the time components on the date object
      dateValue.setHours(hours);
      dateValue.setMinutes(minutes);

      const localDate = new Date(
        dateValue.getFullYear(),
        dateValue.getMonth(),
        dateValue.getDate(),
        dateValue.getHours(),
        dateValue.getMinutes(),
      );

      const newClass = {
        classId: classId,
        adminId: user.uid,
        adminName: user.name || "",
        adminImageUrl: user.photoUrl || "",
        groupId: group.id,
        className: classData.className,
        classDescription: classData.classDescription,
        language: classData.language,
        languageLevel: classData.languageLevel,
        availableSpots: classData.availableSpots,
        classDuration: classData.classDuration,
        classDateTime: localDate, // Use the combined date and time value
        recurrenceTypes: classData.recurrenceTypes,
        selectedRecurrenceType: "",
        recurringSlots: [],
        classLocation: classData.classLocation,
        classType: classData.classType,
        classAddress: classAddress,
        imageUrl,
        classMemberIds: [],
      };

      await updateDoc(doc(db, "classes", classId), newClass);

      // Update user document
      const userRef = doc(db, "students", user.uid);
      const updatedJoinedClasses = [...(user.enrolledClasses || []), classId];
      const updatedAdminOfClasses = [...(user.adminOfClasses || []), classId];

      await updateDoc(userRef, {
        enrolledClasses: updatedJoinedClasses,
        adminOfClasses: updatedAdminOfClasses,
      });

      // Update group document
      const groupRef = doc(db, "groups", group.id);
      const groupDoc = await getDoc(groupRef);
      const currentClassIds = groupDoc.data().classIds || [];
      await updateDoc(groupRef, {
        classIds: [...currentClassIds, classId],
      });

      // Update context and storage
      const updatedUser = {
        ...user,
        enrolledClasses: updatedJoinedClasses,
        adminOfClasses: updatedAdminOfClasses,
      };
      setUser(updatedUser);
      sessionStorage.setItem("user", JSON.stringify(updatedUser));

      // Reset form and close modal
      setAddClassModalOpen(false);
      setClassImage(null);
      setClassPreviewImage(null);
      setClassData({
        className: "",
        classDescription: "",
        language: "English",
        languageLevel: "Beginner",
        availableSpots: 5,
        classDuration: 60,
        classDateTime: new Date(),
        recurrenceTypes: ["One-time"],
        classLocation: "Virtual",
        classType: "Group Standard",
        classAddress: "",
        imageUrl: "",
        selectedRecurrenceType: "",
        recurringSlots: [],
      });

      fetchGroup();
      await fetchData();
    } catch (error) {
      console.error("Error adding class:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "TBD";
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const formatDate = (timestamp) => {
    if (!timestamp) return "TBD";
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  function formatToYYYYMMDD(date) {
    // If no date, return empty string
    if (!date) return "";
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  //-------------------------------------------------Deleting Group---------------------------------------//
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteGroup = async () => {
    try {
      setIsDeleting(true);
      const userType = JSON.parse(sessionStorage.getItem("user")).userType;
      const userCollection = userType === "tutor" ? "tutors" : "students";

      // 1. Delete all classes in the group
      await Promise.all(
        group.classIds.map(async (classId) => {
          const classRef = doc(db, "classes", classId);
          const classDoc = await getDoc(classRef);
          const classData = classDoc.data();

          if (!classData) {
            return;
          }

          // Update class members (students)
          if (classData.classMemberIds?.length > 0) {
            await Promise.all(
              classData.classMemberIds.map(async (memberId) => {
                const memberRef = doc(db, "students", memberId);
                const memberDoc = await getDoc(memberRef);
                const memberData = memberDoc.data();

                if (memberData) {
                  await updateDoc(memberRef, {
                    enrolledClasses: (memberData.enrolledClasses || []).filter(
                      (id) => id !== classId,
                    ),
                    // Remove tutorStudentIds relationship if exists
                    tutorStudentIds: (memberData.tutorStudentIds || []).filter(
                      (id) => id !== classData.adminId,
                    ),
                  });
                }
              }),
            );
          }

          // Update tutor/admin
          const adminRef = doc(db, userCollection, classData.adminId);
          const adminDoc = await getDoc(adminRef);
          const adminData = adminDoc.data();

          if (adminData) {
            if (userType === "tutor") {
              await updateDoc(adminRef, {
                tutorOfClasses: (adminData.tutorOfClasses || []).filter(
                  (id) => id !== classId,
                ),
                enrolledClasses: (adminData.enrolledClasses || []).filter(
                  (id) => id !== classId,
                ),
                // Update tutorStudentIds
                tutorStudentIds: (adminData.tutorStudentIds || []).filter(
                  (studentId) => !classData.classMemberIds?.includes(studentId),
                ),
              });
            } else {
              await updateDoc(adminRef, {
                adminOfClasses: (adminData.adminOfClasses || []).filter(
                  (id) => id !== classId,
                ),
                enrolledClasses: (adminData.enrolledClasses || []).filter(
                  (id) => id !== classId,
                ),
              });
            }
          }

          // Delete class document
          await deleteDoc(classRef);
        }),
      );

      // 2. Update group members
      if (group.memberIds?.length > 0) {
        await Promise.all(
          group.memberIds.map(async (memberId) => {
            const memberRef = doc(db, "students", memberId);
            const memberDoc = await getDoc(memberRef);
            const memberData = memberDoc.data();

            if (memberData) {
              await updateDoc(memberRef, {
                joinedGroups: (memberData.joinedGroups || []).filter(
                  (id) => id !== group.id,
                ),
              });
            }
          }),
        );
      }

      // 3. Update group admin
      const adminRef = doc(db, userCollection, user.uid);
      const adminDoc = await getDoc(adminRef);
      const adminData = adminDoc.data();

      if (adminData) {
        const updateData =
          userType === "tutor"
            ? {
                tutorOfGroups: (adminData.tutorOfGroups || []).filter(
                  (id) => id !== group.id,
                ),
                joinedGroups: (adminData.joinedGroups || []).filter(
                  (id) => id !== group.id,
                ),
              }
            : {
                adminOfGroups: (adminData.adminOfGroups || []).filter(
                  (id) => id !== group.id,
                ),
                joinedGroups: (adminData.joinedGroups || []).filter(
                  (id) => id !== group.id,
                ),
              };
        await updateDoc(adminRef, updateData);
      }

      // 4. Delete group document
      await deleteDoc(doc(db, "groups", group.id));

      // 5. Update session storage
      const updatedUser = JSON.parse(sessionStorage.getItem("user"));
      if (userType === "tutor") {
        updatedUser.tutorOfGroups = (updatedUser.tutorOfGroups || []).filter(
          (id) => id !== group.id,
        );
        updatedUser.tutorOfClasses = (updatedUser.tutorOfClasses || []).filter(
          (id) => !group.classIds?.includes(id),
        );
        updatedUser.enrolledClasses = (
          updatedUser.enrolledClasses || []
        ).filter((id) => !group.classIds?.includes(id));
        updatedUser.joinedGroups = (updatedUser.joinedGroups || []).filter(
          (id) => id !== group.id,
        );
      } else {
        updatedUser.adminOfGroups = (updatedUser.adminOfGroups || []).filter(
          (id) => id !== group.id,
        );
        updatedUser.adminOfClasses = (updatedUser.adminOfClasses || []).filter(
          (id) => !group.classIds?.includes(id),
        );
        updatedUser.enrolledClasses = (
          updatedUser.enrolledClasses || []
        ).filter((id) => !group.classIds?.includes(id));
        updatedUser.joinedGroups = (updatedUser.joinedGroups || []).filter(
          (id) => id !== group.id,
        );
      }
      sessionStorage.setItem("user", JSON.stringify(updatedUser));

      await deleteStreamChannel({
        channelId: group.id,
        type: ChannelType.STANDARD_GROUP,
      });

      navigate(-1);
    } catch (error) {
      console.error("Error deleting group:", error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
    }
  };

  //---------------------------------------------------------------------------------------------------------//
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

  // Update the renderMembers function to include remove button for admin
  const renderMembers = () => {
    // Combine admin and members, ensuring admin is included even if not in members list
    const allMembers = members.slice(); // Create a copy of members array

    // Add admin if not already in the list
    if (groupTutor && !allMembers.find((m) => m.id === groupTutor.id)) {
      allMembers.unshift({
        ...groupTutor,
        isAdmin: true,
      });
    }

    if (allMembers.length === 0) {
      return (
        <div className="flex h-48 items-center justify-center sm:h-64 md:h-96">
          <EmptyState message="No members available" />
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {allMembers.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between rounded-2xl border border-gray-200 px-2 py-1.5 hover:bg-gray-50 sm:rounded-3xl sm:px-3 sm:py-2 md:px-4 md:py-2"
          >
            <div className="flex flex-grow items-center gap-2 overflow-hidden">
              <img
                src={member.photoUrl || "/images/panda.png"}
                alt={member.name}
                className="h-7 w-7 flex-shrink-0 rounded-full object-cover sm:h-8 sm:w-8 md:h-9 md:w-9"
              />

              <div className="flex w-full flex-row items-center justify-between overflow-hidden">
                <span className="mr-1 truncate text-xs font-medium text-gray-900 sm:text-sm">
                  {member.name}
                </span>
                {member.id === group.groupAdminId && (
                  <span className="whitespace-nowrap rounded-full bg-gray-200 px-1 py-0.5 text-right text-xs text-gray-500">
                    Admin
                  </span>
                )}
              </div>
            </div>
            {user.uid === group.groupAdminId &&
              member.id !== group.groupAdminId && (
                <Menu shadow="md" width={150} position="bottom-end" radius="lg">
                  <Menu.Target>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="ml-1 flex h-6 w-6 flex-shrink-0 items-center justify-center sm:h-7 sm:w-7 md:h-8 md:w-8"
                    >
                      <EllipsisVertical size={16} className="text-gray-400" />
                    </button>
                  </Menu.Target>

                  <Menu.Dropdown>
                    <Menu.Item
                      onClick={() => {
                        setSelectedUser(member);
                        setShowRemoveConfirmation(true);
                      }}
                      className="font-urbanist text-red-500"
                    >
                      Remove from group
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              )}
          </div>
        ))}
      </div>
    );
  };

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
        <div className="m-1 flex flex-1 rounded-xl border sm:m-2 md:m-6 md:rounded-3xl">
          <div className="flex w-full flex-col rounded-xl bg-white p-2 sm:p-3 md:rounded-3xl md:p-6">
            <div className="mb-2 flex items-center justify-between border-b pb-2 sm:mb-3 md:mb-6 md:pb-4">
              <div className="flex items-center gap-2 md:gap-4">
                {" "}
                <button
                  className="rounded-full bg-gray-100 p-1.5 sm:p-2 md:p-3"
                  onClick={handleBack}
                >
                  <ArrowLeft
                    size={16}
                    className="sm:h-5 sm:w-5 md:h-6 md:w-6"
                  />
                </button>
                <h1 className="text-lg font-semibold sm:text-xl md:text-2xl lg:text-3xl">
                  {t("group-details.title")}
                </h1>
              </div>
            </div>{" "}
            <div className="flex min-h-0 flex-1 flex-col gap-3 md:gap-6 lg:flex-row">
              {/* Left sidebar */}
              <div
                className={`w-full flex-shrink-0 rounded-xl p-3 sm:p-4 md:rounded-3xl md:p-5 lg:w-1/3 ${
                  group.isPremium ? "bg-[#e6fce8]" : "bg-[#ffffea]"
                }`}
              >
                <div className="flex h-full max-w-full flex-col items-center justify-between text-center">
                  <div className="flex max-w-full flex-col items-center text-center">
                    <img
                      src={group.imageUrl}
                      alt={group.groupName}
                      className="mb-2 h-12 w-12 rounded-full object-cover sm:h-16 sm:w-16 md:h-20 md:w-20 lg:h-24 lg:w-24"
                    />
                    <h3 className="mb-1 w-full truncate text-sm font-semibold sm:text-base md:text-lg lg:text-xl">
                      {group.groupName}
                    </h3>
                    <div className="mb-1 flex items-center gap-1">
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
                          className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5"
                        />
                        <span className="text-xs sm:text-sm">
                          {group.groupLearningLanguage}
                        </span>
                      </div>
                    </div>
                    <div className="flex w-full items-center justify-between gap-x-20">
                      <span className="text-md max-w-[120px] truncate text-gray-800 sm:max-w-[160px] md:max-w-[200px]">
                        {group.groupAdminName} (Admin)
                      </span>
                      <div className="flex items-center gap-2">
                        <img
                          alt="bammbuu"
                          src="/svgs/users.svg"
                          className="h-3 w-3 sm:h-4 sm:w-4"
                        />
                        <span className="text-xs text-gray-800">
                          {group?.memberIds.length}
                        </span>
                      </div>
                    </div>
                    <div className="mt-1 w-full px-1 sm:mt-2 md:mt-3">
                      <ShowDescription
                        description={group.groupDescription}
                        maxHeight={60}
                      />
                    </div>
                  </div>
                  <div className="mt-2 w-full space-y-2">
                    {group.isPremium && (
                      <div className="w-full origin-top scale-90 sm:scale-100">
                        <GroupInfoCard group={group} />
                      </div>
                    )}
                    <div className="w-full space-y-1 sm:space-y-2">
                      <button
                        className={`w-full rounded-full border px-2 py-1 text-xs text-black sm:text-sm md:text-base ${
                          group.isPremium
                            ? "border-[#0a0d0b] bg-[#bffcc4]"
                            : "border-black bg-[#FFFBC5]"
                        }`}
                        onClick={() => {
                          localStorage.setItem("activetab", "bammbuu");
                          navigate(`/messagesUser/${group.id}`);
                        }}
                      >
                        {t("group-details.buttons.viewChat")}
                      </button>
                      {user.uid === group.groupAdminId ? (
                        <>
                          <button
                            className="w-full rounded-full border border-black bg-white px-2 py-1 text-xs text-black sm:text-sm md:px-4 md:text-base"
                            onClick={() => navigate(`/editGroup/${groupId}`)}
                          >
                            {t("group-details.buttons.editDetails")}
                          </button>
                          <button
                            className="w-full rounded-full border border-red-500 bg-white px-2 py-1 text-xs text-red-500 sm:text-sm md:px-4 md:text-base"
                            onClick={() => setShowDeleteConfirmation(true)}
                          >
                            {t("group-details.buttons.deleteGroup")}
                          </button>
                        </>
                      ) : (
                        <button
                          className="w-full rounded-full border border-red-500 px-2 py-1 text-xs text-red-500 sm:text-sm md:px-4 md:text-base"
                          onClick={() => setShowLeaveConfirmation(true)}
                        >
                          {t("group-details.buttons.leaveGroup")}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {/* Main content */}{" "}
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="mb-3 flex flex-col items-center justify-between gap-2 md:mb-6 md:flex-row md:gap-0">
                  <div className="flex w-full justify-center md:w-auto">
                    <div className="relative inline-flex rounded-full border border-gray-300 bg-gray-100 p-1">
                      <div
                        className="absolute left-0 top-0 h-full rounded-full border border-[#042F0C] bg-[#FFBF00] transition-all duration-300 ease-in-out"
                        style={{
                          transform: `translateX(${
                            activeTab === "Classes" ? "0" : "100%"
                          })`,
                          width: "50%",
                        }}
                      />
                      <button
                        onClick={() => setActiveTab("Classes")}
                        className="relative z-10 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium text-[#042F0C] transition-colors sm:px-6 sm:text-sm md:px-8 md:text-base"
                      >
                        {t("group-details.classes")}
                      </button>
                      <button
                        onClick={() => setActiveTab("Members")}
                        className="relative z-10 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium text-[#042F0C] transition-colors sm:px-6 sm:text-sm md:px-8 md:text-base"
                      >
                        {t("group-details.members")}
                      </button>
                    </div>
                  </div>

                  {user.uid === group.groupAdminId && (
                    <button
                      className="mt-2 w-full rounded-full border border-[#19291c] bg-[#14b82c] px-2 py-1.5 text-xs text-[#19291c] sm:px-3 sm:py-2 sm:text-sm md:mt-0 md:w-auto md:px-6 md:text-base"
                      onClick={handleAddClassButtonClick}
                    >
                      {t("group-details.buttons.createClass")}
                    </button>
                  )}
                </div>
                {loading ? (
                  <div className="flex flex-1 items-center justify-center">
                    <ClipLoader
                      color="#FFB800"
                      size={30}
                      className="sm:h-10 sm:w-10"
                    />
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto">
                    {activeTab === "Classes"
                      ? renderClasses()
                      : renderMembers()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isAddClassModalOpen}
        onRequestClose={() => setAddClassModalOpen(false)}
        className="scrollbar-hide mx-auto max-h-[90vh] w-[1000px] max-w-[90vw] overflow-y-auto rounded-3xl bg-white p-4 font-urbanist outline-none md:p-6 lg:p-8"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      >
        <div className="relative">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-medium">{t("createClass.title")}</h2>
            <button
              onClick={() => setAddClassModalOpen(false)}
              className="rounded-full hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>

          {/* Image Upload */}
          <div className="mb-8 flex justify-start">
            <div
              className="relative flex h-28 w-28 cursor-pointer items-center justify-center rounded-full border border-dashed border-gray-300 bg-gray-50"
              onClick={() => document.getElementById("classImage").click()}
            >
              {classPreviewImage ? (
                <img
                  src={classPreviewImage}
                  alt="Preview"
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <Camera size={24} className="text-gray-400" />
              )}
            </div>
            <input
              id="classImage"
              type="file"
              accept="image/*"
              onChange={handleClassImageChange}
              className="hidden"
            />
          </div>

          <div className="space-y-4">
            {/* Class Name */}

            <div className="flex flex-row items-start justify-between space-x-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  {t("createClass.className")}
                </label>
                <input
                  type="text"
                  placeholder="Class name"
                  value={classData.className}
                  onChange={(e) =>
                    handleClassDataChange("className", e.target.value)
                  }
                  className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-gray-300 focus:outline-none"
                />
              </div>

              {/* Language */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  {t("createClass.language.label")}
                </label>
                <div className="mt-1 flex gap-2">
                  <button
                    onClick={() => handleClassDataChange("language", "English")}
                    className={`rounded-full px-4 py-2 text-sm ${
                      classData.language === "English"
                        ? "border border-yellow-500 bg-yellow-400"
                        : "border border-gray-200"
                    }`}
                  >
                    {t("createClass.language.english")}
                  </button>
                  <button
                    onClick={() => handleClassDataChange("language", "Spanish")}
                    className={`rounded-full px-4 py-2 text-sm ${
                      classData.language === "Spanish"
                        ? "border border-yellow-500 bg-yellow-400"
                        : "border border-gray-200"
                    }`}
                  >
                    {t("createClass.language.spanish")}
                  </button>
                  <button
                    onClick={() =>
                      handleClassDataChange("language", "English-Spanish")
                    }
                    className={`rounded-full px-4 py-2 text-sm ${
                      classData.language === "English-Spanish"
                        ? "border border-yellow-500 bg-yellow-400"
                        : "border border-gray-200"
                    }`}
                  >
                    {t("createClass.language.exchange")}
                  </button>
                </div>
              </div>
            </div>
            {/* Description */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                {t("createClass.description.label")}
              </label>
              <textarea
                placeholder={t("createClass.description.placeholder")}
                value={classData.classDescription}
                onChange={(e) =>
                  handleClassDataChange("classDescription", e.target.value)
                }
                maxLength={400}
                rows={3}
                className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-gray-300 focus:outline-none"
              />
            </div>
            <div className="flex flex-row items-start justify-between space-x-4">
              {/* Class Level */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  {t("createClass.level.label")}
                </label>
                <div className="mt-1 flex gap-2">
                  {["Beginner", "Intermediate", "Advanced"].map((level) => (
                    <button
                      key={level}
                      onClick={() =>
                        handleClassDataChange("languageLevel", level)
                      }
                      className={`rounded-full px-4 py-2 text-sm ${
                        classData.languageLevel === level
                          ? "border border-yellow-500 bg-yellow-400"
                          : "border border-gray-200"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Class Type */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  {t("createClass.type.label")}
                </label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {[
                    "One-time",
                    "Daily",
                    "Weekly",
                    "Daily (Weekdays)",
                    "Monthly",
                  ].map((type) => (
                    <button
                      key={type}
                      onClick={() =>
                        handleClassDataChange("selectedRecurrenceType", type)
                      }
                      className={`rounded-full px-4 py-2 text-sm ${
                        classData.selectedRecurrenceType === type
                          ? "border border-yellow-500 bg-yellow-400"
                          : "border border-gray-200"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-row items-start justify-between space-x-4">
              {/* Class Location */}
              <div className="flex flex-row items-center space-x-10">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    {t("createClass.location.label")}
                  </label>
                  <div className="mt-1 flex gap-2">
                    <button
                      onClick={() =>
                        handleClassDataChange("classLocation", "Physical")
                      }
                      className={`rounded-full px-4 py-2 text-sm ${
                        classData.classLocation === "Physical"
                          ? "border border-yellow-500 bg-yellow-400"
                          : "border border-gray-200"
                      }`}
                    >
                      {t("createClass.location.physical")}
                    </button>
                    <button
                      onClick={() =>
                        handleClassDataChange("classLocation", "Virtual")
                      }
                      className={`rounded-full px-4 py-2 text-sm ${
                        classData.classLocation === "Virtual"
                          ? "border border-yellow-500 bg-yellow-400"
                          : "border border-gray-200"
                      }`}
                    >
                      {t("createClass.location.virtual")}
                    </button>
                  </div>
                </div>
                {/* Class Address (shown only when Physical is selected) */}
                {classData.classLocation === "Physical" && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      {t("createClass.location.address")}
                    </label>
                    <input
                      type="text"
                      placeholder={t(
                        "createClass.location.address.placeholder",
                      )}
                      value={classData.classAddress}
                      onChange={(e) =>
                        handleClassDataChange("classAddress", e.target.value)
                      }
                      className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-gray-300 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-row items-start justify-between space-x-4">
              {/* Available Slots */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  {t("createClass.slots.label")}
                </label>

                <NumberInput
                  placeholder={t("createClass.slots.placeholder")}
                  value={classData.availableSpots}
                  min={5}
                  size="md"
                  clampBehavior="strict"
                  onChange={(value) =>
                    handleClassDataChange("availableSpots", value)
                  }
                  classNames={{
                    input:
                      "mt-1 w-full rounded-lg border font-urbanist border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-gray-300",
                  }}
                />
              </div>

              {/* Class Duration */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  {t("createClass.duration.label")}
                </label>
                <div className="mt-1 flex gap-2">
                  {[30, 60].map((duration) => (
                    <button
                      key={duration}
                      onClick={() =>
                        handleClassDataChange("classDuration", duration)
                      }
                      className={`rounded-full px-4 py-2 text-sm ${
                        classData.classDuration === duration
                          ? "border border-yellow-500 bg-yellow-400"
                          : "border border-gray-200"
                      }`}
                    >
                      {duration} {t("createClass.duration.minutes")}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  {t("createClass.schedule.date")}
                </label>
                <input
                  type="date"
                  value={formatToYYYYMMDD(classData.classDateTime)}
                  className="w-full rounded-lg border border-gray-300 p-2 focus:border-[#14B82C] focus:outline-none focus:ring-0"
                  onChange={(e) => {
                    // parse the user input as local, not UTC
                    const [year, month, day] = e.target.value
                      .split("-")
                      .map(Number);
                    const newLocalDate = new Date(year, month - 1, day);
                    // preserve the time from the existing Date if you want
                    newLocalDate.setHours(classData.classDateTime.getHours());
                    newLocalDate.setMinutes(
                      classData.classDateTime.getMinutes(),
                    );

                    setClassData((prev) => ({
                      ...prev,
                      classDateTime: newLocalDate,
                    }));
                  }}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  {t("createClass.schedule.time")}
                </label>
                <input
                  type="time"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-gray-300 focus:outline-none"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-between pt-4">
              <button
                onClick={() => setAddClassModalOpen(false)}
                className="rounded-full border border-gray-200 px-8 py-2.5 text-sm font-medium"
              >
                {t("createClass.buttons.cancel")}
              </button>
              <button
                onClick={handleSaveClass}
                disabled={!isFormValid || isCreating}
                className={`flex min-w-[120px] items-center justify-center rounded-full px-8 py-2.5 text-sm font-medium ${
                  isFormValid && !isCreating
                    ? "cursor-pointer border border-[#042f0c] bg-[#a6fab6] hover:bg-[#95e1a4]"
                    : "cursor-not-allowed border border-gray-300 bg-gray-200"
                }`}
              >
                {isCreating
                  ? t("createClass.buttons.creating")
                  : t("createClass.buttons.create")}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showLeaveConfirmation}
        onRequestClose={() => setShowLeaveConfirmation(false)}
        className="z-50 mx-auto mt-40 max-w-sm rounded-3xl bg-white p-6 font-urbanist outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        style={{
          overlay: {
            zIndex: 60,
          },
          content: {
            border: "none",
            padding: "24px",
            maxWidth: "420px",
            position: "relative",
            zIndex: 61,
          },
        }}
      >
        <div className="text-center">
          <div className="flex items-center justify-center">
            {" "}
            <img src="/svgs/empty-big.svg" alt="bammbuu" />
          </div>
          <h2 className="mb-4 text-xl font-semibold">
            {t("leaveGroup.title")}
          </h2>
          <div className="flex flex-row gap-2">
            <button
              className="w-full rounded-full border border-gray-300 py-2 font-medium hover:bg-gray-50"
              onClick={() => setShowLeaveConfirmation(false)}
            >
              {t("leaveGroup.buttons.no")}
            </button>
            <button
              className="w-full rounded-full border border-[#8b0000] bg-[#ff4d4d] py-2 font-medium text-black hover:bg-[#ff3333]"
              onClick={handleLeaveGroup}
            >
              {isLeaving
                ? t("leaveGroup.buttons.leaving")
                : t("leaveGroup.buttons.yes")}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showRemoveConfirmation}
        onRequestClose={() => setShowRemoveConfirmation(false)}
        className="z-50 mx-auto mt-40 max-w-sm rounded-3xl bg-white p-6 font-urbanist outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        style={{
          overlay: {
            zIndex: 60,
          },
          content: {
            border: "none",
            padding: "24px",
            maxWidth: "420px",
            position: "relative",
            zIndex: 61,
          },
        }}
      >
        <div className="text-center">
          <div className="flex items-center justify-center">
            {" "}
            <img src="/svgs/empty-big.svg" alt="bammbuu" />
          </div>

          <h2 className="mb-4 text-xl font-semibold">
            {/* {t("removeUser.title", { userName: selectedUser?.name })}{" "} */}
            Remove {selectedUser?.name} from group?
          </h2>
          <p className="mb-6 text-gray-600">{t("removeUser.description")}</p>
          <div className="flex flex-row gap-2">
            <button
              className="w-full rounded-full border border-gray-300 py-2 font-medium hover:bg-gray-50"
              onClick={() => setShowRemoveConfirmation(false)}
            >
              {t("removeUser.buttons.cancel")}
            </button>
            <button
              className="w-full rounded-full border border-[#8b0000] bg-[#ff4d4d] py-2 font-medium text-black hover:bg-[#ff3333]"
              onClick={() => handleRemoveUser(selectedUser.id)}
              disabled={isRemoving}
            >
              {isRemoving
                ? t("removeUser.buttons.removing")
                : t("removeUser.buttons.remove")}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDeleteConfirmation}
        onRequestClose={() => setShowDeleteConfirmation(false)}
        className="z-50 mx-auto mt-40 max-w-sm rounded-3xl bg-white p-6 font-urbanist outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        style={{
          overlay: {
            zIndex: 60,
          },
          content: {
            border: "none",
            padding: "24px",
            maxWidth: "420px",
            position: "relative",
            zIndex: 61,
          },
        }}
      >
        <div className="text-center">
          <div className="flex items-center justify-center">
            {" "}
            <img src="/svgs/empty-big.svg" alt="bammbuu" />
          </div>
          <h2 className="mb-4 text-xl font-semibold">
            {t("deleteGroup.title")}
          </h2>
          <div className="flex flex-row gap-2">
            <button
              className="w-full rounded-full border border-gray-300 py-2 font-medium hover:bg-gray-50"
              onClick={() => setShowDeleteConfirmation(false)}
            >
              {t("deleteGroup.buttons.cancel")}
            </button>
            <button
              className="w-full rounded-full border border-[#8b0000] bg-[#ff4d4d] py-2 font-medium text-black hover:bg-[#ff3333]"
              onClick={handleDeleteGroup}
              disabled={isDeleting}
            >
              {isDeleting
                ? t("deleteGroup.buttons.deleting")
                : t("deleteGroup.buttons.delete")}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default GroupDetailsUser;
