import Modal from "react-modal";
import { ClipLoader } from "react-spinners";
import { Clock } from "lucide-react";

const ExamBookingConfirmation = ({
  showConfirm,
  setShowConfirm,
  selectedDate,
  selectedTime,
  onConfirm,
  tutor,
  loading,
  type = "intro",
}) => {
  return (
    <>
      <Modal
        isOpen={showConfirm}
        onRequestClose={() => setShowConfirm(false)}
        className="fixed left-1/2 top-1/2 flex w-auto max-w-[98vw] -translate-x-1/2 -translate-y-1/2 flex-col rounded-[2.5rem] bg-white p-0 font-urbanist shadow-xl outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-20 z-50 flex items-center justify-center backdrop-blur-sm"
        ariaHideApp={false}
      >
        <div className="flex min-w-[420px] flex-col items-center px-8 pb-8 pt-10">
          <h2 className="mb-2 text-center text-2xl font-bold">
            Please confirm your booking!
          </h2>
          <p className="mb-7 max-w-md text-center text-base font-normal text-[#5D5D5D]">
            By booking, you'll be able to join it 5 minutes before it starts. It
            will also be added to your calendar.
          </p>
          <div className="mb-8 flex w-full max-w-md flex-row items-center gap-4 rounded-2xl border border-[#14B82C] bg-[#F0FDF1] px-2 py-2">
            <div className="flex h-20 w-20 flex-col items-center justify-center rounded-xl bg-[#B9F9C2] font-tanker text-[#042F0C]">
              <span className="text-2xl font-normal leading-5">EXAM</span>
              <span className="text-sm font-normal leading-4">PREPARATION</span>
            </div>
            <div className="flex flex-1 flex-col justify-center">
              <span className="mb-1 text-base font-semibold text-black">
                Introductory Call
              </span>
              <div className="mb-2 mr-3 flex items-center justify-between gap-6">
                <span className="flex items-center gap-1 text-sm font-medium text-gray-700">
                  <Clock className="mr-1 h-4 w-4 text-gray-500" />
                  {selectedTime}
                  <span className="ml-2 text-xs text-gray-500">
                    ({type === "intro" ? 30 : 60} min )
                  </span>
                </span>
                <span className="flex items-center gap-1 text-xs font-medium text-[#454545]">
                  <img
                    src="/svgs/calendar.svg"
                    alt="Calendar"
                    className="mr-1 h-4 w-4"
                  />
                  {selectedDate &&
                    (() => {
                      const d = new Date(selectedDate + "T00:00:00");
                      return d.toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      });
                    })()}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-[#3D3D3D]">
                <img
                  src={tutor?.photoUrl || "/images/panda.png"}
                  alt={tutor?.name || "Tutor"}
                  className="h-5 w-5 rounded-full"
                />
                <span className="font-medium">
                  {tutor?.name || "Tutor"}
                  {tutor?.type ? ` (${tutor.type})` : ""}
                </span>
              </div>
            </div>
          </div>
          <div className="flex w-full max-w-md justify-between gap-6">
            <button
              className="flex-1 rounded-full border border-[#042F0C] bg-white px-6 py-3 text-base font-medium text-black transition hover:bg-[#F6FFF8]"
              onClick={() => setShowConfirm(false)}
              disabled={loading}
            >
              No, Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 rounded-full border border-[#042F0C] bg-[#14B82C] px-6 py-3 text-lg font-semibold text-[#042F0C] transition hover:bg-[#12a026]"
            >
              {loading ? (
                <ClipLoader color="#042F0C" size={22} />
              ) : (
                "Yes, Book Now"
              )}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ExamBookingConfirmation;
