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
    "flex flex-col sm:flex-row items-center w-full max-w-2xl gap-4 sm:gap-8 p-4 sm:p-5 bg-white border rounded-3xl overflow-hidden";
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
        className={`${imgClass} h-20 w-20 flex-shrink-0 rounded-xl sm:h-24 sm:w-24`}
      />
      <div className="flex w-full min-w-[0] flex-1 flex-col items-start gap-2 overflow-hidden">
        <h1 className="w-full truncate text-lg font-medium">
          {tutorInfo?.name}
        </h1>

        <p
          title={tutorInfo?.bio}
          className="w-full overflow-hidden whitespace-normal break-words text-left text-xs text-gray-600"
        >
          {truncateText(tutorInfo?.bio, 18)}
        </p>

        <div className="flex w-full flex-col items-start justify-between gap-2 text-xs sm:flex-row sm:items-center">
          <div className="flex flex-col gap-0.5">
            <span className="break-words text-gray-700">
              {tutorInfo?.teachingLanguage} (Teaching)
            </span>
            <span className="break-words text-left text-gray-700">
              {tutorInfo?.nativeLanguage} (Native)
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1">
              <img src="/svgs/location.svg" alt="location" />
              <span className="break-words text-gray-700">
                {tutorInfo?.country}
              </span>
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
