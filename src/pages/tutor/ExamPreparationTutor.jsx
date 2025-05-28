import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { ClipLoader } from "react-spinners";
import Modal from "react-modal";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import ClassCardTutor from "../../components-tutor/ClassCardTutor";
import CalendarTutor from "../../components/CalendarTutor";
import TimeSlotModal from "./TimeSlotModal";
import SuccessModal from "./SuccessModal";

const dummyClasses = Array.from({ length: 8 }).map((_, i) => ({
  classId: `${i + 1}`,
  className: "Exam Prep Class",
  language: "English",
  languageLevel: "None",
  classDateTime: { seconds: 1734710400 }, // 20 DEC 2024, 16:00 UTC
  classDuration: 120,
  adminId: "admin1",
  adminName: "Mike Jhones",
  adminImageUrl: "/images/panda.png",
  classMemberIds: ["u1", "u2"],
  availableSpots: 10,
  imageUrl: "/images/exam-prep-green.png",
  classDescription: "Exam Preparation",
  classAddress: "Online",
  groupId: "",
  recurrenceType: "None",
  selectedRecurrenceType: "None",
  recurrenceTypes: [],
  //   classType: "Group Premium",
  classLocation: "Online",
}));

const ExamPreparationTutor = () => {
  const { t } = useTranslation();

  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [availibilityModal, setAvailibilityModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedDates, setSelectedDates] = useState([]);
  const [activeTab, setActiveTab] = useState(
    t("exam-prep.tabs.exam-prep-classes"),
  );

  const handleCalendarNext = (dates) => {
    setSelectedDates(dates);
    setAvailibilityModal(false);
    setShowTimeModal(true);
  };

  const handleTimeSlotClose = (action) => {
    setShowTimeModal(false);
    if (action === "back") {
      setAvailibilityModal(true);
    }
  };

  const handleTimeSlotNext = () => {
    setShowTimeModal(false);
    setShowSuccessModal(true);
  };

  //   if (loading) {
  //     return (
  //       <div className="flex min-h-screen bg-white">
  //         <Sidebar user={user} />
  //         <div className="flex items-center justify-center flex-1">
  //           <ClipLoader color="#FFB800" size={40} />
  //         </div>
  //       </div>
  //     );
  //   }

  return (
    <div className="flex h-screen bg-white">
      <div className="h-full w-64 flex-shrink-0">
        <Sidebar user={user} />
      </div>
      <div className="m-2 flex-1 overflow-auto rounded-3xl border-2 border-[#e7e7e7] bg-white px-6 pt-4">
        <div className="sticky top-0 z-10 bg-white">
          <div className="mb-6 flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-medium">{t("exam-prep.title")}</h1>
            </div>
          </div>
          <div className="flex flex-row items-center justify-between pb-4 pt-4">
            <div className="relative inline-flex w-[440px] rounded-full border border-[#888888] bg-white p-1">
              <div
                className="absolute left-0 top-0 h-full rounded-full border border-[#042F0C] bg-[#FFBF00] transition-all duration-300 ease-in-out"
                style={{
                  transform: `translateX(${
                    activeTab === t("exam-prep.tabs.exam-prep-classes")
                      ? "0"
                      : "100%"
                  })`,
                  width: "50%",
                }}
              />
              <button
                onClick={() =>
                  setActiveTab(t("exam-prep.tabs.exam-prep-classes"))
                }
                className="z-1 text-md relative flex h-10 w-1/2 items-center justify-center whitespace-nowrap rounded-full font-medium text-[#042F0C] transition-colors"
              >
                {t("exam-prep.tabs.exam-prep-classes")}
              </button>
              <button
                onClick={() =>
                  setActiveTab(t("exam-prep.tabs.introductory-calls"))
                }
                className="z-1 text-md relative flex h-10 w-1/2 items-center justify-center whitespace-nowrap rounded-full font-medium text-[#042F0C] transition-colors"
              >
                {t("exam-prep.tabs.introductory-calls")}
              </button>
            </div>
            <button
              onClick={() => setAvailibilityModal(true)}
              className="flex w-full items-center justify-center rounded-full border border-[#5D5D5D] bg-[#14b82c] px-3 py-2 text-lg font-semibold text-[#042f0c] sm:w-auto sm:justify-start"
            >
              {t("exam-prep.manage-availability")}
            </button>
          </div>
          <div className="relative mt-2 w-full">
            <div className="grid grid-cols-1 gap-6 pb-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {dummyClasses.map((classData) => (
                <ClassCardTutor
                  key={classData.classId}
                  {...classData}
                  examPrep
                />
              ))}
            </div>
          </div>
        </div>
        <div />
      </div>
      {availibilityModal && (
        <Modal
          isOpen={availibilityModal}
          onRequestClose={() => setAvailibilityModal(false)}
          className="fixed left-1/2 top-1/2 z-[1001] flex h-[600px] w-[430px] -translate-x-1/2 -translate-y-1/2 transform flex-col rounded-[32px] bg-white p-4 font-urbanist shadow-lg md:p-6"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-[1000]"
        >
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Choose up to 60 Days</h2>
            <button onClick={() => setAvailibilityModal(false)}>
              <X className="h-6 w-6 text-gray-500 hover:text-gray-700" />
            </button>
          </div>

          <CalendarTutor onNext={handleCalendarNext} />
        </Modal>
      )}

      {showTimeModal && (
        <Modal
          isOpen={showTimeModal}
          onRequestClose={() => setShowTimeModal(false)}
          className="fixed left-1/2 top-1/2 z-[1001] flex h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 transform flex-col rounded-[32px] bg-white p-4 font-urbanist shadow-lg md:p-6"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-[1000]"
        >
          <TimeSlotModal
            selectedDates={selectedDates}
            onClose={handleTimeSlotClose}
            onNext={handleTimeSlotNext}
          />
        </Modal>
      )}

      {showSuccessModal && (
        <Modal
          isOpen={showSuccessModal}
          onRequestClose={() => setShowSuccessModal(false)}
          className="fixed left-1/2 top-1/2 z-[1001] flex h-[400px] w-[500px] -translate-x-1/2 -translate-y-1/2 transform flex-col rounded-[32px] bg-white p-4 font-urbanist shadow-lg md:p-6"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-[1000]"
        >
          <SuccessModal onDone={() => setShowSuccessModal(false)} />
        </Modal>
      )}
    </div>
  );
};

export default ExamPreparationTutor;
