import { ChevronLeft, ChevronRight, X } from "lucide-react";
import React, { useState } from "react";
import Modal from "react-modal";
import ConfirmClassesModal from "./ConfirmClassesModal";
import { bookExamPrepClass } from "../../../api/examPrepApi";

const ExamClassSlots = ({
  isOpen,
  onClose,
  onBookingComplete,
  slots = {},
  user,
  tutorId,
}) => {
  console.log("[ExamClassSlots] slots prop received:", slots);
  const [currentStep, setCurrentStep] = useState(1); // 1: date selection, 2: time selection, 3: confirmation
  const [selectedDates, setSelectedDates] = useState([]);
  const [selectedTimes, setSelectedTimes] = useState({}); // Object to store time for each date
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 4)); // May 2025
  const [sameTime, setSameTime] = useState(false);
  const [currentDateIndex, setCurrentDateIndex] = useState(0);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState(null);

  const handleRemoveClass = (dateToRemove) => {
    setSelectedDates(selectedDates.filter((d) => d !== dateToRemove));
    const newTimes = { ...selectedTimes };
    delete newTimes[dateToRemove];
    setSelectedTimes(newTimes);
  };

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
    if (selectedDates.includes(dateKey)) {
      setSelectedDates(selectedDates.filter((d) => d !== dateKey));
      const newTimes = { ...selectedTimes };
      delete newTimes[dateKey];
      setSelectedTimes(newTimes);
    } else if (selectedDates.length < MAX_DATES) {
      setSelectedDates([...selectedDates, dateKey]);
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
    const currentDate = selectedDates[currentDateIndex];
    setSelectedTimes((prev) => ({
      ...prev,
      [currentDate]: time,
    }));
  };

  const handleNextDate = () => {
    if (currentDateIndex < selectedDates.length - 1) {
      setCurrentDateIndex(currentDateIndex + 1);
    }
  };

  const handlePrevDate = () => {
    if (currentDateIndex > 0) {
      setCurrentDateIndex(currentDateIndex - 1);
    }
  };

  const handleNextToConfirmation = () => {
    // Check if all dates have times selected
    const allDatesHaveTime = selectedDates.every((date) => selectedTimes[date]);
    if (allDatesHaveTime) {
      setCurrentStep(3);
    }
  };

  const handleBackFromConfirmation = () => {
    setCurrentStep(2);
  };

  const handleFinalBooking = async () => {
    setBooking(true);
    setError(null);
    try {
      const slots = selectedDates.map((date) => {
        const timeStr = selectedTimes[date];
        const [year, month, day] = date.split("-").map(Number);
        let [h, m] = timeStr.split(":");
        m = m.slice(0, 2);
        let hour = parseInt(h, 10);
        let minute = parseInt(m, 10);
        const isPM = timeStr.toLowerCase().includes("pm");
        if (isPM && hour !== 12) hour += 12;
        if (!isPM && hour === 12) hour = 0;
        const d = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));
        return { time: d.toISOString() };
      });
      const payload = {
        studentId: user?.uid,
        tutorId: tutorId,
        slots,
      };
      console.log("[ExamClassSlots] Booking payload:", payload);
      const resp = await bookExamPrepClass(payload);
      console.log("[ExamClassSlots] API response:", resp);
      setBooking(false);
      if (onBookingComplete)
        onBookingComplete({ dates: selectedDates, times: selectedTimes });
      if (onClose) onClose();
    } catch (err) {
      setBooking(false);
      setError(err.message || "Booking failed");
    }
  };

  const handleSameTimeToggle = () => {
    setSameTime(!sameTime);
    if (!sameTime && selectedTimes[selectedDates[currentDateIndex]]) {
      // If turning on same time and current date has a time, apply to all
      const currentTime = selectedTimes[selectedDates[currentDateIndex]];
      const newTimes = {};
      selectedDates.forEach((date) => {
        newTimes[date] = currentTime;
      });
      setSelectedTimes(newTimes);
    }
  };

  const timeSlots = [
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "01:00 PM",
    "02:00 PM",
    "03:00 PM",
    "04:00 PM",
    "05:00 PM",
    "06:00 PM",
    "07:00 PM",
    "08:00 PM",
    "09:00 PM",
    "10:00 PM",
    "11:00 PM",
  ];

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

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Check if we can proceed to next step
  const canProceedToConfirmation =
    selectedDates.length > 0 &&
    selectedDates.every((date) => selectedTimes[date]);
  // Use selectedDates and currentDateIndex to get the selected date key
  const selectedDateKey = selectedDates[0];
  let availableTimes =
    slots && selectedDateKey ? slots[selectedDateKey] || [] : [];
  // Remove duplicate times
  availableTimes = Array.from(new Set(availableTimes));
  const currentDate = selectedDateKey;
  const selectedTime = selectedTimes[selectedDateKey] || "";

  // Only allow selection of dates that have available slots
  // Use date keys in 'YYYY-MM-DD' format
  const availableDates = Object.keys(slots);
  console.log("[ExamClassSlots] availableDates:", availableDates);

  const MAX_DATES = 10;

  return (
    <>
      <Modal
        isOpen={isOpen && currentStep !== 3}
        onRequestClose={onClose}
        className="fixed left-1/2 top-1/2 flex w-[90%] max-w-[440px] -translate-x-1/2 -translate-y-1/2 transform flex-col rounded-[48px] bg-white p-6 font-urbanist shadow-2xl outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center backdrop-blur-sm"
        ariaHideApp={false}
      >
        {currentStep === 1 ? (
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
                      const enabled = !!day && availableDates.includes(dateKey);
                      if (typeof window !== "undefined") {
                        console.log(
                          `[ExamClassSlots] day: ${day}, dateKey: ${dateKey}, enabled: ${enabled}`,
                        );
                      }
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
                  {sameTime
                    ? "Choose time for all dates"
                    : `Choose time for ${currentDate}`}
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
              <span>Time zone: UTC</span>
            </div>

            {/* Time Slots Grid */}
            <div className="mb-4 grid grid-cols-2 gap-3">
              {availableTimes.length === 0 ? (
                <div className="col-span-2 text-center text-gray-500">
                  No available times for this date.
                </div>
              ) : (
                availableTimes.map((time, idx) => (
                  <button
                    key={time + "-" + idx}
                    onClick={() => handleTimeSelection(time)}
                    className={`rounded-[16px] border px-2 py-3 text-base font-normal transition ${
                      selectedTime === time
                        ? "border-[#14B82C] bg-[#DBFDDF] text-base font-semibold text-[#14B82C]"
                        : "border-[#B0B0B0] bg-white text-[#14B82C] hover:bg-[#DBFDDF]"
                    }`}
                  >
                    {time}
                  </button>
                ))
              )}
            </div>

            {/* Date Navigation (only show when not same time) */}
            {!sameTime && selectedDates.length > 1 && (
              <div className="mb-4 flex items-center justify-between">
                <button
                  onClick={handlePrevDate}
                  disabled={currentDateIndex === 0}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                    currentDateIndex === 0
                      ? "cursor-not-allowed text-gray-400"
                      : "text-[#14B82C] hover:bg-[#DBFDDF]"
                  }`}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous Date
                </button>

                <span className="text-sm text-gray-600">
                  {Object.keys(selectedTimes).length} / {selectedDates.length}{" "}
                  completed
                </span>

                <button
                  onClick={handleNextDate}
                  disabled={
                    currentDateIndex === selectedDates.length - 1 ||
                    !selectedTime
                  }
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                    currentDateIndex === selectedDates.length - 1 ||
                    !selectedTime
                      ? "cursor-not-allowed text-gray-400"
                      : "text-[#14B82C] hover:bg-[#DBFDDF]"
                  }`}
                >
                  Next Date
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Same Time Toggle */}
            <div className="mb-4 flex items-center rounded-[999px] border border-gray-200 px-4 py-2 shadow-sm">
              <label
                htmlFor="same-time"
                className="flex w-full cursor-pointer items-center gap-2"
              >
                <input
                  type="checkbox"
                  id="same-time"
                  className="peer sr-only"
                  checked={sameTime}
                  onChange={handleSameTimeToggle}
                />
                <div className="relative h-6 w-10 rounded-full bg-gray-200 transition-colors duration-300 peer-checked:bg-[#14B82C]">
                  <div
                    className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform duration-300 ${
                      sameTime ? "translate-x-4" : ""
                    }`}
                  />
                </div>
                <span className="text-base font-normal text-black">
                  Select same time slot for all dates
                </span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="mt-auto flex w-full gap-4">
              <button
                onClick={handleBackToDateTime}
                className="w-1/2 rounded-full border border-black bg-white px-6 py-2 text-base font-medium text-[#042F0C] transition-colors hover:bg-[#f6f6f6]"
              >
                Back
              </button>
              <button
                onClick={handleNextToConfirmation}
                disabled={!canProceedToConfirmation}
                className={`w-1/2 rounded-full border border-[#042F0C] px-6 py-2 text-base font-medium text-black transition-colors ${
                  canProceedToConfirmation
                    ? "bg-[#14B82C] hover:bg-green-600"
                    : "cursor-not-allowed bg-[#b6e7c0]"
                }`}
              >
                Next
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* Confirmation Modal */}
      <ConfirmClassesModal
        isOpen={currentStep === 3}
        onClose={onClose}
        onConfirm={handleFinalBooking}
        onBack={handleBackFromConfirmation}
        selectedDates={
          Array.isArray(selectedDates)
            ? selectedDates
            : selectedDates
              ? [selectedDates]
              : []
        }
        selectedTimes={selectedTimes}
        onRemoveClass={handleRemoveClass}
        user={user}
        tutorId={tutorId}
      />
      {console.log("[ExamClassSlots] Passing to ConfirmClassesModal:", {
        user,
        tutorId,
      })}
    </>
  );
};

export default ExamClassSlots;
