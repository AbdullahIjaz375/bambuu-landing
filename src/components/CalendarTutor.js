import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MAX_SELECTION = 60;

const CalendarTutor = ({ onNext, prefilledDates = [] }) => {
  const [date, setDate] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState([]);

  useEffect(() => {
    if (prefilledDates && prefilledDates.length > 0) {
      setSelectedDates(
        prefilledDates.map((d) => {
          if (d instanceof Date) return d;
          // d is string in YYYY-MM-DD
          const [year, month, day] = d.split("-").map(Number);
          return new Date(year, month - 1, day);
        }),
      );
    }
  }, [prefilledDates]);

  const getMonthDates = (current) => {
    const year = current.getFullYear();
    const month = current.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // Add empty cells before the first day of the month
    const prevMonthDays = firstDay.getDay();
    for (let i = 0; i < prevMonthDays; i++) {
      days.push({ date: null, isCurrentMonth: false });
    }

    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const day = new Date(year, month, i);
      days.push({ date: day, isCurrentMonth: true });
    }

    // Add empty cells after the last day to fill the last week
    const totalCells = days.length;
    const remainder = totalCells % 7;
    if (remainder !== 0) {
      for (let i = 0; i < 7 - remainder; i++) {
        days.push({ date: null, isCurrentMonth: false });
      }
    }

    // Calculate number of rows
    days.numRows = Math.ceil(days.length / 7);

    // Debug: Log the grid for this month
    const weekDayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    let grid = "\n[CalendarTutor] Grid for " + year + "-" + (month + 1) + ":\n";
    for (let i = 0; i < days.length; i++) {
      if (i % 7 === 0) grid += "\n";
      const d = days[i];
      grid +=
        (d.isCurrentMonth && d.date
          ? d.date.getDate().toString().padStart(2, "0")
          : "__") +
        "(" +
        weekDayLabels[i % 7] +
        ") ";
    }
    console.log(grid);

    return days;
  };

  const formatHeader = (date) => {
    const month = date
      .toLocaleString("default", { month: "long" })
      .toUpperCase();
    const year = date.getFullYear();
    return `${month}, ${year}`;
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(date);
    newDate.setMonth(date.getMonth() + (direction === "next" ? 1 : -1));
    setDate(newDate);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedFutureDates = selectedDates.filter((d) => d >= today);

  const weekDayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const isSameDay = (d1, d2) =>
    d1 &&
    d2 &&
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const isSelected = (day) => selectedDates.some((d) => isSameDay(d, day));

  const handleDateClick = (day, isCurrentMonth) => {
    if (!isCurrentMonth) return;
    if (isSelected(day)) {
      setSelectedDates(selectedDates.filter((d) => !isSameDay(d, day)));
    } else if (selectedDates.length < MAX_SELECTION) {
      setSelectedDates([...selectedDates, day]);
    }
  };

  const monthDates = getMonthDates(date);
  const numRows = monthDates.numRows || Math.ceil(monthDates.length / 7);

  return (
    <>
      <div className="scrollbar-hide w-full max-w-4xl rounded-3xl border border-amber-400 bg-white p-3">
        <div className="mb-4 flex flex-col items-center gap-4 sm:mb-6">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => navigateMonth("prev")}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-[#888888] bg-white text-gray-600 transition hover:text-gray-800"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="mx-auto text-lg font-medium text-gray-800 sm:text-xl">
              {formatHeader(date)}
            </h2>
            <button
              onClick={() => navigateMonth("next")}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-[#888888] bg-white text-gray-600 transition hover:text-gray-800"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div
          className={numRows > 5 ? "overflow-y-auto" : "overflow-y-hidden"}
          style={numRows > 5 ? { maxHeight: "320px" } : {}}
        >
          <div className="scale-100 transform opacity-100 transition-all duration-300 ease-in-out">
            <div className="mb-2 grid grid-cols-7 gap-1">
              {weekDayLabels.map((day) => (
                <div
                  key={day}
                  className="flex h-8 items-center justify-center rounded-full border border-[#888888] bg-white px-4 text-center text-xs font-medium text-gray-700 sm:text-sm"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="ml-0 mr-5 grid grid-cols-7 gap-x-1 sm:gap-x-6 sm:gap-y-2 sm:p-1">
              {monthDates.map(({ date: day, isCurrentMonth }, idx) => {
                if (!day) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      className="h-11 w-11 sm:h-12 sm:w-12"
                    />
                  );
                }
                // Disable if before today or not current month
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const isPast = day < today;
                const isDisabled = isPast || !isCurrentMonth;
                return (
                  <button
                    key={day.toISOString()}
                    className={`flex h-11 w-11 items-center justify-center rounded-full border text-center text-[22px] font-bold transition-colors sm:h-12 sm:w-12 sm:text-[26px] ${
                      !isCurrentMonth
                        ? "cursor-not-allowed border-[#e0e0e0] bg-gray-100 text-gray-300"
                        : isPast
                          ? "cursor-not-allowed border-[#e0e0e0] bg-gray-100 text-gray-400"
                          : isSelected(day)
                            ? "border-[#888888] bg-[#DBFDDF] text-[#14B82C]"
                            : "border-[#888888] bg-white text-[#14B82C] hover:bg-gray-50"
                    }`}
                    onClick={() =>
                      !isDisabled && handleDateClick(day, isCurrentMonth)
                    }
                    disabled={isDisabled}
                  >
                    <span className="text-xl font-semibold sm:text-base">
                      {isCurrentMonth ? day.getDate() : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      {/* Make Next button full width and centered */}

      <div className="mt-8 flex flex-col items-center gap-2 text-sm font-normal">
        <span className="text-sm text-gray-700">
          {selectedFutureDates.length} Day
          {selectedFutureDates.length !== 1 ? "s" : ""} Selected
        </span>
        <button
          className={`mt-2 h-11 w-full rounded-full text-lg/5 font-semibold text-black ${
            selectedFutureDates.length === 0
              ? "cursor-not-allowed bg-[#b6e7c0]"
              : "bg-[#14B82C]"
          }`}
          disabled={selectedFutureDates.length === 0}
          onClick={() => onNext && onNext(selectedFutureDates)}
        >
          Next
        </button>
      </div>
    </>
  );
};

export default CalendarTutor;
