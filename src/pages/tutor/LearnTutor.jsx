import { Search, Plus } from "lucide-react";
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
import ClassCardTutor from "../../components-tutor/ClassCardTutor";
import { useAuth } from "../../context/AuthContext";
import GroupCard from "../../components/GroupCard";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebaseConfig";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { ClipLoader } from "react-spinners";

const LearnTutor = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Booked Classes");
  const TABS = ["Booked Classes", "Available Classes"];
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Calendar state and functions remain the same
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState("weekly");

  useEffect(() => {
    const fetchClassesData = async () => {
      try {
        setLoading(true);

        // First, get the tutor document
        const tutorDoc = await getDoc(doc(db, "tutors", user.uid));

        if (!tutorDoc.exists()) {
          console.error("Tutor document not found");
          setLoading(false);
          return;
        }

        const tutorData = tutorDoc.data();
        const tutorClasses = tutorData.tutorOfClasses || [];

        // Fetch all classes mentioned in tutorOfClasses array
        const classPromises = tutorClasses.map((classId) =>
          getDoc(doc(db, "classes", classId))
        );

        const classSnapshots = await Promise.all(classPromises);

        const fetchedClasses = classSnapshots
          .filter((doc) => doc.exists())
          .map((doc) => ({
            ...doc.data(),
            classId: doc.id,
          }));

        // Filter classes based on active tab
        const filteredClasses =
          activeTab === "Booked Classes"
            ? fetchedClasses.filter(
                (class_) => class_.classMemberIds?.length > 0
              )
            : fetchedClasses.filter(
                (class_) => class_.classMemberIds?.length === 0
              );

        setClasses(filteredClasses);
      } catch (error) {
        console.error("Error fetching classes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClassesData();
  }, [user.uid, activeTab]);

  // Calendar helper functions remain the same
  const getWeekDates = (current) => {
    const week = [];
    const first = current.getDate() - current.getDay() + 1;

    for (let i = 0; i < 15; i++) {
      const day = new Date(current.getTime());
      day.setDate(first + i);
      week.push(day);
    }
    return week;
  };

  const formatHeader = (date) => {
    const month = date
      .toLocaleString("default", { month: "long" })
      .toUpperCase();
    const year = date.getFullYear();
    return `${month}, ${year}`;
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + (direction === "next" ? 7 : -7));
    setDate(newDate);
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const weekDates = getWeekDates(date);

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar user={user} />

      <div className="flex-1 p-8 bg-white border-2 border-[#e7e7e7] rounded-3xl ml-[17rem] m-2">
        {/* Header section remains the same */}
        <div className="flex items-center justify-between mb-4 border-b border-[#e7e7e7] pb-4">
          <div className="flex flex-row items-center space-x-4">
            <h1 className="text-3xl font-semibold">Hi, {user.name}!</h1>
            <p className="text-[#616161] text-lg">How are you today? </p>
          </div>
          <div className="flex items-center gap-4">
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
            <NotificationDropdown />
          </div>
        </div>

        {/* Calendar section remains the same */}
        <div className="flex flex-row items-start justify-between w-full gap-8 mb-4">
          <div className="w-full p-4 bg-white border border-yellow-300 rounded-3xl">
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => navigateWeek("prev")}
                  className="p-1 text-gray-600 hover:text-gray-800"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <h2 className="text-xl font-medium">{formatHeader(date)}</h2>
                <button
                  onClick={() => navigateWeek("next")}
                  className="p-1 text-gray-600 hover:text-gray-800"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex justify-between gap-2">
              {weekDates.map((day) => (
                <button
                  key={day.toISOString()}
                  className={`flex flex-col items-center justify-center rounded-full py-4 px-6 transition-colors ${
                    isToday(day)
                      ? "bg-green-500 text-white"
                      : "bg-white border hover:border-gray-300"
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
            </div>
          </div>
        </div>

        {/* Tabs section remains the same */}
        <div className="flex flex-row items-center justify-between pt-4">
          <div className="flex bg-gray-100 border border-[#888888] rounded-full w-fit">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-12 py-2 rounded-full text-lg font-medium transition-all ${
                  activeTab === tab
                    ? "bg-[#ffbf00] text-[#042f0c] border border-[#042f0c]"
                    : "text-[#042f0c] hover:text-black"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button className="px-3 py-2 text-[#042f0c] text-lg font-semibold bg-[#e6fde9] border border-black rounded-full flex items-center">
            <Plus /> Add Class
          </button>
        </div>

        {/* Classes Grid */}
        {loading ? (
          <div className="flex items-center justify-center w-full h-64">
            <ClipLoader color="#14b82c" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 mt-6 md:grid-cols-3 lg:grid-cols-4">
            {classes.map((classData) => (
              <ClassCardTutor
                key={classData.classId}
                {...classData}
                isBammbuu={classData.isPremium}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LearnTutor;
