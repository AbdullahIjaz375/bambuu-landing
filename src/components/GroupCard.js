import React from "react";
import { Users, User } from "lucide-react";

const GroupCard = ({
  title,
  language,
  level,
  adminName,
  memberCount,
  flagSrc,
  adminImageSrc,
}) => {
  return (
    <div className="max-w-sm p-4 bg-white border border-[#ffc310] rounded-3xl">
      {/* Circular Flag */}
      <div className="flex flex-col items-center">
        <div className="w-40 h-40 mb-2 overflow-hidden rounded-full">
          <img
            src={flagSrc}
            alt={`${language} flag`}
            className="object-cover w-full h-full"
          />
        </div>

        {/* Title */}
        <h2 className="mb-2 text-2xl font-medium text-gray-900">{title}</h2>

        {/* Language and Level Badge */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-2">
            <img
              src={flagSrc}
              alt={`${language} flag`}
              className="w-6 h-6 rounded-full"
            />
            <span className="text-lg text-green-900">{language}</span>
          </div>
          <span className="px-3 py-1 text-gray-800 bg-[#fff885] rounded-full">
            {level}
          </span>
        </div>

        {/* Admin and Members */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <User />
            <span className="text-lg text-gray-700">
              {adminName} <span className="text-gray-500">(Admin)</span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-5 h-5 text-gray-600" />
            <span className="text-gray-700">{memberCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupCard;
