import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Modal from "react-modal";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../src/firebaseConfig";
import ClassCard from "./ClassCard";
import EmptyState from "./EmptyState";
import { ClipLoader } from "react-spinners";

const CalendarUser = ({ onDateSelect }) => {
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
      // Get enrolled classes from session storage
      const user = JSON.parse(sessionStorage.getItem("user") || "[]");

      const userEnrolledClasses = user.enrolledClasses;

      // Start of the selected date
      const startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);

      // End of the selected date
      const endDate = new Date(selectedDate);
      endDate.setHours(23, 59, 59, 999);

      // Query Firebase for classes on the selected date
      const classesRef = collection(db, "classes");
      const q = query(
        classesRef,
        where("classDateTime", ">=", startDate),
        where("classDateTime", "<=", endDate),
      );

      const querySnapshot = await getDocs(q);
      const fetchedClasses = [];

      querySnapshot.forEach((doc) => {
        const classData = doc.data();
        // Only include classes where the user is enrolled
        if (userEnrolledClasses.includes(doc.id)) {
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
    const daysToShow = windowWidth >= 1724 ? 9 : 7;

    for (let i = 0; i < daysToShow; i++) {
      const day = new Date(current.getTime());
      day.setDate(first + i);
      week.push(day);
    }
    return week;
  };

  // const getWeekDates = (current) => {
  //   const week = [];
  //   const first = current.getDate() - current.getDay() + 1;

  //   for (let i = 0; i < 7; i++) {
  //     const day = new Date(current.getTime());
  //     day.setDate(first + i);
  //     week.push(day);
  //   }
  //   return week;
  // };

  const getMonthDates = (current) => {
    const year = current.getFullYear();
    const month = current.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // Add days from previous month to start from Sunday
    const prevMonthDays = firstDay.getDay();
    for (let i = prevMonthDays - 1; i >= 0; i--) {
      const day = new Date(year, month, -i);
      days.push({ date: day, isCurrentMonth: false });
    }

    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const day = new Date(year, month, i);
      days.push({ date: day, isCurrentMonth: true });
    }

    // Add days from next month to complete the grid
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const day = new Date(year, month + 1, i);
      days.push({ date: day, isCurrentMonth: false });
    }

    return days;
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

  const handleViewChange = (newView) => {
    setIsTransitioning(true);
    setView(newView);
    // Reset transition state after animation completes
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handleDateSelect = (selectedDate) => {
    setDate(selectedDate);
    setIsModalOpen(true);
    if (onDateSelect) {
      onDateSelect(selectedDate);
    }
  };

  const weekDates = getWeekDates(date);
  const monthDates = getMonthDates(date);
  const weekDayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <>
      <div className="scrollbar-hide w-full max-w-4xl rounded-3xl border border-amber-400 bg-white p-3">
        <div className="mb-4 flex flex-col justify-between gap-4 sm:mb-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateMonth("prev")}
              className="p-1 text-gray-600 hover:text-gray-800"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-medium text-gray-800 sm:text-xl">
              {formatHeader(date)}
            </h2>
            <button
              onClick={() => navigateMonth("next")}
              className="p-1 text-gray-600 hover:text-gray-800"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="relative inline-flex rounded-full border border-gray-300 bg-gray-100 p-1">
            <div
              className="absolute left-0 top-0 h-full rounded-full border border-green-900 bg-green-50 transition-all duration-300 ease-in-out"
              style={{
                transform: `translateX(${view === "weekly" ? "0" : "100%"})`,
                width: "50%",
              }}
            />
            <button
              onClick={() => handleViewChange("weekly")}
              className="z-1 relative rounded-full px-3 py-1 text-sm font-medium text-green-900 transition-colors"
            >
              Weekly
            </button>
            <button
              onClick={() => handleViewChange("monthly")}
              className="z-1 relative rounded-full px-3 py-1 text-sm font-medium text-green-900 transition-colors"
            >
              Monthly
            </button>
          </div>
        </div>

        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            view === "monthly" ? "max-h-96" : "max-h-24"
          }`}
        >
          {view === "weekly" ? (
            <div className="scrollbar-hide flex items-center justify-between gap-1 overflow-x-auto pb-2">
              <button
                onClick={() => navigateWeek("prev")}
                className="shrink-0 p-1 text-gray-600 hover:text-gray-800"
              >
                <ChevronLeft className="h-5 w-5 text-gray-800" />
              </button>

              <div className="flex flex-1 justify-between gap-1 sm:gap-2">
                {weekDates.map((day) => (
                  <button
                    key={day.toISOString()}
                    className={`flex shrink-0 flex-col items-center justify-center rounded-full px-1 py-1 transition-colors sm:py-3 lg:px-3 ${
                      isToday(day)
                        ? "bg-green-500 text-white"
                        : "border border-gray-400 bg-white"
                    }`}
                    onClick={() => handleDateSelect(day)}
                  >
                    <span className="text-sm font-medium sm:text-lg">
                      {day.getDate()}
                    </span>
                    <span className="text-xs sm:text-sm">
                      {day.toLocaleString("default", { weekday: "short" })}
                    </span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => navigateWeek("next")}
                className="shrink-0 p-1 text-gray-600 hover:text-gray-800"
              >
                <ChevronRight className="h-5 w-5 text-gray-800" />
              </button>
            </div>
          ) : (
            <div
              className={`transform transition-all duration-300 ease-in-out ${
                isTransitioning ? "scale-95 opacity-0" : "scale-100 opacity-100"
              }`}
            >
              <div className="mb-2 grid grid-cols-7 gap-1">
                {weekDayLabels.map((day) => (
                  <div
                    key={day}
                    className="py-1 text-center text-xs font-medium text-gray-600 sm:text-sm"
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 p-1 sm:gap-2 sm:p-2">
                {monthDates.map(({ date: day, isCurrentMonth }) => (
                  <button
                    key={day.toISOString()}
                    className={`flex flex-col items-center justify-center rounded-full px-1 py-1 text-center transition-colors sm:px-2 sm:py-2 ${
                      isToday(day)
                        ? "bg-green-500 text-white"
                        : isCurrentMonth
                          ? "border border-gray-400 bg-white hover:bg-gray-50"
                          : "border border-gray-200 text-gray-400 hover:bg-gray-50"
                    } `}
                    onClick={() => handleDateSelect(day)}
                  >
                    <span className="text-xs font-medium sm:text-base">
                      {day.getDate()}
                    </span>
                    <span className="hidden text-xs sm:block">
                      {day.toLocaleString("default", { weekday: "short" })}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        className="z-50 mx-auto mt-10 max-w-7xl rounded-3xl bg-white p-10 font-urbanist shadow-xl"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-40"
      >
        <div className="mb-6 flex items-center justify-between">
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
            <div className="flex flex-1 items-center justify-center">
              <ClipLoader color="#14B82C" size={50} />
            </div>
          </div>
        ) : classes.length === 0 ? (
          <div className="py-8 text-center">
            <EmptyState message="No classes for this date" />{" "}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {classes.map((classItem) => (
              <ClassCard
                key={classItem.classId}
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

export default CalendarUser;
