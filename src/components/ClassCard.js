import React from "react";
import { Clock, Calendar, Users, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ClassCard = ({
  id,
  title,
  language,
  level,
  dateTime,
  duration,
  tutor,
  memberCount,
  maxSpots,
  isPhysical,
  imageSrc,
  onClick,
}) => {
  const formatTime = (timestamp) => {
    if (!timestamp) return "TBD";
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "TBD";
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div
      className="max-w-md transition-transform transform cursor-pointer hover:scale-105"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick();
        }
      }}
    >
      <div className="flex flex-col items-center justify-center border border-[#14b82c] bg-white rounded-3xl p-2">
        <div className="w-full">
          <img
            alt={title}
            src={imageSrc || "/images/default-class.png"}
            className="object-cover w-full h-48 rounded-t-2xl"
          />
        </div>

        <div className="w-full space-y-2 bg-[#c3f3c9] rounded-b-3xl p-2">
          <div className="flex items-start">
            <span className="px-4 py-1 text-sm bg-[#14b82c] text-white rounded-full">
              {isPhysical ? "Physical" : "Online"}
            </span>
          </div>

          <h2 className="text-xl font-bold text-gray-800">{title}</h2>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="flex items-center">
                <span className="ml-2 text-[#042f0c]">{language}</span>
              </span>
            </div>
            <span className="px-3 py-1 text-sm bg-[#fff885] rounded-full">
              {level}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center w-full p-2 space-y-2">
          <div className="flex flex-row items-center justify-between w-full">
            <div className="flex flex-row items-center justify-center space-x-2">
              <Clock className="w-5 h-5 text-gray-600" />
              <span className="text-[#454545] text-md">
                {formatTime(dateTime)} ({duration} min)
              </span>
            </div>
            <div className="flex flex-row items-center justify-center space-x-2">
              <Calendar className="w-5 h-5 text-gray-600" />
              <span className="text-[#454545] text-md">
                {formatDate(dateTime)}
              </span>
            </div>
          </div>
          <div className="flex flex-row items-center justify-between w-full">
            <div className="flex flex-row items-center justify-center space-x-2">
              <User className="w-5 h-5 text-gray-600" />
              <span className="text-[#454545] text-md">{tutor || "TBD"}</span>
            </div>
            <div className="flex flex-row items-center justify-center space-x-2">
              <Users className="w-5 h-5 text-gray-600" />
              <span className="text-[#454545] text-md">
                {memberCount}/{maxSpots}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassCard;
