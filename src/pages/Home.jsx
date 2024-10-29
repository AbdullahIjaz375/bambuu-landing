// src/pages/Home.js
import React from "react";
import { auth } from "../firebaseConfig";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Button, Paper } from "@mantine/core";
import Navbar from "../components/Navbar";

const Home = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully!");
      navigate("/"); // Redirect to login after logout
    } catch (error) {
      toast.error("Error during logout");
      console.error("Error during logout:", error);
    }
  };

  return (
    <>
      <Navbar user={auth.currentUser} />
      <div className="flex items-center justify-center h-screen">
        <Paper padding="md" shadow="md" className="text-center w-80">
          <h1 className="mb-4 text-2xl font-bold">
            Welcome, {auth.currentUser?.displayName || auth.currentUser?.email}
          </h1>
          <Button onClick={handleLogout} className="mt-4">
            Logout
          </Button>
        </Paper>
      </div>
    </>
  );
};

export default Home;
