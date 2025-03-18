import React, { useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
} from "firebase/auth";
import { OAuthProvider } from "firebase/auth";

import { messaging } from "../firebaseConfig";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import ClipLoader from "react-spinners/ClipLoader";
import { setDoc } from "firebase/firestore";
import { doc } from "firebase/firestore";
import { getToken } from "firebase/messaging";
import Modal from "react-modal";
import { updateDoc, serverTimestamp, getDoc } from "firebase/firestore";

Modal.setAppElement("#root");

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
  const appleProvider = new OAuthProvider("apple.com");

  const [profileData, setProfileData] = useState({
    name: "",
    nativeLanguage: "",
    learningLanguage: "",
    proficiency: "Beginner",
    country: "",
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const navigate = useNavigate();
  const { user, loading, updateUserData } = useAuth();
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

  const getFCMToken = async () => {
    try {
      const currentToken = await getToken(messaging, {
        vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY,
      });
      return currentToken || null;
    } catch (error) {
      console.error("Error getting FCM token:", error);
      return null;
    }
  };

  const handleProfileSubmit = async (e) => {
    console.log(profileData);
    e.preventDefault();
    setLoading1(true);
    const loadingToastId = toast.loading("Completing account setup...");

    try {
      if (!auth.currentUser || !auth.currentUser.emailVerified) {
        throw new Error("Please verify your email first");
      }
      const fcmToken = await getFCMToken();

      const userData = {
        adminOfClasses: [],
        adminOfGroups: [],
        country: profileData.country,
        currentStreak: 1, // Set initial streak to 1 for first login
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
        freeAccess: false,
        languagePreference: "en",
        uid: auth.currentUser.uid,
        fcmToken: fcmToken || "",
        credits: 0,
        subscriptions: [
          {
            endDate: null,
            startDate: null,
            type: "None",
          },
        ],
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

      await setDoc(doc(db, "user_accounts", auth.currentUser.uid), {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        sign_up_method: "email", // or dynamically detect sign-up method
        created_at: serverTimestamp(),
      });

      // Update the user data in context
      const sessionUserData = {
        ...userData,
        userType: "student",
      };
      updateUserData(sessionUserData);

      toast.update(loadingToastId, {
        render: "Account created successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      // Show success modal instead of navigating
      setHasProfile(true);

      setShowSuccessModal(true);
    } catch (error) {
      toast.update(loadingToastId, {
        render: `Profile creation failed: ${error.message}`,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
      console.error(error);
    } finally {
      setLoading1(false);
    }
  };

  const handleSkip = () => {
    navigate("/learn", { replace: true });
  };

  const handleOnboarding = () => {
    navigate("/onboarding", { replace: true });
  };

  const handleBackToSignup = async () => {
    await resetStates();
  };

  //------------------------------------------------google and fb---------------------------------//
  const googleProvider = new GoogleAuthProvider();
  const facebookProvider = new FacebookAuthProvider();

  const handleGoogleLoginStudent = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userRef = doc(db, "students", user.uid);
      const userDoc = await getDoc(userRef);

      const notificationPrefsRef = doc(
        db,
        "notification_preferences",
        user.uid
      );
      const notificationPrefsDoc = await getDoc(notificationPrefsRef);

      let isFirstTimeLogin = false;
      const fcmToken = await getFCMToken();

      if (!userDoc.exists()) {
        isFirstTimeLogin = true;
        const newUserData = {
          email: user.email,
          name: user.displayName || "",
          uid: user.uid,
          enrolledClasses: [],
          joinedGroups: [],
          adminOfClasses: [],
          adminOfGroups: [],
          lastLoggedIn: serverTimestamp(),
          learningLanguage: "",
          learningLanguageProficiency: "Beginner",
          nativeLanguage: "",
          freeAccess: false,
          country: "",
          photoUrl: "",
          savedDocuments: [],
          currentStreak: 1,
          fcmToken: fcmToken || "",
          credits: 0,
          subscriptions: [
            {
              endDate: null,
              startDate: null,
              type: "None",
            },
          ],
        };

        await setDoc(userRef, newUserData);

        if (!notificationPrefsDoc.exists()) {
          await setDoc(notificationPrefsRef, {
            userId: user.uid,
            appUpdates: true,
            classReminder: true,
            groupChat: true,
            newMessages: true,
            resourceAssign: true,
          });
        }

        await setDoc(doc(db, "user_accounts", auth.currentUser.uid), {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email,
          sign_up_method: "google",
          created_at: serverTimestamp(),
        });

        updateUserData({
          ...newUserData,
          lastLoggedIn: new Date(),
          userType: "student",
        });
      } else {
        const userData = userDoc.data();
        const lastLoggedIn = userData.lastLoggedIn
          ? userData.lastLoggedIn.toDate()
          : null;
        const currentStreak = userData.currentStreak || 0;

        const now = new Date();
        let updatedStreak = currentStreak;

        if (lastLoggedIn) {
          const lastLoginDate = new Date(
            lastLoggedIn.getFullYear(),
            lastLoggedIn.getMonth(),
            lastLoggedIn.getDate()
          );
          const currentDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );

          const differenceInDays =
            (currentDate - lastLoginDate) / (1000 * 60 * 60 * 24);

          if (differenceInDays === 1) {
            updatedStreak = currentStreak + 1;
          } else if (differenceInDays > 1) {
            updatedStreak = 1;
          }
        } else {
          updatedStreak = 1;
        }

        await updateDoc(userRef, {
          lastLoggedIn: serverTimestamp(),
          currentStreak: updatedStreak,
        });

        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          const fcmToken = await getToken(messaging, {
            vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY,
          });
          console.log("FCM Token:", fcmToken);

          await updateDoc(userRef, {
            fcmToken: fcmToken,
          });
        } else {
          console.warn("Notification permission not granted");
        }

        updateUserData({
          ...userData,
          currentStreak: updatedStreak,
          lastLoggedIn: now,
          userType: "student",
        });
      }

      toast.success("Logged in successfully!", { autoClose: 3000 });

      if (isFirstTimeLogin || !userDoc.data().name) {
        setIsEmailVerified(true);
        setHasProfile(false);
      } else {
        navigate("/learn", { replace: true });
      }
    } catch (error) {
      console.error("Error during Google login:", error);
      updateUserData(null);

      toast.error("Invalid email or password", { autoClose: 5000 });
    }
  };

  const handleAppleLoginStudent = async () => {
    try {
      const result = await signInWithPopup(auth, appleProvider);
      const user = result.user;

      const userRef = doc(db, "students", user.uid);
      const userDoc = await getDoc(userRef);

      const notificationPrefsRef = doc(
        db,
        "notification_preferences",
        user.uid
      );
      const notificationPrefsDoc = await getDoc(notificationPrefsRef);

      let isFirstTimeLogin = false;
      const fcmToken = await getFCMToken();

      if (!userDoc.exists()) {
        isFirstTimeLogin = true;
        const newUserData = {
          email: user.email,
          name: user.displayName || "",
          uid: user.uid,
          enrolledClasses: [],
          joinedGroups: [],
          adminOfClasses: [],
          adminOfGroups: [],
          lastLoggedIn: serverTimestamp(),
          learningLanguage: "",
          learningLanguageProficiency: "Beginner",
          nativeLanguage: "",
          freeAccess: false,
          country: "",
          photoUrl: "",
          savedDocuments: [],
          currentStreak: 1,
          fcmToken: fcmToken || "",
          credits: 0,
          subscriptions: [
            {
              endDate: null,
              startDate: null,
              type: "None",
            },
          ],
        };

        await setDoc(userRef, newUserData);

        if (!notificationPrefsDoc.exists()) {
          await setDoc(notificationPrefsRef, {
            userId: user.uid,
            appUpdates: true,
            classReminder: true,
            groupChat: true,
            newMessages: true,
            resourceAssign: true,
          });
        }

        updateUserData({
          ...newUserData,
          lastLoggedIn: new Date(),
          userType: "student",
        });
      } else {
        const userData = userDoc.data();
        const lastLoggedIn = userData.lastLoggedIn
          ? userData.lastLoggedIn.toDate()
          : null;
        const currentStreak = userData.currentStreak || 0;

        const now = new Date();
        let updatedStreak = currentStreak;

        if (lastLoggedIn) {
          const lastLoginDate = new Date(
            lastLoggedIn.getFullYear(),
            lastLoggedIn.getMonth(),
            lastLoggedIn.getDate()
          );
          const currentDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );

          const differenceInDays =
            (currentDate - lastLoginDate) / (1000 * 60 * 60 * 24);

          if (differenceInDays === 1) {
            updatedStreak = currentStreak + 1;
          } else if (differenceInDays > 1) {
            updatedStreak = 1;
          }
        } else {
          updatedStreak = 1;
        }

        await updateDoc(userRef, {
          lastLoggedIn: serverTimestamp(),
          currentStreak: updatedStreak,
        });

        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          const fcmToken = await getToken(messaging, {
            vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY,
          });
          console.log("FCM Token:", fcmToken);

          await updateDoc(userRef, {
            fcmToken: fcmToken,
          });
        } else {
          console.warn("Notification permission not granted");
        }

        updateUserData({
          ...userData,
          currentStreak: updatedStreak,
          lastLoggedIn: now,
          userType: "student",
        });
      }

      toast.success("Logged in successfully!", { autoClose: 3000 });

      if (isFirstTimeLogin || !userDoc.data().name) {
        setIsEmailVerified(true);
        setHasProfile(false);
      } else {
        navigate("/learn", { replace: true });
      }
    } catch (error) {
      console.error("Error during Apple login:", error);
      updateUserData(null);

      toast.error("Failed to log in with Apple", { autoClose: 5000 });
    }
  };

  const handleFacebookLogin = async () => {
    const facebookProvider = new FacebookAuthProvider();
    try {
      const result = await signInWithPopup(auth, facebookProvider);
      const user = result.user;

      // Check if user data already exists in Firestore
      const userDoc = await getDoc(doc(db, "students", user.uid));
      if (!userDoc.exists()) {
        // Set initial data with empty values if it doesn't exist
        await setDoc(doc(db, "students", user.uid), {
          email: user.email,
          nickname: "",
          country: "",
          learningLanguage: "",
          nativeLanguage: "",
          accountType: "user",
          timeZone: "",
          // createdAt: new Date(),
        });
      }

      navigate("/learn", { replace: true });
    } catch (error) {
      console.error("Error during Facebook login:", error);
    }
  };

  //---------------------------------------------------------------------------------------------------//

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
        <div className="w-full max-w-md p-8 bg-white rounded-3xl border border-[#e7e7e7]">
          <div className="space-y-4 text-center">
            <div className="flex justify-center mb-6">
              <img alt="bambuu" src="/svgs/email-verify.svg" />
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
      <div className="flex items-center justify-center min-h-screen p-4 bg-white">
        <div className="w-full max-w-md p-6 my-4 bg-white border border-gray-200 rounded-3xl">
          <div className="space-y-3">
            <div className="flex justify-center">
              <img alt="babuu" src="/svgs/signup.svg" />
            </div>

            <h2 className="text-2xl font-bold text-center md:text-3xl">
              Complete Profile
            </h2>
            <p className="text-sm text-center text-gray-600 md:text-base">
              Add your personal details to gets started.
            </p>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium">Name</label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) =>
                    setProfileData({ ...profileData, name: e.target.value })
                  }
                  placeholder="Enter your name"
                  className="w-full p-2 border border-gray-300 rounded-3xl focus:border-[#14B82C] focus:ring-0 focus:outline-none"
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
                  className="w-full px-4 py-2 text-gray-600 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  className="w-full px-4 py-2 text-gray-600 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select language you want to learn</option>
                  {TEACHINGLANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
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
                  {["Beginner", "Intermediate", "Advanced"].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() =>
                        setProfileData({ ...profileData, proficiency: level })
                      }
                      className={`flex-1 py-1.5 px-2 text-sm rounded-full border ${
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
                    setProfileData({ ...profileData, country: e.target.value })
                  }
                  className="w-full px-4 py-2 text-gray-600 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
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
                className="w-full py-2.5 mt-4 text-black bg-[#14B82C] border border-black rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
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
    <>
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full max-w-md p-8 bg-white rounded-3xl">
          <div className="mb-8 space-y-2 text-center">
            <h1 className="text-3xl font-bold">Sign Up</h1>
            <p className="text-lg text-gray-600">Let's create a new account!</p>
          </div>

          <form onSubmit={handleInitialSignup} className="space-y-6">
            <div className="space-y-1">
              <label className="block text-sm font-medium">Email</label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full p-2 border border-gray-300 rounded-3xl focus:border-[#14B82C] focus:ring-0 focus:outline-none"
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
                  className="w-full p-2 border border-gray-300 rounded-3xl focus:border-[#14B82C] focus:ring-0 focus:outline-none"
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
                  className="w-full p-2 border border-gray-300 rounded-3xl focus:border-[#14B82C] focus:ring-0 focus:outline-none"
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

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleGoogleLoginStudent}
              className="flex items-center justify-center px-4 py-2 space-x-4 border border-gray-300 rounded-full hover:bg-gray-50"
            >
              <img alt="google" src="/svgs/login-insta.svg" />
              <span>Google</span>
            </button>
            <button
              onClick={handleAppleLoginStudent}
              className="flex items-center justify-center px-4 py-2 space-x-4 text-white bg-black border border-black rounded-full"
            >
              <img
                alt="google"
                className="w-auto h-6"
                src="/images/apple-white.png"
              />
              <span>Apple</span>
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

      <Modal
        isOpen={showSuccessModal}
        onRequestClose={() => {}}
        className="fixed w-full max-w-xl p-6 transform -translate-x-1/2 -translate-y-1/2 bg-white outline-none font-urbanist top-1/2 left-1/2 rounded-3xl"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-[1000]" // Added high z-index
        shouldCloseOnOverlayClick={false}
        shouldCloseOnEsc={false}
      >
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img alt="bammbuu" src="/svgs/account-created.svg" />
          </div>

          <h2 className="mb-2 text-2xl font-semibold text-gray-900">
            Account Created Successfully!
          </h2>

          <p className="mb-6 text-gray-600">
            Great! All set. You can book your first class and start learning.
          </p>

          <div className="flex flex-row items-center space-x-3">
            <button
              onClick={handleSkip}
              className="w-full py-2 font-medium border  rounded-full text-[#042F0C]  border-[#042F0C]"
            >
              Skip Now
            </button>

            <button
              onClick={handleOnboarding}
              className="w-full py-2 px-2 font-medium text-[#042F0C] bg-[#14B82C] rounded-full border border-[#042F0C]"
            >
              Start Learning with bammbuu
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Signup;
