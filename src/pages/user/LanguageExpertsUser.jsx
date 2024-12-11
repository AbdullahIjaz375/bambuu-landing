import React, { useEffect, useRef, useState } from "react";
import {
  Search,
  ArrowLeft,
  RotateCw,
  Send,
  Ellipsis,
  MapPin,
  Users,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../../components/Sidebar";

const LanguageExpertsPage = () => {
  const [activeFilter, setActiveFilter] = useState("All");
  const { user } = useAuth();

  const featuredInstructors = [
    {
      id: 1,
      name: "James Philips",
      bio: "Native Spanish speaker, skilled English tutor, dedicated to helping students gain fluency.",
      nativeLanguage: "Spanish (Native)",
      teachingLanguage: "English (Teaching)",
      location: "USA",
      students: "200k",
      image: "/api/placeholder/80/80",
    },
    {
      id: 2,
      name: "Tutor Name",
      bio: "Tutor Bio. Just show 80 letters here...Native Spanish speaker, skilled English tutor, dedicated to helping studen...",
      nativeLanguage: "Spanish (Native)",
      teachingLanguage: "English (Teaching)",
      location: "USA",
      students: "200k",
      image: "/api/placeholder/80/80",
    },
  ];

  const moreInstructors = [
    {
      id: 3,
      name: "Jakob Lubin",
      nativeLanguage: "Spanish (Native)",
      teachingLanguage: "English (Teaching)",
      location: "USA",
      students: "200k",
      image: "/api/placeholder/80/80",
    },
    {
      id: 4,
      name: "Paityn Carder",
      nativeLanguage: "Spanish (Native)",
      teachingLanguage: "English (Teaching)",
      location: "USA",
      students: "200k",
      image: "/api/placeholder/80/80",
    },
    {
      id: 5,
      name: "Tatiana Lipshutz",
      nativeLanguage: "Spanish (Native)",
      teachingLanguage: "English (Teaching)",
      location: "USA",
      students: "200k",
      image: "/api/placeholder/80/80",
    },
  ];

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar user={user} />

      <div className="flex-1 p-8 bg-white border-2 border-[#e7e7e7] rounded-3xl ml-[17rem] m-2">
        <div className="flex items-center justify-between pb-4 mb-6 border-b">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-semibold">Saved Resources</h1>
          </div>
          <button className="px-6 py-2.5 text-lg font-medium rounded-full transition-all duration-200 border bg-white text-black border-[#5d5d5d]">
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
            />
          </div>
        </div>

        <section className="mb-12">
          <h2 className="mb-4 text-xl font-medium">Featured Instructors</h2>
          <div className="grid grid-cols-3 gap-4">
            {featuredInstructors.map((instructor) => (
              <div
                key={instructor.id}
                className="p-4 border border-[#40b84e] rounded-xl bg-[#f0fdf1]"
              >
                <div className="flex gap-4">
                  <img
                    src={instructor.image}
                    alt={instructor.name}
                    className="object-cover w-16 h-16 rounded-lg"
                  />
                  <div className="flex-1 space-y-2">
                    <h3 className="text-xl font-semibold">{instructor.name}</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {instructor.bio}
                    </p>
                    <div className="flex flex-col gap-1 mt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {instructor.nativeLanguage}
                        </span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>

                        <MapPin className="w-4 h-auto" />
                        <span className="text-sm">{instructor.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {instructor.teachingLanguage}
                        </span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <Users className="w-4 h-auto" />
                        <span className="text-sm">{instructor.students}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-medium">More Instructors</h2>
          <div className="grid grid-cols-3 gap-4">
            {moreInstructors.map((instructor) => (
              <div
                key={instructor.id}
                className="p-4 border border-[#27b93c] rounded-xl"
              >
                <div className="flex gap-4">
                  <img
                    src={instructor.image}
                    alt={instructor.name}
                    className="object-cover w-16 h-16 rounded-lg"
                  />
                  <div>
                    <h3 className="text-xl font-semibold">{instructor.name}</h3>
                    <div className="flex flex-col gap-1 mt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {instructor.nativeLanguage}
                        </span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>

                        <MapPin className="w-4 h-auto" />
                        <span className="text-sm">{instructor.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {instructor.teachingLanguage}
                        </span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <Users className="w-4 h-auto" />
                        <span className="text-sm">{instructor.students}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default LanguageExpertsPage;
