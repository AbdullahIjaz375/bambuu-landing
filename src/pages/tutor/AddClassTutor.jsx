import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ArrowLeft, Camera } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import { ChannelType } from "../../config/stream";
import { createStreamChannel } from "../../services/streamService";
import { useLocation } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../firebaseConfig";
import { NumberInput } from "@mantine/core";

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
    availableSpots: 5,
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

  function formatToYYYYMMDD(date) {
    // If no date, return empty string
    if (!date) return "";
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

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
          `classes/${classId}/image_${Date.now()}_${classImage.name}`,
        );
        await uploadBytes(imageRef, classImage);
        imageUrl = await getDownloadURL(imageRef);
      }

      const classAddress =
        classData.classLocation === "Virtual" ? "" : classData.classAddress;

      // Parse the date and time inputs to create a combined datetime
      const dateValue = new Date(classData.classDateTime);
      const timeValue = document.querySelector('input[type="time"]').value;
      const [hours, minutes] = timeValue.split(":").map(Number);

      // Set the time components on the date object
      dateValue.setHours(hours);
      dateValue.setMinutes(minutes);

      const localDate = new Date(
        dateValue.getFullYear(),
        dateValue.getMonth(),
        dateValue.getDate(),
        dateValue.getHours(),
        dateValue.getMinutes(),
      );

      // Parse the date and time inputs to create a combined datetime
      // const dateValue = new Date(classData.classDateTime);
      // const timeValue = document.querySelector('input[type="time"]').value;
      // const [hours, minutes] = timeValue.split(":").map(Number);

      // // Create a new Date object using local date and time values
      // const localDate = new Date(
      //   dateValue.getFullYear(),
      //   dateValue.getMonth(),
      //   dateValue.getDate(),
      //   hours,
      //   minutes
      // );

      // localDate.setMinutes(
      //   localDate.getMinutes() - localDate.getTimezoneOffset()
      // );

      const newClass = {
        classId: classId,
        adminId: user.uid,
        adminName: user.name || "",
        adminImageUrl: user.photoUrl || "",
        groupId: groupId || null, // Handle case when groupId is not available
        className: classData.className,
        classDescription: classData.classDescription,
        language: classData.language,
        languageLevel:
          classType === "individual" ? "None" : classData.languageLevel,
        availableSpots:
          classType === "individual" ? 1 : classData.availableSpots,
        classDuration: classData.classDuration,
        classDateTime: localDate,
        recurrenceTypes: classData.recurrenceTypes,
        selectedRecurrenceType: "None",
        recurringSlots: [],
        classLocation: classData.classLocation,
        classType: classData.classType,
        classAddress: classAddress,
        imageUrl,
        classMemberIds: [],
        // createdAt: serverTimestamp(),
      };

      // Update the class document
      await updateDoc(doc(db, "classes", classId), newClass);

      if (classData.classType === "Individual Premium") {
        try {
          const memberRoles = [
            {
              user_id: user.uid,
              role: "Moderator",
            },
          ];

          // Format the date to display in the channel name
          const classDate = new Date(localDate);
          const formattedDate = classDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });

          // IMPORTANT: Use className directly, not with date suffix
          const channelName = classData.className; // This ensures it matches Firebase

          const channelData = {
            id: classId,
            type: ChannelType.PREMIUM_INDIVIDUAL_CLASS,
            members: [user.uid],
            name: channelName, // Use the exact className
            image: imageUrl,
            description: classData.classDescription,
            created_by_id: user.uid,
            member_roles: memberRoles,
            // Add custom data to ensure name persistence
            custom: {
              className: classData.className,
              classId: classId,
              firestoreCollection: "classes",
            },
          };

          await createStreamChannel(channelData);
        } catch (streamError) {
          console.error("Error creating stream channel:", streamError);
          // Delete the class if channel creation fails
          await deleteDoc(doc(db, "classes", classId));
          throw streamError;
        }
      }

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
            // updatedAt: serverTimestamp(),
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
    <div className="flex h-screen bg-white">
      <div className="h-full w-[272px] flex-shrink-0 p-4">
        <Sidebar user={user} />
      </div>

      <div className="min-w-[calc(100% - 272px)] h-[calc(100vh-0px)] flex-1 overflow-x-auto p-4 pl-0">
        <div className="h-[calc(100vh-32px)] overflow-y-auto rounded-3xl border border-[#e7e7e7] bg-white p-[16px]">
          <div className="flex h-full flex-col">
            {/* Fixed Header Section */}
            <div className="sticky top-0 z-10 bg-white">
              <div className="mb-6 flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-4">
                  <button
                    className="rounded-full bg-gray-100 p-3"
                    onClick={() => navigate(-1)}
                  >
                    <ArrowLeft size="30" />
                  </button>
                  <h1 className="text-4xl font-semibold">Create New Class</h1>
                </div>
              </div>
            </div>
            <div className="overflow-y-auto">
              <div className="max-w-6xl">
                <div className="space-y-6">
                  {/* Image Upload */}
                  <div className="mb-8 flex justify-start">
                    <div
                      className="relative flex h-28 w-28 cursor-pointer items-center justify-center rounded-full border border-dashed border-gray-300 bg-gray-50"
                      onClick={() =>
                        document.getElementById("classImage").click()
                      }
                    >
                      {classPreviewImage ? (
                        <img
                          src={classPreviewImage}
                          alt="Preview"
                          className="h-full w-full rounded-full object-cover"
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
                        className="w-full rounded-3xl border border-gray-300 p-2 focus:border-[#14B82C] focus:outline-none focus:ring-0"
                      />
                    </div>

                    {/* Language */}
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Class Language
                      </label>
                      <div className="mt-1 flex gap-2">
                        <button
                          onClick={() =>
                            handleClassDataChange("language", "English")
                          }
                          className={`rounded-full px-4 py-2 text-sm ${
                            classData.language === "English"
                              ? "border border-yellow-500 bg-yellow-400"
                              : "border border-gray-200"
                          }`}
                        >
                          English
                        </button>
                        <button
                          onClick={() =>
                            handleClassDataChange("language", "Spanish")
                          }
                          className={`rounded-full px-4 py-2 text-sm ${
                            classData.language === "Spanish"
                              ? "border border-yellow-500 bg-yellow-400"
                              : "border border-gray-200"
                          }`}
                        >
                          Spanish
                        </button>

                        {classType === "individual" ? (
                          <></>
                        ) : (
                          <button
                            onClick={() =>
                              handleClassDataChange(
                                "language",
                                "English-Spanish",
                              )
                            }
                            className={`rounded-full px-4 py-2 text-sm ${
                              classData.language === "English-Spanish"
                                ? "border border-yellow-500 bg-yellow-400"
                                : "border border-gray-200"
                            }`}
                          >
                            English-Spanish Exchange
                          </button>
                        )}
                      </div>
                    </div>
                  </div>{" "}
                  {/* Description */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Class Description
                    </label>
                    <textarea
                      placeholder="Enter short description of class (max 400 characters)"
                      value={classData.classDescription}
                      onChange={(e) =>
                        handleClassDataChange(
                          "classDescription",
                          e.target.value,
                        )
                      }
                      maxLength={400}
                      rows={3}
                      className="w-full resize-none rounded-3xl border border-gray-300 p-2 focus:border-[#14B82C] focus:outline-none focus:ring-0"
                    />
                    <div className="mt-1 text-right text-xs text-gray-500">
                      {classData.classDescription.length}/400 characters
                    </div>
                  </div>
                  <div className="flex flex-row items-start justify-between space-x-4">
                    {/* Class Level */}

                    {classType !== "individual" ? (
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Class Level
                        </label>
                        <div className="mt-1 flex gap-2">
                          {["Beginner", "Intermediate", "Advanced"].map(
                            (level) => (
                              <button
                                key={level}
                                onClick={() =>
                                  handleClassDataChange("languageLevel", level)
                                }
                                className={`rounded-full px-4 py-2 text-sm ${
                                  classData.languageLevel === level
                                    ? "border border-yellow-500 bg-yellow-400"
                                    : "border border-gray-200"
                                }`}
                              >
                                {level}
                              </button>
                            ),
                          )}
                        </div>
                      </div>
                    ) : (
                      <></>
                    )}

                    {/* Class Type */}
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Class Recurrence Type
                      </label>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {[
                          "None",
                          "One-time",
                          "Daily",
                          "Daily (Weekdays)",
                          "Weekly",
                          "Monthly",
                        ].map((type) => (
                          <button
                            key={type}
                            onClick={() => handleClassTypeSelect(type)}
                            className={`rounded-full px-4 py-2 text-sm ${
                              classData.recurrenceTypes.includes(type)
                                ? "border border-yellow-500 bg-yellow-400"
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
                        <div className="mt-1 flex gap-2">
                          <button
                            onClick={() =>
                              handleClassDataChange("classLocation", "Physical")
                            }
                            className={`rounded-full px-4 py-2 text-sm ${
                              classData.classLocation === "Physical"
                                ? "border border-yellow-500 bg-yellow-400"
                                : "border border-gray-200"
                            }`}
                          >
                            Physical
                          </button>
                          <button
                            onClick={() =>
                              handleClassDataChange("classLocation", "Virtual")
                            }
                            className={`rounded-full px-4 py-2 text-sm ${
                              classData.classLocation === "Virtual"
                                ? "border border-yellow-500 bg-yellow-400"
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
                              handleClassDataChange(
                                "classAddress",
                                e.target.value,
                              )
                            }
                            className="w-full rounded-3xl border border-gray-300 p-2 focus:border-[#14B82C] focus:outline-none focus:ring-0"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-row items-start justify-between space-x-4">
                    {/* Available Slots */}

                    {classType !== "individual" ? (
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Available Slots
                        </label>
                        <NumberInput
                          placeholder="Enter slots number"
                          value={classData.availableSpots || ""}
                          min={5}
                          size="md"
                          clampBehavior="strict"
                          onChange={(value) =>
                            handleClassDataChange("availableSpots", value)
                          }
                          classNames={{
                            input:
                              "mt-1 w-full rounded-3xl border font-urbanist border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-gray-300",
                          }}
                        />
                      </div>
                    ) : (
                      <></>
                    )}

                    {/* Class Duration */}
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Class Duration
                      </label>
                      <div className="mt-1 flex gap-2">
                        {[30, 60].map((duration) => (
                          <button
                            key={duration}
                            onClick={() =>
                              handleClassDataChange("classDuration", duration)
                            }
                            className={`rounded-full px-4 py-2 text-sm ${
                              classData.classDuration === duration
                                ? "border border-yellow-500 bg-yellow-400"
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
                    {/* <div>
                      <label className="text-sm font-medium text-gray-700">
                        Class Date
                      </label>
                      <input
                        type="date"
                        value={classData.classDateTime}
                        onChange={(e) =>
                          handleClassDataChange("classDateTime", e.target.value)
                        }
                        className="w-full p-2 border border-gray-300 rounded-3xl focus:border-[#14B82C] focus:ring-0 focus:outline-none"
                      />
                    </div> */}
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Class Date
                      </label>
                      <input
                        type="date"
                        value={formatToYYYYMMDD(classData.classDateTime)}
                        className="w-full rounded-3xl border border-gray-300 p-2 focus:border-[#14B82C] focus:outline-none focus:ring-0"
                        onChange={(e) => {
                          // parse the user input as local, not UTC
                          const [year, month, day] = e.target.value
                            .split("-")
                            .map(Number);
                          const newLocalDate = new Date(year, month - 1, day);
                          // preserve the time from the existing Date if you want
                          newLocalDate.setHours(
                            classData.classDateTime.getHours(),
                          );
                          newLocalDate.setMinutes(
                            classData.classDateTime.getMinutes(),
                          );

                          setClassData((prev) => ({
                            ...prev,
                            classDateTime: newLocalDate,
                          }));
                        }}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Class Starting Time
                      </label>
                      <input
                        type="time"
                        className="w-full rounded-3xl border border-gray-300 p-2 focus:border-[#14B82C] focus:outline-none focus:ring-0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setAddClassModalOpen(false)}
                  className="text-md rounded-full border border-gray-200 px-8 py-3 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveClass}
                  disabled={!isFormValid || isCreating}
                  className={`text-md flex min-w-[120px] items-center justify-center rounded-full px-8 py-3 font-medium ${
                    isFormValid && !isCreating
                      ? "cursor-pointer border border-[#042f0c] bg-[#a6fab6] hover:bg-[#95e1a4]"
                      : "cursor-not-allowed border border-gray-300 bg-gray-200"
                  }`}
                >
                  {isCreating ? "Creating..." : "Create Class"}
                </button>
              </div>
            </div>{" "}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddClassTutor;
