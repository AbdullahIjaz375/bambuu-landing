import { useState, useEffect } from "react";
import StartExamPrep from "../pages/user/StartExamPrep";
import ExploreInstructors from "../pages/user/ExploreInstructors";
import InstructorProfile from "../pages/user/InstructorProfile";
import SlotPickerModal from "../pages/user/SlotPickerModal";
import ExamBookingConfirmation from "../pages/user/ExamBookingConfirmation";
import IntroductoryCallBooked from "../pages/user/IntroductoryCallBooked";
// Exam Prep modals
import IntoductoryCallDone from "../pages/user/ExamPreparation/IntoductoryCallDone";
import ExamClassSlots from "../pages/user/ExamPreparation/ExamClassSlots";
import ConfirmClassesModal from "../pages/user/ExamPreparation/ConfirmClassesModal";
import ClassesBooked from "../pages/user/ExamPreparation/ClassesBooked";
import { ClipLoader } from "react-spinners";
import {
  getIntroCallSlots,
  bookIntroductoryCall,
  getExamPrepClassSlots,
  bookExamPrepClass,
  getStudentClasses,
  getExamPrepCurrentStep,
} from "../api/examPrepApi";

/**
 * BookingFlowModal - Unified booking flow for intro call and exam prep classes
 * Props:
 *   isOpen: boolean - controls visibility
 *   onClose: function - called when flow is closed or completed
 *   user: user object
 *   mode: 'intro' | 'exam' (default: 'intro')
 *   initialStep: number (optional)
 *   onComplete: function (optional)
 */
const BookingFlowModal = ({
  isOpen,
  onClose,
  user,
  mode = "intro",
  initialStep = 0,
  onComplete,
  onBookingComplete,
  selectedInstructor,
  setSelectedInstructor = () => {},
}) => {
  // Step index: 0=Start, 1=Explore, 2=Profile, 3=Slot, 4=Confirm, 5=Booked, 6=ExamPrepStart, 7=ExamClassSlots, 8=ExamConfirm, 9=ExamBooked
  const [step, setStep] = useState(initialStep);
  const [showExamPrepModal, setShowExamPrepModal] = useState(isOpen);
  const [showExploreInstructorsModal, setShowExploreInstructorsModal] =
    useState(false);
  // const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [confirmedInstructor, setConfirmedInstructor] = useState(null);
  const [showSlotPicker, setShowSlotPicker] = useState(false);
  const [introCallSlots, setIntroCallSlots] = useState({});
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [showBookingConfirmation, setShowBookingConfirmation] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showBookedModal, setShowBookedModal] = useState(false);
  // Exam prep state
  const [showExamPrepStart, setShowExamPrepStart] = useState(false);
  const [showExamClassSlots, setShowExamClassSlots] = useState(false);
  const [showExamConfirm, setShowExamConfirm] = useState(false);
  const [showExamBooked, setShowExamBooked] = useState(false);
  // Exam prep slots state
  const [examPrepSlots, setExamPrepSlots] = useState({});
  const [loadingExamPrepSlots, setLoadingExamPrepSlots] = useState(false);
  const [selectedExamPrepDates, setSelectedExamPrepDates] = useState([]);
  const [selectedExamPrepTimes, setSelectedExamPrepTimes] = useState({});
  const [currentApiStep, setCurrentApiStep] = useState(null);
  // Add a global loading state
  const [globalLoading, setGlobalLoading] = useState(false);

  const handleRemoveExamClass = (dateToRemove) => {
    setSelectedExamPrepDates((prevDates) =>
      prevDates.filter((date) => date !== dateToRemove),
    );
    setSelectedExamPrepTimes((prevTimes) => {
      const newTimes = { ...prevTimes };
      delete newTimes[dateToRemove];
      return newTimes;
    });
  };

  useEffect(() => {
    if (isOpen) {
      // Use initialStep if provided, otherwise default to 6 for exam mode
      const startStep =
        typeof initialStep === "number" ? initialStep : mode === "exam" ? 6 : 0;
      setStep(startStep);
      setShowExamPrepModal(true);
      setShowExploreInstructorsModal(false);
      // Only reset confirmedInstructor if not in exam prep step 6 with a known tutor
      if (
        !(mode === "exam" && startStep === 6 && user?.completedIntroCallTutorId)
      ) {
        setConfirmedInstructor(null);
      } else {
        setConfirmedInstructor({ uid: user.completedIntroCallTutorId });
      }
      setShowSlotPicker(false);
      setIntroCallSlots({});
      setLoadingSlots(false);
      setSelectedDate(null);
      setSelectedTime(null);
      setShowBookingConfirmation(false);
      setBookingLoading(false);
      setShowBookedModal(false);
      setShowExamPrepStart(false);
      setShowExamClassSlots(false);
      setShowExamConfirm(false);
      setShowExamBooked(false);
      setExamPrepSlots({});
      setLoadingExamPrepSlots(false);
      setSelectedExamPrepDates([]);
      setSelectedExamPrepTimes({});
      if (mode === "exam" && startStep === 6) {
        setShowExamPrepStart(true);
      }
    }
  }, [isOpen, initialStep, mode, user?.completedIntroCallTutorId]);

  useEffect(() => {
    async function fetchLastIntroCallTutor() {
      if (mode === "exam" && isOpen && !confirmedInstructor && user?.uid) {
        // Use completedIntroCallTutorId if available
        if (user.completedIntroCallTutorId) {
          setConfirmedInstructor({ uid: user.completedIntroCallTutorId });

          return;
        }
        // Fallback: fetch from getStudentClasses

        try {
          const res = await getStudentClasses(user.uid);
          const introCallClasses = (res.classes || []).filter(
            (cls) =>
              cls.classType &&
              cls.classType.toLowerCase().includes("intro") &&
              cls.tutorId,
          );

          introCallClasses.sort((a, b) => {
            const aTime = new Date(a.classDateTime || a.time || 0).getTime();
            const bTime = new Date(b.classDateTime || b.time || 0).getTime();
            return bTime - aTime;
          });
          if (introCallClasses.length > 0) {
            setConfirmedInstructor({ uid: introCallClasses[0].tutorId });
          } else {
            console.log("[BookingFlowModal] No intro call classes found");
          }
        } catch (err) {
          console.log(
            "[BookingFlowModal] Error fetching intro call tutor:",
            err,
          );
        }
      }
    }
    fetchLastIntroCallTutor();
  }, [
    mode,
    isOpen,
    confirmedInstructor,
    user?.uid,
    user?.completedIntroCallTutorId,
  ]);

  // Add a useEffect to fetch exam prep slots when step 6 is reached and confirmedInstructor is set
  useEffect(() => {
    if (step === 6 && confirmedInstructor?.uid && mode === "exam") {
      setLoadingExamPrepSlots(true);
      getExamPrepClassSlots(confirmedInstructor.uid)
        .then((data) => {
          const slotMap = {};
          (data.examPrepSlots || []).forEach((slotDay) => {
            (slotDay.times || []).forEach((slot) => {
              if (!slot.time || slot.booked) return;
              const dateObj = new Date(slot.time);
              if (isNaN(dateObj.getTime())) return;
              const year = dateObj.getFullYear();
              const month = String(dateObj.getMonth() + 1).padStart(2, "0");
              const day = String(dateObj.getDate()).padStart(2, "0");
              const dateKey = `${year}-${month}-${day}`;
              const display = dateObj
                .toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })
                .replace(/^0/, "");
              if (!slotMap[dateKey]) slotMap[dateKey] = [];
              slotMap[dateKey].push({ display, utc: slot.time });
            });
          });
          setExamPrepSlots(slotMap);

          setShowExamClassSlots(true);
          setStep(7);
        })
        .catch((err) => {
          setExamPrepSlots({});
        })
        .finally(() => {
          setLoadingExamPrepSlots(false);
        });
    }
  }, [step, confirmedInstructor, mode]);

  // Fetch current step from API when modal opens
  useEffect(() => {
    async function fetchCurrentStep() {
      if (isOpen && user?.uid) {
        try {
          const res = await getExamPrepCurrentStep(user.uid);
          if (res && typeof res.step === "number") {
            setCurrentApiStep(res.step);
          } else {
            setCurrentApiStep(0);
          }
        } catch (err) {
          setCurrentApiStep(0);
        } finally {
        }
      }
    }
    fetchCurrentStep();
  }, [isOpen, user?.uid]);

  // --- Handlers for intro call flow ---
  const handleFindTutor = () => {
    setShowExamPrepModal(false);
    setShowExploreInstructorsModal(true);
    setStep(1);
  };
  const handleInstructorSelect = (instructor) => {
    setSelectedInstructor(instructor);
    setShowExploreInstructorsModal(false);
    setStep(2);
  };
  const handleBookIntroCall = async () => {
    if (!selectedInstructor?.uid) return;
    setGlobalLoading(true);
    setLoadingSlots(true);
    setShowSlotPicker(true);
    setConfirmedInstructor(selectedInstructor);
    setSelectedInstructor(null);
    setStep(3);
    try {
      // Fetch available slots from backend
      const data = await getIntroCallSlots(selectedInstructor.uid);
      // Flatten and format the slots for the modal
      const slotMap = {};
      (data.introductoryCallSlots || []).forEach((slotDay) => {
        slotDay.times.forEach((slot) => {
          if (!slot.booked) {
            const dateObj = new Date(slot.time);
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, "0");
            const day = String(dateObj.getDate()).padStart(2, "0");
            const dateKey = `${year}-${month}-${day}`;
            const timeStr = dateObj
              .toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })
              .replace(/^0/, "");
            if (!slotMap[dateKey]) slotMap[dateKey] = [];
            slotMap[dateKey].push(timeStr);
          }
        });
      });
      setIntroCallSlots(slotMap);
    } catch (err) {
      setIntroCallSlots({});
    } finally {
      setLoadingSlots(false);
      setGlobalLoading(false);
    }
  };
  const handleSlotPicked = (date, time) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setShowSlotPicker(false);
    setShowBookingConfirmation(true);
    setStep(4);
  };
  const handleBookingConfirmed = async () => {
    setGlobalLoading(true);
    setBookingLoading(true);
    try {
      if (
        !user?.uid ||
        !confirmedInstructor?.uid ||
        !selectedDate ||
        !selectedTime
      ) {
        throw new Error("Missing required booking information");
      }
      const [year, month, day] = selectedDate.split("-").map(Number);
      let [h, m] = selectedTime.split(":");
      m = m.slice(0, 2);
      let hour = parseInt(h, 10);
      let minute = parseInt(m, 10);
      const isPM = selectedTime.toLowerCase().includes("pm");
      if (isPM && hour !== 12) hour += 12;
      if (!isPM && hour === 12) hour = 0;
      const d = new Date(year, month - 1, day, hour, minute, 0, 0);
      const slotISO = d.toISOString();
      await bookIntroductoryCall({
        studentId: user.uid,
        tutorId: confirmedInstructor.uid,
        slot: { time: slotISO },
      });
      setShowBookingConfirmation(false);
      setShowBookedModal(true);
      setStep(5);
    } catch (err) {
      alert("Booking failed: " + (err.message || err));
    } finally {
      setBookingLoading(false);
      setGlobalLoading(false);
    }
  };
  const handleBookedModalClose = () => {
    setShowBookedModal(false);
    if (onBookingComplete) onBookingComplete();
    if (mode === "intro") {
      // Just close the modal, do NOT start exam prep flow
      if (onClose) onClose();
      if (onComplete) onComplete();
    } else {
      if (onComplete) onComplete();
      if (onClose) onClose();
    }
  };
  // --- Handlers for exam prep flow ---
  const handleExamPrepStart = async () => {
    setGlobalLoading(true);
    setShowExamPrepStart(false);
    setShowExamClassSlots(true);
    setStep(7);
    if (!confirmedInstructor?.uid) {
      setGlobalLoading(false);
      return;
    }
    setLoadingExamPrepSlots(true);
    try {
      const data = await getExamPrepClassSlots(confirmedInstructor.uid);
      const slotMap = {};
      (data.examPrepSlots || []).forEach((slotDay) => {
        (slotDay.times || []).forEach((slot) => {
          if (!slot.time || slot.booked) return;
          const dateObj = new Date(slot.time);
          if (isNaN(dateObj.getTime())) return;
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, "0");
          const day = String(dateObj.getDate()).padStart(2, "0");
          const dateKey = `${year}-${month}-${day}`;
          const display = dateObj
            .toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
            .replace(/^0/, "");
          if (!slotMap[dateKey]) slotMap[dateKey] = [];
          slotMap[dateKey].push({ display, utc: slot.time });
        });
      });
      setExamPrepSlots(slotMap);

      setShowExamClassSlots(true);
      setStep(7);
    } catch (err) {
      setExamPrepSlots({});
    } finally {
      setLoadingExamPrepSlots(false);
      setGlobalLoading(false);
    }
  };
  const handleExamClassSlotsComplete = (dates, times) => {
    setShowExamClassSlots(false);
    setSelectedExamPrepDates(dates);
    setSelectedExamPrepTimes(times);
    setShowExamConfirm(true);
    setStep(8);
  };
  const handleExamConfirmComplete = async () => {
    setGlobalLoading(true);
    try {
      if (
        !user?.uid ||
        !confirmedInstructor?.uid ||
        !selectedExamPrepDates.length
      ) {
        throw new Error("Missing required booking information");
      }
      // Build slots array: [{ time: ISOString }]
      const slots = selectedExamPrepDates.map((date) => {
        const timeStr = selectedExamPrepTimes[date];
        const [year, month, day] = date.split("-").map(Number);
        let [h, m] = timeStr.split(":");
        m = m.slice(0, 2);
        let hour = parseInt(h, 10);
        let minute = parseInt(m, 10);
        const isPM = timeStr.toLowerCase().includes("pm");
        if (isPM && hour !== 12) hour += 12;
        if (!isPM && hour === 12) hour = 0;
        const d = new Date(year, month - 1, day, hour, minute, 0, 0);
        return { time: d.toISOString() };
      });
      const resp = await bookExamPrepClass({
        studentId: user.uid,
        tutorId: confirmedInstructor.uid,
        slots,
      });
      setShowExamConfirm(false);
      setShowExamBooked(true);
      setStep(9);
      if (onBookingComplete) onBookingComplete();
    } catch (err) {
      alert("Booking failed: " + (err.message || err));
    } finally {
      setGlobalLoading(false);
    }
  };
  const handleExamBookedClose = () => {
    setShowExamBooked(false);
    if (onBookingComplete) onBookingComplete();
    if (onComplete) onComplete();
    if (onClose) onClose();
  };

  useEffect(() => {
    if (!isOpen) setStep(initialStep);
  }, [isOpen, initialStep]);

  // --- Render logic ---

  if (!isOpen) return null;

  return (
    <>
      {/* Modal overlay and content wrapper */}
      {/* <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-lg rounded-3xl bg-white font-['Urbanist'] shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        > */}
      {/* Global Loading Overlay */}
      {/* {globalLoading && step < 8 && (
            <div className="absolute inset-0 z-50 flex items-center justify-center rounded-3xl bg-white bg-opacity-80">
              <div className="flex flex-col items-center">
                <ClipLoader color="#14B82C" size={50} />
                <p className="mt-4 text-lg font-medium text-[#042F0C]">
                  Loading...
                </p>
              </div>
            </div>
          )} */}

      {/* Step content rendering logic restored below */}
      {step === 0 && (
        <StartExamPrep
          isOpen={isOpen}
          onClose={() => {
            setStep(initialStep);
            onClose();
          }}
          showExamPrepModal={showExamPrepModal}
          setShowExamPrepModal={setShowExamPrepModal}
          onFindTutor={handleFindTutor}
          currentApiStep={currentApiStep}
        />
      )}
      {step === 1 && (
        <ExploreInstructors
          isOpen={isOpen}
          onClose={() => {
            setStep(initialStep);
            onClose();
          }}
          showExploreInstructorsModal={showExploreInstructorsModal}
          setShowExploreInstructorsModal={setShowExploreInstructorsModal}
          onInstructorSelect={handleInstructorSelect}
        />
      )}
      {step === 2 && (
        <InstructorProfile
          isOpen={isOpen}
          onClose={() => {
            setStep(initialStep);
            onClose();
          }}
          onBookExamPreparation={handleExamPrepStart}
          selectedInstructor={selectedInstructor}
          setSelectedInstructor={setSelectedInstructor}
          onBookIntroCall={handleBookIntroCall}
        />
      )}
      {step === 3 && (
        <SlotPickerModal
          // isOpen={showSlotPicker}
          // onClose={() => setShowSlotPicker(false)}
          isOpen={isOpen}
          onClose={onClose}
          onSlotPicked={handleSlotPicked}
          slots={introCallSlots}
          loading={loadingSlots}
        />
      )}
      {step === 4 && (
        <ExamBookingConfirmation
          isOpen={isOpen}
          onClose={() => {
            setStep(initialStep);
            onClose();
          }}
          onBack={() => setStep(3)}
          showConfirm={showBookingConfirmation}
          setShowConfirm={setShowBookingConfirmation}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          onConfirm={handleBookingConfirmed}
          tutor={confirmedInstructor}
          loading={bookingLoading}
          type={mode === "intro" ? "intro" : "exam"}
        />
      )}
      {step === 5 && (
        <IntroductoryCallBooked
          isOpen={isOpen}
          onClose={() => {
            setStep(initialStep);
            onClose();
          }}
          bookExamClass={showBookedModal}
          setBookExamClass={setShowBookedModal}
          // onClose={handleBookedModalClose}
        />
      )}
      {step === 6 && (
        <IntoductoryCallDone
          isOpen={isOpen}
          onClose={() => {
            setStep(initialStep);
            onClose();
          }}
          bookExamClass={showExamPrepStart}
          setBookExamClass={setShowExamPrepStart}
          onBookExamPreparation={handleExamPrepStart}
          loadingSlots={loadingExamPrepSlots}
          slotsLoaded={Object.keys(examPrepSlots).length > 0}
        />
      )}
      {step === 7 && (
        <ExamClassSlots
          isOpen={isOpen}
          onClose={() => {
            setStep(initialStep);
            onClose();
          }}
          // isOpen={showExamClassSlots}
          // onClose={() => setShowExamClassSlots(false)}
          onBookingComplete={handleExamClassSlotsComplete}
          slots={examPrepSlots}
          loading={loadingExamPrepSlots}
          user={user}
          tutorId={confirmedInstructor?.uid}
        />
      )}
      {step === 8 && (
        <ConfirmClassesModal
          isOpen={isOpen}
          onClose={() => {
            setStep(initialStep);
            onClose();
          }}
          // isOpen={showExamConfirm}
          // onClose={() => setShowExamConfirm(false)}
          onBack={() => {
            setShowExamClassSlots(true);
            setStep(7);
          }}
          onConfirm={handleExamConfirmComplete}
          selectedDates={
            Array.isArray(selectedExamPrepDates)
              ? selectedExamPrepDates
              : selectedExamPrepDates
                ? [selectedExamPrepDates]
                : []
          }
          selectedTimes={selectedExamPrepTimes}
          tutorId={confirmedInstructor?.uid}
          user={user}
          onRemoveClass={handleRemoveExamClass}
          // loading={bookingExamPrep}
        />
      )}
      {step === 9 && (
        <ClassesBooked
          isOpen={showExamBooked}
          onClose={handleExamBookedClose}
        />
      )}
    </>
  );
};

export default BookingFlowModal;
