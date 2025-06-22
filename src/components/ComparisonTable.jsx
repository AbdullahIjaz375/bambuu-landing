import React, { useRef, useEffect, useState } from "react";
import "./ComparisonTable.css";

const features = [
  {
    label: "Targeted Exam Prep (IELTS, TOEFL, SIELE, DELE)",
    bammbuu: { icon: "check", text: "Specialized" },
    apps: "Limited/Basic",
    tutors: "Tutor Dependent",
    generic: "Variable",
  },
  {
    label: "Certified Expert Instructors",
    bammbuu: { icon: "check", text: "Vetted Professionals" },
    apps: "N/A",
    tutors: "Variable Quality",
    generic: "Often Pre-recorded",
  },
  {
    label: "Customized Learning Plan",
    bammbuu: { icon: "check", text: "Tailored by Experts" },
    apps: "Basic Algorithm",
    tutors: "Possible, Extra Cost",
    generic: { icon: "cross", text: "No" },
  },
  {
    label: "1:1 Live Classes Included",
    bammbuu: { icon: "check", text: "10 Per Month" },
    apps: { icon: "cross", text: "No" },
    tutors: "Pay-Per-Class",
    generic: "Rare / Add-on",
  },
  {
    label: "Live Conversation Practice",
    bammbuu: {
      icon: "check",
      text: (
        <span>
          <span className="font-bold italic">Unlimited</span> Conversation
          Classes
        </span>
      ),
    },
    apps: { icon: "cross", text: "No" },
    tutors: "Pay-Per-Class, not conversation focussed",
    generic: { icon: "cross", text: "No" },
  },
  {
    label: "24/7 AI Practice Tutor",
    bammbuu: { icon: "check", text: "On-Demand" },
    apps: "Limited AI Exercises",
    tutors: { icon: "cross", text: "No" },
    generic: { icon: "cross", text: "No" },
  },
  {
    label: "Personalized Resources",
    bammbuu: { icon: "check", text: "Curated For You" },
    apps: "Standard Library",
    tutors: "Variable Quality",
    generic: "Generic",
  },
  {
    label: "Direct Support",
    bammbuu: { icon: "check", text: "bammbuu Team" },
    apps: "App Support",
    tutors: "Platform Only",
    generic: "Limited",
  },
  {
    label: "Money-Back Guarantee*",
    bammbuu: { icon: "check", text: "Results Focused" },
    apps: { icon: "cross", text: "No" },
    tutors: { icon: "cross", text: "No" },
    generic: "Rarely",
  },
  {
    label: "Student Value",
    bammbuu: "All-Inclusive Value",
    apps: "Low (Basic Features)",
    tutors: "Limited (variable value)",
    generic: "Limited (basic features)",
  },
];

const iconMap = {
  check: "/svgs/checkmark-badge-01.svg",
  cross: "/svgs/cancel-circle.svg",
};

/**
 * IMPORTANT:
 *   - In your layout, the first "Feature" column is 304px wide.
 *   - That means the Bammbuu column starts at left: 304px.
 *   - The width of the Bammbuu column itself is 240px (as per your Figma spec).
 */
const BAMMBUU_COLUMN_LEFT = 304; // px from left edge of the table
const BAMMBUU_COLUMN_WIDTH = 240;

const ComparisonTable = ({ onEnrollClick }) => {
  const tableRef = useRef(null);
  const [highlightHeight, setHighlightHeight] = useState(0);

  useEffect(() => {
    function updateHighlightHeight() {
      if (tableRef.current) {
        setHighlightHeight(tableRef.current.offsetHeight);
      }
    }
    updateHighlightHeight();
    window.addEventListener("resize", updateHighlightHeight);
    return () => window.removeEventListener("resize", updateHighlightHeight);
  }, []);

  return (
    <section className="flex w-full flex-col items-center px-2 py-10 font-urbanist lg:px-0">
      <h2 className="mb-8 text-center text-[32px] font-semibold text-black lg:text-[56px]">
        bammbuu vs others
      </h2>

      <div className="w-full max-w-[1280px] overflow-x-auto">
        <div className="relative">
          {/**
           * This div is the single "highlight" behind the entire Bammbuu column.
           * We give it exactly the Figma CSS: background + border + border-radius.
           */}
          <div
            className="bammbuu-highlight"
            style={{
              top: 0,
              left: BAMMBUU_COLUMN_LEFT,
              width: BAMMBUU_COLUMN_WIDTH,
              height: highlightHeight,
            }}
          />

          <table
            ref={tableRef}
            className="relative z-20 w-full min-w-[900px] text-left"
          >
            <thead>
              <tr className="bg-[#F0F0F0] text-[18px] font-semibold text-[#141414]">
                {/* "Feature" header (rounded top-left corner) */}
                <th className="z-20 min-w-[304px] rounded-tl-3xl bg-[#F0F0F0] px-6 py-5">
                  Feature
                </th>

                {/**
                 * Bammbuu header:
                 *   • We removed border/background from this <th>.
                 *   • Its container <div.bammbuu-highlight> is providing background + border.
                 *   • We only keep z-20 so that text sits on top of that highlight.
                 *   • If you want the header text area to be fully opaque white (so no light‐green tint behind),
                 *     you can add bg-white. If you want it tinted, remove bg-white.
                 */}
                <th className="z-20 min-w-[240px] px-6 py-5 text-[#042F0C]">
                  bammbuu Languages
                  <br />
                  <span className="text-[15px] font-normal">
                    (Immersive Exam Prep)
                  </span>
                </th>

                <th className="z-20 min-w-[180px] bg-[#F0F0F0] px-6 py-5">
                  Language Apps
                </th>
                <th className="z-20 min-w-[180px] bg-[#F0F0F0] px-6 py-5">
                  Live Tutor Marketplaces
                </th>
                <th className="z-20 min-w-[180px] rounded-tr-3xl bg-[#F0F0F0] px-6 py-5">
                  Generic Online Courses
                </th>
              </tr>
            </thead>

            <tbody className="text-[16px]">
              {features.map((row, i) => (
                <tr
                  key={row.label}
                  className={i % 2 === 0 ? "bg-[#FCFCFC]" : "bg-white"}
                >
                  <td className="relative z-20 min-w-[304px] bg-transparent px-6 py-4 align-top font-semibold text-[#141414]">
                    {row.label}
                  </td>

                  {/**
                   * Bammbuu <td>:
                   * • No border, no background.  The "bammbuu-highlight" div does that.
                   * • z-20 so that icon/text sits on top of the highlight.
                   */}
                  <td className="relative z-20 min-w-[240px] px-6 py-4 align-top text-[#042F0C]">
                    <span className="flex items-center gap-2">
                      {typeof row.bammbuu === "string" ? (
                        row.bammbuu
                      ) : (
                        <>
                          {row.bammbuu.icon && (
                            <img
                              src={iconMap[row.bammbuu.icon]}
                              alt="icon"
                              className="inline h-5 w-5"
                            />
                          )}
                          <span>{row.bammbuu.text}</span>
                        </>
                      )}
                    </span>
                  </td>

                  <td className="min-w-[180px] bg-transparent px-6 py-4 align-top">
                    {typeof row.apps === "string" ? (
                      row.apps
                    ) : (
                      <span className="flex items-center gap-2">
                        {row.apps.icon && (
                          <img
                            src={iconMap[row.apps.icon]}
                            alt="icon"
                            className="inline h-5 w-5"
                          />
                        )}
                        <span>{row.apps.text}</span>
                      </span>
                    )}
                  </td>

                  <td className="min-w-[180px] bg-transparent px-6 py-4 align-top">
                    {typeof row.tutors === "string" ? (
                      row.tutors
                    ) : (
                      <span className="flex items-center gap-2">
                        {row.tutors.icon && (
                          <img
                            src={iconMap[row.tutors.icon]}
                            alt="icon"
                            className="inline h-5 w-5"
                          />
                        )}
                        <span>{row.tutors.text}</span>
                      </span>
                    )}
                  </td>

                  <td className="min-w-[180px] bg-transparent px-6 py-4 align-top">
                    {typeof row.generic === "string" ? (
                      row.generic
                    ) : (
                      <span className="flex items-center gap-2">
                        {row.generic.icon && (
                          <img
                            src={iconMap[row.generic.icon]}
                            alt="icon"
                            className="inline h-5 w-5"
                          />
                        )}
                        <span>{row.generic.text}</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-4 md:flex-row">
        <a
          href="https://calendly.com/bammbuu-languages/info-call-llamada-de-informacion"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-black px-6 py-2 text-center text-base font-medium text-black transition hover:bg-gray-100"
        >
          Schedule a Call
        </a>
        <button
          onClick={onEnrollClick}
          className="rounded-full border border-black bg-[#FFBF00] px-6 py-2 text-center text-base font-medium text-black transition hover:bg-[#ffd94d]"
        >
          Enroll Today
        </button>
      </div>
    </section>
  );
};

export default ComparisonTable;
