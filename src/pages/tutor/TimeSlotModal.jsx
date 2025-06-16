import { X } from "lucide-react";
import { useState, useEffect } from "react";

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
  "12:00 AM",
];

function getDateWithTime(date, timeStr) {
  // date: Date object or string, timeStr: "HH:MM AM/PM"
  const d = new Date(date);
  let [h, m] = timeStr.split(":");
  m = m.slice(0, 2);
  let hour = parseInt(h, 10);
  let minute = parseInt(m, 10);
  const isPM = timeStr.toLowerCase().includes("pm");
  if (isPM && hour !== 12) hour += 12;
  if (!isPM && hour === 12) hour = 0;
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function formatDateKey(date) {
  // Accepts Date object or string, returns "YYYY-MM-DD"
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const TimeSlotModal = ({
  selectedDates,
  onClose,
  onNext,
  prefilledSlotsByDate = {},
  type,
}) => {
  // Initialize with prefilled data from the start
  const [selectedSlotsByDate, setSelectedSlotsByDate] = useState(() => {
    const obj = {};
    selectedDates.forEach((date) => {
      const dateKey = formatDateKey(date);
      obj[dateKey] = prefilledSlotsByDate[dateKey]
        ? [...prefilledSlotsByDate[dateKey]]
        : [];
    });
    return obj;
  });
  const [activeDateIdx, setActiveDateIdx] = useState(0);

  // Update when prefilledSlotsByDate or selectedDates change
  useEffect(() => {
    setSelectedSlotsByDate((prev) => {
      const obj = {};
      selectedDates.forEach((date) => {
        const dateKey = formatDateKey(date);
        if (
          prefilledSlotsByDate[dateKey] &&
          prefilledSlotsByDate[dateKey].length > 0
        ) {
          obj[dateKey] = [...prefilledSlotsByDate[dateKey]];
        } else if (prev[dateKey]) {
          obj[dateKey] = [...prev[dateKey]];
        } else {
          obj[dateKey] = [];
        }
      });
      return obj;
    });
  }, [prefilledSlotsByDate, selectedDates]);

  const currentDate = selectedDates[activeDateIdx];
  const currentDateKey = formatDateKey(currentDate);

  const handleSlotClick = (slot) => {
    setSelectedSlotsByDate((prev) => {
      const prevSlots = prev[currentDateKey] || [];
      return {
        ...prev,
        [currentDateKey]: prevSlots.includes(slot)
          ? prevSlots.filter((s) => s !== slot)
          : [...prevSlots, slot],
      };
    });
  };

  const handleNext = () => {
    // Flatten all selected slots into a single times array
    const times = selectedDates.flatMap((date) => {
      const dateKey = formatDateKey(date);
      return (selectedSlotsByDate[dateKey] || []).map((slot) => ({
        time: getDateWithTime(date, slot),
        booked: false,
      }));
    });
    onNext([{ times }]);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl/[100%] font-medium">
          Choose time for{" "}
          {new Date(currentDate).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
          })}
        </h2>
        <button onClick={onClose}>
          <X className="h-6 w-6 text-gray-500 hover:text-gray-700" />
        </button>
      </div>
      <div className="mb-2 mt-5 flex items-center gap-4">
        <span className="text-sm text-gray-700">
          Duration: <b>{type === "intro" ? 30 : 60} minutes</b>
        </span>
      </div>
      <div className="mb-4 grid grid-cols-4 gap-3">
        {timeSlots.map((slot) => {
          let isPastTime = false;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const slotDate = new Date(currentDate);
          slotDate.setHours(0, 0, 0, 0);

          // If current date is today, check if slot time is in the past
          if (slotDate.getTime() === today.getTime()) {
            // Parse slot time
            let [hour, minute] = slot.split(":");
            minute = parseInt(minute, 10);
            hour = parseInt(hour, 10);
            const isPM = slot.toLowerCase().includes("pm");
            if (isPM && hour !== 12) hour += 12;
            if (!isPM && hour === 12) hour = 0;

            const slotDateTime = new Date(currentDate);
            slotDateTime.setHours(hour, minute, 0, 0);

            if (slotDateTime < new Date()) {
              isPastTime = true;
            }
          }
          const selected =
            (selectedSlotsByDate[currentDateKey] || []).includes(slot) &&
            !isPastTime;

          return (
            <button
              key={slot}
              type="button"
              onClick={() => !isPastTime && handleSlotClick(slot)}
              disabled={isPastTime}
              className={`rounded-[16px] border px-4 py-2 text-base font-normal transition ${
                selected
                  ? "border-[#14B82C] bg-[#DBFDDF] text-[#042F0C]"
                  : isPastTime
                    ? "cursor-not-allowed border-[#e0e0e0] bg-gray-100 text-gray-400"
                    : "border-[#B0B0B0] bg-white text-[#888888] hover:bg-[#DBFDDF]"
              } `}
            >
              {slot}
            </button>
          );
        })}
      </div>
      <div className="mb-2 flex justify-between">
        <button
          className="rounded-full border border-[#5D5D5D] bg-white px-8 py-2 font-semibold text-[#042f0c]"
          onClick={() => {
            if (activeDateIdx === 0) {
              onClose("back");
            } else {
              setActiveDateIdx((idx) => idx - 1);
            }
          }}
        >
          Back
        </button>
        <button
          disabled={
            // Disable if no valid (future) slot is selected for this date
            (selectedSlotsByDate[currentDateKey] || []).length === 0 ||
            (selectedSlotsByDate[currentDateKey] || []).every((slot) => {
              // isPastTime logic for this slot
              let isPastTime = false;
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const slotDate = new Date(currentDate);
              slotDate.setHours(0, 0, 0, 0);
              if (slotDate.getTime() === today.getTime()) {
                let [hour, minute] = slot.split(":");
                minute = parseInt(minute, 10);
                hour = parseInt(hour, 10);
                const isPM = slot.toLowerCase().includes("pm");
                if (isPM && hour !== 12) hour += 12;
                if (!isPM && hour === 12) hour = 0;
                const slotDateTime = new Date(currentDate);
                slotDateTime.setHours(hour, minute, 0, 0);
                if (slotDateTime < new Date()) {
                  isPastTime = true;
                }
              }
              return isPastTime;
            })
          }
          onClick={() => {
            if (activeDateIdx === selectedDates.length - 1) {
              handleNext();
            } else {
              setActiveDateIdx((idx) => idx + 1);
            }
          }}
          className={`rounded-full bg-[#14B82C] px-8 py-2 font-semibold text-black ${
            (selectedSlotsByDate[currentDateKey] || []).length === 0 ||
            (selectedSlotsByDate[currentDateKey] || []).every((slot) => {
              // isPastTime logic for this slot (same as above)
              let isPastTime = false;
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const slotDate = new Date(currentDate);
              slotDate.setHours(0, 0, 0, 0);
              if (slotDate.getTime() === today.getTime()) {
                let [hour, minute] = slot.split(":");
                minute = parseInt(minute, 10);
                hour = parseInt(hour, 10);
                const isPM = slot.toLowerCase().includes("pm");
                if (isPM && hour !== 12) hour += 12;
                if (!isPM && hour === 12) hour = 0;
                const slotDateTime = new Date(currentDate);
                slotDateTime.setHours(hour, minute, 0, 0);
                if (slotDateTime < new Date()) {
                  isPastTime = true;
                }
              }
              return isPastTime;
            })
              ? "cursor-not-allowed bg-[#b6e7c0]"
              : "bg-[#14B82C]"
          }`}
        >
          {activeDateIdx === selectedDates.length - 1 ? "Next" : "Next"}
        </button>
      </div>
    </div>
  );
};

export default TimeSlotModal;
