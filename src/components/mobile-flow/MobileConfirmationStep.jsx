import React from "react";
import MobileModal from "../MobileModal";
import MobileModalHeader from "./MobileModalHeader";

const MobileConfirmationStep = ({ onClose }) => {
  return (
    <MobileModal open={true} onClose={onClose}>
      <MobileModalHeader onClose={onClose} />
      <div className="px-6 pb-6 text-center font-urbanist">
        <div className="mx-auto mt-2 flex w-full max-w-xs flex-col items-center px-4">
          <img
            src="/svgs/account-created.svg"
            alt="Enrolled"
            // className="mb-4 mt-2 h-14 w-14"
          />
          <h2 className="mb-2 text-[32px] font-bold">You're Enrolled!</h2>
          <div className="mb-1 text-center font-bold text-[#3D3D3D]">
            Great job — you've successfully enrolled!
          </div>
          <p className="mb-4 text-center font-normal text-[#5D5D5D]">
            Ready to start your prep? Just open the app and dive in. You've got
            this!
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <a
              className="flex h-12 min-w-[180px] items-center justify-center gap-2 rounded-full bg-black"
              href="https://apps.apple.com/pk/app/bammbuu-language-learning/id6739758405"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src="/svgs/ios.svg" alt="Apple Store" />
              <span className="whitespace-nowrap font-urbanist text-xl font-medium text-white">
                Apple Store
              </span>
            </a>
            <a
              className="flex h-12 min-w-[180px] items-center justify-center gap-2 rounded-full bg-black"
              href="https://play.google.com/store/apps/details?id=com.bammbuu.app&hl=en"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src="/svgs/google-play.svg" alt="Google Play" />
              <span className="whitespace-nowrap font-urbanist text-xl font-medium text-white">
                Google Play
              </span>
            </a>
          </div>
        </div>
      </div>
    </MobileModal>
  );
};

export default MobileConfirmationStep;
