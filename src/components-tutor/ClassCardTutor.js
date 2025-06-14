import { useState } from "react";
import { Clock, Calendar, Users, User, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Modal from "react-modal";

Modal.setAppElement("#root");

const ClassCardTutor = ({
  examPrep,
  introCall = false,
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
    let date;
    if (typeof timestamp === "string") {
      date = new Date(timestamp);
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // New function to get the day name for recurring classes
  const getRecurringDayDisplay = (timestamp) => {
    if (!timestamp) return t("class-card-tutor.labels.tbd");
    let date;
    if (typeof timestamp === "string") {
      date = new Date(timestamp);
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
    return dayName;
  };

  // Add a helper to get the day name
  const getDayName = (timestamp) => {
    if (!timestamp) return "TBD";
    let date;
    if (typeof timestamp === "string") {
      date = new Date(timestamp);
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
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
    if (!timestamp) return "TBD";
    let date;
    if (typeof timestamp === "string") {
      date = new Date(timestamp);
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleClick = () => {
    navigate(`/classDetailsTutor/${classId}`);
  };

  const isClassOngoing = () => {
    if (!classDateTime) return false;
    let classStart;
    if (typeof classDateTime === "string") {
      classStart = new Date(classDateTime);
    } else if (classDateTime.seconds) {
      classStart = new Date(classDateTime.seconds * 1000);
    } else {
      classStart = new Date(classDateTime);
    }
    const now = new Date();
    const classEnd = new Date(classStart.getTime() + classDuration * 60 * 1000);
    return now >= classStart && now <= classEnd;
  };

  return (
    <>
      <>
        <div className="hover:cursor-pointer" onClick={handleClick}>
          <div
            className={`${
              examPrep
                ? "h-[280px] w-full min-w-[220px] max-w-[350px] bg-[#E6FDE9]"
                : ""
            } flex h-auto flex-col border sm:h-[25rem] ${
              isPremium || examPrep ? "border-[#14b82c]" : "border-[#ffc71f]"
            } rounded-3xl bg-[#E6FDE9] p-2`}
          >
            <div className="relative aspect-video w-full sm:h-80">
              {examPrep ? (
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
                  alt={t("class-card-tutor.labels.premium")}
                  className="absolute left-2 top-2 h-6 w-24 sm:h-8 sm:w-28"
                />
              )}
              {isClassOngoing() && (
                <span className="absolute right-2 top-2 rounded-full bg-[#B9F9C2BF]/75 px-2 py-1 text-xs backdrop-blur-sm sm:px-3 sm:text-sm">
                  {t("class-card-tutor.labels.ongoing")}
                </span>
              )}

              <div className="absolute bottom-0 left-0 right-0 rounded-b-2xl bg-[#B9F9C2BF]/75 pb-2 pr-2 backdrop-blur-sm">
                {examPrep && (
                  <div className="mb-2 h-[1px] w-full rounded bg-[#46E25C]" />
                )}
                <div className={`${examPrep ? "p-2" : "pl-1 pt-2"}`}>
                  <h2 className="ml-2 line-clamp-2 truncate text-xl font-bold text-gray-800 sm:text-xl">
                    {className}
                  </h2>
                </div>

                {!examPrep && (
                  <div className="flex items-center justify-between">
                    <div className="ml-2 flex items-center space-x-2">
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
                      {/* Show 1:1 badge for individual premium classes */}
                      {classType === "Individual Premium" && (
                        <span className="rounded-full bg-[#fff885] px-2 py-[2px] text-xs font-medium sm:text-sm">
                          1:1
                        </span>
                      )}

                      {/* Show language level badge if available */}
                      {languageLevel !== "None" && (
                        <span className="rounded-full bg-[#fff885] px-2 py-1 text-xs sm:px-3 sm:text-sm">
                          {languageLevel}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex w-full flex-col items-center justify-end space-y-2 p-2">
              <div className="flex w-full flex-col items-start justify-between gap-2 sm:flex-row sm:items-center sm:gap-0">
                <div className="flex items-center space-x-2">
                  <img
                    alt={t("class-card-tutor.altText.clock")}
                    src="/svgs/clock.svg"
                  />{" "}
                  <span className="sm:text-md text-sm text-[#454545]">
                    {formatTime(classDateTime)} (
                    {introCall ? 30 : examPrep ? 60 : classDuration}{" "}
                    {t("class-card-tutor.labels.min")})
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <img
                    alt={t("class-card-tutor.altText.calendar")}
                    src="/svgs/calendar.svg"
                  />
                  <span className="sm:text-md text-sm text-[#454545]">
                    {getDateDisplay(classDateTime)}
                  </span>
                </div>
              </div>
              <div className="flex w-full flex-col items-start justify-between gap-2 sm:flex-row sm:items-center sm:gap-0">
                <div className="flex items-center space-x-1">
                  {adminImageUrl ? (
                    <img
                      src={adminImageUrl}
                      alt={adminName}
                      className="h-4 w-4 rounded-full object-cover sm:h-5 sm:w-5"
                    />
                  ) : (
                    <User className="h-4 w-4 text-gray-600 sm:h-5 sm:w-5" />
                  )}
                  <span className="sm:text-md text-sm text-[#454545]">
                    {adminName || t("class-card-tutor.labels.tbd")}
                  </span>
                </div>
                {!examPrep && (
                  <div className="flex items-center space-x-2">
                    <img
                      alt={t("class-card-tutor.altText.users")}
                      src="/svgs/users.svg"
                    />
                    <span className="sm:text-md text-sm text-[#454545]">
                      {classMemberIds.length}/{availableSpots}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        className="mx-auto mt-20 max-w-md rounded-3xl bg-white font-urbanist outline-none"
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
              className="rounded-full bg-gray-200 p-2 hover:bg-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div
            className={`${
              isPremium ? "bg-[#e6fde9]" : "bg-[#ffffea]"
            } mx-4 rounded-2xl px-6 pb-6 pt-8`}
          >
            <div className="flex flex-col items-center">
              <div className="mb-4 h-24 w-24">
                <img
                  src={imageUrl || "/images/panda.png"}
                  alt={className}
                  className="h-full w-full rounded-full object-cover"
                />
              </div>

              <h2 className="mb-3 max-w-full truncate text-2xl font-bold">
                {className}
              </h2>
              <div className="mb-6 flex items-center gap-2">
                <div className="h-6 w-6">
                  {/* Language flag would go here */}
                </div>
                <span>{language}</span>
                <span className="rounded-full bg-[#fff885] px-2 py-0.5 text-sm">
                  {languageLevel}
                </span>
              </div>

              <div className="mb-6 flex justify-center gap-8 text-sm">
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
                    {classMemberIds.length}/{availableSpots}
                  </span>
                </div>
              </div>

              <p className="mb-6 text-center text-gray-600">
                {classDescription}
              </p>

              {groupId && (
                <div className="w-full">
                  <h3 className="mb-3 text-center text-lg font-bold">
                    {t("class-card-tutor.modal.languageGroup")}
                  </h3>
                  <div
                    className={`flex items-center gap-4 rounded-xl border bg-white p-4 ${
                      isPremium ? "border-[#97e3a2]" : "border-gray-300"
                    }`}
                  >
                    <img
                      src="/images/panda.png"
                      alt={`${language} flag`}
                      className="h-12 w-12 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-medium">{`${language} ${t(
                          "class-card-tutor.modal.learners",
                        )}`}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
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
                            alt={t("class-card-tutor.modal.leader")}
                            className="h-4 w-4 rounded-full"
                          />
                          <span>{adminName}</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
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
            <button className="w-full rounded-full border border-black bg-[#ffbf00] py-3 font-medium text-black hover:bg-[#e6ac00]">
              {t("class-card-tutor.modal.joinClass")}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ClassCardTutor;
