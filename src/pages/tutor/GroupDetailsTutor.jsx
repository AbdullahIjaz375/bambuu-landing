import React, { useState, useEffect } from "react";
import {
  X,
  Clock,
  Calendar,
  User,
  Users,
  Camera,
  ArrowLeft,
} from "lucide-react";
import {
  doc,
  getDoc,
  collection,
  deleteDoc,
  serverTimestamp,
  addDoc,
  updateDoc,
} from "firebase/firestore";
import { useTranslation } from "react-i18next";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { ChannelType } from "../../config/stream";
import { db, storage } from "../../firebaseConfig";
import { ClipLoader } from "react-spinners";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Button,
  TextInput,
  Textarea,
  Select,
  NumberInput,
  Checkbox,
  MultiSelect,
} from "@mantine/core";
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
import ClassCardTutor from "../../components-tutor/ClassCardTutor";
import { deleteStreamChannel } from "../../services/streamService";
import EmptyState from "../../components/EmptyState";
import ShowDescription from "../../components/ShowDescription";
Modal.setAppElement("#root");

const GroupDetailsTutor = ({ onClose }) => {
  const { t } = useTranslation();

  const { user, setUser } = useAuth(); // Destructure setUser to update context

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Classes");
  const [classes, setClasses] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

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

      // Close modals and navigate
      setShowLeaveConfirmation(false);
      onClose();
      navigate("/learn");
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
    classType: "Group Premium",
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
      };

      return Object.values(requiredFields).every((field) => field === true);
    };

    setIsFormValid(validateForm());
  }, [classData]);

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

      const classTypee = "Group Premium";

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
        groupId: groupId || null, // Handle case when groupId is not available
        className: classData.className,
        classDescription: classData.classDescription,
        language: classData.language,
        languageLevel: classData.languageLevel,
        availableSpots: classData.availableSpots,
        classDuration: classData.classDuration,
        classDateTime: localDate,
        recurrenceTypes: classData.recurrenceTypes,
        selectedRecurrenceType: "",
        recurringSlots: [],
        classLocation: classData.classLocation,
        classType: classTypee,
        classAddress: classAddress,
        imageUrl,
        classMemberIds: [],
        createdAt: serverTimestamp(),
      };

      // Update the class document
      await updateDoc(doc(db, "classes", classId), newClass);

      // Update tutor document with new class ID in tutorOfClasses array
      const userRef = doc(db, "tutors", user.uid);
      const updatedTutorOfClasses = [...(user.tutorOfClasses || []), classId];
      await updateDoc(userRef, {
        tutorOfClasses: updatedTutorOfClasses,
      });

      // If groupId exists, update the group document with the new class ID
      if (groupId) {
        const groupRef = doc(db, "groups", groupId);
        const groupDoc = await getDoc(groupRef);

        if (groupDoc.exists()) {
          const currentClassIds = groupDoc.data().classIds || [];
          await updateDoc(groupRef, {
            classIds: [...currentClassIds, classId],
            // updatedAt: serverTimestamp(),
          });
        }
      }

      // Update user context and session storage
      const updatedUser = {
        ...user,
        tutorOfClasses: updatedTutorOfClasses,
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
        classType: "Group Premium",
        classAddress: "",
        imageUrl: "",
        selectedRecurrenceType: "",
        recurringSlots: [],
      });

      // Navigate to classes tutor page
      navigate("/classesTutor");
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
                    // tutorStudentIds: (memberData.tutorStudentIds || []).filter(
                    //   (id) => id !== classData.adminId
                    // ),
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
                // tutorStudentIds: (adminData.tutorStudentIds || []).filter(
                //   (studentId) => !classData.classMemberIds?.includes(studentId)
                // ),
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
        type: ChannelType.PREMIUM_GROUP,
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
          <EmptyState
            message={t("group-details-tutor.empty-states.no-classes")}
          />
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {classes.map((classItem) => (
          <ClassCardTutor
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
        ))}
      </div>
    );
  };
  const handleBack = () => {
    navigate(-1);
  };

  // Update the renderMembers function to include remove button for admin
  const renderMembers = () => {
    if (members.length === 0) {
      return (
        <div className="flex h-96 items-center justify-center">
          <EmptyState
            message={t("group-details-tutor.empty-states.no-members")}
          />
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between rounded-3xl border border-gray-200 px-4 py-3 hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={member.photoUrl || "/images/panda.png"}
                  alt={member.name}
                  className="h-9 w-9 rounded-full object-cover"
                />
                {member.id === group.groupAdminId && (
                  <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-400">
                    <span className="text-xs text-black">★</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">
                  {member.name}
                </span>
                {member.id === group.groupAdminId && (
                  <span className="text-xs text-gray-500">
                    {" "}
                    {t("group-details-tutor.member-status.admin")}
                  </span>
                )}
              </div>
            </div>
            {user.uid === group.groupAdminId &&
              member.id !== group.groupAdminId && (
                <button
                  onClick={() => {
                    setSelectedUser(member);
                    setShowRemoveConfirmation(true);
                  }}
                  className="rounded-full border border-red-500 px-3 py-1 text-xs text-red-500 hover:bg-red-50"
                >
                  {t("group-details-tutor.actions.remove-member")}
                </button>
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
            {t("group-details-tutor.error.close")}
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
                  {t("group-details-tutor.title")}
                </h1>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 gap-6">
              {/* Left sidebar */}
              <div
                className={`w-1/4 rounded-3xl p-6 ${
                  group.isPremium ? "bg-[#e6fce8]" : "bg-[#ffffea]"
                }`}
              >
                {" "}
                <div className="flex h-full flex-col items-center justify-between text-center">
                  <div className="flex flex-col items-center text-center">
                    <img
                      src={group.imageUrl}
                      alt={group.groupName}
                      className="mb-4 h-32 w-32 rounded-full object-cover"
                    />
                    <h3 className="mb-2 text-2xl font-medium">
                      {group.groupName}
                    </h3>
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex flex-row items-center space-x-1">
                        <img
                          src={
                            group.language === "English"
                              ? "/svgs/xs-us.svg"
                              : group.language === "Spanish"
                                ? "/svgs/xs-spain.svg"
                                : "/svgs/eng-spanish-xs.svg"
                          }
                          alt={
                            group.language === "English"
                              ? "US Flag"
                              : "Spain Flag"
                          }
                          className="w-5"
                        />{" "}
                        <span className="text-md">
                          {group.groupLearningLanguage}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-row items-center space-x-40">
                      <div className="mb-4 flex items-center gap-1">
                        <img
                          src={group.groupAdminImageUrl}
                          alt="admin"
                          className="h-6 w-6 rounded-full"
                        />{" "}
                        <span className="text-sm text-gray-800">
                          {group.groupAdminName} (
                          {t("group-details-tutor.member-status.admin")})
                        </span>
                      </div>
                      <div className="mb-4 flex items-center gap-1">
                        <img alt="bammbuu" src="/svgs/users.svg" />{" "}
                        <span className="text-sm text-gray-800">
                          {" "}
                          {group?.memberIds?.length}
                        </span>
                      </div>
                    </div>
                    <p className="mb-6 text-gray-600">
                      <ShowDescription
                        description={group.groupDescription}
                        maxHeight={100}
                      />
                    </p>
                  </div>

                  <div className="w-full">
                    {" "}
                    <button
                      className={`mb-2 w-full rounded-full border px-4 py-2 text-black ${
                        group.isPremium
                          ? "border-[#0a0d0b] bg-[#bffcc4]"
                          : "border-gray-300 bg-[#ffffea]"
                      }`}
                    >
                      {t("group-details-tutor.actions.view-chat")}
                    </button>
                    {user.uid === group.groupAdminId ? (
                      <>
                        <button
                          className="mb-2 w-full rounded-full border border-black bg-white px-4 py-2 text-black"
                          onClick={() => navigate(`/editGroupTutor/${groupId}`)}
                        >
                          {t("group-details-tutor.actions.edit-details")}
                        </button>
                        <button
                          className="w-full rounded-full border border-red-500 px-4 py-2 text-red-500"
                          onClick={() => setShowDeleteConfirmation(true)}
                        >
                          {t("group-details-tutor.actions.delete-group")}
                        </button>
                      </>
                    ) : (
                      <button
                        className="w-full rounded-full border border-red-500 px-4 py-2 text-red-500"
                        onClick={() => setShowLeaveConfirmation(true)}
                      >
                        {t("group-details-tutor.actions.leave-group")}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Main content */}
              <div className="flex min-h-0 flex-1 flex-col">
                {/* Previous code remains the same until the buttons section */}
                <div className="mb-6 flex flex-row items-center justify-between">
                  <div className="flex justify-center">
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
                        className="text-md relative z-10 whitespace-nowrap rounded-full px-4 py-2 font-medium text-[#042F0C] transition-colors sm:px-6"
                      >
                        {t("group-details-tutor.tabs.classes")}
                      </button>
                      <button
                        onClick={() => setActiveTab("Members")}
                        className="text-md relative z-10 whitespace-nowrap rounded-full px-4 py-2 font-medium text-[#042F0C] transition-colors sm:px-6"
                      >
                        {t("group-details-tutor.tabs.members")}
                      </button>
                    </div>
                  </div>

                  {user.uid === group.groupAdminId && (
                    <button
                      className="rounded-full border border-[#19291c] bg-[#14b82c] px-6 py-2 text-[#19291c]"
                      onClick={handleAddClassButtonClick}
                    >
                      + {t("group-details-tutor.actions.create-class")}
                    </button>
                  )}
                </div>
                {loading ? (
                  <div className="flex flex-1 items-center justify-center">
                    <ClipLoader color="#FFB800" size={40} />
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
        className="mx-auto w-[1000px] rounded-3xl bg-white p-8 font-urbanist outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      >
        <div className="relative">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-medium">Create New Class</h2>
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
                  Class name
                </label>
                <input
                  type="text"
                  placeholder="Class name"
                  value={classData.className}
                  onChange={(e) =>
                    handleClassDataChange("className", e.target.value)
                  }
                  className="w-full rounded-3xl border border-gray-300 p-2 focus:border-[#14B82C] focus:outline-none focus:ring-0"
                />
              </div>

              {/* Language */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Class Language
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
                    English
                  </button>
                  <button
                    onClick={() => handleClassDataChange("language", "Spanish")}
                    className={`rounded-full px-4 py-2 text-sm ${
                      classData.language === "Spanish"
                        ? "border border-yellow-500 bg-yellow-400"
                        : "border border-gray-200"
                    }`}
                  >
                    Spanish
                  </button>
                  <button
                    onClick={() =>
                      handleClassDataChange(
                        "language",
                        "English-Spanish Exchange",
                      )
                    }
                    className={`rounded-full px-4 py-2 text-sm ${
                      classData.language === "English-Spanish Exchange"
                        ? "border border-yellow-500 bg-yellow-400"
                        : "border border-gray-200"
                    }`}
                  >
                    English-Spanish Exchange
                  </button>
                </div>
              </div>
            </div>
            {/* Description */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                Class Description
              </label>
              <textarea
                placeholder="Enter short description of class (max 200 letter)"
                value={classData.classDescription}
                onChange={(e) =>
                  handleClassDataChange("classDescription", e.target.value)
                }
                maxLength={200}
                rows={3}
                className="w-full resize-none rounded-3xl border border-gray-300 p-2 focus:border-[#14B82C] focus:outline-none focus:ring-0"
              />
            </div>
            <div className="flex flex-row items-start justify-between space-x-4">
              {/* Class Level */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Class Level
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
                  Class Type
                </label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {["One-time", "Daily", "Weekly", "Monthly"].map((type) => (
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
                    Class Location
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
                      Physical
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
                      Virtual
                    </button>
                  </div>
                </div>
                {/* Class Address (shown only when Physical is selected) */}
                {classData.classLocation === "Physical" && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Class Address
                    </label>
                    <input
                      type="text"
                      placeholder="Enter physical class address"
                      value={classData.classAddress}
                      onChange={(e) =>
                        handleClassDataChange("classAddress", e.target.value)
                      }
                      className="w-full rounded-3xl border border-gray-300 p-2 focus:border-[#14B82C] focus:outline-none focus:ring-0"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-row items-start justify-between space-x-4">
              {/* Available Slots */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Available Slots
                </label>
                <NumberInput
                  placeholder="Enter slots number"
                  value={classData.availableSpots || ""}
                  min={5}
                  size="md"
                  clampBehavior="strict"
                  onChange={(value) =>
                    handleClassDataChange("availableSpots", value)
                  }
                  classNames={{
                    input:
                      "mt-1 w-full rounded-3xl border font-urbanist border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-gray-300",
                  }}
                />
              </div>

              {/* Class Duration */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Class Duration
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
                      {duration} min
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              {/* <div>
                <label className="text-sm font-medium text-gray-700">
                  Class Date
                </label>
                <input
                  type="date"
                  value={classData.classDateTime}
                  onChange={(e) =>
                    handleClassDataChange("classDateTime", e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded-3xl focus:border-[#14B82C] focus:ring-0 focus:outline-none"
                />
              </div> */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Class Date
                </label>
                <input
                  type="date"
                  value={formatToYYYYMMDD(classData.classDateTime)}
                  className="w-full rounded-3xl border border-gray-300 p-2 focus:border-[#14B82C] focus:outline-none focus:ring-0"
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
                  Class Starting Time
                </label>
                <input
                  type="time"
                  className="w-full rounded-3xl border border-gray-300 p-2 focus:border-[#14B82C] focus:outline-none focus:ring-0"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-between pt-4">
              <button
                onClick={() => setAddClassModalOpen(false)}
                className="rounded-full border border-gray-200 px-8 py-2.5 text-sm font-medium"
              >
                Cancel
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
                {isCreating ? "Creating..." : "Create Class"}
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
          <h2 className="mb-4 text-xl font-semibold">
            Are you sure you want to leave this group?
          </h2>
          <div className="flex flex-row gap-2">
            <button
              className="w-full rounded-full border border-gray-300 py-2 font-medium hover:bg-gray-50"
              onClick={() => setShowLeaveConfirmation(false)}
            >
              No, Cancel
            </button>
            <button
              className="w-full rounded-full border border-[#8b0000] bg-[#ff4d4d] py-2 font-medium text-black hover:bg-[#ff3333]"
              onClick={handleLeaveGroup}
            >
              {isLeaving ? "Leaving..." : "Yes, Leave"}
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
          <h2 className="mb-4 text-xl font-semibold">
            Remove {selectedUser?.name} from group?
          </h2>
          <p className="mb-6 text-gray-600">
            This action cannot be undone. The user will need to request to join
            again.
          </p>
          <div className="flex flex-row gap-2">
            <button
              className="w-full rounded-full border border-gray-300 py-2 font-medium hover:bg-gray-50"
              onClick={() => setShowRemoveConfirmation(false)}
            >
              Cancel
            </button>
            <button
              className="w-full rounded-full border border-[#8b0000] bg-[#ff4d4d] py-2 font-medium text-black hover:bg-[#ff3333]"
              onClick={() => handleRemoveUser(selectedUser.id)}
              disabled={isRemoving}
            >
              {isRemoving ? "Removing..." : "Remove"}
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
          <h2 className="mb-4 text-xl font-semibold">
            Are you sure you want to delete this group?
          </h2>
          <div className="flex flex-row gap-2">
            <button
              className="w-full rounded-full border border-gray-300 py-2 font-medium hover:bg-gray-50"
              onClick={() => setShowDeleteConfirmation(false)}
            >
              No, Cancel
            </button>
            <button
              className="w-full rounded-full border border-[#8b0000] bg-[#ff4d4d] py-2 font-medium text-black hover:bg-[#ff3333]"
              onClick={handleDeleteGroup}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default GroupDetailsTutor;
