import { X } from "lucide-react";
import { useRef, useState } from "react";
import Modal from "react-modal";
import InstructorProfile from "./InstructorProfile";

const featuredInstructors = [
  {
    name: "James Philips",
    desc: "Native Spanish speaker, skilled English tutor, dedicated to helping students gain fluency.",
    img: "/images/tutor.png",
    langs: ["Spanish (Native)", "English (Teaching)"],
    country: "USA",
    students: "200K",
  },
  {
    name: "Tutor Name",
    desc: "Tutor bio. Just show 80 letters here. Native speaker, skilled English tutor, dedicated teacher.",
    img: "/images/tutor.png",
    langs: ["Spanish (Native)", "English (Teaching)"],
    country: "USA",
    students: "200K",
  },
  {
    name: "James Philips",
    desc: "Native Spanish speaker, skilled English tutor, dedicated to helping students gain fluency.",
    img: "/images/tutor.png",
    langs: ["Spanish (Native)", "English (Teaching)"],
    country: "USA",
    students: "200K",
  },
];

const moreInstructors = [
  {
    name: "Jakob Lubin",
    img: "/images/tutor.png",
    langs: ["Spanish (Native)", "English (Teaching)"],
    country: "USA",
    students: "200K",
  },
  {
    name: "Jakob Lubin",
    img: "/images/tutor.png",
    langs: ["Spanish (Native)", "English (Teaching)"],
    country: "USA",
    students: "200K",
  },
  {
    name: "Paityn Carder",
    img: "/images/tutor.png",
    langs: ["Spanish (Native)", "English (Teaching)"],
    country: "USA",
    students: "200K",
  },
  {
    name: "Paityn Carder",
    img: "/images/tutor.png",
    langs: ["Spanish (Native)", "English (Teaching)"],
    country: "USA",
    students: "200K",
  },
  {
    name: "Tatiana Lipshutz",
    img: "/images/tutor.png",
    langs: ["Spanish (Native)", "English (Teaching)"],
    country: "USA",
    students: "200K",
  },
  {
    name: "Tatiana Lipshutz",
    img: "/images/tutor.png",
    langs: ["Spanish (Native)", "English (Teaching)"],
    country: "USA",
    students: "200K",
  },
];

const LANG_FILTERS = [
  { label: "All", value: "all" },
  { label: "English", value: "English" },
  { label: "Spanish", value: "Spanish" },
];

const filterInstructors = (list, filter) => {
  if (filter === "all") return list;
  return list.filter((inst) =>
    inst.langs.some((lang) =>
      lang.toLowerCase().includes(filter.toLowerCase()),
    ),
  );
};

const ExploreInstructors = ({
  showExploreInstructorsModal,
  setShowExploreInstructorsModal,
}) => {
  const [activeLang, setActiveLang] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselRef = useRef(null);

  const closeAllModals = () => {
    setShowExploreInstructorsModal(false);
  };

  const filteredFeatured = filterInstructors(
    featuredInstructors,
    activeLang,
  ).filter((inst) => inst.name.toLowerCase().includes(search.toLowerCase()));
  const filteredMore = filterInstructors(moreInstructors, activeLang).filter(
    (inst) => inst.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleInstructorClick = (inst) => {
    setSelectedInstructor(inst);
    // setShowExploreInstructorsModal(false); // REMOVE THIS LINE
  };
  const handleCloseInstructor = () => {
    setSelectedInstructor(null);
    setShowExploreInstructorsModal(true);
  };

  const itemsPerSlide = 2;
  const totalSlides = Math.ceil(filteredFeatured.length / itemsPerSlide);
  const showCarousel = filteredFeatured.length > itemsPerSlide;

  const goToSlide = (slideIndex) => {
    setCurrentSlide(slideIndex);
  };

  // Reset currentSlide when filters change
  useState(() => {
    setCurrentSlide(0);
  }, [filteredFeatured.length]);

  return (
    <>
      <Modal
        isOpen={showExploreInstructorsModal && !selectedInstructor}
        onRequestClose={() => setShowExploreInstructorsModal(false)}
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
              onClick={() => setShowExploreInstructorsModal(false)}
            >
              <X className="h-6 w-6 text-[#3D3D3D] hover:text-gray-700" />
            </button>
          </div>
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
                      {filteredFeatured
                        .slice(
                          slideIndex * itemsPerSlide,
                          (slideIndex + 1) * itemsPerSlide,
                        )
                        .map((inst, idx) => (
                          <div
                            key={`${slideIndex}-${idx}`}
                            className="flex min-w-[350px] max-w-[370px] cursor-pointer flex-row items-center rounded-2xl border border-[#14B82C] bg-[#F0FDF1] p-3"
                            style={{
                              boxShadow: "0 1px 4px 0 rgba(20,184,44,0.04)",
                            }}
                            onClick={() => handleInstructorClick(inst)}
                          >
                            <img
                              src={inst.img}
                              alt={inst.name}
                              className="mr-3 h-16 w-16 rounded-xl object-cover"
                            />
                            <div className="flex flex-1 flex-col">
                              <div className="text-lg font-semibold leading-tight">
                                {inst.name}
                              </div>
                              <div className="mb-2 line-clamp-2 text-xs leading-snug text-[#3D3D3D]">
                                {inst.desc}
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium text-[#3D3D3D]">
                                <div className="flex flex-col">
                                  <span>{inst.langs[0]}</span>
                                  <span>{inst.langs[1]}</span>
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
                                    {inst.students}
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
            {filteredFeatured.length === 0 && (
              <div className="mb-4 text-sm text-gray-400">
                No featured instructors found.
              </div>
            )}

            {/* More Instructors */}
            <h3 className="mb-2 mt-6 text-2xl font-bold">More Instructors</h3>
            <div className="grid max-h-[320px] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
              {filteredMore.length === 0 && (
                <div className="col-span-2 text-sm text-gray-400">
                  No instructors found.
                </div>
              )}
              {filteredMore.map((inst, idx) => (
                <div
                  key={idx}
                  className="flex min-h-[110px] cursor-pointer flex-row items-center rounded-2xl border border-[#14B82C] bg-white p-3 transition-shadow"
                  style={{ boxShadow: "0 1px 4px 0 rgba(20,184,44,0.04)" }}
                  onClick={() => handleInstructorClick(inst)}
                >
                  <img
                    src={inst.img}
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
                          {inst.langs[0]}
                        </div>
                        <div className="text-sm font-medium">
                          {inst.langs[1]}
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
                          {inst.students}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
      {selectedInstructor && (
        <InstructorProfile
          selectedInstructor={selectedInstructor}
          setSelectedInstructor={handleCloseInstructor}
        />
      )}
    </>
  );
};

export default ExploreInstructors;
