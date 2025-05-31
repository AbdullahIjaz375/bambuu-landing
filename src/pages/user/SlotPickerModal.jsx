import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useState } from "react";
import Modal from "react-modal";
import ExamBookingConfirmation from "./ExamBookingConfirmation";

// Dummy slot data for available/unavailable days
const dummySlots = {
  "2025-05-04": [
    "10:00 AM",
    "11:00 AM",
    "12:00 AM",
    "01:00 PM",
    "02:00 PM",
    "03:00 PM",
    "04:00 PM",
    "05:00 PM",
  ],
  "2025-05-06": ["10:00 AM"],
  "2025-05-07": ["10:00 AM"],
  "2025-05-08": ["10:00 AM"],
  "2025-05-09": ["10:00 AM"],
  "2025-05-10": ["10:00 AM"],
  "2025-05-13": ["10:00 AM"],
  "2025-05-14": ["10:00 AM"],
  "2025-05-16": ["10:00 AM"],
  "2025-05-17": [
    "10:00 AM",
    "11:00 AM",
    "12:00 AM",
    "01:00 PM",
    "02:00 PM",
    "03:00 PM",
    "04:00 PM",
    "05:00 PM",
  ],
  "2025-05-20": ["10:00 AM"],
  "2025-05-21": ["10:00 AM"],
  "2025-05-23": ["10:00 AM"],
  "2025-05-24": ["10:00 AM"],
  "2025-05-27": ["10:00 AM"],
  "2025-05-28": ["10:00 AM"],
  "2025-05-29": ["10:00 AM"],
  "2025-05-30": ["10:00 AM"],
};

const getDaysInMonth = (year, month) => {
  const date = new Date(year, month, 1);
  const days = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
};
const SlotPickerModal = ({ isOpen, onClose }) => {
  const [date, setDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const year = date.getFullYear();
  const month = date.getMonth();
  const days = getDaysInMonth(year, month);

  const weekDayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // For calendar grid alignment
  const firstDay = days[0].getDay(); // 0 (Sun) - 6 (Sat)
  // Adjust so Monday is first column
  const offset = firstDay === 0 ? 6 : firstDay - 1;

  // For time slot grid
  const timeSlots = (selectedDate && dummySlots[selectedDate]) || [];

  const navigateMonth = (direction) => {
    const newDate = new Date(date);
    newDate.setMonth(date.getMonth() + (direction === "next" ? 1 : -1));
    setDate(newDate);
  };

  const formatHeader = (date) => {
    const month = date
      .toLocaleString("default", { month: "long" })
      .toUpperCase();
    const year = date.getFullYear();
    return `${month}, ${year}`;
  };

  return (
    <>
      <Modal
        isOpen={isOpen && !showConfirm}
        onRequestClose={onClose}
        className="fixed left-1/2 top-1/2 flex w-auto max-w-[98vw] -translate-x-1/2 -translate-y-1/2 flex-col rounded-[2.5rem] bg-white p-0 font-urbanist shadow-xl outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-20 z-50 flex items-center justify-center backdrop-blur-sm"
        ariaHideApp={false}
      >
        <div className="flex flex-col px-8 pb-6 pt-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-medium">Pick your Slot</h2>
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F6F6F6] hover:bg-[#ededed]"
              onClick={onClose}
            >
              <X className="h-6 w-6 text-[#3D3D3D]" />
            </button>
          </div>
          <div className="flex gap-8">
            {/* Calendar Section - Always visible */}
            <div className="scrollbar-hide w-full max-w-4xl rounded-3xl border border-amber-400 bg-white p-3">
              {/* Calendar header */}
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
              {/* Days of week */}
              <div className="mb-2 grid grid-cols-7 gap-1">
                {weekDayLabels.map((day) => (
                  <div
                    key={day}
                    className="flex h-8 items-center justify-center rounded-full border border-[#888888] bg-white px-2 text-center text-xs font-medium text-gray-700 sm:text-sm"
                  >
                    {day}
                  </div>
                ))}
              </div>
              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-2">
                {/* Offset for first day */}
                {[...Array(offset)].map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {days.map((date) => {
                  // const dateStr = date.toISOString().slice(0, 10);
                  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                  const available = !!dummySlots[dateStr];
                  const isSelected = selectedDate === dateStr;
                  return (
                    <button
                      key={dateStr}
                      disabled={!available}
                      onClick={() => available && setSelectedDate(dateStr)}
                      className={`relative flex h-10 w-10 items-center justify-center rounded-full border ${
                        available
                          ? isSelected
                            ? "border-[#888888] bg-[#DBFDDF] text-xl font-semibold text-[#14B82C]"
                            : "border-[#888888] bg-white text-xl font-semibold text-[#14B82C] hover:bg-[#E6FDE9]"
                          : "border-[#E7E7E7] bg-white text-xl font-semibold text-[#D1D1D1]"
                      } ${available && "hover:border-[#14B82C]"} `}
                    >
                      <span>{date.getDate()}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time slots section - Only visible when date is selected */}
            {selectedDate && (
              <div className="flex min-w-[230px] flex-col justify-start pt-2">
                <div className="mb-2 text-[15px]">
                  <span className="text-[#222]">Duration:</span>{" "}
                  <span className="font-semibold">30 minutes</span>
                </div>
                <div className="mb-4 text-[15px]">
                  <span className="text-[#222]">Time zone:</span>{" "}
                  <span className="font-semibold">UTC</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => {
                        setSelectedTime(slot);
                        setShowConfirm(true); // Open confirmation modal immediately
                      }}
                      className={`rounded-xl border px-4 py-2 text-[15px] font-medium transition ${
                        selectedTime === slot
                          ? "border-[#14B82C] bg-[#14B82C] text-white"
                          : "border-[#14B82C] text-[#14B82C] hover:bg-[#E6FDE9]"
                      } `}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>
      {showConfirm && (
        <ExamBookingConfirmation
          showConfirm={showConfirm}
          setShowConfirm={setShowConfirm}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
        />
      )}
    </>
  );
};

export default SlotPickerModal;
