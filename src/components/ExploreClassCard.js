import React, { useState, useEffect } from "react";
import { Clock, Calendar, Users, User, X, MapPin } from "lucide-react";
import Modal from "react-modal";
import PlansModal from "./PlansModal";
import { useAuth } from "../context/AuthContext";
import { doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useClassBooking } from "../hooks/useClassBooking";

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
  selectedRecurrenceType,
}) => {
  const { user, setUser } = useAuth();
  const { enrollInClass, isEnrolling, error, setError } = useClassEnrollment();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBookingConfirmationOpen, setIsBookingConfirmationOpen] =
    useState(false);
  const [isPlansModalOpen, setIsPlansModalOpen] = useState(false);

  // Determine which user details to display based on isBammbuu flag
  const isPremium = classType === "Individual Premium";

  const displayName = isPremium ? tutorName : adminName;
  const displayImage = isPremium ? tutorImageUrl : adminImageUrl;

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
      // timeZone: "utc",
    });
  };

  const { handleClassBooking, isProcessing, iserror } = useClassBooking();

  // const handleCardClick = () => {
  //   if (selectedRecurrenceType && selectedRecurrenceType !== "None") {
  //     toast.error(
  //       "This class is currently full. Please check back later or explore other available classes.",
  //       {
  //         position: "top-right",
  //         autoClose: 3000,
  //         hideProgressBar: false,
  //         closeOnClick: true,
  //         pauseOnHover: true,
  //         draggable: true,
  //       }
  //     );
  //   } else {
  //     navigate(`/newClassDetailsUser/${classId}`);
  //     // setIsPlansModalOpen(true);
  //   }
  // };

  const handleCardClick = () => {
    navigate(`/newClassDetailsUser/${classId}`);
  };

  const handleBookClass = (e) => {
    e.stopPropagation(); // Prevent event bubbling
    setIsBookingConfirmationOpen(true);
  };

  // const handleConfirmBooking = async () => {
  //   const success = await handleClassBooking(
  //     user,
  //     classType,
  //     user.subscriptions,
  //     user.credits,
  //     () => {
  //       setIsBookingConfirmationOpen(false);
  //       toast.success("Class booked successfully!");
  //     },
  //     (error) => {
  //       toast.error(error);
  //       setIsPlansModalOpen(true);
  //     },
  //     // This is your existing enrollment logic
  //     () => enrollInClass(classId, user.uid, adminId)
  //   );
  // };

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
      <div
        className="w-full max-w-sm mx-auto hover:cursor-pointer"
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
          className={`flex flex-col h-auto border ${
            isPremium ? "border-[#14b82c]" : "border-[#ffc71f]"
          } bg-white rounded-3xl p-2 overflow-hidden`}
        >
          {/* Image Section */}
          <div className="relative w-full aspect-video">
            <img
              alt={className}
              src={imageUrl || "/images/default-class.png"}
              className="object-cover w-full h-64 rounded-t-2xl rounded-b-3xl"
            />
            {isPremium && (
              <img
                src="/images/bambuu-plus-tag.png"
                alt="Bammbuu+"
                className="absolute w-24 h-6 sm:h-8 sm:w-28 top-2 left-2"
              />
            )}

            {/* Class Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-[#B9F9C2BF]/75 backdrop-blur-sm rounded-b-2xl p-2 space-y-1">
              <div className="flex items-center justify-between">
                <h2 className="ml-2 text-lg font-bold text-gray-800 sm:text-xl line-clamp-2">
                  {className}
                </h2>
                {classType === "Individual Premium" && (
                  <span className="px-2 py-1 text-xs bg-[#fff885] rounded-full">
                    1 to 1 Class
                  </span>
                )}
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
                    alt={language === "English" ? "US Flag" : "Spain Flag"}
                    className="w-4 h-4"
                  />
                  <span className="text-[#042f0c] text-sm sm:text-base">
                    {language}
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

          {/* Details Section */}
          <div className="flex flex-col items-center justify-center w-full p-2 space-y-2">
            {/* Time and Date */}
            <div className="flex flex-wrap items-center justify-between w-full">
              <div className="flex items-center space-x-2">
                <img alt="clock" src="/svgs/clock.svg" className="w-4 h-4" />
                <span className="text-[#454545] text-sm">
                  {formatTime(classDateTime)} ({classDuration} min)
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <img
                  alt="calendar"
                  src="/svgs/calendar.svg"
                  className="w-4 h-4"
                />
                <span className="text-[#454545] text-sm">
                  {formatDate(classDateTime)}
                </span>
              </div>
            </div>

            {/* Admin and Spots */}
            <div className="flex flex-wrap items-center justify-between w-full">
              <div className="flex items-center space-x-2">
                {profileUrl ? (
                  <img
                    src={profileUrl}
                    alt={adminName}
                    className="object-cover w-5 h-5 rounded-full"
                  />
                ) : (
                  <User className="w-5 h-5 text-gray-600" />
                )}
                <span className="text-[#454545] text-sm">
                  {adminName || "TBD"}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <img alt="users" src="/svgs/users.svg" className="w-4 h-4" />
                {!isPremium && (
                  <span className="text-[#454545] text-sm">
                    {classMemberIds.length}/{availableSpots}
                  </span>
                )}
              </div>
            </div>

            {/* Book Class Button */}
            <button
              onClick={handleCardClick}
              className="w-full py-2 font-medium text-[#042F0C] border-[#042F0C] border bg-[#14b82c] rounded-full hover:bg-[#119924] transition-colors duration-200"
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
      <PlansModal
        isOpen={isPlansModalOpen}
        onClose={() => setIsPlansModalOpen(false)}
      />
    </>
  );
};

export default ExploreClassCard;
