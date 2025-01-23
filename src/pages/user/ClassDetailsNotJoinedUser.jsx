import React, { useState, useEffect } from "react";
import { ArrowLeft, User, Clock, Calendar, MapPin, Users } from "lucide-react";
import { doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { ClipLoader } from "react-spinners";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Modal from "react-modal";
import { Timestamp } from "firebase/firestore";
import { addMemberToStreamChannel } from "../../services/streamService";
import { ChannelType } from "../../config/stream";
import ClassInfoCard from "../../components/ClassInfoCard";
import { useClassBooking } from "../../hooks/useClassBooking";
import PlansModal from "../../components/PlansModal";
import EmptyState from "../../components/EmptyState";
import { toast } from "react-toastify";

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
    shouldDeductCredits = false
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

      if (classData.classMemberIds?.length >= classData.availableSpots) {
        toast.error("Class is full");
        return false;
      }

      // Use the pre-calculated slots from state
      const slotsTimestamps = slots.map(
        (slot) => new Timestamp(Math.floor(slot.getTime() / 1000), 0)
      );

      // Prepare the update data
      const updateData = {
        classMemberIds: arrayUnion(userId),
        selectedRecurrenceType,
        languageLevel: languageLevel,
        recurringSlots:
          selectedRecurrenceType === "One-time" ? [] : slotsTimestamps,
      };

      // Prepare the update data

      // Only update classDateTime if we have slots
      if (slots.length > 0) {
        updateData.classDateTime = new Timestamp(
          Math.floor(slots[0].getTime() / 1000),
          0
        );
      }

      // Prepare updates array
      const updates = [
        updateDoc(classRef, updateData),
        updateDoc(userRef, {
          enrolledClasses: arrayUnion(classId),
        }),
      ];
      console.log(classData.type);
      // Check if the tutorId corresponds to an actual tutor document
      const tutorDoc = await getDoc(tutorRef);
      if (tutorDoc.exists()) {
        updates.push(
          updateDoc(tutorRef, {
            tutorStudentIds: arrayUnion(userId),
          })
        );
      }

      // Execute all updates in parallel
      await Promise.all(updates);
      if (classData.classType === "Individual Premium") {
        try {
          await addMemberToStreamChannel({
            channelId: classId,
            userId: userId,
            type: ChannelType.PREMIUM_INDIVIDUAL_CLASS,
            role: "channel_member",
          });
        } catch (streamError) {
          console.error("Error adding to stream channel:", streamError);
          throw new Error("Failed to join class chat");
        }
      }
      // Update context and session storage
      if (user) {
        const updatedUser = {
          ...user,
          enrolledClasses: [...(user.enrolledClasses || []), classId],
          credits: shouldDeductCredits ? user.credits - 1 : user.credits,
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

    const success = await handleClassBooking(
      user,
      classData.classType, // Make sure this is available in your component props
      user.subscriptions,
      user.credits,
      // Success callback
      () => {
        setIsBookingConfirmationOpen(false);
        setIsModalOpen(false);
        // toast.success("Successfully enrolled in class!");
      },
      // Failure callback
      (errorMessage) => {
        // toast.error(errorMessage);
        if (
          errorMessage.includes("subscription") ||
          errorMessage.includes("credits")
        ) {
          setIsPlansModalOpen(true);
        }
      },
      // Enrollment function
      (useCredits) =>
        enrollInClass(classId, user.uid, classData.adminId, useCredits)
    );
  };

  const [selectedRecurrenceType, setSelectedRecurrenceType] = useState(
    classData?.recurrenceTypes?.[0] || ""
  );
  const [totalClasses, setTotalClasses] = useState("");
  const [languageLevel, setLanguageLevel] = useState("Beginner");

  const calculateRecurringSlots = (
    startDateTimeMillis, // Expect milliseconds
    recurrenceType,
    numberOfClasses
  ) => {
    if (typeof startDateTimeMillis !== "number") {
      console.error("Invalid startDateTime:", startDateTimeMillis);
      return [];
    }

    const baseDate = new Date(startDateTimeMillis);
    console.log("Base date:", baseDate);

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

    console.log("Generated slots:", slots);
    return slots;
  };
  const renderRecurrenceOptions = () => (
    <div className="space-y-4 ">
      <label className="block text-xl font-semibold">Class Type</label>
      <div className="flex flex-wrap gap-3">
        {classData?.recurrenceTypes?.map((type) => (
          <label
            key={type}
            className={`
              inline-flex text-lg items-center px-4 py-1.5 rounded-full cursor-pointer border border-black
              ${
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
    <div className="space-y-4 ">
      <label className="block text-xl font-semibold">Language Level</label>
      <div className="flex flex-wrap gap-3">
        {languageLevels?.map((level) => (
          <label
            key={level}
            className={`
              inline-flex text-lg items-center px-4 py-1.5 rounded-full cursor-pointer border border-black
              ${
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
        <label className="block text-xl font-medium ">Total Classes</label>
        <input
          type="number"
          className="w-full p-3 border border-gray-300 rounded-3xl focus:border-[#14B82C] focus:ring-0 focus:outline-none"
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

        switch (selectedRecurrenceType) {
          case "Daily":
            // Move to next day, keeping the same time
            baseDate = new Date(
              currentTime.getFullYear(),
              currentTime.getMonth(),
              currentTime.getDate() + 1,
              classHours,
              classMinutes,
              classSeconds
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
              classSeconds
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
              classSeconds
            );
            break;
          default:
        }
      }

      // Generate subsequent slots based on the adjusted base date
      for (let i = 0; i < totalClasses; i++) {
        const slotDate = new Date(baseDate);

        switch (selectedRecurrenceType) {
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
        }

        slots.push(slotDate);
      }

      setSlots(slots);
    };

    calculateSlots();
  }, [classData?.classDateTime, selectedRecurrenceType, totalClasses]);

  //----------------------------------------------------------------------------------------//

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
        <div className="flex flex-1 m-6 border rounded-3xl">
          <div className="flex flex-col w-full p-6 mx-4 bg-white rounded-3xl">
            <div className="flex items-center justify-between pb-4 mb-6 border-b">
              <div className="flex items-center gap-4">
                <button
                  className="p-3 bg-gray-100 rounded-full"
                  onClick={() => navigate(-1)}
                >
                  <ArrowLeft size="30" />
                </button>
                <h1 className="text-4xl font-semibold">Class Details</h1>
              </div>
            </div>

            <div className="flex flex-1 min-h-0 gap-6">
              <div
                className={`w-1/4 p-6 rounded-3xl ${getClassTypeColor(
                  classData.classType
                )}`}
              >
                <div className="flex flex-col items-center justify-between h-full text-center">
                  <div className="flex flex-col items-center text-center">
                    <img
                      src={classData.imageUrl}
                      alt={classData.className}
                      className="w-32 h-32 mb-4 rounded-full"
                    />
                    <h3 className="mb-2 text-2xl font-medium">
                      {classData.className}
                    </h3>
                    <div className="flex items-center gap-4 mb-2">
                      <div className="flex flex-row items-center space-x-1">
                        <img
                          src={
                            classData.language === "English"
                              ? "/svgs/xs-us.svg"
                              : "/svgs/xs-spain.svg"
                          }
                          alt={
                            classData.language === "English"
                              ? "US Flag"
                              : "Spain Flag"
                          }
                          className="w-5"
                        />{" "}
                        <span className=" text-md">{classData.language}</span>
                      </div>

                      <span className="px-3 py-[2px] bg-yellow-200 rounded-full text-md">
                        {classData.languageLevel}
                      </span>
                    </div>
                    <div className="flex flex-col mt-4 space-y-4">
                      {/* First Row */}
                      <div className="flex items-center justify-between space-x-12">
                        <div className="flex items-center gap-1">
                          <img alt="bammbuu" src="/svgs/clock.svg" />{" "}
                          <span className="text-sm">
                            {new Date(
                              classData?.classDateTime?.seconds * 1000
                            ).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                              // second: '2-digit' // uncomment if you want seconds
                              hour12: true, // for AM/PM format
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <img alt="bammbuu" src="/svgs/calendar.svg" />
                          <span className="text-sm">
                            {new Date(
                              classData?.classDateTime?.seconds * 1000
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <img alt="bammbuu" src="/svgs/users.svg" />
                          {classData.classType === "Group Premium" ||
                          classData.classType === "Individual Premium" ? (
                            <>
                              {" "}
                              <span className="text-sm">2k+</span>
                            </>
                          ) : (
                            <span className="text-sm text-[#454545]">
                              {classData.classMemberIds.length}/
                              {classData.availableSpots}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Second Row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <img alt="bammbuu" src="/svgs/repeate-music.svg" />
                          <span className="text-sm">
                            {classData.selectedRecurrenceType || "None"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <img alt="bammbuu" src="/svgs/location.svg" />
                          <span className="text-sm">
                            {classData.classLocation}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="mt-4 mb-6 text-gray-600">
                      {classData.classDescription}
                    </p>
                  </div>

                  <div className="w-full space-y-4">
                    <div className="space-y-1">
                      {" "}
                      {classData.classType === "Group Premium" ||
                      classData.classType === "Individual Premium" ? (
                        <h1 className="text-xl font-semibold">Instructor</h1>
                      ) : (
                        <h1 className="text-xl font-semibold">Group</h1>
                      )}
                      <ClassInfoCard
                        classData={classData}
                        groupTutor={groupTutor}
                      />
                    </div>
                    <button
                      className="w-full px-4 py-2 text-black bg-[#14b82c] border border-black rounded-full hover:bg-[#14b82c]"
                      onClick={handleBookClass}
                    >
                      Book Class
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex flex-row space-x-4">
                <div className="flex flex-col flex-1 min-h-0 ">
                  {classData.classType === "Group Premium" ? (
                    <>
                      {/* Group Premium UI */}
                      <div className="flex flex-row items-center justify-between mb-6">
                        <button
                          className="px-6 py-2 text-black bg-yellow-400 rounded-full"
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
                      <div className="flex flex-row items-center justify-between mb-6">
                        <button
                          className="px-6 py-2 text-black bg-yellow-400 rounded-full"
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
                  <div className="space-y-4 w-96">
                    <h3 className="text-xl font-semibold">Class Schedule</h3>
                    <div className="space-y-2">
                      {totalClasses && slots.length > 0 ? (
                        slots.map((slot, index) => (
                          <div key={index}>
                            <div className="flex flex-col items-start justify-between p-3 border border-green-500 sm:flex-row sm:items-center sm:px-4 rounded-2xl sm:rounded-full">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                  Class {index + 1}
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
                                  <Calendar
                                    size={16}
                                    className="text-gray-500"
                                  />
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
                        ))
                      ) : (
                        <div className="text-sm text-gray-500">
                          {selectedRecurrenceType !== "One-time"
                            ? "Please enter the number of classes to see the schedule"
                            : "One-time class scheduled for:"}
                        </div>
                      )}
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
        className="max-w-sm p-6 mx-auto mt-40 bg-white outline-none rounded-3xl font-urbanist"
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
          {error && <p className="mb-4 text-red-600">{error}</p>}
          <p className="mb-6 text-gray-600">
            By booking class you will be added in the group and you'll be able
            to join the class 5 minutes before it starts. It will also be added
            to your calendar.
          </p>
          <div className="flex flex-row gap-2">
            <button
              onClick={() => setIsBookingConfirmationOpen(false)}
              className="w-full py-2 font-medium border border-gray-300 rounded-full hover:bg-gray-50"
            >
              No, Cancel
            </button>
            <button
              onClick={handleConfirmBooking}
              className="w-full py-2 font-medium text-black bg-[#14b82c] rounded-full hover:bg-[#119924] border border-[#042f0c]"
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
