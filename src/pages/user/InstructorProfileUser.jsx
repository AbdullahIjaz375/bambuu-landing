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
import { ChannelType } from "../../config/stream";
import EmptyState from "../../components/EmptyState";
import ShowDescription from "../../components/ShowDescription";
import { streamClient, fetchChatToken } from "../../config/stream";
import InstructorProfile from "./InstructorProfile";

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
  const [bookTutor, setBookTutor] = useState(false);

  // Function to check if user has exam preparation subscription
  const hasExamPrepSubscription = () => {
    if (!user?.subscriptions) return false;

    return user.subscriptions.some((sub) => {
      if (!sub.startDate || !sub.endDate || sub.type === "None") return false;

      // Check if subscription is still active
      const endDate = new Date(
        sub.endDate.seconds ? sub.endDate.seconds * 1000 : sub.endDate,
      );
      const isActive = endDate > new Date();

      // Check if it's an exam preparation subscription
      const isExamPrep =
        sub.type === "Immersive Exam Prep Plan" ||
        sub.type === "Exam Preparation" ||
        sub.type.toLowerCase().includes("exam");

      return isActive && isExamPrep;
    });
  };

  const getInstructorProfileData = (tutor) => ({
    img: tutor.photoUrl || "/images/panda.png",
    name: tutor.name,
    langs: [
      (tutor.nativeLanguage || "") + " (Native)",
      (tutor.teachingLanguage || "") + " (Teaching)",
    ],
    country: tutor.country,
    students: tutor.tutorStudentIds?.length || 0,
  });

  // Handle exam preparation package click
  const handleExamPrepClick = () => {
    if (hasExamPrepSubscription()) {
      // incase user has permissions write logics here
    } else {
      // User doesn't have subscription, redirect to subscription page with exam tab
      navigate("/subscriptions?tab=exam");
      // setBookTutor(true);
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
    navigate(-1);
  };

  const renderClasses = () => {
    const availableClasses = classes.filter((classItem) => {
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

    if (availableClasses.length === 0) {
      return (
        <div className="flex h-96 items-center justify-center">
          <EmptyState message="No classes available" />
        </div>
      );
    }

    const user = JSON.parse(sessionStorage.getItem("user"));
    const enrolledClasses = user?.enrolledClasses || [];

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
        <div className="mx-2 flex w-full flex-col rounded-3xl bg-white p-3 sm:mx-4 sm:p-6">
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
          <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
            {/* Sidebar */}
            <div className="flex w-full flex-col lg:w-1/4">
              <div className="scrollbar-hide flex flex-col items-center gap-4 overflow-y-auto rounded-3xl bg-[#E6FDE9] p-5 lg:h-full">
                <img
                  src={tutor.photoUrl || "/images/panda.png"}
                  alt={tutor.name}
                  className="mb-4 h-28 w-28 rounded-full border-4 border-white object-cover shadow"
                />
                <h3 className="mb-2 text-xl font-semibold sm:text-2xl">
                  {tutor.name}
                </h3>
                <div className="mb-4 mt-2 flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
                  <div className="flex items-center gap-1 text-xs sm:text-sm">
                    <img
                      alt="language"
                      src="/svgs/language.svg"
                      className="h-4 sm:h-5"
                    />
                    <span>
                      <span className="font-semibold">
                        {t("instructor-profile.details.native.label")}:
                      </span>{" "}
                      {tutor.nativeLanguage}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs sm:text-sm">
                    <img
                      alt="teaching"
                      src="/svgs/language.svg"
                      className="h-4 sm:h-5"
                    />
                    <span>
                      <span className="font-semibold">
                        {t("instructor-profile.details.teaching.label")}:
                      </span>{" "}
                      {tutor.teachingLanguage}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs sm:text-sm">
                    <img
                      alt="location"
                      src="/svgs/location.svg"
                      className="h-4 sm:h-5"
                    />
                    <span>
                      <span className="font-semibold">
                        {t("instructor-profile.details.from.label")}:
                      </span>{" "}
                      {tutor.country}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs sm:text-sm">
                    <img
                      alt="students"
                      src="/svgs/users.svg"
                      className="h-4 sm:h-5"
                    />
                    <span>
                      <span className="font-semibold">
                        {t("instructor-profile.details.students.label")}:
                      </span>{" "}
                      {tutor.tutorStudentIds.length}
                    </span>
                  </div>
                </div>
                <div className="mb-4 mt-2 w-full">
                  <ShowDescription description={tutor.bio} maxHeight={100} />
                </div>
                <button
                  onClick={sendMessageClicked}
                  className="mt-2 w-full rounded-full border border-black bg-[#fffbc5] px-4 py-3 text-base font-normal text-black shadow transition hover:bg-[#fff9a0]"
                  style={{ borderWidth: 2 }}
                >
                  {t("instructor-profile.buttons.send-message")}
                </button>
              </div>
              {/* Exam Preparation Package Button BELOW the green box */}
              <div className="mt-6 flex w-full items-center justify-center">
                <div className="w-full">
                  <button className="flex w-full items-center justify-between rounded-2xl border border-[#FFBF00] bg-[#FFFFEA] px-6 py-4 text-left text-black shadow transition hover:bg-[#fff9a0]">
                    <div
                      onClick={handleExamPrepClick}
                      className="flex items-center gap-3"
                    >
                      <img
                        src="/svgs/preparation-package-icon.svg"
                        alt="Exam"
                        className="h-16 w-16"
                      />
                      <span className="text-base font-semibold">
                        Exam Preparation Package
                      </span>
                    </div>
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
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
      <InstructorProfile
        selectedInstructor={bookTutor ? getInstructorProfileData(tutor) : null}
        setSelectedInstructor={() => setBookTutor(false)}
      />
    </div>
  );
};

export default InstructorProfileUser;
