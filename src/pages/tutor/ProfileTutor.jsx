import { Search } from "lucide-react";

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
  ArrowLeft,
  Globe,
} from "lucide-react";
import { Settings, Edit, LogOut } from "lucide-react";
import { signOut } from "firebase/auth";
import { toast } from "react-toastify";
import { auth } from "../../firebaseConfig";

import Sidebar from "../../components/Sidebar";
import ClassCard from "../../components/ClassCard";
import { useAuth } from "../../context/AuthContext";
import GroupCard from "../../components/GroupCard";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { ClipLoader } from "react-spinners";
const ProfileTutor = () => {
  const { user, setUser } = useAuth();

  const navigate = useNavigate();

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (user?.uid) {
          const userDoc = await getDoc(doc(db, "tutors", user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully!");
      sessionStorage.removeItem("userType"); // Remove userType from session storage
    } catch (error) {
      toast.error("Error during logout");
      console.error("Error during logout:", error);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <Sidebar user={user} />

      {/* Main Content */}

      {loading ? (
        <div className="flex w-full items-center justify-center min-h-[50vh]">
          <ClipLoader color="#14B82C" size={50} />
        </div>
      ) : (
        <div className="flex-1 p-8 bg-white border-2 border-[#e7e7e7] rounded-3xl ml-[17rem] m-2">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-semibold">Profile</h1>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Profile Card */}
            <div className="bg-[#e6fde9] rounded-3xl p-8 flex flex-col items-center">
              <div className="flex items-center justify-center w-32 h-32 mb-4 bg-white rounded-full">
                <img
                  src={userData?.photoUrl || "/api/placeholder/96/96"}
                  alt="Profile"
                  className="object-cover w-full h-full rounded-full"
                />
              </div>

              <h2 className="mb-4 text-3xl font-semibold">
                {userData?.name || "User"}
              </h2>

              <div className="flex items-center gap-2 px-3 py-1 mb-6 text-xl bg-white rounded-full">
                <img alt="bambbuu" src="/svgs/fire.svg" className="w-6 h-6" />
                <span className="font-semibold text-[#6D6D6D]">App Streak</span>
                <span className="font-semibold text-green-600 ">
                  {userData?.currentStreak || 0}
                </span>
              </div>

              <div className="grid w-full grid-cols-3 gap-4 mb-6 text-xl">
                <div className="flex items-center gap-1 ">
                  <img
                    alt="bambbuu"
                    src="/svgs/language-circle.svg"
                    className="w-6 h-6"
                  />
                  <span className="font-semibold text-black">Native:</span>
                  <span className="font-medium text-gray-600">
                    {userData?.nativeLanguage || "-"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <img
                    alt="bambbuu"
                    src="/svgs/language-circle.svg"
                    className="w-6 h-6"
                  />

                  <span className="font-semibold text-black">Teaching:</span>
                  <span className="font-medium text-gray-600">
                    {userData?.teachingLanguage || "-"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <img
                    alt="bambbuu"
                    src="/svgs/location.svg"
                    className="w-6 h-6"
                  />

                  <span className="font-semibold text-black">From:</span>
                  <span className="font-medium text-gray-600">
                    {userData?.country || "-"}
                  </span>
                </div>
              </div>

              <div className="grid w-full grid-cols-2 gap-4 text-xl">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-black">
                    Total Classes Taught:
                  </span>
                  <span className="font-medium text-gray-600">
                    {userData?.tutorOfClasses?.length || 0}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-black">
                    Total Groups Created:
                  </span>
                  <span className="font-medium text-gray-600">
                    {userData?.tutorOfGroups?.length || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Options */}
            <div className="space-y-4">
              <button
                onClick={() => navigate("/tutorEditProfile")}
                className="flex items-center justify-between w-full px-6 py-4 text-green-600 border border-green-500 rounded-full hover:bg-green-50"
              >
                <div className="flex items-center gap-3">
                  <img alt="bammbuu" src="/svgs/edit.svg" className="w-6 h-6" />
                  <span className="text-xl text-black">Edit Profile</span>
                </div>
                <ChevronRight className="text-black" />
              </button>

              <button
                onClick={() => navigate("/tutorSettings")}
                className="flex items-center justify-between w-full px-6 py-4 text-green-600 border border-green-500 rounded-full hover:bg-green-50"
              >
                <div className="flex items-center gap-3">
                  <img
                    alt="bammbuu"
                    src="/svgs/setting.svg"
                    className="w-6 h-6"
                  />
                  <span className="text-xl text-black">Settings</span>
                </div>
                <ChevronRight className="text-black" />
              </button>

              <button
                onClick={() => navigate("/aboutBambuuTutor")}
                className="flex items-center justify-between w-full px-6 py-4 text-green-600 border border-green-500 rounded-full hover:bg-green-50"
              >
                <div className="flex items-center gap-3">
                  <img
                    alt="bammbuu"
                    src="/svgs/speedometer.svg"
                    className="w-6 h-6"
                  />

                  <span className="text-xl text-black">About bammbuu</span>
                </div>
                <ChevronRight className="text-black" />
              </button>

              <button
                onClick={() => navigate("/privacyPolicyTutor")}
                className="flex items-center justify-between w-full px-6 py-4 text-green-600 border border-green-500 rounded-full hover:bg-green-50"
              >
                <div className="flex items-center gap-3">
                  <img
                    alt="bammbuu"
                    src="/svgs/document-text.svg"
                    className="w-6 h-6"
                  />
                  <span className="text-xl text-black">Privacy Policy</span>
                </div>
                <ChevronRight className="text-black" />
              </button>

              <button
                onClick={() => {
                  handleSignOut();
                }}
                className="flex items-center justify-between w-full px-6 py-4 text-red-600 border border-red-500 rounded-full hover:bg-red-50"
              >
                <div className="flex items-center gap-3">
                  <img
                    alt="bammbuu"
                    src="/svgs/logout.svg"
                    className="w-6 h-6"
                  />
                  <span className="text-xl">Logout</span>
                </div>
              </button>
            </div>
          </div>{" "}
        </div>
      )}
    </div>
  );
};

export default ProfileTutor;
