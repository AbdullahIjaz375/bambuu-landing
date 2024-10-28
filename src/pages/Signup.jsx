// src/Signup.js
import React, { useState } from "react";
import { auth } from "../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { Button, TextInput, Paper, Title } from "@mantine/core";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate("/home");
    } catch (error) {
      console.error("Error during signup:", error);
    }
  };

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
          <Button type="submit" fullWidth radius="md" size="md" color="#14B82C">
            {" "}
            Sign Up
          </Button>
        </form>

        <p className="mt-8 text-sm text-center text-gray-500">
          Already have an account?{" "}
          <Link
            to={"/"}
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
