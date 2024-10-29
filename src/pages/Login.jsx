// src/Login.js
import React, { useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig";
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
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import ClipLoader from "react-spinners/ClipLoader";
import { doc, getDoc, setDoc } from "firebase/firestore";

const Login = () => {
  const googleProvider = new GoogleAuthProvider();
  const facebookProvider = new FacebookAuthProvider();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { user, loading } = useAuth(); // Destructure loading state

  const handleGoogleLogin = async () => {
    const googleProvider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user data already exists in Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        // Set initial data with empty values if it doesn't exist
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          nickname: "",
          country: "",
          learningLanguage: "",
          nativeLanguage: "",
          timeZone: "",
          createdAt: new Date(),
        });
      }

      navigate("/home");
    } catch (error) {
      console.error("Error during Google login:", error);
    }
  };
  const handleFacebookLogin = async () => {
    const facebookProvider = new FacebookAuthProvider();
    try {
      const result = await signInWithPopup(auth, facebookProvider);
      const user = result.user;

      // Check if user data already exists in Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        // Set initial data with empty values if it doesn't exist
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          nickname: "",
          country: "",
          learningLanguage: "",
          nativeLanguage: "",
          timeZone: "",
          createdAt: new Date(),
        });
      }

      navigate("/home");
    } catch (error) {
      console.error("Error during Facebook login:", error);
    }
  };
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Logged in successfully!");

      navigate("/home");
    } catch (error) {
      console.error("Error during email login:", error);
      toast.error(`Login error: ${error.message}`);
    }
  };

  useEffect(() => {
    if (!loading && user) {
      navigate("/home", { replace: true });
    }
  }, [user, loading, navigate]);

  // Show a spinner while checking authentication status
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
