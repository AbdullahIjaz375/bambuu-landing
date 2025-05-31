import React, { useState } from "react";
import { X } from "lucide-react";
import Modal from "react-modal";
import SlotPickerModal from "./SlotPickerModal";

const InstructorProfile = ({ selectedInstructor, setSelectedInstructor }) => {
  const [showSlotPicker, setShowSlotPicker] = useState(false);

  if (!selectedInstructor) return null;

  return (
    <>
      <Modal
        isOpen={!!selectedInstructor && !showSlotPicker}
        onRequestClose={() => setSelectedInstructor(null)}
        className="fixed left-1/2 top-1/2 flex w-[468px] max-w-[95vw] -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-[2.5rem] border border-blue-200 bg-white p-0 font-urbanist shadow-xl outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-20 z-50 flex items-center justify-center backdrop-blur-sm"
        ariaHideApp={false}
      >
        <div className="relative flex w-full items-center justify-between px-6 pb-1 pt-4">
          <span className="text-2xl font-medium text-black">
            Exam Preparation Package
          </span>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F6F6F6] hover:bg-[#ededed]"
            onClick={() => setSelectedInstructor(null)}
          >
            <X className="h-6 w-6 text-[#3D3D3D]" />
          </button>
        </div>
        {/* Main Card */}
        <div className="mx-6 my-6 flex w-[calc(100%-3rem)] flex-1 flex-col items-center rounded-[2rem] bg-[#E6FDE9] px-6 py-5">
          <img
            src={selectedInstructor.img}
            alt={selectedInstructor.name}
            className="mb-2 mt-1 h-24 w-24 rounded-full border-4 border-white object-cover shadow"
          />
          <div className="mb-1 text-center text-xl font-semibold">
            {selectedInstructor.name}
          </div>
          <div className="my-2 text-center text-sm text-[#042F0C]">
            Experienced English tutor and native Spanish speaker with a deep
            commitment to student success. Specializes in making English
            accessible, enjoyable, and practical for learners of all levels.
            Passionate about fostering confidence and fluency in students
            through personalized lessons.
          </div>
          <div className="mb-3 flex w-full justify-between text-sm">
            <div>
              <div className="flex items-center gap-1">
                <span className="font-medium">
                  <img
                    src="/svgs/language.svg"
                    alt="language"
                    className="inline-block"
                  />{" "}
                  Native:
                </span>
                <span>
                  {selectedInstructor.langs[0]?.replace("(Native)", "").trim()}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium">
                  <img
                    src="/svgs/language.svg"
                    alt="language"
                    className="inline-block"
                  />{" "}
                  Teaching:
                </span>
                <span>
                  {selectedInstructor.langs[1]
                    ?.replace("(Teaching)", "")
                    .trim()}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1">
                <img
                  src="/svgs/location.svg"
                  alt="location"
                  className="inline-block"
                />
                <span>From: {selectedInstructor.country}</span>
              </div>
              <div className="flex items-center gap-1">
                <img
                  src="/svgs/users.svg"
                  alt="students"
                  className="inline-block"
                />
                <span>Students: {selectedInstructor.students}</span>
              </div>
            </div>
          </div>
          {/* Video Section */}
          <div className="mb-4 min-h-[176px] w-full rounded-2xl border border-dashed bg-white py-10 text-center text-[#D1D1D1]">
            Video Section
          </div>
          {/* Buttons */}
          <button className="mb-2 w-full rounded-full border border-[#D7D7D7] bg-[#FFFDEB] py-3 text-base font-medium transition hover:bg-[#f7f7e6]">
            Send Message
          </button>
        </div>
        <div className="mx-6 my-6 w-[calc(100%-3rem)]">
          <button
            onClick={() => setShowSlotPicker(true)}
            className="w-full rounded-full border border-[#042F0C] bg-[#14B82C] py-3 text-base font-medium text-black transition hover:bg-[#129e25]"
          >
            Book Introductory Call
          </button>
        </div>
      </Modal>
      <SlotPickerModal
        isOpen={showSlotPicker}
        onClose={() => setShowSlotPicker(false)}
      />
    </>
  );
};

export default InstructorProfile;
