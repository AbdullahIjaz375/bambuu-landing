import { useState } from "react";
import { Trash2 } from "lucide-react";
import { ClipLoader } from "react-spinners";
import Modal from "react-modal";
import ClassesBooked from "./ClassesBooked";
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
  loading: externalLoading,
  ...props
}) => {
  const { user: authUser } = useAuth();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [booking, setBooking] = useState(false);

  // Use either external loading prop or internal booking state
  const isLoading = externalLoading || booking;

  // Ensure selectedDates is always an array
  const normalizedSelectedDates = Array.isArray(selectedDates)
    ? selectedDates
    : selectedDates
      ? [selectedDates]
      : [];

  // Ensure selectedTimes is always an object
  const normalizedSelectedTimes =
    selectedTimes && typeof selectedTimes === "object" ? selectedTimes : {};

  // Convert dates and times to the format expected for booking
  const formatBookingData = () => {
    const classes = normalizedSelectedDates.map((date) => {
      const utcTime = normalizedSelectedTimes[date];
      const localTime = utcTime
        ? new Date(utcTime).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
        : "";
      return {
        date: date,
        time: localTime,
        title: "Exam Prep Class",
        type: date % 2 === 0 ? "Class 6" : "Exam Prep Class",
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
      const slots = normalizedSelectedDates.map((date) => ({
        time: normalizedSelectedTimes[date], // UTC string
      }));
      const payload = {
        studentId: user?.uid || authUser?.uid,
        tutorId: tutorId,
        slots,
      };
      const resp = await bookExamPrepClass(payload);
      setBooking(false);
      setShowSuccessModal(true);
      if (onConfirm) onConfirm();
    } catch (err) {
      setBooking(false);
      setError(err.message || "Booking failed");
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    if (onConfirm) onConfirm();
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
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[40px] bg-white bg-opacity-80">
            <div className="flex flex-col items-center">
              <ClipLoader color="#14B82C" size={50} />
              <p className="mt-4 text-lg font-medium text-[#042F0C]">
                Booking your classes...
              </p>
            </div>
          </div>
        )}

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
                    onRemoveClass &&
                    onRemoveClass(normalizedSelectedDates[index])
                  }
                  className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600"
                  disabled={isLoading}
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
                  {classItem.time}
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
            disabled={isLoading}
          >
            No, Cancel
          </button>
          <button
            onClick={handleConfirmBooking}
            className="flex-1 rounded-full border border-[#042F0C] bg-[#14B82C] px-5 py-2 text-base font-medium text-black transition-colors hover:bg-green-600 disabled:opacity-70"
            disabled={isLoading}
          >
            Yes, Book Now
          </button>
        </div>
      </Modal>
      <ClassesBooked
        isOpen={showSuccessModal}
        onClose={handleSuccessClose}
        bookedClassesCount={normalizedSelectedDates.length}
        totalAvailableClasses={10}
      />
    </>
  );
};

export default ConfirmClassesModal;
