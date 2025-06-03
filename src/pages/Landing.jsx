import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import "../styles/LandingStyles.css";
import Footer from "../components/Footer";
import { Info, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Card = ({ icon, title, description, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, delay: index * 0.1 }}
      className="flex flex-col items-center rounded-[48px] border border-[#14B82C] bg-[#F0FDF1] p-8 text-center"
    >
      {icon && <img src={icon} alt="card-icon" className="mb-4 h-10" />}
      <div className="mb-2 flex items-center justify-center gap-2">
        <h3 className="text-[32px] font-bold text-[#042F0C]">{title}</h3>
      </div>
      <p className="text-xl font-normal text-[#3d3d3d]">{description}</p>
    </motion.div>
  );
};

const features = [
  "10 Live 1:1 Classes with certified tutors",
  "Unlimited Group Conversation Classes led by instructors",
  "Personalized Learning Plan based on your fluency goals",
  "Saved Resources tailored to your study plan",
  "24/7 AI SuperTutor for continuous language practice",
  "Direct Support from the bammbuu team",
  "Money-Back Guarantee if your goals aren't met*",
];

const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <Navbar user={user} />
      <div className="overflow-hidden">
        {/* section 1 */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mt-8 flex flex-col items-center justify-center space-y-8 rounded-3xl px-4 lg:mt-16 lg:space-y-16 lg:rounded-[20vh] lg:px-0"
        >
          <div className="mt-6 flex flex-col items-center justify-center space-y-4">
            <h1 className="text-center text-3xl font-bold text-black lg:text-6xl">
              Immersive Exam
              <br /> Preparation Package
            </h1>
            <h1 className="text-center text-xl font-medium text-black lg:text-2xl">
              Ditch the dry drills. Learn through real conversation, gain
              confidence, and <br />
              unlock the opportunities you deserve.
            </h1>
            <div className="mt-6 flex flex-row gap-5 text-base font-medium text-black">
              <button className="rounded-full border border-black px-6 py-2 text-black transition hover:bg-gray-100">
                Schedule a Call
              </button>
              <button
                className="rounded-full border border-[black] bg-[#FFBF00] px-6 py-2 text-base font-medium text-black transition hover:bg-[#ffd94d]"
                onClick={() => navigate("/subscriptions")}
              >
                Enroll Today
              </button>
            </div>
          </div>
          <div className="mt-10 flex w-full flex-col items-center">
            <div className="flex max-h-[720px] w-full max-w-[1280px] items-center justify-center rounded-[3rem] bg-[#eaeaea] text-5xl font-medium text-[#b3b3b3] lg:h-[720px]">
              <iframe
                width="100%"
                height="100%"
                style={{
                  minHeight: 320,
                  minWidth: 320,
                  aspectRatio: "16/9",
                  borderRadius: "2rem",
                }}
                src="https://www.youtube.com/embed/W8qJOBrmNkw"
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </div>
            <div className="mt-4 w-full text-center">
              <span className="text-base font-normal italic text-[#5D5D5D]">
                Watch how bammbuu transforms exam prep into an experience.
              </span>
            </div>
          </div>
        </motion.div>

        {/* section 2 */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-20 mt-20 flex flex-col items-center justify-center space-y-6 px-4 lg:mb-32 lg:mt-40 lg:px-0"
        >
          <h1 className="w-full text-center font-semibold text-black lg:text-[56px]">
            Why Choose bammbuu?
          </h1>
          <p className="mx-auto text-center text-lg font-normal text-[#3d3d3d] lg:text-xl">
            Whether you're preparing for Spanish proficiency exams like DELE and
            SIELE, or aiming for top <br /> scores in English assessments such
            as IELTS and TOEFL, bammbuu provides the expert support <br /> you
            need. We also help learners succeed in university admissions and
            employment entrance <br /> exams by focusing on real-world
            communication and tailored study plans.
          </p>
        </motion.div>

        {/* section 3 - Cards */}
        <div className="mx-auto mb-16 max-w-7xl px-4 lg:mb-32 lg:px-6 xl:px-8">
          {/* First row: 3 cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card
              index={0}
              icon="/svgs/conversation-first.svg"
              title="Conversation First"
              description="We prioritize real speaking practice over rote memorization to help you build fluency fast."
            />
            <Card
              index={1}
              icon="/svgs/personalized-plans.svg"
              title="Personalized Plans"
              description="Every learner gets a custom plan built around their exam goals and speaking level."
            />
            <Card
              index={2}
              icon="/svgs/certified-experts.svg"
              title="Certified Experts"
              description="Learn from qualified tutors and native speakers with proven experience in language instruction."
            />
          </div>
          {/* Second row: 2 cards */}
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card
              index={3}
              icon="/svgs/all-one.svg"
              title="All-in-One Tool"
              badge="PRO"
              description="Practice anytime with SuperTutor AI, join live group classes, and access saved learning materials."
            />
            <Card
              index={4}
              icon="/svgs/confidence-guarantee.svg"
              title="Confidence Guarantee"
              description="Our plan works — or you get your money back after completing the recommended program.*"
            />
          </div>
        </div>

        {/* section 4 */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-10 mt-40 flex flex-col items-center justify-center space-y-6 px-4 lg:mb-10 lg:mt-40 lg:px-0"
        >
          <div className="min-h-screen px-4">
            <div className="mx-auto max-w-6xl">
              <h1 className="mb-16 text-center font-semibold text-black lg:text-[56px]">
                What You'll Get in the Package
              </h1>

              <div className="flex flex-col items-start gap-12 lg:flex-row lg:gap-16">
                {/* Left Side - Features List */}
                <div className="flex-1">
                  <div className="mb-8 space-y-4">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <img
                          src="/svgs/tick-star.svg"
                          alt="Check"
                          className="mr-1"
                        />
                        <span className="text-2xl font-medium text-[#042F0C]">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Disclaimer Box */}
                  <div className="flex items-start gap-3 rounded-xl bg-[#FFFFEA] p-4 text-sm font-normal text-[#3D3D3D]">
                    <div className="mt-0.5 h-5 w-5 flex-shrink-0">
                      <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#FFBF00]" />
                    </div>
                    <div className="italic">
                      *Our money-back guarantee requires you to complete the
                      bammbuu recommended plan. If your br language goal, as
                      discussed in your intro call, isn't met after 2 months of
                      our Immersive Exam Prep plan — including all 10 1:1
                      classes and 3 live group sessions per month — we'll refund
                      you.
                    </div>
                  </div>
                </div>

                {/* Right Side - Pricing Card */}
                <div className="w-full max-w-md flex-shrink-0">
                  <div className="overflow-hidden rounded-[48px] border border-[#14B82C] bg-[#E6FDE9] shadow-lg lg:h-[500px]">
                    {/* Header */}
                    <div className="bg-[#FFBF00] px-6 py-3 text-center">
                      <span className="text-base font-semibold text-black">
                        Language Exams Package
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-8">
                      {/* Price */}
                      <div className="mb-6 text-center">
                        <div className="mb-1 text-[56px] font-semibold text-black">
                          $499
                        </div>
                        <div className="mb-2 text-2xl font-semibold text-black">
                          1 Month of Access
                        </div>
                        <div className="text-lg font-normal text-black">
                          Includes all listed features for intensive
                          preparation.
                        </div>
                      </div>

                      {/* Notice */}
                      <div className="mb-6 flex flex-col items-center gap-2 text-xs text-black">
                        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#FFBF00]" />
                        <span className="text-center">
                          Package do not automatically renew. We recommend 2
                          months of this <br />
                          package to achieve best results.
                        </span>
                      </div>

                      {/* Buttons */}
                      <div className="space-y-3">
                        <button className="w-full rounded-full border border-[#042F0C] bg-[#14B82C] px-6 py-2 text-lg font-semibold text-black transition-colors hover:bg-green-700">
                          Enroll Today
                        </button>
                        <button className="w-full bg-transparent px-6 py-2 text-base font-semibold text-[#12551E] transition-colors hover:bg-green-50">
                          Schedule an Informational Call
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* section 5 */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mx-auto mb-10 max-w-7xl px-4"
        >
          <h1 className="mb-12 text-center font-semibold text-black lg:text-[56px]">
            Real Learners. Real Results.
          </h1>
          <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Testimonial 1 */}
            <div className="rounded-2xl border border-[#f3f3f3] bg-[#fff] p-6 text-left shadow-sm">
              <p className="mb-4 text-base italic text-[#222]">
                “As a non-native English teacher, I needed to pass IELTS with a
                high score. Bammbuu gave me the structure, feedback, and
                motivation I was missing. The live sessions were a
                game-changer.”
              </p>
              <div className="text-sm font-medium text-[#888]">
                Beatrice R.,
                <br />
                Aspiring English Teacher (IELTS Academic)
              </div>
            </div>
            {/* Testimonial 2 */}
            <div className="rounded-2xl border border-[#f3f3f3] bg-[#fff] p-6 text-left shadow-sm">
              <p className="mb-4 text-base italic text-[#222]">
                “I used Bammbuu to prep for my Duolingo exam. It was actually
                fun — and I scored way higher than I forecasted. Now I’m ready
                for university!”
              </p>
              <div className="text-sm font-medium text-[#888]">
                Hernán M.,
                <br />
                International Learner (Duolingo English Test)
              </div>
            </div>
            {/* Testimonial 3 */}
            <div className="rounded-2xl border border-[#f3f3f3] bg-[#fff] p-6 text-left shadow-sm">
              <p className="mb-4 text-base italic text-[#222]">
                “Thanks to bammbuu, I finally felt confident in IELTS! The
                classes were incredible and working with real tutors helped me
                fix my four problem areas in writing and speaking. And
                SuperTutor gave me 24/7 practice. I improved my speaking score
                by 4 points in just 6 weeks! The feedback and resources made
                learning fun and stress-free.”
              </p>
              <div className="text-sm font-medium text-[#888]">
                Priya S.,
                <br />
                Working Professional (TOEFL)
              </div>
            </div>
            {/* Testimonial 4 */}
            <div className="rounded-2xl border border-[#f3f3f3] bg-[#fff] p-6 text-left shadow-sm">
              <p className="mb-4 text-base italic text-[#222]">
                “The structure of the course made it easy to balance with my
                full-time job. SuperTutor was so helpful for practicing on my
                commute — and the live 1:1 help was amazing.”
              </p>
              <div className="text-sm font-medium text-[#888]">
                Yuki Tanaka,
                <br />
                Test Taker (TOEIC)
              </div>
            </div>
            {/* Testimonial 5 */}
            <div className="rounded-2xl border border-[#f3f3f3] bg-[#fff] p-6 text-left shadow-sm">
              <p className="mb-4 text-base italic text-[#222]">
                “I wanted to apply for jobs abroad and become more fluent, but
                grammar left me behind. Bammbuu: I learned how to actually
                communicate. Now I feel prepared for interviews in English.”
              </p>
              <div className="text-sm font-medium text-[#888]">
                Oscar Chang,
                <br />
                Business English Track
              </div>
            </div>
            {/* Testimonial 6 */}
            <div className="rounded-2xl border border-[#f3f3f3] bg-[#fff] p-6 text-left shadow-sm">
              <p className="mb-4 text-base italic text-[#222]">
                “Bammbuu helped me break my fear of speaking. After just a few
                sessions, I nailed my IELTS exam feeling confident — and now I
                use English at work!”
              </p>
              <div className="text-sm font-medium text-[#888]">
                Linh N.,
                <br />
                University Applicant (IELTS)
              </div>
            </div>
            {/* Testimonial 7 */}
            <div className="rounded-2xl border border-[#f3f3f3] bg-[#fff] p-6 text-left shadow-sm">
              <p className="mb-4 text-base italic text-[#222]">
                “I was stuck at 22 in speaking for months. The feedback and
                practice finally pushed me to 27. I’m so grateful for the
                support!”
              </p>
              <div className="text-sm font-medium text-[#888]">
                Diego F.,
                <br />
                TOEFL Student
              </div>
            </div>
            {/* Testimonial 8 */}
            <div className="rounded-2xl border border-[#f3f3f3] bg-[#fff] p-6 text-left shadow-sm">
              <p className="mb-4 text-base italic text-[#222]">
                “I failed my first exam because I wasn’t confident. Bammbuu’s
                live sessions showed me exactly what examiners wanted. I passed
                — with a smile!”
              </p>
              <div className="text-sm font-medium text-[#888]">
                Roxana G.,
                <br />
                Exam Candidate
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center gap-4 md:flex-row">
            <button className="rounded-full border border-black bg-white px-6 py-2 text-base font-medium text-black transition hover:bg-gray-100">
              Schedule a Call
            </button>
            <button className="rounded-full border border-black bg-[#FFBF00] px-6 py-2 text-base font-medium text-black transition hover:bg-[#ffd94d]">
              Enroll Today
            </button>
          </div>
        </motion.div>

        {/* section 6 */}
        {/* <motion.div
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mx-4 mb-8 flex flex-col items-center justify-center space-y-6 rounded-3xl border-2 border-[#14b82c] bg-[#e6fde9] pt-16 lg:mx-28 lg:space-y-10 lg:rounded-[6vh] lg:pt-28"
        >
          <h1 className="px-4 text-center text-3xl font-semibold text-black lg:text-6xl">
            Download the app now
          </h1>
          <div className="mb-2 mt-2 flex flex-row gap-4">
            <a
              href="https://apps.apple.com/us/app/bammbuu-language-learning/id6739758405"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="/images/apple-button.png"
                alt="Apple Store"
                className="h-12 w-auto"
              />
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=com.bammbuu.app&pli=1"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="/images/playstore-button.png"
                alt="Google Play"
                className="h-12 w-auto"
              />
            </a>
          </div>
          <img
            alt="bambuu"
            src="/svgs/new1.svg"
            className="h-auto lg:w-[50vh]"
          />
        </motion.div> */}
      </div>
      <Footer />
    </>
  );
};

export default Landing;
