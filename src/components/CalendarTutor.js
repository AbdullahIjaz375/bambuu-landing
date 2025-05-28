import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MAX_SELECTION = 60;

const CalendarTutor = ({ onNext }) => {
  const [date, setDate] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState([]);

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

  const navigateMonth = (direction) => {
    const newDate = new Date(date);
    newDate.setMonth(date.getMonth() + (direction === "next" ? 1 : -1));
    setDate(newDate);
  };

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

        <div className="max-h-96 overflow-hidden transition-all duration-300 ease-in-out">
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
            {/* Reduce vertical padding and margin for calendar cells */}
            <div className="ml-0 mr-5 grid grid-cols-7 gap-x-1 sm:gap-x-6 sm:gap-y-2 sm:p-1">
              {monthDates
                .filter(({ isCurrentMonth }) => isCurrentMonth)
                .map(({ date: day, isCurrentMonth }) => (
                  <button
                    key={day.toISOString()}
                    className={`flex h-11 w-11 items-center justify-center rounded-full border text-center text-[22px] font-bold transition-colors sm:h-12 sm:w-12 sm:text-[26px] ${
                      isSelected(day)
                        ? "border-[#888888] bg-[#DBFDDF] text-[#14B82C]"
                        : "border-[#888888] bg-white text-[#14B82C] hover:bg-gray-50"
                    }`}
                    onClick={() => handleDateClick(day, isCurrentMonth)}
                  >
                    <span className="text-xl font-semibold sm:text-base">
                      {day.getDate()}
                    </span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>
      {/* Make Next button full width and centered */}
      <div className="mt-8 flex flex-col items-center gap-2 text-sm font-normal">
        <span className="text-sm text-gray-700">
          {selectedDates.length} Day{selectedDates.length !== 1 ? "s" : ""}{" "}
          Selected
        </span>
        <button
          className={`mt-2 h-11 w-full rounded-full text-lg/5 font-semibold text-black ${
            selectedDates.length === 0
              ? "cursor-not-allowed bg-[#b6e7c0]"
              : "bg-[#14B82C]"
          }`}
          disabled={selectedDates.length === 0}
          onClick={() => onNext && onNext(selectedDates)}
        >
          Next
        </button>
      </div>
    </>
  );
};

export default CalendarTutor;
