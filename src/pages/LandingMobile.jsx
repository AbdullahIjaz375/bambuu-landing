import React, { useState } from "react";
import ComparisonTable from "../components/ComparisonTable";
import MobileSignupModalFlow from "../components/mobile-flow/MobileSignupModalFlow";
import { X } from "lucide-react";

const features = [
  {
    icon: "/svgs/conversation-first.svg",
    title: "Conversation First",
    desc: "We prioritize real speaking practice over rote memorization to help you build fluency fast.",
  },
  {
    icon: "/svgs/personalized-plans.svg",
    title: "Personalized Plans",
    desc: "Every learner gets a custom plan built around their exam goals and speaking level.",
  },
  {
    icon: "/svgs/certified-experts.svg",
    title: "Certified Experts",
    desc: "Learn from qualified tutors and native speakers with proven experience in language instruction.",
  },
  {
    icon: "/svgs/all-one.svg",
    title: "All-in-One Tool",
    desc: "Practice anytime with SuperTutor AI, join live group classes, and access saved learning materials.",
  },
  {
    icon: "/svgs/confidence-guarantee.svg",
    title: "Confidence Guarantee",
    desc: "Our plan works — or you get your money back after completing the recommended program.*",
  },
];

const packageFeatures = [
  "10 Live 1:1 Classes with certified tutors",
  "Unlimited Group Conversation Classes led by instructors",
  "Personalized Learning Plan based on your fluency goals",
  "Saved Resources tailored to your study plan",
  "24/7 AI SuperTutor for continuous language practice",
  "Direct Support from the bammbuu team",
  "Money-Back Guarantee if your goals aren't met*",
];

export default function LandingMobile() {
  const [showSignupFlow, setShowSignupFlow] = useState(false);
  const [showBanner, setShowBanner] = useState(true);

  return (
    <div className="min-h-screen w-full bg-[#F0FDF1] font-['Urbanist'] text-black">
      {/* Notification Banner */}
      {showBanner && (
        <div className="relative z-10 mx-auto flex min-h-[66px] max-w-[393px] flex-row items-center justify-between gap-2 rounded-t-2xl bg-[#FFBF00] px-6 py-4">
          <span className="text-sm font-medium text-black">
            Don&apos;t Miss Out! The final 10 spots for July are filling up
            fast.
          </span>
          <button
            className="ml-2 text-xl text-black"
            onClick={() => setShowBanner(false)}
            aria-label="Close"
            style={{ lineHeight: 1 }}
          >
            <X size={22} />
          </button>
        </div>
      )}
      {/* Onboarding Modal Flow */}
      {showSignupFlow && (
        <MobileSignupModalFlow onClose={() => setShowSignupFlow(false)} />
      )}
      {/* Hero Section */}
      <div className="relative flex w-full flex-col items-center rounded-b-[40px] bg-white pb-8 pt-8">
        <img
          src="/images/bambuu-new-logo.png"
          alt="bammbuu logo"
          className="mx-auto mb-6 h-8"
        />
        <h1 className="px-4 text-center text-[32px] font-extrabold leading-tight">
          Immersive Exam
          <br />
          Preparation Package
        </h1>
        <p className="mt-3 px-6 text-center text-[18px] font-medium text-[#042F0C]">
          Ditch the dry drills. Learn through real conversation, gain
          confidence, and unlock the opportunities you deserve.
        </p>
        <div className="mt-6 flex w-full flex-row items-center justify-center gap-3 px-6">
          <button
            className="min-w-[140px] rounded-[18px] border border-black bg-white px-4 py-2 text-sm font-semibold text-black"
            style={{ width: "fit-content" }}
            onClick={() =>
              window.open(
                "https://calendly.com/bammbuu-languages/info-call-llamada-de-informacion",
                "_blank",
              )
            }
          >
            Schedule a Call
          </button>
          <button
            className="min-w-[140px] rounded-[18px] border border-black bg-[#FFBF00] px-4 py-2 text-sm font-semibold text-black"
            style={{ width: "fit-content" }}
            onClick={() => setShowSignupFlow(true)}
          >
            Enroll Today
          </button>
        </div>
      </div>

      {/* Video Section */}
      <div className="mt-8 flex w-full flex-col items-center rounded-[18.8px] bg-[#E7E7E7] px-6 py-6">
        <div className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl bg-[#eaeaea]">
          <iframe
            width="100%"
            height="100%"
            src="https://www.youtube.com/embed/OKv2evfTpvw"
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="h-full w-full"
            style={{ borderRadius: "16px", minHeight: 200 }}
          ></iframe>
        </div>
        <span className="mt-4 block text-center text-xs text-[#5D5D5D]">
          Watch how bammbuu transforms exam prep into an experience.
        </span>
      </div>

      {/* Why Choose Section */}
      <div className="mt-12 flex w-full flex-col items-center px-6">
        <h2 className="text-center text-[28px] font-semibold">
          Why Choose bammbuu?
        </h2>
        <p className="mt-3 text-center text-base text-[#3D3D3D]">
          Whether you're preparing for Spanish proficiency exams like DELE and
          SIELE, or aiming for top scores in English assessments such as IELTS
          and TOEFL, bammbuu provides the expert support you need. We also help
          learners succeed in university admissions and employment entrance
          exams by focusing on real-world communication and tailored study
          plans.
        </p>
      </div>

      {/* Features Cards */}
      <div className="mt-10 flex w-full flex-col gap-6 px-6">
        {features.map((f, i) => (
          <div
            key={f.title}
            className="flex flex-col items-center rounded-[48px] border border-[#14B82C] bg-[#F0FDF1] px-6 py-6 text-center"
          >
            <img src={f.icon} alt={f.title} className="mb-3 h-12 w-12" />
            <div className="mb-1 text-xl font-bold">{f.title}</div>
            <div className="text-base text-[#3D3D3D]">{f.desc}</div>
          </div>
        ))}
      </div>

      {/* What You'll Get Section */}
      <div className="mt-12 flex w-full flex-col items-center px-6">
        <h2 className="mb-6 text-center text-[28px] font-semibold">
          What You'll Get in the Package
        </h2>
        <div className="flex w-full flex-col gap-4">
          {packageFeatures.map((feature, i) => (
            <div
              key={feature}
              className="flex items-center gap-3 rounded-2xl bg-[#FFFFEA] px-4 py-3"
            >
              <img src="/svgs/tick-star.svg" alt="check" className="h-6 w-6" />
              <span className="text-base font-medium text-[#042F0C]">
                {feature}
              </span>
            </div>
          ))}
        </div>
        {/* Info Box */}
        <div className="mt-6 flex items-start gap-2 rounded-xl bg-[#FFFFEA] p-3 text-xs font-normal text-[#3D3D3D]">
          <img
            src="/svgs/info-circle.svg"
            alt="info"
            className="mt-0.5 h-5 w-5"
          />
          <span className="italic">
            *Our money-back guarantee requires you to complete the bammbuu
            recommended plan. If your language goal, as discussed in your intro
            call, isn't met after 2 months of our Immersive Exam Prep plan —
            including all 10 1:1 classes and 3 live group sessions per month —
            we'll refund you.
          </span>
        </div>
      </div>

      {/* Pricing Card */}
      <div className="mt-12 flex w-full flex-col items-center px-6">
        <div className="w-full overflow-hidden rounded-[48px] border border-[#14B82C] bg-[#E6FDE9] shadow-lg">
          <div className="bg-[#FFBF00] py-3 text-center">
            <span className="text-base font-semibold">
              Language Exams Package
            </span>
          </div>
          <div className="flex flex-col items-center px-6 py-8">
            <div className="mb-1 text-[40px] font-semibold">$499</div>
            <div className="mb-2 text-lg font-semibold">1 Month of Access</div>
            <div className="mb-4 text-center text-base">
              Includes all listed features for intensive preparation.
            </div>
            <div className="mb-6 flex items-center gap-2 rounded-xl bg-[#FFFFEA] px-3 py-2">
              <img src="/svgs/info-circle.svg" alt="info" className="h-5 w-5" />
              <span className="text-xs">
                Package does not automatically renew. We recommend 2 months of
                this package to achieve best results.
              </span>
            </div>
            <button className="mb-3 w-full rounded-[24px] border border-[#042F0C] bg-[#14B82C] py-3 font-semibold text-black">
              Enroll Today
            </button>
            <button className="w-full rounded-[24px] border border-[#042F0C] bg-white py-3 font-semibold text-[#12551E]">
              Schedule an Informational Call
            </button>
          </div>
        </div>
      </div>

      {/* Comparison Table Section */}
      <div className="mt-12 flex w-full flex-col items-center px-2">
        <ComparisonTable />
      </div>

      {/* Footer */}
      <footer className="mt-16 flex w-full flex-col items-center">
        <div className="footer-background mt-40 flex w-full flex-col space-y-20 rounded-t-[20vh] border-t-8 border-[#B9F9C2] pb-12 pt-24">
          <div className="flex flex-row items-center justify-center">
            <img
              src="/images/bambuu-new-logo.png"
              alt="bammbuu logo"
              className="h-8 w-auto"
            />
          </div>
          <div className="mb-2 text-center text-sm text-[#6D6D6D]">
            © 2024 All rights reserved
          </div>
          <div className="flex flex-row items-center justify-center gap-6 text-sm text-[#6D6D6D]">
            <span className="underline">Terms & Conditions</span>
            <span className="underline">Privacy Policy</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
