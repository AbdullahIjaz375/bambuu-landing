import { useState, useEffect, useRef } from "react";
import { ArrowLeft, ChevronRightIcon } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { useTranslation } from "react-i18next";
import { createStreamChannel } from "../../services/streamService";
import { db } from "../../firebaseConfig";
import { ClipLoader } from "react-spinners";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ClassCard from "../../components/ClassCard";
import ExploreClassCard from "../../components/ExploreClassCard";
import EmptyState from "../../components/EmptyState";
import ShowDescription from "../../components/ShowDescription";
import { streamClient, fetchChatToken, ChannelType } from "../../config/stream";
import { getExamPrepStepStatus } from "../../api/examPrepApi";
import BookingFlowModal from "../../components/BookingFlowModal";

const InstructorProfileUser = () => {
  const { tutorId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [tutor, setTutor] = useState(null);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const channelRef = useRef(null);
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [stepStatusLoading, setStepStatusLoading] = useState(false);
  const [stepStatusError, setStepStatusError] = useState(null);
  const [
    hasBookedExamPrepClassWithOtherTutor,
    setHasBookedExamPrepClassWithOtherTutor,
  ] = useState(true);
  const [showBookingFlowModal, setShowBookingFlowModal] = useState(false);
  const [bookingFlowMode, setBookingFlowMode] = useState("intro");
  const [bookingFlowStep, setBookingFlowStep] = useState(0);
  const [selectedInstructor, setSelectedInstructor] = useState(null);

  // Helper to extract YouTube embed URL
  function getYouTubeEmbedUrl(url) {
    if (!url) return null;
    const regExp =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(regExp);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  }

  // Refactored Exam Prep click handler for onboarding logic
  const handleExamPrepClick = async () => {
    setStepStatusLoading(true);
    setStepStatusError(null);
    try {
      const res = await getExamPrepStepStatus(user.uid, tutorId);

      // 1. No active plan
      if (!res.hasPurchasedPlan) {
        navigate("/subscriptions?tab=exam");
        return;
      }

      // 2. No intro call with this tutor
      if (!res.hasBookedIntroCall) {
        setBookingFlowMode("intro");
        setBookingFlowStep(2); // Go to profile step with this tutor
        setSelectedInstructor(tutor);
        setShowBookingFlowModal(true);
        return;
      }
      // 3. Intro call booked but not completed
      if (res.hasBookedIntroCall && !res.doneWithIntroCall) {
        setBookingFlowMode("intro");
        setBookingFlowStep(4); // Confirmation step
        setSelectedInstructor(tutor);
        setShowBookingFlowModal(true);
        return;
      }
      // 4. Intro call completed, no exam prep class booked
      if (res.doneWithIntroCall && !res.hasBookedExamPrepClass) {
        setBookingFlowMode("exam");
        setBookingFlowStep(6); // Exam prep start step
        setSelectedInstructor(tutor);
        setShowBookingFlowModal(true);
        return;
      }
      // 5. Exam prep class booked
      if (res.hasBookedExamPrepClass) {
        navigate(`/examPreparationUser/${tutorId}`);
        return;
      }
    } catch (err) {
      console.error(
        "[ExamPrep][InstructorProfileUser] getExamPrepStepStatus error:",
        err,
      );
      setStepStatusError(err.message || "Failed to check exam prep status.");
    } finally {
      setStepStatusLoading(false);
    }
  };

  const sendMessageClicked = async () => {
    if (isCreatingChannel) return;
    setIsCreatingChannel(true);
    try {
      let otherUserName = "";
      let otherUserImage = "";
      let isTutor = user.userType === "tutor";
      if (isTutor) {
        const studentDoc = await getDoc(doc(db, "students", user.uid));
        otherUserName = studentDoc.exists()
          ? studentDoc.data().name
          : "Student";
        otherUserImage = studentDoc.exists() ? studentDoc.data().photoUrl : "";
      } else {
        otherUserName = tutor?.name || "Tutor";
        otherUserImage = tutor?.photoUrl || "";
      }
      const channelId = `${user.uid}${tutorId}`;
      const channelName = otherUserName;
      const memberRoles = [
        { user_id: user.uid, role: "member" },
        { user_id: tutorId, role: "member" },
      ];
      const channelData = {
        id: channelId,
        type: ChannelType.ONE_TO_ONE_CHAT,
        members: [user.uid, tutorId],
        name: channelName,
        image: otherUserImage,
        description: "",
        created_by_id: user.uid,
        member_roles: memberRoles,
      };

      if (streamClient.userID !== user.uid || !streamClient.isConnected) {
        const token = await fetchChatToken(user.uid);
        if (streamClient.userID) {
          await streamClient.disconnectUser();
        }
        await streamClient.connectUser(
          {
            id: user.uid,
            name: user.name || "",
            image: user.photoUrl || "",
            userType: user.userType || "student",
          },
          token,
        );
      }

      if (channelRef.current && channelRef.current.id === channelId) {
        navigate(`/messagesUser/${channelId}`);
        setIsCreatingChannel(false);
        return;
      }

      const channel = await createStreamChannel(channelData);
      channelRef.current = channel;

      let found = false;
      for (let i = 0; i < 5; i++) {
        const channels = await streamClient.queryChannels(
          { members: { $in: [user.uid] }, id: { $eq: channel.id } },
          { last_message_at: -1 },
          { watch: true, state: true },
        );
        if (channels.length > 0) {
          found = true;
          break;
        }
        await new Promise((res) => setTimeout(res, 500));
      }

      const currentMembers = Object.keys(channel.state?.members || {});
      const missingMembers = [user.uid, tutorId].filter(
        (m) => !currentMembers.includes(m),
      );
      if (missingMembers.length > 0) {
        await channel.addMembers(missingMembers);
      }

      navigate(`/messagesUser/${channel.id}`);
    } catch (error) {
      console.error("Error creating chat channel:", error);
    } finally {
      setIsCreatingChannel(false);
    }
  };

  useEffect(() => {
    const fetchTutorAndClasses = async () => {
      try {
        setLoading(true);
        const tutorDoc = await getDoc(doc(db, "tutors", tutorId));
        if (!tutorDoc.exists()) {
          throw new Error("Tutor not found");
        }
        const tutorData = { id: tutorDoc.id, ...tutorDoc.data() };
        setTutor(tutorData);

        const tutorClasses = tutorData.tutorOfClasses || [];
        if (tutorClasses.length > 0) {
          const classesPromises = tutorClasses.map((classId) =>
            getDoc(doc(db, "classes", classId)),
          );
          const classSnapshots = await Promise.all(classesPromises);
          const classesData = classSnapshots
            .filter((doc) => doc.exists())
            .map((doc) => ({ classId: doc.id, ...doc.data() }));
          setClasses(classesData);
        } else {
          setClasses([]);
        }
      } catch (err) {
        console.error("Error fetching tutor data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (tutorId) {
      fetchTutorAndClasses();
    }
  }, [tutorId]);

  const handleBack = () => {
    navigate("/languageExpertsUser");
  };

  const renderClasses = () => {
    // Get user and enrolled classes once
    const user = JSON.parse(sessionStorage.getItem("user"));
    const enrolledClasses = user?.enrolledClasses || [];

    // Filter out classes with type "exam_prep" or "introductory_call"
    let availableClasses = classes.filter((classItem) => {
      if (
        classItem.classType === "exam_prep" ||
        classItem.classType === "introductory_call"
      ) {
        return false;
      }
      if (
        classItem.classType === "Individual Premium" &&
        classItem.classMemberIds?.length > 0
      ) {
        return false;
      }
      if (
        classItem.classType === "Group Premium" &&
        classItem.availableSpots <= 0
      ) {
        return false;
      }
      return true;
    });

    // Premium group one-time class filtering (hide for non-enrolled users if <12h left)
    const now = Date.now();
    const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
    availableClasses = availableClasses.filter((classItem) => {
      const isEnrolled = enrolledClasses.includes(classItem.classId);
      const isPremium = classItem.classType === "Group Premium";
      const isOneTime =
        (Array.isArray(classItem.recurrenceTypes) &&
          classItem.recurrenceTypes.includes("One-time")) ||
        classItem.selectedRecurrenceType === "One-time";
      const classStart = classItem.classDateTime?.seconds
        ? classItem.classDateTime.seconds * 1000
        : null;
      const startsInLessThan12Hours =
        classStart && classStart - now < TWELVE_HOURS_MS;
      if (!isEnrolled && isPremium && isOneTime && startsInLessThan12Hours) {
        return false;
      }
      return true;
    });

    // Sort availableClasses by class start time (earliest first)
    availableClasses.sort((a, b) => {
      const aTime = a.classDateTime?.seconds
        ? a.classDateTime.seconds
        : Infinity;
      const bTime = b.classDateTime?.seconds
        ? b.classDateTime.seconds
        : Infinity;
      return aTime - bTime;
    });

    if (availableClasses.length === 0) {
      return (
        <div className="flex h-96 items-center justify-center">
          <EmptyState message="No classes available" />
        </div>
      );
    }

    return (
      <div className="ml-2 mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {availableClasses.map((classItem) => {
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

  useEffect(() => {
    const fetchExamPrepStatus = async () => {
      if (!user?.uid || !tutorId) return;
      try {
        const res = await getExamPrepStepStatus(user.uid, tutorId);
        setHasBookedExamPrepClassWithOtherTutor(
          res.hasBookedExamPrepClassWithOtherTutor,
        );
      } catch (err) {
        setHasBookedExamPrepClassWithOtherTutor(false); // fallback
      }
    };
    fetchExamPrepStatus();
  }, [user?.uid, tutorId]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <div className="flex flex-1 items-center justify-center">
          <ClipLoader color="#14B82C" size={50} />
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
            onClick={handleBack}
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!tutor) {
    return null;
  }

  return (
    <div className="flex h-screen">
      <div className="m-2 flex flex-1 rounded-3xl border sm:m-6">
        <div className="scrollbar-hide flex h-full w-full flex-col rounded-3xl bg-white p-3 sm:mx-4 sm:p-6">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                className="rounded-full bg-gray-100 p-2 sm:p-3"
                onClick={handleBack}
              >
                <ArrowLeft size={24} />
              </button>
              <h1 className="text-2xl font-semibold sm:text-4xl">
                {t("instructor-profile.title")}
              </h1>
            </div>
          </div>

          {/* Content Container */}
          <div className="flex h-full min-h-0 flex-1 flex-col gap-4 lg:flex-row">
            {/* Sidebar */}
            <div className="flex h-full max-h-[calc(100vh-48px)] w-full flex-col overflow-y-auto lg:w-1/4">
              <div className="flex w-full max-w-[420px] flex-shrink-0 flex-col items-center overflow-y-auto rounded-3xl bg-[#E6FDE9] p-6">
                <img
                  src={tutor.photoUrl || "/images/panda.png"}
                  alt={tutor.name}
                  className="mb-4 h-32 w-32 rounded-full border-4 border-white object-cover shadow"
                />
                <h3 className="mb-2 text-center text-xl font-semibold">
                  {tutor.name}
                </h3>
                <div className="mb-4 text-center text-[15px] leading-snug text-gray-700">
                  {tutor.bio}
                </div>
                <div className="mb-4 mt-2 grid w-full grid-cols-2 gap-x-4 gap-y-2 text-[15px]">
                  <div className="flex items-center gap-1">
                    <img
                      alt="native"
                      src="/svgs/language.svg"
                      className="h-4"
                    />
                    <span>
                      <span className="font-semibold">Native:</span>{" "}
                      {tutor.nativeLanguage}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <img alt="from" src="/svgs/location.svg" className="h-4" />
                    <span>
                      <span className="font-semibold">From:</span>{" "}
                      {tutor.country}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <img
                      alt="teaching"
                      src="/svgs/language.svg"
                      className="h-4"
                    />
                    <span>
                      <span className="font-semibold">Teaching:</span>{" "}
                      {tutor.teachingLanguage}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <img alt="students" src="/svgs/users.svg" className="h-4" />
                    <span>
                      <span className="font-semibold">Students:</span>{" "}
                      {tutor.tutorStudentIds?.length || 0}
                    </span>
                  </div>
                </div>
                {/* Video Section */}
                {tutor.videoLink ? (
                  <div className="mb-4 w-full">
                    <div className="flex min-h-[200px] w-full items-center justify-center rounded-2xl bg-[#eaeaea] text-2xl font-medium text-[#b3b3b3] sm:min-h-[220px] sm:rounded-[2rem] lg:h-[220px]">
                      <iframe
                        width="100%"
                        height="100%"
                        style={{
                          minHeight: 200,
                          minWidth: 200,
                          aspectRatio: "16/9",
                          borderRadius: "1rem",
                        }}
                        src={getYouTubeEmbedUrl(tutor.videoLink)}
                        title="Tutor introduction video"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      ></iframe>
                    </div>
                    <div className="mt-2 w-full text-center">
                      <span className="text-sm font-normal italic text-[#5D5D5D] sm:text-base">
                        Watch {tutor.name?.split(" ")[0] || "the tutor"}'s
                        introduction video.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 flex h-32 w-full items-center justify-center rounded-xl bg-[#F5F5F5] text-base text-gray-400">
                    No introduction video available.
                  </div>
                )}
                <button
                  onClick={sendMessageClicked}
                  className="mt-auto w-full rounded-full border border-black bg-[#fffbc5] px-4 py-3 text-base font-normal text-black shadow transition hover:bg-[#fff9a0]"
                  style={{ borderWidth: 2 }}
                  disabled={isCreatingChannel}
                >
                  {isCreatingChannel ? (
                    <span className="flex items-center justify-center">
                      <ClipLoader color="#14B82C" size={18} className="mr-2" />
                      {t("instructor-profile.buttons.send-message")}
                    </span>
                  ) : (
                    t("instructor-profile.buttons.send-message")
                  )}
                </button>
              </div>
              {/* Exam Preparation Program Button OUTSIDE the green box */}
              <button
                className="mt-4 flex w-full max-w-[420px] items-center justify-between rounded-2xl border border-[#FFBF00] bg-[#FFFFEA] px-6 py-4 text-left text-black shadow transition hover:bg-[#fff9a0]"
                onClick={handleExamPrepClick}
                disabled={stepStatusLoading}
                style={{
                  opacity:
                    stepStatusLoading || hasBookedExamPrepClassWithOtherTutor
                      ? 0.6
                      : 1,
                  pointerEvents:
                    stepStatusLoading || hasBookedExamPrepClassWithOtherTutor
                      ? "none"
                      : "auto",
                }}
              >
                <div className="flex items-center gap-3">
                  <img
                    src="/svgs/preparation-package-icon.svg"
                    alt="Exam"
                    className="h-16 w-16"
                  />
                  <span className="text-base font-semibold">
                    Exam Preparation Program
                  </span>
                  {stepStatusLoading && (
                    <ClipLoader color="#14B82C" size={18} className="ml-2" />
                  )}
                </div>
                <ChevronRightIcon className="h-4 w-4" />
              </button>
              {stepStatusError && (
                <div className="mt-2 max-w-[420px] text-sm text-red-500">
                  {stepStatusError}
                </div>
              )}
            </div>
            {/* Main content */}
            <div className="flex min-h-0 flex-1 flex-col">
              <h2 className="ml-4 text-xl font-semibold sm:text-2xl">
                {t("instructor-profile.sections.classes")}
              </h2>
              <div className="scrollbar-hide flex-1 overflow-y-auto pr-2 sm:pr-4">
                {renderClasses()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <BookingFlowModal
        isOpen={showBookingFlowModal}
        onClose={() => {
          setShowBookingFlowModal(false);
          setBookingFlowStep(0);
          setBookingFlowMode("intro");
          setSelectedInstructor(null);
        }}
        user={{
          ...user,
          ...(bookingFlowMode === "exam"
            ? { completedIntroCallTutorId: tutorId }
            : {}),
        }}
        mode={bookingFlowMode}
        initialStep={bookingFlowStep}
        selectedInstructor={selectedInstructor}
        setSelectedInstructor={setSelectedInstructor}
      />
    </div>
  );
};

export default InstructorProfileUser;
