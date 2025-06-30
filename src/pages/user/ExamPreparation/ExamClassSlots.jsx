import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Modal from "react-modal";
import { ClipLoader } from "react-spinners";

const ExamClassSlots = ({
  isOpen,
  onClose,
  onBookingComplete,
  slots = {},
  user,
  tutorId,
  loading = false,
}) => {
  const [currentStep, setCurrentStep] = useState(1); // 1: date selection, 2: time selection, 3: confirmation
  const [selectedDates, setSelectedDates] = useState([]);
  const [selectedTimes, setSelectedTimes] = useState({});
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentDateIndex, setCurrentDateIndex] = useState(0);

  // Generate calendar days for the current month
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const handleDateClick = (day) => {
    if (!day) return;
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    const dateKey = `${year}-${month}-${dayStr}`;

    // Toggle date selection - if already selected, remove it; if not selected, add it
    if (selectedDates.includes(dateKey)) {
      setSelectedDates(selectedDates.filter((d) => d !== dateKey));
      const newTimes = { ...selectedTimes };
      delete newTimes[dateKey];
      setSelectedTimes(newTimes);
    } else {
      // Sort dates after adding new one
      const newDates = [...selectedDates, dateKey].sort(
        (a, b) => new Date(a) - new Date(b),
      );
      setSelectedDates(newDates);
      // Initialize empty array for this date
      setSelectedTimes((prev) => ({
        ...prev,
        [dateKey]: [],
      }));
    }
  };

  const handleNextFromDates = () => {
    if (selectedDates.length > 0) {
      setCurrentStep(2);
      setCurrentDateIndex(0);
    }
  };

  const handleBackToDateTime = () => {
    setCurrentStep(1);
    setCurrentDateIndex(0);
  };

  const handleTimeSelection = (time) => {
    const currentDateTimes = selectedTimes[selectedDateKey] || [];

    // Toggle time selection - if already selected, remove it; if not selected, add it
    if (currentDateTimes.includes(time)) {
      const newTimes = currentDateTimes.filter((t) => t !== time);
      setSelectedTimes((prev) => ({
        ...prev,
        [selectedDateKey]: newTimes,
      }));
    } else {
      // Add new time to the array
      setSelectedTimes((prev) => ({
        ...prev,
        [selectedDateKey]: [...currentDateTimes, time],
      }));
    }
  };

  const handleNextToConfirmation = () => {
    // Check if all selected dates have at least one time selected
    const allDatesHaveTime = selectedDates.every(
      (date) => selectedTimes[date] && selectedTimes[date].length > 0,
    );

    if (allDatesHaveTime) {
      // Transform the data structure for the confirmation modal
      // Create an array where each time slot is a separate entry
      const allSlots = [];
      selectedDates.forEach((date) => {
        selectedTimes[date].forEach((time) => {
          allSlots.push({
            date: date,
            time: time,
          });
        });
      });

      if (onBookingComplete) onBookingComplete(allSlots);
    }
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Use selectedDates and currentDateIndex to get the selected date key
  const selectedDateKey = selectedDates[currentDateIndex] || selectedDates[0];
  let availableTimes =
    slots && selectedDateKey ? slots[selectedDateKey] || [] : [];
  // Remove duplicate UTC times
  availableTimes = Array.from(
    new Map(availableTimes.map((t) => [t.utc, t])).values(),
  );
  const currentDate = selectedDateKey;
  const selectedTimesForCurrentDate = selectedTimes[selectedDateKey] || [];

  // Function to check if a time slot conflicts with selected slots
  const isTimeSlotConflicting = (timeObj) => {
    if (selectedTimesForCurrentDate.length === 0) return false;

    const slotTime = new Date(timeObj.utc);

    // Check if this slot conflicts with any selected slot
    return selectedTimesForCurrentDate.some((selectedTimeUtc) => {
      const selectedTime = new Date(selectedTimeUtc);
      const timeDiff = Math.abs(slotTime.getTime() - selectedTime.getTime());
      const minutesDiff = timeDiff / (1000 * 60);

      // If the time difference is less than 90 minutes (60 min class + 30 min buffer), it's conflicting
      return minutesDiff < 60;
    });
  };

  // Only allow selection of dates that have available slots
  // Use date keys in 'YYYY-MM-DD' format
  const availableDates = Object.keys(slots);

  return (
    <>
      <Modal
        isOpen={isOpen && currentStep !== 3}
        onRequestClose={onClose}
        className="fixed left-1/2 top-1/2 flex w-[90%] max-w-[440px] -translate-x-1/2 -translate-y-1/2 transform flex-col rounded-[48px] bg-white p-6 font-urbanist shadow-2xl outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center backdrop-blur-sm"
        ariaHideApp={false}
      >
        {loading ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center">
            <ClipLoader color="#14B82C" size={48} />
          </div>
        ) : currentStep === 1 ? (
          // Date Selection Step
          <>
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-medium">Choose up to 10 Days</h2>
              <button
                onClick={onClose}
                className="relative flex h-10 w-10 items-center justify-center rounded-full border-none bg-[#F6F6F6] p-0 transition hover:bg-[#ededed]"
              >
                <X className="h-6 w-6 text-gray-500 hover:text-gray-700" />
              </button>
            </div>

            {/* Calendar Header */}
            <div className="scrollbar-hide w-full max-w-4xl rounded-3xl border border-amber-400 bg-white p-3">
              <div className="mb-4 flex flex-col items-center gap-4 sm:mb-6">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentMonth(
                        new Date(
                          currentMonth.getFullYear(),
                          currentMonth.getMonth() - 1,
                        ),
                      )
                    }
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-[#888888] bg-white text-gray-600 transition hover:text-gray-800"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <h2 className="mx-auto text-lg font-medium text-gray-800 sm:text-xl">
                    {monthNames[currentMonth.getMonth()]}{" "}
                    {currentMonth.getFullYear()}
                  </h2>
                  <button
                    onClick={() =>
                      setCurrentMonth(
                        new Date(
                          currentMonth.getFullYear(),
                          currentMonth.getMonth() + 1,
                        ),
                      )
                    }
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-[#888888] bg-white text-gray-600 transition hover:text-gray-800"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Day Headers */}
              <div className="max-h-96 overflow-hidden transition-all duration-300 ease-in-out">
                <div className="scale-100 transform opacity-100 transition-all duration-300 ease-in-out">
                  <div className="mb-2 grid grid-cols-7 gap-1">
                    {dayNames.map((day) => (
                      <div
                        key={day}
                        className="flex h-8 items-center justify-center rounded-full border border-[#888888] bg-white px-4 text-center text-xs font-medium text-gray-700 sm:text-sm"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  <div className="ml-0 mr-5 grid grid-cols-7 gap-x-1 sm:gap-x-6 sm:gap-y-2 sm:p-1">
                    {generateCalendarDays().map((day, index) => {
                      // Build date key for this day in current month
                      const year = currentMonth.getFullYear();
                      const month = String(
                        currentMonth.getMonth() + 1,
                      ).padStart(2, "0");
                      const dayStr = String(day).padStart(2, "0");
                      const dateKey = day ? `${year}-${month}-${dayStr}` : null;
                      let enabled = !!day && availableDates.includes(dateKey);

                      // Disable if date is before today
                      let isPast = false;
                      if (day) {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const thisDate = new Date(
                          year,
                          currentMonth.getMonth(),
                          day,
                        );
                        isPast = thisDate < today;
                      }

                      // Disable past days but show them
                      enabled = enabled && !isPast;
                      return (
                        <button
                          key={index}
                          onClick={() => handleDateClick(day)}
                          disabled={!enabled}
                          className={`flex h-11 w-11 items-center justify-center rounded-full border text-center text-xl font-semibold transition-colors sm:h-12 sm:w-12 sm:text-[26px] ${
                            !enabled
                              ? "cursor-not-allowed border-[#e0e0e0] bg-gray-100 text-gray-400"
                              : selectedDates.includes(dateKey)
                                ? "border-[#888888] bg-[#DBFDDF] text-[#14B82C]"
                                : "border-[#888888] bg-white text-[#14B82C] hover:bg-gray-50"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Days Count */}
            <div className="mt-8 flex flex-col items-center gap-2 text-sm font-normal">
              <span className="text-sm text-gray-700">
                {selectedDates.length} Days Selected
              </span>
            </div>
            <button
              onClick={handleNextFromDates}
              disabled={selectedDates.length === 0}
              className={`mt-2 h-11 w-full rounded-full text-lg/5 font-semibold text-black ${
                selectedDates.length > 0
                  ? "bg-[#14B82C]"
                  : "cursor-not-allowed bg-[#b6e7c0]"
              }`}
            >
              Next
            </button>
          </>
        ) : (
          // Time Selection Step
          <>
            {/* Header */}
            <div className="flex h-full flex-col">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl/[100%] font-medium">
                  Choose times for{" "}
                  {new Date(currentDate).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                </h2>
                <button
                  className="relative flex h-10 w-10 items-center justify-center rounded-full border-none bg-[#F6F6F6] p-0 transition hover:bg-[#ededed]"
                  onClick={onClose}
                >
                  <X className="h-6 w-6 text-gray-500 hover:text-gray-700" />
                </button>
              </div>
            </div>

            {/* Duration and Timezone Info */}
            <div className="mb-6 flex justify-between text-sm text-gray-600">
              <span className="text-sm font-medium">
                Duration: <b>60 minutes</b>
              </span>
            </div>

            {/* Selected Times Count */}
            <div className="mb-4 text-center">
              <span className="text-sm text-gray-700">
                {selectedTimesForCurrentDate.length} times selected
              </span>
            </div>

            {/* Time Slots Grid */}
            <div className="mb-4 grid grid-cols-2 gap-3">
              {availableTimes.length === 0 ? (
                <div className="col-span-2 text-center text-gray-500">
                  No available times for this date.
                </div>
              ) : (
                availableTimes.map((timeObj, idx) => {
                  // --- Add this block ---
                  let isPastTime = false;
                  if (currentDate) {
                    const now = new Date();
                    const [hour, minute] = timeObj.display
                      .replace(/ AM| PM/, "")
                      .split(":")
                      .map(Number);
                    let slotHour = hour;
                    if (/PM/.test(timeObj.display) && hour !== 12)
                      slotHour += 12;
                    if (/AM/.test(timeObj.display) && hour === 12) slotHour = 0;

                    const slotDate = new Date(currentDate);
                    slotDate.setHours(slotHour, minute, 0, 0);

                    // Only check for today
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const isToday =
                      new Date(currentDate).setHours(0, 0, 0, 0) ===
                      today.getTime();
                    if (isToday && slotDate < now) isPastTime = true;
                  }
                  // --- End block ---

                  const isSelected = selectedTimesForCurrentDate.includes(
                    timeObj.utc,
                  );
                  const isConflicting = isTimeSlotConflicting(timeObj);
                  const isDisabled =
                    (isPastTime || isConflicting) && !isSelected;

                  return (
                    <button
                      key={timeObj.utc + "-" + idx}
                      onClick={() =>
                        !isPastTime && handleTimeSelection(timeObj.utc)
                      }
                      disabled={isPastTime}
                      className={`rounded-[16px] border px-2 py-3 text-base font-normal transition ${
                        isSelected
                          ? "border-[#14B82C] bg-[#DBFDDF] text-base font-semibold text-[#14B82C]"
                          : isDisabled
                            ? "cursor-not-allowed border-[#e0e0e0] bg-gray-100 text-gray-400"
                            : "border-[#B0B0B0] bg-white text-[#14B82C] hover:bg-[#DBFDDF]"
                      }`}
                      title={
                        isConflicting && !isSelected
                          ? "This time conflicts with a selected class"
                          : ""
                      }
                    >
                      {timeObj.display}
                    </button>
                  );
                })
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-auto flex w-full gap-4">
              <button
                onClick={() => {
                  if (currentDateIndex === 0) {
                    handleBackToDateTime();
                  } else {
                    setCurrentDateIndex((idx) => idx - 1);
                  }
                }}
                className="w-1/2 rounded-full border border-black bg-white px-6 py-2 text-base font-medium text-[#042F0C] transition-colors hover:bg-[#f6f6f6]"
              >
                Back
              </button>
              <button
                onClick={() => {
                  if (currentDateIndex === selectedDates.length - 1) {
                    handleNextToConfirmation();
                  } else {
                    setCurrentDateIndex((idx) => idx + 1);
                  }
                }}
                disabled={selectedTimesForCurrentDate.length === 0}
                className={`w-1/2 rounded-full border border-[#042F0C] px-6 py-2 text-base font-medium text-black transition-colors ${
                  selectedTimesForCurrentDate.length > 0
                    ? "bg-[#14B82C] hover:bg-green-600"
                    : "cursor-not-allowed bg-[#b6e7c0]"
                }`}
              >
                {currentDateIndex === selectedDates.length - 1
                  ? "Next"
                  : "Next"}
              </button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
};

export default ExamClassSlots;
