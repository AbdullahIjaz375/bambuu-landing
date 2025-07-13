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
      path: "/learnLanguageUser?language=English-Spanish",
      firestoreLanguage: "English-Spanish",
    },
  ];

  // Fetch classes and student data
  useEffect(() => {
    const fetchClassesAndStudents = async () => {
      try {
        setLoading(true);
        const classesSnapshot = await getDocs(collection(db, "classes"));
        const groupsSnapshot = await getDocs(collection(db, "groups"));

        const tempLanguageData = {
          spanish: { studentIds: new Set(), studentPhotos: [] },
          english: { studentIds: new Set(), studentPhotos: [] },
          exchange: { studentIds: new Set(), studentPhotos: [] },
        };

        // Aggregate student IDs by language from classes
        for (const classDoc of classesSnapshot.docs) {
          const classData = classDoc.data();
          const language = classData.language;
          const classMemberIds = classData.classMemberIds || [];

          if (language === "Spanish") {
            classMemberIds.forEach((id) =>
              tempLanguageData.spanish.studentIds.add(id),
            );
          } else if (language === "English") {
            classMemberIds.forEach((id) =>
              tempLanguageData.english.studentIds.add(id),
            );
          } else if (language === "English-Spanish") {
            classMemberIds.forEach((id) =>
              tempLanguageData.exchange.studentIds.add(id),
            );
          }
        }

        // Add students from groups based on language too
        for (const groupDoc of groupsSnapshot.docs) {
          const groupData = groupDoc.data();
          const language = groupData.groupLearningLanguage;
          const groupMemberIds = groupData.groupMemberIds || [];

          if (language === "Spanish") {
            groupMemberIds.forEach((id) =>
              tempLanguageData.spanish.studentIds.add(id),
            );
          } else if (language === "English") {
            groupMemberIds.forEach((id) =>
              tempLanguageData.english.studentIds.add(id),
            );
          } else if (language === "English-Spanish") {
            groupMemberIds.forEach((id) =>
              tempLanguageData.exchange.studentIds.add(id),
            );
          }
        }

        // Convert Sets to Arrays for easier handling
        tempLanguageData.spanish.studentIds = Array.from(
          tempLanguageData.spanish.studentIds,
        );
        tempLanguageData.english.studentIds = Array.from(
          tempLanguageData.english.studentIds,
        );
        tempLanguageData.exchange.studentIds = Array.from(
          tempLanguageData.exchange.studentIds,
        );

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
          tempLanguageData[langKey].studentPhotos =
            await Promise.all(photoPromises);
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
      <div className="h-full w-[272px] flex-shrink-0 p-4">
        <Sidebar user={user} />
      </div>

      <div className="min-w-[calc(100% - 272px)] h-[calc(100vh-0px)] flex-1 overflow-x-auto p-4 pl-0">
        <div className="h-[calc(100vh-32px)] overflow-y-auto rounded-3xl border border-[#e7e7e7] bg-white p-[16px]">
          {/* Header */}
          <div className="mb-6 flex flex-col justify-between gap-4 border-b pb-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <button
                className="flex-shrink-0 rounded-full bg-gray-100 p-3 transition-colors hover:bg-gray-200"
                onClick={handleBack}
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <h1 className="whitespace-nowrap text-4xl font-semibold">
                {t("learnLanguage.title")}
              </h1>
            </div>
          </div>

          {/* Content - Grid Layout */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {languageCards.map((card) => {
              // Maximum number of profile photos to display
              const MAX_DISPLAY_PHOTOS = 8;

              const students = languageData[card.id].studentPhotos.slice(
                0,
                MAX_DISPLAY_PHOTOS,
              );
              const studentCount = languageData[card.id].studentIds.length;
              // Only show additional count (beyond what's displayed in photos)
              const additionalStudents = Math.max(
                0,
                studentCount - students.length,
              );

              return (
                <div
                  key={card.id}
                  onClick={() => navigate(card.path)}
                  className={`flex items-center gap-6 p-6 ${card.bgColor} rounded-3xl border ${card.borderColor} cursor-pointer`}
                >
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full">
                    <img
                      src={card.imgSrc}
                      alt={card.alt}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col items-start justify-between space-y-2">
                    <span className="whitespace-nowrap text-xl font-bold">
                      {card.title}
                    </span>
                    <div className="flex items-center">
                      <div className="relative flex">
                        {students.length > 0 ? (
                          <>
                            {students.map((photo, i) => (
                              <div
                                key={i}
                                className="-mr-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-white"
                                style={{ zIndex: students.length - i }}
                              >
                                {photo ? (
                                  <img
                                    src={photo}
                                    alt={`Student ${i + 1}`}
                                    className="h-full w-full rounded-full object-cover"
                                  />
                                ) : (
                                  <img
                                    src={"/images/panda.png"}
                                    alt={`Student ${i + 1}`}
                                    className="h-full w-full rounded-full object-cover opacity-75"
                                  />
                                )}
                              </div>
                            ))}

                            {/* Only show the count badge if there are MORE users than shown in the photos */}
                            {additionalStudents > 0 && (
                              <div className="ml-2 flex items-center justify-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                                +
                                {additionalStudents > 999
                                  ? `${Math.floor(additionalStudents / 1000)}k`
                                  : additionalStudents}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center justify-center text-xs font-medium text-gray-600">
                            {studentCount > 0 ? (
                              <div className="flex items-center justify-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                                {studentCount}{" "}
                                {studentCount === 1 ? "user" : "users"}
                              </div>
                            ) : (
                              <div className="flex items-center justify-center text-xs font-medium text-gray-600">
                                No users yet
                              </div>
                            )}
                          </div>
                        )}
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
