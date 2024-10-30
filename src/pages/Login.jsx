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
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

const Login = () => {
  const googleProvider = new GoogleAuthProvider();
  const facebookProvider = new FacebookAuthProvider();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { user, loading } = useAuth(); // Destructure loading state

  const handleGoogleLogin = async () => {
    const googleProvider = new GoogleAuthProvider();
    const loadingToastId = toast.loading("Logging in..."); // Show loading toast

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Reference to user document in Firestore
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      let isFirstTimeLogin = false; // Flag to check if it's the user's first login

      if (!userDoc.exists()) {
        // Create the user document with the required fields
        await setDoc(userRef, {
          email: user.email,
          enrolledClasses: [],
          joinedGroups: [],
          lastLoggedIn: serverTimestamp(),
          learningLanguage: "",
          name: user.displayName || "", // Use Google displayName or empty string if not available
          nativeLanguage: "",
          nickname: "", // You may ask the user to set this later
          country: "",
          photoUrl: "", // Set empty photoUrl to ignore Google default profile picture
          savedDocuments: [],
          tier: 1,
          currentStreak: 1, // Start streak at 1 on first login
        });
        isFirstTimeLogin = true; // Set flag to true for first-time login
      } else {
        // If the document exists, update `lastLoggedIn` and possibly increment `currentStreak`
        const userData = userDoc.data();
        const lastLoggedIn = userData.lastLoggedIn
          ? userData.lastLoggedIn.toDate()
          : null;
        const currentStreak = userData.currentStreak || 0;

        const now = new Date();
        let updatedStreak = currentStreak;

        if (lastLoggedIn) {
          const differenceInHours = Math.abs(now - lastLoggedIn) / 36e5;

          if (
            differenceInHours < 24 &&
            lastLoggedIn.toDateString() === now.toDateString()
          ) {
            updatedStreak = currentStreak;
          } else if (
            differenceInHours < 48 &&
            now.getDate() - lastLoggedIn.getDate() === 1
          ) {
            updatedStreak = currentStreak + 1;
          } else {
            updatedStreak = 0;
          }
        } else {
          updatedStreak = 1;
        }

        // Update `lastLoggedIn` and `currentStreak`
        await updateDoc(userRef, {
          lastLoggedIn: serverTimestamp(),
          currentStreak: updatedStreak,
        });
      }

      toast.update(loadingToastId, {
        // Update toast to success
        render: "Logged in successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
      // Redirect based on first-time login status
      if (isFirstTimeLogin) {
        navigate("/settings", { replace: true });
      } else {
        navigate("/home", { replace: true });
      }
    } catch (error) {
      console.error("Error during Google login:", error);
      toast.update(loadingToastId, {
        // Update toast to error
        render: `Login error: ${error.message}`,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
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

      navigate("/home", { replace: true });
    } catch (error) {
      console.error("Error during Facebook login:", error);
    }
  };
  const handleEmailLogin = async (e) => {
    const loadingToastId = toast.loading("Logging in..."); // Show loading toast

    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const lastLoggedIn = userData.lastLoggedIn
          ? userData.lastLoggedIn.toDate()
          : null;
        const currentStreak = userData.currentStreak || 0;

        const now = new Date();
        let updatedStreak = currentStreak;

        if (lastLoggedIn) {
          const differenceInHours = Math.abs(now - lastLoggedIn) / 36e5;

          if (
            differenceInHours < 24 &&
            lastLoggedIn.toDateString() === now.toDateString()
          ) {
            // User logged in today, no streak change
            updatedStreak = currentStreak;
          } else if (
            differenceInHours < 48 &&
            now.getDate() - lastLoggedIn.getDate() === 1
          ) {
            // User logged in yesterday, increment streak
            updatedStreak = currentStreak + 1;
          } else {
            // More than 24 hours since last login, reset streak
            updatedStreak = 0;
          }
        } else {
          // First login or no `lastLoggedIn` recorded, start streak at 1
          updatedStreak = 1;
        }

        // Update `lastLoggedIn` and `currentStreak`
        await updateDoc(userRef, {
          lastLoggedIn: serverTimestamp(),
          currentStreak: updatedStreak,
        });
      }

      toast.update(loadingToastId, {
        // Update toast to success
        render: "Logged in successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
      navigate("/home", { replace: true });
    } catch (error) {
      console.error("Error during email login:", error);

      toast.update(loadingToastId, {
        // Update toast to error
        render: `Login error: ${error.message}`,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    }
  };

  // useEffect(() => {
  //   if (!loading && user) {
  //     navigate("/home", { replace: true });
  //   }
  // }, [user, loading, navigate]);

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
