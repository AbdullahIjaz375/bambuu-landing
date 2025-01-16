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
Modal.setAppElement("#root");

const GroupDetailsTutor = ({ onClose }) => {
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
          })
        );
        setClasses(classesData.filter(Boolean));
        console.log("class", classes);
      }

      // Debug group members
      console.log("Group data:", group);
      console.log("Member IDs:", group.memberIds);

      // Fetch members
      // Fetch members
      if (group.memberIds && group.memberIds.length > 0) {
        const membersData = await Promise.all(
          group.memberIds.map(async (memberId) => {
            const userDoc = await getDoc(doc(db, "students", memberId));
            // Add detailed logging
            console.log(`Fetching user ${memberId}:`);
            console.log("User document exists:", userDoc.exists());
            console.log("User data:", userDoc.data());

            return userDoc.exists()
              ? { id: userDoc.id, ...userDoc.data() }
              : null;
          })
        );
        console.log("Final members data:", membersData);
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
          `classes/${classId}/image_${Date.now()}_${classImage.name}`
        );
        await uploadBytes(imageRef, classImage);
        imageUrl = await getDownloadURL(imageRef);
      }

      const classTypee = "Group Premium";

      const classAddress =
        classData.classLocation === "Virtual" ? "" : classData.classAddress;

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
        classDateTime: serverTimestamp(),
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
            updatedAt: serverTimestamp(),
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
            console.log(`Class ${classId} not found or has no data`);
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
                    // tutorStudentIds: (memberData.tutorStudentIds || []).filter(
                    //   (id) => id !== classData.adminId
                    // ),
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
                // tutorStudentIds: (adminData.tutorStudentIds || []).filter(
                //   (studentId) => !classData.classMemberIds?.includes(studentId)
                // ),
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
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">No classes available</p>
        </div>
      );
    }

    return (
      <div className="flex flex-wrap items-center p-4 space-x-4">
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
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">No members available</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between px-4 py-3 border border-gray-200 hover:bg-gray-50 rounded-3xl"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={member.photoUrl || "/api/placeholder/40/40"}
                  alt={member.name}
                  className="object-cover rounded-full w-9 h-9"
                />
                {member.id === group.groupAdminId && (
                  <div className="absolute flex items-center justify-center w-4 h-4 bg-yellow-400 rounded-full -top-1 -right-1">
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
                  className="px-3 py-1 text-xs text-red-500 border border-red-500 rounded-full hover:bg-red-50"
                >
                  Remove
                </button>
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
                <h1 className="text-4xl font-semibold">Group Details</h1>
              </div>
            </div>

            <div className="flex flex-1 min-h-0 gap-6">
              {/* Left sidebar */}
              <div
                className={`w-1/4 p-6 rounded-3xl ${
                  group.isPremium ? "bg-[#e6fce8]" : "bg-[#ffffea]"
                }`}
              >
                {" "}
                <div className="flex flex-col items-center justify-between h-full text-center">
                  <div className="flex flex-col items-center text-center">
                    <img
                      src={group.imageUrl}
                      alt={group.groupName}
                      className="w-32 h-32 mb-4 rounded-full"
                    />
                    <h3 className="mb-2 text-2xl font-medium">
                      {group.groupName}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex flex-row items-center space-x-1">
                        <img
                          src={
                            group.language === "English"
                              ? "/svgs/xs-us.svg"
                              : "/svgs/xs-spain.svg"
                          }
                          alt={
                            group.language === "English"
                              ? "US Flag"
                              : "Spain Flag"
                          }
                          className="w-5"
                        />{" "}
                        <span className=" text-md">
                          {group.groupLearningLanguage}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-row items-center mt-2 space-x-40">
                      <div className="flex items-center gap-1 mb-4">
                        <img
                          src={group.groupAdminImageUrl}
                          alt="admin"
                          className="w-5 rounded-full"
                        />{" "}
                        <span className="text-sm text-gray-800">
                          {group.groupAdminName} (Admin)
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mb-4">
                        <img alt="bammbuu" src="/svgs/users.svg" />{" "}
                        <span className="text-sm text-gray-800">2k+</span>
                      </div>
                    </div>
                    <p className="mb-6 text-gray-600">
                      {group.groupDescription}
                    </p>
                  </div>

                  <div className="w-full">
                    {" "}
                    <button
                      className={`w-full px-4 py-2 mb-2 text-black border  rounded-full ${
                        group.isPremium
                          ? "bg-[#bffcc4] border-[#0a0d0b]"
                          : "bg-[#ffffea] border-gray-300"
                      }`}
                    >
                      View Group Chat
                    </button>
                    {user.uid === group.groupAdminId ? (
                      <>
                        <button
                          className="w-full px-4 py-2 mb-2 text-black bg-white border border-black rounded-full"
                          onClick={() => navigate(`/editGroupTutor/${groupId}`)}
                        >
                          Edit Group Details
                        </button>
                        <button
                          className="w-full px-4 py-2 text-red-500 border border-red-500 rounded-full"
                          onClick={() => setShowDeleteConfirmation(true)}
                        >
                          Delete Group
                        </button>
                      </>
                    ) : (
                      <button
                        className="w-full px-4 py-2 text-red-500 border border-red-500 rounded-full"
                        onClick={() => setShowLeaveConfirmation(true)}
                      >
                        Leave Group
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Main content */}
              <div className="flex flex-col flex-1 min-h-0">
                {/* Previous code remains the same until the buttons section */}
                <div className="flex flex-row items-center justify-between mb-6">
                  <div className="flex justify-center">
                    <div className="inline-flex bg-gray-100 border border-gray-300 rounded-full">
                      <button
                        onClick={() => setActiveTab("Classes")}
                        className={`px-6 py-2 rounded-full text-[#042F0C] text-md font-medium transition-colors
            ${
              activeTab === "Classes"
                ? "bg-[#FFBF00] border border-[#042F0C]"
                : "bg-transparent"
            }`}
                      >
                        Classes
                      </button>
                      <button
                        onClick={() => setActiveTab("Members")}
                        className={`px-6 py-2 rounded-full text-[#042F0C] text-md font-medium transition-colors
            ${
              activeTab === "Members"
                ? "bg-[#FFBF00] border border-[#042F0C]"
                : "bg-transparent"
            }`}
                      >
                        Members
                      </button>
                    </div>
                  </div>

                  {user.uid === group.groupAdminId && (
                    <button
                      className="bg-[#14b82c] border border-[#19291c] text-[#19291c] px-6 py-2 rounded-full"
                      onClick={handleAddClassButtonClick}
                    >
                      + Create New Class
                    </button>
                  )}
                </div>
                {loading ? (
                  <div className="flex items-center justify-center flex-1">
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
        className="w-[1000px] p-8 mx-auto bg-white rounded-3xl outline-none font-urbanist"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      >
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-medium">Create New Class</h2>
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
                  Class name
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
                  Class Language
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
                    English
                  </button>
                  <button
                    onClick={() => handleClassDataChange("language", "Spanish")}
                    className={`px-4 py-2 rounded-full text-sm ${
                      classData.language === "Spanish"
                        ? "bg-yellow-400 border border-yellow-500"
                        : "border border-gray-200"
                    }`}
                  >
                    Spanish
                  </button>
                  <button
                    onClick={() =>
                      handleClassDataChange(
                        "language",
                        "English-Spanish Exchange"
                      )
                    }
                    className={`px-4 py-2 rounded-full text-sm ${
                      classData.language === "English-Spanish Exchange"
                        ? "bg-yellow-400 border border-yellow-500"
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
                className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-gray-300"
              />
            </div>
            <div className="flex flex-row items-start justify-between space-x-4">
              {/* Class Level */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Class Level
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
                  Class Type
                </label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {["One-time", "Daily", "Weekly", "Monthly"].map((type) => (
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
                    Class Location
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
                      Physical
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
                  Available Slots
                </label>
                <input
                  type="number"
                  placeholder="Enter slots number"
                  value={classData.availableSpots}
                  onChange={(e) =>
                    handleClassDataChange(
                      "availableSpots",
                      parseInt(e.target.value)
                    )
                  }
                  className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-gray-300"
                />
              </div>

              {/* Class Duration */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Class Duration
                </label>
                <div className="flex gap-2 mt-1">
                  {[30, 60, 90, 120].map((duration) => (
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
                  className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-gray-300"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Class Starting Time
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
                Cancel
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
                {isCreating ? "Creating..." : "Create Class"}
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
          <h2 className="mb-4 text-xl font-semibold">
            Are you sure you want to leave this group?
          </h2>
          <div className="flex flex-row gap-2">
            <button
              className="w-full py-2 font-medium border border-gray-300 rounded-full hover:bg-gray-50"
              onClick={() => setShowLeaveConfirmation(false)}
            >
              No, Cancel
            </button>
            <button
              className="w-full py-2 font-medium text-black bg-[#ff4d4d] rounded-full hover:bg-[#ff3333] border border-[#8b0000]"
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
          <h2 className="mb-4 text-xl font-semibold">
            Remove {selectedUser?.name} from group?
          </h2>
          <p className="mb-6 text-gray-600">
            This action cannot be undone. The user will need to request to join
            again.
          </p>
          <div className="flex flex-row gap-2">
            <button
              className="w-full py-2 font-medium border border-gray-300 rounded-full hover:bg-gray-50"
              onClick={() => setShowRemoveConfirmation(false)}
            >
              Cancel
            </button>
            <button
              className="w-full py-2 font-medium text-black bg-[#ff4d4d] rounded-full hover:bg-[#ff3333] border border-[#8b0000]"
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
          <h2 className="mb-4 text-xl font-semibold">
            Are you sure you want to delete this group?
          </h2>
          <div className="flex flex-row gap-2">
            <button
              className="w-full py-2 font-medium border border-gray-300 rounded-full hover:bg-gray-50"
              onClick={() => setShowDeleteConfirmation(false)}
            >
              No, Cancel
            </button>
            <button
              className="w-full py-2 font-medium text-black bg-[#ff4d4d] rounded-full hover:bg-[#ff3333] border border-[#8b0000]"
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
