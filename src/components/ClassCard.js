import React from "react";
import { Clock, Calendar, Users, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ClassCard = ({
  id,
  title,
  language,
  level,
  time,
  date,
  tutor,
  progress,
  type,
  imageSrc,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/classesDetailsUser/${id}`);
  };

  return (
    <div
      className="max-w-md transition-transform transform cursor-pointer hover:scale-105"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleClick();
        }
      }}
    >
      <div className="flex flex-col items-center justify-center border border-[#14b82c] bg-white rounded-3xl p-2 ">
        <div className="w-full ">
          <img
            alt="Learn Spanish"
            src={imageSrc}
            className="object-cover w-full h-48 rounded-t-2xl"
          />
        </div>

        <div className="w-full space-y-2 bg-[#c3f3c9] rounded-b-3xl p-2">
          <div className="flex items-start">
            <span className="px-4 py-1 text-sm bg-[#14b82c] text-white rounded-full">
              {type}
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
          <div className="flex flex-row items-center justify-between w-full ">
            <div className="flex flex-row items-center justify-center space-x-2">
              <Clock className="w-5 h-5 text-gray-600" />
              <span className="text-[#454545] text-md">{time}</span>
            </div>
            <div className="flex flex-row items-center justify-center space-x-2">
              <Calendar className="w-5 h-5 text-gray-600" />
              <span className="text-[#454545] text-md">{date}</span>
            </div>
          </div>
          <div className="flex flex-row items-center justify-between w-full ">
            <div className="flex flex-row items-center justify-center space-x-2">
              <User className="w-5 h-5 text-gray-600" />
              <span className="text-[#454545] text-md">{tutor}</span>
            </div>
            <div className="flex flex-row items-center justify-center space-x-2">
              <Users className="w-5 h-5 text-gray-600" />
              <span className="text-[#454545] text-md">{progress}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassCard;
