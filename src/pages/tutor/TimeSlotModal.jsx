import { X } from "lucide-react";
import { useState } from "react";

const timeSlots = [
  "01:00 AM",
  "02:00 AM",
  "03:00 AM",
  "04:00 AM",
  "05:00 AM",
  "06:00 AM",
  "07:00 AM",
  "08:00 AM",
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 AM",
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
  "12:00 PM",
];

const TimeSlotModal = ({ selectedDates, onClose, onNext }) => {
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [sameTime, setSameTime] = useState(false);

  const handleSlotClick = (slot) => {
    setSelectedSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot],
    );
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl/[100%] font-medium">Choose time for 7 May</h2>
        <button onClick={onClose}>
          <X className="h-6 w-6 text-gray-500 hover:text-gray-700" />
        </button>
      </div>
      <div className="mb-2 mt-5 flex items-center gap-4">
        <span className="text-sm text-gray-700">
          Duration: <b>60 minutes</b>
        </span>
        <span className="ml-auto text-sm text-gray-700">
          Time zone: <b>UTC</b>
        </span>
      </div>
      <div className="mb-4 grid grid-cols-4 gap-3">
        {timeSlots.map((slot) => {
          const selected = selectedSlots.includes(slot);
          return (
            <button
              key={slot}
              type="button"
              onClick={() => handleSlotClick(slot)}
              className={`rounded-[16px] border px-4 py-2 text-base font-normal transition ${
                selected
                  ? "border-[#14B82C] bg-[#DBFDDF] text-[#042F0C]"
                  : "border-[#B0B0B0] bg-white text-[#888888] hover:bg-[#DBFDDF]"
              } `}
            >
              {slot}
            </button>
          );
        })}
      </div>
      <div className="mb-4 mt-5 flex items-center rounded-[999px] border border-gray-200 px-4 py-2 shadow-sm">
        <label
          htmlFor="same-time"
          className="flex w-full cursor-pointer items-center gap-2"
        >
          <input
            type="checkbox"
            id="same-time"
            className="peer sr-only"
            checked={sameTime}
            onChange={() => setSameTime((prev) => !prev)}
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
      <div className="mt-auto flex justify-between">
        <button
          className="rounded-full border border-[#5D5D5D] bg-white px-8 py-2 font-semibold text-[#042f0c]"
          onClick={() => {
            onClose("back");
          }}
        >
          Back
        </button>
        <button
          disabled={selectedSlots.length === 0}
          onClick={onNext}
          className={`rounded-full bg-[#14B82C] px-8 py-2 font-semibold text-black ${
            selectedSlots.length === 0
              ? "cursor-not-allowed bg-[#b6e7c0]"
              : "bg-[#14B82C]"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default TimeSlotModal;
