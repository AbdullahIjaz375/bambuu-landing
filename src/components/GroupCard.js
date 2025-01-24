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
    navigate(`/groupDetailsUser/${id}`);
  };

  return (
    <div onClick={handleClick}>
      <div
        className={`p-6 rounded-[32px] border hover:cursor-pointer ${
          isPremium
            ? "bg-[#f0fdf1] border-[#14B82C]"
            : "bg-[#ffffea] border-[#ffc310]"
        }`}
      >
        <div className="flex flex-col items-center">
          {/* Group Image Container */}
          <div className="relative w-40 h-40 mb-4">
            {/* Bambuu+ Tag */}
            {isPremium && (
              <div className="absolute z-10 -translate-x-1/2 w-28 left-1/2 -top-3">
                <img
                  alt="bammbuu"
                  src="/svgs/bammbuu-plus-grp-tag.svg"
                  className="w-28"
                />
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
          <h2 className="mb-4 text-2xl font-semibold text-center text-gray-900 line-clamp-2">
            {groupName}
          </h2>

          {/* Language */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-6 h-6 overflow-hidden rounded-full">
              {groupLearningLanguage === "Spanish" ? (
                <img
                  src="/svgs/xs-spain.svg"
                  alt="Spanish flag"
                  className="object-cover w-full h-full"
                />
              ) : (
                <img
                  src="/svgs/xs-us.svg"
                  alt="US flag"
                  className="object-cover w-full h-full"
                />
              )}
            </div>
            <span className="text-lg font-medium">{groupLearningLanguage}</span>
          </div>

          {/* Admin and Member Count */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 min-w-0 max-w-[70%]">
              <div className="flex-shrink-0">
                {groupAdminImageUrl ? (
                  <img
                    src={groupAdminImageUrl}
                    alt={groupAdminName}
                    className="object-cover w-5 h-5 rounded-full"
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
                alt={groupAdminName}
                className="object-cover w-5 h-5 rounded-full"
              />{" "}
              <span className="text-gray-700">{memberIds.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupCard;
