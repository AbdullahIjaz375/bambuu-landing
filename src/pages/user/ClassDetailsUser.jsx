import React, { useState, useEffect, useRef, useContext } from "react";
import { ArrowLeft, User, Clock, Calendar, MapPin, Users } from "lucide-react";
import { doc, getDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { ClipLoader } from "react-spinners";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Modal from "react-modal";
import { Timestamp } from "firebase/firestore";
import ClassInfoCard from "../../components/ClassInfoCard";
import EditClassModal from "../../components/EditClassModal";
import EmptyState from "../../components/EmptyState";
import { ClassContext } from "../../context/ClassContext";
import { useTranslation } from "react-i18next";
import PlansModal from "../../components/PlansModal";
import { useClassBooking } from "../../hooks/useClassBooking";
import { toast } from "react-toastify";
import UserAvatar from "../../utils/getAvatar";
import { checkAccess } from "../../utils/accessControl";
import ShowDescription from "../../components/ShowDescription";
Modal.setAppElement("#root");

const TimeRestrictedJoinButton = ({
  classDateTime,
  classDuration = 60,
  navigate,
  classId,
  location,
  classType,
}) => {
  const [isButtonVisible, setIsButtonVisible] = useState(false);
  const [timeStatus, setTimeStatus] = useState("");
  const { setSelectedClassId } = useContext(ClassContext);
  const { user } = useAuth();

  useEffect(() => {
    const checkTime = () => {
      const now = new Date().getTime();
      const classTime = new Date(classDateTime.seconds * 1000).getTime();
      const classEndTime = classTime + classDuration * 60 * 1000;
      const fiveMinutes = 5 * 60 * 1000;
      const joinWindowStart = classTime - fiveMinutes;
      const joinWindowEnd = classEndTime + fiveMinutes;
      setIsButtonVisible(now >= joinWindowStart && now <= joinWindowEnd);
      if (now < joinWindowStart) {
        setTimeStatus("upcoming");
      } else if (now > joinWindowEnd) {
        setTimeStatus("ended");
      } else {
        setTimeStatus("active");
      }
    };
    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, [classDateTime, classDuration]);

  const handleButtonClick = () => {
    const accessCheck = checkAccess(user, "premium-class", classType);
    if (!accessCheck.hasAccess) {
      toast.error(accessCheck.reason);
      navigate("/subscriptions");
      return;
    }
    setSelectedClassId(classId);
    const callUrl = `/call`;
    window.open(callUrl, "_blank");
  };

  if (location?.toLowerCase() === "virtual" && isButtonVisible) {
    const hasAccess =
      user.freeAccess ||
      user.credits > 0 ||
      (user.subscriptions &&
        user.subscriptions.some((sub) => sub.type !== "None"));
    const buttonStyle = hasAccess
      ? "bg-[#ffbf00] hover:bg-[#ffbf00]"
      : "bg-[#ffb3b3] hover:bg-[#ff9999]";
    return (
      <button
        className={`w-full px-4 py-2 text-black ${buttonStyle} rounded-full border border-black`}
        onClick={handleButtonClick}
      >
        {hasAccess ? "Join Class" : "Subscribe to Join"}
      </button>
    );
  }
  if (location?.toLowerCase() === "physical" && isButtonVisible) {
    return (
      <button className="w-full rounded-full border border-black bg-[#ffbf00] px-4 py-2 text-black hover:bg-[#ffbf00]">
        Class in progress
      </button>
    );
  }
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
  const [error, setError] = useState(null);
  const { user, setUser } = useAuth();
  const [isPlansModalOpen, setIsPlansModalOpen] = useState(false);
  const { handleClassBooking, isProcessing } = useClassBooking();

  const isWeekday = (date) => {
    const day = date.getDay();
    return day !== 0 && day !== 6;
  };

  const getNextWeekday = (date) => {
    const next = new Date(date);
    do {
      next.setDate(next.getDate() + 1);
    } while (!isWeekday(next));
    return next;
  };

  const calculateNextSlots = (
    currentSlots,
    numToAdd,
    recurrenceType,
    useCredits,
  ) => {
    if (!numToAdd || numToAdd <= 0) return currentSlots;
    const updatedSlots = [...currentSlots];
    const lastSlot = updatedSlots[updatedSlots.length - 1];
    const lastSlotDate = new Date(lastSlot.createdAt.seconds * 1000);
    for (let i = 1; i <= numToAdd; i++) {
      const nextSlot = new Date(lastSlotDate);
      switch (recurrenceType) {
        case "Daily":
          nextSlot.setDate(lastSlotDate.getDate() + i);
          break;
        case "Daily (Weekdays)":
          nextSlot.setDate(lastSlotDate.getDate() + i);
          if (!isWeekday(nextSlot)) {
            i++;
            continue;
          }
          break;
        case "Weekly":
          nextSlot.setDate(lastSlotDate.getDate() + i * 7);
          break;
        case "Monthly":
          nextSlot.setMonth(lastSlotDate.getMonth() + i);
          break;
        default:
          continue;
      }
      const newSlot = {
        bookingMethod: useCredits ? "Credits" : "Subscription",
        createdAt: Timestamp.fromDate(nextSlot),
      };
      updatedSlots.push(newSlot);
    }
    return updatedSlots;
  };

  const updateUserSessionStorage = (newCredits) => {
    const storedUser = JSON.parse(sessionStorage.getItem("user"));
    if (storedUser) {
      const updatedUser = {
        ...storedUser,
        credits: newCredits,
      };
      sessionStorage.setItem("user", JSON.stringify(updatedUser));
    }
  };

  const handleAddSlots = async (useCredits) => {
    try {
      const numToAdd = parseInt(numClasses);
      const updatedSlots = calculateNextSlots(
        classData.recurringSlots,
        numToAdd,
        classData.selectedRecurrenceType,
        useCredits,
      );
      const classRef = doc(db, "classes", classData.id);
      await updateDoc(classRef, { recurringSlots: updatedSlots });
      if (useCredits) {
        const userRef = doc(db, "students", user.uid);
        const newCredits = user.credits - numToAdd;
        await updateDoc(userRef, { credits: newCredits });
        setUser({ ...user, credits: newCredits });
        updateUserSessionStorage(newCredits);
      }
      setClassData((prevData) => ({
        ...prevData,
        recurringSlots: updatedSlots,
      }));
      return true;
    } catch (error) {
      console.error("Error adding slots:", error);
      return false;
    }
  };

  const handleConfirm = async () => {
    if (!numClasses || isNaN(numClasses) || numClasses <= 0) {
      setError("Please enter a valid number of slots.");
      return;
    }
    const { success, method } = await handleClassBooking(
      user,
      classData.classType,
      user.subscriptions,
      user.credits,
      () => {
        onClose();
        toast.success("Successfully added slots!");
      },
      (errorMessage) => {
        if (
          errorMessage.includes("subscription") ||
          errorMessage.includes("credits")
        ) {
          setIsPlansModalOpen(true);
        }
        setError(errorMessage);
      },
      (useCredits) => handleAddSlots(useCredits),
    );
  };

  return (
    <>
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
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-gray-600 focus:border-gray-400 focus:outline-none"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <button
            onClick={handleConfirm}
            disabled={isProcessing}
            className="w-full rounded-full border border-[#042F0C] bg-[#14B82C] py-2 text-[#042F0C] hover:bg-[#30a842]"
          >
            {isProcessing ? "Processing..." : "Done"}
          </button>
        </div>
      </Modal>
      <PlansModal
        isOpen={isPlansModalOpen}
        onClose={() => setIsPlansModalOpen(false)}
      />
    </>
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
  const { setSelectedClassId } = useContext(ClassContext);

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
        }),
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

  const [groupTutor, setGroupTutor] = useState(null);

  const fetchClassAdmin = async () => {
    if (!classData?.adminId) return;
    try {
      const tutorDoc = await getDoc(doc(db, "tutors", classData.adminId));
      if (tutorDoc.exists()) {
        setGroupTutor({ id: tutorDoc.id, ...tutorDoc.data() });
        return;
      }
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
    }
  }, [classData]);

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClass = async () => {
    setIsDeleting(true);
    try {
      const userType = JSON.parse(sessionStorage.getItem("user")).userType;
      const userCollection = userType === "tutor" ? "tutors" : "students";
      if (classData.classMemberIds?.length > 0) {
        await Promise.all(
          classData.classMemberIds.map(async (memberId) => {
            const studentRef = doc(db, "students", memberId);
            const studentDoc = await getDoc(studentRef);
            const studentData = studentDoc.data();
            if (studentData) {
              await updateDoc(studentRef, {
                enrolledClasses: (studentData.enrolledClasses || []).filter(
                  (id) => id !== classId,
                ),
              });
            }
          }),
        );
      }
      if (classData.groupId) {
        const groupRef = doc(db, "groups", classData.groupId);
        const groupDoc = await getDoc(groupRef);
        if (groupDoc.exists()) {
          await updateDoc(groupRef, {
            classIds: (groupDoc.data().classIds || []).filter(
              (id) => id !== classId,
            ),
          });
        }
      }
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
      const updatedUser = JSON.parse(sessionStorage.getItem("user"));
      if (userType === "tutor") {
        updatedUser.tutorOfClasses = (updatedUser.tutorOfClasses || []).filter(
          (id) => id !== classId,
        );
        updatedUser.enrolledClasses = (
          updatedUser.enrolledClasses || []
        ).filter((id) => id !== classId);
        updatedUser.tutorStudentIds = (
          updatedUser.tutorStudentIds || []
        ).filter((studentId) => !classData.classMemberIds?.includes(studentId));
      } else {
        updatedUser.adminOfClasses = (updatedUser.adminOfClasses || []).filter(
          (id) => id !== classId,
        );
        updatedUser.enrolledClasses = (
          updatedUser.enrolledClasses || []
        ).filter((id) => id !== classId);
      }
      sessionStorage.setItem("user", JSON.stringify(updatedUser));
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

  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleLeaveClass = async () => {
    setIsLeaving(true);
    try {
      const updatedMembers = classData.classMemberIds.filter(
        (id) => id !== user.uid,
      );
      const updatedAvailableSpots = classData.availableSpots + 1;
      await updateDoc(doc(db, "classes", classId), {
        classMemberIds: updatedMembers,
        selectedRecurrenceType: "None",
        recurringSlots: [],
        availableSpots: updatedAvailableSpots,
      });
      const studentRef = doc(db, "students", user.uid);
      const studentDoc = await getDoc(studentRef);
      const studentData = studentDoc.data();
      if (studentData) {
        await updateDoc(studentRef, {
          enrolledClasses: studentData.enrolledClasses.filter(
            (id) => id !== classId,
          ),
        });
      }
      const updatedUser = JSON.parse(sessionStorage.getItem("user"));
      updatedUser.enrolledClasses = (updatedUser.enrolledClasses || []).filter(
        (id) => id !== classId,
      );
      sessionStorage.setItem("user", JSON.stringify(updatedUser));
      navigate(-1);
    } catch (error) {
      console.error("Error leaving class:", error);
      alert("Failed to leave class. Please try again.");
    } finally {
      setIsLeaving(false);
      setShowLeaveConfirmation(false);
    }
  };

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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
        <div className="flex h-96 items-center justify-center">
          <EmptyState message="No members available" />
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
                {member.id === classData.adminId && (
                  <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-400">
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
          <span className="rounded-full bg-green-100 px-2 py-1 text-sm text-green-600">
            Completed
          </span>
        );
      case "current":
        return (
          <span className="rounded-full bg-green-100 px-2 py-1 text-sm text-green-600">
            Current Class
          </span>
        );
      case "upcoming":
        return (
          <span className="rounded-full bg-gray-100 px-2 py-1 text-sm text-gray-600">
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
      classStart.getTime() + classData?.classDuration * 60 * 1000,
    );
    return now >= classStart && now <= classEnd;
  };

  // --- SPECIAL CARD VIEW for Exam Prep or Introductory Call ---
  const formatTimeOnly = (timestamp) => {
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };
  const formatDateOnly = (timestamp) => {
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <ClipLoader color="#FFB800" size={40} />
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

  if (!classData) return null;

  // SPECIAL CARD VIEW for Exam Prep or Introductory Call
  const isExamPrep =
    classData.classType === "exam_prep" ||
    classData.classType === "introductory_call" ||
    classData.examPrep;

  if (isExamPrep) {
    // Wait for groupTutor to load if needed
    const teacher = groupTutor && groupTutor.name ? groupTutor : null;

    // Only show loader if groupTutor is still loading and adminId exists
    if (classData.adminId && !teacher) {
      return (
        <div className="flex h-screen items-center justify-center">
          <ClipLoader color="#FFB800" size={40} />
        </div>
      );
    }
    // Calculate time until class starts (in minutes)
    const now = new Date();
    const classStart = new Date(classData.classDateTime.seconds * 1000);
    const diffMs = classStart - now;
    let joinLabel = "Join Class";
    if (diffMs > 0) {
      const diffMin = Math.round(diffMs / 60000);
      if (diffMin >= 1440) {
        const days = Math.floor(diffMin / 1440);
        joinLabel = `Join Class, Starting in ${days} day${days === 1 ? "" : "s"}`;
      } else if (diffMin >= 60) {
        const hours = Math.floor(diffMin / 60);
        joinLabel = `Join Class, Starting in ${hours} hour${hours === 1 ? "" : "s"}`;
      } else {
        joinLabel = `Join Class, Starting in ${diffMin} minute${diffMin === 1 ? "" : "s"}`;
      }
    } else {
      joinLabel = "Join Class (Ongoing)";
    }

    return (
      <div className="flex min-h-screen">
        <div className="m-6 flex flex-1 rounded-3xl border">
          <div className="mx-4 flex w-full flex-col rounded-3xl bg-white p-6">
            <div className="mb-6 flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-4">
                <button
                  className="rounded-full bg-[#F6F6F6] p-3"
                  onClick={() => navigate(-1)}
                  aria-label={t("class-details-tutor.actions.back")}
                >
                  <ArrowLeft size="24" />
                </button>
                <h1 className="text-2xl font-medium text-black">
                  {t("class-details-tutor.title")}
                </h1>
              </div>
            </div>
            <div className="flex justify-center py-6">
              <div className="flex w-full max-w-[420px] flex-col items-center rounded-3xl bg-[#E6FDE9] px-8 py-10 shadow-md">
                <div className="mb-6 flex items-center justify-center">
                  <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-[#B9F9C2]">
                    <span className="font-tanker text-2xl font-normal leading-none tracking-wide text-[#042F0C]">
                      EXAM
                    </span>
                    <span className="mt-1 font-tanker text-sm font-normal text-[#042F0C]">
                      PREPARATION
                    </span>
                  </div>
                </div>
                <div className="mb-2 text-center text-2xl font-semibold text-black">
                  {classData.classType === "introductory_call"
                    ? "Introductory Call"
                    : "Exam Prep Class"}
                </div>
                <div className="my-8 flex w-full flex-row items-center justify-center gap-8">
                  <div className="flex items-center gap-2 text-lg text-black">
                    <img src="/svgs/clock.svg" alt="Clock" />{" "}
                    <span className="text-sm font-medium text-[#454545]">
                      {formatTimeOnly(classData.classDateTime)}
                    </span>
                  </div>
                  <div className="font-mediumss flex items-center gap-1 text-sm text-[#454545]">
                    <img src="/svgs/calendar.svg" alt="Calendar" />
                    <span className="font-normal uppercase tracking-wide">
                      {formatDateOnly(classData.classDateTime)}
                    </span>
                  </div>
                </div>
                <div className="mb-2 text-base font-semibold text-black">
                  Instructor
                </div>
                <div className="mb-4 flex h-24 w-full items-center gap-3 rounded-2xl border border-[#14B82C] bg-white px-3 py-2">
                  <img
                    src={teacher.photoUrl || "/images/panda.png"}
                    alt={teacher.name}
                    className="h-20 w-20 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-xl font-semibold text-black"
                      title={teacher.name}
                    >
                      {teacher.name}
                    </div>
                    <div className="text-sm font-medium tracking-normal text-[#3D3D3D]">
                      {teacher.nativeLanguage || "Spanish"} Native
                      <br />
                      {teacher.targetLanguage || "English (Teaching)"}
                    </div>
                  </div>
                  <div className="flex min-w-0 items-center gap-1 text-sm font-medium uppercase text-[#454545]">
                    <img src="/svgs/location.svg" alt="Location" />
                    <span
                      className="max-w-[80px] truncate"
                      title={teacher.country || "USA"}
                    >
                      {teacher.country || "USA"}
                    </span>
                  </div>
                </div>
                <button
                  className="mt-2 w-full rounded-full border border-black bg-[#ffbf00] px-4 py-2 text-black hover:bg-[#ffbf00]"
                  onClick={() => {
                    setSelectedClassId(classId);
                    window.open(`/call?classId=${classId}`, "_blank");
                  }}
                >
                  {joinLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen">
        <div className="m-2 flex flex-1 rounded-3xl border sm:m-4 md:m-6">
          <div className="mx-2 flex w-full flex-col rounded-3xl bg-white p-3 sm:mx-4 sm:p-4 md:p-6">
            <div className="mb-4 flex items-center justify-between border-b pb-4 md:mb-6">
              <div className="flex items-center gap-2 md:gap-4">
                <button
                  className="rounded-full bg-gray-100 p-2 md:p-3"
                  onClick={() => navigate(-1)}
                >
                  <ArrowLeft size={24} />
                </button>
                <h1 className="text-2xl font-semibold md:text-4xl">
                  {t("class-details-tutor.title")}
                </h1>
              </div>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-4 md:gap-6 lg:flex-row">
              <div
                className={`w-full rounded-3xl p-4 md:p-6 lg:w-[27%] ${getClassTypeColor(
                  classData.classType,
                )}`}
              >
                <div className="flex h-full flex-col items-center justify-between text-center">
                  <div className="flex flex-col items-center text-center">
                    <img
                      src={classData.imageUrl}
                      alt={classData.className}
                      className="mb-4 h-24 w-24 rounded-full md:h-32 md:w-32"
                    />
                    <h3 className="mb-2 text-xl font-medium md:text-3xl">
                      {classData.className}
                    </h3>
                    <div className="mb-2 flex flex-wrap items-center justify-center gap-4">
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
                        <span className="md:text-md text-sm">
                          {classData.language}
                        </span>
                      </div>
                      {classData.classType === "Individual Premium" && (
                        <span className="rounded-full bg-[#fff885] px-2 py-[2px] text-center text-xs font-medium md:text-sm">
                          1:1 Class
                        </span>
                      )}
                      <span className="md:text-md rounded-full bg-yellow-200 px-3 py-1 text-sm">
                        {classData.languageLevel}
                      </span>
                      {isClassOngoing() && (
                        <span className="rounded-full bg-[#B9F9C2BF]/75 px-2 py-1 text-xs backdrop-blur-sm sm:px-3 sm:text-sm">
                          Ongoing
                        </span>
                      )}
                    </div>
                    {classData.classType === "Individual Premium" ? (
                      <>
                        <div className="mt-4 flex w-full flex-col space-y-4">
                          <div className="grid grid-cols-1 gap-16 sm:grid-cols-3 lg:grid-cols-3">
                            <div className="flex items-center justify-center gap-1 sm:justify-start">
                              <img alt="time" src="/svgs/clock.svg" />
                              <span className="text-xs sm:text-sm">
                                {new Date(
                                  classData.classDateTime.seconds * 1000,
                                ).toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                })}
                              </span>
                            </div>
                            <div className="flex items-center justify-center gap-1 sm:justify-start">
                              <img alt="date" src="/svgs/calendar.svg" />
                              <span className="text-sm">
                                {new Date(
                                  classData?.classDateTime?.seconds * 1000,
                                ).toLocaleDateString("en-US")}
                              </span>
                            </div>
                            <div className="flex items-center justify-center gap-1 sm:justify-start">
                              <img alt="participants" src="/svgs/users.svg" />
                              <span className="text-xs sm:text-sm">
                                {classData.classMemberIds.length}
                              </span>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="mt-4 flex w-full flex-col space-y-4">
                        <div className="grid grid-cols-1 gap-16 sm:grid-cols-2 lg:grid-cols-3">
                          <div className="flex items-center justify-center gap-1 sm:justify-start">
                            <img alt="time" src="/svgs/clock.svg" />
                            <span className="text-xs sm:text-sm">
                              {new Date(
                                classData.classDateTime.seconds * 1000,
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
                                classData?.classDateTime?.seconds * 1000,
                              ).toLocaleDateString("en-US")}
                            </span>
                          </div>
                          <div className="flex items-center justify-center gap-1 sm:justify-start">
                            <img alt="participants" src="/svgs/users.svg" />
                            <span className="text-xs sm:text-sm">
                              {classData.classMemberIds.length}
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
                    <ShowDescription
                      description={classData.classDescription}
                      maxHeight={100}
                    />
                  </div>
                  <div className="w-full space-y-3">
                    <div className="space-y-1">
                      <div className="flex w-full flex-col items-center">
                        <h1 className="flex items-center justify-center gap-2 text-lg font-semibold md:text-xl">
                          {classData.classType.includes("Premium")
                            ? t("group-details.languageGroup")
                            : t("group-details.members")}
                        </h1>
                      </div>
                      <ClassInfoCard
                        classData={classData}
                        groupTutor={groupTutor}
                      />
                    </div>
                    <TimeRestrictedJoinButton
                      classDateTime={classData.classDateTime}
                      classDuration={classData.classDuration || 60}
                      navigate={navigate}
                      classId={classId}
                      location={classData.classLocation}
                      classType={classData.classType}
                    />
                    {user.uid === classData.adminId ? (
                      <>
                        <button
                          className="w-full rounded-full border border-black bg-white px-4 py-2 text-black"
                          onClick={() => setIsEditModalOpen(true)}
                        >
                          {t("class-details-tutor.actions.edit-class")}
                        </button>
                        <button
                          className="w-full rounded-full border border-red-500 bg-white px-4 py-2 text-red-500"
                          onClick={() => setShowDeleteConfirmation(true)}
                        >
                          {t("class-details-tutor.actions.delete-class")}
                        </button>
                      </>
                    ) : (
                      <></>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex min-h-0 flex-1 flex-col">
                {classData.classType === "Individual Premium" &&
                classData.selectedRecurrenceType !== "One-time" ? (
                  <div className="w-full space-y-4 md:space-y-6">
                    <div className="w-full space-y-4">
                      <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                        <h2 className="text-lg font-semibold md:text-xl">
                          {t("class-details.slots.title")}
                        </h2>
                        <button
                          className="rounded-full border border-[#042F0C] bg-yellow-200 px-4 py-2 text-sm hover:bg-yellow-300"
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
                              className={`flex flex-col items-start justify-between rounded-2xl border p-3 sm:flex-row sm:items-center sm:rounded-full sm:px-4 ${
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
                                  {formatDate(slot.createdAt)}
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
                    <div className="mb-4 flex flex-col items-start justify-between sm:flex-row sm:items-center md:mb-6">
                      <button
                        className="rounded-full bg-yellow-400 px-4 py-2 text-black"
                        onClick={() => setActiveTab("Members")}
                      >
                        {t("class-details-tutor.tabs.members", {
                          count: members.length,
                        })}
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {members.map((member) => {
                          return (
                            <div
                              key={member.id}
                              className="flex items-center justify-between rounded-2xl border border-gray-200 px-3 py-2 hover:bg-gray-50 md:rounded-3xl md:px-4 md:py-3"
                            >
                              <div className="flex items-center gap-2 md:gap-3">
                                <div className="relative">
                                  <UserAvatar
                                    member={{
                                      name: member.name,
                                      photoUrl: member.photoUrl,
                                    }}
                                  />
                                  {member.id === classData.adminId && (
                                    <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-400">
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
                          );
                        })}
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
              {t("class-details.modals.delete.title")}
            </h2>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                className="w-full rounded-full border border-gray-300 py-2 font-medium hover:bg-gray-50"
                onClick={() => setShowDeleteConfirmation(false)}
              >
                {t("class-details.modals.delete.cancel")}
              </button>
              <button
                className="w-full rounded-full border border-[#8b0000] bg-[#ff4d4d] py-2 font-medium text-black hover:bg-[#ff3333]"
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
              {t("class-details.modals.leave.title")}
            </h2>
            <div className="flex flex-row gap-2">
              <button
                className="w-full rounded-full border border-gray-300 py-2 font-medium hover:bg-gray-50"
                onClick={() => setShowLeaveConfirmation(false)}
              >
                {t("class-details.modals.leave.cancel")}
              </button>
              <button
                className="w-full rounded-full border border-[#8b0000] bg-[#ff4d4d] py-2 font-medium text-black hover:bg-[#ff3333]"
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
