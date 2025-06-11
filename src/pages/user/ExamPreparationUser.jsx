import { ArrowLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ClipLoader } from "react-spinners";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { createStreamChannel } from "../../services/streamService";
import { streamClient, fetchChatToken, ChannelType } from "../../config/stream";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import ClassCard from "../../components/ClassCard";
import { getExamPrepStatus } from "../../api/examPrepApi";
import BookingFlowModal from "../../components/BookingFlowModal";

const ExamPreparationUser = () => {
  const { tutorId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tutor, setTutor] = useState(null);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [examPrepStatus, setExamPrepStatus] = useState(null);
  const [showExamPrepBookingFlow, setShowExamPrepBookingFlow] = useState(false);

  const channelRef = useRef(null);

  // Fetch tutor info and booked classes between this user and tutor
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch tutor info
        const tutorDoc = await getDoc(doc(db, "tutors", tutorId));
        if (!tutorDoc.exists()) throw new Error("Tutor not found");
        setTutor({ id: tutorDoc.id, ...tutorDoc.data() });

        // Fetch all classes where this user is a member and this tutor is the admin, and classType is exam_prep or introductory_call
        const q = query(
          collection(db, "classes"),
          where("adminId", "==", tutorId),
          where("classMemberIds", "array-contains", user.uid),
        );
        const snapshot = await getDocs(q);
        const filtered = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter(
            (c) =>
              c.classType === "exam_prep" ||
              c.classType === "introductory_call",
          );
        setClasses(filtered);
      } catch (err) {
        setTutor(null);
        setClasses([]);
      } finally {
        setLoading(false);
      }
    };
    if (tutorId && user?.uid) fetchData();
  }, [tutorId, user?.uid]);

  // Fetch exam prep status
  useEffect(() => {
    const fetchExamPrepStatus = async () => {
      if (!user?.uid) return;
      try {
        const status = await getExamPrepStatus(user.uid);
        setExamPrepStatus(status);
      } catch (e) {
        setExamPrepStatus(null);
      }
    };
    fetchExamPrepStatus();
  }, [user?.uid]);

  // Helper values from API
  const activePlan = examPrepStatus?.activePlans?.[0] || {};
  const remainingClasses =
    typeof activePlan.credits?.length === "number"
      ? activePlan.credits.length
      : 0;
  const expiryDate = activePlan.expiryDate
    ? new Date(activePlan.expiryDate)
    : null;
  const nextPlanStart = examPrepStatus?.nextPlan?.purchaseDate
    ? new Date(examPrepStatus.nextPlan.purchaseDate)
    : null;
  // Send Message Functionality (same as InstructorProfileUser)
  const sendMessageClicked = async () => {
    if (isCreatingChannel || !tutor) return;
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
      const channelId = `${user.uid}${tutor.id}`;
      const channelName = otherUserName;
      const memberRoles = [
        { user_id: user.uid, role: "member" },
        { user_id: tutor.id, role: "member" },
      ];
      const channelData = {
        id: channelId,
        type: ChannelType.ONE_TO_ONE_CHAT,
        members: [user.uid, tutor.id],
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

      for (let i = 0; i < 5; i++) {
        const channels = await streamClient.queryChannels(
          { members: { $in: [user.uid] }, id: { $eq: channel.id } },
          { last_message_at: -1 },
          { watch: true, state: true },
        );
        if (channels.length > 0) break;
        await new Promise((res) => setTimeout(res, 500));
      }

      const currentMembers = Object.keys(channel.state?.members || {});
      const missingMembers = [user.uid, tutor.id].filter(
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

  // Loader covers the entire content area while loading
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <ClipLoader color="#14B82C" size={50} />
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <span className="text-lg text-gray-500">Tutor not found.</span>
      </div>
    );
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
                onClick={() => navigate(-1)}
              >
                <ArrowLeft size={24} />
              </button>
              <h1 className="text-2xl font-medium text-black">
                Exam Preparation Package
              </h1>
            </div>
            <div className="text-base font-normal text-[#454545]">
              Need to purchase more classes?{" "}
              <span className="cursor-pointer text-base font-bold text-[#14B82C]">
                Buy Now!
              </span>
            </div>
          </div>

          {/* Content Container */}
          <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
            {/* Sidebar */}
            <div className="flex w-full max-w-[420px] flex-shrink-0 flex-col items-center rounded-3xl bg-[#E6FDE9] p-6">
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
                  <img alt="native" src="/svgs/language.svg" className="h-4" />
                  <span>
                    <span className="font-semibold">Native:</span>{" "}
                    {tutor.nativeLanguage}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <img alt="from" src="/svgs/location.svg" className="h-4" />
                  <span>
                    <span className="font-semibold">From:</span> {tutor.country}
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
              <div className="mb-4 flex h-32 w-full items-center justify-center rounded-xl bg-[#F5F5F5] text-base text-gray-400">
                Video Section
              </div>
              <button
                onClick={sendMessageClicked}
                className="mt-auto w-full rounded-full border border-black bg-[#fffbc5] px-4 py-3 text-base font-normal text-black shadow transition hover:bg-[#fff9a0]"
                style={{ borderWidth: 2 }}
                disabled={isCreatingChannel}
              >
                {isCreatingChannel ? (
                  <span className="flex items-center justify-center">
                    <ClipLoader color="#14B82C" size={18} className="mr-2" />
                    Send Message
                  </span>
                ) : (
                  "Send Message"
                )}
              </button>
            </div>
            {/* Main Content */}
            <div className="flex flex-1 flex-col gap-6">
              {/* Top Cards */}
              <div className="flex w-full flex-wrap gap-4">
                <div className="flex min-w-[220px] flex-1 flex-col items-start justify-center rounded-2xl bg-[#DBFDDF] px-12 py-6">
                  <span className="text-[32px] font-semibold text-[#042F0C]">
                    {remainingClasses.toString().padStart(2, "0")}
                  </span>
                  <span className="mt-3 text-base font-medium text-[#3D3D3D]">
                    Remaining Classes
                  </span>
                </div>
                <div className="flex min-w-[220px] flex-1 flex-col items-start justify-center rounded-2xl bg-[#DBFDDF] px-12 py-6">
                  <span className="text-[32px] font-semibold text-[#042F0C]">
                    {expiryDate
                      ? expiryDate.toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                        })
                      : "--"}
                  </span>
                  <span className="mt-3 text-base font-medium text-[#3D3D3D]">
                    Current Plan Expires
                  </span>
                </div>
                <div className="flex min-w-[220px] flex-1 flex-col items-start justify-center rounded-2xl bg-[#DBFDDF] px-12 py-6">
                  <span className="text-[32px] font-semibold text-[#042F0C]">
                    {nextPlanStart
                      ? nextPlanStart.toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                        })
                      : "--"}
                  </span>
                  <span className="mt-3 text-base font-medium text-[#3D3D3D]">
                    Next Plan Starts
                  </span>
                </div>
              </div>
              {/* Progress & Unlock */}
              {expiryDate &&
              (expiryDate - new Date()) / (1000 * 60 * 60 * 24) <= 10 ? (
                <div className="flex items-center gap-4 rounded-3xl border border-[#B0B0B0] bg-white px-4 py-2">
                  <div className="flex items-center text-sm font-medium">
                    <img
                      src="/svgs/preparation-package-icon.svg"
                      alt="Exam"
                      className="mr-1 h-10 w-10"
                    />
                    <span className="text-base font-normal text-[#454545]">
                      You're making excellent progress with your exam prep.
                      Continue your journey by unlocking Month 2 for even better
                      results.
                    </span>
                  </div>
                  <button className="ml-auto rounded-3xl border border-[#5D5D5D] bg-[#E6FDE9] px-6 py-2 text-base font-medium text-[#042F0C] shadow transition hover:bg-[#E6FDE9]">
                    Unlock Next Plan
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-4 rounded-3xl border border-[#B0B0B0] bg-white px-4 py-2">
                  <div className="flex items-center text-sm font-medium">
                    <img
                      src="/svgs/preparation-package-icon.svg"
                      alt="Exam"
                      className="mr-2 h-7 w-7"
                    />
                    <span className="text-base font-normal text-[#454545]">
                      You can book {remainingClasses} more classes until{" "}
                      {expiryDate?.toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "long",
                      })}
                      .
                    </span>
                  </div>
                  <button
                    className="ml-auto rounded-3xl border border-[#5D5D5D] bg-[#E6FDE9] px-6 py-2 text-base font-medium text-[#042F0C] shadow transition hover:bg-[#E6FDE9]"
                    onClick={() => setShowExamPrepBookingFlow(true)}
                  >
                    Book Classes
                  </button>
                </div>
              )}
              {/* Booked Classes Cards */}
              <div className="flex flex-wrap gap-8">
                {classes.length === 0 ? (
                  <div className="text-gray-500">
                    No booked exam prep or intro call classes yet.
                  </div>
                ) : (
                  classes.map((c) => {
                    // Determine if class is done (past)
                    let isDone = false;
                    if (c.classDateTime?.seconds) {
                      const classDate = new Date(
                        c.classDateTime.seconds * 1000,
                      );
                      isDone = classDate < new Date();
                    }
                    return (
                      <div
                        key={c.id}
                        className={`${
                          isDone ? "pointer-events-none opacity-50" : ""
                        } flex-grow`}
                        style={{
                          minWidth: "260px",
                          maxWidth: "320px",
                          flexBasis: "268px",
                        }}
                      >
                        <ClassCard
                          {...c}
                          tutorName={tutor.name}
                          tutorImage={tutor.photoUrl}
                          examType={c.classType}
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <BookingFlowModal
        isOpen={showExamPrepBookingFlow}
        onClose={() => setShowExamPrepBookingFlow(false)}
        user={user}
        mode="exam"
        initialStep={6}
      />
    </div>
  );
};

export default ExamPreparationUser;
