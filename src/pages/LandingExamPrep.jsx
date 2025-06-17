import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import "../styles/LandingStyles.css";
import Footer from "../components/Footer";
import { Info, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ComparisonTable from "../components/ComparisonTable";
import { useState, useEffect } from "react";
import MobileModal from "../components/MobileModal";
import { useLanguage } from "../context/LanguageContext";
import MobileSignupStep from "../components/mobile-flow/MobileSignupStep";
import MobileProfileStep from "../components/mobile-flow/MobileProfileStep";
import MobileSubscriptionStep from "../components/mobile-flow/MobileSubscriptionStep";
import MobileConfirmationStep from "../components/mobile-flow/MobileConfirmationStep";
import LandingMobile from "./LandingMobile";

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

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);
  return isMobile;
}

const LandingExamPrep = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [mobileModalStep, setMobileModalStep] = useState(null); // null | 'signup' | 'profile' | 'subscription' | 'confirmation'
  const { currentLanguage, changeLanguage } = useLanguage();
  const handleLanguageChange = (lang) => {
    changeLanguage(lang);
    localStorage.setItem("i18nextLng", lang);
    document.documentElement.lang = lang;
  };

  // Handle mobile modal flow completion
  const handleMobileFlowComplete = () => {
    localStorage.removeItem("inMobileModalFlow");
    navigate("/learn");
  };

  // Handle mobile modal flow close
  const handleMobileFlowClose = () => {
    localStorage.removeItem("inMobileModalFlow");
    setMobileModalStep(null);
  };

  // Render mobile landing page if on mobile
  if (isMobile) {
    return <LandingMobile />;
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Navbar user={user} />
      </motion.div>
      <div className="overflow-hidden">
        {/* section 1 */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mt-8 flex w-full flex-col items-center justify-center space-y-8 rounded-3xl lg:mt-16 lg:space-y-16 lg:rounded-[20vh] lg:px-0"
        >
          <div className="mx-auto mt-6 flex w-full flex-col items-center justify-center space-y-4">
            <h1 className="w-full text-center text-2xl font-bold text-black sm:text-3xl lg:text-6xl">
              Immersive Exam
              <br /> Preparation Package
            </h1>
            <h1 className="w-full text-center text-base font-medium text-black sm:text-lg lg:text-2xl">
              Ditch the dry drills. Learn through real conversation, gain
              confidence, and <br className="hidden sm:block" />
              unlock the opportunities you deserve.
            </h1>
            <div className="mx-auto mt-6 flex w-full flex-col items-center justify-center gap-3 text-base font-medium text-black sm:w-auto sm:flex-row sm:gap-5">
              <button
                onClick={() =>
                  window.open(
                    "https://calendly.com/bammbuu-languages/info-call-llamada-de-informacion",
                    "_blank",
                  )
                }
                className="w-full rounded-full border border-black px-6 py-2 text-black transition hover:bg-gray-100 sm:w-auto"
              >
                Schedule a Call
              </button>
              <button
                className="w-full rounded-full border border-[black] bg-[#FFBF00] px-6 py-2 text-base font-medium text-black transition hover:bg-[#ffd94d] sm:w-auto"
                onClick={() => {
                  if (isMobile) {
                    localStorage.setItem("inMobileModalFlow", "true");
                    setMobileModalStep("signup");
                  } else {
                    navigate("/signup");
                  }
                }}
              >
                Enroll Today
              </button>
            </div>
          </div>
          <div className="mx-auto mt-10 flex w-full flex-col items-center">
            <div className="flex min-h-[200px] w-full max-w-full items-center justify-center rounded-2xl bg-[#eaeaea] text-2xl font-medium text-[#b3b3b3] sm:min-h-[320px] sm:max-w-[1280px] sm:rounded-[3rem] sm:text-5xl lg:h-[720px]">
              <iframe
                width="100%"
                height="100%"
                style={{
                  minHeight: 200,
                  minWidth: 200,
                  aspectRatio: "16/9",
                  borderRadius: "1rem",
                }}
                src="https://www.youtube.com/embed/OKv2evfTpvw"
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </div>
            <div className="mt-4 w-full text-center">
              <span className="text-sm font-normal italic text-[#5D5D5D] sm:text-base">
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
          className="mx-auto mb-10 mt-10 flex w-full flex-col items-center justify-center space-y-4 sm:mb-20 sm:mt-20 sm:space-y-6 sm:px-4 lg:mb-32 lg:mt-40 lg:px-0"
        >
          <h1 className="w-full text-center text-2xl font-semibold text-black sm:text-4xl lg:text-[56px]">
            Why Choose bammbuu?
          </h1>
          <p className="mx-auto text-center text-base font-normal text-[#3d3d3d] sm:text-lg lg:text-xl">
            Whether you're preparing for Spanish proficiency exams like DELE and
            SIELE, or aiming for top <br className="hidden sm:block" /> scores
            in English assessments such as IELTS and TOEFL, bammbuu provides the
            expert support <br className="hidden sm:block" /> you need. We also
            help learners succeed in university admissions and employment
            entrance <br className="hidden sm:block" /> exams by focusing on
            real-world communication and tailored study plans.
          </p>
        </motion.div>

        {/* section 3 - Cards */}
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mx-auto mb-10 flex w-full max-w-7xl flex-col items-center justify-center px-2 sm:mb-16 sm:px-4 lg:mx-auto lg:mb-32 lg:px-6 xl:px-8"
        >
          {/* First row: 3 cards */}
          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
              >
                <div className="mx-auto flex w-full justify-center">
                  <Card
                    index={i}
                    icon={
                      i === 0
                        ? "/svgs/conversation-first.svg"
                        : i === 1
                          ? "/svgs/personalized-plans.svg"
                          : "/svgs/certified-experts.svg"
                    }
                    title={
                      i === 0
                        ? "Conversation First"
                        : i === 1
                          ? "Personalized Plans"
                          : "Certified Experts"
                    }
                    description={
                      i === 0
                        ? "We prioritize real speaking practice over rote memorization to help you build fluency fast."
                        : i === 1
                          ? "Every learner gets a custom plan built around their exam goals and speaking level."
                          : "Learn from qualified tutors and native speakers with proven experience in language instruction."
                    }
                  />
                </div>
              </motion.div>
            ))}
          </div>
          {/* Second row: 2 cards */}
          <div className="mt-4 grid w-full grid-cols-1 gap-4 sm:mt-6 sm:grid-cols-2 sm:gap-6">
            {[3, 4].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: (i - 3) * 0.1 }}
              >
                <div className="mx-auto flex w-full justify-center">
                  <Card
                    index={i}
                    icon={
                      i === 3
                        ? "/svgs/all-one.svg"
                        : "/svgs/confidence-guarantee.svg"
                    }
                    title={i === 3 ? "All-in-One Tool" : "Confidence Guarantee"}
                    description={
                      i === 3
                        ? "Practice anytime with SuperTutor AI, join live group classes, and access saved learning materials."
                        : "Our plan works — or you get your money back after completing the recommended program.*"
                    }
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* section 4 */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mx-auto mb-10 mt-20 flex w-full flex-col items-center justify-center space-y-6 sm:mt-40 sm:px-4 lg:mb-10 lg:mt-40 lg:px-0"
        >
          <div className="min-h-[60vh] px-2 sm:min-h-screen sm:px-4">
            <div className="mx-auto max-w-6xl">
              <h1 className="mb-8 text-center text-2xl font-semibold text-black sm:mb-16 sm:text-4xl lg:text-[56px]">
                What You'll Get in the Package
              </h1>

              <div className="flex flex-col items-start gap-8 sm:gap-12 lg:flex-row lg:gap-16">
                {/* Left Side - Features List */}
                <div className="w-full flex-1">
                  <div className="mb-6 space-y-3 sm:mb-8 sm:space-y-4">
                    {features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 sm:gap-3"
                      >
                        <img
                          src="/svgs/tick-star.svg"
                          alt="Check"
                          className="mr-1 h-5 w-5 sm:h-6 sm:w-6"
                        />
                        <span className="text-base font-medium text-[#042F0C] sm:text-xl md:text-2xl">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Disclaimer Box */}
                  <div className="flex items-start gap-2 rounded-xl bg-[#FFFFEA] p-3 text-xs font-normal text-[#3D3D3D] sm:gap-3 sm:p-4 sm:text-sm">
                    <div className="mt-0.5 h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5">
                      <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#FFBF00] sm:h-4 sm:w-4" />
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
                <div className="mx-auto mt-8 w-full max-w-md flex-shrink-0 lg:mx-0 lg:mt-0">
                  <div className="overflow-hidden rounded-[32px] border border-[#14B82C] bg-[#E6FDE9] shadow-lg sm:rounded-[48px] lg:h-[500px]">
                    {/* Header */}
                    <div className="bg-[#FFBF00] px-4 py-2 text-center sm:px-6 sm:py-3">
                      <span className="text-sm font-semibold text-black sm:text-base">
                        Language Exams Package
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-4 sm:p-8">
                      {/* Price */}
                      <div className="mb-4 text-center sm:mb-6">
                        <div className="mb-1 text-3xl font-semibold text-black sm:text-[56px]">
                          $499
                        </div>
                        <div className="mb-2 text-lg font-semibold text-black sm:text-2xl">
                          1 Month of Access
                        </div>
                        <div className="text-base font-normal text-black sm:text-lg">
                          Includes all listed features for intensive
                          preparation.
                        </div>
                      </div>

                      {/* Notice */}
                      <div className="mb-4 flex flex-col items-center gap-1 text-xs text-black sm:mb-6 sm:gap-2 sm:text-sm">
                        <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#FFBF00] sm:h-4 sm:w-4" />
                        <span className="text-center">
                          Package do not automatically renew. We recommend 2
                          months of this <br className="hidden sm:block" />
                          package to achieve best results.
                        </span>
                      </div>

                      {/* Buttons */}
                      <div className="space-y-2 sm:space-y-3">
                        <button
                          className="w-full rounded-full border border-[#042F0C] bg-[#14B82C] px-6 py-2 text-base font-semibold text-black transition-colors hover:bg-green-700 sm:text-lg"
                          onClick={() => {
                            if (isMobile) {
                              localStorage.setItem("inMobileModalFlow", "true");
                              setMobileModalStep("signup");
                            } else {
                              navigate("/signup");
                            }
                          }}
                        >
                          Enroll Today
                        </button>
                        <button
                          className="w-full bg-transparent px-6 py-2 text-base font-semibold text-[#12551E] transition-colors hover:bg-green-50"
                          onClick={() =>
                            window.open(
                              "https://calendly.com/bammbuu-languages/info-call-llamada-de-informacion",
                              "_blank",
                            )
                          }
                        >
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

        {/* Comparison Table Section */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <ComparisonTable />
        </motion.div>
      </div>
      {/* Mobile Modal Stepper Flow */}
      {isMobile && mobileModalStep === "signup" && (
        <MobileSignupStep
          onNext={() => setMobileModalStep("profile")}
          onClose={handleMobileFlowClose}
        />
      )}
      {isMobile && mobileModalStep === "profile" && (
        <MobileProfileStep
          onNext={() => setMobileModalStep("subscription")}
          onBack={() => setMobileModalStep("signup")}
          onClose={handleMobileFlowClose}
        />
      )}
      {isMobile && mobileModalStep === "subscription" && (
        <MobileSubscriptionStep
          onNext={() => setMobileModalStep("confirmation")}
          onBack={() => setMobileModalStep("profile")}
          onClose={handleMobileFlowClose}
        />
      )}
      {isMobile && mobileModalStep === "confirmation" && (
        <MobileConfirmationStep onClose={handleMobileFlowComplete} />
      )}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Footer />
      </motion.div>
    </>
  );
};

export default LandingExamPrep;
