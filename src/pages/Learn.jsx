// // src/pages/Learn.js
// import React, { useState, useEffect } from "react";
// import { auth } from "../firebaseConfig";
// import { signOut } from "firebase/auth";
// import { useNavigate } from "react-router-dom";
// import { toast } from "react-toastify";
// import { Button, Paper, TextInput } from "@mantine/core";
// import Navbar from "../components/Navbar";
// import { useAuth } from "../context/AuthContext"; // Import useAuth
// import { IoSearchOutline } from "react-icons/io5";
// import Footer from "../components/Footer";
// import {
//   collection,
//   addDoc,
//   serverTimestamp,
//   doc,
//   updateDoc,
// } from "firebase/firestore"; // Import Firestore functions
// import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
// import { db, storage } from "../firebaseConfig";
// import Modal from "react-modal";

// Modal.setAppElement("#root");

// const Learn = () => {
//   const navigate = useNavigate();
//   const { user, setUser } = useAuth(); // Get the user from AuthContext

//   const handleLogout = async () => {
//     try {
//       await signOut(auth);
//       toast.success("Logged out successfully!");
//       navigate("/"); // Redirect to login after logout
//     } catch (error) {
//       toast.error("Error during logout");
//       console.error("Error during logout:", error);
//     }
//   };

//   const classesData = [
//     {
//       title: "Abdullah’s Spanish Conversation Class",
//       description:
//         "Master key concepts and boost retention with our interactive flashcards feature.",
//       imageUrl: "/images/landing-card-1.png",
//     },
//     {
//       title: "Bryson’s English Conversation Class",
//       description:
//         "Join live webinars conducted by subject matter experts, where they delve into specific topics, and answer questions from participants.",
//       imageUrl: "/images/landing-card-2.png",
//     },
//     {
//       title: "Arham language exchange class.",
//       description:
//         "Participate in live Q&A sessions with experienced educators who are available to address your queries & to encourage active learning",
//       imageUrl: "/images/landing-card-3.png",
//     },
//     {
//       title: "Abdullah’s Spanish Conversation Class",
//       description:
//         "Master key concepts and boost retention with our interactive flashcards feature.",
//       imageUrl: "/images/landing-card-1.png",
//     },
//     {
//       title: "Bryson’s English Conversation Class",
//       description:
//         "Join live webinars conducted by subject matter experts, where they delve into specific topics, and answer questions from participants.",
//       imageUrl: "/images/landing-card-2.png",
//     },
//     {
//       title: "Arham language exchange class.",
//       description:
//         "Participate in live Q&A sessions with experienced educators who are available to address your queries & to encourage active learning",
//       imageUrl: "/images/landing-card-3.png",
//     },
//   ];

//   const groupsData = [
//     {
//       title: "Abdullah’s Spanish | Exchange Group",
//       description:
//         "Master key concepts and boost retention with our interactive flashcards feature.",
//       imageUrl: "/images/landing-card-1.png",
//     },
//     {
//       title: "Bryson’s English | Spanish Exchange Group",
//       description:
//         "Join live webinars conducted by subject matter experts, where they delve into specific topics, and answer questions from participants.",
//       imageUrl: "/images/landing-card-2.png",
//     },
//     {
//       title: "Arham language exchange group.",
//       description:
//         "Participate in live Q&A sessions with experienced educators who are available to address your queries & to encourage active learning",
//       imageUrl: "/images/landing-card-3.png",
//     },
//     {
//       title: "Abdullah’s Spanish | Exchange Group",
//       description:
//         "Master key concepts and boost retention with our interactive flashcards feature.",
//       imageUrl: "/images/landing-card-1.png",
//     },
//     {
//       title: "Bryson’s English | Spanish Exchange Group",
//       description:
//         "Join live webinars conducted by subject matter experts, where they delve into specific topics, and answer questions from participants.",
//       imageUrl: "/images/landing-card-2.png",
//     },
//     {
//       title: "Arham language exchange group.",
//       description:
//         "Participate in live Q&A sessions with experienced educators who are available to address your queries & to encourage active learning",
//       imageUrl: "/images/landing-card-3.png",
//     },
//   ];

//   const coursesData = [
//     {
//       imageUrl: "/images/recourse1.png", // Replace with the actual image path or URL
//       title: "English Conversation Guide",
//       author: "Prof. Samuel Thompson",
//       price: "₹699",
//       badge: "Bestseller",
//     },
//     {
//       imageUrl: "/images/recourse2.png", // Replace with the actual image path or URL
//       title: "English Conversation Guide",
//       author: "Prof. Samuel Thompson",
//       price: "₹699",
//       badge: "Bestseller",
//     },
//     {
//       imageUrl: "/images/recourse3.png", // Replace with the actual image path or URL
//       title: "English Conversation Guide",
//       author: "Prof. Samuel Thompson",
//       price: "₹699",
//       badge: "Bestseller",
//     },
//     {
//       imageUrl: "/images/recourse1.png", // Replace with the actual image path or URL
//       title: "English Conversation Guide",
//       author: "Prof. Samuel Thompson",
//       price: "₹699",
//       badge: "Bestseller",
//     },
//     {
//       imageUrl: "/images/recourse2.png", // Replace with the actual image path or URL
//       title: "English Conversation Guide",
//       author: "Prof. Samuel Thompson",
//       price: "₹699",
//       badge: "Bestseller",
//     },
//   ];
//   const instructors = [
//     { id: 1, img: "/images/ins-1.png" },
//     { id: 2, img: "/images/ins-2.png" },
//     { id: 3, img: "/images/ins-3.png" },
//     { id: 4, img: "/images/ins-4.png" },
//     { id: 5, img: "/images/ins-5.png" },
//     { id: 6, img: "/images/ins-6.png" },
//     { id: 7, img: "/images/ins-7.png" },
//     { id: 8, img: "/images/ins-1.png" },
//     { id: 9, img: "/images/ins-2.png" },
//     { id: 10, img: "/images/ins-3.png" },
//     { id: 11, img: "/images/ins-4.png" },
//     { id: 12, img: "/images/ins-5.png" },
//     { id: 13, img: "/images/ins-6.png" },
//     { id: 14, img: "/images/ins-7.png" },
//     { id: 15, img: "/images/ins-1.png" },
//     { id: 16, img: "/images/ins-2.png" },
//   ];

//   //------------------------------------------adding groups modal--------------------------------------//
//   const [step, setStep] = useState(1); // Step for multi-step modal
//   const [groupType, setGroupType] = useState(""); // English or Spanish
//   const [groupName, setGroupName] = useState("");
//   const [groupDescription, setGroupDescription] = useState("");
//   const [image, setImage] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [modalOpen, setModalOpen] = useState(false);

//   const onRequestClose = () => {
//     setModalOpen(false);
//   };

//   const onRequestOpen = () => {
//     setModalOpen(true);
//   };

//   const handleImageUpload = async () => {
//     if (!image) return null;
//     const storageRef = ref(storage, `groups/${groupType}/${image.name}`);
//     await uploadBytes(storageRef, image);
//     return await getDownloadURL(storageRef);
//   };

//   const handleCreateGroup = async () => {
//     setLoading(true);
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

//       setLoading(false);
//       onRequestClose(); // Close modal on successful creation
//     } catch (error) {
//       console.error("Error creating group:", error);
//       setLoading(false);
//     }
//   };

//   return (
//     <>
//       <Navbar user={user} />
//       <div>
//         <div className="flex items-center justify-center pb-4 ">
//           <div className="items-center flex-grow hidden w-full max-w-lg mx-4 md:flex">
//             <TextInput
//               placeholder="Ask SuperTutor"
//               radius="md"
//               size="lg"
//               styles={{
//                 input: {
//                   borderColor: "#14B82C",
//                   borderWidth: "1px",
//                 },
//               }}
//               leftSection={
//                 <IoSearchOutline className="text-3xl text-green-500" />
//               }
//               className="w-full border-green-500"
//             />
//           </div>
//         </div>
//         {/* Section 1 */}
//         <div
//           className="relative  flex items-center justify-start h-[60vh] md:h-[85vh] px-4 md:px-10 text-white bg-center bg-cover"
//           style={{
//             backgroundImage: `url('/images/landing-1.png')`,
//           }}
//         >
//           <div className="max-w-3xl p-4 space-y-6 md:max-w-5xl md:p-8 md:space-y-10">
//             <h1 className="mb-4 text-4xl font-bold md:text-6xl">
//               Learn your new language
//             </h1>
//             <p className="mb-6 text-lg md:text-3xl">
//               Learn a new language and practice through conversation with native
//               speakers, language learners, and certified instructors. bammbuu is
//               a safe place to practice.
//             </p>
//             <Button
//               className="px-4 py-2 font-bold text-white bg-green-500 hover:bg-green-600 md:px-6 md:py-2"
//               size="xl"
//               radius="xl"
//             >
//               bammbbuu++
//             </Button>
//           </div>
//         </div>
//         {/* My Classes Section */}
//         <div className="relative flex flex-col items-center justify-center w-full px-2 pt-10 pb-10 md:pt-10 md:pb-20">
//           <div className="max-w-3xl p-4 space-y-6 text-center md:max-w-5xl md:p-8 md:space-y-10">
//             <h1 className="mb-0 text-4xl md:text-6xl font-bold text-[#444444]">
//               My Classes
//             </h1>
//           </div>

//           <Button
//             onClick={() => console.log("Add Class clicked")}
//             className=""
//             variant="filled"
//             color="green"
//           >
//             Add Class
//           </Button>
//           <div className="flex items-center justify-start w-full gap-6 py-5 space-x-6 overflow-x-auto max-w-[170vh] md:py-10 pl-6 scrollbar-hide">
//             {classesData.map((card, index) => (
//               <div
//                 key={index}
//                 className="flex-shrink-0 w-64 overflow-hidden transition-transform duration-300 transform bg-white rounded-lg shadow-md md:w-80 hover:scale-105 hover:shadow-lg"
//               >
//                 <img
//                   className="object-cover w-full h-40 sm:h-48 md:h-56 lg:h-64"
//                   src={card.imageUrl}
//                   alt={card.title}
//                 />
//                 <div className="flex flex-col justify-between h-40 p-4 sm:h-44 md:h-48 lg:h-52">
//                   <div>
//                     <h2 className="mb-2 text-base font-semibold sm:text-lg md:text-xl lg:text-2xl">
//                       {card.title}
//                     </h2>
//                     <p className="mb-4 text-xs text-gray-600 sm:text-sm md:text-md truncate-text">
//                       {card.description}
//                     </p>
//                   </div>
//                   <a
//                     href="#"
//                     className="text-sm font-bold text-green-600 hover:underline md:text-lg lg:text-xl"
//                   >
//                     Visit
//                   </a>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* My Groups Section */}
//         <div className="relative flex flex-col items-center justify-center w-full px-2 pt-10 pb-10 md:pt-10 md:pb-20">
//           <div className="max-w-3xl p-4 space-y-6 text-center md:max-w-5xl md:p-8 md:space-y-10">
//             <h1 className="mb-0 text-4xl md:text-6xl font-bold text-[#444444]">
//               My Groups
//             </h1>
//           </div>
//           <Button
//             onClick={onRequestOpen}
//             className="flex items-end justify-end"
//             variant="filled"
//             color="green"
//           >
//             Add Group
//           </Button>
//           <div className="flex items-center justify-start w-full gap-6 py-5 space-x-6 overflow-x-auto max-w-[170vh] md:py-10 pl-6 scrollbar-hide">
//             {groupsData.map((card, index) => (
//               <div
//                 key={index}
//                 className="flex-shrink-0 w-64 overflow-hidden transition-transform duration-300 transform bg-white rounded-lg shadow-md md:w-80 hover:scale-105 hover:shadow-lg"
//               >
//                 <img
//                   className="object-cover w-full h-40 sm:h-48 md:h-56 lg:h-64"
//                   src={card.imageUrl}
//                   alt={card.title}
//                 />
//                 <div className="flex flex-col justify-between h-40 p-4 sm:h-44 md:h-48 lg:h-52">
//                   <div>
//                     <h2 className="mb-2 text-base font-semibold sm:text-lg md:text-xl lg:text-2xl">
//                       {card.title}
//                     </h2>
//                     <p className="mb-4 text-xs text-gray-600 sm:text-sm md:text-md truncate-text">
//                       {card.description}
//                     </p>
//                   </div>
//                   <a
//                     href="#"
//                     className="text-sm font-bold text-green-600 hover:underline md:text-lg lg:text-xl"
//                   >
//                     Open
//                   </a>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Section 4 */}
//         <div className="flex flex-col px-2 pt-6 pb-10 border-t-4 border-gray-200">
//           <div className="max-w-3xl p-4 space-y-6 md:max-w-5xl md:p-8 md:space-y-10">
//             <h1 className="mb-4 ml-28 text-3xl md:text-5xl font-semibold text-[#444444] text-left">
//               Saved Resources
//             </h1>
//           </div>
//           <div className="flex items-center justify-center">
//             {" "}
//             <div className="flex items-center justify-start w-full gap-6 py-2 space-x-6 overflow-x-auto max-w-[170vh] md:py-4 pl-6 scrollbar-hide">
//               {coursesData.map((card, index) => (
//                 <div
//                   key={index}
//                   className="flex-shrink-0 w-64 overflow-hidden transition-transform duration-300 transform bg-white rounded-lg shadow-md md:w-80 hover:scale-105 hover:shadow-lg"
//                 >
//                   <img
//                     className="object-cover w-full h-40 sm:h-48 md:h-56 lg:h-64"
//                     src={card.imageUrl}
//                     alt={card.title}
//                   />
//                   <div className="flex flex-col justify-between h-40 p-4 sm:h-44 md:h-48 lg:h-52">
//                     <div>
//                       <h2 className="mb-2 text-base font-semibold text-gray-800 sm:text-lg md:text-xl lg:text-2xl">
//                         {card.title}
//                       </h2>
//                       <p className="text-xs text-gray-600 sm:text-sm md:text-md lg:text-lg">
//                         {card.author}
//                       </p>
//                       <p className="text-sm font-semibold text-black sm:text-lg md:text-xl lg:text-2xl">
//                         {card.price}
//                       </p>
//                     </div>
//                     {card.badge && (
//                       <span className="inline-block px-3 py-1 mt-4 text-xs font-semibold text-orange-700 bg-orange-100 rounded-full sm:text-sm md:text-md lg:text-lg w-fit">
//                         {card.badge}
//                       </span>
//                     )}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>

//         {/* Section 5 */}
//         <div
//           className="relative flex items-center justify-start h-[55vh] md:h-[75vh] px-4 md:px-10 text-white bg-center bg-cover"
//           style={{
//             backgroundImage: `url('/images/landing-2.png')`,
//           }}
//         >
//           <div className="max-w-3xl p-4 space-y-6 md:max-w-5xl md:p-8 md:space-y-10">
//             <h1 className="mb-4 text-4xl font-bold md:text-6xl">
//               Practice languages{" "}
//             </h1>
//             <p className="mb-6 text-lg md:text-3xl">
//               Practice conversation 24/7 on demand with bammbuu SuperTutor.
//             </p>
//             <Button
//               className="px-4 py-2 font-bold text-black bg-white hover:bg-gray-200 hover:text-black md:px-6 md:py-2"
//               size="lg"
//               radius="xl"
//             >
//               Learn More{" "}
//             </Button>
//           </div>
//         </div>

//         {/* section 5 */}

//         <div className="px-4 pt-20 space-y-20">
//           <h1 className="mb-4 text-4xl md:text-6xl text-center font-bold text-[#444444]">
//             Why practice languages with bammbuu{" "}
//           </h1>

//           <div className="flex flex-col items-center justify-center space-y-10 md:flex-row md:-space-x-16 md:space-y-0">
//             <div className="flex flex-col items-center justify-between space-y-10">
//               <div className="py-10 px-8 bg-[#f2f2f2] rounded-lg shadow-lg w-full md:w-[45vh] text-center md:text-left border-2 border-[#cecece]">
//                 <h3 className="mb-4 text-2xl font-semibold">
//                   Intelligent Conversational Interface
//                 </h3>
//                 <p className="text-lg text-gray-600">
//                   Edi can engage in natural language conversations with users,
//                   understanding their queries and providing accurate and
//                   relevant responses in real-time.
//                 </p>
//               </div>
//               <div className="py-10 px-8 bg-[#f2f2f2] rounded-lg shadow-lg w-full md:w-[45vh] text-center md:text-left border-2 border-[#cecece]">
//                 <h3 className="mb-4 text-2xl font-semibold">
//                   Adaptive Learning Algorithms
//                 </h3>
//                 <p className="text-lg text-gray-600">
//                   Edi utilizes adaptive learning algorithms to analyze user
//                   performance, identify areas of improvement, and recommend
//                   targeted resources or practice materials.
//                 </p>
//               </div>
//             </div>

//             <div className="transition-transform transform hover:scale-105">
//               <img
//                 alt="owl"
//                 src="/images/Owl.png"
//                 className="h-auto max-w-full"
//               />
//             </div>

//             <div className="flex flex-col items-center justify-between space-y-10">
//               <div className="py-10 px-8 bg-[#f2f2f2] rounded-lg shadow-lg w-full md:w-[45vh] text-center md:text-left border-2 border-[#cecece]">
//                 <h3 className="mb-4 text-2xl font-semibold">
//                   Progress Tracking and Feedback
//                 </h3>
//                 <p className="text-lg text-gray-600">
//                   Tracks and analyzes user progress, providing feedback on
//                   performance, strengths, and areas needing improvement. It
//                   offers personalized recommendations for further study.
//                 </p>
//               </div>
//               <div className="py-10 px-8 bg-[#f2f2f2] rounded-lg shadow-lg w-full md:w-[45vh] text-center md:text-left border-2 border-[#cecece]">
//                 <h3 className="mb-4 text-2xl font-semibold">
//                   Study Reminders and Scheduling
//                 </h3>
//                 <p className="text-lg text-gray-600">
//                   Sends reminders, suggests study schedules to help users stay
//                   organized and maintain a consistent learning routine,
//                   available around the clock 24/7.
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Section 6 */}
//         <div className=" bg-[#f2f2f2] flex flex-col items-center justify-center py-20 mt-20 space-y-6">
//           <h1 className="mb-4 text-4xl font-semibold md:text-6xl text-[#444444]">
//             bammbuu+{" "}
//           </h1>
//           <p className="mb-6 text-lg md:text-2xl text-[#444444]">
//             Discover the membership that suits your learning needs, flexible
//             learning and cancellation options.{" "}
//           </p>
//           <p className="mb-6 text-[#444444] font-semibold text-lg md:text-3xl">
//             Starting at $59/mo{" "}
//           </p>
//           <div>
//             <Button size="lg" radius="xl" color="#14B82C" className="mt-6">
//               Subscribe{" "}
//             </Button>
//           </div>
//         </div>

//         {/* section 7 */}
//         <div className="flex mb-20 flex-col items-center justify-center px-6 py-12 md:px-12 lg:px-20 mx-4 md:mx-10 lg:mx-20 mt-12 md:mt-16 lg:mt-20 text-white bg-[#090909] rounded-3xl">
//           <div className="grid grid-cols-3 gap-4 mb-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9">
//             {instructors.map((instructor) => (
//               <div
//                 key={instructor.id}
//                 className="w-24 h-24 overflow-hidden rounded-full sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-40 lg:h-40 "
//               >
//                 <img
//                   src={instructor.img}
//                   alt={`Instructor ${instructor.id}`}
//                   className="w-full h-full "
//                 />
//               </div>
//             ))}
//           </div>
//           <p className="mt-8 mb-4 text-xl font-semibold text-left sm:text-2xl md:text-3xl">
//             bambbuu+ offers 1:1 live classes with certified language
//             instructors.
//           </p>
//           <Button
//             className="mt-6 text-black bg-white hover:bg-gray-200 hover:text-black"
//             size="xl"
//             radius="xl"
//           >
//             View instructors
//           </Button>
//         </div>
//       </div>
//       <Footer />

//       <Modal
//         isOpen={modalOpen}
//         onRequestClose={onRequestClose}
//         contentLabel="Create New Group"
//         className="max-w-lg p-6 mx-auto bg-white rounded-lg shadow-lg outline-none"
//         overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
//       >
//         {step === 1 && (
//           <div className="text-center">
//             <h2 className="mb-4 text-lg font-semibold text-gray-700">
//               Select Group Type
//             </h2>
//             <div className="flex justify-center gap-4">
//               <button
//                 onClick={() => {
//                   setGroupType("English");
//                   setStep(2);
//                 }}
//                 className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 focus:outline-none"
//               >
//                 English
//               </button>
//               <button
//                 onClick={() => {
//                   setGroupType("Spanish");
//                   setStep(2);
//                 }}
//                 className="px-4 py-2 text-white bg-green-500 rounded hover:bg-green-600 focus:outline-none"
//               >
//                 Spanish
//               </button>
//             </div>
//           </div>
//         )}

//         {step === 2 && (
//           <div className="space-y-4">
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
//                 className="w-full p-2 border border-gray-300 rounded focus:ring focus:ring-blue-200 focus:outline-none"
//               />
//             </div>

//             <div>
//               <label className="block mb-1 text-sm font-medium text-gray-700">
//                 Description
//               </label>
//               <input
//                 type="text"
//                 placeholder="Enter group description"
//                 value={groupDescription}
//                 onChange={(e) => setGroupDescription(e.target.value)}
//                 required
//                 className="w-full p-2 border border-gray-300 rounded focus:ring focus:ring-blue-200 focus:outline-none"
//               />
//             </div>

//             <div>
//               <label className="block mb-1 text-sm font-medium text-gray-700">
//                 Group Image
//               </label>
//               <input
//                 type="file"
//                 accept="image/*"
//                 onChange={(e) => setImage(e.target.files[0])}
//                 className="w-full p-2 border border-gray-300 rounded focus:outline-none"
//               />
//             </div>

//             <button
//               onClick={handleCreateGroup}
//               disabled={!groupName || !groupDescription || !image || loading}
//               className={`w-full px-4 py-2 rounded text-white ${
//                 loading ? "bg-gray-400" : "bg-teal-500 hover:bg-teal-600"
//               } focus:outline-none focus:ring focus:ring-teal-200`}
//             >
//               {loading ? "Creating Group..." : "Create Group"}
//             </button>
//           </div>
//         )}
//       </Modal>
//     </>
//   );
// };

// export default Learn;

import { useAuth } from "../context/AuthContext";
import LearnUser from "./user/LearnUser";

const Learn = () => {
  const { user, setUser } = useAuth(); // Get the user from AuthContext
  const userType = sessionStorage.getItem("userType");

  // If user is not found, handle it (e.g., redirect to login)
  if (!user) {
    return <div>Please log in to view your courses.</div>; // You can also redirect to a login page here
  }

  return (
    <>
      {userType === "student" && <LearnUser />} {/* Student Courses */}
      {userType === "tutor" && <div>under dev</div>}{" "}
    </>
  );
};

export default Learn;
