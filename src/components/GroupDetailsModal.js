import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  addDoc,
  updateDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { db, storage } from "../firebaseConfig";
import { ClipLoader } from "react-spinners";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Import useAuth to access context
import {
  Button,
  TextInput,
  Textarea,
  Select,
  NumberInput,
  Checkbox,
  MultiSelect,
} from "@mantine/core";
import { TimeInput } from "@mantine/dates";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "react-datepicker/dist/react-datepicker-cssmodules.css";
import TimePicker from "react-time-picker";
import "react-time-picker/dist/TimePicker.css";
import "react-clock/dist/Clock.css";
import { Radio, Group } from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import Modal from "react-modal";
Modal.setAppElement("#root");

const GroupDetailsModal = ({ group, onClose }) => {
  const { user, setUser } = useAuth(); // Destructure setUser to update context

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Classes");
  const [classes, setClasses] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchData = async () => {
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

      // Fetch members
      if (group.memberIds && group.memberIds.length > 0) {
        const membersData = await Promise.all(
          group.memberIds.map(async (memberId) => {
            const userDoc = await getDoc(doc(db, "users", memberId));
            return userDoc.exists()
              ? { id: userDoc.id, ...userDoc.data() }
              : null;
          })
        );
        setMembers(membersData.filter(Boolean));
      }

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

  const [isAddClassModalOpen, setAddClassModalOpen] = useState(false);
  const [classImage, setClassImage] = useState(null);
  const [classPreviewImage, setClassPreviewImage] = useState(null);
  const [classData, setClassData] = useState({
    className: "",
    classDescription: "",
    language: "English",
    languageLevel: "Beginner",
    availableSpots: 6,
    classDuration: 60,
    classDateTime: new Date(),
    recurrenceType: "One-time",
    physicalClass: false,
    classAddress: "",
  });

  const handleClassImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setClassImage(file);
      setClassPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleClassDataChange = (field, value) => {
    setClassData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddClassButtonClick = () => {
    setAddClassModalOpen(true);
  };

  const handleSaveClass = async () => {
    try {
      let imageUrl = "";
      if (classImage) {
        const imageRef = ref(
          storage,
          `classes/${Date.now()}_${classImage.name}`
        );
        await uploadBytes(imageRef, classImage);
        imageUrl = await getDownloadURL(imageRef);
      }

      // Add the new class document to Firestore
      const classRef = await addDoc(collection(db, "classes"), {});
      const classId = classRef.id;

      const newClass = {
        classId: classId, // Add the classId here
        ...classData,
        adminId: user.uid,
        adminName: user.name || "",
        adminImageUrl: user.photoUrl || "",
        groupId: group.id,
        imageUrl,
        classMemberIds: [user.uid],
        tutorId: "",
        tutorName: "",
        tutorImageUrl: "",
        classDateTime: serverTimestamp(),
      };

      await updateDoc(doc(db, "classes", classId), newClass);

      // Update user document with the new class ID
      const userRef = doc(db, "users", user.uid);
      const updatedEnrolledClasses = [...(user.enrolledClasses || []), classId];
      await updateDoc(userRef, { enrolledClasses: updatedEnrolledClasses });

      const groupRef = doc(db, "groups", group.id);
      const groupDoc = await getDoc(groupRef);
      const currentClassIds = groupDoc.data().classIds || [];
      await updateDoc(groupRef, {
        classIds: [...currentClassIds, classId],
      });

      // Update context and session storage
      const updatedUser = { ...user, enrolledClasses: updatedEnrolledClasses };
      setUser(updatedUser);
      sessionStorage.setItem("user", JSON.stringify(updatedUser));

      setAddClassModalOpen(false);

      // Reset form
      setClassImage(null);
      setClassPreviewImage(null);
      setClassData({
        className: "",
        classDescription: "",
        language: "English",
        languageLevel: "Beginner",
        availableSpots: 6,
        classDuration: 60,
        classDateTime: new Date(),
        recurrenceType: "One-time",
        physicalClass: false,
        classAddress: "",
      });
    } catch (error) {
      console.error("Error adding class:", error);
    }
  };

  //----------------------------------------------------------------------------------------------------------//

  // const handleSaveClass = async () => {
  //   try {
  //     let imageUrl = "";
  //     if (classImage) {
  //       const imageRef = ref(
  //         storage,
  //         `classes/${Date.now()}_${classImage.name}`
  //       );
  //       await uploadBytes(imageRef, classImage);
  //       imageUrl = await getDownloadURL(imageRef);
  //     }

  //     // Add the new class document to Firestore
  //     const classRef = await addDoc(collection(db, "classes"), {});
  //     const classId = classRef.id;

  //     const newClass = {
  //       classId: classId, // Add the classId here
  //       ...classData,
  //       adminId: user.uid,
  //       adminName: user.name || "",
  //       adminImageUrl: user.photoUrl || "",
  //       groupId: group.id,
  //       imageUrl,
  //       classMemberIds: [],
  //       tutorId: "",
  //       tutorName: "",
  //       tutorImageUrl: "",
  //       classDateTime: serverTimestamp(),
  //     };

  //     await updateDoc(doc(db, "classes", classId), newClass);

  //     // Update user document with the new class ID
  //     // const userRef = doc(db, "users", user.uid);
  //     // const updatedEnrolledClasses = [...(user.enrolledClasses || []), classId];
  //     // await updateDoc(userRef, { enrolledClasses: updatedEnrolledClasses });

  //     const groupRef = doc(db, "groups", group.id);
  //     const groupDoc = await getDoc(groupRef);
  //     const currentClassIds = groupDoc.data().classIds || [];
  //     await updateDoc(groupRef, {
  //       classIds: [...currentClassIds, classId],
  //     });

  //     // Update context and session storage
  //     // const updatedUser = { ...user, enrolledClasses: updatedEnrolledClasses };
  //     // setUser(updatedUser);
  //     // sessionStorage.setItem("user", JSON.stringify(updatedUser));

  //     setAddClassModalOpen(false);

  //     // Reset form
  //     setClassImage(null);
  //     setClassPreviewImage(null);
  //     setClassData({
  //       className: "",
  //       classDescription: "",
  //       language: "English",
  //       languageLevel: "Beginner",
  //       availableSpots: 6,
  //       classDuration: 60,
  //       classDateTime: new Date(),
  //       recurrenceType: "One-time",
  //       physicalClass: false,
  //       classAddress: "",
  //     });
  //   } catch (error) {
  //     console.error("Error adding class:", error);
  //   }
  // };

  const renderClasses = () => {
    if (classes.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">No classes available</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {classes.map((classItem) => (
          <div key={classItem.id} className="p-4 bg-white rounded-lg shadow">
            <div className="relative w-full h-48 mb-4 overflow-hidden rounded-lg">
              <img
                src={classItem.imageUrl || "/api/placeholder/400/300"}
                alt={classItem.className}
                className="object-cover w-full h-full"
              />
            </div>
            <h3 className="mb-2 text-xl font-medium">{classItem.className}</h3>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 text-sm bg-yellow-200 rounded-full">
                {group.groupLearningLanguage}
              </span>
              <span className="px-3 py-1 text-sm bg-yellow-200 rounded-full">
                Advanced
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={classItem.teacherImageUrl || "/api/placeholder/32/32"}
                  alt={classItem.teacherName}
                  className="w-6 h-6 rounded-full"
                />
                <span className="text-sm text-gray-600">
                  {classItem.teacherName} (Admin)
                </span>
              </div>
              <span className="text-sm text-gray-600">
                {classItem.maxStudents || 100}/100
              </span>
            </div>
          </div>
        ))}
      </div>
    );
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-3 p-3 bg-white rounded-lg"
          >
            <img
              src={member.profileImageUrl || "/api/placeholder/40/40"}
              alt={member.name}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <p className="font-medium">{member.name}</p>
              {member.id === group.groupAdminId && (
                <span className="text-sm text-gray-500">Admin</span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // const handleCreateClass = () => {
  //   navigate(`/createClassUser/${group.id}`, { state: { group } });
  // };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="w-full max-w-5xl p-6 mx-4 bg-white rounded-3xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Group Details</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex gap-6">
            {/* Left sidebar */}
            <div className="w-1/3 p-6 bg-[#fffef0] rounded-2xl">
              <div className="flex flex-col items-center text-center">
                <img
                  src={group.imageUrl}
                  alt={group.groupName}
                  className="w-32 h-32 mb-4 rounded-full"
                />
                <h3 className="mb-2 text-2xl font-medium">{group.groupName}</h3>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 text-sm bg-yellow-200 rounded-full">
                    {group.groupLearningLanguage}
                  </span>
                  <span className="px-3 py-1 text-sm bg-yellow-200 rounded-full">
                    Advanced
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <img
                    src={group.groupAdminImageUrl || "/api/placeholder/32/32"}
                    alt={group.groupAdminName}
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="text-sm">
                    {group.groupAdminName} (Admin)
                  </span>
                </div>
                <p className="mb-6 text-gray-600">{group.groupDescription}</p>
                <button className="w-full px-4 py-2 mb-2 text-black border border-gray-300 rounded-full">
                  View Group Chat
                </button>
                <button className="w-full px-4 py-2 text-red-500 border border-red-500 rounded-full">
                  Leave Group
                </button>
              </div>
            </div>

            {/* Main content */}
            <div className="flex-1">
              <div className="flex flex-row items-center justify-between mb-6">
                <div className="flex gap-2 ">
                  <button
                    className={`px-6 py-2 rounded-full ${
                      activeTab === "Classes"
                        ? "bg-yellow-400 text-black"
                        : "bg-white text-black"
                    }`}
                    onClick={() => setActiveTab("Classes")}
                  >
                    Classes
                  </button>
                  <button
                    className={`px-6 py-2 rounded-full ${
                      activeTab === "Members"
                        ? "bg-yellow-400 text-black"
                        : "bg-white text-black"
                    }`}
                    onClick={() => setActiveTab("Members")}
                  >
                    Members
                  </button>
                </div>
                <button
                  className="bg-[#14b82c] border border-[#19291c] text-[#19291c] px-6 py-2 rounded-full"
                  onClick={handleAddClassButtonClick}
                >
                  + Create New Class
                </button>
              </div>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <ClipLoader color="#FFB800" size={40} />
                </div>
              ) : (
                <div className="overflow-y-auto max-h-[600px]">
                  {activeTab === "Classes" ? renderClasses() : renderMembers()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isAddClassModalOpen}
        onRequestClose={() => setAddClassModalOpen(false)}
        contentLabel="Add Class"
        className="w-full max-w-4xl p-8 mx-auto bg-white rounded-lg shadow-xl outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
        style={{
          content: {
            zIndex: 60,
          },
          overlay: {
            zIndex: 60,
          },
        }}
      >
        <div className="w-full">
          <h2 className="mb-6 text-2xl font-semibold text-gray-800">
            Create New Class
          </h2>

          <div className="space-y-6">
            {/* Image Upload */}
            <div className="relative">
              <div
                className="flex items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                onClick={() => document.getElementById("classImage").click()}
              >
                {classPreviewImage ? (
                  <img
                    src={classPreviewImage}
                    alt="Preview"
                    className="object-cover w-full h-full rounded-lg"
                  />
                ) : (
                  <div className="text-center">
                    <p className="text-gray-500">Click to upload class image</p>
                    <p className="text-sm text-gray-400">
                      Recommended size: 800x600px
                    </p>
                  </div>
                )}
              </div>
              <input
                id="classImage"
                type="file"
                accept="image/*"
                onChange={handleClassImageChange}
                className="hidden"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <TextInput
                label="Class Name"
                value={classData.className}
                onChange={(e) =>
                  handleClassDataChange("className", e.target.value)
                }
                placeholder="Enter class name"
                required
              />

              <Select
                label="Language"
                value={classData.language}
                onChange={(value) => handleClassDataChange("language", value)}
                data={[
                  { value: "English", label: "English" },
                  { value: "Spanish", label: "Spanish" },
                  {
                    value: "English-Spanish Exchange",
                    label: "English-Spanish Exchange",
                  },
                ]}
                required
              />

              <Select
                label="Language Level"
                value={classData.languageLevel}
                onChange={(value) =>
                  handleClassDataChange("languageLevel", value)
                }
                data={[
                  { value: "Beginner", label: "Beginner" },
                  { value: "Intermediate", label: "Intermediate" },
                  { value: "Advanced", label: "Advanced" },
                ]}
                required
              />

              <NumberInput
                label="Available Spots"
                value={classData.availableSpots}
                onChange={(value) =>
                  handleClassDataChange("availableSpots", value)
                }
                min={1}
                max={100}
                required
              />

              <Select
                label="Class Duration"
                value={classData.classDuration.toString()}
                onChange={(value) =>
                  handleClassDataChange("classDuration", parseInt(value))
                }
                data={[
                  { value: "30", label: "30 min" },
                  { value: "60", label: "60 min" },
                  { value: "90", label: "90 min" },
                  { value: "120", label: "120 min" },
                ]}
                required
              />

              <DateTimePicker
                label="Class Date & Time"
                value={classData.classDateTime}
                onChange={(value) =>
                  handleClassDataChange("classDateTime", value)
                }
                required
              />
            </div>

            <Textarea
              label="Class Description"
              value={classData.classDescription}
              onChange={(e) =>
                handleClassDataChange("classDescription", e.target.value)
              }
              placeholder="Enter class description"
              minRows={3}
              required
            />

            <Radio.Group
              label="Class Type"
              value={classData.recurrenceType}
              onChange={(value) =>
                handleClassDataChange("recurrenceType", value)
              }
              required
            >
              <Group mt="xs">
                <Radio value="One-time" label="One-time" />
                <Radio value="Daily" label="Daily" />
                <Radio value="Weekly" label="Weekly" />
                <Radio value="Monthly" label="Monthly" />
              </Group>
            </Radio.Group>

            <Radio.Group
              label="Class Mode"
              value={classData.physicalClass.toString()}
              onChange={(value) =>
                handleClassDataChange("physicalClass", value === "true")
              }
              required
            >
              <Group mt="xs">
                <Radio value="false" label="Virtual" />
                <Radio value="true" label="Physical" />
              </Group>
            </Radio.Group>

            {classData.physicalClass && (
              <TextInput
                label="Class Address"
                value={classData.classAddress}
                onChange={(e) =>
                  handleClassDataChange("classAddress", e.target.value)
                }
                placeholder="Enter physical class address"
                required
              />
            )}

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setAddClassModalOpen(false)}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveClass}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Create Class
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default GroupDetailsModal;
