// // src/pages/UserSettings.js
// import React, { useEffect, useState } from "react";
// import { TextInput, Select, Button, Paper } from "@mantine/core";
// import { db, auth } from "../firebaseConfig";
// import { doc, getDoc, updateDoc } from "firebase/firestore";
// import Navbar from "../components/Navbar";
// import ClipLoader from "react-spinners/ClipLoader";
// import { toast } from "react-toastify";
// import countryList from "react-select-country-list"; // Import country list

// const UserSettings = () => {
//   const [nickname, setNickname] = useState("");
//   const [country, setCountry] = useState("");
//   const [learningLanguage, setLearningLanguage] = useState("");
//   const [nativeLanguage, setNativeLanguage] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [email, setEmail] = useState("");
//   const [displayName, setDisplayName] = useState("");

//   const countryOptions = countryList()
//     .getData()
//     .map((country) => ({
//       value: country.label, // Using country name as value
//       label: country.label,
//     }));

//   useEffect(() => {
//     const fetchUserData = async () => {
//       const user = auth.currentUser;
//       if (user) {
//         setEmail(user.email);
//         setDisplayName(user.displayName || "");

//         const userDoc = await getDoc(doc(db, "users", user.uid));
//         if (userDoc.exists()) {
//           const userData = userDoc.data();
//           setNickname(userData.nickname || user.displayName || "Student");
//           setCountry(userData.country || "");
//           setLearningLanguage(userData.learningLanguage || "");
//           setNativeLanguage(userData.nativeLanguage || "");
//         }
//         setLoading(false);
//       }
//     };
//     fetchUserData();
//   }, []);

//   const handleSave = async () => {
//     const user = auth.currentUser;
//     if (user) {
//       const toastId = toast.loading("Updating profile...");
//       try {
//         await updateDoc(doc(db, "users", user.uid), {
//           nickname,
//           country,
//           learningLanguage,
//           nativeLanguage,
//         });
//         toast.update(toastId, {
//           render: "Profile updated successfully!",
//           type: "success",
//           isLoading: false,
//           autoClose: 3000,
//         });
//       } catch (error) {
//         toast.update(toastId, {
//           render: "Failed to update profile. Please try again.",
//           type: "error",
//           isLoading: false,
//           autoClose: 3000,
//         });
//       }
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <ClipLoader color="#14B82C" size={50} />
//       </div>
//     );
//   }

//   return (
//     <>
//       <Navbar user={auth.currentUser} />
//       <div className="container p-6 mx-auto space-y-6 md:p-10">
//         <h1 className="mb-10 text-3xl font-bold text-left">
//           Welcome back, {nickname || displayName || "Student"}
//         </h1>

//         <div shadow="xs" p="lg" className="space-y-4 md:space-y-8">
//           <div className="flex flex-col space-y-2">
//             <p className="text-lg font-semibold text-gray-800">
//               Student name:{" "}
//               <span className="text-gray-700">
//                 {nickname || displayName || "Student Name"}
//               </span>
//             </p>
//             <p className="text-lg font-semibold text-gray-800">
//               Student email: <span className="text-gray-700">{email}</span>
//             </p>
//           </div>

//           <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
//             <TextInput
//               label="Nickname"
//               value={nickname}
//               onChange={(e) => setNickname(e.target.value)}
//             />
//             <Select
//               label="Learning Language"
//               placeholder="Select language"
//               data={["English", "Spanish"]}
//               value={learningLanguage}
//               onChange={setLearningLanguage}
//             />
//             <Select
//               label="Country"
//               data={countryOptions}
//               value={country}
//               onChange={setCountry}
//               placeholder="Select your country"
//               className="mt-1"
//               required
//             />
//             <Select
//               label="Native Language"
//               placeholder="Select language"
//               data={["English", "Spanish"]}
//               value={nativeLanguage}
//               onChange={setNativeLanguage}
//             />
//           </div>

//           <div className="flex justify-center w-40 pt-6">
//             <Button
//               fullWidth
//               radius="md"
//               size="md"
//               className="font-semibold text-white transition duration-200 ease-in-out bg-green-500 hover:bg-green-600"
//               onClick={handleSave}
//             >
//               Save
//             </Button>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default UserSettings;
import React, { useEffect, useState } from "react";
import { TextInput, Select, Button, Avatar } from "@mantine/core";
import { db, storage } from "../firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "../context/AuthContext";
import ClipLoader from "react-spinners/ClipLoader";
import { toast } from "react-toastify";
import countryList from "react-select-country-list";
import Navbar from "../components/Navbar";
import { Loader } from "@mantine/core";

const UserSettings = () => {
  const { user, setUser } = useAuth(); // Access user and setUser from context
  const [nickname, setNickname] = useState(user?.nickname || "");
  const [country, setCountry] = useState(user?.country || "");
  const [learningLanguage, setLearningLanguage] = useState(
    user?.learningLanguage || ""
  );
  const [nativeLanguage, setNativeLanguage] = useState(
    user?.nativeLanguage || ""
  );
  const [photoUrl, setPhotoUrl] = useState(user?.photoUrl || "");
  const [newPhoto, setNewPhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  const countryOptions = countryList()
    .getData()
    .map((country) => ({
      value: country.label,
      label: country.label,
    }));

  useEffect(() => {
    setPhotoUrl(user?.photoUrl || "");
  }, [user]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewPhoto(file);
      setPhotoUrl(URL.createObjectURL(file)); // Show preview of the new image
    }
  };

  const handleSave = async () => {
    const toastId = toast.loading("Updating profile...");

    try {
      // Upload photo if a new one is selected
      let updatedPhotoUrl = photoUrl;
      if (newPhoto) {
        const photoRef = ref(storage, `tutors/${user.uid}`);
        await uploadBytes(photoRef, newPhoto);
        updatedPhotoUrl = await getDownloadURL(photoRef);
      }

      // Update Firestore and context with all profile changes
      const updatedUserData = {
        nickname,
        country,
        learningLanguage,
        nativeLanguage,
        photoUrl: updatedPhotoUrl,
      };

      await updateDoc(doc(db, "users", user.uid), updatedUserData);

      // Update context and session storage
      setUser((prevUser) => ({ ...prevUser, ...updatedUserData }));
      sessionStorage.setItem(
        "user",
        JSON.stringify({ ...user, ...updatedUserData })
      );

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
    } finally {
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
      <Navbar user={user} />
      <div className="container p-6 mx-auto space-y-6 md:p-10">
        <h1 className="mb-10 text-3xl font-bold text-left">
          Welcome back, {nickname || user.displayName || "Student"}
        </h1>

        <div shadow="xs" p="lg" className="space-y-4 md:space-y-8">
          <div className="flex flex-col space-y-2">
            <p className="text-lg font-semibold text-gray-800">
              Student name: <span className="text-gray-700">{nickname}</span>
            </p>
            <p className="text-lg font-semibold text-gray-800">
              Student email: <span className="text-gray-700">{user.email}</span>
            </p>
          </div>
          {/* Profile Photo with Upload Option */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar src={photoUrl} alt="Profile" radius="xl" size="2xl" />
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-full">
                  <Loader size="sm" color="green" />
                </div>
              )}
            </div>

            <label
              htmlFor="photo-upload"
              className="text-green-600 cursor-pointer hover:underline"
            >
              {newPhoto ? "Change Photo" : "Upload Photo"}
            </label>
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
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
              data={["English", "Spanish"]}
              value={learningLanguage}
              onChange={setLearningLanguage}
            />
            <Select
              label="Country"
              data={countryOptions}
              value={country}
              onChange={setCountry}
              placeholder="Select your country"
              required
            />
            <Select
              label="Native Language"
              placeholder="Select language"
              data={["English", "Spanish"]}
              value={nativeLanguage}
              onChange={setNativeLanguage}
            />
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
