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
          })
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
          })
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
        (id) => id !== user.uid
      );
      await updateDoc(groupRef, {
        memberIds: updatedMemberIds,
      });

      // Remove group from user's joinedGroups
      const updatedJoinedGroups = (user.joinedGroups || []).filter(
        (id) => id !== group.id
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
        (id) => id !== userId
      );
      await updateDoc(groupRef, {
        memberIds: updatedMemberIds,
      });

      // Get user data and update their joinedGroups
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      const updatedJoinedGroups = (userData.joinedGroups || []).filter(
        (id) => id !== group.id
      );

      // Update user document
      await updateDoc(userRef, {
        joinedGroups: updatedJoinedGroups,
      });

      // Update local state
      setMembers((prevMembers) =>
        prevMembers.filter((member) => member.id !== userId)
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
          `classes/${classId}/image_${Date.now()}_${classImage.name}`
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
        dateValue.getMinutes()
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
                      (id) => id !== classId
                    ),
                    // Remove tutorStudentIds relationship if exists
                    tutorStudentIds: (memberData.tutorStudentIds || []).filter(
                      (id) => id !== classData.adminId
                    ),
                  });
                }
              })
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
                  (id) => id !== classId
                ),
                enrolledClasses: (adminData.enrolledClasses || []).filter(
                  (id) => id !== classId
                ),
                // Update tutorStudentIds
                tutorStudentIds: (adminData.tutorStudentIds || []).filter(
                  (studentId) => !classData.classMemberIds?.includes(studentId)
                ),
              });
            } else {
              await updateDoc(adminRef, {
                adminOfClasses: (adminData.adminOfClasses || []).filter(
                  (id) => id !== classId
                ),
                enrolledClasses: (adminData.enrolledClasses || []).filter(
                  (id) => id !== classId
                ),
              });
            }
          }

          // Delete class document
          await deleteDoc(classRef);
        })
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
                  (id) => id !== group.id
                ),
              });
            }
          })
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
                  (id) => id !== group.id
                ),
                joinedGroups: (adminData.joinedGroups || []).filter(
                  (id) => id !== group.id
                ),
              }
            : {
                adminOfGroups: (adminData.adminOfGroups || []).filter(
                  (id) => id !== group.id
                ),
                joinedGroups: (adminData.joinedGroups || []).filter(
                  (id) => id !== group.id
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
          (id) => id !== group.id
        );
        updatedUser.tutorOfClasses = (updatedUser.tutorOfClasses || []).filter(
          (id) => !group.classIds?.includes(id)
        );
        updatedUser.enrolledClasses = (
          updatedUser.enrolledClasses || []
        ).filter((id) => !group.classIds?.includes(id));
        updatedUser.joinedGroups = (updatedUser.joinedGroups || []).filter(
          (id) => id !== group.id
        );
      } else {
        updatedUser.adminOfGroups = (updatedUser.adminOfGroups || []).filter(
          (id) => id !== group.id
        );
        updatedUser.adminOfClasses = (updatedUser.adminOfClasses || []).filter(
          (id) => !group.classIds?.includes(id)
        );
        updatedUser.enrolledClasses = (
          updatedUser.enrolledClasses || []
        ).filter((id) => !group.classIds?.includes(id));
        updatedUser.joinedGroups = (updatedUser.joinedGroups || []).filter(
          (id) => id !== group.id
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
        <div className="flex items-center justify-center h-48 sm:h-64 md:h-96">
          <EmptyState message="No members available" />
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {allMembers.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2 border border-gray-200 hover:bg-gray-50 rounded-2xl sm:rounded-3xl"
          >
            <div className="flex items-center gap-2 flex-grow overflow-hidden">
              <img
                src={member.photoUrl || "/images/panda.png"}
                alt={member.name}
                className="object-cover flex-shrink-0 rounded-full w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9"
              />

              <div className="flex flex-row items-center justify-between w-full overflow-hidden">
                <span className="text-xs sm:text-sm font-medium text-gray-900 truncate mr-1">
                  {member.name}
                </span>
                {member.id === group.groupAdminId && (
                  <span className="px-1 py-0.5 text-xs text-right whitespace-nowrap text-gray-500 bg-gray-200 rounded-full">
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
                      className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex-shrink-0 ml-1"
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
                      className="text-red-500 font-urbanist"
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
        <div className="flex flex-1 m-1 border sm:m-2 md:m-6 rounded-xl md:rounded-3xl">
          <div className="flex flex-col w-full p-2 bg-white sm:p-3 md:p-6 rounded-xl md:rounded-3xl">
            <div className="flex items-center justify-between pb-2 mb-2 border-b sm:mb-3 md:pb-4 md:mb-6">
              <div className="flex items-center gap-2 md:gap-4">
                {" "}
                <button
                  className="p-1.5 bg-gray-100 rounded-full sm:p-2 md:p-3"
                  onClick={handleBack}
                >
                  <ArrowLeft
                    size={16}
                    className="sm:w-5 sm:h-5 md:w-6 md:h-6"
                  />
                </button>
                <h1 className="text-lg font-semibold sm:text-xl md:text-2xl lg:text-3xl">
                  {t("group-details.title")}
                </h1>
              </div>
            </div>{" "}
            <div className="flex flex-col flex-1 min-h-0 gap-3 lg:flex-row md:gap-6">
              {/* Left sidebar */}
              <div
                className={`w-full lg:w-1/3 p-3 sm:p-4 md:p-5 rounded-xl md:rounded-3xl flex-shrink-0 ${
                  group.isPremium ? "bg-[#e6fce8]" : "bg-[#ffffea]"
                }`}
              >
                <div className="flex flex-col items-center justify-between h-full text-center max-w-full">
                  <div className="flex flex-col items-center text-center max-w-full">
                    <img
                      src={group.imageUrl}
                      alt={group.groupName}
                      className="object-cover w-12 h-12 mb-2 rounded-full sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24"
                    />
                    <h3 className="mb-1 text-sm font-semibold truncate w-full sm:text-base md:text-lg lg:text-xl">
                      {group.groupName}
                    </h3>
                    <div className="flex items-center gap-1 mb-1">
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
                          className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5"
                        />
                        <span className="text-xs sm:text-sm">
                          {group.groupLearningLanguage}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center w-full gap-x-20">
                      <span className="text-md text-gray-800 truncate max-w-[120px] sm:max-w-[160px] md:max-w-[200px]">
                        {group.groupAdminName} (Admin)
                      </span>
                      <div className="flex items-center gap-2">
                        <img
                          alt="bammbuu"
                          src="/svgs/users.svg"
                          className="w-3 h-3 sm:w-4 sm:h-4"
                        />
                        <span className="text-xs text-gray-800">
                          {group?.memberIds.length}
                        </span>
                      </div>
                    </div>
                    <div className="w-full mt-1 sm:mt-2 md:mt-3 px-1">
                      <ShowDescription
                        description={group.groupDescription}
                        maxHeight={60}
                      />
                    </div>
                  </div>
                  <div className="w-full mt-2 space-y-2">
                    {group.isPremium && (
                      <div className="w-full scale-90 origin-top sm:scale-100">
                        <GroupInfoCard group={group} />
                      </div>
                    )}
                    <div className="w-full space-y-1 sm:space-y-2">
                      <button
                        className={`w-full px-2 py-1 text-xs sm:text-sm md:text-base text-black border rounded-full ${
                          group.isPremium
                            ? "bg-[#bffcc4] border-[#0a0d0b]"
                            : "bg-[#FFFBC5] border-black"
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
                            className="w-full px-2 py-1 text-xs sm:text-sm text-black bg-white border border-black rounded-full md:px-4 md:text-base"
                            onClick={() => navigate(`/editGroup/${groupId}`)}
                          >
                            {t("group-details.buttons.editDetails")}
                          </button>
                          <button
                            className="w-full px-2 py-1 text-xs sm:text-sm text-red-500 bg-white border border-red-500 rounded-full md:px-4 md:text-base"
                            onClick={() => setShowDeleteConfirmation(true)}
                          >
                            {t("group-details.buttons.deleteGroup")}
                          </button>
                        </>
                      ) : (
                        <button
                          className="w-full px-2 py-1 text-xs sm:text-sm text-red-500 border border-red-500 rounded-full md:px-4 md:text-base"
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
              <div className="flex flex-col flex-1 min-h-0">
                <div className="flex flex-col items-center justify-between gap-2 mb-3 md:flex-row md:mb-6 md:gap-0">
                  <div className="flex justify-center w-full md:w-auto">
                    <div className="relative inline-flex p-1 bg-gray-100 border border-gray-300 rounded-full">
                      <div
                        className="absolute top-0 left-0 h-full bg-[#FFBF00] border border-[#042F0C] rounded-full transition-all duration-300 ease-in-out"
                        style={{
                          transform: `translateX(${
                            activeTab === "Classes" ? "0" : "100%"
                          })`,
                          width: "50%",
                        }}
                      />
                      <button
                        onClick={() => setActiveTab("Classes")}
                        className="relative z-10 px-3 sm:px-6 md:px-8 py-1 rounded-full text-[#042F0C] text-xs sm:text-sm md:text-base font-medium transition-colors whitespace-nowrap"
                      >
                        {t("group-details.classes")}
                      </button>
                      <button
                        onClick={() => setActiveTab("Members")}
                        className="relative z-10 px-3 sm:px-6 md:px-8 py-1 rounded-full text-[#042F0C] text-xs sm:text-sm md:text-base font-medium transition-colors whitespace-nowrap"
                      >
                        {t("group-details.members")}
                      </button>
                    </div>
                  </div>

                  {user.uid === group.groupAdminId && (
                    <button
                      className="w-full mt-2 md:mt-0 md:w-auto bg-[#14b82c] border border-[#19291c] text-[#19291c] px-2 sm:px-3 md:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm md:text-base"
                      onClick={handleAddClassButtonClick}
                    >
                      {t("group-details.buttons.createClass")}
                    </button>
                  )}
                </div>
                {loading ? (
                  <div className="flex items-center justify-center flex-1">
                    <ClipLoader
                      color="#FFB800"
                      size={30}
                      className="sm:w-10 sm:h-10"
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
        className="max-w-[90vw] w-[1000px] max-h-[90vh] p-4 md:p-6 lg:p-8 mx-auto bg-white rounded-3xl outline-none font-urbanist overflow-y-auto scrollbar-hide"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      >
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-medium">{t("createClass.title")}</h2>
            <button
              onClick={() => setAddClassModalOpen(false)}
              className="rounded-full hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>

          {/* Image Upload */}
          <div className="flex justify-start mb-8">
            <div
              className="relative flex items-center justify-center border border-gray-300 border-dashed rounded-full cursor-pointer w-28 h-28 bg-gray-50"
              onClick={() => document.getElementById("classImage").click()}
            >
              {classPreviewImage ? (
                <img
                  src={classPreviewImage}
                  alt="Preview"
                  className="object-cover w-full h-full rounded-full"
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
                  className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-gray-300"
                />
              </div>

              {/* Language */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  {t("createClass.language.label")}
                </label>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => handleClassDataChange("language", "English")}
                    className={`px-4 py-2 rounded-full text-sm ${
                      classData.language === "English"
                        ? "bg-yellow-400 border border-yellow-500"
                        : "border border-gray-200"
                    }`}
                  >
                    {t("createClass.language.english")}
                  </button>
                  <button
                    onClick={() => handleClassDataChange("language", "Spanish")}
                    className={`px-4 py-2 rounded-full text-sm ${
                      classData.language === "Spanish"
                        ? "bg-yellow-400 border border-yellow-500"
                        : "border border-gray-200"
                    }`}
                  >
                    {t("createClass.language.spanish")}
                  </button>
                  <button
                    onClick={() =>
                      handleClassDataChange("language", "English-Spanish")
                    }
                    className={`px-4 py-2 rounded-full text-sm ${
                      classData.language === "English-Spanish"
                        ? "bg-yellow-400 border border-yellow-500"
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
                className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-gray-300"
              />
            </div>
            <div className="flex flex-row items-start justify-between space-x-4">
              {/* Class Level */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  {t("createClass.level.label")}
                </label>
                <div className="flex gap-2 mt-1">
                  {["Beginner", "Intermediate", "Advanced"].map((level) => (
                    <button
                      key={level}
                      onClick={() =>
                        handleClassDataChange("languageLevel", level)
                      }
                      className={`px-4 py-2 rounded-full text-sm ${
                        classData.languageLevel === level
                          ? "bg-yellow-400 border border-yellow-500"
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
                <div className="flex flex-wrap gap-2 mt-1">
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
                      className={`px-4 py-2 rounded-full text-sm ${
                        classData.selectedRecurrenceType === type
                          ? "bg-yellow-400 border border-yellow-500"
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
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() =>
                        handleClassDataChange("classLocation", "Physical")
                      }
                      className={`px-4 py-2 rounded-full text-sm ${
                        classData.classLocation === "Physical"
                          ? "bg-yellow-400 border border-yellow-500"
                          : "border border-gray-200"
                      }`}
                    >
                      {t("createClass.location.physical")}
                    </button>
                    <button
                      onClick={() =>
                        handleClassDataChange("classLocation", "Virtual")
                      }
                      className={`px-4 py-2 rounded-full text-sm ${
                        classData.classLocation === "Virtual"
                          ? "bg-yellow-400 border border-yellow-500"
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
                        "createClass.location.address.placeholder"
                      )}
                      value={classData.classAddress}
                      onChange={(e) =>
                        handleClassDataChange("classAddress", e.target.value)
                      }
                      className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-gray-300"
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
                <div className="flex gap-2 mt-1">
                  {[30, 60].map((duration) => (
                    <button
                      key={duration}
                      onClick={() =>
                        handleClassDataChange("classDuration", duration)
                      }
                      className={`px-4 py-2 rounded-full text-sm ${
                        classData.classDuration === duration
                          ? "bg-yellow-400 border border-yellow-500"
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
                  className="w-full p-2 border border-gray-300 rounded-lg focus:border-[#14B82C] focus:ring-0 focus:outline-none"
                  onChange={(e) => {
                    // parse the user input as local, not UTC
                    const [year, month, day] = e.target.value
                      .split("-")
                      .map(Number);
                    const newLocalDate = new Date(year, month - 1, day);
                    // preserve the time from the existing Date if you want
                    newLocalDate.setHours(classData.classDateTime.getHours());
                    newLocalDate.setMinutes(
                      classData.classDateTime.getMinutes()
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
                  className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-gray-300"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-between pt-4">
              <button
                onClick={() => setAddClassModalOpen(false)}
                className="px-8 py-2.5 border border-gray-200 rounded-full text-sm font-medium"
              >
                {t("createClass.buttons.cancel")}
              </button>
              <button
                onClick={handleSaveClass}
                disabled={!isFormValid || isCreating}
                className={`px-8 py-2.5 rounded-full text-sm font-medium min-w-[120px] flex items-center justify-center ${
                  isFormValid && !isCreating
                    ? "bg-[#a6fab6] border border-[#042f0c] cursor-pointer hover:bg-[#95e1a4]"
                    : "bg-gray-200 border border-gray-300 cursor-not-allowed"
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
        className="z-50 max-w-sm p-6 mx-auto mt-40 bg-white outline-none rounded-3xl font-urbanist"
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
              className="w-full py-2 font-medium border border-gray-300 rounded-full hover:bg-gray-50"
              onClick={() => setShowLeaveConfirmation(false)}
            >
              {t("leaveGroup.buttons.no")}
            </button>
            <button
              className="w-full py-2 font-medium text-black bg-[#ff4d4d] rounded-full hover:bg-[#ff3333] border border-[#8b0000]"
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
        className="z-50 max-w-sm p-6 mx-auto mt-40 bg-white outline-none rounded-3xl font-urbanist"
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
              className="w-full py-2 font-medium border border-gray-300 rounded-full hover:bg-gray-50"
              onClick={() => setShowRemoveConfirmation(false)}
            >
              {t("removeUser.buttons.cancel")}
            </button>
            <button
              className="w-full py-2 font-medium text-black bg-[#ff4d4d] rounded-full hover:bg-[#ff3333] border border-[#8b0000]"
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
        className="z-50 max-w-sm p-6 mx-auto mt-40 bg-white outline-none rounded-3xl font-urbanist"
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
              className="w-full py-2 font-medium border border-gray-300 rounded-full hover:bg-gray-50"
              onClick={() => setShowDeleteConfirmation(false)}
            >
              {t("deleteGroup.buttons.cancel")}
            </button>
            <button
              className="w-full py-2 font-medium text-black bg-[#ff4d4d] rounded-full hover:bg-[#ff3333] border border-[#8b0000]"
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
