import React from "react";

// Modular MobileModal for mobile-only modals
const MobileModal = ({ open, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
      <div className="relative w-11/12 max-w-sm rounded-[32px] bg-white p-6 pt-8 text-center font-['Urbanist'] shadow-2xl">
        {/* Close button (top right) */}
        <button
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#F6F6F6] hover:bg-[#e7e7e7]"
          onClick={onClose}
          aria-label="Close"
        >
          <img
            src="/svgs/icon-add.svg"
            alt="Close"
            className="h-6 w-6 rotate-45"
          />
        </button>
        {/* Logo */}
        <img
          src="/svgs/bammbuu-logo.svg"
          alt="Bammbuu Logo"
          className="mx-auto mb-6 mt-2 h-6 w-auto"
        />
        {/* Modal Content */}
        {children}
      </div>
    </div>
  );
};

export default MobileModal;
