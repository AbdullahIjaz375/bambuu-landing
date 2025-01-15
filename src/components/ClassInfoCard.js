import React, { useState, useEffect } from "react";
import { MapPin, Users } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

const ClassInfoCard = ({ classData, groupTutor }) => {
  const [groupInfo, setGroupInfo] = useState(null);
  const [tutorInfo, setTutorInfo] = useState(null);
  const [adminInfo, setAdminInfo] = useState(null);

  const fetchGroupInfo = async () => {
    if (!classData?.groupId) return;

    try {
      const groupDoc = await getDoc(doc(db, "groups", classData.groupId));
      if (groupDoc.exists()) {
        setGroupInfo({ id: groupDoc.id, ...groupDoc.data() });
      }
    } catch (error) {
      console.error("Error fetching group info:", error);
    }
  };

  const fetchTutorInfo = async () => {
    if (!classData?.adminId) return;

    try {
      const tutorDoc = await getDoc(doc(db, "tutors", classData.adminId));
      if (tutorDoc.exists()) {
        setTutorInfo({ id: tutorDoc.id, ...tutorDoc.data() });
      }
    } catch (error) {
      console.error("Error fetching tutor info:", error);
    }
  };

  const fetchAdminInfo = async () => {
    if (!classData?.adminId) return;

    try {
      const adminDoc = await getDoc(doc(db, "students", classData.adminId));
      if (adminDoc.exists()) {
        setAdminInfo({ id: adminDoc.id, ...adminDoc.data() });
      }
    } catch (error) {
      console.error("Error fetching admin info:", error);
    }
  };

  useEffect(() => {
    if (classData?.classType?.includes("Individual Premium")) {
      fetchTutorInfo();
    } else if (!classData?.classType?.includes("Premium")) {
      fetchGroupInfo();
      fetchAdminInfo();
    }
  }, [classData]);

  if (classData?.classType?.includes("Group Premium") && groupTutor) {
    return (
      <div className="flex flex-row items-center w-full max-w-lg gap-4 p-2 bg-white border border-green-500 rounded-2xl">
        <img
          alt={`${groupTutor.name}'s profile`}
          src={groupTutor.photoUrl || "/api/placeholder/112/112"}
          className="object-cover h-28 w-28 rounded-xl"
        />
        <div className="flex flex-col items-start flex-1 gap-2">
          <h1 className="text-xl font-semibold">{groupTutor.name}</h1>
          <p className="text-sm text-left text-gray-600">
            {groupTutor?.bio
              ? groupTutor.bio.split(" ").slice(0, 12).join(" ") + "..."
              : ""}
          </p>
          <div className="flex items-center gap-6">
            <div className="flex flex-col gap-1 text-left">
              <span className="text-gray-700">
                {groupTutor.teachingLanguage} (Teaching)
              </span>
              <span className="text-gray-700">
                {groupTutor.nativeLanguage} (Native)
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex flex-row items-center gap-1">
                <MapPin size={16} className="text-gray-500" />
                <span className="text-gray-700">{groupTutor.country}</span>
              </div>
              <div className="flex flex-row items-center gap-1">
                <Users size={16} className="text-gray-500" />
                <span className="text-gray-700">200k</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (classData?.classType?.includes("Individual Premium") && tutorInfo) {
    return (
      <div className="flex flex-row items-center w-full max-w-lg gap-4 p-2 bg-white border border-green-500 rounded-2xl">
        <img
          alt={`${tutorInfo.name}'s profile`}
          src={tutorInfo.photoUrl || "/api/placeholder/112/112"}
          className="object-cover w-28 h-28 rounded-xl"
        />
        <div className="flex flex-col items-start flex-1 gap-2">
          <h1 className="text-xl font-semibold">{tutorInfo.name}</h1>
          <p className="text-sm text-left text-gray-600">
            {tutorInfo?.bio
              ? tutorInfo.bio.split(" ").slice(0, 12).join(" ") + "..."
              : ""}
          </p>
          <div className="flex items-center gap-6">
            <div className="flex flex-col gap-1 text-left">
              <span className="text-gray-700">
                {tutorInfo.teachingLanguage} (Teaching)
              </span>
              <span className="text-gray-700">
                {tutorInfo.nativeLanguage} (Native)
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex flex-row items-center gap-1">
                <MapPin size={16} className="text-gray-500" />
                <span className="text-gray-700">{tutorInfo.country}</span>
              </div>
              <div className="flex flex-row items-center gap-1">
                <Users size={16} className="text-gray-500" />
                <span className="text-gray-700">200k</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (groupInfo) {
    return (
      <div className="flex flex-row items-center w-full max-w-lg gap-4 p-2 bg-white border border-yellow-500 rounded-2xl">
        <img
          className="object-cover w-16 h-16 rounded-xl"
          src={
            classData.language === "English"
              ? "/svgs/us-big.svg"
              : "/svgs/spain-big.svg"
          }
          alt={classData.language === "English" ? "US Flag" : "Spain Flag"}
        />
        <div className="flex flex-col items-start flex-1 gap-2">
          <h1 className="text-xl font-semibold">{groupInfo.groupName}</h1>
          <div className="flex items-center gap-6">
            <div className="flex flex-row items-center space-x-1">
              <img
                src={
                  classData.language === "English"
                    ? "/svgs/xs-us.svg"
                    : "/svgs/xs-spain.svg"
                }
                alt={
                  classData.language === "English" ? "US Flag" : "Spain Flag"
                }
                className="w-4"
              />
              <span className="text-md">{classData.language}</span>
            </div>
            <div className="flex items-center gap-1">
              <img
                src={adminInfo?.photoUrl || "/api/placeholder/24/24"}
                alt={`${classData.adminName}'s profile`}
                className="w-5 h-5 rounded-full"
              />
              <span className="text-sm">{classData.adminName} (Admin)</span>
            </div>
            <div className="flex flex-row items-center gap-1">
              <Users size={16} className="text-gray-500" />
              <span className="text-gray-700">2k+</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ClassInfoCard;
