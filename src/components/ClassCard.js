import React, { useState, useEffect } from "react";
import { Clock, Calendar, Users, User, X } from "lucide-react";
import Modal from "react-modal";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

Modal.setAppElement("#root");

const ClassCard = ({
  classId,
  className,
  language,
  languageLevel,
  classDateTime,
  classDuration,
  adminId,
  adminName,
  adminImageUrl,
  classMemberIds = [],
  availableSpots,
  imageUrl,
  classDescription,
  classAddress,
  groupId,
  recurrenceType,
  recurrenceTypes = [],
  selectedRecurrenceType,
  classType,
  classLocation,
  onClick,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const isPremium =
    classType === "Individual Premium" || classType === "Group Premium";

  const formatTime = (timestamp) => {
    if (!timestamp) return "TBD";

    // Convert Firebase timestamp to a Date object
    const date = new Date(timestamp.seconds * 1000);

    // Format the time in UTC
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "TBD";

    // Convert Firebase timestamp to a Date object
    const date = new Date(timestamp.seconds * 1000);

    // Format the date in UTC
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // New function to get the day name for recurring classes
  const getRecurringDayDisplay = (timestamp) => {
    if (!timestamp) return "TBD";
    
    const date = new Date(timestamp.seconds * 1000);
    
    // Get the day name
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
    
    // For weekly recurring classes, show just the day name
    return dayName;
  };

  // Function to determine if we should show the day name or full date
  const getDateDisplay = (timestamp) => {
    // Check if the class is recurring (weekly)
    const isRecurring = (recurrenceType === "Weekly") || 
                       (recurrenceTypes && recurrenceTypes.includes("Weekly")) ||
                       (selectedRecurrenceType === "Weekly");
    
    if (isRecurring) {
      return getRecurringDayDisplay(timestamp);
    } else {
      return formatDate(timestamp);
    }
  };

  const handleClick = () => {
    navigate(`/classDetailsUser/${classId}`);
  };

  const isClassOngoing = () => {
    if (!classDateTime) return false;
    const now = new Date();
    const classStart = new Date(classDateTime.seconds * 1000);
    const classEnd = new Date(classStart.getTime() + classDuration * 60 * 1000);
    return now >= classStart && now <= classEnd;
  };

  const [profileUrl, setProfileUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminProfile = async () => {
      if (!adminId) {
        setLoading(false);
        return;
      }

      try {
        // Try to fetch from tutors collection first
        let adminDoc = await getDoc(doc(db, "tutors", adminId));

        // If not found in tutors, try students collection
        if (!adminDoc.exists()) {
          adminDoc = await getDoc(doc(db, "students", adminId));
        }

        if (adminDoc.exists()) {
          const adminData = adminDoc.data();
          setProfileUrl(adminData.photoUrl || null);
        }
      } catch (error) {
        console.error("Error fetching admin profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminProfile();
  }, [adminId]);
  
  return (
    <>
      <div className="hover:cursor-pointer" onClick={handleClick}>
        <div
          className={`flex flex-col h-auto sm:h-[25rem] border ${
            isPremium ? "border-[#14b82c]" : "border-[#ffc71f]"
          } bg-white rounded-3xl p-2`}
        >
          <div className="relative w-full aspect-video sm:h-80">
            <img
              alt={className}
              src={imageUrl || "/images/default-class.png"}
              className="object-cover w-full h-full rounded-t-2xl rounded-b-3xl"
            />
            {isPremium && (
              <img
                src="/images/bambuu-plus-tag.png"
                alt="Premium"
                className="absolute w-24 h-6 sm:h-8 sm:w-28 top-2 left-2"
              />
            )}
            {isClassOngoing() && (
              <span className="absolute px-2 sm:px-3 py-1 text-xs sm:text-sm bg-[#B9F9C2BF]/75 backdrop-blur-sm rounded-full top-2 right-2">
                Ongoing
              </span>
            )}

            <div className="absolute bottom-0 left-0 right-0 bg-[#B9F9C2BF]/75 backdrop-blur-sm rounded-b-2xl p-2 space-y-1">
              <h2 className="ml-2 text-xl font-bold text-gray-800 sm:text-xl line-clamp-2">
                {className}
              </h2>

              <div className="flex items-center justify-between">
                <div className="flex items-center ml-2 space-x-2">
                  <img
                    src={
                      language === "English"
                        ? "/svgs/xs-us.svg"
                        : language === "Spanish"
                        ? "/svgs/xs-spain.svg"
                        : "/svgs/eng-spanish-xs.svg"
                    }
                    alt={language === "English" ? "US Flag" : "Spain Flag"}
                    className="w-4 h-4 sm:w-auto"
                  />
                  <span className="flex items-center">
                    <span className="text-sm sm:text-base text-[#042f0c]">
                      {language}
                    </span>
                  </span>
                </div>
                {languageLevel !== "None" && (
                  <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-[#fff885] rounded-full">
                    {languageLevel}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-end w-full p-2 space-y-2">
            <div className="flex flex-col items-start justify-between w-full gap-2 sm:flex-row sm:items-center sm:gap-0">
              <div className="flex items-center space-x-2">
                <img alt="bammbuu" src="/svgs/clock.svg" />
                <span className="text-sm sm:text-md text-[#454545]">
                  {formatTime(classDateTime)} ({classDuration} min)
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <img alt="bammbuu" src="/svgs/calendar.svg" />
                <span className="text-sm sm:text-md text-[#454545]">
                  {getDateDisplay(classDateTime)}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-start justify-between w-full gap-2 sm:flex-row sm:items-center sm:gap-0">
              <div className="flex items-center space-x-1">
                {profileUrl ? (
                  <img
                    src={profileUrl}
                    alt={adminName}
                    className="object-cover w-4 h-4 rounded-full sm:w-5 sm:h-5"
                  />
                ) : (
                  <User className="w-4 h-4 text-gray-600 sm:w-5 sm:h-5" />
                )}
                <span className="text-sm sm:text-md text-[#454545]">
                  {adminName || "TBD"}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <img alt="bammbuu" src="/svgs/users.svg" />
                {!isPremium && (
                  <span className="text-sm sm:text-md text-[#454545]">
                    {classMemberIds.length}/{availableSpots}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        className="w-[90%] max-w-md mx-auto mt-20 bg-white outline-none rounded-3xl font-urbanist"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
        style={{
          content: {
            border: "none",
            padding: 0,
            maxWidth: "450px",
          },
        }}
      >
        <div className="w-full">
          <div className="flex items-center justify-between p-4 pb-4 sm:p-6">
            <h2 className="text-xl font-semibold sm:text-2xl">Class Details</h2>
            <button
              onClick={() => setIsModalOpen(false)}
              className="p-1.5 sm:p-2 bg-gray-200 rounded-full hover:bg-gray-300"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          <div
            className={`${
              isPremium ? "bg-[#e6fde9]" : "bg-[#ffffea]"
            } px-4 sm:px-6 pt-6 sm:pt-8 pb-4 sm:pb-6 rounded-2xl mx-4`}
          >
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 mb-4 sm:w-24 sm:h-24">
                <img
                  src={imageUrl || "/api/placeholder/96/96"}
                  alt={className}
                  className="object-cover w-full h-full rounded-full"
                />
              </div>

              <h2 className="mb-3 text-xl font-bold text-center sm:text-2xl">
                {className}
              </h2>

              <div className="flex items-center gap-2 mb-6">
                <span className="text-sm sm:text-base">{language}</span>
                <span className="px-2 py-0.5 text-xs sm:text-sm bg-[#fff885] rounded-full">
                  {languageLevel}
                </span>
              </div>

              <div className="flex flex-wrap justify-center gap-4 mb-6 text-xs sm:gap-8 sm:text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(classDateTime)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{getDateDisplay(classDateTime)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>
                    {classMemberIds.length}/{availableSpots}
                  </span>
                </div>
              </div>

              <p className="mb-6 text-sm text-center text-gray-600 sm:text-base">
                {classDescription}
              </p>

              {groupId && (
                <div className="w-full">
                  <h3 className="mb-3 text-base font-bold text-center sm:text-lg">
                    Language Group
                  </h3>
                  <div
                    className={`flex items-center gap-4 p-3 sm:p-4 bg-white rounded-xl border ${
                      isPremium ? "border-[#97e3a2]" : "border-gray-300"
                    }`}
                  >
                    <img
                      src="/api/placeholder/48/48"
                      alt={`${language} flag`}
                      className="w-10 h-10 rounded-full sm:w-12 sm:h-12"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium sm:text-base">{`${language} Learners`}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 sm:text-sm">
                        <img
                          src="/api/placeholder/16/16"
                          alt={language}
                          className="w-4 h-4 rounded-full"
                        />
                        <span>{language}</span>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <img
                            src={adminImageUrl || "/api/placeholder/16/16"}
                            alt="Leader"
                            className="w-4 h-4 rounded-full"
                          />
                          <span>{adminName}</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{classMemberIds.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-4">
            <button className="w-full py-2.5 sm:py-3 text-sm sm:text-base font-medium text-black bg-[#ffbf00] rounded-full hover:bg-[#e6ac00] border border-black">
              Join Class
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ClassCard;