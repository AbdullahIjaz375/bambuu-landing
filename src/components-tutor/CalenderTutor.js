import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const WeeklyCalendar = ({ onDateSelect }) => {
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState("weekly");

  const getWeekDates = (current) => {
    const week = [];
    const first = current.getDate() - current.getDay() + 1;

    for (let i = 0; i < 11; i++) {
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
    if (onDateSelect) {
      onDateSelect(selectedDate);
    }
  };

  const weekDates = getWeekDates(date);

  return (
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
              className={`flex flex-col items-center justify-center border border-[#888888] rounded-full py-4 px-4 sm:px-6 transition-colors flex-shrink-0 ${
                isToday(day) ? "bg-[#14B82C] text-white" : "bg-white"
              }`}
              onClick={() => handleDateSelect(day)}
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
  );
};

export default WeeklyCalendar;
