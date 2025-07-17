import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { Button } from "@mantine/core";
import "../styles/LandingStyles.css";
import Footer from "../components/Footer";

const Card = ({ title, description, imageSrc, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, delay: index * 0.2 }}
      className="flex h-auto w-full flex-col items-center justify-between overflow-hidden rounded-3xl border border-[#14b82c] bg-[#e6fde9] px-[90.28px] pt-14 sm:rounded-[5vh] md:h-[520px] lg:h-[580px]"
    >
      <div className="flex flex-col items-center space-y-2 sm:space-y-3">
        <h2 className="text-center text-[32px] font-bold text-[#042f0c]">
          {title}
        </h2>
        <p className="max-w-prose text-center text-xl font-normal text-[#3d3d3d]">
          {description}
        </p>
      </div>

      <div className="relative mt-4 flex w-full flex-grow items-end justify-center">
        <img
          alt={title}
          src={imageSrc}
          className="h-auto max-h-[220px] w-auto max-w-full object-contain sm:max-h-[250px] md:max-h-[280px] lg:max-h-[300px]"
        />
      </div>
    </motion.div>
  );
};

const features = [
  "10 Live 1:1 Classes with certified tutors",
  "Unlimited Group Conversation Classes led by instructors",
  "Personalized Learning Plan based on your fluency goals",
  "We match you with a personal language partner to practice conversation.",
  "Saved Resources tailored to your study plan",
  "24/7 AI SuperTutor for continuous language practice",
  "Direct Support from the bammbuu team",
  "Money-Back Guarantee if your goals aren't met*",
];

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);
  return isMobile;
}

const Landing = () => {
  const { user } = useAuth();

  return (
    <>
      <Navbar user={user} />
      <div className="overflow-hidden">
        {/* section 1 */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="section1-background mt-8 flex flex-col items-center justify-center space-y-8 rounded-3xl border-b-4 border-[#B9F9C2] lg:mt-16 lg:space-y-16 lg:rounded-[20vh]"
        >
          <div className="mt-6 flex flex-col items-center justify-center space-y-4">
            <h1 className="text-center text-[64px] font-extrabold leading-tight text-[#042F0C]">
              Level-up your language
              <br /> learning today.
            </h1>
            <h1 className="text-center text-[32px] font-medium text-[#042F0C]">
              Learn a new language. Practice through conversation.
            </h1>
          </div>
          <div className="">
            <img
              alt="bambuu"
              src="/images/landing-section1-1.png"
              className="h-auto w-full"
            />
          </div>
        </motion.div>

        {/* section 2 */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-20 mt-20 flex flex-col items-start justify-between space-y-8 px-20 lg:mb-32 lg:mt-40 lg:flex-row lg:space-y-0"
        >
          <h1 className="w-full text-left text-3xl font-semibold text-black lg:w-1/2 lg:text-6xl">
            About bammbuu
          </h1>
          <h1 className="w-full text-left text-xl text-[#3d3d3d] lg:w-1/2 lg:text-2xl">
            Learning a new language? Need someone to practice with? bammbuu was
            created by language learners, for language learners. We believe that
            language is best learned through conversation and in community. Join
            today to connect with native speakers, practice conversation in a
            community, and learn from certified language instructors.
            <br />
            <span className="font-semibold text-[#3d3d3d]">
              bammbuu is a safe place to practice.
            </span>
          </h1>
        </motion.div>

        {/* section 3 - Cards */}
        <div className="mx-auto mb-16 px-20 lg:mb-32">
          <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 md:gap-4 lg:gap-5">
            <Card
              index={0}
              title="Explore conversation classes & groups"
              description="We believe that language is best learned through conversation and in community. Join a language group and practice through conversation for free today."
              imageSrc="/images/landing-card1.png"
            />
            <Card
              index={1}
              title="Connect with real people"
              description="Practice speaking with native speakers in real-time. Improve your fluency and confidence through interactive 1:1 conversations that bring the language to life."
              imageSrc="/images/landing-card2.png"
            />
            <Card
              index={2}
              title="Learn from certified language instructors"
              description="Find a certified language instructor to help you reach your goals through 1:1 private classes. Later, you can practice with a language conversation group."
              imageSrc="/images/landing-card3.png"
            />
            <Card
              index={3}
              title="Meet SuperTutor"
              description="Your personal AI language tutor that is available to help you practice conversation 24/7. SuperTutor adapts to your learning style to help you improve and build confidence."
              imageSrc="/images/landing-card4.png"
            />
          </div>
        </div>

        {/* section 5 */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mx-20 mb-8 flex flex-col items-center justify-center space-y-6 rounded-3xl border border-[#14b82c] bg-[#e6fde9] pt-16 lg:space-y-10 lg:rounded-[6vh] lg:pt-28"
        >
          <h1 className="px-4 text-center text-3xl font-semibold text-black lg:text-6xl">
            The bammbuu mobile version
            <br /> is coming soon!
          </h1>
          <Button
            className="border-2 border-black text-black"
            size="xl"
            variant="filled"
            color="#ffbf00"
            radius="xl"
          >
            Coming Soon!
          </Button>
          <img
            alt="bambuu"
            src="/svgs/new1.svg"
            className="h-auto lg:w-[50vh]"
          />
        </motion.div>
      </div>
      <Footer />
    </>
  );
};

export default Landing;
