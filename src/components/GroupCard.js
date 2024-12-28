import { useNavigate } from "react-router-dom";
import React from "react";
import { Users, User } from "lucide-react";

const GroupCard = ({ group }) => {
  const {
    groupName,
    groupLearningLanguage,
    groupAdminName,
    groupAdminImageUrl,
    memberIds = [],
    imageUrl,
    id,
    isPremium,
  } = group;
  const navigate = useNavigate();
  const handleClick = () => {
    // Note: Removed useNavigate since it should be passed as a prop or handled differently
    navigate(`/groupDetailsUser/${id}`);
  };

  return (
    <div
      className="transition-transform transform cursor-pointer w-80 hover:scale-105"
      onClick={handleClick}
    >
      <div
        className={`relative p-6 rounded-[32px] border ${
          isPremium
            ? "bg-[#f0fdf1] border-green-300"
            : "bg-[#ffffea] border-[#ffc310]"
        }`}
      >
        <div className="flex flex-col items-center">
          {/* Group Image Container with Relative Positioning */}
          <div className="relative w-40 h-40 mb-4">
            {/* Bambuu+ Tag */}
            {isPremium && (
              <div className="absolute z-10 -translate-x-1/2 left-1/2 -top-3">
                <div className="px-3 py-1 text-sm font-medium text-green-600 bg-white border border-green-300 rounded-full whitespace-nowrap">
                  bammbuu+
                </div>
              </div>
            )}
            {/* Group Image */}
            <div className="w-full h-full overflow-hidden rounded-full">
              <img
                src={imageUrl}
                alt={groupName}
                className="object-cover w-full h-full"
              />
            </div>
          </div>

          {/* Group Name */}
          <h2 className="mb-4 text-2xl font-semibold text-center text-gray-900">
            {groupName}
          </h2>

          {/* Language */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-6 h-6 overflow-hidden rounded-full">
              {groupLearningLanguage === "Spanish" ? (
                <img
                  src="/flags/spain.png"
                  alt="Spanish flag"
                  className="object-cover w-full h-full"
                />
              ) : (
                <img
                  src="/flags/us.png"
                  alt="US flag"
                  className="object-cover w-full h-full"
                />
              )}
            </div>
            <span className="text-lg font-medium">{groupLearningLanguage}</span>
          </div>

          {/* Admin and Member Count */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {groupAdminImageUrl ? (
                <img
                  src={groupAdminImageUrl}
                  alt={groupAdminName}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
              )}
              <span className="text-gray-700">
                {groupAdminName} <span className="text-gray-500">(Admin)</span>
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-5 h-5 text-gray-600" />
              <span className="text-gray-700">{memberIds.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupCard;
