import React, { useState, useEffect } from "react";
import { Clock, Calendar, Users, User, X } from "lucide-react";
import Modal from "react-modal";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../context/AuthContext";

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
  isBammbuu = false,
  isBooked = false,
  hideBookButton = false, // New prop to hide the Book Class button completely  cardHeight = "h-[340px]", // Consistent height for all cards
  cardWidth = "w-full max-w-lg", // Further increased width from max-w-md to max-w-lg
  imageHeight = "h-[210px]", // Slightly taller image
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const isPremium =
    classType === "Individual Premium" || classType === "Group Premium";
  const isIndividualPremium = classType === "Individual Premium";
  const [profileUrl, setProfileUrl] = useState(null);
  // We need loading state for the profile fetch
  const [, setLoading] = useState(true);
  const formatTime = (timestamp) => {
    if (!timestamp) return "TBD";

    // Convert Firebase timestamp to a Date object
    const date = new Date(timestamp.seconds * 1000);

    // Format as "HH:MM-HH:MM EST" (with end time calculated using duration)
    const startHour = date.getHours();
    const startMinutes = date.getMinutes();

    // Calculate end time
    const endDate = new Date(date.getTime() + classDuration * 60000);
    const endHour = endDate.getHours();
    const endMinutes = endDate.getMinutes();

    // Format with leading zeros
    const formatDigit = (num) => num.toString().padStart(2, "0");

    // Get timezone abbreviation (EST, PST, etc)
    const timezone = "EST"; // Hardcoding to EST to match the design

    return `${formatDigit(startHour)}:${formatDigit(
      startMinutes
    )}-${formatDigit(endHour)}:${formatDigit(endMinutes)} ${timezone}`;
  };
  const formatDate = (timestamp) => {
    if (!timestamp) return "TBD";

    // Convert Firebase timestamp to a Date object
    const date = new Date(timestamp.seconds * 1000);

    // Format to match "20 DEC 2024" format as in the screenshot
    const day = date.getDate();
    const month = date
      .toLocaleString("en-US", { month: "short" })
      .toUpperCase();
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
  };

  // Add a helper to get the day name
  const getDayName = (timestamp) => {
    if (!timestamp || !timestamp.seconds) return "TBD";
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleString("en-US", { weekday: "long" });
  };

  // Update getDateDisplay to use day name for recurring classes
  const getDateDisplay = (timestamp) => {
    if (
      (recurrenceType &&
        recurrenceType !== "One-time" &&
        recurrenceType !== "None") ||
      (recurrenceTypes &&
        Array.isArray(recurrenceTypes) &&
        recurrenceTypes.length > 0 &&
        recurrenceTypes[0] !== "One-time" &&
        recurrenceTypes[0] !== "None")
    ) {
      return getDayName(timestamp);
    }
    if (!timestamp || !timestamp.seconds) return "TBD";
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
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
  }; // Determine if the class is booked by the user, but not directly using this variable
  // instead, we use the checks inline in the JSX

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

  // Determine if the user has already booked this class
  const isAlreadyBooked =
    user &&
    (classMemberIds.includes(user.uid) ||
      (user.enrolledClasses && user.enrolledClasses.includes(classId)));
  const isClassFull =
    typeof availableSpots !== "undefined" &&
    classMemberIds.length >= availableSpots;

  return (
    <>
      <div
        className="hover:cursor-pointer"
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleClick();
          }
        }}
      >
        {" "}
        <div
          className={`flex flex-col h-[340px] w-full max-w-lg border ${
            isPremium ? "border-[#14b82c]" : "border-[#ffc71f]"
          } ${
            isIndividualPremium ? "bg-[#e6fde9]" : "bg-white"
          } rounded-3xl p-2 mx-auto overflow-hidden`}
        >
          {" "}
          <div
            className={`relative w-full ${
              // If booked or showing in group details (no book button), make image taller
              isBooked ||
              hideBookButton ||
              user?.enrolledClasses?.includes(classId)
                ? "h-[230px]"
                : "h-[190px]"
            } overflow-hidden`}
          >
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
                <div className="flex items-center space-x-2">
                  <img
                    src={
                      language === "English"
                        ? "/svgs/xs-us.svg"
                        : language === "Spanish"
                        ? "/svgs/xs-spain.svg"
                        : "/svgs/eng-spanish-xs.svg"
                    }
                    alt={language === "English" ? "US Flag" : "Spain Flag"}
                    className="w-4 h-4 sm:w-auto ml-2"
                  />
                  <span className="flex items-center">
                    <span className="text-sm sm:text-base text-[#042f0c]">
                      {language}
                    </span>
                  </span>
                </div>

                <div className="flex items-center space-x-2 justify-center mr-2">
                  {/* Show 1:1 badge for individual premium classes */}
                  {isIndividualPremium && (
                    <span className="px-2 py-[2px] bg-[#fff885] rounded-full text-xs sm:text-sm font-medium text-center">
                      1:1 Class
                    </span>
                  )}

                  {/* Show language level badge if available */}
                  {languageLevel !== "None" && !isBammbuu && (
                    <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-[#fff885] rounded-full">
                      {languageLevel}
                    </span>
                  )}
                </div>
              </div>
            </div>{" "}
          </div>{" "}
          <div className="flex flex-col flex-1 w-full px-3 py-1 justify-evenly">
            <div className="flex flex-col w-full space-y-1.5">
              {" "}
              <div className="flex flex-row items-center justify-between w-full">
                <div className="flex items-center space-x-1">
                  <img
                    alt="bammbuu"
                    src="/svgs/clock.svg"
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-[#454545]">
                    {formatTime(classDateTime)}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <img
                    alt="bammbuu"
                    src="/svgs/calendar.svg"
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-[#454545]">
                    {getDateDisplay(classDateTime)}
                  </span>
                </div>
              </div>
              <div className="flex flex-row items-center justify-between w-full">
                <div className="flex items-center space-x-1">
                  {profileUrl ? (
                    <img
                      src={profileUrl}
                      alt={adminName}
                      className="object-cover w-4 h-4 rounded-full"
                    />
                  ) : (
                    <User className="w-4 h-4 text-gray-600" />
                  )}
                  <span className="text-sm text-[#454545]">
                    {adminName || "TBD"}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <img
                    alt="bammbuu"
                    src="/svgs/users.svg"
                    className="w-4 h-4"
                  />
                  {typeof availableSpots !== "undefined" && (
                    <span className="text-sm text-[#454545]">
                      {classMemberIds.length}/{availableSpots}
                    </span>
                  )}
                </div>
              </div>
            </div>{" "}
            {/* Only show Book Class button if class is not booked, not full, and hideBookButton is false */}
            {!isAlreadyBooked && !isClassFull && !hideBookButton ? (
              <div className="mt-auto pt-1">
                <button className="w-full py-2 font-medium text-black bg-[#00B919] rounded-full hover:bg-[#00A117] border border-black">
                  Book Class
                </button>
              </div>
            ) : !hideBookButton ? (
              <div className="mt-auto pt-1">
                <button
                  className="w-full py-2 font-medium text-gray-500 bg-gray-200 border border-gray-400 rounded-full cursor-not-allowed"
                  disabled
                  title={isAlreadyBooked ? "Already Booked" : "Class Full"}
                >
                  {isAlreadyBooked ? "Already Booked" : "Class Full"}
                </button>
              </div>
            ) : null}
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
                  src={imageUrl || "/images/panda.png"}
                  alt={className}
                  className="object-cover w-full h-full rounded-full"
                />
              </div>
              <h2 className="mb-3 text-xl font-bold text-center sm:text-2xl">
                {className}
              </h2>
              <div className="flex items-center gap-2 mb-6">
                <span className="text-sm sm:text-base">{language}</span>

                <div className="flex items-center ml-auto space-x-2">
                  {/* Show 1:1 badge for individual premium classes */}
                  {isIndividualPremium && (
                    <span className="px-2 py-[2px] bg-[#fff885] rounded-full text-xs sm:text-sm font-medium text-center">
                      1:1 Class
                    </span>
                  )}

                  {/* Only show language level if available */}
                  {languageLevel !== "None" && !isBammbuu && (
                    <span className="px-2 py-0.5 text-xs sm:text-sm bg-[#fff885] rounded-full">
                      {languageLevel}
                    </span>
                  )}
                </div>
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
                    {typeof availableSpots !== "undefined"
                      ? `${classMemberIds.length}/${availableSpots}`
                      : classMemberIds.length}
                  </span>
                </div>
              </div>{" "}
              <div className="mb-6 text-sm text-center text-gray-600 sm:text-base">
                <div className="max-h-24 overflow-hidden">
                  <p className="break-words line-clamp-4">{classDescription}</p>
                </div>
              </div>
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
                      src="/images/panda.png"
                      alt={`${language} flag`}
                      className="w-10 h-10 rounded-full sm:w-12 sm:h-12"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium sm:text-base">{`${language} Learners`}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 sm:text-sm">
                        <img
                          src="/images/panda.png"
                          alt={language}
                          className="w-4 h-4 rounded-full"
                        />
                        <span>{language}</span>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <img
                            src={adminImageUrl || "/images/panda.png"}
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

          {/* At the bottom of the card, always render a button area with fixed height */}
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
