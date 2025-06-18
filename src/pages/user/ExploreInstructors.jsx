import { useRef, useState, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import Modal from "react-modal";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { ClipLoader } from "react-spinners";

const LANG_FILTERS = [
  { label: "All", value: "all" },
  { label: "English", value: "English" },
  { label: "Spanish", value: "Spanish" },
];

const filterInstructors = (list, filter) => {
  if (filter === "all") return list;
  return list.filter(
    (inst) =>
      inst.teachingLanguage?.toLowerCase().includes(filter.toLowerCase()) ||
      inst.nativeLanguage?.toLowerCase().includes(filter.toLowerCase()),
  );
};

const ExploreInstructors = ({
  isOpen,
  onClose,
  showExploreInstructorsModal,
  setShowExploreInstructorsModal,
  onInstructorSelect,
}) => {
  const [activeLang, setActiveLang] = useState("all");
  const [search, setSearch] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselRef = useRef(null);

  // Actual data state
  const [allTutors, setAllTutors] = useState([]);
  const [featuredTutorIds, setFeaturedTutorIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  // Fetch tutors and featured tutors
  useEffect(() => {
    const fetchTutors = async () => {
      setLoading(true);
      try {
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

    if (showExploreInstructorsModal) fetchTutors();
  }, [showExploreInstructorsModal]);

  // Filtering
  const filteredTutors = useMemo(() => {
    let list = filterInstructors(allTutors, activeLang);
    if (search) {
      list = list.filter(
        (inst) =>
          inst.name?.toLowerCase().includes(search.toLowerCase()) ||
          inst.bio?.toLowerCase().includes(search.toLowerCase()),
      );
    }
    return list;
  }, [allTutors, activeLang, search]);

  const featuredTutors = filteredTutors.filter((tutor) =>
    featuredTutorIds.has(tutor.uid),
  );
  const moreTutors = filteredTutors.filter(
    (tutor) => !featuredTutorIds.has(tutor.uid),
  );

  // Carousel logic
  const itemsPerSlide = 2;
  const totalSlides = Math.ceil(featuredTutors.length / itemsPerSlide);
  const showCarousel = featuredTutors.length > itemsPerSlide;

  const goToSlide = (slideIndex) => setCurrentSlide(slideIndex);

  // Reset currentSlide when filters change
  useEffect(() => {
    setCurrentSlide(0);
  }, [featuredTutors.length]);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="fixed left-1/2 top-1/2 flex h-[90vh] max-h-[842px] w-[95vw] max-w-[784px] -translate-x-1/2 -translate-y-1/2 transform flex-col rounded-[2.5rem] bg-white p-0 font-urbanist shadow-xl outline-none"
      overlayClassName="fixed inset-0 bg-black bg-opacity-20 z-50 flex items-center justify-center backdrop-blur-sm"
      ariaHideApp={false}
    >
      <div className="flex flex-col px-8 py-8">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[18px] font-medium">Explore Instructors</h2>
          <button
            className="relative flex h-10 w-10 items-center justify-center rounded-full border-none bg-[#F6F6F6] p-0 transition hover:bg-[#ededed]"
            // onClick={() => setShowExploreInstructorsModal(false)}
            onClick={onClose}
          >
            <X className="h-6 w-6 text-[#3D3D3D] hover:text-gray-700" />
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-[300px] flex-1 items-center justify-center">
            <ClipLoader color="#14B82C" size={48} />
          </div>
        ) : (
          <>
            {/* Filters/Search */}
            <div className="mb-4 mt-4 flex items-center gap-2">
              {LANG_FILTERS.map((lang) => (
                <button
                  key={lang.value}
                  className={`rounded-full border px-4 py-1 text-sm font-medium ${
                    activeLang === lang.value
                      ? "bg-[#B9F9C2] text-[#12551E]"
                      : "bg-[#EDEDED] text-[#5D5D5D]"
                  }`}
                  onClick={() => setActiveLang(lang.value)}
                >
                  {lang.label}
                </button>
              ))}
              <div className="relative ml-auto w-full max-w-[420px]">
                <input
                  type="text"
                  placeholder="Search instructor by name"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-10 w-full rounded-full border border-[#E7E7E7] bg-white pl-12 pr-4 font-urbanist text-base placeholder:text-[#5D5D5D] focus:outline-none"
                />
                <svg
                  className="text-black-600 absolute left-4 top-1/2 -translate-y-1/2"
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    cx="11"
                    cy="11"
                    r="8"
                    stroke="#5D5D5D"
                    strokeWidth="2"
                  />
                  <path
                    d="M20 20L16.65 16.65"
                    stroke="#5D5D5D"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
            {/* Featured Instructors */}
            <div className="mt-4">
              <h3 className="mb-2 text-2xl font-bold">Featured Instructors</h3>
              <div className="mb-4">
                {/* Carousel container */}
                <div className="overflow-hidden">
                  <div
                    ref={carouselRef}
                    className="flex gap-4 transition-transform duration-300 ease-in-out"
                    style={{
                      transform: `translateX(-${currentSlide * 100}%)`,
                      width: `${totalSlides * 100}%`,
                    }}
                  >
                    {Array.from({ length: totalSlides }, (_, slideIndex) => (
                      <div
                        key={slideIndex}
                        className="flex min-w-full gap-4"
                        style={{ width: `${100 / totalSlides}%` }}
                      >
                        {featuredTutors
                          .slice(
                            slideIndex * itemsPerSlide,
                            (slideIndex + 1) * itemsPerSlide,
                          )
                          .map((inst, idx) => (
                            <div
                              key={inst.uid}
                              className="flex min-w-[350px] max-w-[370px] cursor-pointer flex-row items-center rounded-2xl border border-[#14B82C] bg-[#F0FDF1] p-3"
                              style={{
                                boxShadow: "0 1px 4px 0 rgba(20,184,44,0.04)",
                              }}
                              onClick={() => {
                                if (onInstructorSelect)
                                  onInstructorSelect(inst);
                                setShowExploreInstructorsModal(false);
                              }}
                            >
                              <img
                                src={inst.photoUrl || "/images/panda.png"}
                                alt={inst.name}
                                className="mr-3 h-16 w-16 rounded-xl object-cover"
                              />
                              <div className="flex flex-1 flex-col">
                                <div className="text-lg font-semibold leading-tight">
                                  {inst.name}
                                </div>
                                <div className="mb-2 line-clamp-2 text-xs leading-snug text-[#3D3D3D]">
                                  {inst.bio
                                    ? inst.bio.slice(0, 80)
                                    : "No bio available."}
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium text-[#3D3D3D]">
                                  <div className="flex flex-col">
                                    <span>{inst.nativeLanguage} (Native)</span>
                                    <span>
                                      {inst.teachingLanguage} (Teaching)
                                    </span>
                                  </div>
                                  <div className="ml-4 flex flex-col justify-between">
                                    <span className="flex items-center gap-1">
                                      <img
                                        src="/svgs/location.svg"
                                        alt={inst.country}
                                        className="inline-block"
                                      />
                                      {inst.country}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <img
                                        src="/svgs/users.svg"
                                        alt={inst.country}
                                        className="inline-block"
                                      />
                                      {inst.tutorStudentIds?.length || 0}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pagination dots */}
              {showCarousel && (
                <div className="mb-4 flex justify-center gap-2">
                  {Array.from({ length: totalSlides }, (_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      className={`h-2 rounded-full transition-all duration-200 ${
                        index === currentSlide
                          ? "w-6 bg-[#12551E] opacity-80"
                          : "w-2 bg-[#E7E7E7] hover:bg-[#D1D1D1]"
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Show message when no featured instructors */}
              {featuredTutors.length === 0 && (
                <div className="mb-4 text-sm text-gray-400">
                  No featured instructors found.
                </div>
              )}

              {/* More Instructors */}
              <h3 className="mb-2 mt-6 text-2xl font-bold">More Instructors</h3>
              <div className="grid max-h-[320px] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
                {moreTutors.length === 0 && (
                  <div className="col-span-2 text-sm text-gray-400">
                    No instructors found.
                  </div>
                )}
                {moreTutors.map((inst, idx) => (
                  <div
                    key={inst.uid}
                    className="scrollbar-hide flex min-h-[110px] cursor-pointer flex-row items-center rounded-2xl border border-[#14B82C] bg-white p-3 transition-shadow"
                    style={{ boxShadow: "0 1px 4px 0 rgba(20,184,44,0.04)" }}
                    onClick={() => {
                      if (onInstructorSelect) onInstructorSelect(inst);
                      setShowExploreInstructorsModal(false);
                    }}
                  >
                    <img
                      src={inst.photoUrl || "/images/panda.png"}
                      alt={inst.name}
                      className="mr-3 h-20 w-20 rounded-xl object-cover"
                    />
                    <div className="flex flex-1 flex-col justify-center">
                      <div className="mb-1 text-xl font-semibold leading-tight">
                        {inst.name}
                      </div>
                      <div className="flex w-full flex-row items-center justify-center">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium">
                            {inst.nativeLanguage} (Native)
                          </div>
                          <div className="text-sm font-medium">
                            {inst.teachingLanguage} (Teaching)
                          </div>
                        </div>
                        <div className="ml-4 flex min-w-[90px] flex-col items-end gap-1 text-sm font-medium">
                          <span className="flex items-center gap-1">
                            <img
                              src="/svgs/location.svg"
                              alt={inst.country}
                              className="inline-block"
                            />
                            {inst.country}
                          </span>
                          <span className="flex items-center gap-1">
                            <img
                              src="/svgs/users.svg"
                              alt={inst.country}
                              className="inline-block"
                            />
                            {inst.tutorStudentIds?.length || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default ExploreInstructors;
