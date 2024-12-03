import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { db, storage } from "../../firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { ClipLoader } from "react-spinners";
import Modal from "react-modal";
import { useAuth } from "../../context/AuthContext"; // Import useAuth to access context
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
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

Modal.setAppElement("#root");

const GroupDetails = () => {
  const { user, setUser } = useAuth(); // Destructure setUser to update context

  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // Edit Modal State
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editImage, setEditImage] = useState(null);
  const [loadingSave, setLoadingSave] = useState(false);
  const [previewImage, setPreviewImage] = useState(null); // Add this line for preview

  // Add Class Modal State

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

  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        const groupRef = doc(db, "groups", groupId);
        const groupDoc = await getDoc(groupRef);

        if (groupDoc.exists()) {
          const groupData = groupDoc.data();
          setGroup(groupData);
          setEditName(groupData.groupName); // Set initial edit values
          setEditDescription(groupData.groupDescription);

          if (groupData.memberIds && groupData.memberIds.length > 0) {
            await fetchMemberDetails(groupData.memberIds);
          } else {
            setLoadingMembers(false);
          }
        } else {
          console.error("Group not found");
        }
      } catch (error) {
        console.error("Error fetching group details:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchMemberDetails = async (memberIds) => {
      try {
        const fetchedMembers = [];

        for (const memberId of memberIds) {
          const memberRef = doc(db, "users", memberId);
          const memberDoc = await getDoc(memberRef);

          if (memberDoc.exists()) {
            fetchedMembers.push({ id: memberDoc.id, ...memberDoc.data() });
          }
        }

        setMembers(fetchedMembers);
      } catch (error) {
        console.error("Error fetching members:", error);
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchGroupDetails();
  }, [groupId]);

  const handleEditButtonClick = () => {
    setEditModalOpen(true);
  };

  const handleSaveChanges = async () => {
    setLoadingSave(true);
    try {
      let imageUrl = group.imageUrl;

      // Upload new image if one was selected
      if (editImage) {
        const imageRef = ref(storage, `groups/${groupId}/${editImage.name}`);
        await uploadBytes(imageRef, editImage);
        imageUrl = await getDownloadURL(imageRef);
      }

      // Update group details in Firestore
      const groupRef = doc(db, "groups", groupId);
      await updateDoc(groupRef, {
        groupName: editName,
        groupDescription: editDescription,
        imageUrl,
      });

      // Update local state to reflect changes
      setGroup((prevGroup) => ({
        ...prevGroup,
        groupName: editName,
        groupDescription: editDescription,
        imageUrl,
      }));

      setEditModalOpen(false); // Close modal on success
    } catch (error) {
      console.error("Error updating group:", error);
    } finally {
      setLoadingSave(false);
    }
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

      const newClass = {
        ...classData,
        adminId: user.uid,
        adminName: user.name || "",
        adminImageUrl: user.photoUrl || "",
        groupId,
        imageUrl,
        classMemberIds: [user.uid],
        tutorId: "",
        tutorName: "",
        tutorImageUrl: "",
        classDateTime: serverTimestamp(),
      };

      // Add the new class document to Firestore
      const classRef = await addDoc(collection(db, "classes"), newClass);
      const classId = classRef.id;

      // Update user document with the new class ID
      const userRef = doc(db, "users", user.uid);
      const updatedEnrolledClasses = [...(user.enrolledClasses || []), classId];
      await updateDoc(userRef, { enrolledClasses: updatedEnrolledClasses });

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ClipLoader color="#14B82C" size={50} />
      </div>
    );
  }

  if (!group) {
    return <p className="text-center text-gray-500">Group not found</p>;
  }

  return (
    <>
      <Navbar user={user} />
      <div className="flex flex-col w-full px-6 py-10 bg-white sm:px-10 md:px-20 lg:px-32 xl:px-40">
        <div className="flex flex-col justify-between mb-8 sm:flex-row sm:items-center">
          <h1 className="mb-4 text-3xl font-bold text-gray-800 sm:mb-0">
            {group.groupName}
          </h1>
          <div className="flex space-x-4">
            <Button
              onClick={handleEditButtonClick}
              variant="outline"
              className="px-4 py-2 font-medium text-blue-600 border-blue-600 rounded-md hover:bg-blue-50"
            >
              Edit Group
            </Button>
            <Button
              onClick={handleAddClassButtonClick}
              variant="outline"
              className="px-4 py-2 font-medium text-green-600 border-green-600 rounded-md hover:bg-green-50"
            >
              Add Class
            </Button>
          </div>
        </div>

        <p className="max-w-4xl mb-6 text-lg leading-relaxed text-gray-700">
          {group.groupDescription}
        </p>

        <div className="mb-8">
          <img
            src={group.imageUrl}
            alt={group.groupName}
            className="object-cover w-full h-[300px] sm:h-[400px] rounded-lg shadow-md"
          />
        </div>

        <div className="flex flex-col mb-8 text-gray-600 sm:flex-row sm:space-x-8">
          <p className="text-lg">
            <span className="font-semibold">Type:</span> {group.groupType}
          </p>
          <p className="text-lg">
            <span className="font-semibold">Members:</span> {members.length}
          </p>
        </div>

        <h2 className="mb-6 text-2xl font-semibold text-gray-800">
          Group Members
        </h2>

        {loadingMembers ? (
          <div className="flex items-center justify-center">
            <ClipLoader color="#14B82C" size={30} />
          </div>
        ) : members.length > 0 ? (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {members.map((member) => (
              <li
                key={member.id}
                className="p-6 transition-colors border border-gray-200 rounded-lg shadow-sm bg-gray-50 hover:bg-gray-100"
              >
                <p className="text-xl font-semibold text-gray-800">
                  {member.name || "Unknown Member"}
                </p>
                <p className="text-gray-600">{member.email}</p>
                <p className="text-sm text-gray-500">
                  {member.country || "Country not specified"}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-500">No members found.</p>
        )}
      </div>

      {/* Edit group Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onRequestClose={() => setEditModalOpen(false)}
        contentLabel="Edit Group Details"
        className="w-full max-w-lg p-8 mx-auto transition-all bg-white rounded-lg shadow-xl outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      >
        <h2 className="mb-6 text-2xl font-semibold text-gray-800">
          Edit Group Details
        </h2>

        <TextInput
          label="Group Name"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          required
          className="mb-4"
          inputClassName="px-4 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200 focus:outline-none"
        />

        <Textarea
          label="Description"
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          required
          rows={4}
          className="mb-4"
          inputClassName="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200 focus:outline-none resize-none"
        />

        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Group Image
          </label>
          <div className="relative flex items-center justify-center w-full p-6 transition-colors border border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                setEditImage(file); // Sets the selected file
                setPreviewImage(URL.createObjectURL(file)); // Creates a preview URL
              }}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            {previewImage ? (
              <img
                src={previewImage}
                alt="Selected Group"
                className="object-cover w-full h-32 rounded-md"
              />
            ) : (
              <span className="text-gray-500">
                Click to upload an image for your group
              </span>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleSaveChanges}
            disabled={loadingSave}
            className={`px-6 py-2 font-semibold rounded-lg text-white ${
              loadingSave
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            } transition-colors`}
          >
            {loadingSave ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </Modal>

      {/* add class modal */}
      <Modal
        isOpen={isAddClassModalOpen}
        onRequestClose={() => setAddClassModalOpen(false)}
        contentLabel="Add Class"
        className="w-full max-w-4xl p-8 mx-auto bg-white rounded-lg shadow-xl outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
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

      <Footer />
    </>
  );
};

export default GroupDetails;
