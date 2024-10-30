// src/pages/Landing.js
import React from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { db, auth } from "../firebaseConfig";
import { IoSearchOutline } from "react-icons/io5";
import { TextInput, Button } from "@mantine/core";
import "../styles/LandingStyles.css";
import Footer from "../components/Footer";

const Landing = () => {
  const { user } = useAuth(); // Get the user from AuthContext

  const cardData = [
    {
      title: "AI SuperTutor",
      description:
        "Join live webinars conducted by subject matter experts, where they delve into specific topics, and answer questions from participants.",
      imageUrl: "/images/landing-card-1.png",
    },
    {
      title: "Language Exchange",
      description:
        "Connect with native speakers to practice your language skills in a friendly environment.",
      imageUrl: "/images/landing-card-2.png",
    },
    {
      title: "Certified Instructors",
      description:
        "Learn from certified instructors with experience in language teaching and cultural exchange.",
      imageUrl: "/images/landing-card-3.png",
    },
    {
      title: "AI SuperTutor",
      description:
        "Join live webinars conducted by subject matter experts, where they delve into specific topics, and answer questions from participants.",
      imageUrl: "/images/landing-card-1.png",
    },
    {
      title: "Language Exchange",
      description:
        "Connect with native speakers to practice your language skills in a friendly environment.",
      imageUrl: "/images/landing-card-2.png",
    },
    {
      title: "Certified Instructors",
      description:
        "Learn from certified instructors with experience in language teaching and cultural exchange.",
      imageUrl: "/images/landing-card-3.png",
    },
  ];

  const instructors = [
    { id: 1, img: "/images/ins-1.png" },
    { id: 2, img: "/images/ins-2.png" },
    { id: 3, img: "/images/ins-3.png" },
    { id: 4, img: "/images/ins-4.png" },
    { id: 5, img: "/images/ins-5.png" },
    { id: 6, img: "/images/ins-6.png" },
    { id: 7, img: "/images/ins-7.png" },
    { id: 8, img: "/images/ins-1.png" },
    { id: 9, img: "/images/ins-2.png" },
    { id: 10, img: "/images/ins-3.png" },
    { id: 11, img: "/images/ins-4.png" },
    { id: 12, img: "/images/ins-5.png" },
    { id: 13, img: "/images/ins-6.png" },
    { id: 14, img: "/images/ins-7.png" },
    { id: 15, img: "/images/ins-1.png" },
    { id: 16, img: "/images/ins-2.png" },
  ];

  return (
    <>
      <Navbar user={user} />
      <div>
        {/* Navbar */}
        <div className="flex items-center justify-center pb-4 ">
          <div className="items-center flex-grow hidden w-full max-w-lg mx-4 md:flex">
            <TextInput
              placeholder="Ask SuperTutor"
              radius="md"
              size="lg"
              styles={{
                input: {
                  borderColor: "#14B82C",
                  borderWidth: "1px",
                },
              }}
              leftSection={
                <IoSearchOutline className="text-3xl text-green-500" />
              }
              className="w-full border-green-500"
            />
          </div>
        </div>

        {/* Section 1 */}
        <div
          className="relative  flex items-center justify-start h-[60vh] md:h-[85vh] px-4 md:px-10 text-white bg-center bg-cover"
          style={{
            backgroundImage: `url('/images/landing-1.png')`,
          }}
        >
          <div className="max-w-3xl p-4 space-y-6 md:max-w-5xl md:p-8 md:space-y-10">
            <h1 className="mb-4 text-4xl font-bold md:text-6xl">
              Learn your new language
            </h1>
            <p className="mb-6 text-lg md:text-3xl">
              Learn a new language and practice through conversation with native
              speakers, language learners, and certified instructors. bammbuu is
              a safe place to practice.
            </p>
            <Button
              className="px-4 py-2 font-bold text-white bg-green-500 hover:bg-green-600 md:px-6 md:py-2"
              size="lg"
              radius="xl"
            >
              Get Started
            </Button>
          </div>
        </div>

        {/* Section 2 */}
        <div className="flex flex-col items-center justify-center px-2 px-4 pt-10 md:pt-20">
          <div className="max-w-3xl p-4 space-y-6 text-center md:max-w-5xl md:p-8 md:space-y-10">
            <h1 className="mb-4 text-4xl md:text-6xl font-bold text-[#444444]">
              Practice Languages
            </h1>
            <p className="mb-6 text-lg md:text-3xl text-[#444444]">
              Learn a new language with certified language instructors. Practice
              what you’ve learned with native speakers and language learners
              through live conversation.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 py-10 md:py-20">
            {cardData.map((card, index) => (
              <div
                key={index}
                className="w-full max-w-sm overflow-hidden transition-transform duration-300 transform bg-white rounded-lg shadow-md sm:w-96 hover:scale-105 hover:shadow-lg"
              >
                <img
                  className="object-cover w-full h-40 md:h-56"
                  src={card.imageUrl}
                  alt={card.title}
                />
                <div className="flex flex-col justify-between p-4 h-36 md:h-48">
                  <div>
                    <h2 className="mb-2 text-lg font-semibold md:text-xl">
                      {card.title}
                    </h2>
                    <p className="mb-4 text-sm text-gray-600 md:text-md truncate-text">
                      {card.description}
                    </p>
                  </div>
                  <a
                    href="#"
                    className="text-lg font-bold text-green-600 hover:underline"
                  >
                    Learn More
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4 */}
        <div
          className="relative flex items-center justify-start h-[55vh] md:h-[75vh] px-4 md:px-10 text-white bg-center bg-cover"
          style={{
            backgroundImage: `url('/images/landing-2.png')`,
          }}
        >
          <div className="max-w-3xl p-4 space-y-6 md:max-w-5xl md:p-8 md:space-y-10">
            <h1 className="mb-4 text-4xl font-bold md:text-6xl">
              Practice languages{" "}
            </h1>
            <p className="mb-6 text-lg md:text-3xl">
              Practice conversation 24/7 on demand with bammbuu SuperTutor.
            </p>
            <Button
              className="px-4 py-2 font-bold text-black bg-white hover:bg-gray-200 hover:text-black md:px-6 md:py-2"
              size="lg"
              radius="xl"
            >
              Learn More{" "}
            </Button>
          </div>
        </div>

        {/* section 5 */}

        <div className="px-4 pt-20 space-y-20">
          <h1 className="mb-4 text-4xl md:text-6xl text-center font-bold text-[#444444]">
            Why practice languages with bammbuu{" "}
          </h1>

          <div className="flex flex-col items-center justify-center space-y-10 md:flex-row md:-space-x-16 md:space-y-0">
            <div className="flex flex-col items-center justify-between space-y-10">
              <div className="py-10 px-8 bg-[#f2f2f2] rounded-lg shadow-lg w-full md:w-[45vh] text-center md:text-left border-2 border-[#cecece]">
                <h3 className="mb-4 text-2xl font-semibold">
                  Intelligent Conversational Interface
                </h3>
                <p className="text-lg text-gray-600">
                  Edi can engage in natural language conversations with users,
                  understanding their queries and providing accurate and
                  relevant responses in real-time.
                </p>
              </div>
              <div className="py-10 px-8 bg-[#f2f2f2] rounded-lg shadow-lg w-full md:w-[45vh] text-center md:text-left border-2 border-[#cecece]">
                <h3 className="mb-4 text-2xl font-semibold">
                  Adaptive Learning Algorithms
                </h3>
                <p className="text-lg text-gray-600">
                  Edi utilizes adaptive learning algorithms to analyze user
                  performance, identify areas of improvement, and recommend
                  targeted resources or practice materials.
                </p>
              </div>
            </div>

            <div className="transition-transform transform hover:scale-105">
              <img
                alt="owl"
                src="/images/Owl.png"
                className="h-auto max-w-full"
              />
            </div>

            <div className="flex flex-col items-center justify-between space-y-10">
              <div className="py-10 px-8 bg-[#f2f2f2] rounded-lg shadow-lg w-full md:w-[45vh] text-center md:text-left border-2 border-[#cecece]">
                <h3 className="mb-4 text-2xl font-semibold">
                  Progress Tracking and Feedback
                </h3>
                <p className="text-lg text-gray-600">
                  Tracks and analyzes user progress, providing feedback on
                  performance, strengths, and areas needing improvement. It
                  offers personalized recommendations for further study.
                </p>
              </div>
              <div className="py-10 px-8 bg-[#f2f2f2] rounded-lg shadow-lg w-full md:w-[45vh] text-center md:text-left border-2 border-[#cecece]">
                <h3 className="mb-4 text-2xl font-semibold">
                  Study Reminders and Scheduling
                </h3>
                <p className="text-lg text-gray-600">
                  Sends reminders, suggests study schedules to help users stay
                  organized and maintain a consistent learning routine,
                  available around the clock 24/7.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 6 */}
        <div className=" bg-[#f2f2f2] flex flex-col items-center justify-center py-20 mt-20 space-y-6">
          <h1 className="mb-4 text-4xl font-semibold md:text-6xl text-[#444444]">
            bammbuu+{" "}
          </h1>
          <p className="mb-6 text-lg md:text-2xl text-[#444444]">
            Discover the membership that suits your learning needs, flexible
            learning and cancellation options.{" "}
          </p>
          <p className="mb-6 text-[#444444] font-semibold text-lg md:text-3xl">
            Starting at $59/mo{" "}
          </p>
          <div>
            <Button size="lg" radius="xl" color="#14B82C" className="mt-6">
              Subscribe{" "}
            </Button>
          </div>
        </div>

        {/* section 7 */}
        <div className="flex mb-20 flex-col items-center justify-center px-6 py-12 md:px-12 lg:px-20 mx-4 md:mx-10 lg:mx-20 mt-12 md:mt-16 lg:mt-20 text-white bg-[#090909] rounded-3xl">
          <div className="grid grid-cols-3 gap-4 mb-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9">
            {instructors.map((instructor) => (
              <div
                key={instructor.id}
                className="w-24 h-24 overflow-hidden rounded-full sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-40 lg:h-40 "
              >
                <img
                  src={instructor.img}
                  alt={`Instructor ${instructor.id}`}
                  className="w-full h-full "
                />
              </div>
            ))}
          </div>
          <p className="mt-8 mb-4 text-xl font-semibold text-left sm:text-2xl md:text-3xl">
            bambbuu+ offers 1:1 live classes with certified language
            instructors.
          </p>
          <Button
            className="mt-6 text-black bg-white hover:bg-gray-200 hover:text-black"
            size="xl"
            radius="xl"
          >
            View instructors
          </Button>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Landing;
