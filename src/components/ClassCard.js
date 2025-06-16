import { useState, useEffect } from "react";
import { Clock, Calendar, Users, User, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import Modal from "react-modal";
import { useAuth } from "../context/AuthContext";
import { t } from "i18next";

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
  recurringSlots = [], // Add recurringSlots prop
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const isPremium =
    classType === "Individual Premium" || classType === "Group Premium";
  const isIndividualPremium = classType === "Individual Premium";
  const introClass = classType === "introductory_call";
  const examPrepClass = classType === "exam_prep";
  const [profileUrl, setProfileUrl] = useState(null);
  // We need loading state for the profile fetch
  const [, setLoading] = useState(true);
  const formatTime = (timestamp) => {
    if (!timestamp) return "TBD";
    let date;
    if (typeof timestamp === "string") {
      date = new Date(timestamp);
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      return "TBD";
    }
    const duration = introClass ? 30 : examPrepClass ? 60 : classDuration;
    const endDate = new Date(date.getTime() + duration * 60000);

    // Format start and end time in 12-hour format with AM/PM
    const format12 = (d) =>
      d
        .toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
        .replace(/^0/, ""); // Remove leading zero

    return `${format12(date)} - ${format12(endDate)}`;
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

  // Helper to get the next available slot
  const getNextAvailableSlot = () => {
    if (!recurringSlots || recurringSlots.length === 0) return null;
    const now = new Date();
    // Find the first slot in the future
    const nextSlot = recurringSlots.find((slot) => {
      const slotDate = slot.createdAt
        ? new Date(slot.createdAt.seconds * 1000)
        : slot.seconds
          ? new Date(slot.seconds * 1000)
          : null;
      return slotDate && slotDate > now;
    });
    return nextSlot || null;
  };

  // Use next available slot for display if recurring
  const nextSlot = getNextAvailableSlot();
  const showRecurring =
    (recurrenceType &&
      recurrenceType !== "One-time" &&
      recurrenceType !== "None") ||
    (recurrenceTypes &&
      Array.isArray(recurrenceTypes) &&
      recurrenceTypes.length > 0 &&
      recurrenceTypes[0] !== "One-time" &&
      recurrenceTypes[0] !== "None");

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
        <div
          className={`flex h-[360px] w-full max-w-lg flex-col border ${
            introClass || examPrepClass
              ? "h-[280px] w-full min-w-[220px] max-w-[350px] bg-[#E6FDE9]"
              : ""
          } ${isPremium || introClass || examPrepClass ? "border-[#14b82c]" : "border-[#ffc71f]"} } mx-auto overflow-hidden rounded-3xl bg-[#E6FDE9] p-2`}
        >
          <div
            className={`relative w-full ${
              isBooked ||
              hideBookButton ||
              user?.enrolledClasses?.includes(classId)
                ? "h-[270px]"
                : "h-[190px]"
            } overflow-hidden`}
          >
            {introClass || examPrepClass ? (
              <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl bg-[#B9F9C2] font-tanker">
                <span className="text-[52.27px]/[100%] font-normal text-[#042F0C]">
                  {t("exam-prep.exam")}
                </span>
                <span className="text-[30.49px]/[100%] font-normal text-[#042F0C]">
                  {t("exam-prep.preparation")}
                </span>
              </div>
            ) : (
              <img
                alt={className}
                src={imageUrl || "/images/default-class.png"}
                className="h-full w-full rounded-b-3xl rounded-t-2xl object-cover"
              />
            )}
            {isPremium && (
              <img
                src="/images/bambuu-plus-tag.png"
                alt="Premium"
                className="absolute left-2 top-2 h-6 w-24 sm:h-8 sm:w-28"
              />
            )}
            {isClassOngoing() && (
              <span className="absolute right-2 top-2 rounded-full bg-[#B9F9C2BF]/75 px-2 py-1 text-xs backdrop-blur-sm sm:px-3 sm:text-sm">
                {t("class-card-tutor.labels.ongoing")}
              </span>
            )}
            <div className="absolute bottom-0 left-0 right-0 space-y-1 rounded-b-2xl bg-[#B9F9C2BF]/75 backdrop-blur-sm">
              {(introClass || examPrepClass) && (
                <div className="mb-2 h-[1px] w-full rounded bg-[#46E25C]" />
              )}
              <div
                className={`${examPrepClass || introClass ? "p-2" : "pl-1 pt-2"}`}
              >
                <h2 className="ml-2 truncate text-lg font-bold text-gray-800 sm:text-xl">
                  {className}
                </h2>
              </div>
              {!(introClass || examPrepClass) && (
                <div className="flex items-center justify-between">
                  <div className="mb-2 ml-2 flex items-center space-x-2">
                    <img
                      src={
                        language === "English"
                          ? "/svgs/xs-us.svg"
                          : language === "Spanish"
                            ? "/svgs/xs-spain.svg"
                            : "/svgs/eng-spanish-xs.svg"
                      }
                      alt={
                        language === "English"
                          ? t("class-card-tutor.altText.usFlag")
                          : t("class-card-tutor.altText.spainFlag")
                      }
                      className="h-4 w-4 sm:w-auto"
                    />
                    <span className="flex items-center">
                      <span className="text-sm text-[#042f0c] sm:text-base">
                        {language}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isIndividualPremium && (
                      <span className="rounded-full bg-[#fff885] px-2 py-[2px] text-xs font-medium sm:text-sm">
                        1:1
                      </span>
                    )}
                    {languageLevel !== "None" && !isBammbuu && (
                      <span className="mb-2 mr-2 rounded-full bg-[#fff885] px-2 py-1 text-xs sm:px-3 sm:text-sm">
                        {languageLevel}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex w-full flex-1 flex-col justify-evenly px-3 py-1">
            <div className="flex w-full flex-col space-y-1.5">
              <div className="flex w-full flex-row items-center justify-between">
                <div className="flex items-center space-x-1">
                  <img
                    alt="bammbuu"
                    src="/svgs/clock.svg"
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-[#454545]">
                    {showRecurring && nextSlot
                      ? formatTime(nextSlot.createdAt || nextSlot)
                      : formatTime(classDateTime)}
                  </span>
                </div>
                <div className="flex items-center space-x-1 space-y-1">
                  <img
                    alt="bammbuu"
                    src="/svgs/calendar.svg"
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-[#454545]">
                    {showRecurring && nextSlot
                      ? getDateDisplay(nextSlot.createdAt || nextSlot)
                      : getDateDisplay(classDateTime)}
                  </span>
                </div>
              </div>
              <div className="flex w-full flex-row items-center justify-between">
                <div className="flex items-center space-x-1">
                  {profileUrl ? (
                    <img
                      src={profileUrl}
                      alt={adminName}
                      className="h-4 w-4 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-4 w-4 text-gray-600" />
                  )}
                  <span className="text-sm text-[#454545]">
                    {adminName + " (Instructor) " ||
                      t("class-card-tutor.labels.tbd")}
                  </span>
                </div>
                {!(introClass || examPrepClass) && (
                  <div className="flex items-center space-x-2">
                    <img
                      alt="bammbuu"
                      src="/svgs/users.svg"
                      className="h-4 w-4"
                    />
                    {typeof availableSpots !== "undefined" && (
                      <span className="text-sm text-[#454545]">
                        {classMemberIds.length}/{availableSpots}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            {!isAlreadyBooked && !isClassFull && !hideBookButton ? (
              <div className="mt-auto pt-1">
                <button className="w-full rounded-full border border-black bg-[#00B919] py-2 font-medium text-black hover:bg-[#00A117]">
                  {t("class-card-tutor.modal.joinClass")}
                </button>
              </div>
            ) : !hideBookButton && !isAlreadyBooked ? (
              <div className="mt-auto pt-1">
                <button
                  className="w-full cursor-not-allowed rounded-full border border-gray-400 bg-gray-200 py-2 font-medium text-gray-500"
                  disabled
                  title={t("class-card-tutor.labels.classFull")}
                >
                  {t("class-card-tutor.labels.classFull")}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        className="mx-auto mt-20 w-[90%] max-w-md rounded-3xl bg-white font-urbanist outline-none"
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
              className="rounded-full bg-gray-200 p-1.5 hover:bg-gray-300 sm:p-2"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>

          <div
            className={`${
              isPremium ? "bg-[#e6fde9]" : "bg-[#ffffea]"
            } mx-4 rounded-2xl px-4 pb-4 pt-6 sm:px-6 sm:pb-6 sm:pt-8`}
          >
            <div className="flex flex-col items-center">
              <div className="mb-4 h-20 w-20 sm:h-24 sm:w-24">
                <img
                  src={imageUrl || "/images/panda.png"}
                  alt={className}
                  className="h-full w-full rounded-full object-cover"
                />
              </div>
              <h2 className="mb-3 text-center text-xl font-bold sm:text-2xl">
                {className}
              </h2>
              <div className="mb-6 flex items-center gap-2">
                <span className="text-sm sm:text-base">{language}</span>

                <div className="ml-auto flex items-center space-x-2">
                  {/* Show 1:1 badge for individual premium classes */}
                  {isIndividualPremium && (
                    <span className="rounded-full bg-[#fff885] px-2 py-[2px] text-center text-xs font-medium sm:text-sm">
                      1:1 Class
                    </span>
                  )}

                  {/* Only show language level if available */}
                  {languageLevel !== "None" && !isBammbuu && (
                    <span className="rounded-full bg-[#fff885] px-2 py-0.5 text-xs sm:text-sm">
                      {languageLevel}
                    </span>
                  )}
                </div>
              </div>
              <div className="mb-6 flex flex-wrap justify-center gap-4 text-xs sm:gap-8 sm:text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{formatTime(classDateTime)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{getDateDisplay(classDateTime)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>
                    {typeof availableSpots !== "undefined"
                      ? `${classMemberIds.length}/${availableSpots}`
                      : classMemberIds.length}
                  </span>
                </div>
              </div>{" "}
              <div className="mb-6 text-center text-sm text-gray-600 sm:text-base">
                <div className="max-h-24 overflow-hidden">
                  <p className="line-clamp-4 break-words">{classDescription}</p>
                </div>
              </div>
              {groupId && (
                <div className="w-full">
                  <h3 className="mb-3 text-center text-base font-bold sm:text-lg">
                    Language Group
                  </h3>
                  <div
                    className={`flex items-center gap-4 rounded-xl border bg-white p-3 sm:p-4 ${
                      isPremium ? "border-[#97e3a2]" : "border-gray-300"
                    }`}
                  >
                    <img
                      src="/images/panda.png"
                      alt={`${language} flag`}
                      className="h-10 w-10 rounded-full sm:h-12 sm:w-12"
                    />
                    <div className="flex-1">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm font-medium sm:text-base">{`${language} Learners`}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 sm:text-sm">
                        <img
                          src="/images/panda.png"
                          alt={language}
                          className="h-4 w-4 rounded-full"
                        />
                        <span>{language}</span>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <img
                            src={adminImageUrl || "/images/panda.png"}
                            alt="Leader"
                            className="h-4 w-4 rounded-full"
                          />
                          <span>{adminName}</span>
                        </div>
                        <span>•</span>
                        {!introClass && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{classMemberIds.length}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* At the bottom of the card, always render a button area with fixed height */}
          <div className="p-4">
            <button className="w-full rounded-full border border-black bg-[#ffbf00] py-2.5 text-sm font-medium text-black hover:bg-[#e6ac00] sm:py-3 sm:text-base">
              Join Class
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ClassCard;
