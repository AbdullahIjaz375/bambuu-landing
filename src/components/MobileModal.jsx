import React from "react";

// Modular MobileModal for mobile-only modals
const MobileModal = ({ open, onClose, children, subscriptionStep }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
      <div
        className={`${subscriptionStep ? "w-full max-w-full" : "w-11/12 max-w-sm bg-white shadow-2xl"} relative rounded-[32px] font-['Urbanist']`}
      >
        {children}
      </div>
    </div>
  );
};

export default MobileModal;
