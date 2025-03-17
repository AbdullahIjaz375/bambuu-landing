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
    } else if (!classData?.classType?.includes("Individual")) {
      fetchGroupInfo();
      fetchAdminInfo();
    }
  }, [classData]);

  const baseCardClass =
    "flex flex-row items-center w-full max-w-md gap-3 p-2 bg-white border rounded-2xl";
  const imgClass = "object-cover rounded-2xl";

  if (classData?.classType?.includes("Group Premium") && groupTutor) {
    return (
      // <div className={`${baseCardClass} border-green-500`}>
      //   <img
      //     alt={`${groupTutor.name}'s profile`}
      //     src={groupTutor.photoUrl || "/api/placeholder/80/80"}
      //     className={`${imgClass} w-20 h-20`}
      //   />
      //   <div className="flex flex-col items-start flex-1 gap-1">
      //     <h1 className="text-lg font-medium">{groupTutor.name}</h1>
      //     <p className="text-xs text-left text-gray-600">
      //       {groupTutor?.bio
      //         ? groupTutor.bio.split(" ").slice(0, 12).join(" ") + "..."
      //         : ""}
      //     </p>
      //     <div className="flex items-center gap-4 text-xs">
      //       <div className="flex flex-col gap-0.5">
      //         <span className="text-gray-700">
      //           {groupTutor.teachingLanguage} (Teaching)
      //         </span>
      //         <span className="text-gray-700">
      //           {groupTutor.nativeLanguage} (Native)
      //         </span>
      //       </div>
      //       <div className="flex flex-col gap-0.5">
      //         <div className="flex items-center gap-1">
      //           <MapPin size={12} className="text-gray-500" />
      //           <span className="text-gray-700">{groupTutor.country}</span>
      //         </div>
      //         <div className="flex items-center gap-1">
      //           <Users size={12} className="text-gray-500" />
      //           <span className="text-gray-700">200k</span>
      //         </div>
      //       </div>
      //     </div>
      //   </div>
      // </div>
      <div className={`${baseCardClass} border-yellow-500`}>
        <img
          className={`${imgClass} w-12 h-12`}
          src={groupInfo?.imageUrl}
          alt={classData.language === "English" ? "US Flag" : "Spain Flag"}
        />
        <div className="flex flex-col items-start flex-1 gap-1">
          <h1 className="text-lg font-medium">{groupInfo?.groupName}</h1>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <img
                src={
                  groupInfo?.groupLearningLanguage === "English"
                    ? "/svgs/xs-us.svg"
                    : "/svgs/xs-spain.svg"
                }
                alt={
                  groupInfo?.groupLearningLanguage === "English"
                    ? "US Flag"
                    : "Spain Flag"
                }
                className="w-3"
              />
              <span>{groupInfo?.groupLearningLanguage}</span>
            </div>
            <div className="flex items-center gap-1">
              <img
                src={groupInfo?.groupAdminImageUrl || "/api/placeholder/24/24"}
                alt={`${classData.adminName}'s profile`}
                className="w-4 h-4 rounded-full"
              />
              <span className="text-xs ">{groupInfo?.groupAdminName}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users size={12} className="text-gray-500" />
              <span className="text-gray-700">
                {groupInfo?.memberIds.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (classData?.classType?.includes("Individual Premium") && tutorInfo) {
    return (
      <div className={`${baseCardClass} border-green-500`}>
        <img
          alt={`${tutorInfo.name}'s profile`}
          src={tutorInfo.photoUrl || "/api/placeholder/80/80"}
          className={`${imgClass} w-28 h-28`}
        />
        <div className="flex flex-col items-start flex-1 gap-1">
          <h1 className="text-lg font-medium">{tutorInfo.name}</h1>
          <p title={tutorInfo.bio} className="text-xs text-left text-gray-600">
  {tutorInfo?.bio
    ? tutorInfo.bio.includes(" ")
      ? tutorInfo.bio.split(" ").slice(0, 12).join(" ") + "..."
      : tutorInfo.bio.slice(0, 30) + "...."
    : ""}
</p>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex flex-col gap-0.5">
              <span className="text-gray-700">
                {tutorInfo.teachingLanguage} (Teaching)
              </span>
              <span className="text-gray-700">
                {tutorInfo.nativeLanguage} (Native)
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1">
                <MapPin size={12} className="text-gray-500" />
                <span className="text-gray-700">{tutorInfo.country}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users size={12} className="text-gray-500" />
                <span className="text-gray-700">
                  {tutorInfo?.tutorStudentIds.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (groupInfo) {
    return (
      <div className={`${baseCardClass} border-yellow-500`}>
        <img
          className={`${imgClass} w-12 h-12`}
          src={
            classData.language === "English"
              ? "/svgs/us-big.svg"
              : "/svgs/spain-big.svg"
          }
          alt={classData.language === "English" ? "US Flag" : "Spain Flag"}
        />
        <div className="flex flex-col items-start flex-1 gap-1">
          <h1 className="text-lg font-medium">{groupInfo.groupName}</h1>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <img
                src={
                  classData.language === "English"
                    ? "/svgs/xs-us.svg"
                    : "/svgs/xs-spain.svg"
                }
                alt={
                  classData.language === "English" ? "US Flag" : "Spain Flag"
                }
                className="w-3"
              />
              <span>{classData.language}</span>
            </div>
            <div className="flex items-center gap-1">
              <img
                src={adminInfo?.photoUrl || "/api/placeholder/24/24"}
                alt={`${classData.adminName}'s profile`}
                className="w-4 h-4 rounded-full"
              />
              <span className="text-xs ">{classData.adminName}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users size={12} className="text-gray-500" />
              <span className="text-gray-700">
                {classData.classMemberIds.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ClassInfoCard;
