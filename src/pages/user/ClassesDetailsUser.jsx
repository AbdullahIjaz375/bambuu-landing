import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  Modal,
  TextInput,
  Textarea,
  NumberInput,
  Select,
  Button,
  Checkbox,
  MultiSelect,
} from "@mantine/core";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import TimePicker from "react-time-picker";
import "react-time-picker/dist/TimePicker.css";

const recurrenceOptions = [
  { value: "Mon", label: "Monday" },
  { value: "Tue", label: "Tuesday" },
  { value: "Wed", label: "Wednesday" },
  { value: "Thu", label: "Thursday" },
  { value: "Fri", label: "Friday" },
  { value: "Sat", label: "Saturday" },
  { value: "Sun", label: "Sunday" },
];

const ClassesDetailsUser = () => {
  const { classId } = useParams();
  const [classDetails, setClassDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const fetchClassDetails = async () => {
      const classRef = doc(db, "classes", classId);
      const classDoc = await getDoc(classRef);

      if (classDoc.exists()) {
        setClassDetails(classDoc.data());
      } else {
        console.error("Class not found");
      }
      setLoading(false);
    };

    fetchClassDetails();
  }, [classId]);

  const handleSaveChanges = async () => {
    const classRef = doc(db, "classes", classId);
    await updateDoc(classRef, {
      ...classDetails, // Save all fields
    });
    setIsEditModalOpen(false); // Close the modal after saving
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-3xl p-6 mx-auto bg-white rounded-lg shadow-lg">
      <h2 className="mb-4 text-3xl font-bold text-gray-800">
        {classDetails.className}
      </h2>
      <p className="mb-4 text-gray-700">{classDetails.classDescription}</p>
      <div className="space-y-2 text-gray-600">
        <p>
          <span className="font-semibold">Available Spots:</span>{" "}
          {classDetails.availableSpots}
        </p>
        <p>
          <span className="font-semibold">Level:</span>{" "}
          {classDetails.classLevel}
        </p>
        <p>
          <span className="font-semibold">Language:</span>{" "}
          {classDetails.classLanguageType}
        </p>
        <p>
          <span className="font-semibold">Type:</span> {classDetails.classType}
        </p>
        <p>
          <span className="font-semibold">Recurring:</span>{" "}
          {classDetails.isRecurring ? "Yes" : "No"}
        </p>
        <p>
          <span className="font-semibold">Recurrence Days:</span>{" "}
          {classDetails.recurrenceDays?.join(", ") || "N/A"}
        </p>
        <p>
          <span className="font-semibold">Date:</span>{" "}
          {classDetails.classDate?.toDate().toLocaleDateString()}
        </p>
        <p>
          <span className="font-semibold">Time:</span> {classDetails.classTime}
        </p>
        {classDetails.classType === "online" && (
          <p>
            <span className="font-semibold">Online Link:</span>{" "}
            {classDetails.onlineLink}
          </p>
        )}
        {classDetails.classType === "physical" && (
          <p>
            <span className="font-semibold">Address:</span>{" "}
            {classDetails.physicalAddress}
          </p>
        )}
      </div>

      <Button
        onClick={() => setIsEditModalOpen(true)}
        className="mt-6 text-white bg-blue-600"
      >
        Edit
      </Button>

      {/* Edit Modal */}
      <Modal
        opened={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Class Details"
      >
        <TextInput
          label="Class Name"
          value={classDetails.className}
          onChange={(e) =>
            setClassDetails((prev) => ({ ...prev, className: e.target.value }))
          }
          required
        />
        <Textarea
          label="Description"
          value={classDetails.classDescription}
          onChange={(e) =>
            setClassDetails((prev) => ({
              ...prev,
              classDescription: e.target.value,
            }))
          }
          required
          className="mt-4"
        />
        <NumberInput
          label="Available Spots"
          value={classDetails.availableSpots}
          onChange={(value) =>
            setClassDetails((prev) => ({ ...prev, availableSpots: value }))
          }
          required
          min={1}
          className="mt-4"
        />
        <Select
          label="Class Level"
          value={classDetails.classLevel}
          onChange={(value) =>
            setClassDetails((prev) => ({ ...prev, classLevel: value }))
          }
          data={[
            { value: "Beginner", label: "Beginner" },
            { value: "Intermediate", label: "Intermediate" },
            { value: "Advanced", label: "Advanced" },
          ]}
          className="mt-4"
        />
        <Select
          label="Class Type"
          value={classDetails.classType}
          onChange={(value) =>
            setClassDetails((prev) => ({ ...prev, classType: value }))
          }
          data={[
            { value: "online", label: "Online" },
            { value: "physical", label: "Physical" },
          ]}
          className="mt-4"
        />
        {classDetails.classType === "online" && (
          <TextInput
            label="Online Link"
            value={classDetails.onlineLink}
            onChange={(e) =>
              setClassDetails((prev) => ({
                ...prev,
                onlineLink: e.target.value,
              }))
            }
            className="mt-4"
          />
        )}
        {classDetails.classType === "physical" && (
          <TextInput
            label="Physical Address"
            value={classDetails.physicalAddress}
            onChange={(e) =>
              setClassDetails((prev) => ({
                ...prev,
                physicalAddress: e.target.value,
              }))
            }
            className="mt-4"
          />
        )}
        <Checkbox
          label="Recurring Class"
          checked={classDetails.isRecurring}
          onChange={(e) =>
            setClassDetails((prev) => ({
              ...prev,
              isRecurring: e.target.checked,
            }))
          }
          className="mt-4"
        />
        <MultiSelect
          label="Recurrence Days"
          data={recurrenceOptions}
          value={classDetails.recurrenceDays || []}
          onChange={(value) =>
            setClassDetails((prev) => ({ ...prev, recurrenceDays: value }))
          }
          disabled={!classDetails.isRecurring}
          className="mt-4"
        />
        <DatePicker
          selected={classDetails.classDate?.toDate() || new Date()}
          onChange={(date) =>
            setClassDetails((prev) => ({ ...prev, classDate: date }))
          }
          className="w-full p-2 mt-4 border rounded"
          dateFormat="MMMM d, yyyy"
        />
        <TimePicker
          onChange={(time) =>
            setClassDetails((prev) => ({ ...prev, classTime: time }))
          }
          value={classDetails.classTime}
          format="HH:mm"
          className="w-full mt-4"
        />
        <Button
          onClick={handleSaveChanges}
          className="mt-6 text-white bg-green-600"
        >
          Save Changes
        </Button>
      </Modal>
    </div>
  );
};

export default ClassesDetailsUser;
