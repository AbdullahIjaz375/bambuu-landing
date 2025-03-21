import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Modal from "react-modal";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../src/firebaseConfig";
import ClassCardTutor from "./ClassCardTutor";
import EmptyState from "../components/EmptyState";
import { ClipLoader } from "react-spinners";
Modal.setAppElement("#root"); // or whatever your root element ID is

const WeeklyTutor = ({ onDateSelect }) => {
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState("weekly");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    if (date) {
      fetchClassesForDate(date);
    }
  }, [date]);

  const fetchClassesForDate = async (selectedDate) => {
    setLoading(true);
    try {
      const user = JSON.parse(sessionStorage.getItem("user") || "[]");
      const tutorClasses = user.tutorOfClasses;

      const startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(selectedDate);
      endDate.setHours(23, 59, 59, 999);

      const classesRef = collection(db, "classes");
      const q = query(
        classesRef,
        where("classDateTime", ">=", startDate),
        where("classDateTime", "<=", endDate)
      );

      const querySnapshot = await getDocs(q);
      const fetchedClasses = [];

      querySnapshot.forEach((doc) => {
        const classData = doc.data();
        if (tutorClasses.includes(doc.id)) {
          fetchedClasses.push({
            ...classData,
            id: doc.id,
          });
        }
      });

      setClasses(fetchedClasses);
    } catch (error) {
      console.error("Error fetching classes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getWeekDates = (current) => {
    const week = [];
    const first = current.getDate() - current.getDay() + 1;
    const daysToShow = windowWidth >= 1724 ? 14 : 11;

    for (let i = 0; i < daysToShow; i++) {
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

  const navigateMonth = (direction) => {
    const newDate = new Date(date);
    newDate.setMonth(date.getMonth() + (direction === "next" ? 1 : -1));
    setDate(newDate);
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handleDateSelect = (selectedDate) => {
    setDate(selectedDate);
    setIsModalOpen(true);
    if (onDateSelect) {
      onDateSelect(selectedDate);
    }
  };

  const weekDates = getWeekDates(date);

  return (
    <>
      <div className="flex flex-col items-start justify-center w-full gap-4 mb-4 sm:gap-8">
        <div className="w-full p-4 bg-white border border-yellow-300 rounded-3xl">
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => navigateMonth("prev")}
                className="p-1 text-gray-600 hover:text-gray-800"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="text-xl font-medium">{formatHeader(date)}</h2>
              <button
                onClick={() => navigateMonth("next")}
                className="p-1 text-gray-600 hover:text-gray-800"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 overflow-x-auto sm:gap-4">
            <button
              onClick={() => navigateWeek("prev")}
              className="flex-shrink-0 p-1 text-gray-600 hover:text-gray-800"
            >
              <ChevronLeft className="w-6 h-6 text-[#3D3D3D]" />
            </button>
            {weekDates.map((day) => (
              <button
                key={day.toISOString()}
                className={`flex flex-col items-center justify-center border border-[#888888] rounded-full py-4 px-4 sm:px-6 transition-colors flex-shrink-0 cursor-pointer ${
                  isToday(day) ? "bg-[#14B82C] text-white" : "bg-white"
                }`}
                onClick={() => {
                  handleDateSelect(day);
                }}
              >
                <span className="mb-1 text-xl font-medium sm:text-2xl">
                  {day.getDate()}
                </span>
                <span className="text-xs sm:text-sm">
                  {day.toLocaleString("default", { weekday: "short" })}
                </span>
              </button>
            ))}
            <button
              onClick={() => navigateWeek("next")}
              className="flex-shrink-0 p-1 text-gray-600 hover:text-gray-800"
            >
              <ChevronRight className="w-6 h-6 text-[#3D3D3D]" />
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        className="z-50 p-10 mx-auto mt-10 bg-white shadow-xl max-h-[90vh] overflow-y-auto scrollbar-hide rounded-3xl max-w-7xl font-urbanist"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 "
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-semibold">
            {date?.toLocaleDateString("en-US", {
              day: "numeric",
              month: "long",
            })}{" "}
            Classes
          </h2>
          <button
            onClick={() => setIsModalOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center">
            <div className="flex items-center justify-center flex-1">
              <ClipLoader color="#14B82C" size={50} />
            </div>
          </div>
        ) : classes.length === 0 ? (
          <div className="py-8 text-center">
            <EmptyState message="No classes for this date" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {classes.map((classItem) => (
              <ClassCardTutor
                key={classItem.id}
                {...classItem}
                isBammbuu={
                  classItem.classType === "Individual Premium" ||
                  classItem.classType === "Group Premium"
                }
              />
            ))}
          </div>
        )}
      </Modal>
    </>
  );
};

export default WeeklyTutor;
