import React, { useState } from "react";
import { ArrowLeft, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const LanguagesUser = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const students = Array(12).fill(null);

  const handleBack = () => {
    navigate(-1);
  };

  const languageCards = [
    {
      id: "spanish",
      bgColor: "bg-[#fff0f1]",
      borderColor: "border-[#d58287]",
      imgSrc: "/svgs/spain-big.svg",
      alt: "Spanish",
      title: t("learnUser.languageLearning.languages.spanish"),
      path: "/learnLanguageUser?language=Spanish",
    },
    {
      id: "english",
      bgColor: "bg-[#edf2ff]",
      borderColor: "border-[#768bbd]",
      imgSrc: "/svgs/us-big.svg",
      alt: "English",
      title: t("learnUser.languageLearning.languages.english"),
      path: "/learnLanguageUser?language=English",
    },
    {
      id: "exchange",
      bgColor: "bg-[#FFFFEA]",
      borderColor: "border-[#FFED46]",
      imgSrc: "/svgs/eng-spanish.svg",
      alt: "English-Spanish Exchange",
      title: t("learnUser.languageLearning.languages.exchange"),
      path: "/learnLanguageUser?language=English-Spanish Exchange",
    },
  ];

  return (
    <div className="flex h-screen bg-white">
      <div className="flex-shrink-0 w-64 h-full">
        <Sidebar user={user} />
      </div>

      <div className="flex-1 overflow-x-auto min-w-[calc(100%-16rem)] h-full">
        <div className="h-[calc(100vh-1rem)] p-8 bg-white border-2 border-[#e7e7e7] rounded-3xl m-2 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col justify-between gap-4 pb-4 mb-6 border-b sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <button
                className="flex-shrink-0 p-3 transition-colors bg-gray-100 rounded-full hover:bg-gray-200"
                onClick={handleBack}
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-4xl font-semibold whitespace-nowrap">
                {t("learnLanguage.title")}
              </h1>
            </div>
          </div>

          {/* Content - Grid Layout */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {languageCards.map((card) => (
              <div
                key={card.id}
                onClick={() => navigate(card.path)}
                className={`flex items-center gap-6 p-6 ${card.bgColor} rounded-3xl border ${card.borderColor} cursor-pointer`}
              >
                <div className="flex-shrink-0 w-16 h-16 overflow-hidden rounded-full">
                  <img
                    src={card.imgSrc}
                    alt={card.alt}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="flex flex-col items-start justify-between space-y-2">
                  <span className="text-xl font-bold whitespace-nowrap">
                    {card.title}
                  </span>
                  <div className="flex items-center">
                    <div className="flex -space-x-3">
                      {students.map((_, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-center w-8 h-8 bg-white border-2 border-white rounded-full"
                        >
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguagesUser;
