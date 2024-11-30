import React from "react";
import { Clock, Calendar, Users, User } from "lucide-react";

const ClassCard = ({
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
  return (
    <div className="relative overflow-hidden border border-green-400 rounded-3xl">
      {/* Main Image */}
      <div className="w-full aspect-video">
        <img
          src={imageSrc}
          alt={title}
          className="object-cover w-full h-full"
        />
      </div>

      {/* Content Container with Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-50/80 to-green-50">
        {/* Type Badge */}
        <div className="absolute top-4 left-4">
          <span className="px-4 py-1.5 text-sm font-medium text-white bg-green-500 rounded-full">
            {type}
          </span>
        </div>

        {/* Bottom Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {/* Title */}
          <h3 className="mb-3 text-xl font-bold">{title}</h3>

          {/* Language and Level */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🇪🇸</span>
              <span className="text-base">{language}</span>
            </div>
            <span className="px-3 py-1 text-sm bg-yellow-200 rounded-full">
              {level}
            </span>
          </div>

          {/* Time and Date */}
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-600" />
              <span className="text-gray-600">{time}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-600" />
              <span className="text-gray-600">{date}</span>
            </div>
          </div>

          {/* Tutor and Progress */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 overflow-hidden rounded-full">
                <User />
              </div>
              <span className="text-gray-700">{tutor}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-5 h-5 text-gray-600" />
              <span className="text-gray-600">{progress}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassCard;
