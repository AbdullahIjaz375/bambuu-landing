// // GroupsUser.js
// import React, { useEffect, useState } from "react";
// import { useAuth } from "../../context/AuthContext"; // Ensure this path is correct
// import {
//   collection,
//   addDoc,
//   serverTimestamp,
//   doc,
//   updateDoc,
//   getDoc,
// } from "firebase/firestore"; // Import Firestore functionsimport { db } from "../../firebaseConfig";
// import { Link } from "react-router-dom";
// import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
// import { useNavigate } from "react-router-dom"; // Import useNavigate

// import { Select, Card, Text, Image, Group, Title, Button } from "@mantine/core";
// import { db, storage } from "../../firebaseConfig";
// import Modal from "react-modal";
// import { ClipLoader } from "react-spinners";
// import Navbar from "../../components/Navbar";
// import Footer from "../../components/Footer";

// Modal.setAppElement("#root");
// const GroupsUser = () => {
//   const { user, loading, setUser } = useAuth();
//   const [groups, setGroups] = useState([]);
//   const [filteredGroups, setFilteredGroups] = useState([]);
//   const [loadingGroups, setLoadingGroups] = useState(true);
//   const [selectedType, setSelectedType] = useState("all");
//   const navigate = useNavigate(); // Initialize navigate

//   useEffect(() => {
//     if (!loading && user) {
//       if (user.joinedGroups && user.joinedGroups.length > 0) {
//         const fetchGroups = async () => {
//           const fetchedGroups = [];

//           for (let groupId of user.joinedGroups) {
//             const groupRef = doc(db, "groups", groupId);
//             const groupDoc = await getDoc(groupRef);

//             if (groupDoc.exists()) {
//               fetchedGroups.push({ id: groupDoc.id, ...groupDoc.data() });
//             }
//           }

//           setGroups(fetchedGroups);
//           setFilteredGroups(fetchedGroups);
//           setLoadingGroups(false);
//         };

//         fetchGroups();
//       } else {
//         // If joinedGroups is empty, directly stop loading
//         setLoadingGroups(false);
//       }
//     }
//   }, [loading, user]);

//   const handleFilterChange = (value) => {
//     setSelectedType(value);

//     // Filter groups based on the selected type
//     if (value === "all") {
//       setFilteredGroups(groups);
//     } else {
//       const filtered = groups.filter((group) => {
//         // Ensure case-insensitive comparison
//         console.log("Group Type in DB:", group.groupType); // Debugging line
//         return group.groupType.toLowerCase() === value.toLowerCase();
//       });
//       setFilteredGroups(filtered);
//     }
//   };

//   //------------------------------------------adding groups modal--------------------------------------//
//   const [step, setStep] = useState(1); // Step for multi-step modal
//   const [groupType, setGroupType] = useState(""); // English or Spanish
//   const [groupName, setGroupName] = useState("");
//   const [groupDescription, setGroupDescription] = useState("");
//   const [image, setImage] = useState(null);
//   const [loadingModal, setLoadingModal] = useState(false);
//   const [modalOpen, setModalOpen] = useState(false);
//   const [selectedImage, setSelectedImage] = useState(null);

//   const onRequestClose = () => {
//     setModalOpen(false);
//     setStep(1);
//     setGroupType("");
//     setGroupName("");
//     setGroupDescription("");
//     setImage(null);
//   };

//   const onRequestOpen = () => {
//     setModalOpen(true);
//   };
//   const handleImageChange = (e) => {
//     const file = e.target.files[0];
//     setImage(file); // Set the image in the parent component
//     setSelectedImage(URL.createObjectURL(file)); // Create a preview URL
//   };

//   const handleImageUpload = async () => {
//     if (!image) return null;
//     const storageRef = ref(storage, `groups/${groupType}/${image.name}`);
//     await uploadBytes(storageRef, image);
//     return await getDownloadURL(storageRef);
//   };

//   const handleCreateGroup = async () => {
//     setLoadingModal(true);
//     try {
//       const imageUrl = await handleImageUpload(); // Upload the image and get the URL

//       const newGroup = {
//         groupName,
//         groupDescription,
//         groupType,
//         imageUrl,
//         memberIds: [user.uid], // First member is the creator
//         classIds: [],
//         date: "",
//         timeOfNextClass: "",
//         lastLoggedIn: serverTimestamp(),
//       };

//       // Add the new group document and get the document ID
//       const groupRef = await addDoc(collection(db, "groups"), newGroup);
//       const groupId = groupRef.id;

//       // Update the current user's document to add the new group ID to joinedGroups array
//       const userRef = doc(db, "users", user.uid);
//       await updateDoc(userRef, {
//         joinedGroups: [...(user.joinedGroups || []), groupId], // Append the new groupId
//       });

//       const updatedUser = {
//         ...user,
//         joinedGroups: [...(user.joinedGroups || []), groupId],
//       };
//       setUser(updatedUser); // Update context
//       sessionStorage.setItem("user", JSON.stringify(updatedUser)); // Update session storage

//       // Reset form fields and modal state after successful creation
//       setStep(1);
//       setGroupType("");
//       setGroupName("");
//       setGroupDescription("");
//       setImage(null);
//       setLoadingModal(false);
//       onRequestClose(); // Close modal on successful creation
//     } catch (error) {
//       console.error("Error creating group:", error);
//       setLoadingModal(false);
//     }
//   };

//   const handleOpenGroup = (groupId) => {
//     navigate(`/groupDetailUser/${groupId}`);
//   };

//   return (
//     <>
//       <Navbar user={user} />
//       <div className="flex flex-col items-center w-full py-10 sm:px-10 md:px-20 lg:px-40 sm:pt-10 sm:pb-10">
//         <div className="flex items-center justify-between w-full mb-6">
//           <h1 className="text-xl font-bold text-gray-500 sm:text-3xl">
//             Your Joined Groups
//           </h1>

//           <div className="flex items-center gap-4">
//             <Select
//               value={selectedType}
//               onChange={handleFilterChange}
//               data={[
//                 { value: "all", label: "All" },
//                 { value: "spanish", label: "Spanish" },
//                 { value: "english", label: "English" },
//               ]}
//               placeholder="Select Group Type"
//               className="w-36 sm:w-40"
//             />

//             <Button
//               onClick={onRequestOpen}
//               className="text-white transition-colors bg-green-600 hover:bg-green-700"
//               variant="filled"
//             >
//               Add Group
//             </Button>
//           </div>
//         </div>

//         <div className="flex flex-wrap justify-center w-full gap-6 px-2 py-5">
//           {loadingGroups ? (
//             <div className="flex items-center justify-center min-h-[50vh] w-full">
//               <ClipLoader color="#14B82C" size={50} />
//             </div>
//           ) : filteredGroups.length > 0 ? (
//             filteredGroups.map((group) => (
//               <div
//                 key={group.id}
//                 className="flex-shrink-0 w-full max-w-xs overflow-hidden rounded-lg shadow-sm sm:w-64"
//               >
//                 <div className="relative">
//                   <img
//                     src={group.imageUrl}
//                     alt={group.groupName}
//                     className="object-cover w-full h-40"
//                   />
//                 </div>
//                 <div className="p-4">
//                   <h2 className="text-lg font-semibold truncate">
//                     {group.groupName}
//                   </h2>
//                   <p className="mt-1 text-sm text-gray-600 truncate">
//                     {group.groupDescription}
//                   </p>
//                   <button
//                     onClick={() => handleOpenGroup(group.id)}
//                     className="mt-4 font-bold text-green-600 hover:underline"
//                   >
//                     Open
//                   </button>
//                 </div>
//               </div>
//             ))
//           ) : (
//             <p className="w-full text-center text-gray-500">
//               You haven't joined any groups yet. Start by joining or creating a
//               group!
//             </p>
//           )}
//         </div>
//       </div>

//       <Footer />
//       <Modal
//         isOpen={modalOpen}
//         onRequestClose={onRequestClose}
//         contentLabel="Create New Group"
//         className="w-full max-w-md p-6 mx-auto transition-transform transform bg-white rounded-lg shadow-lg outline-none"
//         overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 sm:p-0"
//       >
//         {step === 1 && (
//           <div className="space-y-6 text-center">
//             <h2 className="mb-4 text-xl font-semibold text-gray-800">
//               Select Group Type
//             </h2>
//             <div className="flex flex-col justify-center gap-6 sm:flex-row">
//               <div
//                 onClick={() => {
//                   setGroupType("English");
//                   setStep(2);
//                 }}
//                 className="flex flex-col items-center w-full p-6 text-blue-600 transition-transform transform bg-blue-100 rounded-lg shadow cursor-pointer sm:w-40 hover:shadow-md hover:scale-105 hover:bg-blue-200"
//               >
//                 <span className="mb-2 text-2xl font-semibold">English</span>
//                 <p className="text-sm text-center text-gray-600">
//                   Join groups for English-speaking discussions and community
//                   support.
//                 </p>
//               </div>

//               <div
//                 onClick={() => {
//                   setGroupType("Spanish");
//                   setStep(2);
//                 }}
//                 className="flex flex-col items-center w-full p-6 text-green-600 transition-transform transform bg-green-100 rounded-lg shadow cursor-pointer sm:w-40 hover:shadow-md hover:scale-105 hover:bg-green-200"
//               >
//                 <span className="mb-2 text-2xl font-semibold">Spanish</span>
//                 <p className="text-sm text-center text-gray-600">
//                   Join groups for Spanish-speaking discussions and community
//                   support.
//                 </p>
//               </div>
//             </div>
//           </div>
//         )}

//         {step === 2 && (
//           <div className="space-y-6">
//             <div>
//               <label className="block mb-1 text-sm font-medium text-gray-700">
//                 Group Name
//               </label>
//               <input
//                 type="text"
//                 placeholder="Enter group name"
//                 value={groupName}
//                 onChange={(e) => setGroupName(e.target.value)}
//                 required
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-200 focus:outline-none"
//               />
//             </div>

//             <div>
//               <label className="block mb-1 text-sm font-medium text-gray-700">
//                 Description
//               </label>
//               <textarea
//                 placeholder="Enter group description (4 lines or more)"
//                 value={groupDescription}
//                 onChange={(e) => setGroupDescription(e.target.value)}
//                 required
//                 rows="4"
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-200 focus:outline-none"
//               />
//             </div>

//             <div>
//               <label className="block mb-1 text-sm font-medium text-gray-700">
//                 Group Image
//               </label>
//               <div className="relative flex flex-col items-center justify-center w-full p-6 transition-colors border border-gray-300 border-dashed rounded-md cursor-pointer hover:border-gray-400 bg-gray-50 hover:bg-gray-100">
//                 <input
//                   type="file"
//                   accept="image/*"
//                   onChange={handleImageChange}
//                   className="absolute inset-0 opacity-0 cursor-pointer"
//                 />

//                 {selectedImage ? (
//                   <img
//                     src={selectedImage}
//                     alt="Selected Group"
//                     className="object-cover w-full h-32 rounded-md"
//                   />
//                 ) : (
//                   <span className="text-gray-500">
//                     Click to upload an image for your group
//                   </span>
//                 )}
//               </div>
//             </div>

//             <button
//               onClick={handleCreateGroup}
//               disabled={
//                 !groupName || !groupDescription || !image || loadingModal
//               }
//               className={`w-full py-3 rounded-md text-white font-semibold ${
//                 loadingModal
//                   ? "bg-gray-400 cursor-not-allowed"
//                   : "bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-teal-200"
//               }`}
//             >
//               {loadingModal ? "Creating Group..." : "Create Group"}
//             </button>
//           </div>
//         )}
//       </Modal>
//     </>
//   );
// };

// export default GroupsUser;

import React, { useState } from "react";
import { Search, ArrowLeft } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import GroupCard from "../../components/GroupCard";

const GroupsUser = () => {
  const { user, setUser } = useAuth();

  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  const [activeTab, setActiveTab] = useState("group");

  const GroupData = [
    {
      id: 1,
      title: "Spanish Learners",
      language: "Spanish",
      level: "Advanced",
      adminName: "Taimoor",
      memberCount: "2K+",
      flagSrc: "/images/flag1.png", // Replace with actual flag image path
    },
    {
      id: 2,
      title: "Spanish Learners",
      language: "Spanish",
      level: "Advanced",
      adminName: "Taimoor",
      memberCount: "2K+",
      flagSrc: "/images/flag2.png", // Replace with actual flag image path
    },
    {
      id: 3,
      title: "Spanish Learners",
      language: "Spanish",
      level: "Advanced",
      adminName: "Taimoor",
      memberCount: "2K+",
      flagSrc: "/images/flag3.png", // Replace with actual flag image path
    },
    {
      id: 4,
      title: "Spanish Learners",
      language: "Spanish",
      level: "Advanced",
      adminName: "Taimoor",
      memberCount: "2K+",
      flagSrc: "/images/flag1.png", // Replace with actual flag image path
    },
    {
      id: 5,
      title: "Spanish Learners",
      language: "Spanish",
      level: "Advanced",
      adminName: "Taimoor",
      memberCount: "2K+",
      flagSrc: "/images/flag2.png", // Replace with actual flag image path
    },
    {
      id: 6,
      title: "Spanish Learners",
      language: "Spanish",
      level: "Advanced",
      adminName: "Taimoor",
      memberCount: "2K+",
      flagSrc: "/images/flag3.png", // Replace with actual flag image path
    },
    // ... other items
  ];
  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <Sidebar user={user} />

      <div className="flex-1 p-8 bg-white border-2 border-[#e7e7e7] rounded-3xl ml-[17rem] m-2">
        <div className="flex items-center justify-between pb-4 mb-6 border-b">
          <div className="flex items-center gap-4 ">
            <button
              className="p-3 bg-gray-100 rounded-full"
              onClick={handleBack}
            >
              <ArrowLeft size="30" />
            </button>
            <h1 className="text-4xl font-semibold">My Groups</h1>
          </div>
          <div className="flex flex-row items-center justify-center space-x-4">
            <button className="px-6 py-3 text-[#042f0c] text-xl font-medium bg-white border border-[#5d5d5d] rounded-full">
              Create New Group
            </button>
            <button className="px-6 py-3 text-[#042f0c] text-xl font-medium bg-white border border-[#5d5d5d] rounded-full">
              Join a Group
            </button>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
          <input
            type="text"
            placeholder="Search groups by name"
            className="w-full py-3 pl-10 pr-4 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>
        <div className="flex flex-wrap gap-4">
          {GroupData.map((classItem) => (
            <div key={classItem.id} className="flex-none w-80">
              <GroupCard {...classItem} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GroupsUser;
