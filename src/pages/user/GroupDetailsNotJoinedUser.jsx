import React, { useState, useEffect } from "react";
import {
  X,
  Clock,
  Calendar,
  User,
  Users,
  Camera,
  MapPin,
  ArrowLeft,
} from "lucide-react";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { db, storage } from "../../firebaseConfig";
import { ClipLoader } from "react-spinners";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import { TimeInput } from "@mantine/dates";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "react-datepicker/dist/react-datepicker-cssmodules.css";
import TimePicker from "react-time-picker";
import "react-time-picker/dist/TimePicker.css";
import "react-clock/dist/Clock.css";
import { Radio, Group } from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { useParams } from "react-router-dom";
import ClassCard from "../../components/ClassCard";
import Modal from "react-modal";
import ExploreClassCard from "../../components/ExploreClassCard";
Modal.setAppElement("#root");

const GroupDetailsNotJoinedUser = ({ onClose }) => {
  const { user, setUser } = useAuth(); // Destructure setUser to update context

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Classes");
  const [classes, setClasses] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  //------------------------------------------fetching groups-----------------------------------------//

  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [error, setError] = useState(null);
  const fetchGroup = async () => {
    if (!groupId) {
      setError("No group ID provided");
      setLoading(false);
      return;
    }

    try {
      const groupDoc = await getDoc(doc(db, "groups", groupId));

      if (!groupDoc.exists()) {
        setError("Group not found");
        setLoading(false);
        return;
      }

      setGroup({ id: groupDoc.id, ...groupDoc.data() });
    } catch (err) {
      console.error("Error fetching group:", err);
      setError("Failed to fetch group details");
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchGroup();
  }, [groupId]);

  //-----------------------------getting tutor details------------------------------------------//

  const [groupTutor, setGroupTutor] = useState(null);

  const fetchGroupTutor = async () => {
    if (!group?.groupAdminId) return;

    try {
      // Check in tutors collection
      const tutorDoc = await getDoc(doc(db, "tutors", group.groupAdminId));
      if (tutorDoc.exists()) {
        setGroupTutor({ id: tutorDoc.id, ...tutorDoc.data() });
        return;
      }

      // If not found in tutors, check students collection
      const studentDoc = await getDoc(doc(db, "students", group.groupAdminId));
      if (studentDoc.exists()) {
        setGroupTutor({ id: studentDoc.id, ...studentDoc.data() });
      }
    } catch (error) {
      console.error("Error fetching group admin:", error);
    }
  };

  useEffect(() => {
    if (group) {
      fetchGroupTutor();
      console.log("tutor:", groupTutor);
    }
  }, [group]);

  //---------------------------------------------------------------------------------------------------//

  const fetchData = async () => {
    if (!group) return;

    try {
      // Fetch classes
      if (group.classIds && group.classIds.length > 0) {
        const classesData = await Promise.all(
          group.classIds.map(async (classId) => {
            const classDoc = await getDoc(doc(db, "classes", classId));
            return classDoc.exists()
              ? { id: classDoc.id, ...classDoc.data() }
              : null;
          })
        );
        setClasses(classesData.filter(Boolean));
        console.log("class", classes);
      }

      // Debug group members
      console.log("Group data:", group);
      console.log("Member IDs:", group.memberIds);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [group]);

  //--------------------------------------------------adding a class--------------------------------------------//

  const renderClasses = () => {
    if (classes.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">No classes available</p>
        </div>
      );
    }

    // Get enrolled classes from localStorage
    const user = JSON.parse(sessionStorage.getItem("user"));
    const enrolledClasses = user?.enrolledClasses || [];

    return (
      <div className="flex flex-wrap items-center gap-4 p-4">
        {classes.map((classItem) => {
          const isEnrolled = enrolledClasses.includes(classItem.classId);

          return isEnrolled ? (
            <ClassCard
              key={classItem.classId}
              classId={classItem.classId}
              className={classItem.className}
              language={classItem.language}
              languageLevel={classItem.languageLevel}
              classDateTime={classItem.classDateTime}
              classDuration={classItem.classDuration}
              adminId={classItem.adminId}
              adminName={classItem.adminName}
              adminImageUrl={classItem.adminImageUrl}
              classMemberIds={classItem.classMemberIds}
              availableSpots={classItem.availableSpots}
              imageUrl={classItem.imageUrl}
              classDescription={classItem.classDescription}
              classAddress={classItem.classAddress}
              groupId={classItem.groupId}
              recurrenceType={classItem.recurrenceType}
              classType={classItem.classType}
              classLocation={classItem.classLocation}
            />
          ) : (
            <ExploreClassCard
              key={classItem.classId}
              classId={classItem.classId}
              className={classItem.className}
              language={classItem.language}
              languageLevel={classItem.languageLevel}
              classDateTime={classItem.classDateTime}
              classDuration={classItem.classDuration}
              adminId={classItem.adminId}
              adminName={classItem.adminName}
              adminImageUrl={classItem.adminImageUrl}
              classMemberIds={classItem.classMemberIds}
              availableSpots={classItem.availableSpots}
              imageUrl={classItem.imageUrl}
              classDescription={classItem.classDescription}
              classAddress={classItem.classAddress}
              groupId={classItem.groupId}
              recurrenceType={classItem.recurrenceType}
              classType={classItem.classType}
              classLocation={classItem.classLocation}
            />
          );
        })}
      </div>
    );
  };
  const handleBack = () => {
    navigate(-1);
  };

  //---------------------------------joining group----------------------------//\

  const updateContextAndSession = (newGroupId) => {
    // Create updated user object with new group
    const updatedUser = {
      ...user,
      joinedGroups: [...(user.joinedGroups || []), newGroupId],
    };

    // Update context
    setUser(updatedUser);

    // Update session storage
    const storedUser = JSON.parse(sessionStorage.getItem("user") || "{}");
    const updatedStoredUser = {
      ...storedUser,
      joinedGroups: [...(storedUser.joinedGroups || []), newGroupId],
    };
    sessionStorage.setItem("user", JSON.stringify(updatedStoredUser));
  };
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinConfirm = async () => {
    try {
      setIsJoining(true);

      // Get references to the group and user documents
      const groupRef = doc(db, "groups", groupId);
      const userRef = doc(db, "students", user.uid);

      // Get the current group data to check if user is already a member
      const groupDoc = await getDoc(groupRef);
      const groupData = groupDoc.data();

      if (groupData.memberIds.includes(user.uid)) {
        console.log("User is already a member of this group");
        return;
      }

      // Update the group document to add the user's ID to memberIds
      await updateDoc(groupRef, {
        memberIds: arrayUnion(user.uid),
      });

      // Update the user document to add the group ID to joinedGroups
      await updateDoc(userRef, {
        joinedGroups: arrayUnion(groupId),
      });

      // Update context and session storage
      updateContextAndSession(groupId);

      console.log("Successfully joined group");

      navigate(`/groupDetailsUser/${groupId}`, { replace: true });
    } catch (error) {
      console.error("Error joining group:", error);
      // Handle error appropriately - show error message to user
    } finally {
      setIsJoining(false);
    }
  };

  //-----------------------------------------------------------------------//

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[100vh] ">
        <div className="p-8 bg-white rounded-lg">
          <ClipLoader color="#FFB800" size={40} />
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
            onClick={onClose}
            className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!group) {
    return null;
  }

  return (
    <>
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
                <h1 className="text-4xl font-semibold">Group Details</h1>
              </div>
            </div>

            <div className="flex flex-1 min-h-0 gap-6">
              {/* Left sidebar */}
              <div
                className={`w-1/4 p-6 rounded-3xl ${
                  group.isPremium ? "bg-[#e6fce8]" : "bg-[#ffffea]"
                }`}
              >
                {" "}
                <div className="flex flex-col items-center justify-between h-full text-center">
                  <div className="flex flex-col items-center text-center">
                    <img
                      src={group.imageUrl}
                      alt={group.groupName}
                      className="w-32 h-32 mb-4 rounded-full"
                    />
                    <h3 className="mb-2 text-2xl font-medium">
                      {group.groupName}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 text-sm bg-yellow-200 rounded-full">
                        {group.groupLearningLanguage}
                      </span>
                      <span className="px-3 py-1 text-sm bg-yellow-200 rounded-full">
                        Advanced
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <User />
                      <span className="text-sm">
                        {group.groupAdminName} (Admin)
                      </span>
                    </div>
                    <p className="mb-6 text-gray-600">
                      {group.groupDescription}
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
                              ? groupTutor.bio
                                  .split(" ")
                                  .slice(0, 12)
                                  .join(" ") + "..."
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
                  </div>
                </div>
              </div>

              {/* Main content */}
              <div className="flex flex-col flex-1 min-h-0">
                {loading ? (
                  <div className="flex items-center justify-center flex-1">
                    <ClipLoader color="#FFB800" size={40} />
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto">
                    {renderClasses()}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-row items-center justify-between mt-2">
              <button
                className="px-8 py-2 text-lg text-black border border-black rounded-full "
                onClick={handleBack}
              >
                Cancel
              </button>
              <button
                className="px-8 text-lg py-2 text-black bg-[#ffbf00] border border-black rounded-full "
                onClick={handleJoinConfirm}
              >
                {isJoining ? "Joining...." : "Yes, Join"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GroupDetailsNotJoinedUser;
