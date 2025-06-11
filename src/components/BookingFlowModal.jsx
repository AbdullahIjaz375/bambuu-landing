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
  selectedInstructor,
  setSelectedInstructor,
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
  const [examPrepTutor, setExamPrepTutor] = useState(null);
  const [bookingExamPrep, setBookingExamPrep] = useState(false);
  const [currentApiStep, setCurrentApiStep] = useState(null);
  const [stepperLoading, setStepperLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // If mode is 'exam', always start at step 6
      const startStep = mode === "exam" ? 6 : initialStep;
      setStep(startStep);
      setShowExamPrepModal(true);
      setShowExploreInstructorsModal(false);
      // setSelectedInstructor(null);
      setConfirmedInstructor(null);
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
      setExamPrepTutor(null);
      setBookingExamPrep(false);
      if (mode === "exam" && startStep === 6) {
        setShowExamPrepStart(true);
      }
    }
  }, [isOpen, initialStep, mode]);

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
              const timeStr = dateObj
                .toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })
                .replace(/^0/, "");
              if (!slotMap[dateKey]) slotMap[dateKey] = [];
              slotMap[dateKey].push(timeStr);
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
        setStepperLoading(true);
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
          setStepperLoading(false);
        }
      }
    }
    fetchCurrentStep();
  }, [isOpen, user?.uid]);

  // Stepper labels for the first 7 steps
  const stepLabels = [
    "Start",
    "Explore",
    "Profile",
    "Slot",
    "Confirm",
    "Booked",
    "Exam Prep Start",
  ];

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
    }
  };
  const handleBookedModalClose = () => {
    setShowBookedModal(false);
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
    setShowExamPrepStart(false);
    setShowExamClassSlots(true);
    setStep(7);
    if (!confirmedInstructor?.uid) {
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
          const timeStr = dateObj
            .toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
            .replace(/^0/, "");
          if (!slotMap[dateKey]) slotMap[dateKey] = [];
          slotMap[dateKey].push(timeStr);
        });
      });
      setExamPrepSlots(slotMap);

      setShowExamClassSlots(true);
      setStep(7);
    } catch (err) {
      setExamPrepSlots({});
    } finally {
      setLoadingExamPrepSlots(false);
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
    setBookingExamPrep(true);
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
    } catch (err) {
      alert("Booking failed: " + (err.message || err));
    } finally {
      setBookingExamPrep(false);
    }
  };
  const handleExamBookedClose = () => {
    setShowExamBooked(false);
    if (onComplete) onComplete();
    if (onClose) onClose();
  };
  // --- Render logic ---

  if (!isOpen) return null;

  // Stepper UI (only for steps 0-6)
  const showStepper = step >= 0 && step <= 6;

  return (
    <>
      {/* Stepper hidden */}
      {/* {showStepper && (
        <div className="mb-6 flex items-center justify-center">
          {stepLabels.map((label, idx) => {
            let status = "upcoming";
            if (currentApiStep !== null) {
              if (idx < currentApiStep) status = "completed";
              else if (idx === currentApiStep) status = "current";
            }
            return (
              <div key={label} className="flex items-center">
                <div
                  className={`mx-2 flex flex-col items-center ${
                    status === "completed"
                      ? "text-green-600"
                      : status === "current"
                        ? "font-bold text-blue-600"
                        : "text-gray-400"
                  }`}
                >
                  <div
                    className={`mb-1 flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                      status === "completed"
                        ? "border-green-600 bg-green-500 text-white"
                        : status === "current"
                          ? "border-blue-600 bg-blue-100"
                          : "border-gray-300 bg-gray-100"
                    }`}
                  >
                    {status === "completed" ? <span>&#10003;</span> : idx + 1}
                  </div>
                  <span className="w-16 text-center text-xs">{label}</span>
                </div>
                {idx < stepLabels.length - 1 && (
                  <div className="mx-1 h-1 w-8 rounded-full bg-gray-300" />
                )}
              </div>
            );
          })}
          {stepperLoading && (
            <span className="ml-4 text-xs text-gray-400">
              Loading progress...
            </span>
          )}
        </div>
      )} */}
      {/* Step content rendering logic restored below */}
      {step === 0 && (
        <StartExamPrep
          showExamPrepModal={showExamPrepModal}
          setShowExamPrepModal={setShowExamPrepModal}
          onFindTutor={handleFindTutor}
          currentApiStep={currentApiStep}
        />
      )}
      {step === 1 && (
        <ExploreInstructors
          showExploreInstructorsModal={showExploreInstructorsModal}
          setShowExploreInstructorsModal={setShowExploreInstructorsModal}
          onInstructorSelect={handleInstructorSelect}
        />
      )}
      {step === 2 && (
        <InstructorProfile
          selectedInstructor={selectedInstructor}
          setSelectedInstructor={setSelectedInstructor}
          onBookIntroCall={handleBookIntroCall}
        />
      )}
      {step === 3 && (
        <SlotPickerModal
          isOpen={showSlotPicker}
          onClose={() => setShowSlotPicker(false)}
          onSlotPicked={handleSlotPicked}
          slots={introCallSlots}
          loading={loadingSlots}
        />
      )}
      {step === 4 && (
        <ExamBookingConfirmation
          showConfirm={showBookingConfirmation}
          setShowConfirm={setShowBookingConfirmation}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          onConfirm={handleBookingConfirmed}
          tutor={confirmedInstructor}
          loading={bookingLoading}
        />
      )}
      {step === 5 && (
        <IntroductoryCallBooked
          bookExamClass={showBookedModal}
          setBookExamClass={setShowBookedModal}
          onClose={handleBookedModalClose}
        />
      )}
      {step === 6 && (
        <IntoductoryCallDone
          bookExamClass={showExamPrepStart}
          setBookExamClass={setShowExamPrepStart}
          onBookExamPreparation={handleExamPrepStart}
          loadingSlots={loadingExamPrepSlots}
          slotsLoaded={Object.keys(examPrepSlots).length > 0}
        />
      )}
      {step === 7 && (
        <ExamClassSlots
          isOpen={showExamClassSlots}
          onClose={() => setShowExamClassSlots(false)}
          onBookingComplete={handleExamClassSlotsComplete}
          slots={examPrepSlots}
          loading={loadingExamPrepSlots}
          user={user}
          tutorId={confirmedInstructor?.uid}
        />
      )}
      {step === 8 && (
        <ConfirmClassesModal
          isOpen={showExamConfirm}
          onClose={() => setShowExamConfirm(false)}
          onConfirm={handleExamConfirmComplete}
          selectedDates={selectedExamPrepDates}
          selectedTimes={selectedExamPrepTimes}
          tutorId={confirmedInstructor?.uid}
          user={user}
          loading={bookingExamPrep}
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
