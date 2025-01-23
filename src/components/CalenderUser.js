// import React, { useState } from "react";
// import { ChevronLeft, ChevronRight } from "lucide-react";

// const CalendarUser = ({ onDateSelect }) => {
//   const [date, setDate] = useState(new Date());
//   const [view, setView] = useState("weekly");
//   const [isTransitioning, setIsTransitioning] = useState(false);

//   const getWeekDates = (current) => {
//     const week = [];
//     const first = current.getDate() - current.getDay() + 1;

//     for (let i = 0; i < 7; i++) {
//       const day = new Date(current.getTime());
//       day.setDate(first + i);
//       week.push(day);
//     }
//     return week;
//   };

//   const getMonthDates = (current) => {
//     const year = current.getFullYear();
//     const month = current.getMonth();
//     const firstDay = new Date(year, month, 1);
//     const lastDay = new Date(year, month + 1, 0);
//     const days = [];

//     // Add days from previous month to start from Sunday
//     const prevMonthDays = firstDay.getDay();
//     for (let i = prevMonthDays - 1; i >= 0; i--) {
//       const day = new Date(year, month, -i);
//       days.push({ date: day, isCurrentMonth: false });
//     }

//     // Add days of current month
//     for (let i = 1; i <= lastDay.getDate(); i++) {
//       const day = new Date(year, month, i);
//       days.push({ date: day, isCurrentMonth: true });
//     }

//     // Add days from next month to complete the grid
//     const remainingDays = 42 - days.length; // 6 rows × 7 days
//     for (let i = 1; i <= remainingDays; i++) {
//       const day = new Date(year, month + 1, i);
//       days.push({ date: day, isCurrentMonth: false });
//     }

//     return days;
//   };

//   const formatHeader = (date) => {
//     const month = date
//       .toLocaleString("default", { month: "long" })
//       .toUpperCase();
//     const year = date.getFullYear();
//     return `${month}, ${year}`;
//   };

//   const navigateWeek = (direction) => {
//     const newDate = new Date(date);
//     newDate.setDate(date.getDate() + (direction === "next" ? 7 : -7));
//     setDate(newDate);
//   };

//   const navigateMonth = (direction) => {
//     const newDate = new Date(date);
//     newDate.setMonth(date.getMonth() + (direction === "next" ? 1 : -1));
//     setDate(newDate);
//   };

//   const isToday = (date) => {
//     const today = new Date();
//     return date.toDateString() === today.toDateString();
//   };

//   const handleViewChange = (newView) => {
//     setIsTransitioning(true);
//     setView(newView);
//     // Reset transition state after animation completes
//     setTimeout(() => setIsTransitioning(false), 300);
//   };

//   const weekDates = getWeekDates(date);
//   const monthDates = getMonthDates(date);
//   const weekDayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

//   const handleDateSelect = (selectedDate) => {
//     setDate(selectedDate);
//     if (onDateSelect) {
//       onDateSelect(selectedDate);
//     }
//   };

//   return (
//     <div className="w-full max-w-4xl p-2 sm:p-4 bg-white border border-[#FFBF00] rounded-3xl">
//       <div className="flex flex-col justify-between gap-4 mb-4 sm:flex-row sm:items-center sm:mb-6">
//         <div className="flex items-center gap-2 sm:gap-4">
//           <button
//             onClick={() => navigateMonth("prev")}
//             className="p-1 text-gray-600 hover:text-gray-800"
//           >
//             <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
//           </button>
//           <h2 className="text-lg sm:text-2xl font-medium text-[#3D3D3D]">
//             {formatHeader(date)}
//           </h2>
//           <button
//             onClick={() => navigateMonth("next")}
//             className="p-1 text-gray-600 hover:text-gray-800"
//           >
//             <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
//           </button>
//         </div>

//         <div className="flex self-center bg-white border border-gray-200 rounded-full sm:self-auto">
//           <button
//             onClick={() => handleViewChange("weekly")}
//             className={`px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm transition-colors ${
//               view === "weekly"
//                 ? "bg-[#DBFDDF] text-[#042F0C] border border-[#042F0C]"
//                 : "text-gray-600"
//             }`}
//           >
//             Weekly
//           </button>
//           <button
//             onClick={() => handleViewChange("monthly")}
//             className={`px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm transition-colors ${
//               view === "monthly"
//                 ? "bg-[#DBFDDF] text-[#042F0C] border border-[#042F0C]"
//                 : "text-gray-600"
//             }`}
//           >
//             Monthly
//           </button>
//         </div>
//       </div>

//       <div
//         className={`overflow-hidden transition-all duration-300 ease-in-out ${
//           view === "monthly" ? "max-h-96" : "max-h-24"
//         }`}
//       >
//         {view === "weekly" ? (
//           <div className="flex items-center justify-between gap-1 pb-2 overflow-x-auto sm:gap-2">
//             <button
//               onClick={() => navigateWeek("prev")}
//               className="p-1 text-gray-600 hover:text-gray-800 shrink-0"
//             >
//               <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-[#3D3D3D]" />
//             </button>

//             <div className="flex justify-between flex-1 gap-1 sm:gap-2">
//               {weekDates.map((day) => (
//                 <button
//                   key={day.toISOString()}
//                   className={`flex flex-col items-center justify-center rounded-full
//                     py-2 sm:py-4 px-2 sm:px-5 transition-colors shrink-0
//                     ${
//                       isToday(day)
//                         ? "bg-[#14B82C] text-white"
//                         : "bg-white border border-[#888888]"
//                     }`}
//                   onClick={() => handleDateSelect(day)}
//                 >
//                   <span className="text-base font-medium sm:text-2xl">
//                     {day.getDate()}
//                   </span>
//                   <span className="text-xs sm:text-sm">
//                     {day.toLocaleString("default", { weekday: "short" })}
//                   </span>
//                 </button>
//               ))}
//             </div>

//             <button
//               onClick={() => navigateWeek("next")}
//               className="p-1 text-gray-600 hover:text-gray-800 shrink-0"
//             >
//               <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-[#3D3D3D]" />
//             </button>
//           </div>
//         ) : (
//           <div
//             className={`transform transition-all duration-300 ease-in-out ${
//               isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"
//             }`}
//           >
//             <div className="grid grid-cols-7 gap-1 mb-2">
//               {weekDayLabels.map((day) => (
//                 <div
//                   key={day}
//                   className="py-2 text-sm font-medium text-center text-gray-600"
//                 >
//                   {day}
//                 </div>
//               ))}
//             </div>
//             <div className="grid grid-cols-7 gap-2 p-2">
//               {monthDates.map(({ date: day, isCurrentMonth }) => (
//                 <button
//                   key={day.toISOString()}
//                   className={`
//                     flex flex-col items-center justify-center rounded-full
//                     py-2 px-2 transition-colors
//                     ${
//                       isToday(day)
//                         ? "bg-[#14B82C] text-white"
//                         : isCurrentMonth
//                         ? "bg-white border border-[#888888] hover:bg-gray-50"
//                         : "text-gray-400 border border-gray-200 hover:bg-gray-50"
//                     }
//                   `}
//                   onClick={() => handleDateSelect(day)}
//                 >
//                   <span className="text-base font-medium">{day.getDate()}</span>
//                   <span className="text-xs">
//                     {day.toLocaleString("default", { weekday: "short" })}
//                   </span>
//                 </button>
//               ))}
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default CalendarUser;

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
        where("classDateTime", "<=", endDate)
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
      <div className="w-full max-w-4xl p-2 sm:p-4 bg-white border border-[#FFBF00] rounded-3xl">
        <div className="flex flex-col justify-between gap-4 mb-4 sm:flex-row sm:items-center sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => navigateMonth("prev")}
              className="p-1 text-gray-600 hover:text-gray-800"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <h2 className="text-lg sm:text-2xl font-medium text-[#3D3D3D]">
              {formatHeader(date)}
            </h2>
            <button
              onClick={() => navigateMonth("next")}
              className="p-1 text-gray-600 hover:text-gray-800"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          <div className="flex self-center bg-white border border-gray-200 rounded-full sm:self-auto">
            <button
              onClick={() => handleViewChange("weekly")}
              className={`px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm transition-colors ${
                view === "weekly"
                  ? "bg-[#DBFDDF] text-[#042F0C] border border-[#042F0C]"
                  : "text-gray-600"
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => handleViewChange("monthly")}
              className={`px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm transition-colors ${
                view === "monthly"
                  ? "bg-[#DBFDDF] text-[#042F0C] border border-[#042F0C]"
                  : "text-gray-600"
              }`}
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
            <div className="flex items-center justify-between gap-1 pb-2 overflow-x-auto sm:gap-2">
              <button
                onClick={() => navigateWeek("prev")}
                className="p-1 text-gray-600 hover:text-gray-800 shrink-0"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-[#3D3D3D]" />
              </button>

              <div className="flex justify-between flex-1 gap-1 sm:gap-2">
                {weekDates.map((day) => (
                  <button
                    key={day.toISOString()}
                    className={`flex flex-col items-center justify-center rounded-full 
                      py-2 sm:py-4 px-2 sm:px-5 transition-colors shrink-0
                      ${
                        isToday(day)
                          ? "bg-[#14B82C] text-white"
                          : "bg-white border border-[#888888]"
                      }`}
                    onClick={() => handleDateSelect(day)}
                  >
                    <span className="text-base font-medium sm:text-2xl">
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
                className="p-1 text-gray-600 hover:text-gray-800 shrink-0"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-[#3D3D3D]" />
              </button>
            </div>
          ) : (
            <div
              className={`transform transition-all duration-300 ease-in-out ${
                isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"
              }`}
            >
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDayLabels.map((day) => (
                  <div
                    key={day}
                    className="py-2 text-sm font-medium text-center text-gray-600"
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2 p-2">
                {monthDates.map(({ date: day, isCurrentMonth }) => (
                  <button
                    key={day.toISOString()}
                    className={`
                      flex flex-col items-center justify-center rounded-full
                      py-2 px-2 transition-colors
                      ${
                        isToday(day)
                          ? "bg-[#14B82C] text-white"
                          : isCurrentMonth
                          ? "bg-white border border-[#888888] hover:bg-gray-50"
                          : "text-gray-400 border border-gray-200 hover:bg-gray-50"
                      }
                    `}
                    onClick={() => handleDateSelect(day)}
                  >
                    <span className="text-base font-medium">
                      {day.getDate()}
                    </span>
                    <span className="text-xs">
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
        className="p-10 mx-auto mt-10 bg-white shadow-xl rounded-3xl max-w-7xl font-urbanist"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50"
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
