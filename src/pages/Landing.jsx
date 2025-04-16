import React from "react";
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
      className="w-full flex flex-col justify-between items-center 
        border-2 border-[#14b82c] rounded-3xl sm:rounded-[5vh]
        overflow-hidden bg-[#e6fde9] px-4 sm:px-6 lg:px-6
        py-4 sm:py-6 h-auto md:h-[520px] lg:h-[580px]"
    >
      <div className="flex flex-col items-center space-y-2 sm:space-y-3">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-center text-[#042f0c]">
          {title}
        </h2>
        <p className="text-sm sm:text-base text-center text-[#3d3d3d] max-w-prose">
          {description}
        </p>
      </div>
      
      <div className="flex-grow w-full flex items-end justify-center mt-4 relative">
        <img 
          alt={title} 
          src={imageSrc} 
          className="w-auto max-w-full h-auto max-h-[220px] sm:max-h-[250px] md:max-h-[280px] lg:max-h-[300px] object-contain" 
        />
      </div>
    </motion.div>
  );
};

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
          className="flex section1-background flex-col items-center justify-center space-y-8 lg:space-y-16 border-b-8 rounded-3xl lg:rounded-[20vh] border-[#B9F9C2] mt-8 lg:mt-16 px-4 lg:px-0"
        >
          <div className="flex flex-col items-center justify-center mt-6 space-y-4">
            <h1 className="text-3xl font-bold text-center text-black lg:text-6xl">
              Level-up your language
              <br /> learning today.
            </h1>
            <h1 className="text-xl text-center text-black lg:text-2xl">
              Learn a new language. Practice through conversation.
            </h1>
          </div>
          <div className="">
            <img
              alt="bambuu"
              src="/images/landing-section1-1.png"
              className="w-full h-auto"
            />
          </div>
        </motion.div>

        {/* section 2 */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-start justify-between px-6 mt-20 mb-20 space-y-8 lg:flex-row lg:mt-40 lg:mb-32 lg:px-28 lg:space-y-0"
        >
          <h1 className="w-full text-3xl font-semibold text-left text-black lg:w-1/2 lg:text-6xl">
            About bammbuu
          </h1>
          <h1 className="w-full lg:w-1/2 text-xl lg:text-2xl text-left text-[#3d3d3d]">
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
        <div className="px-4 mb-16 lg:mb-32 lg:px-6 xl:px-8 max-w-7xl mx-auto">
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
          className="flex flex-col items-center justify-center rounded-3xl lg:rounded-[6vh] border-2 border-[#14b82c] bg-[#e6fde9] pt-16 lg:pt-28 mx-4 lg:mx-28 space-y-6 lg:space-y-10 mb-8"
        >
          <h1 className="px-4 text-3xl font-semibold text-center text-black lg:text-6xl">
            The bammbuu mobile version
            <br /> is coming soon!
          </h1>
          <Button
            className="text-black border-2 border-black"
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
            className=" lg:w-[50vh] h-auto"
          />
        </motion.div>
      </div>
      <Footer />
    </>
  );
};

export default Landing;