// // src/pages/Landing.js
// import React from "react";
// import Navbar from "../components/Navbar";
// import { useAuth } from "../context/AuthContext";
// import { db, auth } from "../firebaseConfig";
// import { IoSearchOutline } from "react-icons/io5";
// import { TextInput, Button } from "@mantine/core";
// import "../styles/LandingStyles.css";
// import Footer from "../components/Footer";

// const Landing = () => {
//   const { user } = useAuth(); // Get the user from AuthContext

//   const cardData = [
//     {
//       title: "AI SuperTutor",
//       description:
//         "Join live webinars conducted by subject matter experts, where they delve into specific topics, and answer questions from participants.",
//       imageUrl: "/images/landing-card-1.png",
//     },
//     {
//       title: "Language Exchange",
//       description:
//         "Connect with native speakers to practice your language skills in a friendly environment.",
//       imageUrl: "/images/landing-card-2.png",
//     },
//     {
//       title: "Certified Instructors",
//       description:
//         "Learn from certified instructors with experience in language teaching and cultural exchange.",
//       imageUrl: "/images/landing-card-3.png",
//     },
//     {
//       title: "AI SuperTutor",
//       description:
//         "Join live webinars conducted by subject matter experts, where they delve into specific topics, and answer questions from participants.",
//       imageUrl: "/images/landing-card-1.png",
//     },
//     {
//       title: "Language Exchange",
//       description:
//         "Connect with native speakers to practice your language skills in a friendly environment.",
//       imageUrl: "/images/landing-card-2.png",
//     },
//     {
//       title: "Certified Instructors",
//       description:
//         "Learn from certified instructors with experience in language teaching and cultural exchange.",
//       imageUrl: "/images/landing-card-3.png",
//     },
//   ];

//   const instructors = [
//     { id: 1, img: "/images/ins-1.png" },
//     { id: 2, img: "/images/ins-2.png" },
//     { id: 3, img: "/images/ins-3.png" },
//     { id: 4, img: "/images/ins-4.png" },
//     { id: 5, img: "/images/ins-5.png" },
//     { id: 6, img: "/images/ins-6.png" },
//     { id: 7, img: "/images/ins-7.png" },
//     { id: 8, img: "/images/ins-1.png" },
//     { id: 9, img: "/images/ins-2.png" },
//     { id: 10, img: "/images/ins-3.png" },
//     { id: 11, img: "/images/ins-4.png" },
//     { id: 12, img: "/images/ins-5.png" },
//     { id: 13, img: "/images/ins-6.png" },
//     { id: 14, img: "/images/ins-7.png" },
//     { id: 15, img: "/images/ins-1.png" },
//     { id: 16, img: "/images/ins-2.png" },
//   ];

//   return (
//     <>
//       <Navbar user={user} />
//       <div>
//         <div className="flex items-center justify-center pb-4 ">
//           <div className="items-center flex-grow hidden w-full max-w-lg mx-4 md:flex">
//             <TextInput
//               placeholder="Ask SuperTutor"
//               radius="md"
//               size="lg"
//               styles={{
//                 input: {
//                   borderColor: "#14B82C",
//                   borderWidth: "1px",
//                 },
//               }}
//               leftSection={
//                 <IoSearchOutline className="text-3xl text-green-500" />
//               }
//               className="w-full border-green-500"
//             />
//           </div>
//         </div>

//         <div
//           className="relative  flex items-center justify-start h-[60vh] md:h-[85vh] px-4 md:px-10 text-white bg-center bg-cover"
//           style={{
//             backgroundImage: `url('/images/landing-1.png')`,
//           }}
//         >
//           <div className="max-w-3xl p-4 space-y-6 md:max-w-5xl md:p-8 md:space-y-10">
//             <h1 className="mb-4 text-4xl font-bold md:text-6xl">
//               Learn your new language
//             </h1>
//             <p className="mb-6 text-lg md:text-3xl">
//               Learn a new language and practice through conversation with native
//               speakers, language learners, and certified instructors. bammbuu is
//               a safe place to practice.
//             </p>
//             <Button
//               className="px-4 py-2 font-bold text-white bg-green-500 hover:bg-green-600 md:px-6 md:py-2"
//               size="xl"
//               radius="xl"
//             >
//               Get Started
//             </Button>
//           </div>
//         </div>

//         {/* Section 2 */}
//         <div className="flex flex-col items-center justify-center px-2 px-4 pt-10 md:pt-20">
//           <div className="max-w-3xl p-4 space-y-6 text-center md:max-w-5xl md:p-8 md:space-y-10">
//             <h1 className="mb-4 text-4xl md:text-6xl font-bold text-[#444444]">
//               Practice Languages
//             </h1>
//             <p className="mb-6 text-lg md:text-3xl text-[#444444]">
//               Learn a new language with certified language instructors. Practice
//               what you’ve learned with native speakers and language learners
//               through live conversation.
//             </p>
//           </div>
//           <div className="flex flex-wrap items-center justify-center gap-6 py-10 md:py-20">
//             {cardData.map((card, index) => (
//               <div
//                 key={index}
//                 className="flex-shrink-0 w-64 overflow-hidden transition-transform duration-300 transform bg-white rounded-lg shadow-md md:w-80 hover:scale-105 hover:shadow-lg"
//               >
//                 <img
//                   className="object-cover w-full h-40 sm:h-48 md:h-56 lg:h-64"
//                   src={card.imageUrl}
//                   alt={card.title}
//                 />
//                 <div className="flex flex-col justify-between h-40 p-4 sm:h-44 md:h-48 lg:h-52">
//                   <div>
//                     <h2 className="mb-2 text-base font-semibold sm:text-lg md:text-xl lg:text-2xl">
//                       {card.title}
//                     </h2>
//                     <p className="mb-4 text-xs text-gray-600 sm:text-sm md:text-md truncate-text">
//                       {card.description}
//                     </p>
//                   </div>
//                   <a
//                     href="#"
//                     className="text-sm font-bold text-green-600 hover:underline md:text-lg lg:text-xl"
//                   >
//                     Learn More
//                   </a>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Section 4 */}
//         <div
//           className="relative flex items-center justify-start h-[55vh] md:h-[75vh] px-4 md:px-10 text-white bg-center bg-cover"
//           style={{
//             backgroundImage: `url('/images/landing-2.png')`,
//           }}
//         >
//           <div className="max-w-3xl p-4 space-y-6 md:max-w-5xl md:p-8 md:space-y-10">
//             <h1 className="mb-4 text-4xl font-bold md:text-6xl">
//               Practice languages{" "}
//             </h1>
//             <p className="mb-6 text-lg md:text-3xl">
//               Practice conversation 24/7 on demand with bammbuu SuperTutor.
//             </p>
//             <Button
//               className="px-4 py-2 font-bold text-black bg-white hover:bg-gray-200 hover:text-black md:px-6 md:py-2"
//               size="lg"
//               radius="xl"
//             >
//               Learn More{" "}
//             </Button>
//           </div>
//         </div>

//         {/* section 5 */}

//         <div className="px-4 pt-20 space-y-20">
//           <h1 className="mb-4 text-4xl md:text-6xl text-center font-bold text-[#444444]">
//             Why practice languages with bammbuu{" "}
//           </h1>

//           <div className="flex flex-col items-center justify-center space-y-10 md:flex-row md:-space-x-16 md:space-y-0">
//             <div className="flex flex-col items-center justify-between space-y-10">
//               <div className="py-10 px-8 bg-[#f2f2f2] rounded-lg shadow-lg w-full md:w-[45vh] text-center md:text-left border-2 border-[#cecece]">
//                 <h3 className="mb-4 text-2xl font-semibold">
//                   Intelligent Conversational Interface
//                 </h3>
//                 <p className="text-lg text-gray-600">
//                   Edi can engage in natural language conversations with users,
//                   understanding their queries and providing accurate and
//                   relevant responses in real-time.
//                 </p>
//               </div>
//               <div className="py-10 px-8 bg-[#f2f2f2] rounded-lg shadow-lg w-full md:w-[45vh] text-center md:text-left border-2 border-[#cecece]">
//                 <h3 className="mb-4 text-2xl font-semibold">
//                   Adaptive Learning Algorithms
//                 </h3>
//                 <p className="text-lg text-gray-600">
//                   Edi utilizes adaptive learning algorithms to analyze user
//                   performance, identify areas of improvement, and recommend
//                   targeted resources or practice materials.
//                 </p>
//               </div>
//             </div>

//             <div className="transition-transform transform hover:scale-105">
//               <img
//                 alt="owl"
//                 src="/images/Owl.png"
//                 className="h-auto max-w-full"
//               />
//             </div>

//             <div className="flex flex-col items-center justify-between space-y-10">
//               <div className="py-10 px-8 bg-[#f2f2f2] rounded-lg shadow-lg w-full md:w-[45vh] text-center md:text-left border-2 border-[#cecece]">
//                 <h3 className="mb-4 text-2xl font-semibold">
//                   Progress Tracking and Feedback
//                 </h3>
//                 <p className="text-lg text-gray-600">
//                   Tracks and analyzes user progress, providing feedback on
//                   performance, strengths, and areas needing improvement. It
//                   offers personalized recommendations for further study.
//                 </p>
//               </div>
//               <div className="py-10 px-8 bg-[#f2f2f2] rounded-lg shadow-lg w-full md:w-[45vh] text-center md:text-left border-2 border-[#cecece]">
//                 <h3 className="mb-4 text-2xl font-semibold">
//                   Study Reminders and Scheduling
//                 </h3>
//                 <p className="text-lg text-gray-600">
//                   Sends reminders, suggests study schedules to help users stay
//                   organized and maintain a consistent learning routine,
//                   available around the clock 24/7.
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Section 6 */}
//         <div className=" bg-[#f2f2f2] flex flex-col items-center justify-center py-20 mt-20 space-y-6">
//           <h1 className="mb-4 text-4xl font-semibold md:text-6xl text-[#444444]">
//             bammbuu+{" "}
//           </h1>
//           <p className="mb-6 text-lg md:text-2xl text-[#444444]">
//             Discover the membership that suits your learning needs, flexible
//             learning and cancellation options.{" "}
//           </p>
//           <p className="mb-6 text-[#444444] font-semibold text-lg md:text-3xl">
//             Starting at $59/mo{" "}
//           </p>
//           <div>
//             <Button size="lg" radius="xl" color="#14B82C" className="mt-6">
//               Subscribe{" "}
//             </Button>
//           </div>
//         </div>

//         {/* section 7 */}
//         <div className="flex mb-20 flex-col items-center justify-center px-6 py-12 md:px-12 lg:px-20 mx-4 md:mx-10 lg:mx-20 mt-12 md:mt-16 lg:mt-20 text-white bg-[#090909] rounded-3xl">
//           <div className="grid grid-cols-3 gap-4 mb-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9">
//             {instructors.map((instructor) => (
//               <div
//                 key={instructor.id}
//                 className="w-24 h-24 overflow-hidden rounded-full sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-40 lg:h-40 "
//               >
//                 <img
//                   src={instructor.img}
//                   alt={`Instructor ${instructor.id}`}
//                   className="w-full h-full "
//                 />
//               </div>
//             ))}
//           </div>
//           <p className="mt-8 mb-4 text-xl font-semibold text-left sm:text-2xl md:text-3xl">
//             bambbuu+ offers 1:1 live classes with certified language
//             instructors.
//           </p>
//           <Button
//             className="mt-6 text-black bg-white hover:bg-gray-200 hover:text-black"
//             size="xl"
//             radius="xl"
//           >
//             View instructors
//           </Button>
//         </div>
//       </div>
//       <Footer />
//     </>
//   );
// };

// export default Landing;

// src/pages/Landing.js
// import React from "react";
// import Navbar from "../components/Navbar";
// import { useAuth } from "../context/AuthContext";
// import { db, auth } from "../firebaseConfig";
// import { IoSearchOutline } from "react-icons/io5";
// import { TextInput, Button } from "@mantine/core";
// import "../styles/LandingStyles.css";
// import Footer from "../components/Footer";

// const Landing = () => {
//   const { user } = useAuth(); // Get the user from AuthContext

//   return (
//     <>
//       <Navbar user={user} />
//       <div>
//         {/* section 1 */}
//         <div className="flex section1-background flex-col items-center justify-center  space-y-16 border-b-8 rounded-[20vh] border-[#B9F9C2] mt-16">
//           <div className="flex flex-col items-center justify-center mt-6 space-y-4">
//             <h1 className="text-6xl font-bold text-center text-black">
//               Level-up your language
//               <br /> learning today.
//             </h1>
//             <h1 className="text-2xl text-center text-black">
//               Learn a new language. Practice through conversation.{" "}
//             </h1>
//           </div>

//           <div>
//             <img
//               alt="bambuu"
//               src="/images/landing-section1-1.png"
//               className="w-full h-auto"
//             />
//           </div>
//         </div>

//         {/* section 2 */}

//         <div className="flex flex-row items-start justify-between mt-56 mb-40 px-28">
//           <h1 className="w-1/2 text-6xl font-semibold text-left text-black">
//             About bammbuu
//           </h1>
//           <h1 className="w-1/2 text-2xl text-left text-[#3d3d3d]">
//             Learning a new language? Need someone to practice with? bammbuu was
//             created by language learners, for language learners. We believe that
//             language is best learned through conversation and in community. Join
//             today to connect with native speakers, practice conversation in a
//             community, and learn from certified language instructors.
//             <br />
//             <span className="font-semibold text-[#3d3d3d]">
//               {" "}
//               bammbuu is a safe place to practice.{" "}
//             </span>
//           </h1>
//         </div>
//         {/* section 3 */}
//         <div className="flex flex-col items-center justify-center mb-40 space-y-12 px-28">
//           {/* cards */}

//           <div className="flex flex-row items-center justify-center space-x-12">
//             <div className="w-1/2 flex h-[100vh] flex-col justify-center items-center border-2 space-y-10 border-[#14b82c] rounded-[8vh] bg-[#e6fde9] px-20 pt-28">
//               <h1 className="text-4xl font-semibold text-center text-[#042f0c]">
//                 Explore conversation classes &<br /> groups
//               </h1>

//               <h1 className="text-2xl text-center text-[#3d3d3d]">
//                 We believe that language is best learned through conversation
//                 and in community. Join a language group and practice through
//                 conversation for free today.
//               </h1>

//               <img
//                 alt="bambuu"
//                 src="/images/landing-card1.png"
//                 className="w-auto h-full"
//               />
//             </div>
//             <div className="w-1/2 flex flex-col h-[100vh] justify-center items-center border-2 space-y-10 border-[#14b82c] rounded-[8vh] bg-[#e6fde9] px-20 pt-28">
//               <h1 className="text-4xl font-semibold text-center text-[#042f0c]">
//                 Connect with real people{" "}
//               </h1>

//               <h1 className="text-2xl text-center text-[#3d3d3d]">
//                 Practice speaking with native speakers in real-time. Improve
//                 your fluency and confidence through interactive 1:1
//                 conversations that bring the language to life.
//               </h1>

//               <img
//                 alt="bambuu"
//                 src="/images/landing-card2.png"
//                 className="w-auto h-full"
//               />
//             </div>
//           </div>
//           <div className="flex flex-row items-center justify-center space-x-12">
//             <div className="w-1/2 flex flex-col h-[100vh] justify-center items-center border-2 space-y-10 border-[#14b82c] rounded-[8vh] bg-[#e6fde9] px-20 pt-28">
//               <h1 className="text-4xl font-semibold text-center text-[#042f0c]">
//                 Learn from certified <br />
//                 language instructors{" "}
//               </h1>

//               <h1 className="text-2xl text-center text-[#3d3d3d]">
//                 Find a certified language instructor to help you reach your
//                 goals through 1:1 private classes. Later, you can practice with
//                 a language conversation group.
//               </h1>

//               <img
//                 alt="bambuu"
//                 src="/images/landing-card3.png"
//                 className="w-auto h-full"
//               />
//             </div>
//             <div className="w-1/2 flex flex-col h-[100vh] justify-center items-center border-2 space-y-10 border-[#14b82c] rounded-[8vh] bg-[#e6fde9] px-20 pt-28">
//               <h1 className="text-4xl font-semibold text-center text-[#042f0c]">
//                 Meet SuperTutor{" "}
//               </h1>

//               <h1 className="text-2xl text-center text-[#3d3d3d]">
//                 Your personal AI language tutor that is available to help you
//                 practice conversation 24/7. SuperTutor adapts to your learning
//                 style to help you improve and build confidence.
//               </h1>

//               <img
//                 alt="bambuu"
//                 src="/images/landing-card4.png"
//                 className="w-auto h-full"
//               />
//             </div>
//           </div>
//         </div>

//         {/* section 4 */}

//         <div className="flex flex-col items-center justify-center mt-56 space-y-12 mb-28">
//           <h1 className="text-6xl font-semibold text-center text-black">
//             Download Mobile App
//           </h1>
//           <img
//             alt="bambuu"
//             src="/images/qr-code.png"
//             className="w-auto h-full"
//           />
//           <div className="flex flex-row items-center justify-center space-x-6">
//             <img
//               alt="bambuu"
//               src="/images/apple-button.png"
//               className="w-auto h-full hover:cursor-pointer"
//             />
//             <img
//               alt="bambuu"
//               src="/images/playstore-button.png"
//               className="w-auto h-full hover:cursor-pointer"
//             />
//           </div>
//         </div>

//         {/* section 5 */}

//         <div className="flex flex-col items-center justify-center rounded-[6vh] border-2 border-[#14b82c] bg-[#e6fde9] pt-28 mx-28 space-y-10">
//           <h1 className="text-6xl font-semibold text-center text-black">
//             The bammbuu web version
//             <br /> is coming soon!{" "}
//           </h1>

//           <Button
//             className="text-black border-2 border-black"
//             size="xl"
//             variant="filled"
//             color="#ffbf00"
//             radius="xl"
//           >
//             {" "}
//             Coming Soon!
//           </Button>

//           <img
//             alt="bambuu"
//             src="/images/landing-laptop.png"
//             className="w-[150vh] h-auto"
//           />
//         </div>
//       </div>
//       <Footer />
//     </>
//   );
// };

// export default Landing;

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
      className="w-full md:w-1/2  flex h-[100vh] flex-col justify-center items-center border-2 space-y-10 border-[#14b82c] rounded-[8vh] bg-[#e6fde9] px-20 pt-28"
    >
      <h1 className="text-2xl lg:text-4xl font-semibold text-center text-[#042f0c]">
        {title}
      </h1>
      <h1 className="text-lg lg:text-2xl text-center text-[#3d3d3d]">
        {description}
      </h1>
      <img alt="bambuu" src={imageSrc} className="w-auto h-full" />
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
          className="flex flex-col items-start justify-between px-6 mt-20 mb-20 space-y-8 lg:flex-row lg:mt-56 lg:mb-40 lg:px-28 lg:space-y-0"
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
        <div className="flex flex-col items-center justify-center px-4 mb-20 space-y-8 lg:mb-40 lg:space-y-12 lg:px-28">
          <div className="flex flex-col items-center justify-center space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
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
          </div>
          <div className="flex flex-col items-center justify-center space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
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

        {/* section 4 */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center justify-center px-4 mt-20 mb-20 space-y-8 lg:mt-56 lg:space-y-12 lg:mb-28 lg:px-0"
        >
          <h1 className="text-3xl font-semibold text-center text-black lg:text-6xl">
            Download Mobile App
          </h1>
          <img
            alt="bambuu"
            src="/images/qr-code.png"
            className="w-64 h-auto lg:w-auto"
          />
          <div className="flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-6">
            <img
              alt="bambuu"
              src="/images/apple-button.png"
              className="w-48 h-auto sm:w-auto hover:cursor-pointer"
            />
            <img
              alt="bambuu"
              src="/images/playstore-button.png"
              className="w-48 h-auto sm:w-auto hover:cursor-pointer"
            />
          </div>
        </motion.div>

        {/* section 5 */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center justify-center rounded-3xl lg:rounded-[6vh] border-2 border-[#14b82c] bg-[#e6fde9] pt-16 lg:pt-28 mx-4 lg:mx-28 space-y-6 lg:space-y-10 mb-8"
        >
          <h1 className="px-4 text-3xl font-semibold text-center text-black lg:text-6xl">
            The bammbuu web version
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
            src="/images/landing-laptop.png"
            className="w-full lg:w-[150vh] h-auto"
          />
        </motion.div>
      </div>
      <Footer />
    </>
  );
};

export default Landing;
