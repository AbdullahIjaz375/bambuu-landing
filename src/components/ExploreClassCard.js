import React, { useState, useEffect } from "react";
import { Clock, Calendar, Users, User, X } from "lucide-react";
import Modal from "react-modal";
import PlansModal from "./PlansModal";
import { useAuth } from "../context/AuthContext";
import { doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { checkAccess } from "../utils/accessControl";
import { useTranslation } from "react-i18next";

Modal.setAppElement("#root");

const useClassEnrollment = () => {
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [error, setError] = useState(null);
  const { user, setUser } = useAuth();
  const { t } = useTranslation();

  const updateSessionStorage = (newEnrolledClass) => {
    const storedUser = JSON.parse(sessionStorage.getItem("user"));
    if (storedUser) {
      const updatedUser = {
        ...storedUser,
        enrolledClasses: [
          ...(storedUser.enrolledClasses || []),
          newEnrolledClass,
        ],
      };
      sessionStorage.setItem("user", JSON.stringify(updatedUser));
    }
  };

  const enrollInClass = async (classId, userId, tutorId) => {
    if (!classId) {
      setError(t("exploreClassCard.errors.invalidClassId"));
      return false;
    }

    setIsEnrolling(true);
    setError(null);
    try {
      const classRef = doc(db, "classes", classId);
      const userRef = doc(db, "students", userId);
      const tutorRef = doc(db, "tutors", tutorId);

      const classDoc = await getDoc(classRef);
      const classData = classDoc.data();

      if (!classData) {
        throw new Error(t("exploreClassCard.errors.classNotFound"));
      }

      if (!classData.classDateTime || !classData.classDateTime.seconds) {
        throw new Error(t("exploreClassCard.errors.classDateNotSet"));
      }

      if (classData.classMemberIds?.length >= classData.availableSpots) {
        throw new Error(t("exploreClassCard.errors.classFull"));
      }

      await Promise.all([
        updateDoc(classRef, {
          classMemberIds: arrayUnion(userId),
        }),
        updateDoc(userRef, {
          enrolledClasses: arrayUnion(classId),
        }),
        updateDoc(tutorRef, {
          tutorStudentIds: arrayUnion(userId),
        }),
      ]);

      // Update context and session storage
      if (user) {
        const updatedUser = {
          ...user,
          enrolledClasses: [...(user.enrolledClasses || []), classId],
        };
        setUser(updatedUser);
        updateSessionStorage(classId);
      }

      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setIsEnrolling(false);
    }
  };

  return {
    enrollInClass,
    isEnrolling,
    error,
    setError,
  };
};

const ExploreClassCard = ({
  classId,
  id,
  className,
  language,
  languageLevel,
  classDateTime,
  classType,
  classDuration,
  tutorId,
  tutorName,
  tutorImageUrl,
  classMemberIds = [],
  availableSpots,
  physicalClass,
  imageUrl,
  classDescription,
  adminId,
  adminName,
  adminImageUrl,
  groupId,
  recurrenceTypes,
  isBooked = false,
  cardHeight = "h-[340px]", // Adjusted height based on reference images
  cardWidth = "w-full max-w-sm", // Fixed width with max-width for consistency
  imageHeight = "h-[180px]", // Reduced image height to match reference
}) => {
  const { t } = useTranslation();
  const { user, setUser } = useAuth();
  const { enrollInClass, isEnrolling, error, setError } = useClassEnrollment();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBookingConfirmationOpen, setIsBookingConfirmationOpen] =
    useState(false);
  const [isPlansModalOpen, setIsPlansModalOpen] = useState(false);

  // Ensure we have a valid classId (use id as fallback)
  const validClassId = classId || id;

  // Check if classDateTime is valid (not TBD)
  const hasValidDateTime =
    classDateTime &&
    typeof classDateTime === "object" &&
    classDateTime.seconds &&
    typeof classDateTime.seconds === "number";

  // Determine which user details to display based on isBammbuu flag
  const isPremium =
    classType === "Individual Premium" || classType === "Group Premium";

  const displayName = isPremium ? tutorName : adminName;
  const displayImage = isPremium ? tutorImageUrl : adminImageUrl;

  const formatTime = (timestamp) => {
    if (!timestamp || !timestamp.seconds)
      return t("exploreClassCard.labels.tbd");

    // Convert Firebase timestamp to a Date object
    const date = new Date(timestamp.seconds * 1000);

    // Format the time in UTC
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.seconds)
      return t("exploreClassCard.labels.tbd");

    // Convert Firebase timestamp to a Date object
    const date = new Date(timestamp.seconds * 1000);

    // Check if it's a recurring premium individual class
    const isPremiumIndividual = classType === "Individual Premium";

    // Check if it's a recurring class - need to use recurrenceTypes array
    if (
      recurrenceTypes &&
      Array.isArray(recurrenceTypes) &&
      recurrenceTypes.length > 0
    ) {
      // Show the day of week for recurring premium individual classes
      const firstType = recurrenceTypes[0];
      if (
        isPremiumIndividual &&
        firstType !== "One-time" &&
        firstType !== "None"
      ) {
        return date.toLocaleString("en-US", { weekday: "long" });
      }
    }

    // For one-time classes or non-premium classes, format the date normally
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleCardClick = () => {
    if (!validClassId) {
      console.error("Invalid class ID");
      return;
    }
    navigate(`/newClassDetailsUser/${validClassId}`);
  };

  const handleBookClass = (e) => {
    e.stopPropagation();

    // Check for valid classId
    if (!validClassId) {
      toast.error(
        t("exploreClassCard.errors.invalidClassId") || "Invalid class ID"
      );
      return;
    }

    // Prevent booking if date/time is not set
    if (!hasValidDateTime) {
      toast.error(
        t("exploreClassCard.errors.classDateNotSet") ||
          "Class date is not set yet"
      );
      return;
    }

    setIsBookingConfirmationOpen(true);
  };

  const handleConfirmBooking = async () => {
    if (!user) {
      setError(t("exploreClassCard.errors.loginRequired"));
      return;
    }

    // Check for valid classId
    if (!validClassId) {
      setError(t("exploreClassCard.errors.invalidClassId"));
      return;
    }

    // Double-check no booking for TBD classes
    if (!hasValidDateTime) {
      setError(t("exploreClassCard.errors.classDateNotSet"));
      return;
    }

    const success = await enrollInClass(validClassId, user.uid, adminId);

    if (success) {
      setIsBookingConfirmationOpen(false);
      setIsModalOpen(false);
      toast.success(
        t("exploreClassCard.success.classBooked") ||
          "Class booked successfully!"
      );
    }
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

  // If we don't have a valid class ID or a valid class name, don't render the card
  if (!validClassId || !className) {
    return null;
  }

  return (
    <>
      {/* Remove the max-w-sm constraint to match ClassCard */}
      <div
        className="hover:cursor-pointer"
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleCardClick(e);
          }
        }}
      >
        <div
          className={`flex flex-col ${cardHeight} ${cardWidth} border ${
            isPremium ? "border-[#14b82c]" : "border-[#ffc71f]"
          } ${
            classType === "Individual Premium" ? "bg-[#e6fde9]" : "bg-white"
          } rounded-3xl p-2`}
        >
          {/* Image Section - match aspect ratio with ClassCard */}
          <div className={`relative w-full ${imageHeight}`}>
            <img
              alt={className}
              src={imageUrl || "/images/default-class.png"}
              className="object-cover w-full h-full rounded-t-2xl rounded-b-3xl"
            />
            {isPremium && (
              <img
                src="/images/bambuu-plus-tag.png"
                alt={t("exploreClassCard.labels.bambuuPlus")}
                className="absolute w-24 h-6 sm:h-8 sm:w-28 top-2 left-2"
              />
            )}
            {/* Class Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-[#B9F9C2BF]/75 backdrop-blur-sm rounded-b-2xl p-2 space-y-1">
              <div className="flex items-center justify-between">
                <h2 className="ml-2 text-lg font-bold text-gray-800 sm:text-xl line-clamp-2">
                  {className}
                </h2>
              </div>

              <div className="flex flex-wrap items-center justify-between">
                <div className="flex items-center space-x-2">
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
                        ? t("exploreClassCard.altText.usFlag")
                        : t("exploreClassCard.altText.spainFlag")
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-[#042f0c] text-sm sm:text-base">
                    {language}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Show 1:1 badge for individual premium classes */}
                  {classType === "Individual Premium" && (
                    <span className="px-2 py-[2px] bg-[#fff885] rounded-full text-xs sm:text-sm font-medium">
                      1:1
                    </span>
                  )}

                  {languageLevel !== "None" && (
                    <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-[#fff885] rounded-full">
                      {languageLevel}
                    </span>
                  )}
                </div>
              </div>
            </div>{" "}
          </div>

          {/* Details Section - using flex-1 to fill available space with justify-between */}
          <div className="flex flex-col flex-1 w-full px-3 pt-2 pb-2 justify-between">
            <div className="flex flex-col w-full space-y-1.5">
              {/* Time and Date */}{" "}
              <div className="flex flex-row items-center justify-between w-full">
                <div className="flex items-center space-x-2">
                  <img
                    alt={t("exploreClassCard.altText.clock")}
                    src="/svgs/clock.svg"
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-[#454545]">
                    {formatTime(classDateTime)} ({classDuration}{" "}
                    {t("exploreClassCard.labels.min")})
                  </span>
                </div>{" "}
                <div className="flex items-center space-x-2">
                  <img
                    alt={t("exploreClassCard.altText.calendar")}
                    src="/svgs/calendar.svg"
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-[#454545]">
                    {formatDate(classDateTime)}
                  </span>
                </div>
              </div>
              {/* Admin and Spots */}{" "}
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
                    {adminName || t("exploreClassCard.labels.tbd")}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <img
                    alt={t("exploreClassCard.altText.users")}
                    src="/svgs/users.svg"
                    className="w-4 h-4"
                  />
                  {!isPremium && (
                    <span className="text-sm text-[#454545]">
                      {classMemberIds.length}/{availableSpots}
                    </span>
                  )}
                </div>
              </div>
            </div>{" "}
            {/* Book Class Button - moved into the flex container */}
            <div className="mt-auto pt-2">
              {isBooked ? (
                <button
                  className="w-full py-2 font-medium text-gray-500 bg-gray-200 border border-gray-400 rounded-full cursor-not-allowed"
                  disabled
                  title={t("exploreClassCard.labels.alreadyBooked")}
                >
                  {t("exploreClassCard.labels.alreadyBooked")}
                </button>
              ) : (
                <button
                  onClick={handleBookClass}
                  className="w-full py-2 font-medium text-black bg-[#00B919] rounded-full hover:bg-[#00A117] border border-black"
                  disabled={!hasValidDateTime}
                >
                  {hasValidDateTime
                    ? t("exploreClassCard.labels.bookClass")
                    : t("exploreClassCard.labels.classNotScheduled")}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

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
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-4">
            <h2 className="text-2xl font-semibold">
              {t("exploreClassCard.labels.classDetails")}
            </h2>
            <button
              onClick={() => setIsModalOpen(false)}
              className="p-2 bg-gray-200 rounded-full hover:bg-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal content... */}
          <div
            className={`${
              isPremium ? "bg-[#e6fde9]" : "bg-yellow-50"
            } px-6 pt-8 pb-6 rounded-2xl mx-4`}
          >
            {/* Profile image */}
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 mb-4">
                <img
                  src={imageUrl || "/images/panda.png"}
                  alt={className}
                  className="object-cover w-full h-full rounded-full"
                />
              </div>

              <h2 className="mb-3 text-2xl font-bold">{className}</h2>

              {/* Language badge */}
              <div className="flex items-center gap-2 mb-6">
                <div className="w-6 h-6">
                  <img
                    src="/images/panda.png"
                    alt={language}
                    className="w-full h-full rounded-full"
                  />
                </div>
                <span>{language}</span>
                <span className="px-2 py-0.5 text-sm bg-[#fff885] rounded-full">
                  {languageLevel}
                </span>
              </div>

              {/* Time, Date, Users row */}
              <div className="flex justify-center gap-8 mb-6 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(classDateTime)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(classDateTime)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>
                    {classMemberIds?.length || 0}/{availableSpots}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="mb-6 text-center text-gray-600">
                {classDescription}
              </p>

              {/* Language Group */}
              {groupId && (
                <div className="w-full">
                  <h3 className="mb-3 text-lg font-bold text-center">
                    {t("exploreClassCard.labels.languageGroup")}
                  </h3>
                  <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-[#97e3a2]">
                    <img
                      src="/images/panda.png"
                      alt={`${language} flag`}
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">
                          {t("exploreClassCard.labels.learners", { language })}
                        </span>
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
                            src={displayImage || "/images/panda.png"}
                            alt="Leader"
                            className="w-4 h-4 rounded-full"
                          />
                          <span>{displayName}</span>
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

          {/* Footer */}
          <div className="p-4">
            <button
              onClick={handleBookClass}
              className={`w-full py-3 font-medium border rounded-full ${
                hasValidDateTime
                  ? "text-black bg-[#14b82c] hover:bg-[#119924] border-[#042f0c]"
                  : "text-gray-500 bg-gray-200 border-gray-400 cursor-not-allowed"
              }`}
              disabled={!hasValidDateTime}
            >
              {hasValidDateTime
                ? t("exploreClassCard.labels.bookClass")
                : t("exploreClassCard.labels.classNotScheduled")}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isBookingConfirmationOpen}
        onRequestClose={() => setIsBookingConfirmationOpen(false)}
        className="max-w-sm p-6 mx-auto mt-40 bg-white outline-none rounded-3xl font-urbanist"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
        style={{
          content: {
            border: "none",
            padding: "24px",
            maxWidth: "420px",
          },
        }}
      >
        <div className="text-center">
          <h2 className="mb-4 text-xl font-semibold">
            {t("exploreClassCard.confirmBooking.title")}
          </h2>
          {error && <p className="mb-4 text-red-600">{error}</p>}
          <p className="mb-6 text-gray-600">
            {t("exploreClassCard.confirmBooking.description")}
          </p>
          <div className="flex flex-row gap-2">
            <button
              onClick={() => setIsBookingConfirmationOpen(false)}
              className="w-full py-2 font-medium border border-gray-300 rounded-full hover:bg-gray-50"
            >
              {t("exploreClassCard.confirmBooking.cancel")}
            </button>
            <button
              onClick={handleConfirmBooking}
              className="w-full py-2 font-medium text-black bg-[#14b82c] rounded-full hover:bg-[#119924] border border-[#042f0c]"
            >
              {isEnrolling
                ? t("exploreClassCard.confirmBooking.enrolling")
                : t("exploreClassCard.confirmBooking.confirm")}
            </button>
          </div>
        </div>
      </Modal>
      <PlansModal
        isOpen={isPlansModalOpen}
        onClose={() => setIsPlansModalOpen(false)}
      />
    </>
  );
};

export default ExploreClassCard;
