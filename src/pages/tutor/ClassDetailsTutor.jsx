import React, { useState, useEffect } from "react";
import { ArrowLeft, User, Clock, Calendar, MapPin } from "lucide-react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { ClipLoader } from "react-spinners";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Modal from "react-modal";

Modal.setAppElement("#root");

const ClassDetailsTutor = ({ onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Members");
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classData, setClassData] = useState(null);
  const [error, setError] = useState(null);
  const { classId } = useParams();

  const fetchClass = async () => {
    if (!classId) {
      setError("No class ID provided");
      setLoading(false);
      return;
    }

    try {
      const classDoc = await getDoc(doc(db, "classes", classId));
      if (!classDoc.exists()) {
        setError("Class not found");
        setLoading(false);
        return;
      }
      setClassData({ id: classDoc.id, ...classDoc.data() });
    } catch (err) {
      console.error("Error fetching class:", err);
      setError("Failed to fetch class details");
    }
    setLoading(false);
  };

  const fetchMembers = async () => {
    if (!classData?.classMemberIds) return;

    try {
      const membersData = await Promise.all(
        classData.classMemberIds.map(async (memberId) => {
          const userDoc = await getDoc(doc(db, "students", memberId));
          return userDoc.exists()
            ? { id: userDoc.id, ...userDoc.data() }
            : null;
        })
      );
      setMembers(membersData.filter(Boolean));
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  };

  useEffect(() => {
    fetchClass();
  }, [classId]);

  useEffect(() => {
    if (classData) {
      fetchMembers();
    }
  }, [classData]);

  //-----------------------------getting admin details------------------------------------------//

  const [groupTutor, setGroupTutor] = useState(null);

  const fetchClassAdmin = async () => {
    if (!classData?.adminId) return;

    try {
      // Check in tutors collection
      const tutorDoc = await getDoc(doc(db, "tutors", classData.adminId));
      if (tutorDoc.exists()) {
        setGroupTutor({ id: tutorDoc.id, ...tutorDoc.data() });
        return;
      }

      // If not found in tutors, check students collection
      const studentDoc = await getDoc(doc(db, "students", classData.adminId));
      if (studentDoc.exists()) {
        setGroupTutor({ id: studentDoc.id, ...studentDoc.data() });
      }
    } catch (error) {
      console.error("Error fetching group admin:", error);
    }
  };

  useEffect(() => {
    if (classData) {
      fetchClassAdmin();
      console.log("admin:", groupTutor);
    }
  }, [classData]);
  //---------------------------------------------------------------------------------------------------//

  const [showRemoveConfirmation, setShowRemoveConfirmation] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemoveUser = async (userId) => {
    try {
      setIsRemoving(true);

      // Get references to the group and user documents
      const classRef = doc(db, "classes", classId);
      const userRef = doc(db, "students", userId);

      // Get current group data
      const classDoc = await getDoc(classRef);
      const currentClass = classDoc.data();

      // Remove user from group's memberIds
      const updatedMemberIds = currentClass.classMemberIds.filter(
        (id) => id !== userId
      );
      await updateDoc(classRef, {
        classMemberIds: updatedMemberIds,
      });

      // Get user data and update their joinedGroups
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      const updatedEnrolledClasses = (userData.enrolledClasses || []).filter(
        (id) => id !== classId
      );

      // Update user document
      await updateDoc(userRef, {
        enrolledClasses: updatedEnrolledClasses,
      });

      // Update local state
      setMembers((prevMembers) =>
        prevMembers.filter((member) => member.id !== userId)
      );
      setShowRemoveConfirmation(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Error removing user:", error);
    } finally {
      setIsRemoving(false);
    }
  };

  const getClassTypeColor = (type) => {
    switch (type) {
      case "Group Premium":
        return "bg-[#e6fce8]";
      case "Individual Premium":
        return "bg-[#e6fce8]";
      default:
        return "bg-[#ffffea]";
    }
  };

  const renderMembers = () => {
    if (members.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">No members available</p>
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between px-4 py-3 border border-gray-200 hover:bg-gray-50 rounded-3xl"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={member.photoUrl || "/api/placeholder/40/40"}
                    alt={member.name}
                    className="object-cover rounded-full w-9 h-9"
                  />
                  {member.id === classData.adminId && (
                    <div className="absolute flex items-center justify-center w-4 h-4 bg-yellow-400 rounded-full -top-1 -right-1">
                      <span className="text-xs text-black">★</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">
                    {member.name}
                  </span>
                  {member.id === classData.adminId && (
                    <span className="text-xs text-gray-500">Teacher</span>
                  )}
                </div>
              </div>
              {user.uid === classData.adminId &&
                member.id !== classData.adminId && (
                  <button
                    onClick={() => {
                      setSelectedUser(member);
                      setShowRemoveConfirmation(true);
                    }}
                    className="px-3 py-1 text-xs text-red-500 border border-red-500 rounded-full hover:bg-red-50"
                  >
                    Remove
                  </button>
                )}
            </div>
          ))}
        </div>
        <Modal
          isOpen={showRemoveConfirmation}
          onRequestClose={() => setShowRemoveConfirmation(false)}
          className="z-50 max-w-sm p-6 mx-auto mt-40 bg-white outline-none rounded-3xl font-urbanist"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          style={{
            overlay: {
              zIndex: 60,
            },
            content: {
              border: "none",
              padding: "24px",
              maxWidth: "420px",
              position: "relative",
              zIndex: 61,
            },
          }}
        >
          <div className="text-center">
            <h2 className="mb-4 text-xl font-semibold">
              Remove {selectedUser?.name} from group?
            </h2>
            <p className="mb-6 text-gray-600">
              This action cannot be undone. The user will need to request to
              join again.
            </p>
            <div className="flex flex-row gap-2">
              <button
                className="w-full py-2 font-medium border border-gray-300 rounded-full hover:bg-gray-50"
                onClick={() => setShowRemoveConfirmation(false)}
              >
                Cancel
              </button>
              <button
                className="w-full py-2 font-medium text-black bg-[#ff4d4d] rounded-full hover:bg-[#ff3333] border border-[#8b0000]"
                onClick={() => handleRemoveUser(selectedUser.id)}
                disabled={isRemoving}
              >
                {isRemoving ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </Modal>
      </>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <ClipLoader color="#FFB800" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="p-8 bg-white rounded-lg">
          <p className="mb-4 text-red-500">{error}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!classData) return null;

  return (
    <div className="flex min-h-screen">
      <div className="flex flex-1 m-6 border rounded-3xl">
        <div className="flex flex-col w-full p-6 mx-4 bg-white rounded-3xl">
          <div className="flex items-center justify-between pb-4 mb-6 border-b">
            <div className="flex items-center gap-4">
              <button
                className="p-3 bg-gray-100 rounded-full"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft size="30" />
              </button>
              <h1 className="text-4xl font-semibold">Class Details</h1>
            </div>
          </div>

          <div className="flex flex-1 min-h-0 gap-6">
            <div
              className={`w-1/4 p-6 rounded-3xl ${getClassTypeColor(
                classData.classType
              )}`}
            >
              <div className="flex flex-col items-center justify-between h-full text-center">
                <div className="flex flex-col items-center text-center">
                  <img
                    src={classData.imageUrl}
                    alt={classData.className}
                    className="w-32 h-32 mb-4 rounded-full"
                  />
                  <h3 className="mb-2 text-2xl font-medium">
                    {classData.className}
                  </h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 text-sm bg-yellow-200 rounded-full">
                      {classData.language}
                    </span>
                    <span className="px-3 py-1 text-sm bg-yellow-200 rounded-full">
                      {classData.languageLevel}
                    </span>
                  </div>
                  <div className="flex flex-row items-center justify-between mt-4 space-x-6">
                    {" "}
                    <div className="flex flex-col gap-2 mb-4">
                      <div className="flex items-center gap-2">
                        <User />
                        <span className="text-sm">
                          {classData.adminName} (Teacher)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock />
                        <span className="text-sm">
                          {classData.classDuration} minutes
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar />
                        <span className="text-sm">
                          {new Date(
                            classData.classDateTime.seconds * 1000
                          ).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin />
                        <span className="text-sm">
                          {classData.classLocation}
                        </span>
                      </div>
                    </div>{" "}
                  </div>

                  <p className="mb-6 text-gray-600">
                    {classData.classDescription}
                  </p>
                </div>

                <div className="w-full space-y-4">
                  {groupTutor && (
                    <div className="flex flex-row items-center w-full max-w-lg gap-4 p-4 bg-white border border-green-500 rounded-xl">
                      <img
                        alt={`${groupTutor.name}'s profile`}
                        src={groupTutor.photoUrl}
                        className="object-cover w-28 h-28 rounded-xl"
                      />
                      <div className="flex flex-col items-start flex-1 gap-2">
                        <h1 className="text-xl font-semibold">
                          {groupTutor.name}
                        </h1>
                        <p className="text-sm text-left text-gray-600">
                          {groupTutor?.bio
                            ? groupTutor.bio.split(" ").slice(0, 12).join(" ") +
                              "..."
                            : null}
                        </p>
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-1">
                            <span className="text-gray-700">
                              {groupTutor.teachingLanguage} (Teaching)
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin size={16} className="text-gray-500" />
                            <span className="text-gray-700">
                              {groupTutor.country}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <button className="w-full px-4 py-2 text-black bg-[#ffbf00] border border-black rounded-full hover:bg-[#ffbf00]">
                    Join Class
                  </button>
                  <button className="w-full px-4 py-2 text-[#f04438] bg-white border border-[#f04438] rounded-full ">
                    Delete Class
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col flex-1 min-h-0">
              <div className="flex flex-row items-center justify-between mb-6">
                <button
                  className="px-6 py-2 text-black bg-yellow-400 rounded-full"
                  onClick={() => setActiveTab("Members")}
                >
                  Members ({members.length})
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">{renderMembers()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassDetailsTutor;
