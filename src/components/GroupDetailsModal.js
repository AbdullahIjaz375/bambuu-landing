import React, { useState, useEffect } from "react";
import { X, Clock, Calendar, User, Users, Camera } from "lucide-react";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  addDoc,
  updateDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { db, storage } from "../firebaseConfig";
import { ClipLoader } from "react-spinners";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Import useAuth to access context
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
import Modal from "react-modal";
Modal.setAppElement("#root");

const GroupDetailsModal = ({ group, onClose }) => {
  const { user, setUser } = useAuth(); // Destructure setUser to update context

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Classes");
  const [classes, setClasses] = useState([]);
  const [members, setMembers] = useState([]);
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

      // Fetch members
      if (group.memberIds && group.memberIds.length > 0) {
        const membersData = await Promise.all(
          group.memberIds.map(async (memberId) => {
            const userDoc = await getDoc(doc(db, "students", memberId));
            // Add detailed logging

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
    availableSpots: 6,
    classDuration: 60,
    classDateTime: new Date(),
    recurrenceType: "One-time",
    physicalClass: false,
    classAddress: "",
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
        recurrenceType: !!classData.recurrenceType,
        classAddress:
          !classData.physicalClass || !!classData.classAddress.trim(),
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
      if (classImage) {
        const imageRef = ref(
          storage,
          `classes/${Date.now()}_${classImage.name}`,
        );
        await uploadBytes(imageRef, classImage);
        imageUrl = await getDownloadURL(imageRef);
      }

      // Add the new class document to Firestore
      const classRef = await addDoc(collection(db, "classes"), {});
      const classId = classRef.id;

      const newClass = {
        classId: classId,
        ...classData,
        adminId: user.uid,
        adminName: user.name || "",
        adminImageUrl: user.photoUrl || "",
        groupId: group.id,
        imageUrl,
        classMemberIds: [],
        tutorId: "",
        tutorName: "",
        tutorImageUrl: "",
        classDateTime: serverTimestamp(),
      };

      await updateDoc(doc(db, "classes", classId), newClass);

      // Update user document with the new class ID in both arrays
      const userRef = doc(db, "students", user.uid);
      const updatedJoinedClasses = [...(user.enrolledClasses || []), classId];
      const updatedAdminOfClasses = [...(user.adminOfClasses || []), classId];

      await updateDoc(userRef, {
        enrolledClasses: updatedJoinedClasses,
        adminOfClasses: updatedAdminOfClasses,
      });

      // Update group document with the new class ID
      const groupRef = doc(db, "groups", group.id);
      const groupDoc = await getDoc(groupRef);
      const currentClassIds = groupDoc.data().classIds || [];
      await updateDoc(groupRef, {
        classIds: [...currentClassIds, classId],
      });

      // Update context and session storage with both arrays
      const updatedUser = {
        ...user,
        enrolledClasses: updatedJoinedClasses,
        adminOfClasses: updatedAdminOfClasses,
      };
      setUser(updatedUser);
      sessionStorage.setItem("user", JSON.stringify(updatedUser));

      setAddClassModalOpen(false);

      // Reset form
      setClassImage(null);
      setClassPreviewImage(null);
      setClassData({
        className: "",
        classDescription: "",
        language: "English",
        languageLevel: "Beginner",
        availableSpots: 6,
        classDuration: 60,
        classDateTime: new Date(),
        recurrenceType: "One-time",
        physicalClass: false,
        classAddress: "",
      });

      // Refresh the classes list
      await fetchData();
    } catch (error) {
      console.error("Error adding class:", error);
    } finally {
      setIsCreating(false);
    }
  };

  // const handleSaveClass = async () => {
  //   if (!isFormValid || isCreating) return;
  //   setIsCreating(true);

  //   try {
  //     let imageUrl = "";
  //     if (classImage) {
  //       const imageRef = ref(
  //         storage,
  //         `classes/${Date.now()}_${classImage.name}`
  //       );
  //       await uploadBytes(imageRef, classImage);
  //       imageUrl = await getDownloadURL(imageRef);
  //     }

  //     // Add the new class document to Firestore
  //     const classRef = await addDoc(collection(db, "classes"), {});
  //     const classId = classRef.id;

  //     const newClass = {
  //       classId: classId, // Add the classId here
  //       ...classData,
  //       adminId: user.uid,
  //       adminName: user.name || "",
  //       adminImageUrl: user.photoUrl || "",
  //       groupId: group.id,
  //       imageUrl,
  //       classMemberIds: [user.uid],
  //       tutorId: "",
  //       tutorName: "",
  //       tutorImageUrl: "",
  //       classDateTime: serverTimestamp(),
  //     };

  //     await updateDoc(doc(db, "classes", classId), newClass);

  //     // Update user document with the new class ID
  //     const userRef = doc(db, "users", user.uid);
  //     const updatedEnrolledClasses = [...(user.enrolledClasses || []), classId];
  //     await updateDoc(userRef, { enrolledClasses: updatedEnrolledClasses });

  //     const groupRef = doc(db, "groups", group.id);
  //     const groupDoc = await getDoc(groupRef);
  //     const currentClassIds = groupDoc.data().classIds || [];
  //     await updateDoc(groupRef, {
  //       classIds: [...currentClassIds, classId],
  //     });

  //     // Update context and session storage
  //     const updatedUser = { ...user, enrolledClasses: updatedEnrolledClasses };
  //     setUser(updatedUser);
  //     sessionStorage.setItem("user", JSON.stringify(updatedUser));

  //     setAddClassModalOpen(false);

  //     // Reset form
  //     setClassImage(null);
  //     setClassPreviewImage(null);
  //     setClassData({
  //       className: "",
  //       classDescription: "",
  //       language: "English",
  //       languageLevel: "Beginner",
  //       availableSpots: 6,
  //       classDuration: 60,
  //       classDateTime: new Date(),
  //       recurrenceType: "One-time",
  //       physicalClass: false,
  //       classAddress: "",
  //     });
  //   } catch (error) {
  //     console.error("Error adding class:", error);
  //   } finally {
  //     setIsCreating(false);
  //   }
  // };

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
          <div
            key={classItem.id}
            className="max-w-md"
            // onClick={() => handleCardClick(classItem)}
            role="button"
            tabIndex={0}
          >
            <div className="flex flex-col items-center justify-center rounded-3xl border border-[#14b82c] bg-white p-1">
              <div className="relative w-full">
                <img
                  src={classItem.imageUrl || "/images/panda.png"}
                  alt={classItem.className}
                  className="h-28 w-full rounded-t-2xl object-cover"
                />
                {classItem.isBammbuu && (
                  <img
                    src="/images/panda.png"
                    alt="Bammbuu+"
                    className="absolute left-1 top-1 h-4 w-16"
                  />
                )}
              </div>

              <div className="w-full space-y-1 rounded-b-3xl bg-[#c3f3c9] p-2">
                <div className="flex items-start justify-between">
                  <span className="rounded-full bg-[#14b82c] px-2 text-xs text-white">
                    {classItem.isPhysical ? "Physical" : "Online"}
                  </span>
                  {classItem.recurrenceType && (
                    <span className="rounded-full bg-[#14b82c] px-2 text-xs text-white">
                      {classItem.recurrenceType}
                    </span>
                  )}
                </div>
                <div className="flex flex-row items-center justify-between">
                  <h2 className="text-md font-bold text-gray-800">
                    {classItem.className}
                  </h2>

                  <span className="rounded-full bg-[#fff885] px-2 text-xs">
                    {classItem.languageLevel}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="flex items-center">
                      <span className="ml-2 text-[#042f0c]">
                        {classItem.groupLearningLanguage}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex w-full flex-col items-center justify-center space-y-2 p-2">
                <div className="flex w-full flex-row items-center justify-between">
                  <div className="flex flex-row items-center justify-center space-x-2">
                    <Clock className="h-3 w-3 text-gray-600" />
                    <span className="text-xs text-[#454545]">
                      {formatTime(classItem.classDateTime)} (
                      {classItem.classDuration} min)
                    </span>
                  </div>
                  <div className="flex flex-row items-center justify-center space-x-2">
                    <Calendar className="h-3 w-3 text-gray-600" />
                    <span className="text-xs text-[#454545]">
                      {formatDate(classItem.classDateTime)}
                    </span>
                  </div>
                </div>
                <div className="flex w-full flex-row items-center justify-between">
                  <div className="flex flex-row items-center justify-center space-x-2">
                    <User className="h-3 w-3 text-gray-600" />
                    <span className="text-xs text-[#454545]">
                      {classItem.teacherName || "TBD"}
                    </span>
                  </div>
                  <div className="flex flex-row items-center justify-center space-x-2">
                    <Users className="h-3 w-3 text-gray-600" />
                    <span className="text-xs text-[#454545]">
                      {classItem.classMemberIds?.length || 0}/
                      {classItem.maxStudents || 100}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Update the renderMembers function to include remove button for admin
  const renderMembers = () => {
    if (members.length === 0) {
      return (
        <div className="flex h-64 items-center justify-center">
          <p className="text-gray-500">No members available</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between border-b border-gray-100 px-4 py-3 hover:bg-gray-50"
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
                  <span className="text-xs text-gray-500">Admin</span>
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
                  Remove
                </button>
              )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="mx-4 w-full max-w-6xl rounded-3xl bg-white p-6">
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
                  <User />
                  <span className="text-sm">
                    {group.groupAdminName} (Admin)
                  </span>
                </div>
                <p className="mb-6 text-gray-600">{group.groupDescription}</p>
                <button className="mb-2 w-full rounded-full border border-gray-300 px-4 py-2 text-black">
                  View Group Chat
                </button>
                <button
                  className="w-full rounded-full border border-red-500 px-4 py-2 text-red-500"
                  onClick={() => setShowLeaveConfirmation(true)}
                >
                  Leave Group
                </button>
              </div>
            </div>

            {/* Main content */}
            <div className="flex-1">
              <div className="mb-6 flex flex-row items-center justify-between">
                <div className="flex gap-2">
                  <button
                    className={`rounded-full px-6 py-2 ${
                      activeTab === "Classes"
                        ? "bg-yellow-400 text-black"
                        : "bg-white text-black"
                    }`}
                    onClick={() => setActiveTab("Classes")}
                  >
                    Classes
                  </button>
                  <button
                    className={`rounded-full px-6 py-2 ${
                      activeTab === "Members"
                        ? "bg-yellow-400 text-black"
                        : "bg-white text-black"
                    }`}
                    onClick={() => setActiveTab("Members")}
                  >
                    Members
                  </button>
                </div>
                <button
                  className="rounded-full border border-[#19291c] bg-[#14b82c] px-6 py-2 text-[#19291c]"
                  onClick={handleAddClassButtonClick}
                >
                  + Create New Class
                </button>
              </div>
              {loading ? (
                <div className="flex h-64 items-center justify-center">
                  <ClipLoader color="#FFB800" size={40} />
                </div>
              ) : (
                <div className="max-h-[600px] overflow-y-auto">
                  {activeTab === "Classes" ? renderClasses() : renderMembers()}
                </div>
              )}
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
                  className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-gray-300 focus:outline-none"
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
                className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-gray-300 focus:outline-none"
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
                  {[
                    "One-time",
                    "Daily",
                    "Daily (Weekdays)",
                    "Weekly",
                    "Monthly",
                  ].map((type) => (
                    <button
                      key={type}
                      onClick={() =>
                        handleClassDataChange("recurrenceType", type)
                      }
                      className={`rounded-full px-4 py-2 text-sm ${
                        classData.recurrenceType === type
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
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Class Location
                </label>
                <div className="mt-1 flex gap-2">
                  <button
                    onClick={() => handleClassDataChange("physicalClass", true)}
                    className={`rounded-full px-4 py-2 text-sm ${
                      classData.physicalClass
                        ? "border border-yellow-500 bg-yellow-400"
                        : "border border-gray-200"
                    }`}
                  >
                    Physical
                  </button>
                  <button
                    onClick={() =>
                      handleClassDataChange("physicalClass", false)
                    }
                    className={`rounded-full px-4 py-2 text-sm ${
                      !classData.physicalClass
                        ? "border border-yellow-500 bg-yellow-400"
                        : "border border-gray-200"
                    }`}
                  >
                    Virtual
                  </button>
                </div>
              </div>
              {classData.physicalClass && (
                <div>
                  {" "}
                  <label className="text-sm font-medium text-gray-700">
                    Class Location
                  </label>
                  <input
                    type="text"
                    placeholder="Enter physical class address"
                    value={classData.classAddress}
                    onChange={(e) =>
                      handleClassDataChange("classAddress", e.target.value)
                    }
                    className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-gray-300 focus:outline-none"
                  />
                </div>
              )}
            </div>

            <div className="flex flex-row items-start justify-between space-x-4">
              {/* Available Slots */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Available Slots
                </label>
                <input
                  type="number"
                  placeholder="Enter slots number"
                  value={classData.availableSpots}
                  onChange={(e) =>
                    handleClassDataChange(
                      "availableSpots",
                      parseInt(e.target.value),
                    )
                  }
                  className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-gray-300 focus:outline-none"
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
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Class Date
                </label>
                <input
                  type="date"
                  value={classData.classDateTime}
                  onChange={(e) =>
                    handleClassDataChange("classDateTime", e.target.value)
                  }
                  className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-gray-300 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Class Starting Time
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
    </>
  );
};

export default GroupDetailsModal;
