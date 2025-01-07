import React, { useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
} from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import ClipLoader from "react-spinners/ClipLoader";
import { setDoc } from "firebase/firestore";
import { doc } from "firebase/firestore";
const TEACHINGLANGUAGES = ["English", "Spanish"];

const LANGUAGES = [
  { code: "eng", name: "English" },
  { code: "spa", name: "Spanish" },
  { code: "fra", name: "French" },
  { code: "deu", name: "German" },
  { code: "ita", name: "Italian" },
  { code: "por", name: "Portuguese" },
  { code: "rus", name: "Russian" },
  { code: "jpn", name: "Japanese" },
  { code: "kor", name: "Korean" },
  { code: "zho", name: "Chinese" },
  { code: "ara", name: "Arabic" },
  { code: "hin", name: "Hindi" },
  { code: "ben", name: "Bengali" },
  { code: "pan", name: "Punjabi" },
  { code: "vie", name: "Vietnamese" },
];

const COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo (Congo-Brazzaville)",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czechia (Czech Republic)",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini (fmr. Swaziland)",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Holy See",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestine State",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States of America",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
];
const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    nativeLanguage: "",
    learningLanguage: "",
    proficiency: "Normal",
    country: "",
  });

  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [loading1, setLoading1] = useState(false);

  const resetStates = async () => {
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setShowConfirmPassword(false);
      setVerificationSent(false);
      setIsEmailVerified(false);
      setHasProfile(false);
      setProfileData({
        name: "",
        nativeLanguage: "",
        learningLanguage: "",
        proficiency: "Normal",
        country: "",
      });
    } catch (error) {
      console.error("Error resetting states:", error);
    }
  };

  const handleInitialSignup = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    setLoading1(true);
    toast.info("Creating temporary account for verification...");

    try {
      // Create a temporary account for verification
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Send verification email
      await sendEmailVerification(userCredential.user);

      setVerificationSent(true);
      toast.success("Verification email sent!");
    } catch (error) {
      toast.error(`Signup error: ${error.message}`);
      await resetStates();
    } finally {
      setLoading1(false);
    }
  };

  useEffect(() => {
    let verificationTimer;

    const checkEmailVerification = async () => {
      try {
        if (auth.currentUser) {
          await auth.currentUser.reload();
          if (auth.currentUser.emailVerified) {
            setIsEmailVerified(true);
            clearInterval(verificationTimer);
          }
        }
      } catch (error) {
        console.error("Error checking verification:", error);
      }
    };

    if (verificationSent && !isEmailVerified) {
      verificationTimer = setInterval(checkEmailVerification, 3000);
    }

    return () => {
      if (verificationTimer) {
        clearInterval(verificationTimer);
      }
    };
  }, [verificationSent, isEmailVerified]);

  const handleResendEmail = async () => {
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        toast.success("Verification email resent!");
      } else {
        // If user session expired, create new temporary account
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        await sendEmailVerification(userCredential.user);
        toast.success("Verification email sent to new account!");
      }
    } catch (error) {
      toast.error(`Error sending verification email: ${error.message}`);
    }
  };

  const handleProfileSubmit = async (e) => {
    console.log(profileData);
    e.preventDefault();
    setLoading1(true);
    toast.info("Completing account setup...");

    try {
      if (!auth.currentUser || !auth.currentUser.emailVerified) {
        throw new Error("Please verify your email first");
      }

      const userData = {
        adminOfClasses: [],
        adminOfGroups: [],
        country: profileData.country,
        currentStreak: 0,
        email: auth.currentUser.email,
        enrolledClasses: [],
        joinedGroups: [],
        lastLoggedIn: new Date(),
        learningLanguage: profileData.learningLanguage,
        learningLanguageProficiency: profileData.proficiency,
        name: profileData.name,
        nativeLanguage: profileData.nativeLanguage,
        photoUrl: "",
        savedDocuments: [],
        tier: 1,
        uid: auth.currentUser.uid,
      };

      await setDoc(doc(db, "students", auth.currentUser.uid), userData);

      const notificationPreferences = {
        appUpdates: true,
        classReminder: true,
        groupChat: true,
        newMessages: true,
        resourceAssign: true,
        userId: auth.currentUser.uid,
      };

      await setDoc(
        doc(db, "notification_preferences", auth.currentUser.uid),
        notificationPreferences
      );

      // Sign out and clear any existing session data
      await signOut(auth);
      sessionStorage.removeItem("user");

      toast.success("Account setup completed! Please log in.");
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(`Profile creation failed: ${error.message}`);
      console.error(error);
    } finally {
      setLoading1(false);
    }
  };

  const handleBackToSignup = async () => {
    await resetStates();
  };

  if (loading || loading1) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ClipLoader color="#14B82C" size={50} />
      </div>
    );
  }

  if (verificationSent && !isEmailVerified) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white ">
        <div className="w-full max-w-md p-8 bg-white rounded-3xl border-2 border-[#e7e7e7]">
          <div className="space-y-4 text-center">
            <div className="flex justify-center mb-6">
              <img alt="bambuu" src="/images/email_verification.png" />
            </div>
            <h2 className="text-3xl font-bold">Email Verification</h2>
            <p className="text-lg text-gray-600">
              An email with verification link has been sent to {email}
            </p>
            <button
              onClick={handleBackToSignup}
              className="w-full py-3 text-black border border-black bg-[#ffbf00] rounded-full hover:bg-[#cc9900] focus:outline-none"
            >
              Sign up with different email
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isEmailVerified && !hasProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="w-full max-w-md p-8 bg-white  border-2 border-[#e7e7e7] rounded-3xl">
          <div className="space-y-4">
            <div className="flex justify-center">
              <img alt="babuu" src="/images/complete_profile.png" />
            </div>

            <h2 className="text-3xl font-bold text-center">Complete Profile</h2>
            <p className="text-center text-gray-600">
              Add your personal details to gets started.
            </p>

            <form onSubmit={handleProfileSubmit} className="mt-6 space-y-6">
              <div className="space-y-1">
                <label className="block text-sm font-medium">Name</label>

                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) =>
                    setProfileData({ ...profileData, name: e.target.value })
                  }
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium">
                  Native Language
                </label>
                <select
                  value={profileData.nativeLanguage}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      nativeLanguage: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 text-gray-600 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select your native language</option>
                  {LANGUAGES.map((language) => (
                    <option key={language.code} value={language.name}>
                      {language.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium">
                  Learning Language
                </label>
                <select
                  value={profileData.learningLanguage}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      learningLanguage: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 text-gray-600 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select language you want to learn</option>
                  {TEACHINGLANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium">
                  Your Proficiency in {profileData.learningLanguage || "[x]"}
                </label>
                <div className="flex gap-2">
                  {["Normal", "Intermediate", "Advanced"].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() =>
                        setProfileData({ ...profileData, proficiency: level })
                      }
                      className={`flex-1 py-2 px-4 rounded-full border ${
                        profileData.proficiency === level
                          ? "border-green-500 bg-green-50 text-green-600"
                          : "border-gray-200 text-gray-600"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium">Country</label>

                <select
                  value={profileData.country}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      country: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 text-gray-600 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select your country</option>
                  {COUNTRIES.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 mt-8 text-black bg-green-500 border border-black rounded-full hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-3xl">
        <div className="mb-8 space-y-2 text-center">
          <h1 className="text-3xl font-bold">Sign Up</h1>
          <p className="text-gray-600">Let's create a new account!</p>
        </div>

        <form onSubmit={handleInitialSignup} className="space-y-6">
          <div className="space-y-1">
            <label className="block text-sm font-medium">Email</label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute transform -translate-y-1/2 right-3 top-1/2"
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5 text-gray-500"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5 text-gray-500"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute text-gray-500 transform -translate-y-1/2 right-3 top-1/2"
              >
                {showConfirmPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5 text-gray-500"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5 text-gray-500"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 mt-8 border border-black text-black bg-[#14b82c] rounded-full hover:bg-[#119523] focus:outline-none focus:ring-2 focus:ring-[#119523] focus:ring-offset-2"
          >
            Create Account
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 text-gray-500 bg-white">
              or continue with
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-50"
            onClick={() => toast.info("Google signin coming soon!")}
          >
            <img
              alt="google"
              src="/images/google-button.png"
              className="w-5 h-5 mr-2"
            />
            <span>Google</span>
          </button>
          <button
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-50"
            onClick={() => toast.info("Facebook signin coming soon!")}
          >
            <img
              alt="facebook"
              src="/images/fb-button.png"
              className="w-5 h-5 mr-2"
            />
            <span>Facebook</span>
          </button>
        </div>

        <div className="mb-4 text-sm text-center text-gray-500">
          <p>
            By signing up, you agree to our{" "}
            <Link to="/terms" className="text-black hover:underline">
              Terms & Conditions
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-black hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>

        <div className="text-sm text-center text-gray-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-green-600 hover:text-green-700"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
