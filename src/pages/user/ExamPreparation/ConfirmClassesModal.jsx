import { Trash2 } from "lucide-react";
import Modal from "react-modal";
import ClassesBooked from "./ClassesBooked";
import { useState } from "react";
import { bookExamPrepClass } from "../../../api/examPrepApi";
import { useAuth } from "../../../context/AuthContext";

const ConfirmClassesModal = ({
  isOpen,
  onClose,
  onConfirm,
  onBack,
  selectedDates,
  selectedTimes,
  onRemoveClass,
  tutorId,
  user,
  ...props
}) => {
  const { user: authUser } = useAuth();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [booking, setBooking] = useState(false);

  // Convert dates and times to the format expected for booking
  const formatBookingData = () => {
    const classes = selectedDates.map((date) => {
      const time = selectedTimes[date];
      return {
        date: `${String(date).padStart(2, "0")}-05-25`, // Format as DD-MM-YY
        time: time,
        title: "Exam Prep Class",
        type: date % 2 === 0 ? "Class 6" : "Exam Prep Class", // Alternate between types for demo
      };
    });

    return {
      classes,
      totalClasses: classes.length,
      message: `By booking, you'll be able to join the class 5 minutes before it starts. It will also be added to your calendar.`,
    };
  };

  const handleConfirmBooking = async () => {
    setBooking(true);
    setError(null);
    try {
      if (!tutorId) {
        setError("No tutor selected. Please select a tutor.");
        setBooking(false);
        return;
      }
      // Build slots array: [{ time: ISOString }]
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
        studentId: user?.uid || authUser?.uid,
        tutorId: tutorId,
        slots,
      };
      console.log("[ConfirmClassesModal] Booking payload:", payload);
      const resp = await bookExamPrepClass(payload);
      console.log("[ConfirmClassesModal] API response:", resp);
      setBooking(false);
      setShowSuccessModal(true);
      if (onConfirm) onConfirm();
    } catch (err) {
      setBooking(false);
      setError(err.message || "Booking failed");
      console.log("[ConfirmClassesModal] API error:", err);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    const bookingData = formatBookingData();
    onConfirm(bookingData);
  };

  const bookingData = formatBookingData();

  // Helper function to get ordinal suffix
  const getOrdinalSuffix = (num) => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return "st";
    if (j === 2 && k !== 12) return "nd";
    if (j === 3 && k !== 13) return "rd";
    return "th";
  };

  return (
    <>
      <Modal
        isOpen={isOpen && !showSuccessModal}
        onRequestClose={onClose}
        className="fixed left-1/2 top-1/2 flex w-[90%] max-w-[640px] -translate-x-1/2 -translate-y-1/2 transform flex-col rounded-[40px] bg-white p-6 font-urbanist shadow-2xl outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center backdrop-blur-sm"
        ariaHideApp={false}
      >
        {/* Header */}
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold text-black">
            Are you sure you want to book <br /> these classes?
          </h2>
          <p className="mt-2 text-sm font-normal text-[#5D5D5D]">
            {bookingData.message}
          </p>
        </div>

        {/* Classes List */}
        <div className="max-h-90 mb-6 grid grid-cols-2 gap-2 overflow-y-auto">
          {bookingData.classes.map((classItem, index) => (
            <div
              key={index}
              className="flex flex-col justify-between rounded-2xl border border-[#14B82C] bg-[#F0FDF1] px-4 py-2"
            >
              {/* Title and Remove */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-black">
                  {classItem.title}
                </h3>
                <button
                  onClick={() =>
                    onRemoveClass && onRemoveClass(selectedDates[index])
                  }
                  className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Remove</span>
                </button>
              </div>
              {/* Date and Time */}
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs font-medium text-[#3D3D3D]">
                  {classItem.date}
                </p>
                <p className="text-xs font-medium text-[#3D3D3D]">
                  {classItem.time} <span className="align-middle">(UTC)</span>
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-9 pt-3">
          <button
            onClick={onBack}
            className="flex-1 rounded-full border border-[#042F0C] bg-white px-5 py-2 text-base font-medium text-black transition-colors hover:bg-gray-50"
          >
            No, Cancel
          </button>
          <button
            onClick={handleConfirmBooking}
            className="flex-1 rounded-full border border-[#042F0C] bg-[#14B82C] px-5 py-2 text-base font-medium text-black transition-colors hover:bg-green-600"
          >
            Yes, Book Now
          </button>
        </div>
      </Modal>
      <ClassesBooked
        isOpen={showSuccessModal}
        onClose={handleSuccessClose}
        bookedClassesCount={selectedDates.length}
        totalAvailableClasses={10}
      />
      {loading && <div>Booking classes...</div>}
      {error && <div className="text-red-500">{error}</div>}
    </>
  );
};

export default ConfirmClassesModal;
