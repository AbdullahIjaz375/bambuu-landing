const SuccessModal = ({ onDone }) => (
  <div className="flex h-full flex-col items-center justify-center">
    <div className="mb-6 mt-4 flex flex-col items-center">
      <div className="mb-4">
        <img alt="success" src="/svgs/success-icon.svg" className="" />
      </div>
      <div className="text-center">
        <div className="mb-2 text-xl/[100%] font-bold text-black">
          Exam Prep Availability Added!
        </div>
        <div className="mx-auto max-w-[340px] text-center text-base/[100%] text-[#5D5D5D]">
          We will notify you when someone books your
          <br />
          classes.
        </div>
      </div>
    </div>
    <button
      className="mt-8 w-full rounded-full border border-[#042F0C] px-8 py-3 text-lg font-medium text-black transition hover:bg-[#DBFDDF]"
      onClick={onDone}
    >
      Done
    </button>
  </div>
);

export default SuccessModal;
