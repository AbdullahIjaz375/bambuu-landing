import Modal from "react-modal";
const IntoductoryCallBooked = ({
  isOpen,
  onClose,
  bookExamClass,
  setBookExamClass,
}) => (
  <Modal
    // isOpen={bookExamClass}
    isOpen={isOpen}
    onRequestClose={onClose}
    className="fixed left-1/2 top-1/2 flex h-[343px] max-h-[90vh] min-h-0 w-[440px] min-w-0 max-w-[95vw] -translate-x-1/2 -translate-y-1/2 flex-col rounded-[2.5rem] bg-white p-0 font-urbanist shadow-xl outline-none"
    overlayClassName="fixed inset-0 bg-black bg-opacity-20 z-50 flex items-center justify-center backdrop-blur-sm"
    ariaHideApp={false}
  >
    <div className="flex min-w-[380px] flex-col items-center px-8 pb-8 pt-10">
      {/* Success Icon */}
      <div className="mb-4 flex items-center justify-center">
        <div className="relative">
          <img src="/svgs/success-icon.svg" alt="Success" />
        </div>
      </div>
      <h2 className="mb-2 text-center text-xl font-bold">
        Introductory Call Booked!
      </h2>
      <p className="mb-8 text-center text-base text-[#5D5D5D]">
        We will notify you on the call day.
      </p>
      <button
        className="flex h-11 w-[92%] max-w-[392px] items-center justify-center rounded-full border border-[#042F0C] bg-white text-lg font-medium text-[#222] transition hover:bg-[#F6FFF8]"
        onClick={onClose}
      >
        Done
      </button>
    </div>
  </Modal>
);
export default IntoductoryCallBooked;
