import React, { useState } from "react";
import { Search, X, Users } from "lucide-react";

export const ClassTypeModal = ({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="p-6 bg-white w-96 rounded-3xl">
        <div className="flex flex-col items-center space-y-6">
          {/* Add close button */}
          <div className="flex justify-end w-full">
            <button onClick={onClose} className="p-2">
              <X size={24} />
            </button>
          </div>
          <img alt="bambuu" src="/images/classType.png" />

          <h2 className="text-xl font-semibold text-center">
            Select form of class you want to create.
          </h2>

          <div className="w-full space-y-3">
            <button
              onClick={() => onSelect("group")}
              className="w-full py-3 text-center border border-black rounded-full hover:bg-gray-100"
            >
              Group Class
            </button>
            <button
              onClick={() => onSelect("individual")}
              className="w-full py-3 text-center border border-black rounded-full hover:bg-gray-100"
            >
              Individual Class
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export const GroupSelectModal = ({ isOpen, onClose, onSelect, groups }) => {
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  const filteredGroups = groups.filter((group) =>
    group.groupName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white w-96 rounded-3xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Select Group</h2>
            <button onClick={onClose} className="p-2">
              <X size={24} />
            </button>
          </div>

          <div className="relative mb-4">
            <Search
              className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2"
              size={20}
            />
            <input
              type="text"
              placeholder="Search group by name"
              className="w-full py-2 pl-10 pr-4 border rounded-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="mb-6 space-y-3 overflow-y-auto max-h-96">
            {filteredGroups.map((group) => (
              <div
                key={group.id}
                onClick={() => onSelect(group)}
                className="p-4 border border-[#14b82c] cursor-pointer rounded-3xl hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={group.imageUrl}
                    alt={group.groupName}
                    className="object-cover w-16 h-16 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{group.groupName}</h3>
                      {group.isPremium && (
                        <span className="px-3 py-1 text-sm text-white bg-[#14b82c] rounded-full">
                          bammbuu+
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                      <span className="flex items-center">
                        {group.groupLearningLanguage === "English"
                          ? "🇺🇸"
                          : group.groupLearningLanguage === "Spanish"
                          ? "🇪🇸"
                          : "🌍"}{" "}
                        {group.groupLearningLanguage}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={15} />
                        {group.memberIds ? group.memberIds.length : 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between gap-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-[#042f0c] rounded-full hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 text-black border border-[#042f0c] bg-[#14b82c] rounded-full hover:bg-[#3edb56]"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
