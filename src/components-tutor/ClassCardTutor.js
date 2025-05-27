import React, { useState } from "react";
import { Clock, Calendar, Users, User, X } from "lucide-react";
import Modal from "react-modal";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

Modal.setAppElement("#root");

const ClassCardTutor = ({
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
  selectedRecurrenceType,
  recurrenceTypes = [],
  classType,
  classLocation,
  onClick,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isPremium =
    classType === "Individual Premium" || classType === "Group Premium";

  const formatTime = (timestamp) => {
    if (!timestamp) return t("class-card-tutor.labels.tbd");

    // Convert Firebase timestamp to a Date object
    const date = new Date(timestamp.seconds * 1000);

    // Format the time in UTC
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return t("class-card-tutor.labels.tbd");

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
    if (!timestamp) return t("class-card-tutor.labels.tbd");

    const date = new Date(timestamp.seconds * 1000);

    // Get the day name
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });

    // For weekly recurring classes, show just the day name
    return dayName;
  };
  // Function to determine if we should show the day name or full date
  const getDateDisplay = (timestamp) => {
    // Check if it's a recurring premium individual class
    const isPremiumIndividual = classType === "Individual Premium";

    // Check if the class is recurring (any recurring type)
    const isRecurring =
      (recurrenceType &&
        recurrenceType !== "One-time" &&
        recurrenceType !== "None") ||
      (recurrenceTypes &&
        recurrenceTypes.length > 0 &&
        recurrenceTypes.some(
          (type) => type !== "One-time" && type !== "None"
        )) ||
      (selectedRecurrenceType &&
        selectedRecurrenceType !== "One-time" &&
        selectedRecurrenceType !== "None");

    // For premium individual classes that are recurring, show day of week
    if (isPremiumIndividual && isRecurring) {
      return getRecurringDayDisplay(timestamp);
    } else {
      return formatDate(timestamp);
    }
  };

  const handleClick = () => {
    navigate(`/classDetailsTutor/${classId}`);
  };

  const isClassOngoing = () => {
    if (!classDateTime || !classDateTime.seconds) return false;
    const now = new Date();
    const classStart = new Date(classDateTime.seconds * 1000);
    const classEnd = new Date(classStart.getTime() + classDuration * 60 * 1000);
    return now >= classStart && now <= classEnd;
  };

  return (
    <>
      <>
        <div className="hover:cursor-pointer" onClick={handleClick}>
          <div
            className={`flex flex-col h-auto sm:h-[25rem] border ${
              isPremium ? "border-[#14b82c]" : "border-[#ffc71f]"
            } ${
              classType === "Individual Premium" ? "bg-[#e6fde9]" : "bg-white"
            } rounded-3xl p-2`}
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
                  alt={t("class-card-tutor.labels.premium")}
                  className="absolute w-24 h-6 sm:h-8 sm:w-28 top-2 left-2"
                />
              )}
              {isClassOngoing() && (
                <span className="absolute px-2 sm:px-3 py-1 text-xs sm:text-sm bg-[#B9F9C2BF]/75 backdrop-blur-sm rounded-full top-2 right-2">
                  {t("class-card-tutor.labels.ongoing")}
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
                      alt={
                        language === "English"
                          ? t("class-card-tutor.altText.usFlag")
                          : t("class-card-tutor.altText.spainFlag")
                      }
                      className="w-4 h-4 sm:w-auto"
                    />
                    <span className="flex items-center">
                      <span className="text-sm sm:text-base text-[#042f0c]">
                        {language}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Show 1:1 badge for individual premium classes */}
                    {classType === "Individual Premium" && (
                      <span className="px-2 py-[2px] bg-[#fff885] rounded-full text-xs sm:text-sm font-medium">
                        1:1
                      </span>
                    )}

                    {/* Show language level badge if available */}
                    {languageLevel !== "None" && (
                      <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-[#fff885] rounded-full">
                        {languageLevel}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-end w-full p-2 space-y-2">
              <div className="flex flex-col items-start justify-between w-full gap-2 sm:flex-row sm:items-center sm:gap-0">
                <div className="flex items-center space-x-2">
                  <img
                    alt={t("class-card-tutor.altText.clock")}
                    src="/svgs/clock.svg"
                  />{" "}
                  <span className="text-sm sm:text-md text-[#454545]">
                    {formatTime(classDateTime)} ({classDuration}{" "}
                    {t("class-card-tutor.labels.min")})
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <img
                    alt={t("class-card-tutor.altText.calendar")}
                    src="/svgs/calendar.svg"
                  />
                  <span className="text-sm sm:text-md text-[#454545]">
                    {getDateDisplay(classDateTime)}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-start justify-between w-full gap-2 sm:flex-row sm:items-center sm:gap-0">
                <div className="flex items-center space-x-1">
                  {adminImageUrl ? (
                    <img
                      src={adminImageUrl}
                      alt={adminName}
                      className="object-cover w-4 h-4 rounded-full sm:w-5 sm:h-5"
                    />
                  ) : (
                    <User className="w-4 h-4 text-gray-600 sm:w-5 sm:h-5" />
                  )}
                  <span className="text-sm sm:text-md text-[#454545]">
                    {adminName || t("class-card-tutor.labels.tbd")}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <img
                    alt={t("class-card-tutor.altText.users")}
                    src="/svgs/users.svg"
                  />
                  <span className="text-sm sm:text-md text-[#454545]">
                    {classMemberIds.length}/{availableSpots}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        className="max-w-md mx-auto mt-20 bg-white outline-none rounded-3xl font-urbanist"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
        style={{
          content: {
            border: "none",
            padding: 0,
            maxWidth: "450px",
          },
        }}
      >
        <div className="">
          <div className="flex items-center justify-between p-6 pb-4">
            <h2 className="text-2xl font-semibold">
              {t("class-card-tutor.modal.title")}
            </h2>
            <button
              onClick={() => setIsModalOpen(false)}
              className="p-2 bg-gray-200 rounded-full hover:bg-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div
            className={`${
              isPremium ? "bg-[#e6fde9]" : "bg-[#ffffea]"
            } px-6 pt-8 pb-6 rounded-2xl mx-4`}
          >
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 mb-4">
                <img
                  src={imageUrl || "/images/panda.png"}
                  alt={className}
                  className="object-cover w-full h-full rounded-full"
                />
              </div>

              <h2 className="mb-3 text-2xl font-bold">{className}</h2>

              <div className="flex items-center gap-2 mb-6">
                <div className="w-6 h-6">
                  {/* Language flag would go here */}
                </div>
                <span>{language}</span>
                <span className="px-2 py-0.5 text-sm bg-[#fff885] rounded-full">
                  {languageLevel}
                </span>
              </div>

              <div className="flex justify-center gap-8 mb-6 text-sm">
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

              <p className="mb-6 text-center text-gray-600">
                {classDescription}
              </p>

              {groupId && (
                <div className="w-full">
                  <h3 className="mb-3 text-lg font-bold text-center">
                    {t("class-card-tutor.modal.languageGroup")}
                  </h3>
                  <div
                    className={`flex items-center gap-4 p-4 bg-white rounded-xl border ${
                      isPremium ? "border-[#97e3a2]" : "border-gray-300"
                    }`}
                  >
                    <img
                      src="/images/panda.png"
                      alt={`${language} flag`}
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{`${language} ${t(
                          "class-card-tutor.modal.learners"
                        )}`}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
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
                            alt={t("class-card-tutor.modal.leader")}
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
            <button className="w-full py-3 font-medium text-black bg-[#ffbf00] rounded-full hover:bg-[#e6ac00] border border-black">
              {t("class-card-tutor.modal.joinClass")}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ClassCardTutor;
