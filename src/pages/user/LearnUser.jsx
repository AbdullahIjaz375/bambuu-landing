// // src/pages/user/LearnUser.js
// import React, { useState, useEffect } from "react";
// import { auth } from "../../firebaseConfig";
// import { signOut } from "firebase/auth";
// import { useNavigate } from "react-router-dom";
// import { toast } from "react-toastify";
// import { Button, Paper, TextInput } from "@mantine/core";
// import Navbar from "../../components/Navbar";
// import { useAuth } from "../../context/AuthContext"; // Import useAuth
// import { IoSearchOutline } from "react-icons/io5";
// import Footer from "../../components/Footer";
// import {
//   collection,
//   addDoc,
//   serverTimestamp,
//   doc,
//   updateDoc,
// } from "firebase/firestore"; // Import Firestore functions
// import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
// import { db, storage } from "../../firebaseConfig";
// import Modal from "react-modal";

// Modal.setAppElement("#root");

// const LearnUser = () => {
//   const navigate = useNavigate();
//   const { user, setUser } = useAuth(); // Get the user from AuthContext

//   const handleLogout = async () => {
//     try {
//       await signOut(auth);
//       toast.success("Logged out successfully!");
//       navigate("/"); // Redirect to login after logout
//     } catch (error) {
//       toast.error("Error during logout");
//       console.error("Error during logout:", error);
//     }
//   };

//   const classesData = [
//     {
//       title: "Abdullah’s Spanish Conversation Class",
//       description:
//         "Master key concepts and boost retention with our interactive flashcards feature.",
//       imageUrl: "/images/landing-card-1.png",
//     },
//     {
//       title: "Bryson’s English Conversation Class",
//       description:
//         "Join live webinars conducted by subject matter experts, where they delve into specific topics, and answer questions from participants.",
//       imageUrl: "/images/landing-card-2.png",
//     },
//     {
//       title: "Arham language exchange class.",
//       description:
//         "Participate in live Q&A sessions with experienced educators who are available to address your queries & to encourage active learning",
//       imageUrl: "/images/landing-card-3.png",
//     },
//     {
//       title: "Abdullah’s Spanish Conversation Class",
//       description:
//         "Master key concepts and boost retention with our interactive flashcards feature.",
//       imageUrl: "/images/landing-card-1.png",
//     },
//     {
//       title: "Bryson’s English Conversation Class",
//       description:
//         "Join live webinars conducted by subject matter experts, where they delve into specific topics, and answer questions from participants.",
//       imageUrl: "/images/landing-card-2.png",
//     },
//     {
//       title: "Arham language exchange class.",
//       description:
//         "Participate in live Q&A sessions with experienced educators who are available to address your queries & to encourage active learning",
//       imageUrl: "/images/landing-card-3.png",
//     },
//   ];

//   const groupsData = [
//     {
//       title: "Abdullah’s Spanish | Exchange Group",
//       description:
//         "Master key concepts and boost retention with our interactive flashcards feature.",
//       imageUrl: "/images/landing-card-1.png",
//     },
//     {
//       title: "Bryson’s English | Spanish Exchange Group",
//       description:
//         "Join live webinars conducted by subject matter experts, where they delve into specific topics, and answer questions from participants.",
//       imageUrl: "/images/landing-card-2.png",
//     },
//     {
//       title: "Arham language exchange group.",
//       description:
//         "Participate in live Q&A sessions with experienced educators who are available to address your queries & to encourage active learning",
//       imageUrl: "/images/landing-card-3.png",
//     },
//     {
//       title: "Abdullah’s Spanish | Exchange Group",
//       description:
//         "Master key concepts and boost retention with our interactive flashcards feature.",
//       imageUrl: "/images/landing-card-1.png",
//     },
//     {
//       title: "Bryson’s English | Spanish Exchange Group",
//       description:
//         "Join live webinars conducted by subject matter experts, where they delve into specific topics, and answer questions from participants.",
//       imageUrl: "/images/landing-card-2.png",
//     },
//     {
//       title: "Arham language exchange group.",
//       description:
//         "Participate in live Q&A sessions with experienced educators who are available to address your queries & to encourage active learning",
//       imageUrl: "/images/landing-card-3.png",
//     },
//   ];

//   const coursesData = [
//     {
//       imageUrl: "/images/recourse1.png", // Replace with the actual image path or URL
//       title: "English Conversation Guide",
//       author: "Prof. Samuel Thompson",
//       price: "₹699",
//       badge: "Bestseller",
//     },
//     {
//       imageUrl: "/images/recourse2.png", // Replace with the actual image path or URL
//       title: "English Conversation Guide",
//       author: "Prof. Samuel Thompson",
//       price: "₹699",
//       badge: "Bestseller",
//     },
//     {
//       imageUrl: "/images/recourse3.png", // Replace with the actual image path or URL
//       title: "English Conversation Guide",
//       author: "Prof. Samuel Thompson",
//       price: "₹699",
//       badge: "Bestseller",
//     },
//     {
//       imageUrl: "/images/recourse1.png", // Replace with the actual image path or URL
//       title: "English Conversation Guide",
//       author: "Prof. Samuel Thompson",
//       price: "₹699",
//       badge: "Bestseller",
//     },
//     {
//       imageUrl: "/images/recourse2.png", // Replace with the actual image path or URL
//       title: "English Conversation Guide",
//       author: "Prof. Samuel Thompson",
//       price: "₹699",
//       badge: "Bestseller",
//     },
//   ];
//   const instructors = [
//     { id: 1, img: "/images/ins-1.png" },
//     { id: 2, img: "/images/ins-2.png" },
//     { id: 3, img: "/images/ins-3.png" },
//     { id: 4, img: "/images/ins-4.png" },
//     { id: 5, img: "/images/ins-5.png" },
//     { id: 6, img: "/images/ins-6.png" },
//     { id: 7, img: "/images/ins-7.png" },
//     { id: 8, img: "/images/ins-1.png" },
//     { id: 9, img: "/images/ins-2.png" },
//     { id: 10, img: "/images/ins-3.png" },
//     { id: 11, img: "/images/ins-4.png" },
//     { id: 12, img: "/images/ins-5.png" },
//     { id: 13, img: "/images/ins-6.png" },
//     { id: 14, img: "/images/ins-7.png" },
//     { id: 15, img: "/images/ins-1.png" },
//     { id: 16, img: "/images/ins-2.png" },
//   ];

//   return (
//     <>
//       <Navbar user={user} />
//       <div>
//         {/* My Classes Section */}
//         <div className="relative flex flex-col items-center justify-center w-full px-2 pt-10 pb-10 md:pt-10 md:pb-20">
//           <div className="max-w-3xl p-4 space-y-6 text-center md:max-w-5xl md:p-8 md:space-y-10">
//             <h1 className="mb-0 text-4xl md:text-6xl font-bold text-[#444444]">
//               My Classes
//             </h1>
//           </div>

//           <Button
//             onClick={() => navigate("/classesUser")}
//             className=""
//             variant="filled"
//             color="green"
//           >
//             Show More
//           </Button>
//           <div className="flex items-center justify-start w-full gap-6 py-5 space-x-6 overflow-x-auto max-w-[170vh] md:py-10 pl-6 scrollbar-hide">
//             {classesData.map((card, index) => (
//               <div
//                 key={index}
//                 className="flex-shrink-0 w-64 overflow-hidden transition-transform duration-300 transform bg-white rounded-lg shadow-md md:w-80 hover:scale-105 hover:shadow-lg"
//               >
//                 <img
//                   className="object-cover w-full h-40 sm:h-48 md:h-56 lg:h-64"
//                   src={card.imageUrl}
//                   alt={card.title}
//                 />
//                 <div className="flex flex-col justify-between h-40 p-4 sm:h-44 md:h-48 lg:h-52">
//                   <div>
//                     <h2 className="mb-2 text-base font-semibold sm:text-lg md:text-xl lg:text-2xl">
//                       {card.title}
//                     </h2>
//                     <p className="mb-4 text-xs text-gray-600 sm:text-sm md:text-md truncate-text">
//                       {card.description}
//                     </p>
//                   </div>
//                   <a
//                     href="#"
//                     className="text-sm font-bold text-green-600 hover:underline md:text-lg lg:text-xl"
//                   >
//                     Visit
//                   </a>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* My Groups Section */}
//         <div className="relative flex flex-col items-center justify-center w-full px-2 pt-10 pb-10 md:pt-10 md:pb-20">
//           <div className="flex items-center justify-between w-full max-w-3xl p-4 md:max-w-5xl md:p-8">
//             <h1 className="text-4xl font-bold text-[#444444] cursor-pointer md:text-6xl">
//               My Groups
//             </h1>

//             <Button
//               className="flex items-end justify-end"
//               variant="filled"
//               color="green"
//               onClick={() => navigate("/groupsUser")}
//             >
//               Show More
//             </Button>
//           </div>

//           <div className="flex items-center justify-start w-full gap-6 py-5 space-x-6 overflow-x-auto max-w-[170vh] md:py-10 pl-6 scrollbar-hide">
//             {groupsData.map((card, index) => (
//               <div
//                 key={index}
//                 className="flex-shrink-0 w-64 overflow-hidden transition-transform duration-300 transform bg-white rounded-lg shadow-md md:w-80 hover:scale-105 hover:shadow-lg"
//               >
//                 <img
//                   className="object-cover w-full h-40 sm:h-48 md:h-56 lg:h-64"
//                   src={card.imageUrl}
//                   alt={card.title}
//                 />
//                 <div className="flex flex-col justify-between h-40 p-4 sm:h-44 md:h-48 lg:h-52">
//                   <div>
//                     <h2 className="mb-2 text-base font-semibold sm:text-lg md:text-xl lg:text-2xl">
//                       {card.title}
//                     </h2>
//                     <p className="mb-4 text-xs text-gray-600 sm:text-sm md:text-md truncate-text">
//                       {card.description}
//                     </p>
//                   </div>
//                   <a
//                     href="#"
//                     className="text-sm font-bold text-green-600 hover:underline md:text-lg lg:text-xl"
//                   >
//                     Open
//                   </a>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//       <Footer />
//     </>
//   );
// };

// export default LearnUser;

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
import Sidebar from "../../components/Sidebar";
import ClassCard from "../../components/ClassCard";
import { useAuth } from "../../context/AuthContext";
import GroupCard from "../../components/GroupCard";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ClipLoader } from "react-spinners";
import { getToken } from "firebase/messaging";
import { messaging } from "../../firebaseConfig";
const LearnUser = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

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

  //--------------------------------------learning language----------------------------------//

  const students = Array(12).fill(null); // 8 student icons per language

  //------------------------------------calender-------------------------------------------//

  const [date, setDate] = useState(new Date());
  const [view, setView] = useState("weekly");

  // Get current week dates
  const getWeekDates = (current) => {
    const week = [];
    const first = current.getDate() - current.getDay() + 1;

    for (let i = 0; i < 7; i++) {
      const day = new Date(current.getTime());
      day.setDate(first + i);
      week.push(day);
    }
    return week;
  };

  // Format date for header
  const formatHeader = (date) => {
    const month = date
      .toLocaleString("default", { month: "long" })
      .toUpperCase();
    const year = date.getFullYear();
    return `${month}, ${year}`;
  };

  // Navigate weeks
  const navigateWeek = (direction) => {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + (direction === "next" ? 7 : -7));
    setDate(newDate);
  };

  // Navigate months
  const navigateMonth = (direction) => {
    const newDate = new Date(date);
    newDate.setMonth(date.getMonth() + (direction === "next" ? 1 : -1));
    setDate(newDate);
  };

  // Check if date is today
  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const weekDates = getWeekDates(date);

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
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <Sidebar user={user} />

      {/* Main Content */}
      <div className="flex-1 p-8 bg-white border-2 border-[#e7e7e7] rounded-3xl ml-[17rem] m-2">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 border-b border-[#e7e7e7] pb-4">
          <div className="flex flex-row items-center space-x-4">
            <h1 className="text-3xl font-semibold">Hi, {user.name}!</h1>
            <p className="text-[#616161] text-lg">
              How are you today?{" "}
              {nextClass
                ? `Your next class "${nextClass.className}" is ${nextClass.timeUntil}`
                : "You have no upcoming classes"}
            </p>
          </div>
          <div className="flex items-center gap-4 ">
            <div className="relative">
              <div className="relative">
                <input
                  type="search"
                  placeholder="Search classes, instructors or groups"
                  className="py-2 pl-10 pr-4 border border-gray-200 rounded-full w-96"
                />
                <Search
                  className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2"
                  size={16}
                />
              </div>
            </div>
            <NotificationDropdown />{" "}
          </div>
        </div>

        <div className="flex flex-row items-start justify-between w-full gap-8 mb-4">
          {/* Calendar */}
          <div className="max-w-[40%] p-4 bg-white border border-[#FFBF00] rounded-3xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigateMonth("prev")}
                  className="p-1 text-gray-600 hover:text-gray-800"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-medium text-[#3D3D3D]">
                  {formatHeader(date)}
                </h2>
                <button
                  onClick={() => navigateMonth("next")}
                  className="p-1 text-gray-600 hover:text-gray-800"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>

              <div className="flex bg-gray-100 rounded-full">
                <button
                  onClick={() => setView("weekly")}
                  className={`px-4 py-1 rounded-full text-sm transition-colors ${
                    view === "weekly"
                      ? "bg-[#DBFDDF] text-[#042F0C] border border-[#042F0C]"
                      : "text-gray-600"
                  }`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setView("monthly")}
                  className={`px-4 py-1 rounded-full text-sm transition-colors ${
                    view === "monthly"
                      ? "bg-[#DBFDDF] text-[#042F0C] border border-[#042F0C]"
                      : "text-gray-600"
                  }`}
                >
                  Monthly
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 ">
              <button
                onClick={() => navigateWeek("prev")}
                className="p-1 text-gray-600 hover:text-gray-800"
              >
                <ChevronLeft className="w-6 h-6 text-[#3D3D3D]" />
              </button>

              {weekDates.map((day) => (
                <button
                  key={day.toISOString()}
                  className={`flex flex-col items-center justify-center rounded-full py-4 px-5 transition-colors ${
                    isToday(day)
                      ? "bg-[#14B82C] text-white"
                      : "bg-white border border-[#888888]"
                  }`}
                  onClick={() => setDate(day)}
                >
                  <span className="mb-1 text-2xl font-medium">
                    {day.getDate()}
                  </span>
                  <span className="text-sm">
                    {day.toLocaleString("default", { weekday: "short" })}
                  </span>
                </button>
              ))}

              <button
                onClick={() => navigateWeek("next")}
                className="p-1 text-gray-600 hover:text-gray-800"
              >
                <ChevronRight className="w-6 h-6 text-[#3D3D3D]" />
              </button>
            </div>
          </div>

          {/* Learn a Language */}
          <div className="w-[60%]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Learn a Language</h2>
              <button
                className="px-4 py-2 text-base border border-[#5d5d5d] font-medium text-[#042f0c] bg-[#e6fde9] rounded-full hover:bg-[#ccfcd2]"
                onClick={() => navigate("/learnLanguageUser")}
              >
                View All
              </button>
            </div>

            <div className="flex flex-row items-center w-full space-x-4">
              {/* Spanish Card */}
              <div className="flex items-center gap-6 border border-[#d58287] p-6 bg-[#fff0f1] rounded-3xl w-full">
                <div className="w-16 h-16 overflow-hidden rounded-full">
                  <img
                    src="/svgs/spain-big.svg" // You'll provide this
                    alt="Spanish"
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="flex flex-col items-start justify-between space-y-2">
                  <span className="text-xl font-bold">Spanish</span>
                  <div className="flex items-center">
                    <div className="flex -space-x-3">
                      {students.map((_, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-center w-8 h-8 bg-white border-2 border-white rounded-full"
                        >
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                      ))}
                    </div>
                    {/* <span className="px-2 py-1 ml-2 text-sm text-green-600 bg-green-100 rounded-full">
                      +200k
                    </span> */}
                  </div>
                </div>
              </div>

              {/* English Card */}
              <div className="flex items-center w-full gap-6 p-6 bg-[#edf2ff] rounded-3xl border border-[#768bbd]">
                <div className="w-16 h-16 overflow-hidden rounded-full">
                  <img
                    src="/svgs/us-big.svg" // You'll provide this
                    alt="English"
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="flex flex-col items-start justify-between space-y-2">
                  <span className="text-xl font-bold">English</span>
                  <div className="flex items-center">
                    <div className="flex -space-x-3">
                      {students.map((_, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-center w-8 h-8 bg-white border-2 border-white rounded-full"
                        >
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                      ))}
                    </div>
                    {/* <span className="px-2 py-1 ml-2 text-sm text-green-600 bg-green-100 rounded-full">
                      +500k
                    </span> */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* My Classes */}
        <div className="w-full max-w-[160vh] mx-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">My Classes</h2>
            {classes.length > 0 && (
              <button
                className="px-4 py-2 text-base border border-[#5d5d5d] font-medium text-[#042f0c] bg-[#e6fde9] rounded-full hover:bg-[#ccfcd2]"
                onClick={() => navigate("/classesUser")}
              >
                View All
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
                Try Again
              </button>
            </div>
          ) : classes.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-white rounded-lg">
              <img
                alt="bambuu"
                src="/images/no-class.png"
                className="w-auto h-auto"
              />
              <p className="text-center text-gray-600">
                You have not booked a class yet!
              </p>
              <button
                className="px-4 py-2 text-base border border-[#5d5d5d] font-medium text-[#042f0c] bg-[#e6fde9] rounded-full hover:bg-[#ccfcd2]"
                onClick={() => navigate("/learnLanguageUser")}
              >
                Book a Class
              </button>
            </div>
          ) : (
            <div className="relative w-full">
              <div className="flex gap-2 pb-4 overflow-x-auto scrollbar-hide">
                {classes.map((classItem) => (
                  <div key={classItem.id} className="flex-none px-1 pt-3">
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
        {/* My Groups */}
        <div className="w-full max-w-[160vh] mx-auto">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-2xl font-bold">My Groups</h2>
            {groups.length > 0 && (
              <button
                className="px-4 py-2 text-base border border-[#5d5d5d] font-medium text-[#042f0c] bg-[#e6fde9] rounded-full hover:bg-[#ccfcd2]"
                onClick={() => navigate("/groupsUser")}
              >
                View All
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
                Try Again
              </button>
            </div>
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-white rounded-lg">
              <img
                alt="No groups"
                src="/images/no-class.png"
                className="w-auto h-auto"
              />
              <p className="text-center text-gray-600">
                You are not part of any group yet!
              </p>
              <div className="flex flex-row items-center justify-center space-x-4">
                <button
                  onClick={() => navigate("/learnLanguageUser")}
                  className="px-4 py-2 text-base border border-[#5d5d5d] font-medium text-[#042f0c] bg-[#e6fde9] rounded-full hover:bg-[#ccfcd2]"
                >
                  Join a Group
                </button>
                <button
                  onClick={() => navigate("/groupsUser")}
                  className="px-4 py-2 text-base border border-[#5d5d5d] font-medium text-[#042f0c] bg-[#e6fde9] rounded-full hover:bg-[#ccfcd2]"
                >
                  Create a Group
                </button>
              </div>
            </div>
          ) : (
            <div className="relative w-full">
              <div className="flex gap-2 pb-4 overflow-x-auto scrollbar-hide">
                {groups.map((group) => (
                  <div key={group.id} className="flex-none px-1 pt-3 ">
                    <GroupCard group={group} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearnUser;
