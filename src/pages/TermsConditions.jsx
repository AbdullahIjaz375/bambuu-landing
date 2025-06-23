import React from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";

const TermsConditions = () => {
  const { user } = useAuth;
  const navigate = useNavigate();

  const handleEnrollClick = () => {
    // if (isMobile) {
    //   localStorage.setItem("inMobileModalFlow", "true");
    //   setMobileModalStep("signup");
    // } else {
    navigate("/signup", { state: { flow: "exam-prep" } });
    // }
  };
  return (
    <div className="mx-auto max-w-full p-0 font-urbanist">
      <div className="bg-[#E6FDE9]">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Navbar
            transparent
            user={user}
            onGetStartedClick={handleEnrollClick}
          />
          <div className="mx-auto max-w-7xl px-20 pb-40 pt-[68px] text-center">
            <p className="text-base font-semibold text-[#14B82C]">
              Current as of 20 Jan 2025
            </p>
            <h1 className="mt-4 text-5xl font-semibold tracking-tight text-[#042F0C] sm:text-6xl">
              Terms and Conditions
            </h1>
            <p className="mt-6 text-xl font-normal leading-8 text-[#454545]">
              Your privacy is important to us at Bammbuu. We respect your
              privacy regarding any <br /> information we may collect from you
              across our website.
            </p>
          </div>
        </motion.div>
      </div>
      <div className="mx-auto mt-12 max-w-4xl">
        <div className="mb-12 space-y-2">
          <h2 className="text-xl font-semibold">TABLE OF CONTENTS</h2>
          <ol className="list-decimal space-y-1 pl-5 text-blue-600">
            <li>
              <a href="#services" className="hover:underline">
                OUR SERVICES
              </a>
            </li>
            <li>
              <a href="#ip" className="hover:underline">
                INTELLECTUAL PROPERTY RIGHTS
              </a>
            </li>
            <li>
              <a href="#userreps" className="hover:underline">
                USER REPRESENTATIONS
              </a>
            </li>
            <li>
              <a href="#userreg" className="hover:underline">
                USER REGISTRATION
              </a>
            </li>
            <li>
              <a href="#purchases" className="hover:underline">
                PURCHASES AND PAYMENT
              </a>
            </li>
            <li>
              <a href="#subscriptions" className="hover:underline">
                SUBSCRIPTIONS
              </a>
            </li>
            <li>
              <a href="#returnpolicy" className="hover:underline">
                POLICY
              </a>
            </li>
            <li>
              <a href="#prohibited" className="hover:underline">
                PROHIBITED ACTIVITIES
              </a>
            </li>
            <li>
              <a href="#ugc" className="hover:underline">
                USER GENERATED CONTRIBUTIONS
              </a>
            </li>
            <li>
              <a href="#license" className="hover:underline">
                CONTRIBUTION LICENSE
              </a>
            </li>
            <li>
              <a href="#mobile" className="hover:underline">
                MOBILE APPLICATION LICENSE
              </a>
            </li>
            <li>
              <a href="#socialmedia" className="hover:underline">
                SOCIAL MEDIA
              </a>
            </li>
            <li>
              <a href="#thirdparty" className="hover:underline">
                THIRD-PARTY WEBSITES AND CONTENT
              </a>
            </li>
            <li>
              <a href="#advertisers" className="hover:underline">
                ADVERTISERS
              </a>
            </li>
            <li>
              <a href="#sitemanage" className="hover:underline">
                SERVICES MANAGEMENT
              </a>
            </li>
            <li>
              <a href="#privacy" className="hover:underline">
                PRIVACY POLICY
              </a>
            </li>
            <li>
              <a href="#copyright" className="hover:underline">
                COPYRIGHT INFRINGEMENTS
              </a>
            </li>
            <li>
              <a href="#terms" className="hover:underline">
                TERM AND TERMINATION
              </a>
            </li>
            <li>
              <a href="#modifications" className="hover:underline">
                MODIFICATIONS AND INTERRUPTIONS
              </a>
            </li>
            <li>
              <a href="#law" className="hover:underline">
                GOVERNING LAW
              </a>
            </li>
            <li>
              <a href="#disputes" className="hover:underline">
                DISPUTE RESOLUTION
              </a>
            </li>
            <li>
              <a href="#corrections" className="hover:underline">
                CORRECTIONS
              </a>
            </li>
            <li>
              <a href="#disclaimer" className="hover:underline">
                DISCLAIMER
              </a>
            </li>
            <li>
              <a href="#liability" className="hover:underline">
                LIMITATIONS OF LIABILITY
              </a>
            </li>
            <li>
              <a href="#indemnification" className="hover:underline">
                INDEMNIFICATION
              </a>
            </li>
            <li>
              <a href="#userdata" className="hover:underline">
                USER DATA
              </a>
            </li>
            <li>
              <a href="#electronic" className="hover:underline">
                ELECTRONIC COMMUNICATIONS, TRANSACTIONS, AND SIGNATURES
              </a>
            </li>
            <li>
              <a href="#california" className="hover:underline">
                CALIFORNIA USERS AND RESIDENTS
              </a>
            </li>
            <li>
              <a href="#misc" className="hover:underline">
                MISCELLANEOUS
              </a>
            </li>
            <li>
              <a href="#contact" className="hover:underline">
                CONTACT US
              </a>
            </li>
          </ol>
        </div>

        <div className="space-y-12">
          <section>
            <h2 className="mb-4 text-3xl font-semibold text-[#181D27]">
              AGREEMENT TO OUR LEGAL TERMS
            </h2>
            <p className="text-[#535862 mb-4 text-lg font-normal">
              We are Capital H Ventures LLC ("Company," "we," "us," "our"), a
              company registered in Texas, United States at 17350 State Hwy 249,
              Ste 220 #22916, Houston, TX 77064.
            </p>
            <p className="text-[#535862 mb-4 text-lg font-normal">
              We operate the mobile application bammbuu (the "App"), as well as
              any other related products and services that refer or link to
              these legal terms (the "Legal Terms") (collectively, the
              "Services").
            </p>
            <p className="text-[#535862 mb-4 text-lg font-normal">
              You can contact us by phone at 512-814-8731, email at
              admin@bammbuu.co, or by mail to 17350 State Hwy 249, Ste 220
              #22916, Houston, TX 77064, United States.
            </p>
            <p className="text-[#535862 mb-4 text-lg font-normal">
              These Legal Terms constitute a legally binding agreement made
              between you, whether personally or on behalf of an entity ("you"),
              and Capital H Ventures LLC, concerning your access to and use of
              the Services. You agree that by accessing the Services, you have
              read, understood, and agreed to be bound by all of these Legal
              Terms. IF YOU DO NOT AGREE WITH ALL OF THESE LEGAL TERMS, THEN YOU
              ARE EXPRESSLY PROHIBITED FROM USING THE SERVICES AND YOU MUST
              DISCONTINUE USE IMMEDIATELY.
            </p>
            <p className="text-[#535862 mb-4 text-lg font-normal">
              The Services are intended for users who are at least 18 years old.
              Persons under the age of 18 are not permitted to use or register
              for the Services.
            </p>
          </section>

          <section id="services">
            <h2 className="mb-4 text-3xl font-semibold text-[#181D27]">
              1. OUR SERVICES
            </h2>
            <p className="text-[#535862 mb-4 text-lg font-normal">
              The information provided when using the Services is not intended
              for distribution to or use by any person or entity in any
              jurisdiction or country where such distribution or use would be
              contrary to law or regulation or which would subject us to any
              registration requirement within such jurisdiction or country.
            </p>
            <p className="text-[#535862 mb-4 text-lg font-normal">
              The Services are not tailored to comply with industry-specific
              regulations (Health Insurance Portability and Accountability Act
              (HIPAA), Federal Information Security Management Act (FISMA),
              etc.), so if your interactions would be subjected to such laws,
              you may not use the Services. You may not use the Services in a
              way that would violate the Gramm-Leach-Bliley Act (GLBA).
            </p>
          </section>

          <section id="ip">
            <h2 className="mb-4 text-3xl font-semibold text-[#181D27]">
              2. INTELLECTUAL PROPERTY RIGHTS
            </h2>
            <h3 className="mb-3 text-xl font-medium">
              Our intellectual property
            </h3>
            <p className="text-[#535862 mb-4 text-lg font-normal">
              We are the owner or the licensee of all intellectual property
              rights in our Services, including all source code, databases,
              functionality, software, website designs, audio, video, text,
              photographs, and graphics in the Services (collectively, the
              "Content"), as well as the trademarks, service marks, and logos
              contained therein (the "Marks").
            </p>
            <p className="text-[#535862 mb-4 text-lg font-normal">
              Our Content and Marks are protected by copyright and trademark
              laws (and various other intellectual property rights and unfair
              competition laws) and treaties in the United States and around the
              world.
            </p>
            <p className="text-[#535862 mb-4 text-lg font-normal">
              The Content and Marks are provided in or through the Services "AS
              IS" for your personal, non-commercial use only.
            </p>

            <h3 className="mb-3 text-xl font-medium">
              Your use of our Services
            </h3>
            <p className="text-[#535862 mb-4 text-lg font-normal">
              Subject to your compliance with these Legal Terms, including the
              "PROHIBITED ACTIVITIES" section below, we grant you a
              non-exclusive, non-transferable, revocable license to:
            </p>
            <ul className="mb-4 ml-6 list-disc text-gray-700">
              <li>access the Services; and</li>
              <li>
                download or print a copy of any portion of the Content to which
                you have properly gained access
              </li>
            </ul>
            <p className="text-[#535862 mb-4 text-lg font-normal">
              solely for your personal, non-commercial use.
            </p>
          </section>

          <section id="userreps">
            <h2 className="mb-4 text-3xl font-semibold text-[#181D27]">
              3. USER REPRESENTATIONS
            </h2>
            <p className="text-[#535862 mb-4 text-lg font-normal">
              By using the Services, you represent and warrant that:
            </p>
            <ul className="mb-4 ml-6 list-disc text-gray-700">
              <li>
                all registration information you submit will be true, accurate,
                current, and complete;
              </li>
              <li>
                you will maintain the accuracy of such information and promptly
                update such registration information as necessary;
              </li>
              <li>
                you have the legal capacity and you agree to comply with these
                Legal Terms;
              </li>
              <li>
                you are not a minor in the jurisdiction in which you reside;
              </li>
              <li>
                you will not access the Services through automated or non-human
                means, whether through a bot, script, or otherwise;
              </li>
              <li>
                you will not use the Services for any illegal or unauthorized
                purpose;
              </li>
              <li>
                your use of the Services will not violate any applicable law or
                regulation.
              </li>
            </ul>
          </section>

          <section id="userreg">
            <h2 className="mb-4 text-3xl font-semibold text-[#181D27]">
              4. USER REGISTRATION
            </h2>
            <p className="text-[#535862 mb-4 text-lg font-normal">
              You may be required to register to use the Services. You agree to
              keep your password confidential and will be responsible for all
              use of your account and password. We reserve the right to remove,
              reclaim, or change a username you select if we determine, in our
              sole discretion, that such username is inappropriate, obscene, or
              otherwise objectionable.
            </p>
          </section>

          <section id="purchases">
            <h2 className="mb-4 text-3xl font-semibold text-[#181D27]">
              5. PURCHASES AND PAYMENT
            </h2>
            <p className="text-[#535862 mb-4 text-lg font-normal">
              We accept the following forms of payment:
            </p>
            <ul className="mb-4 ml-6 list-disc text-gray-700">
              <li>PayPal</li>
              <li>Discover</li>
              <li>American Express</li>
              <li>Mastercard</li>
              <li>Visa</li>
            </ul>
            <p className="text-[#535862 mb-4 text-lg font-normal">
              You agree to provide current, complete, and accurate purchase and
              account information for all purchases made via the Services. You
              further agree to promptly update account and payment information,
              including email address, payment method, and payment card
              expiration date, so that we can complete your transactions and
              contact you as needed. Sales tax will be added to the price of
              purchases as deemed required by us. We may change prices at any
              time. All payments shall be in US dollars.
            </p>
          </section>

          <section id="subscriptions">
            <h2 className="mb-4 text-3xl font-semibold text-[#181D27]">
              6. SUBSCRIPTIONS
            </h2>
            <h3 className="mb-3 text-xl font-medium">Billing and Renewal</h3>
            <p className="text-[#535862 mb-4 text-lg font-normal">
              Your subscription will continue and automatically renew unless
              canceled. You consent to our charging your payment method on a
              recurring basis without requiring your prior approval for each
              recurring charge, until such time as you cancel the applicable
              order. The length of your billing cycle is monthly.
            </p>

            <h3 className="mb-3 text-xl font-medium">Cancellation</h3>
            <p className="text-[#535862 mb-4 text-lg font-normal">
              You can cancel your subscription at any time by logging into your
              account. Your cancellation will take effect at the end of the
              current paid term. If you have any questions or are unsatisfied
              with our Services, please email us at admin@bammbuu.co.
            </p>

            <h3 className="mb-3 text-xl font-medium">Fee Changes</h3>
            <p className="text-[#535862 mb-4 text-lg font-normal">
              We may, from time to time, make changes to the subscription fee
              and will communicate any price changes to you in accordance with
              applicable law.
            </p>
          </section>

          <section id="returnpolicy">
            <h2 className="mb-4 text-3xl font-semibold text-[#181D27]">
              7. POLICY
            </h2>
            <p className="text-[#535862 mb-4 text-lg font-normal">
              All sales are final and no refund will be issued.
            </p>
          </section>

          <section id="prohibited">
            <h2 className="mb-4 text-3xl font-semibold text-[#181D27]">
              8. PROHIBITED ACTIVITIES
            </h2>
            <p className="text-[#535862 mb-4 text-lg font-normal">
              You may not access or use the Services for any purpose other than
              that for which we make the Services available. The Services may
              not be used in connection with any commercial endeavors except
              those that are specifically endorsed or approved by us.
            </p>
            <p className="text-[#535862 mb-4 text-lg font-normal">
              As a user of the Services, you agree not to:
            </p>
            <ul className="mb-4 ml-6 list-disc text-gray-700">
              <li>
                Systematically retrieve data or other content from the Services
                to create or compile, directly or indirectly, a collection,
                compilation, database, or directory without written permission
                from us.
              </li>
              <li>
                Trick, defraud, or mislead us and other users, especially in any
                attempt to learn sensitive account information such as user
                passwords.
              </li>
              <li>
                Circumvent, disable, or otherwise interfere with
                security-related features of the Services.
              </li>
              <li>
                Disparage, tarnish, or otherwise harm, in our opinion, us and/or
                the Services.
              </li>
              <li>
                Use any information obtained from the Services in order to
                harass, abuse, or harm another person.
              </li>
              <li>
                Make improper use of our support services or submit false
                reports of abuse or misconduct.
              </li>
              <li>
                Use the Services in a manner inconsistent with any applicable
                laws or regulations.
              </li>
              <li>
                Engage in unauthorized framing of or linking to the Services.
              </li>
              <li>
                Upload or transmit (or attempt to upload or to transmit)
                viruses, Trojan horses, or other material that interferes with
                any party's uninterrupted use and enjoyment of the Services.
              </li>
              <li>
                Use the Services to advertise or offer to sell goods and
                services.
              </li>
            </ul>
          </section>

          <section id="ugc">
            <h2 className="mb-4 text-3xl font-semibold text-[#181D27] text-gray-900">
              9. USER GENERATED CONTRIBUTIONS
            </h2>
            <div className="space-y-4">
              <p>
                The Services may invite you to chat, contribute to, or
                participate in blogs, message boards, online forums, and other
                functionality during which you may create, submit, post,
                display, transmit, publish, distribute, or broadcast content and
                materials to us or through the Services, including but not
                limited to text, writings, video, audio, photographs, music,
                graphics, comments, reviews, rating suggestions, personal
                information, or other material ("Contributions").
              </p>
              <p>
                Any Submission that is publicly posted shall also be treated as
                a Contribution. You understand that Contributions may be
                viewable by other users of the Services and possibly through
                third-party websites.
              </p>
            </div>
          </section>

          <section id="license">
            <h2 className="mb-4 text-3xl font-semibold text-[#181D27] text-gray-900">
              10. CONTRIBUTION LICENSE
            </h2>
            <div className="space-y-4">
              <p>
                By posting Contributions, you grant us an unrestricted,
                unlimited, irrevocable, perpetual, non-exclusive, transferable,
                royalty-free, fully-paid, worldwide right and license to: use,
                copy, reproduce, distribute, sell, resell, publish, broadcast,
                retitle, store, publicly perform, publicly display, reformat,
                translate, excerpt (in whole or in part), and exploit your
                Contributions for any purpose, commercial, advertising, or
                otherwise.
              </p>
              <p>
                This license includes our use of your name, company name, and
                franchise name, as applicable, and any of the trademarks,
                service marks, trade names, logos, and personal and commercial
                images you provide.
              </p>
            </div>
          </section>

          <section id="mobile">
            <h2 className="mb-4 text-3xl font-semibold text-[#181D27] text-gray-900">
              11. MOBILE APPLICATION LICENSE
            </h2>
            <div className="space-y-4">
              <h3 className="text-xl font-medium text-gray-900">Use License</h3>
              <p>
                If you access the Services via the App, we grant you a
                revocable, non-exclusive, non-transferable, limited right to
                install and use the App on wireless electronic devices owned or
                controlled by you, and to access and use the App on such devices
                strictly in accordance with these Legal Terms.
              </p>
              <p>
                You shall not: (1) except as permitted by applicable law,
                decompile, reverse engineer, disassemble, attempt to derive the
                source code of, or decrypt the app; (2) make any modification,
                adaptation, improvement, enhancement, translation, or derivative
                work from the app; (3) violate any applicable laws, rules, or
                regulations in connection with your access or use of the app;
                (4) remove, alter, or obscure any proprietary notice (including
                any notice of copyright or trademark) posted by us or the
                licensors of the app; (5) use the app for any revenue generating
                endeavor, commercial enterprise, or other purpose for which it
                is not designed or intended; (6) make the app available over a
                network or other environment permitting access or use by
                multiple devices or users at the same time; (7) use the app for
                creating a product, service, or software that is, directly or
                indirectly, competitive with or in any way a substitute for the
                app; (8) use the app to send automated queries to any website or
                to send any unsolicited commercial email; or (9) use any
                proprietary information or any of our interfaces or our other
                intellectual property in the design, development, manufacture,
                licensing, or distribution of any applications, accessories, or
                devices for use with the app.
              </p>
            </div>
          </section>

          <section id="socialmedia">
            <h2 className="mb-4 text-3xl font-semibold text-[#181D27] text-gray-900">
              12. SOCIAL MEDIA
            </h2>
            <div className="space-y-4">
              <p>
                As part of the functionality of the Services, you may link your
                account with online accounts you have with third-party service
                providers (each such account, a "Third-Party Account") by
                either: (1) providing your Third-Party Account login information
                through the Services; or (2) allowing us to access your
                Third-Party Account, as is permitted under the applicable terms
                and conditions that govern your use of each Third-Party Account.
              </p>
              <p>
                You represent and warrant that you are entitled to disclose your
                Third-Party Account login information to us and/or grant us
                access to your Third-Party Account, without breach by you of any
                of the terms and conditions that govern your use of the
                applicable Third-Party Account, and without obligating us to pay
                any fees or making us subject to any usage limitations imposed
                by the third-party service provider of the Third-Party Account.
              </p>
              <p>
                By granting us access to any Third-Party Accounts, you
                understand that we may access, make available, and store any
                content that you have provided to and stored in your Third-Party
                Account so that it is available on and through the Services via
                your account. Unless otherwise specified in these Legal Terms,
                all Third-Party Account content, if any, will be considered to
                be User Contributions for all purposes of these Legal Terms.
              </p>
            </div>
          </section>

          <section id="thirdparty">
            <h2 className="mb-4 text-3xl font-semibold text-[#181D27] text-gray-900">
              13. THIRD-PARTY WEBSITES AND CONTENT
            </h2>
            <div className="space-y-4">
              <p>
                The Services may contain links to other websites ("Third-Party
                Websites") as well as articles, photographs, text, graphics,
                pictures, designs, music, sound, video, information,
                applications, software, and other content or items belonging to
                or originating from third parties ("Third-Party Content"). Such
                Third-Party Websites and Third-Party Content are not
                investigated, monitored, or checked for accuracy,
                appropriateness, or completeness by us, and we are not
                responsible for any Third-Party Websites accessed through the
                Services or any Third-Party Content posted on, available
                through, or installed from the Services, including the content,
                accuracy, offensiveness, opinions, reliability, privacy
                practices, or other policies of or contained in the Third-Party
                Websites or the Third-Party Content.
              </p>
            </div>
          </section>

          <section id="advertisers">
            <h2 className="mb-4 text-3xl font-semibold text-[#181D27] text-gray-900">
              14. ADVERTISERS
            </h2>
            <div className="space-y-4">
              <p>
                We allow advertisers to display their advertisements and other
                information in certain areas of the Services. We simply provide
                the space to place such advertisements, and we have no other
                relationship with advertisers. If you are an advertiser, you
                shall take full responsibility for any advertisements you place
                on the Services and any services provided on the Services or
                products sold through those advertisements.
              </p>
            </div>
          </section>

          <section id="sitemanage">
            <h2 className="mb-4 text-3xl font-semibold text-[#181D27] text-gray-900">
              15. SERVICES MANAGEMENT
            </h2>
            <div className="space-y-4">
              <p>
                We reserve the right, but not the obligation, to: (1) monitor
                the Services for violations of these Legal Terms; (2) take
                appropriate legal action against anyone who, in our sole
                discretion, violates the law or these Legal Terms, including
                without limitation, reporting such user to law enforcement
                authorities; (3) in our sole discretion and without limitation,
                refuse, restrict access to, limit the availability of, or
                disable (to the extent technologically feasible) any of your
                Contributions or any portion thereof; (4) in our sole discretion
                and without limitation, notice, or liability, to remove from the
                Services or otherwise disable all files and content that are
                excessive in size or are in any way burdensome to our systems;
                and (5) otherwise manage the Services in a manner designed to
                protect our rights and property and to facilitate the proper
                functioning of the Services.
              </p>
            </div>
          </section>

          <section id="privacy">
            <h2 className="mb-4 text-3xl font-semibold text-[#181D27] text-gray-900">
              16. PRIVACY POLICY
            </h2>
            <div className="space-y-4">
              <p>
                We care about data privacy and security. By using the Services,
                you agree to be bound by our Privacy Policy posted on the
                Services, which is incorporated into these Legal Terms. Please
                be advised the Services are hosted in the United States. If you
                access the Services from any other region of the world with laws
                or other requirements governing personal data collection, use,
                or disclosure that differ from applicable laws in the United
                States, then through your continued use of the Services, you are
                transferring your data to the United States, and you expressly
                consent to have your data transferred to and processed in the
                United States.
              </p>
            </div>
          </section>
          <section id="copyright">
            <h2 className="mb-4 text-3xl font-semibold text-[#181D27] text-gray-900">
              17. COPYRIGHT INFRINGEMENTS
            </h2>
            <div className="space-y-4">
              <p>
                We respect the intellectual property rights of others. If you
                believe that any material available on or through the Services
                infringes upon any copyright you own or control, please
                immediately notify us using the contact information provided
                below (a "Notification"). A copy of your Notification will be
                sent to the person who posted or stored the material addressed
                in the Notification. Please be advised that pursuant to
                applicable law you may be held liable for damages if you make
                material misrepresentations in a Notification. Thus, if you are
                not sure that material located on or linked to by the Services
                infringes your copyright, you should consider first contacting
                an attorney.
              </p>
            </div>
          </section>

          <section id="terms">
            <h2 className="mb-4 text-3xl font-semibold text-[#181D27] text-gray-900">
              18. TERM AND TERMINATION
            </h2>
            <div className="space-y-4">
              <p>
                These Legal Terms shall remain in full force and effect while
                you use the Services. WITHOUT LIMITING ANY OTHER PROVISION OF
                THESE LEGAL TERMS, WE RESERVE THE RIGHT TO, IN OUR SOLE
                DISCRETION AND WITHOUT NOTICE OR LIABILITY, DENY ACCESS TO AND
                USE OF THE SERVICES (INCLUDING BLOCKING CERTAIN IP ADDRESSES),
                TO ANY PERSON FOR ANY REASON OR FOR NO REASON, INCLUDING WITHOUT
                LIMITATION FOR BREACH OF ANY REPRESENTATION, WARRANTY, OR
                COVENANT CONTAINED IN THESE LEGAL TERMS OR OF ANY APPLICABLE LAW
                OR REGULATION. WE MAY TERMINATE YOUR USE OR PARTICIPATION IN THE
                SERVICES OR DELETE YOUR ACCOUNT AND ANY CONTENT OR INFORMATION
                THAT YOU POSTED AT ANY TIME, WITHOUT WARNING, IN OUR SOLE
                DISCRETION.
              </p>
              <p>
                If we terminate or suspend your account for any reason, you are
                prohibited from registering and creating a new account under
                your name, a fake or borrowed name, or the name of any third
                party, even if you may be acting on behalf of the third party.
                In addition to terminating or suspending your account, we
                reserve the right to take appropriate legal action, including
                without limitation pursuing civil, criminal, and injunctive
                redress.
              </p>
            </div>
          </section>

          <section id="modifications">
            <h2 className="mb-4 text-3xl font-semibold text-[#181D27] text-gray-900">
              19. MODIFICATIONS AND INTERRUPTIONS
            </h2>
            <div className="space-y-4">
              <p>
                We reserve the right to change, modify, or remove the contents
                of the Services at any time or for any reason at our sole
                discretion without notice. However, we have no obligation to
                update any information on our Services. We will not be liable to
                you or any third party for any modification, price change,
                suspension, or discontinuance of the Services.
              </p>
              <p>
                We cannot guarantee the Services will be available at all times.
                We may experience hardware, software, or other problems or need
                to perform maintenance related to the Services, resulting in
                interruptions, delays, or errors. We reserve the right to
                change, revise, update, suspend, discontinue, or otherwise
                modify the Services at any time or for any reason without notice
                to you. You agree that we have no liability whatsoever for any
                loss, damage, or inconvenience caused by your inability to
                access or use the Services during any downtime or discontinuance
                of the Services.
              </p>
            </div>
          </section>

          <section id="law">
            <h2 className="mb-4 text-3xl font-semibold text-[#181D27] text-gray-900">
              20. GOVERNING LAW
            </h2>
            <div className="space-y-4">
              <p>
                These Legal Terms shall be governed by and defined following the
                laws of the United States. Capital H Ventures LLC and yourself
                irrevocably consent that the courts of Texas shall have
                exclusive jurisdiction to resolve any dispute which may arise in
                connection with these Legal Terms.
              </p>
            </div>
          </section>
          <section id="disputes">
            <h2 className="mb-4 text-3xl font-semibold text-[#181D27] text-gray-900">
              21. DISPUTE RESOLUTION
            </h2>
            <div className="space-y-4">
              <h3 className="text-xl font-medium text-gray-900">
                Binding Arbitration
              </h3>
              <p>
                If the Parties are unable to resolve a Dispute through informal
                negotiations, the Dispute (except those Disputes expressly
                excluded below) will be finally and exclusively resolved by
                binding arbitration. YOU UNDERSTAND THAT WITHOUT THIS PROVISION,
                YOU WOULD HAVE THE RIGHT TO SUE IN COURT AND HAVE A JURY TRIAL.
                The arbitration shall be commenced and conducted under the
                Commercial Arbitration Rules of the American Arbitration
                Association ("AAA") and, where appropriate, the AAA's
                Supplementary Procedures for Consumer Related Disputes ("AAA
                Consumer Rules"), both of which are available at the AAA website
                www.adr.org.
              </p>
              <p>
                Your arbitration fees and your share of arbitrator compensation
                shall be governed by the AAA Consumer Rules and, where
                appropriate, limited by the AAA Consumer Rules. If such costs
                are determined by the arbitrator to be excessive, we will pay
                all arbitration fees and expenses.
              </p>
              <p>
                The arbitration may be conducted in person, through the
                submission of documents, by phone, or online. The arbitrator
                will make a decision in writing, but need not provide a
                statement of reasons unless requested by either Party. The
                arbitrator must follow applicable law, and any award may be
                challenged if the arbitrator fails to do so.
              </p>

              <h3 className="text-xl font-medium text-gray-900">
                Restrictions
              </h3>
              <p>
                The Parties agree that any arbitration shall be limited to the
                Dispute between the Parties individually. To the full extent
                permitted by law, (a) no arbitration shall be joined with any
                other proceeding; (b) there is no right or authority for any
                Dispute to be arbitrated on a class-action basis or to utilize
                class action procedures; and (c) there is no right or authority
                for any Dispute to be brought in a purported representative
                capacity on behalf of the general public or any other persons.
              </p>

              <h3 className="text-xl font-medium text-gray-900">
                Exceptions to Informal Negotiations and Arbitration
              </h3>
              <p>
                The Parties agree that the following Disputes are not subject to
                the above provisions concerning informal negotiations binding
                arbitration: (a) any Disputes seeking to enforce or protect, or
                concerning the validity of, any of the intellectual property
                rights of a Party; (b) any Dispute related to, or arising from,
                allegations of theft, piracy, invasion of privacy, or
                unauthorized use; and (c) any claim for injunctive relief.
              </p>
              <p>
                If this provision is found to be illegal or unenforceable, then
                neither Party will elect to arbitrate any Dispute falling within
                that portion of this provision found to be illegal or
                unenforceable and such Dispute shall be decided by a court of
                competent jurisdiction within the courts listed for jurisdiction
                above, and the Parties agree to submit to the personal
                jurisdiction of that court.
              </p>
            </div>
          </section>

          <section id="corrections">
            <h2 className="mb-4 text-3xl font-semibold text-[#181D27] text-gray-900">
              22. CORRECTIONS
            </h2>
            <div className="space-y-4">
              <p>
                There may be information on the Services that contains
                typographical errors, inaccuracies, or omissions, including
                descriptions, pricing, availability, and various other
                information. We reserve the right to correct any errors,
                inaccuracies, or omissions and to change or update the
                information on the Services at any time, without prior notice.
              </p>
            </div>
          </section>

          <section id="disclaimer">
            <h2 className="mb-4 text-3xl font-semibold text-[#181D27] text-gray-900">
              23. DISCLAIMER
            </h2>
            <div className="space-y-4">
              <p>
                THE SERVICES ARE PROVIDED ON AN AS-IS AND AS-AVAILABLE BASIS.
                YOU AGREE THAT YOUR USE OF THE SERVICES WILL BE AT YOUR SOLE
                RISK. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL
                WARRANTIES, EXPRESS OR IMPLIED, IN CONNECTION WITH THE SERVICES
                AND YOUR USE THEREOF, INCLUDING, WITHOUT LIMITATION, THE IMPLIED
                WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
                AND NON-INFRINGEMENT. WE MAKE NO WARRANTIES OR REPRESENTATIONS
                ABOUT THE ACCURACY OR COMPLETENESS OF THE SERVICES' CONTENT OR
                THE CONTENT OF ANY WEBSITES OR MOBILE APPLICATIONS LINKED TO THE
                SERVICES AND WE WILL ASSUME NO LIABILITY OR RESPONSIBILITY FOR
                ANY (1) ERRORS, MISTAKES, OR INACCURACIES OF CONTENT AND
                MATERIALS, (2) PERSONAL INJURY OR PROPERTY DAMAGE, OF ANY NATURE
                WHATSOEVER, RESULTING FROM YOUR ACCESS TO AND USE OF THE
                SERVICES, (3) ANY UNAUTHORIZED ACCESS TO OR USE OF OUR SECURE
                SERVERS AND/OR ANY AND ALL PERSONAL INFORMATION AND/OR FINANCIAL
                INFORMATION STORED THEREIN, (4) ANY INTERRUPTION OR CESSATION OF
                TRANSMISSION TO OR FROM THE SERVICES, (5) ANY BUGS, VIRUSES,
                TROJAN HORSES, OR THE LIKE WHICH MAY BE TRANSMITTED TO OR
                THROUGH THE SERVICES BY ANY THIRD PARTY, AND/OR (6) ANY ERRORS
                OR OMISSIONS IN ANY CONTENT AND MATERIALS OR FOR ANY LOSS OR
                DAMAGE OF ANY KIND INCURRED AS A RESULT OF THE USE OF ANY
                CONTENT POSTED, TRANSMITTED, OR OTHERWISE MADE AVAILABLE VIA THE
                SERVICES.
              </p>
              <p>
                WE DO NOT WARRANT, ENDORSE, GUARANTEE, OR ASSUME RESPONSIBILITY
                FOR ANY PRODUCT OR SERVICE ADVERTISED OR OFFERED BY A THIRD
                PARTY THROUGH THE SERVICES, ANY HYPERLINKED WEBSITE, OR ANY
                WEBSITE OR MOBILE APPLICATION FEATURED IN ANY BANNER OR OTHER
                ADVERTISING, AND WE WILL NOT BE A PARTY TO OR IN ANY WAY BE
                RESPONSIBLE FOR MONITORING ANY TRANSACTION BETWEEN YOU AND ANY
                THIRD-PARTY PROVIDERS OF PRODUCTS OR SERVICES.
              </p>
              <p>
                AS WITH THE PURCHASE OF A PRODUCT OR SERVICE THROUGH ANY MEDIUM
                OR IN ANY ENVIRONMENT, YOU SHOULD USE YOUR BEST JUDGMENT AND
                EXERCISE CAUTION WHERE APPROPRIATE.
              </p>
            </div>
          </section>
          <section id="liability">
            <h2 className="mb-4 text-3xl font-semibold text-[#181D27] text-gray-900">
              24. LIMITATIONS OF LIABILITY
            </h2>
            <div className="space-y-4">
              <p>
                IN NO EVENT WILL WE OR OUR DIRECTORS, EMPLOYEES, OR AGENTS BE
                LIABLE TO YOU OR ANY THIRD PARTY FOR ANY DIRECT, INDIRECT,
                CONSEQUENTIAL, EXEMPLARY, INCIDENTAL, SPECIAL, OR PUNITIVE
                DAMAGES, INCLUDING LOST PROFIT, LOST REVENUE, LOSS OF DATA, OR
                OTHER DAMAGES ARISING FROM YOUR USE OF THE SERVICES, EVEN IF WE
                HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
              </p>
              <p>
                NOTWITHSTANDING ANYTHING TO THE CONTRARY CONTAINED HEREIN, OUR
                LIABILITY TO YOU FOR ANY CAUSE WHATSOEVER AND REGARDLESS OF THE
                FORM OF THE ACTION, WILL AT ALL TIMES BE LIMITED TO THE AMOUNT
                PAID, IF ANY, BY YOU TO US DURING THE SIX (6) MONTH PERIOD PRIOR
                TO ANY CAUSE OF ACTION ARISING. CERTAIN US STATE LAWS AND
                INTERNATIONAL LAWS DO NOT ALLOW LIMITATIONS ON IMPLIED
                WARRANTIES OR THE EXCLUSION OR LIMITATION OF CERTAIN DAMAGES. IF
                THESE LAWS APPLY TO YOU, SOME OR ALL OF THE ABOVE DISCLAIMERS OR
                LIMITATIONS MAY NOT APPLY TO YOU, AND YOU MAY HAVE ADDITIONAL
                RIGHTS.
              </p>
            </div>
          </section>

          <section id="indemnification">
            <h2 className="mb-4 text-3xl font-semibold text-[#181D27] text-gray-900">
              25. INDEMNIFICATION
            </h2>
            <div className="space-y-4">
              <p>
                You agree to defend, indemnify, and hold us harmless, including
                our subsidiaries, affiliates, and all of our respective
                officers, agents, partners, and employees, from and against any
                loss, damage, liability, claim, or demand, including reasonable
                attorneys' fees and expenses, made by any third party due to or
                arising out of: (1) your Contributions; (2) use of the Services;
                (3) breach of these Legal Terms; (4) any breach of your
                representations and warranties set forth in these Legal Terms;
                (5) your violation of the rights of a third party, including but
                not limited to intellectual property rights; or (6) any overt
                harmful act toward any other user of the Services with whom you
                connected via the Services.
              </p>
              <p>
                Notwithstanding the foregoing, we reserve the right, at your
                expense, to assume the exclusive defense and control of any
                matter for which you are required to indemnify us, and you agree
                to cooperate, at your expense, with our defense of such claims.
                We will use reasonable efforts to notify you of any such claim,
                action, or proceeding which is subject to this indemnification
                upon becoming aware of it.
              </p>
            </div>
          </section>

          <section id="userdata">
            <h2 className="mb-4 text-3xl font-semibold text-[#181D27] text-gray-900">
              26. USER DATA
            </h2>
            <div className="space-y-4">
              <p>
                We will maintain certain data that you transmit to the Services
                for the purpose of managing the performance of the Services, as
                well as data relating to your use of the Services. Although we
                perform regular routine backups of data, you are solely
                responsible for all data that you transmit or that relates to
                any activity you have undertaken using the Services. You agree
                that we shall have no liability to you for any loss or
                corruption of any such data, and you hereby waive any right of
                action against us arising from any such loss or corruption of
                such data.
              </p>
            </div>
          </section>

          <section id="electronic">
            <h2 className="mb-4 text-3xl font-semibold text-[#181D27] text-gray-900">
              27. ELECTRONIC COMMUNICATIONS, TRANSACTIONS, AND SIGNATURES
            </h2>
            <div className="space-y-4">
              <p>
                Visiting the Services, sending us emails, and completing online
                forms constitute electronic communications. You consent to
                receive electronic communications, and you agree that all
                agreements, notices, disclosures, and other communications we
                provide to you electronically, via email and on the Services,
                satisfy any legal requirement that such communication be in
                writing. YOU HEREBY AGREE TO THE USE OF ELECTRONIC SIGNATURES,
                CONTRACTS, ORDERS, AND OTHER RECORDS, AND TO ELECTRONIC DELIVERY
                OF NOTICES, POLICIES, AND RECORDS OF TRANSACTIONS INITIATED OR
                COMPLETED BY US OR VIA THE SERVICES.
              </p>
              <p>
                You hereby waive any rights or requirements under any statutes,
                regulations, rules, ordinances, or other laws in any
                jurisdiction which require an original signature or delivery or
                retention of non-electronic records, or to payments or the
                granting of credits by any means other than electronic means.
              </p>
            </div>
          </section>

          <section id="california">
            <h2 className="mb-4 text-3xl font-semibold text-[#181D27] text-gray-900">
              28. CALIFORNIA USERS AND RESIDENTS
            </h2>
            <div className="space-y-4">
              <p>
                If any complaint with us is not satisfactorily resolved, you can
                contact the Complaint Assistance Unit of the Division of
                Consumer Services of the California Department of Consumer
                Affairs in writing at 1625 North Market Blvd., Suite N 112,
                Sacramento, California 95834 or by telephone at (800) 952-5210
                or (916) 445-1254.
              </p>
            </div>
          </section>

          <section id="misc">
            <h2 className="mb-4 text-3xl font-semibold text-[#181D27] text-gray-900">
              29. MISCELLANEOUS
            </h2>
            <div className="space-y-4">
              <p>
                These Legal Terms and any policies or operating rules posted by
                us on the Services or in respect to the Services constitute the
                entire agreement and understanding between you and us. Our
                failure to exercise or enforce any right or provision of these
                Legal Terms shall not operate as a waiver of such right or
                provision. These Legal Terms operate to the fullest extent
                permissible by law.
              </p>
              <p>
                We may assign any or all of our rights and obligations to others
                at any time. We shall not be responsible or liable for any loss,
                damage, delay, or failure to act caused by any cause beyond our
                reasonable control. If any provision or part of a provision of
                these Legal Terms is determined to be unlawful, void, or
                unenforceable, that provision or part of the provision is deemed
                severable from these Legal Terms and does not affect the
                validity and enforceability of any remaining provisions.
              </p>
            </div>
          </section>

          <section id="contact">
            <h2 className="mb-4 text-3xl font-semibold text-[#181D27] text-gray-900">
              30. CONTACT US
            </h2>
            <div className="space-y-4">
              <p>
                In order to resolve a complaint regarding the Services or to
                receive further information regarding use of the Services,
                please contact us at:
              </p>
              <div className="pl-4">
                <p>Capital H Ventures LLC</p>
                <p>17350 State Hwy 249, Ste 220 #22916</p>
                <p>Houston, TX 77064</p>
                <p>United States</p>
                <p>Phone: 512-814-8731</p>
                <p>Email: admin@bammbuu.co</p>
              </div>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TermsConditions;
