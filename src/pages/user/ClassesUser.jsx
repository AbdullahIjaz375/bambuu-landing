import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { ClipLoader } from "react-spinners";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const ClassesUser = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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

            // Fetch the group photoUrl using classGroupId
            if (classData.classGroupId) {
              const groupRef = doc(db, "groups", classData.classGroupId);
              const groupDoc = await getDoc(groupRef);

              if (groupDoc.exists()) {
                const groupData = groupDoc.data();
                classData.photoUrl = groupData.imageUrl; // Add photoUrl to class data
              }
            }

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

  return (
    <>
      <Navbar user={user} />
      <div className="flex flex-col items-center w-full py-10 sm:px-10 md:px-20 lg:px-40 sm:pt-10 sm:pb-10">
        <h1 className="text-2xl font-bold text-gray-500 sm:text-4xl">
          Your Joined Classes
        </h1>

        {loading ? (
          <div className="flex items-center justify-center min-h-[50vh] w-full">
            <ClipLoader color="#14B82C" size={50} />
          </div>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : classes.length === 0 ? (
          <p className="text-center text-gray-500">No classes found.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 my-10 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((classItem) => (
              <div
                key={classItem.id}
                className="relative p-6 transition-transform transform bg-white border border-gray-200 rounded-lg shadow-lg hover:scale-105 hover:shadow-xl"
              >
                {/* Background Image */}
                <img
                  src={classItem.photoUrl || "defaultImage.jpg"}
                  alt={classItem.className}
                  className="relative object-cover w-full h-40 mb-4 overflow-hidden rounded-lg"
                />

                <h3 className="mb-2 text-xl font-bold text-gray-800">
                  {classItem.className}
                </h3>
                <p className="mb-4 text-gray-700 line-clamp-3">
                  {classItem.classDescription}
                </p>

                <div className="space-y-2 text-gray-600">
                  <p>
                    <span className="font-semibold">Level:</span>{" "}
                    {classItem.classLevel}
                  </p>
                  <p>
                    <span className="font-semibold">Type:</span>{" "}
                    {classItem.classType}
                  </p>
                  <p>
                    <span className="font-semibold">Language:</span>{" "}
                    {classItem.classLanguageType}
                  </p>
                  <p>
                    <span className="font-semibold">Available Spots:</span>{" "}
                    {classItem.availableSpots}
                  </p>
                </div>

                <button
                  onClick={() =>
                    navigate(`/classesDetailsUser/${classItem.id}`)
                  }
                  className="w-full px-4 py-2 mt-6 font-semibold text-white transition-colors bg-green-600 rounded-lg shadow-md hover:bg-green-700"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default ClassesUser;
