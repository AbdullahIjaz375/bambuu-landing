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

const TimeSlotModal = ({
  selectedDates,
  onClose,
  onNext,
  prefilledSlotsByDate = {},
}) => {
  // selectedSlotsByDate: { [dateString]: ["10:00 AM", ...] }
  const [selectedSlotsByDate, setSelectedSlotsByDate] = useState(() => {
    const obj = {};
    selectedDates.forEach((date) => {
      obj[date] = [];
    });
    return obj;
  });
  const [sameTime, setSameTime] = useState(false);
  const [activeDateIdx, setActiveDateIdx] = useState(0);

  useEffect(() => {
    // Prefill slots if provided and not already selected
    setSelectedSlotsByDate((prev) => {
      const obj = { ...prev };
      selectedDates.forEach((date) => {
        if (
          prefilledSlotsByDate[date] &&
          (!prev[date] || prev[date].length === 0)
        ) {
          obj[date] = [...prefilledSlotsByDate[date]];
        }
      });
      return obj;
    });
    // eslint-disable-next-line
  }, [prefilledSlotsByDate, selectedDates]);

  const currentDate = selectedDates[activeDateIdx];
  const handleSlotClick = (slot) => {
    setSelectedSlotsByDate((prev) => {
      const prevSlots = prev[currentDate] || [];
      return {
        ...prev,
        [currentDate]: prevSlots.includes(slot)
          ? prevSlots.filter((s) => s !== slot)
          : [...prevSlots, slot],
      };
    });
  };

  const handleNext = () => {
    let slots = [];
    if (sameTime) {
      // Use the slots from the first date for all dates
      const firstDate = selectedDates[0];
      const times = (selectedSlotsByDate[firstDate] || [])
        .map((slot) =>
          selectedDates.map((date) => ({
            date,
            time: slot,
          })),
        )
        .flat();
      // Group by date
      const grouped = {};
      times.forEach(({ date, time }) => {
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push({
          time: getDateWithTime(date, time),
          booked: false,
        });
      });
      slots = Object.values(
        Object.keys(grouped).reduce((acc, date) => {
          acc[date] = { times: grouped[date] };
          return acc;
        }, {}),
      );
    } else {
      slots = selectedDates
        .map((date) => ({
          times: (selectedSlotsByDate[date] || []).map((slot) => ({
            time: getDateWithTime(date, slot),
            booked: false,
          })),
        }))
        .filter((slotObj) => slotObj.times.length > 0);
    }
    onNext(slots);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl/[100%] font-medium">
          Choose time for{" "}
          {new Date(currentDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </h2>
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
          const selected = (selectedSlotsByDate[currentDate] || []).includes(
            slot,
          );
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
      <div className="mb-2 flex justify-between">
        <button
          className="rounded-full border border-[#5D5D5D] bg-white px-8 py-2 font-semibold text-[#042f0c]"
          onClick={() => {
            onClose("back");
          }}
        >
          Back
        </button>
        <div className="flex gap-2">
          {selectedDates.length > 1 && !sameTime && (
            <>
              <button
                className="rounded-full border border-[#5D5D5D] bg-white px-4 py-2 font-semibold text-[#042f0c]"
                disabled={activeDateIdx === 0}
                onClick={() => setActiveDateIdx((idx) => Math.max(0, idx - 1))}
              >
                Previous Date
              </button>
              <button
                className="rounded-full border border-[#5D5D5D] bg-white px-4 py-2 font-semibold text-[#042f0c]"
                disabled={activeDateIdx === selectedDates.length - 1}
                onClick={() =>
                  setActiveDateIdx((idx) =>
                    Math.min(selectedDates.length - 1, idx + 1),
                  )
                }
              >
                Next Date
              </button>
            </>
          )}
        </div>
        <button
          disabled={
            sameTime
              ? (selectedSlotsByDate[selectedDates[0]] || []).length === 0
              : selectedDates.some(
                  (date) => (selectedSlotsByDate[date] || []).length === 0,
                )
          }
          onClick={handleNext}
          className={`rounded-full bg-[#14B82C] px-8 py-2 font-semibold text-black ${
            sameTime
              ? (selectedSlotsByDate[selectedDates[0]] || []).length === 0
                ? "cursor-not-allowed bg-[#b6e7c0]"
                : "bg-[#14B82C]"
              : selectedDates.some(
                    (date) => (selectedSlotsByDate[date] || []).length === 0,
                  )
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
