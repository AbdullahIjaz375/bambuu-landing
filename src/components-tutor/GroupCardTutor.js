import React, { memo } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";

const GroupCardTutor = ({ group }) => {
  // Destructure with default values to prevent undefined errors
  const {
    groupName = "Unnamed Group",
    groupLearningLanguage = "English",
    groupAdminName = "Admin",
    groupAdminImageUrl = "",
    memberIds = [],
    imageUrl = "",
    id = "",
    isPremium = false,
  } = group || {};

  const navigate = useNavigate();

  const handleClick = () => {
    if (id) {
      navigate(`/groupDetailsTutor/${id}?ref=shared`);
    }
  };

  // Determine the language icon path
  const getLanguageIcon = () => {
    switch (groupLearningLanguage) {
      case "English":
        return "/svgs/xs-us.svg";
      case "Spanish":
        return "/svgs/xs-spain.svg";
      default:
        return "/svgs/eng-spanish-xs.svg";
    }
  };

  return (
    <div
      onClick={handleClick}
      className="w-full max-w-sm mx-auto transition-transform duration-200 hover:scale-[1.02]"
      aria-label={`${groupName} group card`}
    >
      <div
        className={`p-6 rounded-[32px] border hover:cursor-pointer h-full ${
          isPremium
            ? "bg-[#f0fdf1] border-[#14B82C] hover:shadow-[0_0_12px_rgba(20,184,44,0.2)]"
            : "bg-[#ffffea] border-[#ffc310] hover:shadow-[0_0_12px_rgba(255,195,16,0.2)]"
        }`}
      >
        <div className="flex flex-col items-center h-full">
          {/* Group Image Container */}
          <div className="relative w-40 h-40 mb-4">
            {/* Bammbuu+ Tag */}
            {isPremium && (
              <div className="absolute z-10 -translate-x-1/2 w-28 left-1/2 -top-3">
                <img
                  alt="bammbuu plus"
                  src="/svgs/bammbuu-plus-grp-tag.svg"
                  className="w-28"
                  loading="lazy"
                />
              </div>
            )}
            {/* Group Image with Fallback */}
            <div className="w-full h-full overflow-hidden bg-gray-100 rounded-full">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={groupName}
                  className="object-cover w-full h-full"
                  loading="lazy"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/svgs/default-group.svg";
                  }}
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-gray-200">
                  <span className="text-4xl font-medium text-gray-400">
                    {groupName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Group Name - Fixed Height with Ellipsis */}
          <div className="mb-4 h-14 flex items-center justify-center w-full">
            <h2 className="text-2xl font-semibold text-center text-gray-900 line-clamp-2">
              {groupName}
            </h2>
          </div>

          {/* Language Badge */}
          <div className="flex items-center justify-center gap-2 mb-6 min-h-[28px]">
            <div className="w-6 h-6 overflow-hidden rounded-full bg-gray-50 flex-shrink-0">
              <img
                src={getLanguageIcon()}
                alt={`${groupLearningLanguage} language`}
                className="object-cover w-full h-full"
                loading="lazy"
              />
            </div>
            <span className="text-lg font-medium w-auto max-w-[180px] text-center">
              {groupLearningLanguage}
            </span>
          </div>

          {/* Admin and Member Count - Maintains Space at Bottom */}
          <div className="flex items-center justify-between w-full mt-auto">
            <div className="flex items-center gap-2 min-w-0 max-w-[70%]">
              <div className="flex-shrink-0 w-8 h-8">
                {groupAdminImageUrl ? (
                  <img
                    src={groupAdminImageUrl}
                    alt={groupAdminName}
                    className="w-8 h-8 rounded-full"
                    loading="lazy"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/svgs/default-avatar.svg";
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                )}
              </div>
              <span className="text-gray-700 truncate">
                {groupAdminName} <span className="text-gray-500">(Admin)</span>
              </span>
            </div>
            <div className="flex items-center flex-shrink-0 gap-1">
              <img
                src="/svgs/users.svg"
                alt="members"
                className="w-5 h-5"
                loading="lazy"
              />
              <span className="text-gray-700">{memberIds.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Use memo to prevent unnecessary re-renders
export default memo(GroupCardTutor);
