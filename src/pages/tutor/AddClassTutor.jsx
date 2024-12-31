import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ArrowLeft, Camera } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import { useLocation } from "react-router-dom";
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
import { db, storage } from "../../firebaseConfig";

const AddClassTutor = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [classPreviewImage, setClassPreviewImage] = useState(null);

  // Get type and groupId from URL parameters
  const searchParams = new URLSearchParams(location.search);
  const classType = searchParams.get("type");
  const groupId = searchParams.get("groupId");

  useEffect(() => {
    if (!classType) {
      navigate("/addClassFlow");
    } else {
      // Set the classType based on the URL parameter

      setClassData((prevData) => ({
        ...prevData,
        classType:
          classType.toLowerCase() === "group"
            ? "Group Premium"
            : "Individual Premium",
      }));
    }
  }, [classType, navigate]);

  const [isFormValid, setIsFormValid] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isAddClassModalOpen, setAddClassModalOpen] = useState(false);
  const [classImage, setClassImage] = useState(null);
  const [classData, setClassData] = useState({
    className: "",
    classDescription: "",
    language: "English",
    languageLevel: "Beginner",
    availableSpots: 1,
    classDuration: 60,
    classDateTime: new Date(),
    recurrenceType: "One-time",
    classLocation: "Virtual",
    recurrenceTypes: ["One-time"],
    classAddress: "",
    imageUrl: "",
    selectedRecurrenceType: "",
    recurringSlots: [],
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

  const handleClassTypeSelect = (type) => {
    const isIndividualPremium = classData.classType === "Individual Premium";
    let newTypes;

    if (isIndividualPremium) {
      // Toggle selection for Individual Premium
      newTypes = classData.recurrenceTypes.includes(type)
        ? classData.recurrenceTypes.filter((t) => t !== type)
        : [...classData.recurrenceTypes, type];
    } else {
      // Single selection for Group Premium
      newTypes = [type];
    }

    setClassData((prev) => ({
      ...prev,
      recurrenceTypes: newTypes,
    }));
  };

  const handleSaveClass = async () => {
    if (!isFormValid || isCreating) return;
    setIsCreating(true);

    try {
      let imageUrl = "";
      const classRef = await addDoc(collection(db, "classes"), {});
      const classId = classRef.id;

      if (classImage) {
        const imageRef = ref(
          storage,
          `classes/${classId}/image_${Date.now()}_${classImage.name}`
        );
        await uploadBytes(imageRef, classImage);
        imageUrl = await getDownloadURL(imageRef);
      }

      const classAddress =
        classData.classLocation === "Virtual" ? "" : classData.classAddress;

      const newClass = {
        classId: classId,
        adminId: user.uid,
        adminName: user.name || "",
        adminImageUrl: user.photoUrl || "",
        groupId: groupId || null, // Handle case when groupId is not available
        className: classData.className,
        classDescription: classData.classDescription,
        language: classData.language,
        languageLevel: classData.languageLevel,
        availableSpots: classData.availableSpots,
        classDuration: classData.classDuration,
        classDateTime: serverTimestamp(),
        recurrenceTypes: classData.recurrenceTypes,
        selectedRecurrenceType: "",
        recurringSlots: [],
        classLocation: classData.classLocation,
        classType: classData.classType,
        classAddress: classAddress,
        imageUrl,
        classMemberIds: [],
        createdAt: serverTimestamp(),
      };

      // Update the class document
      await updateDoc(doc(db, "classes", classId), newClass);

      // Update tutor document with new class ID in tutorOfClasses array
      const userRef = doc(db, "tutors", user.uid);
      const updatedTutorOfClasses = [...(user.tutorOfClasses || []), classId];
      await updateDoc(userRef, {
        tutorOfClasses: updatedTutorOfClasses,
      });

      // If groupId exists, update the group document with the new class ID
      if (groupId) {
        const groupRef = doc(db, "groups", groupId);
        const groupDoc = await getDoc(groupRef);

        if (groupDoc.exists()) {
          const currentClassIds = groupDoc.data().classIds || [];
          await updateDoc(groupRef, {
            classIds: [...currentClassIds, classId],
            updatedAt: serverTimestamp(),
          });
        }
      }

      // Update user context and session storage
      const updatedUser = {
        ...user,
        tutorOfClasses: updatedTutorOfClasses,
      };
      setUser(updatedUser);
      sessionStorage.setItem("user", JSON.stringify(updatedUser));

      // Reset form and close modal
      setAddClassModalOpen(false);
      setClassImage(null);
      setClassPreviewImage(null);
      setClassData({
        className: "",
        classDescription: "",
        language: "English",
        languageLevel: "Beginner",
        availableSpots: 1,
        classDuration: 60,
        classDateTime: new Date(),
        recurrenceTypes: ["One-time"],
        classLocation: "Virtual",
        classType: "Group Premium",
        classAddress: "",
        imageUrl: "",
        selectedRecurrenceType: "",
        recurringSlots: [],
      });

      // Navigate to classes tutor page
      navigate("/classesTutor");
    } catch (error) {
      console.error("Error adding class:", error);
    } finally {
      setIsCreating(false);
    }
  };
  useEffect(() => {
    const validateForm = () => {
      const requiredFields = {
        className: !!classData.className.trim(),
        classDescription: !!classData.classDescription.trim(),
        language: !!classData.language,
        languageLevel: !!classData.languageLevel,
        availableSpots:
          !!classData.availableSpots && classData.availableSpots > 0,
        classDuration: !!classData.classDuration,
        classDateTime: !!classData.classDateTime,
        recurrenceType: !!classData.recurrenceType,
        classLocation: !!classData.classLocation,
        classType: !!classData.classType,
        classAddress:
          classData.classLocation === "Physical"
            ? !!classData.classAddress.trim()
            : true,
        classImage: !!classImage, // Check if the class image is present
      };

      return Object.values(requiredFields).every((field) => field === true);
    };

    setIsFormValid(validateForm());
  }, [classData, classImage]);

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar user={user} />

      <div className="flex-1 p-8 bg-white border-2 border-[#e7e7e7] rounded-3xl ml-[17rem] m-2">
        <div className="flex items-center justify-between pb-4 mb-6 border-b">
          <div className="flex items-center gap-4">
            <button
              className="p-3 bg-gray-100 rounded-full"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft size="30" />
            </button>
            <h1 className="text-4xl font-semibold">Create New Class</h1>
          </div>
        </div>

        <div className="max-w-6xl">
          <div className="space-y-6">
            {/* Image Upload */}
            <div className="flex justify-start mb-8">
              <div
                className="relative flex items-center justify-center border border-gray-300 border-dashed rounded-full cursor-pointer w-28 h-28 bg-gray-50"
                onClick={() => document.getElementById("classImage").click()}
              >
                {classPreviewImage ? (
                  <img
                    src={classPreviewImage}
                    alt="Preview"
                    className="object-cover w-full h-full rounded-full"
                  />
                ) : (
                  <Camera size={24} className="text-gray-400" />
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

            <div className="flex flex-row items-start justify-between space-x-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Class name
                </label>
                <input
                  type="text"
                  placeholder="Class name"
                  value={classData.className}
                  onChange={(e) =>
                    handleClassDataChange("className", e.target.value)
                  }
                  className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-gray-300"
                />
              </div>

              {/* Language */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Class Language
                </label>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => handleClassDataChange("language", "English")}
                    className={`px-4 py-2 rounded-full text-sm ${
                      classData.language === "English"
                        ? "bg-yellow-400 border border-yellow-500"
                        : "border border-gray-200"
                    }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => handleClassDataChange("language", "Spanish")}
                    className={`px-4 py-2 rounded-full text-sm ${
                      classData.language === "Spanish"
                        ? "bg-yellow-400 border border-yellow-500"
                        : "border border-gray-200"
                    }`}
                  >
                    Spanish
                  </button>
                  <button
                    onClick={() =>
                      handleClassDataChange(
                        "language",
                        "English-Spanish Exchange"
                      )
                    }
                    className={`px-4 py-2 rounded-full text-sm ${
                      classData.language === "English-Spanish Exchange"
                        ? "bg-yellow-400 border border-yellow-500"
                        : "border border-gray-200"
                    }`}
                  >
                    English-Spanish Exchange
                  </button>
                </div>
              </div>
            </div>
            {/* Description */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                Class Description
              </label>
              <textarea
                placeholder="Enter short description of class (max 200 letter)"
                value={classData.classDescription}
                onChange={(e) =>
                  handleClassDataChange("classDescription", e.target.value)
                }
                maxLength={200}
                rows={3}
                className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-gray-300"
              />
            </div>
            <div className="flex flex-row items-start justify-between space-x-4">
              {/* Class Level */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Class Level
                </label>
                <div className="flex gap-2 mt-1">
                  {["Beginner", "Intermediate", "Advanced"].map((level) => (
                    <button
                      key={level}
                      onClick={() =>
                        handleClassDataChange("languageLevel", level)
                      }
                      className={`px-4 py-2 rounded-full text-sm ${
                        classData.languageLevel === level
                          ? "bg-yellow-400 border border-yellow-500"
                          : "border border-gray-200"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Class Type */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Class Type
                </label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {["One-time", "Daily", "Weekly", "Monthly"].map((type) => (
                    <button
                      key={type}
                      onClick={() => handleClassTypeSelect(type)}
                      className={`px-4 py-2 rounded-full text-sm ${
                        classData.recurrenceTypes.includes(type)
                          ? "bg-yellow-400 border border-yellow-500"
                          : "border border-gray-200"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-row items-start justify-between space-x-4">
              {/* Class Location */}
              <div className="flex flex-row items-center space-x-10">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Class Location
                  </label>
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() =>
                        handleClassDataChange("classLocation", "Physical")
                      }
                      className={`px-4 py-2 rounded-full text-sm ${
                        classData.classLocation === "Physical"
                          ? "bg-yellow-400 border border-yellow-500"
                          : "border border-gray-200"
                      }`}
                    >
                      Physical
                    </button>
                    <button
                      onClick={() =>
                        handleClassDataChange("classLocation", "Virtual")
                      }
                      className={`px-4 py-2 rounded-full text-sm ${
                        classData.classLocation === "Virtual"
                          ? "bg-yellow-400 border border-yellow-500"
                          : "border border-gray-200"
                      }`}
                    >
                      Virtual
                    </button>
                  </div>
                </div>
                {/* Class Address (shown only when Physical is selected) */}
                {classData.classLocation === "Physical" && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Class Address
                    </label>
                    <input
                      type="text"
                      placeholder="Enter physical class address"
                      value={classData.classAddress}
                      onChange={(e) =>
                        handleClassDataChange("classAddress", e.target.value)
                      }
                      className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-gray-300"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-row items-start justify-between space-x-4">
              {/* Available Slots */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Available Slots
                </label>
                <input
                  type="number"
                  placeholder="Enter slots number"
                  value={classData.availableSpots}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (
                      classData.classType === "Individual Premium" &&
                      value > 1
                    ) {
                      handleClassDataChange("availableSpots", 1);
                    } else {
                      handleClassDataChange("availableSpots", value);
                    }
                  }}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-gray-300"
                />
              </div>

              {/* Class Duration */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Class Duration
                </label>
                <div className="flex gap-2 mt-1">
                  {[30, 60, 90, 120].map((duration) => (
                    <button
                      key={duration}
                      onClick={() =>
                        handleClassDataChange("classDuration", duration)
                      }
                      className={`px-4 py-2 rounded-full text-sm ${
                        classData.classDuration === duration
                          ? "bg-yellow-400 border border-yellow-500"
                          : "border border-gray-200"
                      }`}
                    >
                      {duration} min
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Class Date
                </label>
                <input
                  type="date"
                  value={classData.classDateTime}
                  onChange={(e) =>
                    handleClassDataChange("classDateTime", e.target.value)
                  }
                  className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-gray-300"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Class Starting Time
                </label>
                <input
                  type="time"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-gray-300"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-between pt-4">
          <button
            onClick={() => setAddClassModalOpen(false)}
            className="px-8 py-3 font-medium border border-gray-200 rounded-full text-md"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveClass}
            disabled={!isFormValid || isCreating}
            className={`px-8 py-3 rounded-full text-md font-medium min-w-[120px] flex items-center justify-center ${
              isFormValid && !isCreating
                ? "bg-[#a6fab6] border border-[#042f0c] cursor-pointer hover:bg-[#95e1a4]"
                : "bg-gray-200 border border-gray-300 cursor-not-allowed"
            }`}
          >
            {isCreating ? "Creating..." : "Create Class"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddClassTutor;
