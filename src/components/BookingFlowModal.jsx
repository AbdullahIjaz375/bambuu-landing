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
}) => {
  // Step index: 0=Start, 1=Explore, 2=Profile, 3=Slot, 4=Confirm, 5=Booked, 6=ExamPrepStart, 7=ExamClassSlots, 8=ExamConfirm, 9=ExamBooked
  const [step, setStep] = useState(initialStep);
  const [showExamPrepModal, setShowExamPrepModal] = useState(isOpen);
  const [showExploreInstructorsModal, setShowExploreInstructorsModal] =
    useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
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

  useEffect(() => {
    if (isOpen) {
      // If mode is 'exam', always start at step 6
      const startStep = mode === "exam" ? 6 : initialStep;
      setStep(startStep);
      setShowExamPrepModal(true);
      setShowExploreInstructorsModal(false);
      setSelectedInstructor(null);
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
              const year = dateObj.getUTCFullYear();
              const month = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
              const day = String(dateObj.getUTCDate()).padStart(2, "0");
              const dateKey = `${year}-${month}-${day}`;
              const timeStr = dateObj
                .toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                  timeZone: "UTC",
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
            const year = dateObj.getUTCFullYear();
            const month = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
            const day = String(dateObj.getUTCDate()).padStart(2, "0");
            const dateKey = `${year}-${month}-${day}`;
            const timeStr = dateObj
              .toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
                timeZone: "UTC",
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
      const d = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));
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
          const year = dateObj.getUTCFullYear();
          const month = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
          const day = String(dateObj.getUTCDate()).padStart(2, "0");
          const dateKey = `${year}-${month}-${day}`;
          const timeStr = dateObj
            .toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
              timeZone: "UTC",
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
        const d = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));
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
  // Stepper rendering
  if (step === 0) {
    return (
      <StartExamPrep
        showExamPrepModal={showExamPrepModal}
        setShowExamPrepModal={setShowExamPrepModal}
        onFindTutor={handleFindTutor}
      />
    );
  }
  if (step === 1) {
    return (
      <ExploreInstructors
        showExploreInstructorsModal={showExploreInstructorsModal}
        setShowExploreInstructorsModal={setShowExploreInstructorsModal}
        onInstructorSelect={handleInstructorSelect}
      />
    );
  }
  if (step === 2) {
    return (
      <InstructorProfile
        selectedInstructor={selectedInstructor}
        setSelectedInstructor={setSelectedInstructor}
        onBookIntroCall={handleBookIntroCall}
      />
    );
  }
  if (step === 3) {
    return (
      <SlotPickerModal
        isOpen={showSlotPicker}
        onClose={() => setShowSlotPicker(false)}
        onSlotPicked={handleSlotPicked}
        slots={introCallSlots}
        loading={loadingSlots}
      />
    );
  }
  if (step === 4) {
    return (
      <ExamBookingConfirmation
        showConfirm={showBookingConfirmation}
        setShowConfirm={setShowBookingConfirmation}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        onConfirm={handleBookingConfirmed}
        tutor={confirmedInstructor}
        loading={bookingLoading}
      />
    );
  }
  if (step === 5) {
    return (
      <IntroductoryCallBooked
        bookExamClass={showBookedModal}
        setBookExamClass={setShowBookedModal}
        onClose={handleBookedModalClose}
      />
    );
  }
  // Exam prep flow
  if (step === 6) {
    return (
      <IntoductoryCallDone
        bookExamClass={showExamPrepStart}
        setBookExamClass={setShowExamPrepStart}
        onBookExamPreparation={async () => {
          setLoadingExamPrepSlots(true);
          try {
            const data = await getExamPrepClassSlots(confirmedInstructor.uid);
            const slotMap = {};
            (data.examPrepSlots || []).forEach((slotDay) => {
              (slotDay.times || []).forEach((slot) => {
                if (!slot.time || slot.booked) return;
                const dateObj = new Date(slot.time);
                if (isNaN(dateObj.getTime())) return;
                const year = dateObj.getUTCFullYear();
                const month = String(dateObj.getUTCMonth() + 1).padStart(
                  2,
                  "0",
                );
                const day = String(dateObj.getUTCDate()).padStart(2, "0");
                const dateKey = `${year}-${month}-${day}`;
                const timeStr = dateObj
                  .toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                    timeZone: "UTC",
                  })
                  .replace(/^0/, "");
                if (!slotMap[dateKey]) slotMap[dateKey] = [];
                slotMap[dateKey].push(timeStr);
              });
            });
            setExamPrepSlots(slotMap);

            setShowExamPrepStart(false);
            setShowExamClassSlots(true);
            setStep(7);
          } catch (err) {
            setExamPrepSlots({});
          } finally {
            setLoadingExamPrepSlots(false);
          }
        }}
        loadingSlots={loadingExamPrepSlots}
        slotsLoaded={Object.keys(examPrepSlots).length > 0}
      />
    );
  }
  if (step === 7) {
    return (
      <ExamClassSlots
        isOpen={showExamClassSlots}
        onClose={() => setShowExamClassSlots(false)}
        onBookingComplete={handleExamClassSlotsComplete}
        slots={examPrepSlots}
        loading={loadingExamPrepSlots}
        user={user}
        tutorId={confirmedInstructor?.uid}
      />
    );
  }
  if (step === 8) {
    return (
      <ConfirmClassesModal
        isOpen={showExamConfirm}
        onClose={() => setShowExamConfirm(false)}
        onConfirm={handleExamConfirmComplete}
        selectedDates={selectedExamPrepDates}
        selectedTimes={selectedExamPrepTimes}
        tutorId={confirmedInstructor?.uid}
        user={user}
        loading={bookingExamPrep}
        // Pass other required props as needed
      />
    );
  }
  if (step === 9) {
    return (
      <ClassesBooked isOpen={showExamBooked} onClose={handleExamBookedClose} />
    );
  }
  return null;
};

export default BookingFlowModal;
