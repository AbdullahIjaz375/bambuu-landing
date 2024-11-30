// // src/Signup.js
// import React, { useState, useEffect } from "react";
// import { auth, db } from "../firebaseConfig";
// import { createUserWithEmailAndPassword } from "firebase/auth";
// import { useNavigate, Link } from "react-router-dom";
// import { Button, TextInput, Paper, Title, Select } from "@mantine/core";
// import { toast } from "react-toastify";
// import { useAuth } from "../context/AuthContext";
// import ClipLoader from "react-spinners/ClipLoader";
// import { doc, setDoc } from "firebase/firestore"; // Firestore imports
// import countryList from "react-select-country-list"; // Import country list

// const Signup = () => {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [nickname, setNickname] = useState("");
//   const [country, setCountry] = useState("");
//   const [learningLanguage, setLearningLanguage] = useState("");
//   const [nativeLanguage, setNativeLanguage] = useState("");
//   const navigate = useNavigate();
//   const { user, loading } = useAuth(); // Destructure loading state
//   const [loading1, setLoading1] = useState(false);

//   const countryOptions = countryList()
//     .getData()
//     .map((country) => ({
//       value: country.label, // Using country name as value
//       label: country.label,
//     }));
//   const handleSignup = async (e) => {
//     e.preventDefault();
//     setLoading1(true);
//     toast.info("Signing up... Please wait."); // Show toast when signup starts

//     try {
//       // Sign up the user
//       const userCredential = await createUserWithEmailAndPassword(
//         auth,
//         email,
//         password
//       );
//       const user = userCredential.user;

//       // Add additional user information to Firestore in the specified format
// await setDoc(doc(db, "users", user.uid), {
//   email: user.email,
//   enrolledClasses: [], // Empty array for enrolled classes
//   joinedGroups: [], // Empty array for joined groups
//   lastLoggedIn: new Date(), // Set the timestamp of signup
//   learningLanguage,
//   name: nickname, // Assuming 'name' is filled with the 'nickname' input for simplicity
//   nativeLanguage,
//   nickname,
//   photoUrl: "", // Empty photo URL
//   savedDocuments: [], // Empty array for saved documents
//   tier: 1, // Initial tier value
//   currentStreak: 1, // Set current streak to 0 on signup
//   accountType: "user",
// });

//       toast.success("Account created successfully!");
//       navigate("/login", { replace: true }); // Redirect to login page
//     } catch (error) {
//       toast.error(`Signup error: ${error.message}`);
//     } finally {
//       setLoading1(false);
//     }
//   };

//   useEffect(() => {
//     if (!loading && user && !loading1) {
//       navigate("/learn", { replace: true });
//     }
//   }, [user, loading, loading1, navigate]);

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <ClipLoader color="#14B82C" size={50} />
//       </div>
//     );
//   }

//   return (
//     <div className="flex items-center justify-center min-h-screen p-6 bg-gradient-to-r from-green-200 to-yellow-100">
//       <Paper
//         shadow="xl"
//         padding="lg"
//         radius="lg"
//         className="w-full max-w-md px-4 py-6 bg-white rounded-lg shadow-lg md:px-8 md:py-12"
//       >
//         <h1 className="pb-8 text-4xl font-extrabold text-center text-gray-800">
//           Create Your Account
//         </h1>
//         <form onSubmit={handleSignup} className="space-y-5">
//           <TextInput
//             label="Email"
//             placeholder="you@example.com"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             required
//             radius="md"
//             size="md"
//             className="focus:ring focus:ring-green-300"
//           />
//           <TextInput
//             label="Password"
//             placeholder="Your password"
//             type="password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             required
//             radius="md"
//             size="md"
//             className="focus:ring focus:ring-green-300"
//           />
//           <TextInput
//             label="Nickname"
//             placeholder="Enter your nickname"
//             value={nickname}
//             onChange={(e) => setNickname(e.target.value)}
//             required
//           />
//           <Select
//             label="Country"
//             data={countryOptions}
//             value={country}
//             onChange={setCountry}
//             placeholder="Select your country"
//             className="mt-1"
//             required
//           />
//           <Select
//             label="Learning language"
//             placeholder="Select language"
//             data={["English", "Spanish"]}
//             value={learningLanguage}
//             onChange={setLearningLanguage}
//             required
//           />
//           <Select
//             label="Native language"
//             placeholder="Select language"
//             data={["English", "Spanish"]}
//             value={nativeLanguage}
//             onChange={setNativeLanguage}
//             required
//           />

//           <Button type="submit" fullWidth radius="md" size="md" color="#14B82C">
//             {" "}
//             Sign Up
//           </Button>
//         </form>

//         <p className="mt-8 text-sm text-center text-gray-500">
//           Already have an account?{" "}
//           <Link
//             to={"/login"}
//             className="font-semibold text-green-600 hover:underline"
//           >
//             Login
//           </Link>
//         </p>
//       </Paper>
//     </div>
//   );
// };

// export default Signup;

import React, { useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import ClipLoader from "react-spinners/ClipLoader";
import { doc, setDoc } from "firebase/firestore";
import countryList from "react-select-country-list";
import { FaFacebook, FaGoogle } from "react-icons/fa6";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [country, setCountry] = useState("");
  const [learningLanguage, setLearningLanguage] = useState("");
  const [nativeLanguage, setNativeLanguage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [loading1, setLoading1] = useState(false);

  const countryOptions = countryList()
    .getData()
    .map((country) => ({
      value: country.label,
      label: country.label,
    }));

  const handleSignup = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    setLoading1(true);
    toast.info("Signing up... Please wait.");

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        enrolledClasses: [],
        joinedGroups: [],
        lastLoggedIn: new Date(),
        learningLanguage,
        name: nickname,
        nativeLanguage,
        nickname,
        photoUrl: "",
        savedDocuments: [],
        tier: 1,
        currentStreak: 1,
        accountType: "user",
      });

      toast.success("Account created successfully!");
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(`Signup error: ${error.message}`);
    } finally {
      setLoading1(false);
    }
  };

  useEffect(() => {
    if (!loading && user && !loading1) {
      navigate("/learn", { replace: true });
    }
  }, [user, loading, loading1, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ClipLoader color="#14B82C" size={50} />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-4xl bg-white rounded-3xl p-8 border-2 border-[#e7e7e7]">
        {/* Title */}
        <div className="mb-8 space-y-2 text-center">
          <h1 className="text-3xl font-bold">Sign Up</h1>
          <p className="text-xl text-gray-600">Let's create a new account!</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSignup} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-gray-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-gray-700">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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

              <div className="space-y-2">
                <label className="block text-gray-700">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute transform -translate-y-1/2 right-3 top-1/2"
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

              <div className="space-y-2">
                <label className="block text-gray-700">Nickname</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Enter your nickname"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-gray-700">Country</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select your country</option>
                  {countryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-gray-700">Learning Language</label>
                <select
                  value={learningLanguage}
                  onChange={(e) => setLearningLanguage(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select language</option>
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-gray-700">Native Language</label>
                <select
                  value={nativeLanguage}
                  onChange={(e) => setNativeLanguage(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select language</option>
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#14b82c] text-black rounded-full hover:bg-[#119526] focus:outline-none mt-8 border border-[#042f0c]"
          >
            Create an Account
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 text-gray-500 bg-white">or sign up with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-50">
            <img
              alt="google"
              src="/images/google-button.png"
              className="w-5 h-5 mr-2"
            />
            <span>Google</span>
          </button>
          <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-50">
            <img
              alt="facebook"
              src="/images/fb-button.png"
              className="w-5 h-5 mr-2"
            />
            <span>Facebook</span>
          </button>
        </div>

        <div className="text-center text-sm text-[#9e9e9e] mb-4">
          <p>
            By signing up, you agree to our{" "}
            <span className="text-black">Terms & Conditions</span> and{" "}
            <span className="text-black">Privacy Policy</span>.
          </p>
        </div>

        <div className="text-sm text-center text-[#5d5d5d]">
          Already have an account?{" "}
          <Link to="/login" className="text-[#14b82c]">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
