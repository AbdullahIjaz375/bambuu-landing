import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { ClipLoader } from "react-spinners";
import Modal from "react-modal";

const getDaysInMonth = (year, month) => {
  const date = new Date(year, month, 1);
  const days = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
};

const SlotPickerModal = ({
  isOpen,
  onClose,
  onSlotPicked,
  slots = {},
  loading,
}) => {
  const [date, setDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  const year = date.getFullYear();
  const month = date.getMonth();
  const days = getDaysInMonth(year, month);

  const weekDayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // For calendar grid alignment
  const firstDay = days[0].getDay(); // 0 (Sun) - 6 (Sat)
  // Adjust so Monday is first column
  const offset = firstDay === 0 ? 6 : firstDay - 1;

  // Use the real slots prop for available dates
  const availableDates = Object.keys(slots);

  // Use the real slots prop for time slots
  const timeSlots = (selectedDate && slots[selectedDate]) || [];

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
        isOpen={isOpen}
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
          <div className="flex min-h-[340px] gap-8">
            {/* Calendar Section - Always visible, loader overlays calendar */}
            <div className="scrollbar-hide relative flex w-full max-w-4xl flex-col rounded-3xl border border-amber-400 bg-white p-3">
              {/* Loader overlay */}
              {loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-white bg-opacity-80">
                  <ClipLoader color="#14B82C" size={48} />
                </div>
              )}
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
                  const dateStr = `${date.getFullYear()}-${String(
                    date.getMonth() + 1,
                  ).padStart(
                    2,
                    "0",
                  )}-${String(date.getDate()).padStart(2, "0")}`;
                  const available = !!slots[dateStr];
                  const isSelected = selectedDate === dateStr;

                  // Disable if date is in the past
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const isPast = date < today;

                  return (
                    <button
                      key={dateStr}
                      disabled={!available || isPast}
                      onClick={() =>
                        available && !isPast && setSelectedDate(dateStr)
                      }
                      className={`relative flex h-10 w-10 items-center justify-center rounded-full border ${
                        available && !isPast
                          ? isSelected
                            ? "border-[#888888] bg-[#DBFDDF] text-xl font-semibold text-[#14B82C]"
                            : "border-[#888888] bg-white text-xl font-semibold text-[#14B82C] hover:bg-[#E6FDE9]"
                          : "cursor-not-allowed border-[#E7E7E7] bg-white text-xl font-semibold text-[#D1D1D1]"
                      } ${available && !isPast && "hover:border-[#14B82C]"} `}
                    >
                      <span>{date.getDate()}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time slots section - Only visible when date is selected and not loading */}
            {!loading && selectedDate && (
              <div className="flex min-w-[230px] flex-col justify-start pt-2">
                <div className="mb-2 text-lg font-semibold text-[#222]">
                  {new Date(selectedDate).toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
                <div className="mb-2 text-[15px]">
                  <span className="text-[#222]">Duration:</span>{" "}
                  <span className="font-semibold">30 minutes</span>
                </div>
                <div
                  className="scrollbar-hide grid grid-cols-2 gap-2 overflow-y-auto"
                  style={{ maxHeight: "340px" }}
                >
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => {
                        setSelectedTime(slot);
                        if (onSlotPicked) onSlotPicked(selectedDate, slot);
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
    </>
  );
};

export default SlotPickerModal;
