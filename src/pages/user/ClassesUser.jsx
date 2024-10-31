import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

const ClassesUser = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClasses = async () => {
      if (!user || !user.enrolledClasses) return;

      const classesData = [];
      setLoading(true);

      try {
        for (let classId of user.enrolledClasses) {
          const classRef = doc(db, "classes", classId);
          const classDoc = await getDoc(classRef);
          if (classDoc.exists()) {
            classesData.push({ id: classId, ...classDoc.data() });
          }
        }
        setClasses(classesData);
      } catch (error) {
        console.error("Error fetching classes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-semibold text-gray-600">
          Loading classes...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl p-6 mx-auto">
      <h2 className="mb-6 text-3xl font-bold text-center text-gray-800">
        Your Classes
      </h2>
      {classes.length === 0 ? (
        <p className="text-center text-gray-500">No classes found.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((classItem) => (
            <div
              key={classItem.id}
              className="p-6 transition-transform transform bg-white border border-gray-200 rounded-lg shadow-md hover:scale-105"
            >
              <h3 className="mb-2 text-2xl font-semibold text-green-600">
                {classItem.className}
              </h3>
              <p className="mb-4 text-gray-700">{classItem.classDescription}</p>
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
                onClick={() => navigate(`/classesDetailsUser/${classItem.id}`)} // Navigate to class detail page
                className="w-full px-4 py-2 mt-4 font-semibold text-white transition-colors bg-green-600 rounded-lg shadow hover:bg-green-700"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClassesUser;
