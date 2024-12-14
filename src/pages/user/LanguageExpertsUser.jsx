import React, { useEffect, useState } from "react";
import { Search, MapPin, Users } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../../components/Sidebar";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useNavigate } from "react-router-dom";
import { ClipLoader } from "react-spinners";
const LanguageExpertsPage = () => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [tutors, setTutors] = useState([]);
  const [featuredTutorIds, setFeaturedTutorIds] = useState(new Set());
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

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

        let tutorsQuery = collection(db, "tutors");

        if (activeFilter !== "All") {
          tutorsQuery = query(
            tutorsQuery,
            where("teachingLanguage", "==", activeFilter)
          );
        }

        const tutorsSnapshot = await getDocs(tutorsQuery);
        const tutorsData = tutorsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const filteredTutors = tutorsData.filter((tutor) => {
          const searchLower = searchQuery.toLowerCase();
          return (
            !searchQuery ||
            tutor.name.toLowerCase().includes(searchLower) ||
            tutor.bio?.toLowerCase().includes(searchLower)
          );
        });

        setTutors(filteredTutors);
      } catch (error) {
        console.error("Error fetching tutors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTutors();
  }, [activeFilter, searchQuery]);

  const featuredTutors = tutors.filter((tutor) =>
    featuredTutorIds.has(tutor.uid)
  );
  const regularTutors = tutors.filter(
    (tutor) => !featuredTutorIds.has(tutor.uid)
  );

  const navigate = useNavigate();

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
                <span className="text-sm">{tutor.nativeLanguage} (Native)</span>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <MapPin className="w-4 h-auto" />
                <span className="text-sm">{tutor.country}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  {tutor.teachingLanguage} (Teaching)
                </span>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <Users className="w-4 h-auto" />
                <span className="text-sm">
                  {tutor.tutorStudentIds?.length || 0} students
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
            <h1 className="text-4xl font-semibold">Language Experts</h1>
          </div>
          <button
            className="px-6 py-2.5 text-lg font-medium rounded-full transition-all duration-200 border bg-white text-black border-[#5d5d5d]"
            onClick={handleBecomeTutor}
          >
            Become an Expert
          </button>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-3">
            {["All", "English", "Spanish"].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-full text-md ${
                  activeFilter === filter
                    ? "bg-green-100 text-black"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-2xl ml-8">
            <Search className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-4 top-1/2" />
            <input
              type="text"
              placeholder="Search resource by name"
              className="w-full py-3 pl-12 pr-4 border border-gray-200 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-medium">Featured Instructors</h2>
          {featuredTutors.length > 0 ? (
            <div className="grid grid-cols-3 gap-4">
              {featuredTutors.map((tutor) => (
                <TutorCard key={tutor.uid} tutor={tutor} isFeatured={true} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center ">
              <div className="flex items-center justify-center w-16 h-16 mb-4 bg-yellow-100 rounded-full">
                <img alt="empty state" src="/images/no_saved.png" />
              </div>
              <p className="text-gray-600">No tutors available </p>
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-medium">More Instructors</h2>
          {regularTutors.length > 0 ? (
            <div className="grid grid-cols-3 gap-4">
              {regularTutors.map((tutor) => (
                <TutorCard key={tutor.uid} tutor={tutor} isFeatured={false} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center ">
              <div className="flex items-center justify-center w-16 h-16 mb-4 bg-yellow-100 rounded-full">
                <img alt="empty state" src="/images/no_saved.png" />
              </div>
              <p className="text-gray-600">No tutors available </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default LanguageExpertsPage;
