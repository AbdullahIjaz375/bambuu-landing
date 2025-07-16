import React, { useState, useEffect } from "react";
import { ArrowLeft, User, Clock, Calendar, MapPin, Users } from "lucide-react";
import { doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { ClipLoader } from "react-spinners";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Modal from "react-modal";
import { Timestamp } from "firebase/firestore";
import {
  addMemberToStreamChannel,
  createStreamChannel,
} from "../../services/streamService";
import { ChannelType, streamClient } from "../../config/stream";
import ClassInfoCard from "../../components/ClassInfoCard";
import { useClassBooking } from "../../hooks/useClassBooking";
import PlansModal from "../../components/PlansModal";
import EmptyState from "../../components/EmptyState";
import { toast } from "react-toastify";
import { checkAccess } from "../../utils/accessControl";
import { updateStreamChannelMetadata } from "./UpdateStreamChannel";
import { useTranslation } from "react-i18next";

Modal.setAppElement("#root");

const ClassDetailsNotJoinedUser = ({ onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Members");
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classData, setClassData] = useState(null);
  const [error, setError] = useState(null);
  const { classId } = useParams();
  const [nextClassDate, setNextClassDate] = useState(null);
  const { t } = useTranslation();
  const [showFullDescription, setShowFullDescription] = useState(false);

  const calculateNextClassDate = (classData) => {
    const originalDate = new Date(classData.classDateTime.seconds * 1000);
    const currentDate = new Date();
    const recurrenceType = classData.recurrenceTypes[0];

    // If the original date is in the future, use it
    if (originalDate > currentDate) {
      setNextClassDate(originalDate);
      return;
    }

    // Calculate the next occurrence based on recurrence type
    let nextDate = new Date(originalDate);

    switch (recurrenceType) {
      case "Daily":
        // Find the next day
        while (nextDate <= currentDate) {
          nextDate.setDate(nextDate.getDate() + 1);
        }
        break;

      case "Weekly":
        // Find the next occurrence of the same day of week
        while (nextDate <= currentDate) {
          nextDate.setDate(nextDate.getDate() + 7);
        }
        break;

      case "Monthly":
        // Find the next occurrence on the same day of month
        while (nextDate <= currentDate) {
          nextDate.setMonth(nextDate.getMonth() + 1);
        }
        break;

      default:
        // For any other recurrence types, use the original date
        nextDate = originalDate;
    }

    setNextClassDate(nextDate);
  };

  const formatDate = (date, format = "full") => {
    if (!date) return "";

    // For recurring classes in class details page, show the full date
    if (format === "full") {
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    // For day-only format (used in class cards)
    else if (format === "day") {
      return date.toLocaleDateString("en-US", {
        weekday: "long",
      });
    }
  };

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
  if (
    fetchClass.classDateTime &&
    fetchClass.recurrenceTypes?.length > 0 &&
    fetchClass.recurrenceTypes[0] !== "One-time"
  ) {
    calculateNextClassDate(fetchClass);
  }

  useEffect(() => {
    if (classData?.recurrenceTypes?.length > 0) {
      setSelectedRecurrenceType(classData.recurrenceTypes[0]);
    }
  }, [classData]);

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
    }
  }, [classData]);
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

  //------------------------------------booking class-------------------------//
  const [isEnrolling, setIsEnrolling] = useState(false);
  const { setUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isBookingConfirmationOpen, setIsBookingConfirmationOpen] =
    useState(false);

  // Helper function to update session storage
  const updateSessionStorage = (newEnrolledClass) => {
    const storedUser = JSON.parse(sessionStorage.getItem("user"));
    if (storedUser) {
      const updatedUser = {
        ...storedUser,
        enrolledClasses: [
          ...(storedUser.enrolledClasses || []),
          newEnrolledClass,
        ],
      };
      sessionStorage.setItem("user", JSON.stringify(updatedUser));
    }
  };

  const enrollInClass = async (
    classId,
    userId,
    tutorId,
    shouldDeductCredits = false,
  ) => {
    setIsEnrolling(true);
    setError(null);

    try {
      // Get references to both documents
      const classRef = doc(db, "classes", classId);
      const userRef = doc(db, "students", userId);
      const tutorRef = doc(db, "tutors", tutorId);

      // Get the current class document to check available spots
      const classDoc = await getDoc(classRef);
      const classData = classDoc.data();

      if (!classData) {
        toast.error("Class not found");
        return false;
      }

      if (classData.classMemberIds?.includes(userId)) {
        toast.warning("You are already enrolled in this class");
        return false;
      }

      if (classData.availableSpots <= 0) {
        toast.error("Class is full");
        return false;
      }

      // Use the pre-calculated slots from state
      const slotsTimestamps = slots.map((slot) => ({
        bookingMethod: shouldDeductCredits ? "Credits" : "Subscription", // Add booking method
        createdAt: new Timestamp(Math.floor(slot.getTime() / 1000), 0), // Add slot time
      }));

      // Calculate the number of credits to deduct
      const creditsToDeduct = slots.length;

      // Check if the user has enough credits
      if (shouldDeductCredits && user.credits < creditsToDeduct) {
        toast.error("Insufficient credits to enroll in this class");
        return false;
      }

      // Prepare the update data
      const updateData = {
        classMemberIds: arrayUnion(userId),
        selectedRecurrenceType,
        languageLevel: languageLevel,
        recurringSlots:
          selectedRecurrenceType === "One-time" ? [] : slotsTimestamps,
        availableSpots: classData.availableSpots - 1, // Decrement available slots
      };

      // Prepare the update data

      // Only update classDateTime if we have slots
      if (slots.length > 0) {
        updateData.classDateTime = new Timestamp(
          Math.floor(slots[0].getTime() / 1000),
          0,
        );
      }

      // Prepare updates array
      const updates = [
        updateDoc(classRef, updateData),
        updateDoc(userRef, {
          enrolledClasses: arrayUnion(classId),
          credits: shouldDeductCredits
            ? user.credits - creditsToDeduct
            : user.credits,
        }),
      ]; // Check if the tutorId corresponds to an actual tutor document
      const tutorDoc = await getDoc(tutorRef);
      if (tutorDoc.exists()) {
        updates.push(
          updateDoc(tutorRef, {
            tutorStudentIds: arrayUnion(userId),
          }),
        );
      } // Execute all updates in parallel
      await Promise.all(updates); // For Individual Premium classes, add the user to the Stream chat channel
      if (classData.classType === "Individual Premium") {
        try {
          // Import the stream channel helpers
          const { addUserToChannel } = await import(
            "../../services/streamChannelHelpers"
          );

          // Add user to the premium class channel - this is the key fix
          await addUserToChannel(
            classId,
            userId,
            "premium_individual_class", // Use string instead of ChannelType constant
            "channel_member",
          );

          // Ensure the channel name is synced after adding the user
          const { syncPremiumClassChannelName } = await import(
            "../../services/channelNameSync"
          );
          await syncPremiumClassChannelName(classId);
        } catch (streamError) {
          console.error("Error adding to premium class channel:", streamError);

          // Try alternative approach if direct addition fails
          try {
            // Get the channel and force add the user
            const { streamClient } = await import("../../config/stream");
            const channel = streamClient.channel(
              "premium_individual_class",
              classId,
            );

            // Watch the channel first
            await channel.watch();

            // Try to add members directly
            await channel.addMembers([
              { user_id: userId, role: "channel_member" },
            ]);
          } catch (alternativeError) {
            console.error("Alternative method also failed:", alternativeError);
            // Don't block class enrollment for chat issues
            toast.error(
              "Class enrolled successfully, but chat access may need refresh",
            );
          }
        }
      }

      // Update context and session storage
      if (user) {
        const updatedUser = {
          ...user,
          enrolledClasses: [...(user.enrolledClasses || []), classId],
          credits: shouldDeductCredits
            ? user.credits - creditsToDeduct
            : user.credits,
        };
        setUser(updatedUser);
        updateSessionStorage(classId);
      }
      navigate(`/classDetailsUser/${classId}`, { replace: true });

      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleBookClass = (e) => {
    e.stopPropagation(); // Prevent event bubbling
    setIsBookingConfirmationOpen(true);
  };

  const [isPlansModalOpen, setIsPlansModalOpen] = useState(false);
  const { handleClassBooking, isProcessing, iserror } = useClassBooking();

  const handleConfirmBooking = async () => {
    if (!user) {
      setError("Please log in to enroll in classes");
      return;
    }

    // Check access before allowing enrollment
    const accessCheck = checkAccess(user, "premium-class", classData.classType);

    if (!accessCheck.hasAccess) {
      toast.error(accessCheck.reason);
      setIsBookingConfirmationOpen(false);
      setIsPlansModalOpen(true);
      return;
    }

    const { success, method } = await handleClassBooking(
      user,
      classData.classType,
      user.subscriptions,
      user.credits,
      () => {
        setIsBookingConfirmationOpen(false);
        setIsModalOpen(false);
      },
      // Failure callback
      (errorMessage) => {
        if (
          errorMessage.includes("subscription") ||
          errorMessage.includes("credits")
        ) {
          setIsPlansModalOpen(true);
        }
      },
      // Enrollment function
      (useCredits) =>
        enrollInClass(classId, user.uid, classData.adminId, useCredits),
    );
  };

  const [selectedRecurrenceType, setSelectedRecurrenceType] = useState(
    classData?.recurrenceTypes?.[0] || "",
  );
  const [totalClasses, setTotalClasses] = useState("1");
  const [languageLevel, setLanguageLevel] = useState("Beginner");

  const calculateRecurringSlots = (
    startDateTimeMillis, // Expect milliseconds
    recurrenceType,
    numberOfClasses,
  ) => {
    if (typeof startDateTimeMillis !== "number") {
      console.error("Invalid startDateTime:", startDateTimeMillis);
      return [];
    }

    const baseDate = new Date(startDateTimeMillis);

    if (!["Daily", "Weekly", "Monthly"].includes(recurrenceType)) {
      console.error("Invalid recurrenceType:", recurrenceType);
      return [];
    }

    const slots = [];

    for (let i = 0; i < numberOfClasses; i++) {
      const slotDate = new Date(baseDate.getTime()); // Clone the base date
      switch (recurrenceType) {
        case "Daily":
          slotDate.setDate(baseDate.getDate() + i);
          break;
        case "Weekly":
          slotDate.setDate(baseDate.getDate() + i * 7);
          break;
        case "Monthly":
          slotDate.setMonth(baseDate.getMonth() + i);
          break;
        default:
          continue;
      }

      if (isNaN(slotDate.getTime())) {
        console.error("Generated an invalid date:", slotDate);
        continue;
      }

      // Create a Firebase Timestamp
      slots.push(new Timestamp(Math.floor(slotDate.getTime() / 1000), 0));
    }

    return slots;
  };
  const renderRecurrenceOptions = () => (
    <div className="space-y-4">
      <label className="block text-xl font-semibold">Class Type</label>
      <div className="flex flex-wrap gap-3">
        {classData?.recurrenceTypes?.map((type) => (
          <label
            key={type}
            className={`inline-flex cursor-pointer items-center rounded-full border border-black px-4 py-1.5 text-lg ${
              selectedRecurrenceType === type
                ? "bg-[#e6fce8] text-black"
                : "bg-gray-50 text-gray-500"
            }`}
          >
            <input
              type="radio"
              className="hidden"
              value={type}
              checked={selectedRecurrenceType === type}
              onChange={(e) => setSelectedRecurrenceType(e.target.value)}
            />
            <span className="text-md">{type}</span>
          </label>
        ))}
      </div>
    </div>
  );
  const languageLevels = ["Beginner", "Intermediate", "Advanced"];

  const renderLanguageLevel = () => (
    <div className="space-y-4">
      <label className="block text-xl font-semibold">Language Level</label>
      <div className="flex flex-wrap gap-3">
        {languageLevels?.map((level) => (
          <label
            key={level}
            className={`inline-flex cursor-pointer items-center rounded-full border border-black px-4 py-1.5 text-lg ${
              languageLevel === level
                ? "bg-[#e6fce8] text-black"
                : "bg-gray-50 text-gray-500"
            }`}
          >
            <input
              type="radio"
              className="hidden"
              value={level}
              checked={languageLevel === level}
              onChange={(e) => setLanguageLevel(e.target.value)}
            />
            <span className="text-md">{level}</span>
          </label>
        ))}
      </div>
    </div>
  );

  // Total classes input field - only shown for recurring types
  const renderTotalClassesInput = () => {
    if (
      selectedRecurrenceType === "One-time" ||
      selectedRecurrenceType === "None"
    )
      return null;

    return (
      <div className="space-y-2">
        <label className="block text-xl font-medium">Total Classes</label>
        <input
          type="number"
          className="w-full rounded-3xl border border-gray-300 p-3 focus:border-[#14B82C] focus:outline-none focus:ring-0"
          placeholder="Enter total number of classes"
          value={totalClasses}
          onChange={(e) => setTotalClasses(e.target.value)}
          min="1"
        />
      </div>
    );
  };
  //----------------------------------class slots----------------------------------------//

  const [slots, setSlots] = useState([]);

  useEffect(() => {
    if (!classData?.classDateTime || !selectedRecurrenceType || !totalClasses)
      return;

    const calculateSlots = () => {
      const currentTime = new Date();
      let baseDate = new Date(classData?.classDateTime.seconds * 1000);
      const slots = [];

      // Extract time components for comparison
      const classTimeStr = baseDate.toTimeString().split(" ")[0]; // HH:MM:SS
      const currentTimeStr = currentTime.toTimeString().split(" ")[0];

      // Compare dates and times
      const isToday = baseDate.toDateString() === currentTime.toDateString();
      const hasTimePassed = isToday && currentTimeStr > classTimeStr;

      // If class is today and time has passed, or class date is in the past,
      // adjust the base date according to recurrence type
      if (hasTimePassed || baseDate < currentTime) {
        const classHours = baseDate.getHours();
        const classMinutes = baseDate.getMinutes();
        const classSeconds = baseDate.getSeconds();

        if (selectedRecurrenceType === "One-time") {
          // For one-time classes, move to the next available slot at the same time
          baseDate = new Date(
            currentTime.getFullYear(),
            currentTime.getMonth(),
            currentTime.getDate() + 1,
            classHours,
            classMinutes,
            classSeconds,
          );
        } else
          switch (selectedRecurrenceType) {
            case "Daily":
            case "Daily (Weekdays)":
              // Move to next day, keeping the same time
              baseDate = new Date(
                currentTime.getFullYear(),
                currentTime.getMonth(),
                currentTime.getDate() + 1,
                classHours,
                classMinutes,
                classSeconds,
              );
              break;

            case "Weekly":
              // Calculate days until next occurrence
              let daysUntilNext =
                (7 - currentTime.getDay() + baseDate.getDay()) % 7;
              if (daysUntilNext === 0 && hasTimePassed) {
                daysUntilNext = 7; // If today's instance passed, move to next week
              }

              baseDate = new Date(
                currentTime.getFullYear(),
                currentTime.getMonth(),
                currentTime.getDate() + daysUntilNext,
                classHours,
                classMinutes,
                classSeconds,
              );
              break;

            case "Monthly":
              let nextMonth = currentTime.getMonth();
              let nextYear = currentTime.getFullYear();

              // If we're past the class date this month, move to next month
              if (
                currentTime.getDate() > baseDate.getDate() ||
                (currentTime.getDate() === baseDate.getDate() && hasTimePassed)
              ) {
                nextMonth++;
                if (nextMonth > 11) {
                  nextMonth = 0;
                  nextYear++;
                }
              }

              baseDate = new Date(
                nextYear,
                nextMonth,
                baseDate.getDate(),
                classHours,
                classMinutes,
                classSeconds,
              );
              break;
            default:
          }
      }

      // Generate subsequent slots based on the adjusted base date
      if (selectedRecurrenceType === "One-time") {
        slots.push(baseDate);
      } else {
        for (let i = 0; i < totalClasses; i++) {
          const slotDate = new Date(baseDate);

          switch (selectedRecurrenceType) {
            case "Daily":
              slotDate.setDate(baseDate.getDate() + i);
              break;
            case "Daily (Weekdays)":
              // Skip weekends
              let daysAdded = 0;
              let currentDate = new Date(baseDate);
              while (daysAdded < i + 1) {
                if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
                  daysAdded++;
                }
                if (daysAdded < i + 1) {
                  currentDate.setDate(currentDate.getDate() + 1);
                }
              }
              slotDate.setTime(currentDate.getTime());
              break;
            case "Weekly":
              slotDate.setDate(baseDate.getDate() + i * 7);
              break;
            case "Monthly":
              slotDate.setMonth(baseDate.getMonth() + i);
              break;
            default:
          }

          slots.push(slotDate);
        }
      }

      setSlots(slots);
    };

    calculateSlots();
  }, [classData?.classDateTime, selectedRecurrenceType, totalClasses]);

  //----------------------------------------------------------------------------------------//

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

  // Determine if premium content is accessible
  const canAccessPremium =
    user?.freeAccess ||
    user?.subscriptions?.some((sub) => {
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
        type === "bammbuu+ instructor-led group classes" ||
        type === "immersive exam prep" ||
        type === "bammbuu groups" ||
        type === "group_premium"
      );
    });

  const isRecurringClass =
    classData.recurrenceTypes &&
    classData.recurrenceTypes.length > 0 &&
    classData.recurrenceTypes[0] !== "One-time";

  const displayDate =
    isRecurringClass && nextClassDate
      ? nextClassDate
      : new Date(classData?.classDateTime?.seconds * 1000);

  // Determine if the user has already booked this class
  const isAlreadyBooked =
    user &&
    (classData.classMemberIds.includes(user.uid) ||
      (user.enrolledClasses && user.enrolledClasses.includes(classData.id)));
  const isClassFull =
    typeof classData.availableSpots !== "undefined" &&
    classData.classMemberIds.length >= classData.availableSpots;

  return (
    <>
      <div className="flex min-h-screen">
        <div className="m-6 flex flex-1 rounded-3xl border">
          <div className="mx-4 flex w-full flex-col rounded-3xl bg-white p-6">
            <div className="mb-6 flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-4">
                <button
                  className="rounded-full bg-gray-100 p-3"
                  onClick={() => navigate(-1)}
                >
                  <ArrowLeft size="30" />
                </button>
                <h1 className="text-4xl font-semibold">Class Details</h1>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 gap-6">
              <div
                className={`w-[420px] max-w-[420px] flex-shrink-0 rounded-3xl p-6 ${getClassTypeColor(
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
                    {/* Language, Level, 1:1 Tag Row */}
                    <div className="mb-2 flex flex-row flex-wrap items-center justify-center gap-2">
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
                      {classData.classType === "Individual Premium" && (
                        <span className="rounded-full bg-[#fff885] px-2 py-[2px] text-center text-xs font-medium md:text-sm">
                          1:1 Class
                        </span>
                      )}
                      <span className="md:text-md rounded-full bg-yellow-200 px-3 py-1 text-sm">
                        {classData.languageLevel}
                      </span>
                    </div>
                    {/* Time, Date, Participants Row */}
                    <div className="mb-2 flex flex-row flex-wrap items-center justify-center gap-6">
                      <div className="flex items-center gap-1">
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
                      <div className="flex items-center gap-1">
                        <img alt="date" src="/svgs/calendar.svg" />
                        <span className="text-sm">
                          {new Date(
                            classData.classDateTime.seconds * 1000,
                          ).toLocaleDateString("en-US")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <img alt="participants" src="/svgs/users.svg" />
                        <span className="text-xs sm:text-sm">
                          {classData.classMemberIds.length}
                        </span>
                      </div>
                    </div>
                    {/* Recurrence and Location Row */}
                    <div className="mb-2 flex flex-row flex-wrap items-center justify-center gap-6">
                      <div className="flex items-center gap-1">
                        <img alt="recurrence" src="/svgs/repeate-music.svg" />
                        <span className="text-xs sm:text-sm">
                          {classData.classType === "Individual Premium"
                            ? classData.selectedRecurrenceType || "None"
                            : classData.recurrenceTypes?.length > 0
                              ? classData.recurrenceTypes.join(", ")
                              : "None"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <img alt="location" src="/svgs/location.svg" />
                        <span className="text-xs sm:text-sm">
                          {classData.classLocation}
                        </span>
                      </div>
                    </div>
                    {/* Class Description with See more/less, never overflowing */}
                    <div className="mb-6 mt-4 w-full max-w-full overflow-hidden px-2 text-gray-600">
                      <p
                        className={`mx-auto w-full max-w-full overflow-hidden whitespace-pre-line break-words text-center text-sm ${
                          !showFullDescription ? "line-clamp-3" : ""
                        }`}
                        style={{ wordBreak: "break-word" }}
                      >
                        {classData.classDescription}
                      </p>
                      {classData.classDescription &&
                        classData.classDescription.length > 180 && (
                          <button
                            className="mx-auto mt-1 block text-xs text-[#14b82c] underline hover:text-[#119924] focus:outline-none"
                            onClick={() =>
                              setShowFullDescription((prev) => !prev)
                            }
                          >
                            {showFullDescription ? "See less" : "See more"}
                          </button>
                        )}
                    </div>
                  </div>

                  <div className="w-full space-y-4">
                    <div className="space-y-1">
                      {" "}
                      {classData.classType === "Individual Premium" ? (
                        <h1 className="text-xl font-semibold">Instructor</h1>
                      ) : (
                        <h1 className="text-xl font-semibold">Group</h1>
                      )}
                      <ClassInfoCard
                        classData={classData}
                        groupTutor={groupTutor}
                      />
                    </div>
                    {/* Book Class Button - now disables if already booked or full */}
                    {isAlreadyBooked || isClassFull ? (
                      <button
                        className="w-full cursor-not-allowed rounded-full border border-gray-400 bg-gray-200 px-4 py-2 text-gray-500"
                        disabled
                        title={
                          isAlreadyBooked
                            ? "This class has already been booked"
                            : "Class is full"
                        }
                      >
                        {isAlreadyBooked
                          ? "Class Already Booked"
                          : "Class Full"}
                      </button>
                    ) : (
                      <button
                        className="w-full rounded-full border border-black bg-[#14b82c] px-4 py-2 text-black hover:bg-[#14b82c]"
                        onClick={handleBookClass}
                      >
                        Book Class
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-row space-x-4">
                <div className="flex min-h-0 flex-1 flex-col">
                  {classData.classType === "Group Premium" ? (
                    <>
                      {/* Group Premium UI */}
                      <div className="mb-6 flex flex-row items-center justify-between">
                        <button
                          className="rounded-full bg-yellow-400 px-6 py-2 text-black"
                          onClick={() => setActiveTab("Members")}
                        >
                          Members ({members.length})
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto">
                        {renderMembers()}
                      </div>
                    </>
                  ) : classData.classType === "Individual Premium" ? (
                    <>
                      <div className="w-full max-w-md space-y-6">
                        {renderLanguageLevel()}
                        {renderRecurrenceOptions()}
                        {renderTotalClassesInput()}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="mb-6 flex flex-row items-center justify-between">
                        <button
                          className="rounded-full bg-yellow-400 px-6 py-2 text-black"
                          onClick={() => setActiveTab("Members")}
                        >
                          Members ({members.length})
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto">
                        {renderMembers()}
                      </div>
                    </>
                  )}
                </div>
                {classData.classType === "Individual Premium" ? (
                  <div className="w-96 space-y-4">
                    <h3 className="text-xl font-semibold">Class Schedule</h3>
                    <div className="space-y-2">
                      {slots.map((slot, index) => (
                        <div key={index}>
                          <div className="flex flex-col items-start justify-between rounded-2xl border border-green-500 p-3 sm:flex-row sm:items-center sm:rounded-full sm:px-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {selectedRecurrenceType === "One-time"
                                  ? "Class Time"
                                  : `Class ${index + 1}`}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <Clock size={16} className="text-gray-500" />
                                <span className="text-sm">
                                  {slot.toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar size={16} className="text-gray-500" />
                                <span className="text-sm">
                                  {slot.toLocaleDateString("en-US", {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <></>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Modal
        isOpen={isBookingConfirmationOpen}
        onRequestClose={() => setIsBookingConfirmationOpen(false)}
        className="mx-auto mt-40 max-w-sm rounded-3xl bg-white p-6 font-urbanist outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
        style={{
          content: {
            border: "none",
            padding: "24px",
            maxWidth: "420px", // max-w-sm
          },
        }}
      >
        <div className="text-center">
          <h2 className="mb-4 text-xl font-semibold">
            Are you sure you want to book this class?
          </h2>
          {error && <p className="mb-4 text-red-600">{error}</p>}{" "}
          <p className="mb-6 text-gray-600">
            {classData.classType === "Individual Premium"
              ? t(
                  "exploreClassCard.confirmBooking.descriptionPremiumIndividual",
                )
              : t("exploreClassCard.confirmBooking.description")}
          </p>
          <div className="flex flex-row gap-2">
            <button
              onClick={() => setIsBookingConfirmationOpen(false)}
              className="w-full rounded-full border border-gray-300 py-2 font-medium hover:bg-gray-50"
            >
              No, Cancel
            </button>
            <button
              onClick={handleConfirmBooking}
              className="w-full rounded-full border border-[#042f0c] bg-[#14b82c] py-2 font-medium text-black hover:bg-[#119924]"
            >
              {isEnrolling ? "Enrolling..." : "Yes, Book Now"}
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

export default ClassDetailsNotJoinedUser;
