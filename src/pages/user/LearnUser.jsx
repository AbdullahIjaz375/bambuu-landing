import { useRef, useEffect, useCallback, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import {
  getExamPrepPlanTimeline,
  getStudentExamPrepTutorialStatus,
} from "../../api/examPrepApi";
import { db } from "../../firebaseConfig";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { ClipLoader } from "react-spinners";
import { getToken } from "firebase/messaging";
import { messaging } from "../../firebaseConfig";
import EmptyState from "../../components/EmptyState";
import CalendarUser from "../../components/CalenderUser";
import BookingFlowModal from "../../components/BookingFlowModal";
import NotificationDropdown from "../../components/NotificationDropdown";
import ClassCard from "../../components/ClassCard";
import GroupCard from "../../components/GroupCard";
import Sidebar from "../../components/Sidebar";

const LanguageCardsSection = ({ languageCards, languageData, navigate }) => {
  const containerRef = useRef(null);
  const leftArrowRef = useRef(null);
  const rightArrowRef = useRef(null);

  const updateArrows = useCallback(() => {
    const container = containerRef.current;
    const leftArrow = leftArrowRef.current;
    const rightArrow = rightArrowRef.current;
    if (container && leftArrow && rightArrow) {
      leftArrow.style.display = container.scrollLeft > 20 ? "block" : "none";
      rightArrow.style.display =
        container.scrollLeft + container.clientWidth + 20 >=
        container.scrollWidth
          ? "none"
          : "block";
    }
  }, []);

  const scrollLeft = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: -300, behavior: "smooth" });
      setTimeout(updateArrows, 300);
    }
  }, [updateArrows]);

  const scrollRight = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: 300, behavior: "smooth" });
      setTimeout(updateArrows, 300);
    }
  }, [updateArrows]);

  useEffect(() => {
    updateArrows();
    window.addEventListener("resize", updateArrows);
    return () => window.removeEventListener("resize", updateArrows);
  }, [updateArrows]);

  return (
    <div className="flex flex-col">
      <div
        ref={leftArrowRef}
        className="absolute left-0 top-1/2 z-10 -translate-y-1/2"
        style={{ display: "none" }}
      >
        <button
          className="ml-4 flex h-12 w-12 items-center justify-center rounded-full border bg-white shadow-2xl hover:bg-gray-100"
          onClick={scrollLeft}
        >
          <ChevronLeft size={30} color="#14B82C" />
        </button>
      </div>
      <div
        ref={rightArrowRef}
        className="absolute right-0 top-1/2 z-10 -translate-y-1/2"
      >
        <button
          className="mr-4 flex h-12 w-12 items-center justify-center rounded-full border bg-white shadow-2xl hover:bg-gray-100"
          onClick={scrollRight}
        >
          <ChevronRight size={30} color="#14B82C" />
        </button>
      </div>
      <div
        ref={containerRef}
        className="flex gap-4 overflow-x-auto px-4 pb-4"
        onScroll={updateArrows}
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {languageCards.map((card) => {
          const students =
            languageData[card.id]?.studentPhotos?.slice(0, 8) || [];
          const studentCount = languageData[card.id]?.studentIds?.length || 0;
          return (
            <div
              key={card.id}
              className={`flex items-center gap-3 p-4 hover:cursor-pointer ${card.bgColor} rounded-3xl border ${card.borderColor} w-[250px] flex-shrink-0 sm:w-[380px]`}
              onClick={() => navigate(card.path)}
            >
              <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full sm:h-20 sm:w-20">
                <img
                  src={card.imgSrc}
                  alt={card.alt}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-col items-start justify-between space-y-2">
                <span className="whitespace-nowrap text-xl font-semibold">
                  {card.title}
                </span>
                <div className="flex items-center">
                  <div className="relative flex">
                    {students.map((photo, i) => (
                      <div
                        key={i}
                        className="-mr-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-white sm:h-8 sm:w-8"
                        style={{ zIndex: students.length - i }}
                      >
                        <img
                          src={photo || "/images/panda.png"}
                          alt={`Student ${i + 1}`}
                          className={`h-full w-full rounded-full object-cover${photo ? "" : "opacity-75"}`}
                        />
                      </div>
                    ))}
                    {studentCount > students.length && (
                      <div className="ml-2 flex min-w-8 items-center justify-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                        +{studentCount - students.length}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <style jsx global>{`
        div[ref="containerRef"]::-webkit-scrollbar {
          width: 0;
          height: 0;
          display: none;
        }
        div[ref="containerRef"] {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

const LearnUser = () => {
  const { user, setUser, loading: authLoading } = useAuth();
  const [showRenewalBanner, setShowRenewalBanner] = useState(false);
  const [examPrepStatus, setExamPrepStatus] = useState(false);
  const [showIntroBookingFlow, setShowIntroBookingFlow] = useState(false);
  const [showExamPrepBookingFlow, setShowExamPrepBookingFlow] = useState(false);
  const [showSidebarIntroBookingFlow, setShowSidebarIntroBookingFlow] =
    useState(false);
  const [showSidebarExamPrepBookingFlow, setShowSidebarExamPrepBookingFlow] =
    useState(false);
  const [sidebarExamPrepInitialStep, setSidebarExamPrepInitialStep] =
    useState(0);
  const [sidebarExamPrepUser, setSidebarExamPrepUser] = useState(null);
  const [languageData, setLanguageData] = useState({
    spanish: { studentIds: [], studentPhotos: [] },
    english: { studentIds: [], studentPhotos: [] },
    exchange: { studentIds: [], studentPhotos: [] },
  });
  const [loadingLanguages, setLoadingLanguages] = useState(true);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [errorGroups, setErrorGroups] = useState(null);
  const [nextClass, setNextClass] = useState(null);
  const [examPrepCredits, setExamPrepCredits] = useState(null);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [examPrepBookingInitialStep, setExamPrepBookingInitialStep] =
    useState(6);

  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { currentLanguage, changeLanguage } = useLanguage();

  // --- Data Refresh Function ---
  const refreshData = async () => {
    // Fetch credits and renewal banner
    if (user?.uid) {
      try {
        const timeline = await getExamPrepPlanTimeline(user.uid);
        if (timeline?.activePlan) {
          setExamPrepCredits(
            Array.isArray(timeline.activePlan.credits)
              ? timeline.activePlan.credits.length
              : 0,
          );
          if (!timeline?.nextPlan && timeline.activePlan.expiryDate) {
            const expiry = new Date(timeline.activePlan.expiryDate);
            const now = new Date();
            const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
            setShowRenewalBanner(diffDays <= 5 && diffDays >= 0);
          } else {
            setShowRenewalBanner(false);
          }
        } else {
          setExamPrepCredits(0);
          setShowRenewalBanner(false);
        }
      } catch {
        setExamPrepCredits(0);
        setShowRenewalBanner(false);
      }
    }
    // Fetch classes
    if (user && user.enrolledClasses) {
      setLoading(true);
      const classesData = [];
      try {
        for (const classId of user.enrolledClasses) {
          const classRef = doc(db, "classes", classId);
          const classDoc = await getDoc(classRef);
          if (classDoc.exists()) {
            const classData = classDoc.data();
            classesData.push({ id: classId, ...classData });
          }
        }
        setClasses(classesData);
      } catch (error) {
        setError(
          "Unable to fetch classes at this time. Please try again later.",
        );
      } finally {
        setLoading(false);
      }
    }
    // Fetch language cards data
    try {
      setLoadingLanguages(true);
      const classesSnapshot = await getDocs(collection(db, "classes"));
      const tempLanguageData = {
        spanish: { studentIds: new Set(), studentPhotos: [] },
        english: { studentIds: new Set(), studentPhotos: [] },
        exchange: { studentIds: new Set(), studentPhotos: [] },
      };
      for (const classDoc of classesSnapshot.docs) {
        const classData = classDoc.data();
        const language = classData.language;
        const classMemberIds = classData.classMemberIds || [];
        if (language === "Spanish") {
          classMemberIds.forEach((id) =>
            tempLanguageData.spanish.studentIds.add(id),
          );
        } else if (language === "English") {
          classMemberIds.forEach((id) =>
            tempLanguageData.english.studentIds.add(id),
          );
        } else if (language === "English-Spanish") {
          classMemberIds.forEach((id) =>
            tempLanguageData.exchange.studentIds.add(id),
          );
        }
      }
      tempLanguageData.spanish.studentIds = Array.from(
        tempLanguageData.spanish.studentIds,
      );
      tempLanguageData.english.studentIds = Array.from(
        tempLanguageData.english.studentIds,
      );
      tempLanguageData.exchange.studentIds = Array.from(
        tempLanguageData.exchange.studentIds,
      );
      for (const langKey of ["spanish", "english", "exchange"]) {
        const studentIds = tempLanguageData[langKey].studentIds.slice(0, 12);
        const photoPromises = studentIds.map(async (studentId) => {
          const studentRef = doc(db, "students", studentId);
          const studentDoc = await getDoc(studentRef);
          return studentDoc.exists() ? studentDoc.data().photoUrl || "" : "";
        });
        tempLanguageData[langKey].studentPhotos =
          await Promise.all(photoPromises);
      }
      setLanguageData(tempLanguageData);
    } catch (error) {
      console.error("Error fetching classes or students:", error);
    } finally {
      setLoadingLanguages(false);
    }
  };

  // --- Effects ---
  useEffect(() => {
    refreshData();
  }, [user]);

  useEffect(() => {
    const fetchGroups = async () => {
      if (!user?.joinedGroups?.length) {
        setLoadingGroups(false);
        return;
      }
      try {
        const fetchedGroups = [];
        for (let groupId of user.joinedGroups) {
          const groupRef = doc(db, "groups", groupId);
          const groupDoc = await getDoc(groupRef);
          if (groupDoc.exists()) {
            fetchedGroups.push({ id: groupDoc.id, ...groupDoc.data() });
          }
        }
        setGroups(fetchedGroups);
        setErrorGroups(null);
      } catch (error) {
        console.error("Error fetching groups:", error);
        setErrorGroups("Failed to load groups. Please try again.");
      } finally {
        setLoadingGroups(false);
      }
    };
    fetchGroups();
  }, [user]);

  useEffect(() => {
    const calculateNextClass = () => {
      if (!classes || classes.length === 0) return null;
      const now = new Date();
      let closestClass = null;
      let smallestTimeDiff = Infinity;
      classes.forEach((classItem) => {
        const classTime = classItem.classDateTime?.toDate();
        if (classTime && classTime > now) {
          const timeDiff = classTime - now;
          if (timeDiff < smallestTimeDiff) {
            smallestTimeDiff = timeDiff;
            closestClass = {
              ...classItem,
              timeUntil: formatTimeUntil(timeDiff),
              startTime: classTime,
            };
          }
        }
      });
      return closestClass;
    };
    const formatTimeUntil = (milliseconds) => {
      const hours = Math.floor(milliseconds / (1000 * 60 * 60));
      const minutes = Math.floor(
        (milliseconds % (1000 * 60 * 60)) / (1000 * 60),
      );
      if (hours > 24) {
        const days = Math.floor(hours / 24);
        return `${days} day${days > 1 ? "s" : ""} away`;
      } else if (hours > 0) {
        return `${hours} hour${hours > 1 ? "s" : ""} and ${minutes} minutes away`;
      } else {
        return `${minutes} minute${minutes > 1 ? "s" : ""} away`;
      }
    };
    const updateNextClass = () => setNextClass(calculateNextClass());
    updateNextClass();
    const interval = setInterval(updateNextClass, 60000);
    return () => clearInterval(interval);
  }, [classes]);

  useEffect(() => {
    const updateFCMToken = async () => {
      try {
        const currentToken = await getToken(messaging, {
          vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY,
        });
        if (currentToken && user) {
          await updateDoc(doc(db, "students", user.uid), {
            fcmToken: currentToken,
          });
          const sessionUser = JSON.parse(sessionStorage.getItem("user"));
          sessionUser.fcmToken = currentToken;
          sessionStorage.setItem("user", JSON.stringify(sessionUser));
          setUser((prev) => ({ ...prev, fcmToken: currentToken }));
        }
      } catch (error) {
        console.error("Error updating FCM token:", error);
      }
    };
    if (user?.uid) updateFCMToken();
  }, []);

  const handleOnboarding = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const status = await getStudentExamPrepTutorialStatus(user.uid);
      if (!status.hasPurchasedPlan) {
        navigate("/subscriptions?tab=exam");
        return;
      }

      // If intro call not booked, show intro booking flow
      if (!status.hasBookedIntroCall) {
        setShowIntroBookingFlow(true);
        return;
      }

      // If intro call booked but not done, show intro booking flow
      if (status.hasBookedIntroCall && !status.doneWithIntroCall) {
        setShowIntroBookingFlow(true);
        return;
      }

      // If intro call done but exam prep class not booked, show exam prep booking flow
      if (status.doneWithIntroCall && !status.hasBookedExamPrepClass) {
        setExamPrepBookingInitialStep(6);
        setShowExamPrepBookingFlow(true);
        return;
      }
    } catch (err) {
      console.error(
        "[ExamPrep][LearnUser] getStudentExamPrepTutorialStatus error:",
        err,
      );
    }
  }, [user, navigate]);

  useEffect(() => {
    // This handles a flow where navigation state explicitly asks to show the modal.
    if (location.state?.showIntroBookingFlow) {
      setShowIntroBookingFlow(true);
      // Clear the state from history so it doesn't trigger again on refresh
      window.history.replaceState({}, document.title);
      return; // Exit early and don't run the automatic check
    }

    const runOnboardingCheck = async () => {
      // Run this check only once per browser session to avoid nagging the user.
      if (sessionStorage.getItem("onboardingCheckHasRun")) {
        return;
      }

      if (user?.uid) {
        // Set the flag before the async call to prevent race conditions on re-renders.
        sessionStorage.setItem("onboardingCheckHasRun", "true");
        try {
          const timeline = await getExamPrepPlanTimeline(user.uid);

          // If there's an active plan...
          if (timeline?.activePlan) {
            // ...and the introductory call hasn't been booked...
            const isIntroCallBooked =
              (timeline.activePlan.introductoryCallId?.length || 0) > 0;

            if (!isIntroCallBooked) {
              // ...then trigger the full onboarding flow logic.
              handleOnboarding();
            }
          }
        } catch (error) {
          console.error("Onboarding check failed:", error);
          // If the check fails, remove the flag so it can try again on the next page load.
          sessionStorage.removeItem("onboardingCheckHasRun");
        }
      }
    };

    runOnboardingCheck();
  }, [user, handleOnboarding, location.state]);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const status = await getStudentExamPrepTutorialStatus(user.uid);
        setExamPrepStatus(status);
      } catch {
        setExamPrepStatus(null);
      }
    };
    fetchStatus();
  }, [user.uid]);

  // Place the auth loading and user check here, after all hooks
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <ClipLoader color="#14B82C" size={50} />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.name || !user?.email) {
    return <Navigate to="/userEditProfile" replace />;
  }

  // --- Language Cards ---
  const languageCards = [
    {
      id: "spanish",
      bgColor: "bg-[#fff0f1]",
      borderColor: "border-[#d58287]",
      imgSrc: "/svgs/spain-big.svg",
      alt: "Spanish",
      title: t("learnUser.languageLearning.languages.spanish"),
      path: "/learnLanguageUser?language=Spanish",
      firestoreLanguage: "Spanish",
    },
    {
      id: "english",
      bgColor: "bg-[#edf2ff]",
      borderColor: "border-[#768bbd]",
      imgSrc: "/svgs/us-big.svg",
      alt: "English",
      title: t("learnUser.languageLearning.languages.english"),
      path: "/learnLanguageUser?language=English",
      firestoreLanguage: "English",
    },
    {
      id: "exchange",
      bgColor: "bg-[#FFFFEA]",
      borderColor: "border-[#FFED46]",
      imgSrc: "/svgs/eng-spanish.svg",
      alt: "English-Spanish Exchange",
      title: t("learnUser.languageLearning.languages.exchange"),
      path: "/learnLanguageUser?language=English-Spanish",
      firestoreLanguage: "English-Spanish",
    },
  ];

  // --- Render ---
  return (
    <div className="flex h-screen bg-white">
      <div className="h-full w-64 flex-shrink-0">
        <Sidebar user={user} />
      </div>
      <div className="h-full min-w-[calc(100%-16rem)] flex-1 overflow-x-auto">
        <div className="m-2 h-[calc(100vh-1rem)] overflow-y-auto rounded-3xl border-2 border-[#e7e7e7] bg-white p-8">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between border-b border-[#e7e7e7] pb-4">
            <div className="flex flex-row items-center space-x-4">
              <h1 className="text-3xl font-semibold">
                {t("learnUser.welcome.greeting", { name: user.name })}
              </h1>
              <p className="whitespace-nowrap text-lg text-[#616161]">
                {t("learnUser.welcome.question")}{" "}
                {nextClass
                  ? t("learnUser.welcome.nextClass.upcoming", {
                      className: nextClass.className,
                      timeUntil: nextClass.timeUntil,
                    })
                  : t("learnUser.welcome.nextClass.none")}
              </p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              <div
                onClick={() => navigate("/subscriptions")}
                className="flex cursor-pointer flex-col items-center justify-center rounded-full border border-[#14B82C] bg-[#E6FDE9] p-2 transition-colors hover:bg-[#d4fad9]"
              >
                <h1 className="text-xs font-semibold">
                  {examPrepCredits !== null ? examPrepCredits : "--"}
                </h1>
                <h1 className="text-[10px]">{t("learnUser.credits.label")}</h1>
              </div>
              <NotificationDropdown />
            </div>
          </div>

          {/* Renewal/Onboarding Banner */}
          {showRenewalBanner ? (
            <div className="mb-6 flex w-full items-center justify-between rounded-3xl border border-[#B0B0B0] bg-white px-6 py-3">
              <div className="flex items-center gap-3">
                <img
                  src="/svgs/preparation-package-icon.svg"
                  alt="Renewal"
                  className="h-10 w-10"
                />
                <span className="text-base font-normal text-[#454545]">
                  You're making excellent progress with your exam prep. Continue
                  your journey by unlocking Month 2 for even better results.
                </span>
              </div>
              <button
                className="rounded-3xl border border-[#5D5D5D] bg-[#E6FDE9] px-5 py-2 text-base font-medium text-[#042F0C] transition hover:bg-[#E6FDE9]"
                onClick={() => navigate("/subscriptions?tab=exam")}
              >
                Continue
              </button>
            </div>
          ) : (
            // Onboarding Banner (always show)
            <div className="mb-6 flex w-full items-center justify-between rounded-3xl border border-[#B0B0B0] bg-white px-6 py-3">
              <div className="flex items-center gap-3">
                <img
                  src="/svgs/preparation-package-icon.svg"
                  alt="Onboarding"
                  className="h-10 w-10"
                />
                <span className="text-base font-normal text-[#454545]">
                  {examPrepStatus?.hasPurchasedPlan
                    ? "You purchased exam prep package. Let's complete your onboarding process!"
                    : "Achieve exam success and true language fluency with our all-in-one immersive program."}
                </span>
              </div>
              <button
                className="rounded-3xl border border-[#5D5D5D] bg-[#E6FDE9] px-5 py-2 text-base font-medium text-[#042F0C] transition hover:bg-[#E6FDE9]"
                onClick={() => {
                  if (
                    examPrepStatus?.hasBookedExamPrepClass &&
                    examPrepStatus?.completedIntroCallTutorId
                  ) {
                    navigate(
                      `/examPreparationUser/${examPrepStatus.completedIntroCallTutorId}`,
                    );
                  } else if (!examPrepStatus?.hasPurchasedPlan) {
                    navigate("/subscriptions?tab=exam");
                  } else {
                    handleOnboarding();
                  }
                }}
              >
                {examPrepStatus?.hasPurchasedPlan
                  ? "Complete Onboarding"
                  : "Learn More"}
              </button>
            </div>
          )}
          {/* Calendar and Language Learning Section */}
          <div className="mb-4 flex w-full flex-col items-start justify-between gap-4 py-4 lg:flex-row">
            <div className="mb-4 w-full lg:mb-0 lg:w-[40%]">
              <CalendarUser />
            </div>
            <div className="w-full lg:w-[60%]">
              <div className="mb-3">
                <div className="ml-5 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                  <h2 className="text-xl font-bold sm:text-2xl">
                    {t("learnUser.languageLearning.title")}
                  </h2>
                  <button
                    className="w-full rounded-full border border-[#5d5d5d] bg-[#e6fde9] px-4 py-2 text-base font-medium text-[#042f0c] hover:bg-[#ccfcd2] sm:w-auto"
                    onClick={() => navigate("/languages")}
                  >
                    {t("learnUser.languageLearning.viewAll")}
                  </button>
                </div>
              </div>
              <div className="relative w-full overflow-hidden">
                {loadingLanguages ? (
                  <div className="flex h-48 items-center justify-center">
                    <ClipLoader color="#14B82C" size={50} />
                  </div>
                ) : (
                  <LanguageCardsSection
                    languageCards={languageCards}
                    languageData={languageData}
                    navigate={navigate}
                  />
                )}
              </div>
            </div>
          </div>
          {/* My Classes Section */}
          <div className="mx-auto mb-8 w-full max-w-[165vh]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {t("learnUser.classes.title")}
              </h2>
              {classes.length > 0 && (
                <button
                  className="rounded-full border border-[#5d5d5d] bg-[#e6fde9] px-4 py-2 text-base font-medium text-[#042f0c] hover:bg-[#ccfcd2]"
                  onClick={() => navigate("/classesUser")}
                >
                  {t("learnUser.classes.viewAll")}
                </button>
              )}
            </div>
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <ClipLoader color="#14B82C" size={50} />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center space-y-4 rounded-lg bg-white p-8">
                <p className="text-center text-red-500">{error}</p>
                <button
                  className="rounded-full border border-[#5d5d5d] bg-[#e6fde9] px-4 py-2 text-base font-medium text-[#042f0c] hover:bg-[#ccfcd2]"
                  onClick={() => window.location.reload()}
                >
                  {t("learnUser.classes.error.tryAgain")}
                </button>
              </div>
            ) : classes.length === 0 ? (
              <div className="flex flex-col items-center justify-center space-y-4 rounded-lg bg-white p-8">
                <EmptyState message="You have not booked a class yet!" />
                <button
                  className="rounded-full border border-[#5d5d5d] bg-[#e6fde9] px-4 py-2 text-base font-medium text-[#042f0c] hover:bg-[#ccfcd2]"
                  onClick={() => navigate("/learnLanguageUser")}
                >
                  {t("learnUser.classes.empty.action")}
                </button>
              </div>
            ) : (
              <div className="relative w-full">
                <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-4">
                  {classes.map((classItem) => (
                    <div
                      key={classItem.id}
                      className="w-72 flex-none px-1 pt-3"
                    >
                      <ClassCard
                        {...classItem}
                        isBammbuu={Boolean(classItem.tutorId)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* My Groups Section */}
          <div className="mx-auto w-full max-w-[165vh]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {t("learnUser.groups.title")}
              </h2>
              {groups.length > 0 && (
                <button
                  className="rounded-full border border-[#5d5d5d] bg-[#e6fde9] px-4 py-2 text-base font-medium text-[#042f0c] hover:bg-[#ccfcd2]"
                  onClick={() => navigate("/groupsUser")}
                >
                  {t("learnUser.groups.viewAll")}
                </button>
              )}
            </div>
            {loadingGroups ? (
              <div className="flex h-48 items-center justify-center">
                <ClipLoader color="#14B82C" size={50} />
              </div>
            ) : errorGroups ? (
              <div className="flex flex-col items-center justify-center space-y-4 rounded-lg bg-white p-8">
                <p className="text-center text-red-500">{errorGroups}</p>
                <button
                  className="rounded-full border border-[#5d5d5d] bg-[#e6fde9] px-4 py-2 text-base font-medium text-[#042f0c] hover:bg-[#ccfcd2]"
                  onClick={() => window.location.reload()}
                >
                  {t("learnUser.groups.error.tryAgain")}
                </button>
              </div>
            ) : groups.length === 0 ? (
              <div className="flex flex-col items-center justify-center space-y-4 rounded-lg bg-white p-8">
                <EmptyState message="You are not part of any group yet!" />
                <div className="flex flex-row items-center justify-center space-x-4">
                  <button
                    onClick={() => navigate("/learnLanguageUser")}
                    className="rounded-full border border-[#5d5d5d] bg-[#e6fde9] px-4 py-2 text-base font-medium text-[#042f0c] hover:bg-[#ccfcd2]"
                  >
                    {t("learnUser.groups.empty.joinAction")}
                  </button>
                  <button
                    onClick={() => navigate("/groupsUser")}
                    className="rounded-full border border-[#5d5d5d] bg-[#e6fde9] px-4 py-2 text-base font-medium text-[#042f0c] hover:bg-[#ccfcd2]"
                  >
                    {t("learnUser.groups.empty.createAction")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative w-full">
                <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-4">
                  {groups.map((group) => (
                    <div key={group.id} className="w-72 flex-none px-1 pt-2">
                      <GroupCard group={group} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <BookingFlowModal
        isOpen={showIntroBookingFlow}
        onClose={() => {
          setShowIntroBookingFlow(false);
          setSelectedInstructor(null); // Reset instructor when modal is closed
        }}
        user={user}
        mode="intro"
        selectedInstructor={selectedInstructor}
        setSelectedInstructor={setSelectedInstructor}
        onBookingComplete={refreshData}
      />
      <BookingFlowModal
        isOpen={showExamPrepBookingFlow}
        onClose={() => {
          setShowExamPrepBookingFlow(false);
          setExamPrepBookingInitialStep(6); // Reset to initial step when modal is closed
        }}
        user={{
          ...user,
          completedIntroCallTutorId: examPrepStatus?.completedIntroCallTutorId,
        }}
        mode="exam"
        initialStep={examPrepBookingInitialStep}
        selectedInstructor={selectedInstructor}
        setSelectedInstructor={setSelectedInstructor}
        onBookingComplete={refreshData}
      />
      {/* Sidebar-triggered modals */}
      <BookingFlowModal
        isOpen={showSidebarIntroBookingFlow}
        onClose={() => {
          setShowSidebarIntroBookingFlow(false);
          setSidebarExamPrepInitialStep(0); // Reset to initial step when modal is closed
          setSelectedInstructor(null); // Reset instructor when modal is closed
        }}
        user={sidebarExamPrepUser}
        mode="intro"
        initialStep={sidebarExamPrepInitialStep}
        selectedInstructor={selectedInstructor}
        setSelectedInstructor={setSelectedInstructor}
        onBookingComplete={refreshData}
      />
      <BookingFlowModal
        isOpen={showSidebarExamPrepBookingFlow}
        onClose={() => {
          setShowSidebarExamPrepBookingFlow(false);
          setSidebarExamPrepInitialStep(0); // Reset to initial step when modal is closed
          setSelectedInstructor(null); // Reset instructor when modal is closed
        }}
        user={sidebarExamPrepUser}
        mode="exam"
        initialStep={sidebarExamPrepInitialStep}
        selectedInstructor={selectedInstructor}
        setSelectedInstructor={setSelectedInstructor}
        onBookingComplete={refreshData}
      />
    </div>
  );
};

export default LearnUser;
