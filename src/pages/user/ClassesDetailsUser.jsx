import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
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
import { ClipLoader } from "react-spinners";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useAuth } from "../../context/AuthContext";
import Modal from "react-modal";
Modal.setAppElement("#root");

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
  const { user } = useAuth();
  const { classId } = useParams();
  const [classDetails, setClassDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [groupImage, setGroupImage] = useState(null);

  useEffect(() => {
    const fetchClassDetails = async () => {
      const classRef = doc(db, "classes", classId);
      const classDoc = await getDoc(classRef);

      if (classDoc.exists()) {
        const classData = classDoc.data();
        setClassDetails(classData);

        // Fetch group photoUrl using classGroupId
        if (classData.classGroupId) {
          const groupRef = doc(db, "groups", classData.classGroupId);
          const groupDoc = await getDoc(groupRef);

          if (groupDoc.exists()) {
            const groupData = groupDoc.data();
            setGroupImage(groupData?.imageUrl); // Set group image URL with null check
          }
        }
      } else {
        console.error("Class not found");
      }
      setLoading(false);
    };

    fetchClassDetails();
  }, [classId]);

  const handleSaveChanges = async () => {
    if (classDetails) {
      const classRef = doc(db, "classes", classId);
      await updateDoc(classRef, {
        ...classDetails, // Save all fields
      });
      setIsEditModalOpen(false); // Close the modal after saving
    }
  };

  return (
    <>
      <Navbar user={user} />

      {loading ? (
        <div className="flex min-h-[50vh] w-full items-center justify-center">
          <ClipLoader color="#14B82C" size={50} />
        </div>
      ) : (
        <div className="mx-auto mt-10 max-w-4xl rounded-lg bg-white p-8 shadow-xl">
          {groupImage && (
            <img
              src={groupImage}
              alt={`${classDetails?.className} Group`}
              className="mb-8 h-80 w-full rounded-lg object-cover shadow-lg"
            />
          )}

          <h2 className="mb-6 text-center text-4xl font-extrabold text-gray-900">
            {classDetails?.className}
          </h2>
          <p className="mb-8 text-center text-lg text-gray-700">
            {classDetails?.classDescription}
          </p>

          <div className="grid grid-cols-1 gap-6 text-gray-800 md:grid-cols-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Available Spots:</span>
              <span>{classDetails?.availableSpots}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold">Level:</span>
              <span>{classDetails?.classLevel}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold">Language:</span>
              <span>{classDetails?.classLanguageType}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold">Type:</span>
              <span>{classDetails?.classType}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold">Recurring:</span>
              <span>{classDetails?.isRecurring ? "Yes" : "No"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold">Recurrence Days:</span>
              <span>{classDetails?.recurrenceDays?.join(", ") || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold">Date:</span>
              <span>
                {classDetails?.classDate?.toDate()?.toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold">Time:</span>
              <span>{classDetails?.classTime}</span>
            </div>
            {classDetails?.classType === "online" && (
              <div className="flex items-center justify-between">
                <span className="font-semibold">Online Link:</span>
                <a
                  href={classDetails?.onlineLink}
                  className="text-blue-500 underline"
                >
                  {classDetails?.onlineLink}
                </a>
              </div>
            )}
            {classDetails?.classType === "physical" && (
              <div className="flex items-center justify-between">
                <span className="font-semibold">Address:</span>
                <span>{classDetails?.physicalAddress}</span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-center">
            <Button
              onClick={() => setIsEditModalOpen(true)}
              className="mt-10 text-lg font-semibold"
              size="lg"
            >
              Edit
            </Button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onRequestClose={() => setIsEditModalOpen(false)}
        contentLabel="Edit Class Details"
        className="mx-auto w-full max-w-3xl rounded-lg bg-white p-8 shadow-xl outline-none transition-all"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      >
        <h2 className="mb-6 text-2xl font-semibold text-gray-800">
          Edit Class Details
        </h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <TextInput
            label="Class Name"
            value={classDetails?.className || ""}
            onChange={(e) =>
              setClassDetails((prev) => ({
                ...prev,
                className: e.target.value,
              }))
            }
            required
            inputClassName="px-4 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200 focus:outline-none"
          />

          <NumberInput
            label="Available Spots"
            value={classDetails?.availableSpots || 1}
            onChange={(value) =>
              setClassDetails((prev) => ({ ...prev, availableSpots: value }))
            }
            required
            min={1}
            inputClassName="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200 focus:outline-none"
          />

          <Textarea
            label="Description"
            value={classDetails?.classDescription || ""}
            onChange={(e) =>
              setClassDetails((prev) => ({
                ...prev,
                classDescription: e.target.value,
              }))
            }
            required
            rows={3}
            inputClassName="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200 focus:outline-none resize-none"
          />

          <Select
            label="Class Level"
            value={classDetails?.classLevel || ""}
            onChange={(value) =>
              setClassDetails((prev) => ({ ...prev, classLevel: value }))
            }
            data={[
              { value: "Beginner", label: "Beginner" },
              { value: "Intermediate", label: "Intermediate" },
              { value: "Advanced", label: "Advanced" },
            ]}
            className="w-full"
          />

          <Select
            label="Class Type"
            value={classDetails?.classType || ""}
            onChange={(value) =>
              setClassDetails((prev) => ({ ...prev, classType: value }))
            }
            data={[
              { value: "online", label: "Online" },
              { value: "physical", label: "Physical" },
            ]}
            className="w-full"
          />

          {classDetails?.classType === "online" ? (
            <TextInput
              label="Online Link"
              value={classDetails?.onlineLink || ""}
              onChange={(e) =>
                setClassDetails((prev) => ({
                  ...prev,
                  onlineLink: e.target.value,
                }))
              }
              inputClassName="px-4 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200 focus:outline-none"
            />
          ) : (
            <TextInput
              label="Physical Address"
              value={classDetails?.physicalAddress || ""}
              onChange={(e) =>
                setClassDetails((prev) => ({
                  ...prev,
                  physicalAddress: e.target.value,
                }))
              }
              inputClassName="px-4 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200 focus:outline-none"
            />
          )}

          <Checkbox
            label="Recurring Class"
            checked={classDetails?.isRecurring || false}
            onChange={(e) =>
              setClassDetails((prev) => ({
                ...prev,
                isRecurring: e.target.checked,
              }))
            }
          />

          <MultiSelect
            label="Select Days"
            data={recurrenceOptions}
            value={classDetails?.recurrenceDays || []}
            onChange={(value) =>
              setClassDetails((prev) => ({ ...prev, recurrenceDays: value }))
            }
            clearable
            searchable
            disabled={!classDetails?.isRecurring}
            maxSelectedValues={classDetails?.isRecurring ? 7 : 1}
          />

          <DatePicker
            selected={classDetails?.classDate?.toDate() || new Date()}
            onChange={(date) =>
              setClassDetails((prev) => ({ ...prev, classDate: date }))
            }
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring focus:ring-blue-200"
            dateFormat="MMMM d, yyyy"
          />

          <TimePicker
            onChange={(time) =>
              setClassDetails((prev) => ({ ...prev, classTime: time }))
            }
            value={classDetails?.classTime || ""}
            format="HH:mm"
            clearIcon={null}
            clockIcon={null}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring focus:ring-blue-200"
          />
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleSaveChanges}
            className="rounded-lg bg-green-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-green-700"
          >
            Save Changes
          </Button>
        </div>
      </Modal>

      <Footer />
    </>
  );
};

export default ClassesDetailsUser;
