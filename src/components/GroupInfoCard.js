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
    "flex flex-row items-center w-full max-w-2xl gap-8 p-5 bg-white border rounded-3xl";
  const imgClass = "object-cover rounded-2xl";

  // Function to truncate text to a specific number of words
  const truncateText = (text, maxWords) => {
    if (!text) return "";
    const words = text.split(" ");
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(" ") + "...";
  };

  return (
    <div className={`${baseCardClass} border-green-500`}>
      <img
        alt={`${tutorInfo?.name || "Tutor"}'s profile`}
        src={tutorInfo?.photoUrl || "/images/panda.png"}
        className={`${imgClass} w-24 h-24 rounded-xl flex-shrink-0`}
      />
      <div className="flex flex-col items-start w-full flex-1 gap-2 overflow-hidden min-w-[220px]">
        <h1 className="text-lg font-medium truncate w-full">
          {tutorInfo?.name}
        </h1>

        <p
          title={tutorInfo?.bio}
          className="text-xs text-left text-gray-600 w-full overflow-hidden"
        >
          {truncateText(tutorInfo?.bio, 12)}
        </p>

        <div className="flex items-center justify-between w-full text-xs">
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
              <img src="/svgs/location.svg" alt="location" />
              <span className="text-gray-700">{tutorInfo?.country}</span>
            </div>
            <div className="flex items-center gap-1">
              <img src="/svgs/users.svg" alt="users" />
              <span className="text-gray-700">
                {group.memberIds ? group.memberIds.length : 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupInfoCard;
