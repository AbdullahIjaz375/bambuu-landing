import React, { useState, useEffect } from "react";
import {
  X,
  Clock,
  Calendar,
  User,
  Users,
  Camera,
  ArrowLeft,
} from "lucide-react";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { ClipLoader } from "react-spinners";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ClassCard from "../../components/ClassCard";

const InstructorProfileUser = () => {
  const { tutorId } = useParams(); // Get tutor ID from URL
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tutor, setTutor] = useState(null);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTutorAndClasses = async () => {
      try {
        setLoading(true);

        // Fetch tutor data
        const tutorDoc = await getDoc(doc(db, "tutors", tutorId));
        if (!tutorDoc.exists()) {
          throw new Error("Tutor not found");
        }
        const tutorData = { id: tutorDoc.id, ...tutorDoc.data() };
        setTutor(tutorData);

        // Fetch classes data
        const tutorClasses = tutorData.tutorOfClasses || [];
        if (tutorClasses.length > 0) {
          const classesPromises = tutorClasses.map((classId) =>
            getDoc(doc(db, "classes", classId))
          );
          const classSnapshots = await Promise.all(classesPromises);
          const classesData = classSnapshots
            .filter((doc) => doc.exists())
            .map((doc) => ({ id: doc.id, ...doc.data() }));
          setClasses(classesData);
          console.log(classes);
        }
      } catch (err) {
        console.error("Error fetching tutor data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (tutorId) {
      fetchTutorAndClasses();
    }
  }, [tutorId]);

  const handleBack = () => {
    navigate(-1);
  };

  const renderClasses = () => {
    if (classes.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-8">
          <div className="flex items-center justify-center w-16 h-16 mb-4 bg-yellow-100 rounded-full">
            <img alt="empty state" src="/images/no_saved.png" />
          </div>
          <p className="text-gray-600">No classes available</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-4 gap-4 ">
        {classes.map((classItem) => (
          <ClassCard
            key={classItem.id}
            classId={classItem.id}
            className={classItem.className}
            language={classItem.groupLearningLanguage}
            languageLevel={classItem.languageLevel}
            classDateTime={classItem.classDateTime}
            classDuration={classItem.classDuration}
            tutorName={classItem.teacherName}
            classMemberIds={classItem.classMemberIds || []}
            availableSpots={classItem.maxStudents || 100}
            physicalClass={classItem.isPhysical}
            imageUrl={classItem.imageUrl}
            recurrenceType={classItem.recurrenceType}
            isBammbuu={classItem.isBammbuu}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <div className="flex items-center justify-center flex-1">
          <ClipLoader color="#14B82C" size={50} />
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="p-8 bg-white rounded-lg">
          <p className="mb-4 text-red-500">{error}</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!tutor) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <div className="flex flex-1 m-6 border rounded-3xl">
        <div className="flex flex-col w-full p-6 mx-4 bg-white rounded-3xl">
          <div className="flex items-center justify-between pb-4 mb-6 border-b">
            <div className="flex items-center gap-4">
              <button
                className="p-3 bg-gray-100 rounded-full"
                onClick={handleBack}
              >
                <ArrowLeft size="30" />
              </button>
              <h1 className="text-4xl font-semibold">Instructor Profile</h1>
            </div>
          </div>

          <div className="flex flex-1 min-h-0 gap-2">
            {/* Left sidebar */}
            <div className="w-1/4 p-6 bg-[#ffffea] rounded-3xl">
              <div className="flex flex-col items-center justify-between h-full text-center">
                <div className="flex flex-col items-center text-center">
                  <img
                    src={tutor.photoUrl || "/api/placeholder/128/128"}
                    alt={tutor.name}
                    className="w-32 h-32 mb-4 rounded-full"
                  />
                  <h3 className="mb-2 text-2xl font-medium">{tutor.name}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 text-sm bg-yellow-200 rounded-full">
                      {tutor.teachingLanguage}
                    </span>
                    <span className="px-3 py-1 text-sm bg-yellow-200 rounded-full">
                      {tutor.teachingLanguageProficiency}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <User />
                    <span className="text-sm">
                      Native {tutor.nativeLanguage} Speaker
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <Users />
                    <span className="text-sm">
                      {tutor.tutorStudentIds?.length || 0} Students
                    </span>
                  </div>
                  <p className="mb-6 text-gray-600">{tutor.bio}</p>
                </div>

                <div className="w-full">
                  <button className="w-full px-4 py-2 mb-2 text-black border border-gray-300 rounded-full bg-[#fffbc5]">
                    Send Message
                  </button>
                </div>
              </div>
            </div>

            {/* Main content */}
            <div className="flex flex-col flex-1 min-h-0 ">
              <div className="flex-1 overflow-y-auto">
                <h2 className="mb-4 text-2xl font-semibold">Classes</h2>
                {renderClasses()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorProfileUser;
