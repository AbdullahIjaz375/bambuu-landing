// src/pages/UserSettings.js
import React, { useEffect, useState } from "react";
import { TextInput, Select, Button, Paper } from "@mantine/core";
import { db, auth } from "../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import TimezoneSelect from "react-timezone-select";
import Navbar from "../components/Navbar";
import ClipLoader from "react-spinners/ClipLoader";
import { toast } from "react-toastify";

const UserSettings = () => {
  const [nickname, setNickname] = useState("");
  const [country, setCountry] = useState("");
  const [learningLanguage, setLearningLanguage] = useState("");
  const [nativeLanguage, setNativeLanguage] = useState("");
  const [timeZone, setTimeZone] = useState({});
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        setEmail(user.email);
        setDisplayName(user.displayName || "");

        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setNickname(userData.nickname || user.displayName || "Student");
          setCountry(userData.country || "");
          setLearningLanguage(userData.learningLanguage || "");
          setNativeLanguage(userData.nativeLanguage || "");
          setTimeZone({ value: userData.timeZone || "" });
        }
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const handleSave = async () => {
    const user = auth.currentUser;
    if (user) {
      const toastId = toast.loading("Updating profile...");
      try {
        await updateDoc(doc(db, "users", user.uid), {
          nickname,
          country,
          learningLanguage,
          nativeLanguage,
          timeZone: timeZone.value,
        });
        toast.update(toastId, {
          render: "Profile updated successfully!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      } catch (error) {
        toast.update(toastId, {
          render: "Failed to update profile. Please try again.",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ClipLoader color="#14B82C" size={50} />
      </div>
    );
  }

  return (
    <>
      <Navbar user={auth.currentUser} />
      <div className="container p-6 mx-auto space-y-6 md:p-10">
        <h1 className="mb-10 text-3xl font-bold text-left">
          Welcome back, {nickname || displayName || "Student"}
        </h1>

        <div shadow="xs" p="lg" className="space-y-4 md:space-y-8">
          <div className="flex flex-col space-y-2">
            <p className="text-lg font-semibold text-gray-800">
              Student name:{" "}
              <span className="text-gray-700">
                {nickname || displayName || "Student Name"}
              </span>
            </p>
            <p className="text-lg font-semibold text-gray-800">
              Student email: <span className="text-gray-700">{email}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <TextInput
              label="Nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
            <Select
              label="Learning Language"
              placeholder="Select language"
              data={["English", "Spanish", "French", "German"]}
              value={learningLanguage}
              onChange={setLearningLanguage}
            />
            <TextInput
              label="Country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
            <Select
              label="Native Language"
              placeholder="Select language"
              data={["English", "Spanish", "French", "German"]}
              value={nativeLanguage}
              onChange={setNativeLanguage}
            />
            <div>
              <label className="font-medium text-gray-700">Time Zone</label>
              <TimezoneSelect
                value={timeZone}
                onChange={setTimeZone}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex justify-center w-40 pt-6">
            <Button
              fullWidth
              radius="md"
              size="md"
              className="font-semibold text-white transition duration-200 ease-in-out bg-green-500 hover:bg-green-600"
              onClick={handleSave}
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserSettings;
