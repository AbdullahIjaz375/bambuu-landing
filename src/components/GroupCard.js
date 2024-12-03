import React, { useState } from "react";
import { Users, User } from "lucide-react";
import GroupDetailsModal from "./GroupDetailsModal";

const GroupCard = ({ group }) => {
  const [showModal, setShowModal] = useState(false);
  const {
    groupName,
    groupLearningLanguage,
    level = "Not specified",
    groupAdminName = "Admin",
    memberIds = [],
    imageUrl,
    groupDescription,
  } = group;

  return (
    <>
      <div
        className="max-w-md transition-transform transform cursor-pointer hover:scale-105"
        onClick={() => setShowModal(true)}
      >
        <div className="max-w-sm p-4 bg-white border border-[#ffc310] rounded-3xl">
          {/* Rest of your existing GroupCard code */}
          <div className="flex flex-col items-center">
            <div className="w-40 h-40 mb-2 overflow-hidden rounded-full">
              <img
                src={imageUrl}
                alt={`${groupLearningLanguage} flag`}
                className="object-cover w-full h-full"
              />
            </div>

            <h2 className="mb-2 text-2xl font-medium text-gray-900">
              {groupName}
            </h2>

            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-2">
                <img
                  src={imageUrl}
                  alt={`${groupLearningLanguage} flag`}
                  className="w-6 h-6 rounded-full"
                />
                <span className="text-lg text-green-900">
                  {groupLearningLanguage}
                </span>
              </div>
              <span className="px-3 py-1 text-gray-800 bg-[#fff885] rounded-full">
                {level}
              </span>
            </div>

            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <User />
                <span className="text-lg text-gray-700">
                  {groupAdminName}{" "}
                  <span className="text-gray-500">(Admin)</span>
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700">
                  {memberIds.length} members
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <GroupDetailsModal group={group} onClose={() => setShowModal(false)} />
      )}
    </>
  );
};

export default GroupCard;
