import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const CalendarUser = ({ onDateSelect }) => {
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState("weekly");

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

  const weekDates = getWeekDates(date);

  const handleDateSelect = (selectedDate) => {
    setDate(selectedDate);
    if (onDateSelect) {
      onDateSelect(selectedDate);
    }
  };

  return (
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

        <div className="flex self-center bg-gray-100 rounded-full sm:self-auto">
          <button
            onClick={() => setView("weekly")}
            className={`px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm transition-colors ${
              view === "weekly"
                ? "bg-[#DBFDDF] text-[#042F0C] border border-[#042F0C]"
                : "text-gray-600"
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setView("monthly")}
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
    </div>
  );
};

export default CalendarUser;
