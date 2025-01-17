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

  const TutorCard = ({ tutor, isFeatured }) => {
    const navigate = useNavigate();

    const handleTutorClick = () => {
      navigate(`/tutor/${tutor.uid}`);
    };

    return (
      <div
        onClick={handleTutorClick}
        className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg ${
          isFeatured ? "border-[#40b84e] bg-[#f0fdf1]" : "border-[#27b93c]"
        }`}
      >
        <div className="flex gap-4">
          <img
            src={tutor.photoUrl || "/api/placeholder/80/80"}
            alt={tutor.name}
            className="object-cover w-16 h-16 rounded-lg"
          />
          <div className="flex-1 space-y-2">
            <h3 className="text-xl font-semibold">{tutor.name}</h3>
            {isFeatured && tutor.bio && (
              <p className="mt-1 text-sm text-gray-600">{tutor.bio}</p>
            )}
            <div className="flex flex-col gap-1 mt-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  {tutor.nativeLanguage} (
                  {t("languageExperts.tutorCard.native")})
                </span>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <MapPin className="w-4 h-auto" />
                <span className="text-sm">{tutor.country}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  {tutor.teachingLanguage} (
                  {t("languageExperts.tutorCard.teaching")})
                </span>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <Users className="w-4 h-auto" />
                <span className="text-sm">
                  {tutor.tutorStudentIds?.length || 0}{" "}
                  {t("languageExperts.tutorCard.students")}
                </span>
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
    <div className="flex min-h-screen bg-white">
      <Sidebar user={user} />

      <div className="flex-1 p-8 bg-white border-2 border-[#e7e7e7] rounded-3xl ml-[17rem] m-2">
        <div className="flex items-center justify-between pb-4 mb-6 border-b">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-semibold">
              {t("languageExperts.title")}
            </h1>
          </div>
          <button
            className="px-6 py-2.5 text-lg font-medium rounded-full transition-all duration-200 border bg-white text-black border-[#5d5d5d]"
            onClick={handleBecomeTutor}
          >
            {t("languageExperts.becomeExpert")}
          </button>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-3">
            {filters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.label)}
                className={`px-4 py-2 rounded-full text-md ${
                  activeFilter === filter.label
                    ? "bg-green-100 text-black"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-2xl ml-8">
            <Search className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-4 top-1/2" />
            <input
              type="text"
              placeholder={t("languageExperts.searchPlaceholder")}
              className="w-full py-3 pl-12 pr-4 border border-gray-200 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-medium">
            {t("languageExperts.featuredInstructors")}
          </h2>
          {featuredTutors.length > 0 ? (
            <div className="grid grid-cols-3 gap-4">
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

        <section>
          <h2 className="mb-4 text-2xl font-medium">
            {t("languageExperts.moreInstructors")}
          </h2>
          {regularTutors.length > 0 ? (
            <div className="grid grid-cols-3 gap-4">
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
  );
};

export default LanguageExpertsPage;
