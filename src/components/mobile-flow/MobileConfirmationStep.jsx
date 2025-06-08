import React from "react";
import MobileModal from "../MobileModal";
import MobileModalHeader from "./MobileModalHeader";

const MobileConfirmationStep = ({ onClose }) => {
  return (
    <MobileModal open={true} onClose={onClose}>
      <MobileModalHeader onClose={onClose} />
      <div className="px-6 pb-6 text-center">
        <div className="mx-auto mt-2 flex w-full max-w-xs flex-col items-center px-4">
          <img
            src="/svgs/account-created.svg"
            alt="Enrolled"
            className="mb-4 mt-2 h-14 w-14"
          />
          <h2 className="mb-2 text-2xl font-bold">You're Enrolled!</h2>
          <p className="mb-6 text-center font-normal text-gray-700">
            <span className="font-bold">
              Great job — you've successfully enrolled!
            </span>
            <br />
            Ready to start your prep? Just open the app and dive in. You've got
            this!
          </p>
          <button
            className="w-full rounded-full border border-black bg-[#14B82C] py-3 text-lg font-semibold text-black hover:bg-[#119523] focus:outline-none focus:ring-2 focus:ring-[#119523] focus:ring-offset-2"
            onClick={onClose}
          >
            Open App
          </button>
        </div>
      </div>
    </MobileModal>
  );
};

export default MobileConfirmationStep;
