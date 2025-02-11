import React, { useState, useEffect } from "react";
import { ArrowLeft, User, Clock, Calendar, MapPin, Users } from "lucide-react";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { ClipLoader } from "react-spinners";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Modal from "react-modal";
import { deleteStreamChannel } from "../../services/streamService";
import { ChannelType } from "../../config/stream";
import ClassInfoCard from "../../components/ClassInfoCard";
import EmptyState from "../../components/EmptyState";
import { useTranslation } from "react-i18next";
import { ClassContext } from "../../context/ClassContext";
import { useContext } from "react";
Modal.setAppElement("#root");

const ClassDetailsTutor = ({ onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Members");
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classData, setClassData] = useState(null);
  const [error, setError] = useState(null);
  const { classId } = useParams();
  const { t } = useTranslation();
  const { setTutorSelectedClassId } = useContext(ClassContext);

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
  //---------------------------------------------------------------------------------------------------//

  const [showRemoveConfirmation, setShowRemoveConfirmation] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemoveUser = async (userId) => {
    try {
      setIsRemoving(true);

      // Get references to the group and user documents
      const classRef = doc(db, "classes", classId);
      const userRef = doc(db, "students", userId);

      // Get current group data
      const classDoc = await getDoc(classRef);
      const currentClass = classDoc.data();

      // Remove user from group's memberIds
      const updatedMemberIds = currentClass.classMemberIds.filter(
        (id) => id !== userId
      );
      await updateDoc(classRef, {
        classMemberIds: updatedMemberIds,
      });

      // Get user data and update their joinedGroups
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      const updatedEnrolledClasses = (userData.enrolledClasses || []).filter(
        (id) => id !== classId
      );

      // Update user document
      await updateDoc(userRef, {
        enrolledClasses: updatedEnrolledClasses,
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

  //---------------------------------------------video class start---------------------------------------------//

  const [showVideoCall, setShowVideoCall] = useState(false);

  const handleJoinClass = () => {
    setTutorSelectedClassId(classId);
    // navigate(`/callTutor`, { state: { classId } });
    // Open the new tab with the video call URL
    const callUrl = `/callTutor`; // Update this URL as needed
    window.open(callUrl, "_blank");
  };

  //-----------------------------------------------------------------------------------------------------------//

  //-------------------------------------------------Deleting Class---------------------------------------//
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClass = async () => {
    setIsDeleting(true);
    try {
      const userType = JSON.parse(sessionStorage.getItem("user")).userType;
      const userCollection = userType === "tutor" ? "tutors" : "students";

      // 1. Refund credits for each upcoming slot that used credits
      if (
        classData.classType === "Individual Premium" &&
        classData.recurringSlots.length > 0
      ) {
        const now = new Date();

        // Count how many future slots have bookingMethod === "credits"
        const futureCreditSlotsCount = classData.recurringSlots.filter(
          (slot) => {
            const slotDate = new Date(slot.createdAt.seconds * 1000);
            return slotDate > now && slot.bookingMethod === "credits";
          }
        ).length;

        // If there are any future slots using credits, refund that many credits to each class member
        if (futureCreditSlotsCount > 0) {
          await Promise.all(
            classData.classMemberIds.map(async (memberId) => {
              const studentRef = doc(db, "students", memberId);
              const studentDoc = await getDoc(studentRef);
              const studentData = studentDoc.data();

              if (studentData) {
                await updateDoc(studentRef, {
                  credits: (studentData.credits || 0) + futureCreditSlotsCount,
                });
              }
            })
          );
        }
      }

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

      // 4. Update session storage
      const updatedUser = JSON.parse(sessionStorage.getItem("user"));
      if (userType === "tutor") {
        updatedUser.tutorOfClasses = (updatedUser.tutorOfClasses || []).filter(
          (id) => id !== classId
        );
        updatedUser.enrolledClasses = (
          updatedUser.enrolledClasses || []
        ).filter((id) => id !== classId);
        // updatedUser.tutorStudentIds = (
        //   updatedUser.tutorStudentIds || []
        // ).filter((studentId) => !classData.classMemberIds?.includes(studentId));
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

      await deleteStreamChannel({
        channelId: classData.id,
        type: ChannelType.PREMIUM_INDIVIDUAL_CLASS,
      });

      navigate(-1);
    } catch (error) {
      console.error("Error deleting class:", error);
      alert("Failed to delete class. Please try again.");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
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

  //---------------------------------------------------------------------------------------------------//

  const renderMembers = () => {
    if (members.length === 0) {
      return (
        <div className="flex items-center justify-center h-96">
          <EmptyState
            message={t("class-details-tutor.empty-states.no-members")}
          />
        </div>
      );
    }

    return (
      <>
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
                    <span className="text-xs text-gray-500">
                      {" "}
                      {t("class-details-tutor.member.teacher")}
                    </span>
                  )}
                </div>
              </div>
              {user.uid === classData.adminId &&
                member.id !== classData.adminId && (
                  <button
                    onClick={() => {
                      setSelectedUser(member);
                      setShowRemoveConfirmation(true);
                    }}
                    className="px-3 py-1 text-xs text-red-500 border border-red-500 rounded-full hover:bg-red-50"
                  >
                    {t("class-details-tutor.actions.remove-member")}
                  </button>
                )}
            </div>
          ))}
        </div>
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
              {t("class-details-tutor.confirmations.remove-member.title", {
                name: selectedUser?.name,
              })}
            </h2>
            <p className="mb-6 text-gray-600">
              {t("class-details-tutor.confirmations.remove-member.message")}
            </p>
            <div className="flex flex-row gap-2">
              <button
                className="w-full py-2 font-medium border border-gray-300 rounded-full hover:bg-gray-50"
                onClick={() => setShowRemoveConfirmation(false)}
              >
                {t("class-details-tutor.actions.cancel")}
              </button>
              <button
                className="w-full py-2 font-medium text-black bg-[#ff4d4d] rounded-full hover:bg-[#ff3333] border border-[#8b0000]"
                onClick={() => handleRemoveUser(selectedUser.id)}
                disabled={isRemoving}
              >
                {isRemoving
                  ? t(
                      "class-details-tutor.confirmations.remove-member.removing"
                    )
                  : t(
                      "class-details-tutor.confirmations.remove-member.confirm"
                    )}{" "}
              </button>
            </div>
          </div>
        </Modal>
      </>
    );
  };
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
            {t("class-details-tutor.actions.close")}
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
                  aria-label={t("class-details-tutor.actions.back")}
                >
                  <ArrowLeft size="30" />
                </button>
                <h1 className="text-4xl font-semibold">
                  {t("class-details-tutor.title")}
                </h1>
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
                        />{" "}
                        <span className=" text-md">{classData.language}</span>
                      </div>{" "}
                      <span className="px-3 py-[2px] bg-yellow-200 rounded-full text-md">
                        {classData.languageLevel}
                      </span>
                      {isClassOngoing() && (
                        <span className=" px-2 sm:px-3 py-1 text-xs sm:text-sm bg-[#B9F9C2BF]/75 backdrop-blur-sm rounded-full ">
                          Ongoing
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col mt-4 space-y-4">
                      {/* First Row */}
                      <div className="flex items-center justify-between space-x-12">
                        <div className="flex items-center gap-1">
                          <img alt="bammbuu" src="/svgs/clock.svg" />{" "}
                          <span className="text-sm">
                            {new Date(
                              classData.classDateTime.seconds * 1000
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
                              classData.classDateTime.seconds * 1000
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              timeZone: "UTC", // Ensure the time is displayed in UTC
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <img alt="bammbuu" src="/svgs/users.svg" />
                          {classData.classType === "Group Premium" ||
                          classData.classType === "Individual Premium" ? (
                            <>
                              {" "}
                              <span className="text-sm">
                                {classData.classMemberIds.length}
                              </span>
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
                            {classData.recurrenceTypes?.length > 0
                              ? classData.recurrenceTypes.join(", ")
                              : "None"}
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

                    <p className="my-6 text-gray-600">
                      {classData.classDescription}
                    </p>
                  </div>

                  <div className="w-full space-y-4">
                    <div className="space-y-1">
                      {" "}
                      <h1 className="text-xl font-semibold">
                        {classData.classType === "Group Premium" ||
                        classData.classType === "Individual Premium"
                          ? t("class-details-tutor.class-info.instructor")
                          : t("class-details-tutor.class-info.group")}
                      </h1>
                      <ClassInfoCard
                        classData={classData}
                        groupTutor={groupTutor}
                      />
                    </div>
                    <button
                      className="w-full px-4 py-2 text-black bg-[#ffbf00] border border-black rounded-full hover:bg-[#ffbf00]"
                      onClick={handleJoinClass}
                    >
                      {t("class-details-tutor.actions.join-class")}
                    </button>
                    <button
                      className="w-full px-4 py-2 text-black bg-white border border-black rounded-full"
                      onClick={() => navigate(`/edit-class/${classId}`)}
                    >
                      {t("class-details-tutor.actions.edit-class")}
                    </button>
                    <button
                      className="w-full px-4 py-2 text-red-500 border border-red-500 rounded-full"
                      onClick={() => setShowDeleteConfirmation(true)}
                    >
                      {t("class-details-tutor.actions.delete-class")}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col flex-1 min-h-0">
                <div className="flex flex-row items-center justify-between mb-6">
                  <button
                    className="px-6 py-2 text-black bg-yellow-400 rounded-full"
                    onClick={() => setActiveTab("Members")}
                  >
                    {t("class-details-tutor.tabs.members", {
                      count: members.length,
                    })}
                  </button>
                </div>

                <div className="overflow-y-auto ">{renderMembers()}</div>
                {classData.classType === "Individual Premium" ? (
                  <>
                    <div className="pt-6 space-y-4">
                      <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                        <h2 className="text-lg font-semibold md:text-xl">
                          {t("class-details.slots.title")}
                        </h2>
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
                  </>
                ) : (
                  <></>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
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
            {t("class-details-tutor.confirmations.delete-class.title")}
          </h2>
          <p className="mb-6 text-gray-600">
            {t("class-details-tutor.confirmations.delete-class.message")}
          </p>
          <div className="flex flex-row gap-2">
            <button
              className="w-full py-2 font-medium border border-gray-300 rounded-full hover:bg-gray-50"
              onClick={() => setShowDeleteConfirmation(false)}
            >
              {t("class-details-tutor.actions.cancel")}
            </button>
            <button
              className="w-full py-2 font-medium text-black bg-[#ff4d4d] rounded-full hover:bg-[#ff3333] border border-[#8b0000]"
              onClick={handleDeleteClass}
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

export default ClassDetailsTutor;
