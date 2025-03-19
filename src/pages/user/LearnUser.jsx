import { Search } from "lucide-react";
import NotificationDropdown from "../../components/NotificationDropdown";
import React, { useState, useEffect } from "react";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Users,
  BookOpen,
  Star,
  Database,
  UserCircle,
  User,
} from "lucide-react";
import Slider from "react-slick";
import Sidebar from "../../components/Sidebar";
import { useTranslation } from "react-i18next";
import ClassCard from "../../components/ClassCard";
import { useAuth } from "../../context/AuthContext";
import GroupCard from "../../components/GroupCard";
import { useNavigate, useLocation } from "react-router-dom";
import { db } from "../../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ClipLoader } from "react-spinners";
import { getToken } from "firebase/messaging";
import { messaging } from "../../firebaseConfig";
import EmptyState from "../../components/EmptyState";
import CalendarUser from "../../components/CalenderUser";
import TutorialOverlay from "../../components/TutorialOverlay";

const LearnUser = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const settings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: 4, // Show 4 cards at once
    slidesToScroll: 1,
    arrows: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };

  //---------------------------------getting my classes--------------------------------------------//

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClasses = async () => {
      if (!user || !user.enrolledClasses) {
        setLoading(false);
        return;
      }

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
        console.error("Error fetching classes:", error);
        setError(
          "Unable to fetch classes at this time. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [user]);

  //------------------------------------getting my groups-------------------------------------------//
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [errorGroups, setErrorGroups] = useState(null);

  useEffect(() => {
    const fetchGroups = async () => {
      if (!user?.joinedGroups?.length) {
        setLoadingGroups(false);
        return;
      }

      try {
        const fetchedGroups = [];
        const groupsToFetch = user.joinedGroups;

        for (let groupId of groupsToFetch) {
          const groupRef = doc(db, "groups", groupId);
          const groupDoc = await getDoc(groupRef);

          if (groupDoc.exists()) {
            fetchedGroups.push({
              id: groupDoc.id,
              ...groupDoc.data(),
            });
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

  //---------------------------time for next class---------------------------------------------------//

  const [nextClass, setNextClass] = useState(null);

  useEffect(() => {
    const calculateNextClass = () => {
      if (!classes || classes.length === 0) return null;

      const now = new Date();
      let closestClass = null;
      let smallestTimeDiff = Infinity;

      classes.forEach((classItem) => {
        // Get timestamp from classDateTime
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
        (milliseconds % (1000 * 60 * 60)) / (1000 * 60)
      );

      if (hours > 24) {
        const days = Math.floor(hours / 24);
        return `${days} day${days > 1 ? "s" : ""} away`;
      } else if (hours > 0) {
        return `${hours} hour${
          hours > 1 ? "s" : ""
        } and ${minutes} minutes away`;
      } else {
        return `${minutes} minute${minutes > 1 ? "s" : ""} away`;
      }
    };

    // Update next class every minute
    const updateNextClass = () => {
      setNextClass(calculateNextClass());
    };

    updateNextClass();
    const interval = setInterval(updateNextClass, 60000);

    return () => clearInterval(interval);
  }, [classes]);

  //----------------------------------updating FCMtoken--------------------------------------//

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

    if (user?.uid) {
      updateFCMToken();
    }
  }, []); // Empty dependency array to run on mount
  //------------------------------------------------------------------------------------------//

  return (
    <div className="flex h-screen bg-white">
      <div className="flex-shrink-0 w-64 h-full">
        <Sidebar user={user} />
        
      </div>

      <div className="flex-1 overflow-x-auto min-w-[calc(100%-16rem)] h-full">
        <div className="h-[calc(100vh-1rem)] p-8 bg-white border-2 border-[#e7e7e7] rounded-3xl m-2 overflow-y-auto">
        
          
          {/* Header with Welcome and Notification */}
          <div className="flex items-center justify-between mb-4 border-b border-[#e7e7e7] pb-4">
            <div className="flex flex-row items-center space-x-4">
              <h1 className="text-3xl font-semibold">
                {t("learnUser.welcome.greeting", { name: user.name })}
              </h1>{" "}
              <p className="text-[#616161] text-lg whitespace-nowrap">
                {t("learnUser.welcome.question")}{" "}
                {nextClass
                  ? t("learnUser.welcome.nextClass.upcoming", {
                      className: nextClass.className,
                      timeUntil: nextClass.timeUntil,
                    })
                  : t("learnUser.welcome.nextClass.none")}
              </p>
            </div>
            <div className="flex items-center flex-shrink-0 gap-2">
              <div
                onClick={() => navigate("/subscriptions")}
                className="flex flex-col items-center justify-center rounded-full bg-[#E6FDE9] border border-[#14B82C] p-2 cursor-pointer hover:bg-[#d4fad9] transition-colors"
              >
                <h1 className="text-xs font-semibold">{user.credits}</h1>
                <h1 className="text-[10px]">{t("learnUser.credits.label")}</h1>
              </div>
              <NotificationDropdown />
            </div>
          </div>

          {/* Calendar and Language Learning Section */}
          <div className="flex flex-col items-start justify-between w-full gap-4 py-4 mb-4 lg:flex-row ">
            {/* Calendar section with responsive width */}
            <div className="w-full lg:w-[40%] mb-4 lg:mb-0">
              <CalendarUser />
            </div>

            {/* Content section */}
            <div className="w-full lg:w-[60%]">
              <div className="mb-3">
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                  <h2 className="text-xl font-bold sm:text-2xl">
                    {t("learnUser.languageLearning.title")}
                  </h2>
                  <button
                    className="w-full sm:w-auto px-4 py-2 text-base border border-[#5d5d5d] font-medium text-[#042f0c] bg-[#e6fde9] rounded-full hover:bg-[#ccfcd2]"
                    onClick={() => navigate("/languages")}
                  >
                    {t("learnUser.languageLearning.viewAll")}
                  </button>
                </div>
              </div>

              {/* Card Container with responsive overflow handling */}
              <div className="w-full overflow-hidden">
                <div className="flex gap-2 pb-4 overflow-x-auto scrollbar-hide">
                  {/* Spanish Card */}
                  <div
                    className="flex items-center hover:cursor-pointer gap-2 p-4 bg-[#fff0f1] rounded-3xl border border-[#d58287] w-[250px] sm:w-[380px]   flex-shrink-0"
                    onClick={() =>
                      navigate("/learnLanguageUser?language=Spanish")
                    }
                  >
                    <div className="flex-shrink-0 w-12 h-12 overflow-hidden rounded-full sm:w-20 sm:h-20">
                      <img
                        src="/svgs/spain-big.svg"
                        alt="Spanish"
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="flex flex-col items-start justify-between space-y-2">
                      <span className="text-xl font-semibold ">
                        {t("learnUser.languageLearning.languages.spanish")}
                      </span>
                      <div className="flex items-center">
                        <div className="flex -space-x-3">
                          {Array(12).fill(null).map((_, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-center w-6 h-6 bg-white border-2 border-white rounded-full sm:w-8 sm:h-8"
                            >
                              <User className="w-4 h-4 text-gray-600 " />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Other language cards... */}
                  {/* English Card */}
                  <div
                    className="flex items-center hover:cursor-pointer gap-2 p-4 bg-[#edf2ff] rounded-3xl border border-[#768bbd] w-[250px] sm:w-[380px]   flex-shrink-0"
                    onClick={() =>
                      navigate("/learnLanguageUser?language=English")
                    }
                  >
                    <div className="flex-shrink-0 w-12 h-12 overflow-hidden rounded-full sm:w-20 sm:h-20">
                      <img
                        src="/svgs/us-big.svg"
                        alt="English"
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="flex flex-col items-start justify-between space-y-2">
                      <span className="text-xl font-semibold ">
                        {t("learnUser.languageLearning.languages.english")}
                      </span>
                      <div className="flex items-center">
                        <div className="flex -space-x-3">
                          {Array(12).fill(null).map((_, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-center w-6 h-6 bg-white border-2 border-white rounded-full sm:w-8 sm:h-8"
                            >
                              <User className="w-4 h-4 text-gray-600 " />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Exchange Card */}
                  <div
                    className="flex items-center hover:cursor-pointer gap-2 p-4 bg-[#FFFFEA] rounded-3xl border border-[#FFED46] w-[250px] sm:w-[380px]   flex-shrink-0"
                    onClick={() =>
                      navigate("/learnLanguageUser?language=English-Spanish")
                    }
                  >
                    <div className="flex-shrink-0 w-12 h-12 overflow-hidden rounded-full sm:w-20 sm:h-20">
                      <img
                        src="/svgs/eng-spanish.svg"
                        alt="English-Spanish Exchange"
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="flex flex-col items-start justify-between space-y-2">
                      <span className="text-xl font-semibold whitespace-nowrap">
                        {t("learnUser.languageLearning.languages.exchange")}
                      </span>
                      <div className="flex items-center">
                        <div className="flex -space-x-3">
                          {Array(12).fill(null).map((_, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-center w-6 h-6 bg-white border-2 border-white rounded-full sm:w-8 sm:h-8"
                            >
                              <User className="w-4 h-4 text-gray-600 " />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* My Classes Section */}
          <div className="w-full max-w-[165vh] mx-auto mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">
                {t("learnUser.classes.title")}
              </h2>
              {classes.length > 0 && (
                <button
                  className="px-4 py-2 text-base border border-[#5d5d5d] font-medium text-[#042f0c] bg-[#e6fde9] rounded-full hover:bg-[#ccfcd2]"
                  onClick={() => navigate("/classesUser")}
                >
                  {t("learnUser.classes.viewAll")}
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-48">
                <ClipLoader color="#14B82C" size={50} />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-white rounded-lg">
                <p className="text-center text-red-500">{error}</p>
                <button
                  className="px-4 py-2 text-base border border-[#5d5d5d] font-medium text-[#042f0c] bg-[#e6fde9] rounded-full hover:bg-[#ccfcd2]"
                  onClick={() => window.location.reload()}
                >
                  {t("learnUser.classes.error.tryAgain")}
                </button>
              </div>
            ) : classes.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-white rounded-lg">
                <EmptyState message="You have not booked a class yet!" />
                <button
                  className="px-4 py-2 text-base border border-[#5d5d5d] font-medium text-[#042f0c] bg-[#e6fde9] rounded-full hover:bg-[#ccfcd2]"
                  onClick={() => navigate("/learnLanguageUser")}
                >
                  {t("learnUser.classes.empty.action")}
                </button>
              </div>
            ) : (
              <div className="relative w-full">
                <div className="flex gap-2 pb-4 overflow-x-auto scrollbar-hide">
                  {classes.map((classItem) => (
                    <div
                      key={classItem.id}
                      className="flex-none px-1 pt-3 w-72"
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
          <div className="w-full max-w-[165vh] mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">
                {t("learnUser.groups.title")}
              </h2>
              {groups.length > 0 && (
                <button
                  className="px-4 py-2 text-base border border-[#5d5d5d] font-medium text-[#042f0c] bg-[#e6fde9] rounded-full hover:bg-[#ccfcd2]"
                  onClick={() => navigate("/groupsUser")}
                >
                  {t("learnUser.groups.viewAll")}
                </button>
              )}
            </div>

            {loadingGroups ? (
              <div className="flex items-center justify-center h-48">
                <ClipLoader color="#14B82C" size={50} />
              </div>
            ) : errorGroups ? (
              <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-white rounded-lg">
                <p className="text-center text-red-500">{errorGroups}</p>
                <button
                  className="px-4 py-2 text-base border border-[#5d5d5d] font-medium text-[#042f0c] bg-[#e6fde9] rounded-full hover:bg-[#ccfcd2]"
                  onClick={() => window.location.reload()}
                >
                  {t("learnUser.groups.error.tryAgain")}
                </button>
              </div>
            ) : groups.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-white rounded-lg">
                <EmptyState message="You are not part of any group yet!" />
                <div className="flex flex-row items-center justify-center space-x-4">
                  <button
                    onClick={() => navigate("/learnLanguageUser")}
                    className="px-4 py-2 text-base border border-[#5d5d5d] font-medium text-[#042f0c] bg-[#e6fde9] rounded-full hover:bg-[#ccfcd2]"
                  >
                    {t("learnUser.groups.empty.joinAction")}
                  </button>
                  <button
                    onClick={() => navigate("/groupsUser")}
                    className="px-4 py-2 text-base border border-[#5d5d5d] font-medium text-[#042f0c] bg-[#e6fde9] rounded-full hover:bg-[#ccfcd2]"
                  >
                    {t("learnUser.groups.empty.createAction")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative w-full">
                <div className="flex gap-2 pb-4 overflow-x-auto scrollbar-hide">
                  {groups.map((group) => (
                    <div key={group.id} className="flex-none px-1 pt-2 w-72">
                      <GroupCard group={group} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearnUser;
