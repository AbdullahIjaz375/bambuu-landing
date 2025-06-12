import React from "react";
import { X } from "lucide-react";

const MobileModalHeader = ({
  leftIcon,
  onClose,
  children,
  subscriptionStep,
}) => (
  <div className="relative flex min-h-[64px] w-full items-center justify-between rounded-t-[32px] px-4 py-4">
    {/* Top Left Icon */}
    {leftIcon ? (
      <img src={leftIcon} alt="left" className="z-10 h-6 w-6 object-contain" />
    ) : (
      <span className="h-6 w-6" />
    )}

    {/* Top Right Close Button */}
    {onClose ? (
      <button
        onClick={onClose}
        className={`absolute right-8 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[#F6F6F6] p-0 text-[#3D3D3D] shadow-md`}
        aria-label="Close"
      >
        <X size={20} />
      </button>
    ) : (
      <span className="h-6 w-6" />
    )}

    {/* Optional children (e.g. language switcher) */}
    {children && <div className="absolute right-12 top-4 z-20">{children}</div>}
  </div>
);

export default MobileModalHeader;
