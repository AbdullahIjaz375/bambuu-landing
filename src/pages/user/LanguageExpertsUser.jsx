import React, { useEffect, useState, useMemo } from "react";
import { Search, MapPin, Users } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../../components/Sidebar";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useNavigate } from "react-router-dom";
import { ClipLoader } from "react-spinners";
import EmptyState from "../../components/EmptyState";
import { useTranslation } from "react-i18next";

const LanguageExpertsPage = () => {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState(
    t("languageExperts.filters.all")
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [allTutors, setAllTutors] = useState([]);
  const [featuredTutorIds, setFeaturedTutorIds] = useState(new Set());
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Define filters with translations
  const filters = [
    { key: "all", label: t("languageExperts.filters.all") },
    { key: "english", label: t("languageExperts.filters.english") },
    { key: "spanish", label: t("languageExperts.filters.spanish") },
  ];

  useEffect(() => {
    const fetchTutors = async () => {
      try {
        setLoading(true);
        const featuredSnapshot = await getDocs(
          collection(db, "featured_tutors")
        );
        const featuredIds = new Set(
          featuredSnapshot.docs.map((doc) => doc.data().tutorId)
        );
        setFeaturedTutorIds(featuredIds);

        const tutorsSnapshot = await getDocs(collection(db, "tutors"));
        const tutorsData = tutorsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setAllTutors(tutorsData);
      } catch (error) {
        console.error("Error fetching tutors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTutors();
  }, []);

  const filteredTutors = useMemo(() => {
    return allTutors.filter((tutor) => {
      const matchesFilter =
        activeFilter === t("languageExperts.filters.all") ||
        tutor.teachingLanguage === activeFilter;
      const matchesSearch =
        !searchQuery ||
        tutor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tutor.bio?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [allTutors, activeFilter, searchQuery, t]);

  const { featuredTutors, regularTutors } = useMemo(() => {
    const featured = filteredTutors.filter((tutor) =>
      featuredTutorIds.has(tutor.uid)
    );
    const regular = filteredTutors.filter(
      (tutor) => !featuredTutorIds.has(tutor.uid)
    );
    return { featuredTutors: featured, regularTutors: regular };
  }, [filteredTutors, featuredTutorIds]);

  const handleBecomeTutor = () => {
    navigate("/becomeAnExpert");
  };

  const TruncatedText = ({ text, limit }) => {
    if (!text) return null;
    if (text.length <= limit) return text;
    return text.slice(0, limit) + "...";
  };

  const TutorCard = ({ tutor, isFeatured }) => {
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);

    const handleTutorClick = () => {
      navigate(`/tutor/${tutor.uid}`);
    };

    return (
      <div
        onClick={handleTutorClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`p-2 border rounded-xl cursor-pointer transition-all duration-200 ${
          isHovered ? "shadow-lg" : ""
        } ${isFeatured ? "border-green-500 bg-green-50" : "border-green-600"}`}
      >
        <div className="flex flex-col gap-4 sm:flex-row">
          <img
            src={tutor.photoUrl || "/api/placeholder/80/80"}
            alt={tutor.name}
            className="object-cover mx-auto rounded-lg w-28 h-28 sm:mx-0"
          />
          <div className="flex-1 space-y-2">
            <h3 className="text-lg font-semibold text-center sm:text-left">
              {tutor.name}
            </h3>
            {isFeatured && tutor.bio && (
              <p className="hidden mt-1 text-xs text-gray-600 sm:block">
                <TruncatedText text={tutor.bio} limit={70} />
              </p>
            )}
            <div className="flex flex-col gap-1 mt-2">
              <div className="flex flex-col items-center gap-2 sm:flex-row">
                <span className="text-xs text-center sm:text-left">
                  {tutor.nativeLanguage} (Native)
                </span>
                <span className="hidden w-1 h-1 bg-gray-300 rounded-full sm:block"></span>
                <div className="flex items-center gap-1">
                  <img src="/svgs/location.svg" />{" "}
                  <span className="text-xs">{tutor.country}</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2 sm:flex-row">
                <span className="text-xs text-center sm:text-left">
                  {tutor.teachingLanguage} (Teaching)
                </span>
                <span className="hidden w-1 h-1 bg-gray-300 rounded-full sm:block"></span>
                <div className="flex items-center gap-1">
                  <img alt="bammbuu" src="/svgs/users.svg" />{" "}
                  <span className="text-xs">
                    {tutor.tutorStudentIds?.length || 0} Students
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar user={user} />
        <div className="flex items-center justify-center flex-1">
          <ClipLoader color="#14B82C" size={50} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white lg:flex-row">
      <div className="w-full lg:w-64 lg:flex-shrink-0">
        <Sidebar user={user} />
      </div>

      <div className="flex-1 min-w-0 overflow-auto">
        <div className="h-[calc(100vh-1rem)] p-8 bg-white border-2 border-[#e7e7e7] rounded-3xl m-2 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col justify-between gap-4 pb-4 mb-6 border-b sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-semibold md:text-4xl">
                {t("languageExperts.title")}
              </h1>
            </div>
            <button
              className="px-4 md:px-6 py-2 md:py-2.5 text-base md:text-lg font-medium rounded-full transition-all duration-200 border bg-white text-black border-[#5d5d5d] w-full sm:w-auto"
              onClick={handleBecomeTutor}
            >
              {t("languageExperts.becomeExpert")}
            </button>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col justify-between gap-4 mb-8 md:flex-row md:items-center">
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setActiveFilter(filter.label)}
                  className={`px-3 md:px-5 py-2 rounded-full text-sm md:text-md ${
                    activeFilter === filter.label
                      ? "bg-[#B9F9C2] text-[#12551E]"
                      : "bg-[#EDEDED] text-[#5D5D5D]"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <div className="relative flex-1 w-full md:max-w-2xl">
              <Search className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-4 top-1/2" />
              <input
                type="text"
                placeholder={t("languageExperts.searchPlaceholder")}
                className="w-full py-3 pl-12 pr-4 border border-gray-200 rounded-3xl  focus:border-[#14B82C] focus:ring-0 focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Featured Instructors */}
          <section className="mb-8 md:mb-12">
            <h2 className="mb-4 text-xl font-medium md:text-2xl">
              {t("languageExperts.featuredInstructors")}
            </h2>
            {featuredTutors.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {featuredTutors.map((tutor) => (
                  <TutorCard key={tutor.uid} tutor={tutor} isFeatured={true} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <EmptyState
                  message={
                    searchQuery
                      ? t("languageExperts.noResults")
                      : t("languageExperts.noTutor")
                  }
                />
              </div>
            )}
          </section>

          {/* Regular Instructors */}
          <section>
            <h2 className="mb-4 text-xl font-medium md:text-2xl">
              {t("languageExperts.moreInstructors")}
            </h2>
            {regularTutors.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {regularTutors.map((tutor) => (
                  <TutorCard key={tutor.uid} tutor={tutor} isFeatured={false} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <EmptyState
                  message={
                    searchQuery
                      ? t("languageExperts.noResults")
                      : t("languageExperts.noTutor")
                  }
                />
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default LanguageExpertsPage;
