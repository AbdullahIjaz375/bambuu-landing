import React, { useState, useEffect } from "react";
import { MapPin, Users } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

const GroupInfoCard = ({ group }) => {
  const [tutorInfo, setTutorInfo] = useState(null);

  // Fetch tutor info based on the adminId in the group
  const fetchTutorInfo = async () => {
    if (!group?.groupAdminId) return;

    try {
      const tutorDoc = await getDoc(doc(db, "tutors", group.groupAdminId));
      if (tutorDoc.exists()) {
        setTutorInfo({ id: tutorDoc.id, ...tutorDoc.data() });
      }
    } catch (error) {
      console.error("Error fetching tutor info:", error);
    }
  };

  useEffect(() => {
    fetchTutorInfo();
  }, [group]);

  const baseCardClass =
    "flex flex-row items-center w-full max-w-md gap-3 p-2 bg-white border rounded-3xl";
  const imgClass = "object-cover rounded-2xl";

  return (
    <div className={`${baseCardClass} border-green-500`}>
      <img
        alt={`${tutorInfo?.name || "Tutor"}'s profile`}
        src={tutorInfo?.photoUrl || "/api/placeholder/80/80"}
        className={`${imgClass} w-28 h-28 rounded-xl`}
      />
      <div className="flex flex-col items-start flex-1 gap-1">
        <h1 className="text-lg font-medium">{tutorInfo?.name}</h1>
       
        
        <p title={tutorInfo?.bio} className="text-xs text-left text-gray-600">
  {tutorInfo?.bio
    ? tutorInfo?.bio.includes(" ")
      ? tutorInfo?.bio.split(" ").slice(0, 12).join(" ") + "..."
      : tutorInfo?.bio.slice(0, 30) + "...."
    : ""}
</p>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex flex-col gap-0.5">
            <span className="text-gray-700">
              {tutorInfo?.teachingLanguage} (Teaching)
            </span>
            <span className="text-left text-gray-700">
              {tutorInfo?.nativeLanguage} (Native)
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1">
              <img src="/svgs/location.svg" />{" "}
              <span className="text-gray-700">{tutorInfo?.country}</span>
            </div>
            <div className="flex items-center gap-1">
              <img src="/svgs/users.svg" />{" "}
              <span className="text-gray-700">200k</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupInfoCard;
