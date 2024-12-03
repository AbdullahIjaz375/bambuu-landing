import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { ClipLoader } from "react-spinners";

const GroupDetailsModal = ({ group, onClose }) => {
  const [activeTab, setActiveTab] = useState("Classes");
  const [classes, setClasses] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch classes
        if (group.classIds && group.classIds.length > 0) {
          const classesData = await Promise.all(
            group.classIds.map(async (classId) => {
              const classDoc = await getDoc(doc(db, "classes", classId));
              return classDoc.exists()
                ? { id: classDoc.id, ...classDoc.data() }
                : null;
            })
          );
          setClasses(classesData.filter(Boolean));
          console.log("class", classes);
        }

        // Fetch members
        if (group.memberIds && group.memberIds.length > 0) {
          const membersData = await Promise.all(
            group.memberIds.map(async (memberId) => {
              const userDoc = await getDoc(doc(db, "users", memberId));
              return userDoc.exists()
                ? { id: userDoc.id, ...userDoc.data() }
                : null;
            })
          );
          setMembers(membersData.filter(Boolean));
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [group]);

  const renderClasses = () => {
    if (classes.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">No classes available</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {classes.map((classItem) => (
          <div key={classItem.id} className="p-4 bg-white rounded-lg shadow">
            <div className="relative w-full h-48 mb-4 overflow-hidden rounded-lg">
              <img
                src={classItem.imageUrl || "/api/placeholder/400/300"}
                alt={classItem.className}
                className="object-cover w-full h-full"
              />
            </div>
            <h3 className="mb-2 text-xl font-medium">{classItem.className}</h3>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 text-sm bg-yellow-200 rounded-full">
                {group.groupLearningLanguage}
              </span>
              <span className="px-3 py-1 text-sm bg-yellow-200 rounded-full">
                Advanced
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={classItem.teacherImageUrl || "/api/placeholder/32/32"}
                  alt={classItem.teacherName}
                  className="w-6 h-6 rounded-full"
                />
                <span className="text-sm text-gray-600">
                  {classItem.teacherName} (Admin)
                </span>
              </div>
              <span className="text-sm text-gray-600">
                {classItem.maxStudents || 100}/100
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderMembers = () => {
    if (members.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">No members available</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-3 p-3 bg-white rounded-lg"
          >
            <img
              src={member.profileImageUrl || "/api/placeholder/40/40"}
              alt={member.name}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <p className="font-medium">{member.name}</p>
              {member.id === group.groupAdminId && (
                <span className="text-sm text-gray-500">Admin</span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-5xl p-6 mx-4 bg-white rounded-3xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Group Details</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex gap-6">
          {/* Left sidebar */}
          <div className="w-1/3 p-6 bg-[#fffef0] rounded-2xl">
            <div className="flex flex-col items-center text-center">
              <img
                src={group.imageUrl}
                alt={group.groupName}
                className="w-32 h-32 mb-4 rounded-full"
              />
              <h3 className="mb-2 text-2xl font-medium">{group.groupName}</h3>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 text-sm bg-yellow-200 rounded-full">
                  {group.groupLearningLanguage}
                </span>
                <span className="px-3 py-1 text-sm bg-yellow-200 rounded-full">
                  Advanced
                </span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <img
                  src={group.groupAdminImageUrl || "/api/placeholder/32/32"}
                  alt={group.groupAdminName}
                  className="w-6 h-6 rounded-full"
                />
                <span className="text-sm">{group.groupAdminName} (Admin)</span>
              </div>
              <p className="mb-6 text-gray-600">{group.groupDescription}</p>
              <button className="w-full px-4 py-2 mb-2 text-black border border-gray-300 rounded-full">
                View Group Chat
              </button>
              <button className="w-full px-4 py-2 text-red-500 border border-red-500 rounded-full">
                Leave Group
              </button>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1">
            <div className="flex gap-2 mb-6">
              <button
                className={`px-6 py-2 rounded-full ${
                  activeTab === "Classes"
                    ? "bg-yellow-400 text-black"
                    : "bg-white text-black"
                }`}
                onClick={() => setActiveTab("Classes")}
              >
                Classes
              </button>
              <button
                className={`px-6 py-2 rounded-full ${
                  activeTab === "Members"
                    ? "bg-yellow-400 text-black"
                    : "bg-white text-black"
                }`}
                onClick={() => setActiveTab("Members")}
              >
                Members
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <ClipLoader color="#FFB800" size={40} />
              </div>
            ) : (
              <div className="overflow-y-auto max-h-[600px]">
                {activeTab === "Classes" ? renderClasses() : renderMembers()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupDetailsModal;
