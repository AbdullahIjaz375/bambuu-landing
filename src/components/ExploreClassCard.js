import React, { useState } from "react";
import { Clock, Calendar, Users, User, X, MapPin } from "lucide-react";
import Modal from "react-modal";

import { useAuth } from "../context/AuthContext";
import { doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
Modal.setAppElement("#root");

const useClassEnrollment = () => {
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [error, setError] = useState(null);
  const { user, setUser } = useAuth();

  // Helper function to update session storage
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
    setIsEnrolling(true);
    setError(null);
    console.log(classId, userId, tutorId);
    try {
      // Get references to both documents
      const classRef = doc(db, "classes", classId);
      const userRef = doc(db, "students", userId);
      const tutorRef = doc(db, "tutors", tutorId);

      // Get the current class document to check available spots
      const classDoc = await getDoc(classRef);
      const classData = classDoc.data();

      if (!classData) {
        throw new Error("Class not found");
      }

      // Check if class is full
      if (classData.classMemberIds?.length >= classData.availableSpots) {
        throw new Error("Class is full");
      }

      // Update both documents in parallel
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
  };
};

const ExploreClassCard = ({
  classId,
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
  recurrenceType,
}) => {
  const { user, setUser } = useAuth();
  const { enrollInClass, isEnrolling, error, setError } = useClassEnrollment();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBookingConfirmationOpen, setIsBookingConfirmationOpen] =
    useState(false);

  // Determine which user details to display based on isBammbuu flag
  const isPremium =
    classType === "Individual Premium" || classType === "Group Premium";

  const displayName = isPremium ? tutorName : adminName;
  const displayImage = isPremium ? tutorImageUrl : adminImageUrl;
  const displayId = isPremium ? tutorId : adminId;

  const formatTime = (timestamp) => {
    if (!timestamp) return "TBD";
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "TBD";
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleCardClick = () => {
    navigate(`/newClassDetailsUser/${classId}`);
  };

  const handleBookClass = (e) => {
    e.stopPropagation(); // Prevent event bubbling
    setIsBookingConfirmationOpen(true);
  };

  const handleConfirmBooking = async () => {
    if (!user) {
      setError("Please log in to enroll in classes");
      return;
    }

    const success = await enrollInClass(classId, user.uid, adminId);

    if (success) {
      setIsBookingConfirmationOpen(false);
      setIsModalOpen(false);
      // You might want to show a success toast or message here
    }
  };

  return (
    <>
      <div
        className="transition-transform transform cursor-pointer w-80 hover:scale-105"
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
          className={`flex flex-col items-center justify-center  bg-white rounded-3xl p-2 ${
            isPremium ? "border border-[#14b82c]" : "border border-[#f2a105]"
          }`}
        >
          <div className="relative w-full">
            <img
              alt={className}
              src={imageUrl || "/images/default-class.png"}
              className="object-cover w-full h-48 rounded-t-2xl"
            />
            {isPremium && (
              <img
                src="/images/bambuu-plus-tag.png"
                alt="Bammbuu+"
                className="absolute h-8 w-28 top-2 left-2"
              />
            )}
          </div>

          <div className="w-full space-y-2 bg-[#c3f3c9] rounded-b-3xl p-2">
            <div className="flex items-start justify-between">
              <span className="px-4 py-1 text-sm bg-[#14b82c] text-white rounded-full">
                {physicalClass ? "Physical" : "Online"}
              </span>
              {recurrenceType && (
                <span className="px-4 py-1 text-sm bg-[#14b82c] text-white rounded-full">
                  {recurrenceType}
                </span>
              )}
            </div>

            <h2 className="text-xl font-bold text-gray-800">{className}</h2>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="flex items-center">
                  <span className="ml-2 text-[#042f0c]">{language}</span>
                </span>
              </div>
              <span className="px-3 py-1 text-sm bg-[#fff885] rounded-full">
                {languageLevel}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center w-full p-2 space-y-2">
            <div className="flex flex-row items-center justify-between w-full">
              <div className="flex flex-row items-center justify-center space-x-2">
                <Clock className="w-5 h-5 text-gray-600" />
                <span className="text-[#454545] text-md">
                  {formatTime(classDateTime)} ({classDuration} min)
                </span>
              </div>
              <div className="flex flex-row items-center justify-center space-x-2">
                <Calendar className="w-5 h-5 text-gray-600" />
                <span className="text-[#454545] text-md">
                  {formatDate(classDateTime)}
                </span>
              </div>
            </div>
            <div className="flex flex-row items-center justify-between w-full">
              <div className="flex flex-row items-center justify-center space-x-2">
                <User className="w-5 h-5 text-gray-600" />
                <span className="text-[#454545] text-md">
                  {tutorName || adminName || "TBD"}
                </span>
              </div>
              <div className="flex flex-row items-center justify-center space-x-2">
                <Users className="w-5 h-5 text-gray-600" />
                <span className="text-[#454545] text-md">
                  {classMemberIds?.length || 0}/{availableSpots}
                </span>
              </div>
            </div>
            <button
              onClick={handleCardClick}
              className="w-full py-2 font-medium text-black bg-[#14b82c] rounded-full hover:bg-[#119924] border border-[#042f0c]"
            >
              Book Class
            </button>
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
            <h2 className="text-2xl font-semibold">Class Details</h2>
            <button
              onClick={() => setIsModalOpen(false)}
              className="p-2 bg-gray-200 rounded-full hover:bg-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main content with yellow background */}
          <div
            className={`${
              isPremium ? "bg-[#e6fde9]" : "bg-yellow-50"
            } px-6 pt-8 pb-6 rounded-2xl mx-4`}
          >
            {/* Profile image */}
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 mb-4">
                <img
                  src={imageUrl || "/api/placeholder/96/96"}
                  alt={className}
                  className="object-cover w-full h-full rounded-full"
                />
              </div>

              <h2 className="mb-3 text-2xl font-bold">{className}</h2>

              {/* Language badge */}
              <div className="flex items-center gap-2 mb-6">
                <div className="w-6 h-6">
                  <img
                    src="/api/placeholder/24/24"
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
                    Language Group
                  </h3>
                  <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-[#97e3a2]">
                    <img
                      src="/api/placeholder/48/48"
                      alt={`${language} flag`}
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{`${language} Learners`}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <img
                          src="/api/placeholder/16/16"
                          alt={language}
                          className="w-4 h-4 rounded-full"
                        />
                        <span>{language}</span>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <img
                            src={displayImage || "/api/placeholder/16/16"}
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
              className="w-full py-3 font-medium text-black bg-[#14b82c] rounded-full hover:bg-[#119924] border border-[#042f0c]"
            >
              Book Class
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
            maxWidth: "420px", // max-w-sm
          },
        }}
      >
        <div className="text-center">
          <h2 className="mb-4 text-xl font-semibold">
            Are you sure you want to book this class?
          </h2>
          {error && <p className="mb-4 text-red-600">{error}</p>}
          <p className="mb-6 text-gray-600">
            By booking class you will be added in the group and you'll be able
            to join the class 5 minutes before it starts. It will also be added
            to your calendar.
          </p>
          <div className="flex flex-row gap-2">
            <button
              onClick={() => setIsBookingConfirmationOpen(false)}
              className="w-full py-2 font-medium border border-gray-300 rounded-full hover:bg-gray-50"
            >
              No, Cancel
            </button>
            <button
              onClick={handleConfirmBooking}
              className="w-full py-2 font-medium text-black bg-[#14b82c] rounded-full hover:bg-[#119924] border border-[#042f0c]"
            >
              {isEnrolling ? "Enrolling..." : "Yes, Book Now"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ExploreClassCard;
