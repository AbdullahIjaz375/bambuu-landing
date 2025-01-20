import { ArrowLeft } from "lucide-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
const TutorDeleteAccout = () => {
  const { t } = useTranslation();
  const [selectedReason, setSelectedReason] = useState("");
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const feedbackOptions = [
    t("feedback.betterAlternative"),
    t("feedback.technicalIssues"),
    t("feedback.notUsingEnough"),
    t("feedback.pricingHigh"),
    t("feedback.other"),
  ];

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <>
      <div className="flex h-screen bg-white">
        <div className="flex-shrink-0 w-64 h-full">
          <Sidebar user={user} />
        </div>

        <div className="flex-1 overflow-x-auto min-w-[calc(100%-16rem)] h-full">
          <div className="h-[calc(100vh-1rem)] p-8 bg-white border-2 border-[#e7e7e7] rounded-3xl m-2 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b">
              <div className="flex items-center gap-4">
                <button
                  className="flex-shrink-0 p-3 transition-colors bg-gray-100 rounded-full hover:bg-gray-200"
                  onClick={handleBack}
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-4xl font-semibold whitespace-nowrap">
                  Delete Account
                </h1>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="max-w-xl ">
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
                  <button className="w-full py-3 font-medium text-white bg-red-500 rounded-full hover:bg-red-600">
                    {t("settings.deleteModal.confirm")}
                  </button>
                </div>
                <p className="mt-4 text-sm text-center text-gray-500">
                  {t("settings.deleteModal.warning")}
                </p>
              </div>{" "}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TutorDeleteAccout;
