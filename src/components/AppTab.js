// import React, { useState } from "react";
// import Modal from "react-modal";
// import { ChevronLeft } from "lucide-react";
// import { ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";

// Modal.setAppElement("#root");

// const AppTab = () => {
//   const [isDeleteUserModalOpen, setIsDeleteModalOpen] = useState(false);
//   const [selectedReason, setSelectedReason] = useState("");

//   const feedbackOptions = [
//     "I found a better alternative",
//     "I'm having technical issues",
//     "I'm not using this app enough",
//     "Pricing is too high",
//     "Other",
//   ];

//   return (
//     <>
//       <ToastContainer />

//       <div className="max-w-2xl space-y-4">
//         <div className="flex items-center justify-between p-4 text-lg bg-white border border-gray-200 rounded-full">
//           <div className="flex items-center gap-3">
//             <img alt="bambuu" src="/svgs/translate.svg" className="w-6 h-6" />
//             <span>App Language</span>
//           </div>
//           <div className="flex items-center gap-2">
//             <span>ENG</span>
//             <ChevronLeft className="w-5 h-5 rotate-180" />
//           </div>
//         </div>

//         <div
//           className="flex items-center justify-between p-4 text-lg bg-white border border-[#F04438] rounded-full cursor-pointer"
//           onClick={() => setIsDeleteModalOpen(true)}
//         >
//           <div className="flex items-center gap-3 text-[#F04438]">
//             <img alt="bambuu" src="/svgs/user-remove.svg" className="w-6 h-6" />
//             <span>Delete Account</span>
//           </div>
//           <ChevronLeft className="w-5 h-5 rotate-180 text-[#F04438]" />
//         </div>
//       </div>

//       <Modal
//         isOpen={isDeleteUserModalOpen}
//         onRequestClose={() => setIsDeleteModalOpen(false)}
//         contentLabel="Delete Account Modal"
//         className="fixed w-full max-w-md p-6 transform -translate-x-1/2 -translate-y-1/2 bg-white outline-none font-urbanist top-1/2 left-1/2 rounded-3xl"
//         overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-[1000]"
//       >
//         <div className="flex flex-col items-center">
//           <img alt="mbammbuu" src="/svgs/delete-user.svg" />
//           <h2 className="mb-2 text-2xl font-semibold">
//             We're Sad to See You Go!
//           </h2>
//           <p className="mb-6 text-center text-gray-600">
//             Before you leave, we'd love to understand why. Your feedback helps
//             us improve! Could you share a reason?
//           </p>
//         </div>
//         <div className="flex flex-col items-start justify-start mb-6 space-y-3">
//           {feedbackOptions.map((option) => (
//             <button
//               key={option}
//               onClick={() => setSelectedReason(option)}
//               className={` px-3 py-2 text-left rounded-full transition-colors
//                   ${
//                     selectedReason === option
//                       ? "bg-gray-100 border-2 border-gray-300"
//                       : "border border-gray-200 hover:bg-gray-50"
//                   }`}
//             >
//               <span className="text-gray-700">{option}</span>
//             </button>
//           ))}
//         </div>
//         <div className="flex flex-row gap-2">
//           <button
//             onClick={() => setIsDeleteModalOpen(false)}
//             className="w-full py-3 font-medium border border-gray-300 rounded-full hover:bg-gray-50"
//           >
//             Cancel
//           </button>
//           <button className="w-full py-3 font-medium text-white bg-red-500 rounded-full hover:bg-red-600">
//             Delete Account
//           </button>
//         </div>

//         <p className="mt-4 text-sm text-center text-gray-500">
//           It's an irreversible action.
//         </p>
//       </Modal>
//     </>
//   );
// };

// export default AppTab;

import React, { useState, useContext, useEffect } from "react";
import Modal from "react-modal";
import { ChevronLeft } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getFirestore, doc, updateDoc, getDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import "../i18n";

Modal.setAppElement("#root");

const AppTab = () => {
  const [isDeleteUserModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const { user, setUser } = useAuth();
  const { t, i18n } = useTranslation();

  // Update i18n language when user preference changes
  useEffect(() => {
    if (user?.languagePreference) {
      i18n.changeLanguage(user.languagePreference);
    }
  }, [user?.languagePreference, i18n]);

  const feedbackOptions = [
    t("feedback.betterAlternative"),
    t("feedback.technicalIssues"),
    t("feedback.notUsingEnough"),
    t("feedback.pricingHigh"),
    t("feedback.other"),
  ];

  const handleLanguageChange = async (newLanguage) => {
    try {
      const db = getFirestore();

      if (!user?.uid) {
        toast.error(t("toast.userNotFound"));
        return;
      }
      // Try to find user in students collection first
      const studentRef = doc(db, "students", user.uid);
      const studentDoc = await getDoc(studentRef);

      // If user exists in students collection, update there
      if (studentDoc.exists()) {
        await updateDoc(studentRef, {
          languagePreference: newLanguage,
        });
      } else {
        // If not in students, try tutors collection
        const tutorRef = doc(db, "tutors", user.uid);
        const tutorDoc = await getDoc(tutorRef);

        if (tutorDoc.exists()) {
          await updateDoc(tutorRef, {
            languagePreference: newLanguage,
          });
        } else {
          // User not found in either collection
          throw new Error("User not found in any collection");
        }
      }

      setUser({
        ...user,
        languagePreference: newLanguage,
      });

      // Update session storage
      const sessionUser = JSON.parse(sessionStorage.getItem("user") || "{}");
      sessionStorage.setItem(
        "user",
        JSON.stringify({
          ...sessionUser,
          languagePreference: newLanguage,
        })
      );

      setIsLanguageModalOpen(false);
      toast.success(t("toast.languageUpdated"));
    } catch (error) {
      console.error("Error updating language:", error);
      toast.error(t("toast.languageError"));
    }
  };

  return (
    <>
      <ToastContainer />

      <div className="max-w-2xl space-y-4">
        <div
          className="flex items-center justify-between p-4 text-lg bg-white border border-gray-200 rounded-full cursor-pointer"
          onClick={() => setIsLanguageModalOpen(true)}
        >
          <div className="flex items-center gap-3">
            <img alt="bambuu" src="/svgs/translate.svg" className="w-6 h-6" />
            <span>{t("settings.appLanguage")}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>{user?.languagePreference?.toUpperCase() || "EN"}</span>
            <ChevronLeft className="w-5 h-5 rotate-180" />
          </div>
        </div>

        <div
          className="flex items-center justify-between p-4 text-lg bg-white border border-[#F04438] rounded-full cursor-pointer"
          onClick={() => setIsDeleteModalOpen(true)}
        >
          <div className="flex items-center gap-3 text-[#F04438]">
            <img alt="bambuu" src="/svgs/user-remove.svg" className="w-6 h-6" />
            <span>{t("settings.deleteAccount")}</span>
          </div>
          <ChevronLeft className="w-5 h-5 rotate-180 text-[#F04438]" />
        </div>
      </div>

      {/* Language Selection Modal */}
      <Modal
        isOpen={isLanguageModalOpen}
        onRequestClose={() => setIsLanguageModalOpen(false)}
        contentLabel="Language Selection Modal"
        className="fixed w-full max-w-md p-6 transform -translate-x-1/2 -translate-y-1/2 bg-white outline-none font-urbanist top-1/2 left-1/2 rounded-3xl"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-[1000]"
      >
        <div className="flex flex-col items-center">
          <img
            alt="language"
            src="/svgs/translate.svg"
            className="w-16 h-16 mb-4"
          />
          <h2 className="mb-2 text-2xl font-semibold">
            {t("settings.languageModal.title")}
          </h2>
          <p className="mb-6 text-center text-gray-600">
            {t("settings.languageModal.description")}
          </p>
        </div>
        <div className="flex flex-col items-start justify-start mb-6 space-y-3">
          <button
            onClick={() => handleLanguageChange("en")}
            className={`w-full px-3 py-2 text-black text-left rounded-full transition-colors
              ${
                user?.languagePreference === "en"
                  ? "bg-[#FFBF00] border border-black"
                  : "border border-gray-200 hover:bg-gray-50"
              }`}
          >
            <span className="">{t("settings.languageModal.english")}</span>
          </button>
          <button
            onClick={() => handleLanguageChange("es")}
            className={`w-full px-3 py-2 text-black text-left rounded-full transition-colors
              ${
                user?.languagePreference === "es"
                  ? "bg-[#FFBF00] border border-black"
                  : "border border-gray-200 hover:bg-gray-50"
              }`}
          >
            <span className="">{t("settings.languageModal.spanish")}</span>
          </button>
        </div>
        <button
          onClick={() => setIsLanguageModalOpen(false)}
          className="w-full py-3 font-medium border border-gray-300 rounded-full hover:bg-gray-50"
        >
          {t("settings.languageModal.cancel")}
        </button>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        isOpen={isDeleteUserModalOpen}
        onRequestClose={() => setIsDeleteModalOpen(false)}
        contentLabel="Delete Account Modal"
        className="fixed w-full max-w-md p-6 transform -translate-x-1/2 -translate-y-1/2 bg-white outline-none font-urbanist top-1/2 left-1/2 rounded-3xl"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-[1000]"
      >
        <div className="flex flex-col items-center">
          <img alt="delete" src="/svgs/delete-user.svg" />
          <h2 className="mb-2 text-2xl font-semibold">
            {t("settings.deleteModal.title")}
          </h2>
          <p className="mb-6 text-center text-gray-600">
            {t("settings.deleteModal.description")}
          </p>
        </div>
        <div className="flex flex-col items-start justify-start mb-6 space-y-3">
          {feedbackOptions.map((option) => (
            <button
              key={option}
              onClick={() => setSelectedReason(option)}
              className={`w-full px-3 py-2 text-left rounded-full transition-colors
                ${
                  selectedReason === option
                    ? "bg-gray-100 border-2 border-gray-300"
                    : "border border-gray-200 hover:bg-gray-50"
                }`}
            >
              <span className="text-gray-700">{option}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-row gap-2">
          <button
            onClick={() => setIsDeleteModalOpen(false)}
            className="w-full py-3 font-medium border border-gray-300 rounded-full hover:bg-gray-50"
          >
            {t("settings.deleteModal.cancel")}
          </button>
          <button className="w-full py-3 font-medium text-white bg-red-500 rounded-full hover:bg-red-600">
            {t("settings.deleteModal.confirm")}
          </button>
        </div>
        <p className="mt-4 text-sm text-center text-gray-500">
          {t("settings.deleteModal.warning")}
        </p>
      </Modal>
    </>
  );
};

export default AppTab;
