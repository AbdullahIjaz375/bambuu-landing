import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, User, Clock, Calendar, MapPin, Users } from "lucide-react";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { ClipLoader } from "react-spinners";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Modal from "react-modal";
import { updateDoc } from "firebase/firestore";
import { Timestamp } from "firebase/firestore"; // Import Timestamp
import ClassInfoCard from "../../components/ClassInfoCard";
import EditClassModal from "../../components/EditClassModal";
import EmptyState from "../../components/EmptyState";
import { useTranslation } from "react-i18next";

Modal.setAppElement("#root");

const TimeRestrictedJoinButton = ({
  classDateTime,
  classDuration = 60,
  navigate,
  classId,
  location,
}) => {
  const [isButtonVisible, setIsButtonVisible] = useState(false);
  const [timeStatus, setTimeStatus] = useState("");

  useEffect(() => {
    const checkTime = () => {
      const now = new Date().getTime();
      const classTime = new Date(classDateTime.seconds * 1000).getTime();
      const classEndTime = classTime + classDuration * 60 * 1000; // Convert minutes to milliseconds

      // 5 minutes in milliseconds
      const fiveMinutes = 5 * 60 * 1000;

      // Time windows
      const joinWindowStart = classTime - fiveMinutes;
      const joinWindowEnd = classEndTime + fiveMinutes;

      setIsButtonVisible(now >= joinWindowStart && now <= joinWindowEnd);

      // Set status for potential UI feedback
      if (now < joinWindowStart) {
        setTimeStatus("upcoming");
      } else if (now > joinWindowEnd) {
        setTimeStatus("ended");
      } else {
        setTimeStatus("active");
      }
    };

    // Initial check
    checkTime();

    // Update every minute
    const interval = setInterval(checkTime, 60000);

    return () => clearInterval(interval);
  }, [classDateTime, classDuration]);

  // const handleJoinClass = () => {
  //   navigate(`/call/${classId}`);
  // };
  const handleJoinClass = () => {
    navigate(`/call`, { state: { classId } });
  };

  if (location?.toLowerCase() === "virtual" && isButtonVisible) {
    return (
      <button
        className="w-full px-4 py-2 text-black bg-[#ffbf00] border border-black rounded-full hover:bg-[#ffbf00]"
        onClick={handleJoinClass}
      >
        Join Class
      </button>
    );
  }

  if (location?.toLowerCase() === "physical" && isButtonVisible) {
    return (
      <button className="w-full px-4 py-2 text-black bg-[#ffbf00] border border-black rounded-full hover:bg-[#ffbf00]">
        Class in progress
      </button>
    );
  }

  // If not within time window or invalid location, return empty fragment
  return <></>;
};

const modalStyles = {
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    position: "relative",
    top: "auto",
    left: "auto",
    right: "auto",
    bottom: "auto",
    width: "100%",
    maxWidth: "400px",
    padding: "24px",
    border: "none",
    borderRadius: "50px",
    backgroundColor: "white",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },
};

const AddSlotsModal = ({ isOpen, onClose, classData, setClassData }) => {
  const [numClasses, setNumClasses] = useState("");

  const calculateNextSlots = (currentSlots, numToAdd, recurrenceType) => {
    if (!numToAdd || numToAdd <= 0) return currentSlots;

    const updatedSlots = [...currentSlots];
    const lastSlot = updatedSlots[updatedSlots.length - 1];
    const lastSlotDate = new Date(lastSlot.seconds * 1000); // Convert Firestore timestamp to Date

    for (let i = 1; i <= numToAdd; i++) {
      const nextSlot = new Date(lastSlotDate); // Clone lastSlotDate
      if (recurrenceType === "Daily") {
        nextSlot.setDate(lastSlotDate.getDate() + i);
      } else if (recurrenceType === "Weekly") {
        nextSlot.setDate(lastSlotDate.getDate() + i * 7);
      } else if (recurrenceType === "Monthly") {
        nextSlot.setMonth(lastSlotDate.getMonth() + i);
      }

      // Create Firestore Timestamp object
      updatedSlots.push(Timestamp.fromDate(nextSlot));
    }

    return updatedSlots;
  };

  const handleDone = async () => {
    if (!numClasses || isNaN(numClasses) || numClasses <= 0) {
      alert("Please enter a valid number of slots.");
      return;
    }

    // Ensure classData and recurringSlots exist
    if (!classData || !classData.recurringSlots) {
      alert("Recurring slots data is not available.");
      return;
    }

    // Calculate the new slots
    const updatedSlots = calculateNextSlots(
      classData.recurringSlots,
      parseInt(numClasses),
      classData.selectedRecurrenceType // Assuming this is part of your classData
    );

    console.log(updatedSlots);

    // Update local state
    setClassData((prevData) => ({
      ...prevData,
      recurringSlots: updatedSlots,
    }));

    // Update Firebase
    try {
      const classRef = doc(db, "classes", classData.id); // Use the class ID to reference the document
      await updateDoc(classRef, { recurringSlots: updatedSlots });
      console.log("Slots updated successfully in Firebase.");
    } catch (error) {
      console.error("Error updating slots in Firebase:", error);
      alert("Failed to update slots. Please try again.");
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={modalStyles}
      contentLabel="Add Additional Class Slots"
    >
      <div className="space-y-6 font-urbanist">
        <h2 className="text-lg font-medium text-gray-700">
          Additional class slots
        </h2>

        <div className="space-y-4">
          <input
            type="number"
            value={numClasses}
            onChange={(e) => setNumClasses(e.target.value)}
            placeholder="Enter number of classes you want to add"
            className="w-full px-4 py-3 text-gray-600 border border-gray-200 rounded-2xl focus:outline-none focus:border-gray-400"
          />
        </div>

        <button
          onClick={handleDone}
          className="w-full py-2 text-[#042F0C] bg-[#14B82C] rounded-full hover:bg-[#30a842] border border-[#042F0C]"
        >
          Done
        </button>
      </div>
    </Modal>
  );
};

const ClassDetailsUser = ({ onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Members");
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classData, setClassData] = useState(null);
  const [error, setError] = useState(null);
  const { classId } = useParams();
  const { t } = useTranslation();

  const fetchClass = async () => {
    if (!classId) {
      setError("No class ID provided");
      setLoading(false);
      return;
    }

    try {
      const classDoc = await getDoc(doc(db, "classes", classId));
      if (!classDoc.exists()) {
        setError("Class not found");
        setLoading(false);
        return;
      }
      setClassData({ id: classDoc.id, ...classDoc.data() });
    } catch (err) {
      console.error("Error fetching class:", err);
      setError("Failed to fetch class details");
    }
    setLoading(false);
  };

  const fetchMembers = async () => {
    if (!classData?.classMemberIds) return;

    try {
      const membersData = await Promise.all(
        classData.classMemberIds.map(async (memberId) => {
          const userDoc = await getDoc(doc(db, "students", memberId));
          return userDoc.exists()
            ? { id: userDoc.id, ...userDoc.data() }
            : null;
        })
      );
      setMembers(membersData.filter(Boolean));
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  };

  useEffect(() => {
    fetchClass();
  }, [classId]);

  useEffect(() => {
    if (classData) {
      fetchMembers();
    }
  }, [classData]);

  //-----------------------------getting admin details------------------------------------------//

  const [groupTutor, setGroupTutor] = useState(null);

  const fetchClassAdmin = async () => {
    if (!classData?.adminId) return;

    try {
      // Check in tutors collection
      const tutorDoc = await getDoc(doc(db, "tutors", classData.adminId));
      if (tutorDoc.exists()) {
        setGroupTutor({ id: tutorDoc.id, ...tutorDoc.data() });
        return;
      }

      // If not found in tutors, check students collection
      const studentDoc = await getDoc(doc(db, "students", classData.adminId));
      if (studentDoc.exists()) {
        setGroupTutor({ id: studentDoc.id, ...studentDoc.data() });
      }
    } catch (error) {
      console.error("Error fetching group admin:", error);
    }
  };

  useEffect(() => {
    if (classData) {
      fetchClassAdmin();
      console.log("admin:", groupTutor);
    }
  }, [classData]);

  //-------------------------------------------------Deleting Class---------------------------------------//
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClass = async () => {
    setIsDeleting(true);
    try {
      const userType = JSON.parse(sessionStorage.getItem("user")).userType;
      const userCollection = userType === "tutor" ? "tutors" : "students";

      // 1. Update students
      if (classData.classMemberIds?.length > 0) {
        await Promise.all(
          classData.classMemberIds.map(async (memberId) => {
            const studentRef = doc(db, "students", memberId);
            const studentDoc = await getDoc(studentRef);
            const studentData = studentDoc.data();

            if (studentData) {
              await updateDoc(studentRef, {
                enrolledClasses: (studentData.enrolledClasses || []).filter(
                  (id) => id !== classId
                ),
              });
            }
          })
        );
      }

      // 2. Update group
      if (classData.groupId) {
        const groupRef = doc(db, "groups", classData.groupId);
        const groupDoc = await getDoc(groupRef);

        if (groupDoc.exists()) {
          await updateDoc(groupRef, {
            classIds: (groupDoc.data().classIds || []).filter(
              (id) => id !== classId
            ),
          });
        }
      }

      // 3. Update admin
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

      // 4. Update session storage
      const updatedUser = JSON.parse(sessionStorage.getItem("user"));
      if (userType === "tutor") {
        updatedUser.tutorOfClasses = (updatedUser.tutorOfClasses || []).filter(
          (id) => id !== classId
        );
        updatedUser.enrolledClasses = (
          updatedUser.enrolledClasses || []
        ).filter((id) => id !== classId);
        updatedUser.tutorStudentIds = (
          updatedUser.tutorStudentIds || []
        ).filter((studentId) => !classData.classMemberIds?.includes(studentId));
      } else {
        updatedUser.adminOfClasses = (updatedUser.adminOfClasses || []).filter(
          (id) => id !== classId
        );
        updatedUser.enrolledClasses = (
          updatedUser.enrolledClasses || []
        ).filter((id) => id !== classId);
      }
      sessionStorage.setItem("user", JSON.stringify(updatedUser));

      // 5. Delete class document
      await deleteDoc(doc(db, "classes", classId));

      navigate(-1);
    } catch (error) {
      console.error("Error deleting class:", error);
      alert("Failed to delete class. Please try again.");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
    }
  };

  //------------------------------------------------- Leaving Class---------------------------------------//
  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleLeaveClass = async () => {
    setIsLeaving(true);
    try {
      // 1. Remove user from classMemberIds in the class document
      const updatedMembers = classData.classMemberIds.filter(
        (id) => id !== user.uid
      );
      await updateDoc(doc(db, "classes", classId), {
        classMemberIds: updatedMembers,
      });

      // 2. Remove class from student's enrolledClasses
      const studentRef = doc(db, "students", user.uid);
      const studentDoc = await getDoc(studentRef);
      const studentData = studentDoc.data();

      if (studentData) {
        await updateDoc(studentRef, {
          enrolledClasses: studentData.enrolledClasses.filter(
            (id) => id !== classId
          ),
        });
      }

      // 3. Update session storage
      const updatedUser = JSON.parse(sessionStorage.getItem("user"));
      updatedUser.enrolledClasses = (updatedUser.enrolledClasses || []).filter(
        (id) => id !== classId
      );
      sessionStorage.setItem("user", JSON.stringify(updatedUser));

      // Navigate back after successful leave
      navigate(-1);
    } catch (error) {
      console.error("Error leaving class:", error);
      alert("Failed to leave class. Please try again.");
    } finally {
      setIsLeaving(false);
      setShowLeaveConfirmation(false);
    }
  };

  //-------------------------------------------------edit class----------------------------------------//

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  //---------------------------------------------------------------------------------------------------//
  const getClassTypeColor = (type) => {
    switch (type) {
      case "Group Premium":
        return "bg-[#e6fce8]";
      case "Individual Premium":
        return "bg-[#e6fce8]";
      default:
        return "bg-[#ffffea]";
    }
  };

  const renderMembers = () => {
    if (members.length === 0) {
      return (
        <div className="flex items-center justify-center h-96">
          <EmptyState message="No members available" />
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
                {member.id === classData.adminId && (
                  <div className="absolute flex items-center justify-center w-4 h-4 bg-yellow-400 rounded-full -top-1 -right-1">
                    <span className="text-xs text-black">★</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">
                  {member.name}
                </span>
                {member.id === classData.adminId && (
                  <span className="text-xs text-gray-500">Teacher</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  //----------------------------------------class slots----------------------------------------//

  const [isModalOpen, setIsModalOpen] = useState(false);

  const getCurrentStatus = (timestamp) => {
    const now = new Date();
    const slotDate = new Date(timestamp.seconds * 1000);

    if (slotDate < now) {
      return "completed";
    } else if (
      slotDate.getDate() === now.getDate() &&
      slotDate.getMonth() === now.getMonth() &&
      slotDate.getFullYear() === now.getFullYear()
    ) {
      return "current";
    } else {
      return "upcoming";
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp.seconds * 1000);
    return new Intl.DateTimeFormat("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return (
          <span className="px-2 py-1 text-sm text-green-600 bg-green-100 rounded-full">
            Completed
          </span>
        );
      case "current":
        return (
          <span className="px-2 py-1 text-sm text-green-600 bg-green-100 rounded-full">
            Current Class
          </span>
        );
      case "upcoming":
        return (
          <span className="px-2 py-1 text-sm text-gray-600 bg-gray-100 rounded-full">
            Upcoming
          </span>
        );
      default:
        return null;
    }
  };

  const isClassOngoing = () => {
    if (!classData?.classDateTime) return false;
    const now = new Date();
    const classStart = new Date(classData?.classDateTime.seconds * 1000);
    const classEnd = new Date(
      classStart.getTime() + classData?.classDuration * 60 * 1000
    );
    return now >= classStart && now <= classEnd;
  };

  //---------------------------------------------video class start---------------------------------------------//

  const [showVideoCall, setShowVideoCall] = useState(false);

  const handleJoinClass = () => {
    navigate(`/call/${classId}`);
  };
  //-----------------------------------------------------------------------------------------------------------//

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <ClipLoader color="#FFB800" size={40} />
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

  if (!classData) return null;

  return (
    <>
      <div className="flex min-h-screen">
        <div className="flex flex-1 m-2 border sm:m-4 md:m-6 rounded-3xl">
          <div className="flex flex-col w-full p-3 mx-2 bg-white sm:p-4 md:p-6 sm:mx-4 rounded-3xl">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b md:mb-6">
              <div className="flex items-center gap-2 md:gap-4">
                <button
                  className="p-2 bg-gray-100 rounded-full md:p-3"
                  onClick={() => navigate(-1)}
                >
                  <ArrowLeft size={24} />
                </button>
                <h1 className="text-2xl font-semibold md:text-4xl">
                  {t("class-details.title")}
                </h1>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-col flex-1 min-h-0 gap-4 lg:flex-row md:gap-6">
              {/* Left Panel */}
              <div
                className={`w-full lg:w-[27%] p-4 md:p-6 rounded-3xl ${getClassTypeColor(
                  classData.classType
                )}`}
              >
                <div className="flex flex-col items-center justify-between h-full text-center">
                  {/* Class Info */}
                  <div className="flex flex-col items-center text-center">
                    <img
                      src={classData.imageUrl}
                      alt={classData.className}
                      className="w-24 h-24 mb-4 rounded-full md:w-32 md:h-32"
                    />
                    <h3 className="mb-2 text-xl font-medium md:text-3xl">
                      {classData.className}
                    </h3>

                    {/* Language Info */}
                    <div className="flex items-center gap-4 mb-2">
                      <div className="flex flex-row items-center space-x-1">
                        <img
                          src={
                            classData.language === "English"
                              ? "/svgs/xs-us.svg"
                              : classData.language === "Spanish"
                              ? "/svgs/xs-spain.svg"
                              : "/svgs/eng-spanish-xs.svg"
                          }
                          alt={
                            classData.language === "English"
                              ? "US Flag"
                              : "Spain Flag"
                          }
                          className="w-5"
                        />
                        <span className="text-sm md:text-md">
                          {classData.language}
                        </span>
                      </div>
                      <span className="px-3 py-1 text-sm bg-yellow-200 rounded-full md:text-md">
                        {classData.languageLevel}
                      </span>
                      {isClassOngoing() && (
                        <span className=" px-2 sm:px-3 py-1 text-xs sm:text-sm bg-[#B9F9C2BF]/75 backdrop-blur-sm rounded-full ">
                          Ongoing
                        </span>
                      )}
                    </div>

                    {/* Class Details Grid */}

                    {classData.classType === "Individual Premium" ? (
                      <>
                        {" "}
                        <div className="flex flex-col w-full mt-4 space-y-4">
                          <div className="grid grid-cols-1 gap-28 sm:grid-cols-2 lg:grid-cols-2">
                            <div className="flex items-center justify-center gap-1 sm:justify-start">
                              <img alt="time" src="/svgs/clock.svg" />
                              <span className="text-xs sm:text-sm">
                                {new Date(
                                  classData.classDateTime.seconds * 1000
                                ).toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                })}
                              </span>
                            </div>
                            <div className="flex items-center justify-center gap-1 sm:justify-start">
                              <img alt="date" src="/svgs/calendar.svg" />
                              <span className="text-xs sm:text-sm">
                                {new Date(
                                  classData.classDateTime.seconds * 1000
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col w-full mt-4 space-y-4">
                        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                          <div className="flex items-center justify-center gap-1 sm:justify-start">
                            <img alt="time" src="/svgs/clock.svg" />
                            <span className="text-xs sm:text-sm">
                              {new Date(
                                classData.classDateTime.seconds * 1000
                              ).toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </span>
                          </div>
                          <div className="flex items-center justify-center gap-1 sm:justify-start">
                            <img alt="date" src="/svgs/calendar.svg" />
                            <span className="text-xs sm:text-sm">
                              {new Date(
                                classData.classDateTime.seconds * 1000
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-center gap-1 sm:justify-start">
                            <img alt="participants" src="/svgs/users.svg" />
                            <span className="text-xs sm:text-sm">
                              {classData.classType.includes("Premium")
                                ? "2k+"
                                : `${classData.classMemberIds.length}/${classData.availableSpots}`}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="flex items-center justify-center gap-1 sm:justify-start">
                            <img
                              alt="recurrence"
                              src="/svgs/repeate-music.svg"
                            />
                            <span className="text-xs sm:text-sm">
                              {classData.classType === "Individual Premium"
                                ? classData.selectedRecurrenceType || "None"
                                : classData.recurrenceTypes?.length > 0
                                ? classData.recurrenceTypes.join(", ")
                                : "None"}
                            </span>
                          </div>
                          <div className="flex items-center justify-center gap-1 sm:justify-start">
                            <img alt="location" src="/svgs/location.svg" />
                            <span className="text-xs sm:text-sm">
                              {classData.classLocation}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <p className="mt-4 mb-6 text-sm text-gray-600 md:text-base">
                      {classData.classDescription}
                    </p>
                  </div>

                  {/* Bottom Actions */}
                  <div className="w-full space-y-3">
                    <div className="space-y-1">
                      <h1 className="text-lg font-semibold md:text-xl">
                        {classData.classType.includes("Premium")
                          ? "Instructor"
                          : "Group"}
                      </h1>
                      <ClassInfoCard
                        classData={classData}
                        groupTutor={groupTutor}
                      />
                    </div>

                    {/* <button
                      className="w-full px-4 py-2 text-black bg-[#ffbf00] border border-black rounded-full hover:bg-[#ffbf00]"
                      onClick={handleJoinClass}
                    >
                      Join Class
                    </button> */}

                    <TimeRestrictedJoinButton
                      classDateTime={classData.classDateTime}
                      classDuration={classData.classDuration || 60} // Use class duration from data or default to 60 minutes
                      navigate={navigate}
                      classId={classId}
                      location={classData.classLocation}
                    />

                    {user.uid === classData.adminId ? (
                      <>
                        <button
                          className="w-full px-4 py-2 text-black bg-white border border-black rounded-full"
                          onClick={() => setIsEditModalOpen(true)}
                        >
                          {t("class-details.buttons.edit")}
                        </button>
                        <button
                          className="w-full px-4 py-2 text-red-500 bg-white border border-red-500 rounded-full"
                          onClick={() => setShowDeleteConfirmation(true)}
                        >
                          {t("class-details.buttons.delete")}
                        </button>
                      </>
                    ) : (
                      <button
                        className="w-full px-4 py-2 text-red-500 border border-red-500 rounded-full"
                        onClick={() => setShowLeaveConfirmation(true)}
                      >
                        {t("class-details.buttons.leave")}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Panel */}
              <div className="flex flex-col flex-1 min-h-0">
                {classData.classType === "Individual Premium" ? (
                  <div className="w-full space-y-4 md:space-y-6">
                    <div className="w-full space-y-4">
                      <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                        <h2 className="text-lg font-semibold md:text-xl">
                          {t("class-details.slots.title")}
                        </h2>
                        <button
                          className="px-4 py-2 text-sm bg-yellow-200 rounded-full hover:bg-yellow-300 border border-[#042F0C]"
                          onClick={() => setIsModalOpen(true)}
                        >
                          {t("class-details.slots.add-button")}
                        </button>
                      </div>

                      <div className="space-y-3 overflow-y-auto">
                        {classData.recurringSlots.map((slot, index) => {
                          const status = getCurrentStatus(slot);
                          return (
                            <div
                              key={index}
                              className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:px-4 border rounded-2xl sm:rounded-full ${
                                status === "current"
                                  ? "border-green-500"
                                  : "border-gray-200"
                              }`}
                            >
                              <div className="flex items-center gap-2 md:gap-4">
                                <span className="text-base font-medium text-gray-500 md:text-lg">
                                  {String(index + 1).padStart(2, "0")}.
                                </span>
                                <span className="text-sm font-medium md:text-lg">
                                  {formatDate(slot)}
                                </span>
                              </div>
                              <div className="mt-2 sm:mt-0">
                                {getStatusBadge(status)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col items-start justify-between mb-4 sm:flex-row sm:items-center md:mb-6">
                      <button
                        className="px-4 py-2 text-black bg-yellow-400 rounded-full"
                        onClick={() => setActiveTab("Members")}
                      >
                        {t("class-details.members.count", {
                          count: members.length,
                        })}
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {members.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between px-3 py-2 border border-gray-200 md:px-4 md:py-3 hover:bg-gray-50 rounded-2xl md:rounded-3xl"
                          >
                            <div className="flex items-center gap-2 md:gap-3">
                              <div className="relative">
                                <img
                                  src={
                                    member.photoUrl || "/api/placeholder/40/40"
                                  }
                                  alt={member.name}
                                  className="object-cover w-8 h-8 rounded-full md:w-9 md:h-9"
                                />
                                {member.id === classData.adminId && (
                                  <div className="absolute flex items-center justify-center w-4 h-4 bg-yellow-400 rounded-full -top-1 -right-1">
                                    <span className="text-xs text-black">
                                      ★
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">
                                  {member.name}
                                </span>
                                {member.id === classData.adminId && (
                                  <span className="text-xs text-gray-500">
                                    {t("class-details.labels.teacher")}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <AddSlotsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          classData={classData}
          setClassData={setClassData}
        />
        {/* Delete Confirmation Modal */}
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
              {t("class-details.modals.delete.title")}
            </h2>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                className="w-full py-2 font-medium border border-gray-300 rounded-full hover:bg-gray-50"
                onClick={() => setShowDeleteConfirmation(false)}
              >
                {t("class-details.modals.delete.cancel")}
              </button>
              <button
                className="w-full py-2 font-medium text-black bg-[#ff4d4d] rounded-full hover:bg-[#ff3333] border border-[#8b0000]"
                onClick={handleDeleteClass}
                disabled={isDeleting}
              >
                {isDeleting
                  ? t("class-details.modals.delete.loading")
                  : t("class-details.modals.delete.confirm")}
              </button>
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
              {t("class-details.modals.leave.title")}
            </h2>
            <div className="flex flex-row gap-2">
              <button
                className="w-full py-2 font-medium border border-gray-300 rounded-full hover:bg-gray-50"
                onClick={() => setShowLeaveConfirmation(false)}
              >
                {t("class-details.modals.leave.cancel")}
              </button>
              <button
                className="w-full py-2 font-medium text-black bg-[#ff4d4d] rounded-full hover:bg-[#ff3333] border border-[#8b0000]"
                onClick={handleLeaveClass}
                disabled={isLeaving}
              >
                {isLeaving
                  ? t("class-details.modals.leave.loading")
                  : t("class-details.modals.leave.confirm")}
              </button>
            </div>
          </div>
        </Modal>
        <EditClassModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          classData={classData}
          setClassData={setClassData}
        />{" "}
      </div>
    </>
  );
};

export default ClassDetailsUser;
