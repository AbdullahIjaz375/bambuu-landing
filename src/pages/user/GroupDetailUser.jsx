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

  // Add Class Modal State

  const [isAddClassModalOpen, setAddClassModalOpen] = useState(false);
  const [className, setClassName] = useState("");
  const [classDescription, setClassDescription] = useState("");
  const [classDate, setClassDate] = useState(new Date());
  const [classTime, setClassTime] = useState("12:00"); // Default time in HH:mm format
  const [classDuration, setClassDuration] = useState(30);
  const [classType, setClassType] = useState("online");
  const [availableSpots, setAvailableSpots] = useState(45);
  const [classLanguageType, setClassLanguageType] = useState("");
  const [classLevel, setClassLevel] = useState("Beginner");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceDays, setRecurrenceDays] = useState([]);
  const [onlineLink, setOnlineLink] = useState("");
  const [physicalAddress, setPhysicalAddress] = useState("");

  const recurrenceOptions = [
    { value: "Mon", label: "Mon" },
    { value: "Tue", label: "Tue" },
    { value: "Wed", label: "Wed" },
    { value: "Thu", label: "Thu" },
    { value: "Fri", label: "Fri" },
    { value: "Sat", label: "Sat" },
    { value: "Sun", label: "Sun" },
  ];

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
    const newClass = {
      availableSpots,
      classDate: serverTimestamp(),
      classDescription,
      classDuration,
      classGroupId: groupId,
      classLanguageType: group.groupType,
      classLevel,
      classMembers: [],
      className,
      classTime,
      classType,
      isRecurring,
      onlineLink: classType === "online" ? onlineLink : null,
      physicalAddress: classType === "physical" ? physicalAddress : null,
      recurrenceDays: isRecurring
        ? recurrenceDays
        : recurrenceDays.length > 0
        ? [recurrenceDays[0]]
        : [], // Ensure array format
    };

    try {
      // Add the new class document to Firestore and get the generated ID
      const classRef = await addDoc(collection(db, "classes"), newClass);
      const classId = classRef.id; // Get Firestore-generated ID

      // Update user document with the new class ID in enrolledClasses
      const userRef = doc(db, "users", user.uid);
      const updatedEnrolledClasses = [...(user.enrolledClasses || []), classId];
      await updateDoc(userRef, { enrolledClasses: updatedEnrolledClasses });

      // Update context and session storage
      const updatedUser = { ...user, enrolledClasses: updatedEnrolledClasses };
      setUser(updatedUser); // Update user context
      sessionStorage.setItem("user", JSON.stringify(updatedUser)); // Update session storage

      setAddClassModalOpen(false); // Close modal on success
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
    <div className="max-w-3xl p-6 mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="mb-4 text-3xl font-bold text-gray-800">
          {group.groupName}
        </h1>
        <Button onClick={handleEditButtonClick} variant="outline" color="blue">
          Edit Group
        </Button>
        <Button
          onClick={handleAddClassButtonClick}
          variant="outline"
          color="green"
        >
          Add Class
        </Button>
      </div>

      <p className="mb-2 text-gray-700">{group.groupDescription}</p>
      <img
        src={group.imageUrl}
        alt={group.groupName}
        className="object-cover w-full h-64 mb-4 rounded-lg shadow-md"
      />
      <p className="text-gray-600">Type: {group.groupType}</p>
      <p className="mb-4 text-gray-600">Members: {members.length}</p>

      <h2 className="mt-6 mb-4 text-2xl font-semibold text-gray-800">
        Group Members
      </h2>
      {loadingMembers ? (
        <ClipLoader color="#14B82C" size={30} />
      ) : members.length > 0 ? (
        <ul className="space-y-4">
          {members.map((member) => (
            <li key={member.id} className="p-4 border rounded-md shadow-sm">
              <p className="text-lg font-semibold">
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
        <p className="text-gray-500">No members found.</p>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onRequestClose={() => setEditModalOpen(false)}
        contentLabel="Edit Group Details"
        className="max-w-md p-6 mx-auto bg-white rounded-lg shadow-lg outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      >
        <h2 className="mb-4 text-lg font-semibold text-gray-700">
          Edit Group Details
        </h2>
        <TextInput
          label="Group Name"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          required
        />
        <Textarea
          label="Description"
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          required
          className="mt-4"
        />
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">
            Group Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setEditImage(e.target.files[0])}
            className="mt-2"
          />
        </div>
        <div className="flex justify-end mt-6">
          <Button onClick={handleSaveChanges} disabled={loadingSave}>
            {loadingSave ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isAddClassModalOpen}
        onRequestClose={() => setAddClassModalOpen(false)}
        contentLabel="Add Class"
        className="max-w-md p-6 mx-auto bg-white rounded-lg shadow-lg outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      >
        <h2 className="mb-4 text-lg font-semibold text-gray-700">Add Class</h2>
        <TextInput
          label="Class Name"
          value={className}
          onChange={(e) => setClassName(e.target.value)}
          required
        />
        <Textarea
          label="Class Description"
          value={classDescription}
          onChange={(e) => setClassDescription(e.target.value)}
          required
          className="mt-4"
        />
        <NumberInput
          label="Available Spots"
          value={availableSpots}
          onChange={(value) => setAvailableSpots(value)}
          required
          min={1}
          className="mt-4"
        />
        <DatePicker
          selected={classDate}
          onChange={(date) => setClassDate(date)}
          dateFormat="MMMM d, yyyy"
          className="w-full p-2 mt-4 border rounded"
        />
        <TimePicker
          onChange={setClassTime} // Directly use setClassTime as the handler
          value={classTime} // Bind to state
          format="HH:mm" // 24-hour format
          clearIcon={null} // Remove the clear icon if not needed
          clockIcon={null} // Remove the clock icon if not needed
        />
        <NumberInput
          label="Class Duration (minutes)"
          value={classDuration}
          onChange={(value) => setClassDuration(value)}
          required
          min={1}
          className="mt-4"
        />
        <Select
          label="Class Level"
          value={classLevel}
          onChange={setClassLevel}
          data={[
            { value: "Beginner", label: "Beginner" },
            { value: "Intermediate", label: "Intermediate" },
            { value: "Advanced", label: "Advanced" },
          ]}
          className="mt-4"
        />
        <Select
          label="Class Type"
          value={classType}
          onChange={setClassType}
          data={[
            { value: "online", label: "Online" },
            { value: "physical", label: "Physical" },
          ]}
          className="mt-4"
        />
        {classType === "online" ? (
          <TextInput
            label="Online Link"
            value={onlineLink}
            onChange={(e) => setOnlineLink(e.target.value)}
          />
        ) : (
          <TextInput
            label="Physical Address"
            value={physicalAddress}
            onChange={(e) => setPhysicalAddress(e.target.value)}
          />
        )}
        <Checkbox
          label="Recurring Class"
          checked={isRecurring}
          onChange={(e) => setIsRecurring(e.target.checked)}
          className="mt-4"
        />
        <MultiSelect
          label="Select Days"
          data={recurrenceOptions}
          value={recurrenceDays}
          onChange={setRecurrenceDays}
          clearable
          searchable
          className="mt-4"
          disabled={!isRecurring} // Disable if not recurring
          maxSelectedValues={isRecurring ? 7 : 1} // Allow only one day if not recurring
        />
        <div className="flex justify-end mt-6">
          <Button onClick={handleSaveClass}>Add Class</Button>
        </div>
      </Modal>
    </div>
  );
};

export default GroupDetails;
