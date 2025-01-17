// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useAuth } from "../../context/AuthContext";
// import { db } from "../../firebaseConfig";
// import { doc, getDoc } from "firebase/firestore";
// import { ClipLoader } from "react-spinners";
// import Navbar from "../../components/Navbar";
// import Footer from "../../components/Footer";

// const ClassesUser = () => {
//   const { user } = useAuth();
//   const [classes, setClasses] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchClasses = async () => {
//       if (!user || !user.enrolledClasses) {
//         setLoading(false);
//         return;
//       }

//       setLoading(true);
//       const classesData = [];

//       try {
//         for (const classId of user.enrolledClasses) {
//           const classRef = doc(db, "classes", classId);
//           const classDoc = await getDoc(classRef);

//           if (classDoc.exists()) {
//             const classData = classDoc.data();

//             // Fetch the group photoUrl using classGroupId
//             if (classData.classGroupId) {
//               const groupRef = doc(db, "groups", classData.classGroupId);
//               const groupDoc = await getDoc(groupRef);

//               if (groupDoc.exists()) {
//                 const groupData = groupDoc.data();
//                 classData.photoUrl = groupData.imageUrl; // Add photoUrl to class data
//               }
//             }

//             classesData.push({ id: classId, ...classData });
//           }
//         }
//         setClasses(classesData);
//         console.log("Final classes data:", classesData);
//       } catch (error) {
//         console.error("Error fetching classes:", error);
//         setError(
//           "Unable to fetch classes at this time. Please try again later."
//         );
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchClasses();
//   }, [user]);

//   return (
//     <>
//       <Navbar user={user} />
//       <div className="flex flex-col items-center w-full py-10 sm:px-10 md:px-20 lg:px-40 sm:pt-10 sm:pb-10">
//         <h1 className="text-2xl font-bold text-gray-500 sm:text-4xl">
//           Your Joined Classes
//         </h1>

//         {loading ? (
//           <div className="flex items-center justify-center min-h-[50vh] w-full">
//             <ClipLoader color="#14B82C" size={50} />
//           </div>
//         ) : error ? (
//           <p className="text-center text-red-500">{error}</p>
//         ) : classes.length === 0 ? (
//           <p className="text-center text-gray-500">No classes found.</p>
//         ) : (
//           <div className="grid grid-cols-1 gap-6 my-10 sm:grid-cols-2 lg:grid-cols-3">
//             {classes.map((classItem) => (
//               <div
//                 key={classItem.id}
//                 className="relative p-6 transition-transform transform bg-white border border-gray-200 rounded-lg shadow-lg hover:scale-105 hover:shadow-xl"
//               >
//                 {/* Background Image */}
//                 <img
//                   src={classItem.photoUrl || "defaultImage.jpg"}
//                   alt={classItem.className}
//                   className="relative object-cover w-full h-40 mb-4 overflow-hidden rounded-lg"
//                 />

//                 <h3 className="mb-2 text-xl font-bold text-gray-800">
//                   {classItem.className}
//                 </h3>
//                 <p className="mb-4 text-gray-700 line-clamp-3">
//                   {classItem.classDescription}
//                 </p>

//                 <div className="space-y-2 text-gray-600">
//                   <p>
//                     <span className="font-semibold">Level:</span>{" "}
//                     {classItem.classLevel}
//                   </p>
//                   <p>
//                     <span className="font-semibold">Type:</span>{" "}
//                     {classItem.classType}
//                   </p>
//                   <p>
//                     <span className="font-semibold">Language:</span>{" "}
//                     {classItem.classLanguageType}
//                   </p>
//                   <p>
//                     <span className="font-semibold">Available Spots:</span>{" "}
//                     {classItem.availableSpots}
//                   </p>
//                 </div>

//                 <button
//                   onClick={() =>
//                     navigate(`/classesDetailsUser/${classItem.id}`)
//                   }
//                   className="w-full px-4 py-2 mt-6 font-semibold text-white transition-colors bg-green-600 rounded-lg shadow-md hover:bg-green-700"
//                 >
//                   View Details
//                 </button>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//       <Footer />
//     </>
//   );
// };

// export default ClassesUser;
import React, { useEffect, useState } from "react";
import { Search, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { ClipLoader } from "react-spinners";
import ClassCard from "../../components/ClassCard";
import Sidebar from "../../components/Sidebar";
import EmptyState from "../../components/EmptyState";

const ClassesUser = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("group");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  useEffect(() => {
    const fetchClasses = async () => {
      if (!user || !user.enrolledClasses) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const classesData = [];

      try {
        for (const classId of user.enrolledClasses) {
          const classRef = doc(db, "classes", classId);
          const classDoc = await getDoc(classRef);

          if (classDoc.exists()) {
            const classData = classDoc.data();
            classesData.push({ id: classId, ...classData });
          }
        }
        setClasses(classesData);
      } catch (error) {
        console.error("Error fetching classes:", error);
        setError(
          "Unable to fetch classes at this time. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [user]);

  const isBambbuuPlusClass = (classType) => {
    return classType === "Individual Premium" || classType === "Group Premium";
  };

  const filteredClasses = classes.filter((classItem) => {
    const searchTerm = searchQuery.toLowerCase().trim();
    const isBambuuPlus = isBambbuuPlusClass(classItem.classType);

    // First filter by tab
    if (activeTab === "bammbuu" && !isBambuuPlus) return false;
    if (activeTab === "group" && isBambuuPlus) return false;

    // Then filter by search term
    if (!searchTerm) return true;

    return (
      classItem.className?.toLowerCase().includes(searchTerm) ||
      classItem.language?.toLowerCase().includes(searchTerm) ||
      classItem.languageLevel?.toLowerCase().includes(searchTerm)
    );
  });

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar user={user} />

      <div className="flex-1 p-8 bg-white border-2 border-[#e7e7e7] rounded-3xl ml-[17rem] m-2">
        <div className="flex items-center justify-between pb-4 mb-6 border-b">
          <div className="flex items-center gap-4">
            <button
              className="p-3 bg-gray-100 rounded-full"
              onClick={handleBack}
            >
              <ArrowLeft size="30" />
            </button>
            <h1 className="text-4xl font-semibold">My Classes</h1>
          </div>
          <button className="px-6 py-3 text-[#042f0c] text-xl font-medium bg-white border border-[#5d5d5d] rounded-full">
            Book New Class
          </button>
        </div>

        <div className="flex flex-row items-center justify-between">
          <div className="flex justify-center">
            <div className="inline-flex bg-gray-100 border border-gray-300 rounded-full">
              <button
                onClick={() => setActiveTab("group")}
                className={`px-6 py-2 rounded-full text-[#042F0C] text-md font-medium transition-colors
            ${
              activeTab === "group"
                ? "bg-[#FFBF00] border border-[#042F0C]"
                : "bg-transparent"
            }`}
              >
                Group Conversation Classes
              </button>
              <button
                onClick={() => setActiveTab("bammbuu")}
                className={`px-6 py-2 rounded-full text-[#042F0C] text-md font-medium transition-colors
            ${
              activeTab === "bammbuu"
                ? "bg-[#FFBF00] border border-[#042F0C]"
                : "bg-transparent"
            }`}
              >
                bammbuu+ Classes
              </button>
            </div>
          </div>

          <div className="relative mb-6">
            <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
            <input
              type="text"
              placeholder="Search classes by name"
              className="w-[40vh] py-3 pl-10 pr-4 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[70vh]">
            <ClipLoader color="#14B82C" size={50} />
          </div>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : filteredClasses.length === 0 ? (
          <div className="flex items-center justify-center min-h-[70vh]">
            <EmptyState
              message={
                searchQuery
                  ? "No results found."
                  : `No ${
                      activeTab === "bammbuu" ? "bammbuu+" : "group"
                    } classes found.`
              }
            />{" "}
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            {filteredClasses.map((classItem) => (
              <div key={classItem.id} className="flex-none w-80">
                <ClassCard
                  {...classItem}
                  isBammbuu={isBambbuuPlusClass(classItem.classType)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassesUser;
