// src/Login.js
import React, { useState } from "react";
import { auth } from "../firebaseConfig";
import {
  GoogleAuthProvider,
  signInWithPopup,
  FacebookAuthProvider,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { Button, TextInput, Paper, Divider, Group, Title } from "@mantine/core";
import { FaFacebook } from "react-icons/fa6";
import { FaGoogle } from "react-icons/fa6";

const Login = () => {
  const googleProvider = new GoogleAuthProvider();
  const facebookProvider = new FacebookAuthProvider();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Google User:", result.user);
      navigate("/home");
    } catch (error) {
      console.error("Error during Google login:", error);
    }
  };

  const handleFacebookLogin = async () => {
    try {
      const result = await signInWithPopup(auth, facebookProvider);
      console.log("Facebook User:", result.user);
      navigate("/home");
    } catch (error) {
      console.error("Error during Facebook login:", error);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/home");
    } catch (error) {
      console.error("Error during email login:", error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-gradient-to-r from-green-200 to-yellow-100">
      <Paper
        shadow="lg"
        padding="lg"
        radius="lg"
        className="w-full max-w-md px-4 py-6 bg-white rounded-lg shadow-lg md:px-8 md:py-12"
      >
        <h1 className="pb-8 text-4xl font-extrabold tracking-tight text-center text-gray-800">
          Welcome to Bambuu
        </h1>
        <form onSubmit={handleEmailLogin} className="space-y-5">
          <TextInput
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            radius="md"
            size="md"
            className="p-2 shadow-sm"
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
            className="p-2 shadow-sm"
          />
          <Button type="submit" fullWidth radius="md" size="lg" color="#14B82C">
            Login
          </Button>
        </form>

        <Divider
          className="my-8"
          label="Or continue with"
          labelPosition="center"
        />

        <Group position="center" grow>
          <Button
            onClick={handleGoogleLogin}
            radius="md"
            size="lg"
            color="#ff0808"
          >
            <FaGoogle className="w-5 h-5 mr-2" />
            Google
          </Button>
          <Button
            onClick={handleFacebookLogin}
            radius="md"
            size="lg"
            color="#1877F2"
          >
            <FaFacebook className="w-5 h-5 mr-2" />
            Facebook
          </Button>
        </Group>

        <p className="mt-8 text-sm text-center text-gray-500">
          Don’t have an account?{" "}
          <Link
            to={"/signup"}
            className="font-medium text-green-600 hover:underline"
          >
            Sign Up
          </Link>
        </p>
      </Paper>
    </div>
  );
};

export default Login;
