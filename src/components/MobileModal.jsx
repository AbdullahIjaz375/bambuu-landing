import React from "react";

// Modular MobileModal for mobile-only modals
const MobileModal = ({ open, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
      <div className="relative w-11/12 max-w-sm rounded-[32px] bg-white font-['Urbanist'] shadow-2xl">
        {children}
      </div>
    </div>
  );
};

export default MobileModal;
