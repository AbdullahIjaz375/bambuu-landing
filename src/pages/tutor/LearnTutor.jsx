import { Search } from "lucide-react";
import NotificationDropdown from "../../components/NotificationDropdown";
import React, { useState, useEffect } from "react";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Users,
  BookOpen,
  Star,
  Database,
  UserCircle,
  User,
} from "lucide-react";
import Sidebar from "../../components/Sidebar";
import ClassCard from "../../components/ClassCard";
import { useAuth } from "../../context/AuthContext";
import GroupCard from "../../components/GroupCard";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { ClipLoader } from "react-spinners";
const LearnTutor = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  //------------------------------------calender-------------------------------------------//

  const [date, setDate] = useState(new Date());
  const [view, setView] = useState("weekly");

  // Get current week dates
  const getWeekDates = (current) => {
    const week = [];
    const first = current.getDate() - current.getDay() + 1;

    for (let i = 0; i < 15; i++) {
      const day = new Date(current.getTime());
      day.setDate(first + i);
      week.push(day);
    }
    return week;
  };

  // Format date for header
  const formatHeader = (date) => {
    const month = date
      .toLocaleString("default", { month: "long" })
      .toUpperCase();
    const year = date.getFullYear();
    return `${month}, ${year}`;
  };

  // Navigate weeks
  const navigateWeek = (direction) => {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + (direction === "next" ? 7 : -7));
    setDate(newDate);
  };

  // Check if date is today
  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const weekDates = getWeekDates(date);

  //------------------------------------------------------------------------------------------//

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <Sidebar user={user} />

      {/* Main Content */}
      <div className="flex-1 p-8 bg-white border-2 border-[#e7e7e7] rounded-3xl ml-[17rem] m-2">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 border-b border-[#e7e7e7] pb-4">
          <div className="flex flex-row items-center space-x-4">
            <h1 className="text-3xl font-semibold">Hi, {user.name}!</h1>
            <p className="text-[#616161] text-lg">How are you today? </p>
          </div>
          <div className="flex items-center gap-4 ">
            <div className="relative">
              <div className="relative">
                <input
                  type="search"
                  placeholder="Search classes, instructors or groups"
                  className="py-2 pl-10 pr-4 border border-gray-200 rounded-full w-96"
                />
                <Search
                  className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2"
                  size={16}
                />
              </div>
            </div>
            <NotificationDropdown />{" "}
          </div>
        </div>

        <div className="flex flex-row items-start justify-between w-full gap-8 mb-4">
          {/* Calendar */}
          <div className="w-full p-4 bg-white border border-yellow-300 rounded-3xl">
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => navigateWeek("prev")}
                  className="p-1 text-gray-600 hover:text-gray-800"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <h2 className="text-xl font-medium">{formatHeader(date)}</h2>
                <button
                  onClick={() => navigateWeek("next")}
                  className="p-1 text-gray-600 hover:text-gray-800"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex justify-between gap-2">
              {weekDates.map((day) => (
                <button
                  key={day.toISOString()}
                  className={`flex flex-col items-center justify-center rounded-full py-4 px-6 transition-colors ${
                    isToday(day)
                      ? "bg-green-500 text-white"
                      : "bg-white border hover:border-gray-300"
                  }`}
                  onClick={() => setDate(day)}
                >
                  <span className="mb-1 text-2xl font-medium">
                    {day.getDate()}
                  </span>
                  <span className="text-sm">
                    {day.toLocaleString("default", { weekday: "short" })}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearnTutor;
