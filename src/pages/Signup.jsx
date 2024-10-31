// src/Signup.js
import React, { useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { Button, TextInput, Paper, Title, Select } from "@mantine/core";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import ClipLoader from "react-spinners/ClipLoader";
import { doc, setDoc } from "firebase/firestore"; // Firestore imports
import countryList from "react-select-country-list"; // Import country list

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [country, setCountry] = useState("");
  const [learningLanguage, setLearningLanguage] = useState("");
  const [nativeLanguage, setNativeLanguage] = useState("");
  const navigate = useNavigate();
  const { user, loading } = useAuth(); // Destructure loading state
  const [loading1, setLoading1] = useState(false);

  const countryOptions = countryList()
    .getData()
    .map((country) => ({
      value: country.label, // Using country name as value
      label: country.label,
    }));
  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading1(true);
    toast.info("Signing up... Please wait."); // Show toast when signup starts

    try {
      // Sign up the user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Add additional user information to Firestore in the specified format
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        enrolledClasses: [], // Empty array for enrolled classes
        joinedGroups: [], // Empty array for joined groups
        lastLoggedIn: new Date(), // Set the timestamp of signup
        learningLanguage,
        name: nickname, // Assuming 'name' is filled with the 'nickname' input for simplicity
        nativeLanguage,
        nickname,
        photoUrl: "", // Empty photo URL
        savedDocuments: [], // Empty array for saved documents
        tier: 1, // Initial tier value
        currentStreak: 1, // Set current streak to 0 on signup
        accountType: "user",
      });

      toast.success("Account created successfully!");
      navigate("/login", { replace: true }); // Redirect to login page
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
    <div className="flex items-center justify-center min-h-screen p-6 bg-gradient-to-r from-green-200 to-yellow-100">
      <Paper
        shadow="xl"
        padding="lg"
        radius="lg"
        className="w-full max-w-md px-4 py-6 bg-white rounded-lg shadow-lg md:px-8 md:py-12"
      >
        <h1 className="pb-8 text-4xl font-extrabold text-center text-gray-800">
          Create Your Account
        </h1>
        <form onSubmit={handleSignup} className="space-y-5">
          <TextInput
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            radius="md"
            size="md"
            className="focus:ring focus:ring-green-300"
          />
          <TextInput
            label="Password"
            placeholder="Your password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            radius="md"
            size="md"
            className="focus:ring focus:ring-green-300"
          />
          <TextInput
            label="Nickname"
            placeholder="Enter your nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
          />
          <Select
            label="Country"
            data={countryOptions}
            value={country}
            onChange={setCountry}
            placeholder="Select your country"
            className="mt-1"
            required
          />
          <Select
            label="Learning language"
            placeholder="Select language"
            data={["English", "Spanish"]}
            value={learningLanguage}
            onChange={setLearningLanguage}
            required
          />
          <Select
            label="Native language"
            placeholder="Select language"
            data={["English", "Spanish"]}
            value={nativeLanguage}
            onChange={setNativeLanguage}
            required
          />

          <Button type="submit" fullWidth radius="md" size="md" color="#14B82C">
            {" "}
            Sign Up
          </Button>
        </form>

        <p className="mt-8 text-sm text-center text-gray-500">
          Already have an account?{" "}
          <Link
            to={"/login"}
            className="font-semibold text-green-600 hover:underline"
          >
            Login
          </Link>
        </p>
      </Paper>
    </div>
  );
};

export default Signup;
