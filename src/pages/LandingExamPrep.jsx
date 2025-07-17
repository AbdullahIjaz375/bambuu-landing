import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import Footer from "../components/Footer";
import { Info, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ComparisonTable from "../components/ComparisonTable";
import { useLanguage } from "../context/LanguageContext";
import MobileSignupStep from "../components/mobile-flow/MobileSignupStep";
import MobileProfileStep from "../components/mobile-flow/MobileProfileStep";
import MobileSubscriptionStep from "../components/mobile-flow/MobileSubscriptionStep";
import MobileConfirmationStep from "../components/mobile-flow/MobileConfirmationStep";
import LandingMobile from "./LandingMobile";
import { useTranslation } from "react-i18next";
import "../styles/LandingStyles.css";

const Card = ({ icon, title, description, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, delay: index * 0.1 }}
      className="flex h-full flex-col items-center rounded-[48px] border border-[#14B82C] bg-[#F0FDF1] p-6 pt-10 text-center"
    >
      {icon && <img src={icon} alt="card-icon" className="mb-4 h-16 w-16" />}
      <div className="mb-2 flex items-center justify-center gap-2">
        <h3 className="text-[32px] font-bold text-[#042F0C]">{title}</h3>
      </div>
      <p className="w-full min-w-80 text-xl font-normal leading-[30px] text-[#3d3d3d]">
        {description}
      </p>
    </motion.div>
  );
};

const features = [
  "feature1",
  "feature2",
  "feature3",
  "feature4",
  "feature5",
  "feature6",
  "feature7",
  "feature8",
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
  const [showBanner, setShowBanner] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPopup(true);
    }, 10000); // 10 seconds
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (showPopup) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showPopup]);

  const handleEnrollClick = () => {
    if (isMobile) {
      localStorage.setItem("inMobileModalFlow", "true");
      setMobileModalStep("signup");
    } else {
      navigate("/signup", { state: { flow: "exam-prep" } });
    }
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
      {/* Orange Banner */}
      {showBanner && (
        <div className="relative z-30 w-full bg-[#FFBF00] py-3 text-center text-lg font-medium text-[#454545]">
          <span>{t("examPrep.banner")}</span>
          <button
            onClick={() => setShowBanner(false)}
            className="absolute right-6 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full p-2 text-[#3D3D3D]"
            aria-label="Close"
            type="button"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      )}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Navbar user={user} onGetStartedClick={handleEnrollClick} />
      </motion.div>
      <div className="overflow-hidden px-20">
        {/* section 1 */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-[157px] mt-[100px] flex w-full flex-col items-center justify-center rounded-3xl lg:rounded-[20vh] lg:px-0"
        >
          <div className="mx-auto flex w-full flex-col items-center justify-center">
            <h1 className="mb-6 w-full text-center text-6xl font-extrabold leading-tight text-black">
              {t("examPrep.hero.title1")}
              <br />
              {t("examPrep.hero.title2")}
            </h1>
            <h1 className="mb-12 w-full max-w-[767px] text-center text-2xl font-medium text-[#042F0C]">
              {t("examPrep.hero.subtitle")}
            </h1>
            <div className="mx-auto mb-4 flex w-full flex-col items-center justify-center gap-3 text-base font-medium text-black sm:w-auto sm:flex-row sm:gap-[24px]">
              <button
                onClick={() =>
                  window.open(
                    "https://calendly.com/bammbuu-languages/info-call-llamada-de-informacion",
                    "_blank",
                  )
                }
                className="flex h-[44px] w-[174px] items-center justify-center rounded-full border border-black bg-white px-0 text-black transition hover:bg-gray-100"
              >
                {t("examPrep.hero.scheduleCall")}
              </button>
              <button
                className="flex h-[44px] w-[174px] items-center justify-center rounded-full border border-black bg-[#FFBF00] px-0 text-base font-medium text-black transition hover:bg-[#ffd94d]"
                onClick={handleEnrollClick}
              >
                {t("examPrep.hero.enrollToday")}
              </button>
            </div>
          </div>
          <div className="mx-auto flex w-full flex-col items-center">
            <div className="relative m-0 w-full overflow-hidden rounded-[64px] bg-[#eaeaea] p-0 sm:rounded-[3rem]">
              <iframe
                width="100%"
                height="100%"
                style={{
                  aspectRatio: "16/9",
                  display: "block",
                }}
                src="https://www.youtube.com/embed/OKv2evfTpvw"
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </div>
            <div className="mt-6 w-full text-center">
              <span className="text-sm font-normal italic text-[#5D5D5D] sm:text-base">
                {t("examPrep.hero.videoCaption")}
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
          className="mx-auto mb-20 flex w-full flex-col items-center justify-center"
        >
          <div className="mx-auto my-0 flex w-full max-w-[848px] flex-col items-center justify-center gap-4">
            <h1 className="text-center text-[56px] font-semibold text-black sm:text-5xl">
              {t("examPrep.why.title")}
            </h1>
            <p className="text-center text-xl font-normal text-[#3d3d3d] sm:text-lg">
              {t("examPrep.why.description")}
            </p>
          </div>
        </motion.div>

        {/* section 3 - Cards */}
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mx-auto mb-[200px] flex w-full flex-col items-center justify-center"
        >
          {/* First row: 3 cards */}
          <div className="grid w-full grid-cols-1 items-stretch gap-10 sm:grid-cols-2 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="h-full w-full"
              >
                <Card
                  index={i}
                  icon={
                    i === 0
                      ? "/svgs/conversation-first.svg"
                      : i === 1
                        ? "/svgs/personalized-plans.svg"
                        : "/svgs/certified-experts.svg"
                  }
                  title={t(`examPrep.cards.card${i + 1}.title`)}
                  description={t(`examPrep.cards.card${i + 1}.desc`)}
                />
              </motion.div>
            ))}
          </div>
          {/* Second row: 2 cards */}
          <div className="mt-10 grid w-full grid-cols-1 items-stretch gap-10 sm:grid-cols-2">
            {[3, 4].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: (i - 3) * 0.1 }}
                className="h-full w-full"
              >
                <Card
                  index={i}
                  icon={
                    i === 3
                      ? "/svgs/all-one.svg"
                      : "/svgs/confidence-guarantee.svg"
                  }
                  title={t(`examPrep.cards.card${i + 1}.title`)}
                  description={t(`examPrep.cards.card${i + 1}.desc`)}
                />
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
          className="mx-auto mb-[200px] flex w-full flex-col items-center justify-center"
        >
          <div className="">
            <div className="mx-auto">
              <h1 className="mb-20 text-center text-[56px] font-semibold text-black">
                {t("examPrep.whatYouGet.title")}
              </h1>

              <div className="flex items-start gap-10">
                {/* Left Side - Features List */}
                <div className="mt-8 w-full max-w-[654px] flex-1">
                  <div className="mb-6 space-y-3 sm:mb-8 sm:space-y-4">
                    {features.map((featureKey, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 sm:gap-3"
                      >
                        <img
                          src="/svgs/tick-star.svg"
                          alt="Check"
                          className="mr-1 h-8 w-8"
                        />
                        <span className="text-2xl font-medium leading-[30px] text-[#042F0C]">
                          {t(`examPrep.features.${featureKey}`)}
                        </span>
                      </div>
                    ))}
                    {/* Disclaimer Box */}
                    <div className="flex items-start gap-2 rounded-2xl bg-[#FFFFEA] p-4 text-sm font-normal text-[#3D3D3D]">
                      <div className="mt-0.5 h-4 w-4 flex-shrink-0">
                        <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#FFBF00]" />
                      </div>
                      <div className="italic">
                        {t("examPrep.moneyBackDisclaimer")}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side - Pricing Card */}
                <div className="mx-auto w-full max-w-[550px] flex-shrink-0">
                  <div className="overflow-hidden rounded-[32px] border border-[#14B82C] bg-[#E6FDE9] shadow-lg sm:rounded-[48px]">
                    {/* Header */}
                    <div className="mb-14 bg-[#FFBF00] px-4 py-2 text-center sm:px-6 sm:py-3">
                      <span className="text-base font-semibold text-black">
                        {t("examPrep.pricing.header")}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="px-8">
                      {/* Price */}
                      <div className="mb-[54px] text-center">
                        <div className="mb-2 text-[56px] font-semibold text-black">
                          {t("examPrep.pricing.price")}
                        </div>
                        <div className="mb-5 text-lg font-semibold text-black sm:text-2xl">
                          {t("examPrep.pricing.duration")}
                        </div>
                        <div className="text-base font-normal text-black sm:text-lg">
                          {t("examPrep.pricing.includes")}
                        </div>
                      </div>

                      {/* Notice */}
                      <div className="mb-12 flex flex-col items-center gap-1 text-base font-normal text-black">
                        <Info className="mt-0.5 h-6 w-6 flex-shrink-0 text-[#FFBF00]" />
                        <span className="text-center">
                          {t("examPrep.pricing.notice")}
                        </span>
                      </div>

                      {/* Buttons */}
                      <div className="">
                        <button
                          className="mx-auto mb-4 w-full rounded-full border border-[#042F0C] bg-[#14B82C] px-6 py-2 text-lg font-semibold text-black transition-colors hover:bg-green-700"
                          onClick={handleEnrollClick}
                        >
                          {t("examPrep.hero.enrollToday")}
                        </button>
                        <button
                          className="mb-2 w-full bg-transparent px-6 py-2 text-base font-semibold text-[#12551E] transition-colors hover:bg-green-50"
                          onClick={() =>
                            window.open(
                              "https://calendly.com/bammbuu-languages/info-call-llamada-de-informacion",
                              "_blank",
                            )
                          }
                        >
                          {t("examPrep.pricing.scheduleInfoCall")}
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
          <ComparisonTable onEnrollClick={handleEnrollClick} />
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
      {/* Popup Modal */}
      {showPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
          <div className="relative flex h-[490px] w-[1080px] max-w-full flex-col items-center overflow-hidden rounded-3xl bg-white p-0 shadow-2xl">
            {/* Background image */}
            <img
              src="/images/banner-background.png"
              alt="Banner Background"
              className="absolute inset-0 h-full w-full object-cover opacity-80"
            />

            <div className="relative z-10 flex h-full w-full flex-col items-center justify-center p-8 sm:p-12">
              <button
                onClick={() => setShowPopup(false)}
                className="absolute right-6 top-6 flex items-center justify-center rounded-full bg-[#E7E7E7] bg-opacity-70 p-2 text-[#3D3D3D] hover:bg-gray-100"
                aria-label="Close"
                type="button"
              >
                <X className="h-6 w-6" />
              </button>
              <img
                src="/svgs/exam-prep-modal-icon.svg"
                alt={t("examPrep.modal.bannerIconAlt")}
                className="mx-auto mb-6"
              />
              <h2 className="mb-3 text-center text-[32px] font-bold text-black">
                {t("examPrep.modal.title")}
              </h2>
              <p className="mb-8 max-w-xl text-center text-xl font-medium text-[#454545]">
                {t("examPrep.modal.spotsFilling")}
              </p>
              <button
                className="rounded-full border border-[#042F0C] bg-[#14B82C] px-8 py-2 text-base font-medium text-black transition hover:bg-green-700"
                onClick={() => {
                  setShowPopup(false);
                  handleEnrollClick();
                }}
              >
                {t("examPrep.modal.bookNow")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LandingExamPrep;
