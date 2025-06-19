import React, { useState } from "react";
import Modal from "react-modal";
import ExamClassSlots from "./ExamClassSlots";

const IntroductoryCallDone = ({
  isOpen,
  onClose,
  bookExamClass,
  setBookExamClass,
  onBookExamPreparation,
  onExploreMore,
}) => {
  const [showSlotBooking, setShowSlotBooking] = useState(false);

  // const handleBookExamPreparation = () => {
  //   setBookExamClass(false);
  //   setShowSlotBooking(true);
  // };

  const handleBookExamPreparation = () => {
    if (onBookExamPreparation) onBookExamPreparation();
  };

  const handleSlotBookingComplete = (bookingData) => {
    setShowSlotBooking(false);
  };

  const handleExploreMore = () => {
    setBookExamClass(false);
    if (onExploreMore) onExploreMore();
  };

  return (
    <>
      <Modal
        // isOpen={bookExamClass}
        isOpen={isOpen}
        onRequestClose={onClose}
        className="fixed left-1/2 top-1/2 flex w-[90%] max-w-[784px] -translate-x-1/2 -translate-y-1/2 transform flex-col items-center rounded-3xl bg-white px-6 py-2 font-urbanist shadow-2xl outline-none sm:px-10 sm:py-8"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center backdrop-blur-sm"
        ariaHideApp={false}
      >
        {/* Success Icon */}
        <img src="/svgs/success-icon.svg" alt="Success" className="mb-4" />
        {/* Title */}
        <h2 className="mb-3 text-center text-[32px] font-bold text-black">
          Introductory Call Done!
        </h2>
        <p className="mb-8 text-center text-base font-normal text-[#5D5D5D]">
          Now book your exam preparation classes!
        </p>
        {/* Book Button */}
        <button
          className="mb-4 w-full max-w-[360px] rounded-full border border-[#042F0C] bg-[#14B82C] px-6 py-4 text-base font-medium text-black shadow transition-colors hover:bg-green-600"
          onClick={handleBookExamPreparation}
        >
          Book Exam Preparation
        </button>
        {/* Explore More Link */}
        <p className="text-base font-normal text-[#5D5D5D]">
          Not interested in this tutor?{" "}
          <button
            className="text-base font-semibold text-[#14B82C] hover:underline"
            onClick={handleExploreMore}
          >
            Explore More!
          </button>
        </p>
      </Modal>

      {/* Exam Class Slots Modal */}
      {/* <ExamClassSlots
        isOpen={showSlotBooking}
        onClose={() => setShowSlotBooking(false)}
        onBookingComplete={handleSlotBookingComplete}
      /> */}
    </>
  );
};

export default IntroductoryCallDone;
