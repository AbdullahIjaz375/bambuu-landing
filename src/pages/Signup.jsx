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
import TimezoneSelect from "react-timezone-select";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [country, setCountry] = useState("");
  const [learningLanguage, setLearningLanguage] = useState("");
  const [nativeLanguage, setNativeLanguage] = useState("");
  const [timeZone, setTimeZone] = useState({});
  const navigate = useNavigate();
  const { user, loading } = useAuth(); // Destructure loading state
  const [loading1, setLoading1] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading1(true);

    try {
      // Sign up the user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Add additional user information to Firestore
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        nickname,
        country,
        learningLanguage,
        nativeLanguage,
        timeZone: timeZone.value,
        createdAt: new Date(),
      });

      toast.success("Account created successfully!");
      navigate("/home", { replace: true });
    } catch (error) {
      toast.error(`Signup error: ${error.message}`);
    } finally {
      setLoading1(false);
    }
  };

  useEffect(() => {
    if (!loading && user) {
      navigate("/home", { replace: true });
    }
  }, [user, loading, navigate]);

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
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
          />
          <TextInput
            label="Country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            required
          />
          <Select
            label="Learning language"
            placeholder="Select language"
            data={["English", "Spanish", "French", "German"]}
            value={learningLanguage}
            onChange={setLearningLanguage}
            required
          />
          <Select
            label="Native language"
            placeholder="Select language"
            data={["English", "Spanish", "French", "German"]}
            value={nativeLanguage}
            onChange={setNativeLanguage}
            required
          />
          <div>
            <label className="font-medium text-gray-700">Time Zone</label>
            <TimezoneSelect
              value={timeZone}
              onChange={setTimeZone}
              className="mt-1"
            />
          </div>

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
