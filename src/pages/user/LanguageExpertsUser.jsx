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
    t("languageExperts.filters.all"),
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
          collection(db, "featured_tutors"),
        );
        const featuredIds = new Set(
          featuredSnapshot.docs.map((doc) => doc.data().tutorId),
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
      featuredTutorIds.has(tutor.uid),
    );
    const regular = filteredTutors.filter(
      (tutor) => !featuredTutorIds.has(tutor.uid),
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
        className={`cursor-pointer rounded-xl border p-2 transition-all duration-200 ${
          isHovered ? "shadow-lg" : ""
        } ${isFeatured ? "border-green-500 bg-green-50" : "border-green-600"}`}
      >
        <div className="flex flex-col gap-4 sm:flex-row">
          <img
            src={tutor.photoUrl || "/images/panda.png"}
            alt={tutor.name}
            className="mx-auto h-28 w-28 rounded-lg object-cover sm:mx-0"
          />
          <div className="flex-1 space-y-2">
            <h3 className="text-center text-lg font-semibold sm:text-left">
              {tutor.name}
            </h3>
            {isFeatured && tutor.bio && (
              <p className="mt-1 hidden text-xs text-gray-600 sm:block">
                <TruncatedText text={tutor.bio} limit={70} />
              </p>
            )}
            <div className="mt-2 flex flex-col gap-1">
              <div className="flex flex-col items-center gap-2 sm:flex-row">
                <span className="text-center text-xs sm:text-left">
                  {tutor.nativeLanguage} (Native)
                </span>
                <span className="hidden h-1 w-1 rounded-full bg-gray-300 sm:block"></span>
                <div className="flex items-center gap-1">
                  <img src="/svgs/location.svg" />{" "}
                  <span className="text-xs">{tutor.country}</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2 sm:flex-row">
                <span className="text-center text-xs sm:text-left">
                  {tutor.teachingLanguage} (Teaching)
                </span>
                <span className="hidden h-1 w-1 rounded-full bg-gray-300 sm:block"></span>
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
        <div className="flex flex-1 items-center justify-center">
          <ClipLoader color="#14B82C" size={50} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white lg:flex-row">
      <div className="w-full lg:w-64 lg:flex-shrink-0">
        <Sidebar user={user} />
      </div>

      <div className="min-w-0 flex-1 overflow-auto">
        <div className="m-2 h-[calc(100vh-1rem)] overflow-y-auto rounded-3xl border-2 border-[#e7e7e7] bg-white p-8">
          {/* Header */}
          <div className="mb-6 flex flex-col justify-between gap-4 border-b pb-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-semibold md:text-4xl">
                {t("languageExperts.title")}
              </h1>
            </div>
            <button
              className="w-full rounded-full border border-[#5d5d5d] bg-white px-4 py-2 text-base font-medium text-black transition-all duration-200 sm:w-auto md:px-6 md:py-2.5 md:text-lg"
              onClick={handleBecomeTutor}
            >
              {t("languageExperts.becomeExpert")}
            </button>
          </div>

          {/* Filters and Search */}
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setActiveFilter(filter.label)}
                  className={`md:text-md rounded-full px-3 py-2 text-sm md:px-5 ${
                    activeFilter === filter.label
                      ? "bg-[#B9F9C2] text-[#12551E]"
                      : "bg-[#EDEDED] text-[#5D5D5D]"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <div className="relative w-full flex-1 md:max-w-2xl">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t("languageExperts.searchPlaceholder")}
                className="w-full rounded-3xl border border-gray-200 py-3 pl-12 pr-4 focus:border-[#14B82C] focus:outline-none focus:ring-0"
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
