import React, { useState, useEffect } from "react";
import { ArrowLeft, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebaseConfig";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

const LanguagesUser = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [languageData, setLanguageData] = useState({
    spanish: { studentIds: [], studentPhotos: [] },
    english: { studentIds: [], studentPhotos: [] },
    exchange: { studentIds: [], studentPhotos: [] },
  });
  const [loading, setLoading] = useState(true);

  // Define language cards with mappings to Firestore language values
  const languageCards = [
    {
      id: "spanish",
      bgColor: "bg-[#fff0f1]",
      borderColor: "border-[#d58287]",
      imgSrc: "/svgs/spain-big.svg",
      alt: "Spanish",
      title: t("learnUser.languageLearning.languages.spanish"),
      path: "/learnLanguageUser?language=Spanish",
      firestoreLanguage: "Spanish",
    },
    {
      id: "english",
      bgColor: "bg-[#edf2ff]",
      borderColor: "border-[#768bbd]",
      imgSrc: "/svgs/us-big.svg",
      alt: "English",
      title: t("learnUser.languageLearning.languages.english"),
      path: "/learnLanguageUser?language=English",
      firestoreLanguage: "English",
    },
    {
      id: "exchange",
      bgColor: "bg-[#FFFFEA]",
      borderColor: "border-[#FFED46]",
      imgSrc: "/svgs/eng-spanish.svg",
      alt: "English-Spanish Exchange",
      title: t("learnUser.languageLearning.languages.exchange"),
      path: "/learnLanguageUser?language=English-Spanish Exchange",
      firestoreLanguage: "English-Spanish",
    },
  ];

  // Fetch classes and student data
  useEffect(() => {
    const fetchClassesAndStudents = async () => {
      try {
        setLoading(true);
        const classesSnapshot = await getDocs(collection(db, "classes"));
        const tempLanguageData = {
          spanish: { studentIds: new Set(), studentPhotos: [] },
          english: { studentIds: new Set(), studentPhotos: [] },
          exchange: { studentIds: new Set(), studentPhotos: [] },
        };

        // Aggregate student IDs by language
        for (const classDoc of classesSnapshot.docs) {
          const classData = classDoc.data();
          const language = classData.language;
          const classMemberIds = classData.classMemberIds || [];

          if (language === "Spanish") {
            classMemberIds.forEach((id) => tempLanguageData.spanish.studentIds.add(id));
          } else if (language === "English") {
            classMemberIds.forEach((id) => tempLanguageData.english.studentIds.add(id));
          } else if (language === "English-Spanish") {
            classMemberIds.forEach((id) => tempLanguageData.exchange.studentIds.add(id));
          }
        }

        // Convert Sets to Arrays for easier handling
        tempLanguageData.spanish.studentIds = Array.from(tempLanguageData.spanish.studentIds);
        tempLanguageData.english.studentIds = Array.from(tempLanguageData.english.studentIds);
        tempLanguageData.exchange.studentIds = Array.from(tempLanguageData.exchange.studentIds);

        // Fetch student profile pictures (limit to 12 per language for display)
        for (const langKey of ["spanish", "english", "exchange"]) {
          const studentIds = tempLanguageData[langKey].studentIds.slice(0, 12);
          const photoPromises = studentIds.map(async (studentId) => {
            const studentRef = doc(db, "students", studentId);
            const studentDoc = await getDoc(studentRef);
            if (studentDoc.exists()) {
              const studentData = studentDoc.data();
              return studentData.photoUrl || "";
            }
            return "";
          });
          tempLanguageData[langKey].studentPhotos = await Promise.all(photoPromises);
        }

        setLanguageData(tempLanguageData);
      } catch (error) {
        console.error("Error fetching classes or students:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClassesAndStudents();
  }, []);

  const handleBack = () => {
    navigate(-1);
  };

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
            {languageCards.map((card) => {
              const students = languageData[card.id].studentPhotos.slice(0, 8);
              const studentCount = languageData[card.id].studentIds.length;

              return (
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
                      <div className="flex relative">
                        {students.length > 0 ? (
                          students.map((photo, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-center w-8 h-8 bg-white border-2 border-white rounded-full -mr-2"
                              style={{ zIndex: students.length - i }}
                            >
                              {photo ? (
                                <img
                                  src={photo}
                                  alt={`Student ${i + 1}`}
                                  className="object-cover w-full h-full rounded-full"
                                />
                              ) : (
                                <User className="w-5 h-5 text-gray-600" />
                              )}
                            </div>
                          ))
                        ) : (
                          Array(6)
                            .fill(null)
                            .map((_, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-center w-8 h-8 bg-white border-2 border-white rounded-full -mr-2"
                                style={{ zIndex: 6 - i }}
                              >
                                <User className="w-5 h-5 text-gray-600" />
                              </div>
                            ))
                        )}
                        
                        {/* User count badge */}
                        <div className="flex items-center justify-center ml-2 text-xs font-medium text-green-800 bg-green-100 rounded-full px-2 py-1">
                          +{studentCount > 999 ? `${Math.floor(studentCount/1000)}k` : studentCount}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguagesUser;