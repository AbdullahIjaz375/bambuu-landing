import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ArrowLeft, Camera } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../firebaseConfig";
import { ClipLoader } from "react-spinners";
import { NumberInput } from "@mantine/core";

const EditClassPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { classId } = useParams(); // Get classId from URL params

  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [classPreviewImage, setClassPreviewImage] = useState(null);
  const [classImage, setClassImage] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);

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

  // Fetch existing class data
  useEffect(() => {
    const fetchClassData = async () => {
      try {
        const classRef = doc(db, "classes", classId);
        const classDoc = await getDoc(classRef);

        if (classDoc.exists()) {
          const data = classDoc.data();
          setClassData({
            ...data,
            classDateTime: data.classDateTime?.toDate() || new Date(),
          });

          if (data.imageUrl) {
            setClassPreviewImage(data.imageUrl);
          }
        } else {
          console.error("Class not found");
          navigate("/classesTutor");
        }
      } catch (error) {
        console.error("Error fetching class:", error);
      } finally {
        setLoading(false);
      }
    };

    if (classId) {
      fetchClassData();
    }
  }, [classId, navigate]);

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
      newTypes = classData.recurrenceTypes.includes(type)
        ? classData.recurrenceTypes.filter((t) => t !== type)
        : [...classData.recurrenceTypes, type];
    } else {
      newTypes = [type];
    }

    setClassData((prev) => ({
      ...prev,
      recurrenceTypes: newTypes,
    }));
  };

  const handleUpdateClass = async () => {
    if (!isFormValid || isUpdating) return;
    setIsUpdating(true);

    try {
      let imageUrl = classData.imageUrl;

      // Upload new image if selected
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

      const dateValue = new Date(classData.classDateTime);

      const localDate = new Date(
        dateValue.getFullYear(),
        dateValue.getMonth(),
        dateValue.getDate(),
        dateValue.getHours(),
        dateValue.getMinutes(),
      );

      const updatedClass = {
        ...classData,
        classAddress,
        classDateTime: localDate,

        imageUrl,
        // updatedAt: serverTimestamp(),
      };

      // Update the class document
      await updateDoc(doc(db, "classes", classId), updatedClass);

      navigate("/classesTutor");
    } catch (error) {
      console.error("Error updating class:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDateChange = (e) => {
    const selectedDateString = e.target.value;

    if (selectedDateString) {
      const [year, month, day] = selectedDateString.split("-"); // Split the string

      const selectedDate = new Date(year, month - 1, day); // Month is 0-indexed

      const existingDateTime = classData.classDateTime
        ? new Date(classData.classDateTime)
        : new Date();

      selectedDate.setHours(
        existingDateTime.getHours(),
        existingDateTime.getMinutes(),
        existingDateTime.getSeconds(),
        existingDateTime.getMilliseconds(),
      );

      handleClassDataChange("classDateTime", selectedDate);
    } else {
      handleClassDataChange("classDateTime", null);
    }
  };

  const handleTimeChange = (e) => {
    const [hours, minutes] = e.target.value.split(":");
    const newDate = new Date(classData.classDateTime);

    // Update the time component
    newDate.setHours(parseInt(hours), parseInt(minutes));

    handleClassDataChange("classDateTime", newDate);
  };

  useEffect(() => {
    const validateForm = () => {
      const requiredFields = {
        className: !!classData.className.trim(),
        classDescription: !!classData.classDescription.trim(),
        language: !!classData.language,
        languageLevel: !!classData.languageLevel,

        classDuration: !!classData.classDuration,
        classDateTime: !!classData.classDateTime,
        recurrenceType: !!classData.recurrenceTypes,
        classLocation: !!classData.classLocation,
        classType: !!classData.classType,
        classAddress:
          classData.classLocation === "Physical"
            ? !!classData.classAddress.trim()
            : true,
      };

      return Object.values(requiredFields).every((field) => field === true);
    };

    setIsFormValid(validateForm());
  }, [classData]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <ClipLoader color="#FFB800" size={40} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      <div className="h-full w-64 flex-shrink-0">
        <Sidebar user={user} />
      </div>
      <div className="h-full min-w-[calc(100%-16rem)] flex-1 overflow-x-auto">
        <div className="flex h-full flex-col">
          <div className="m-2 flex-1 rounded-3xl border-2 border-[#e7e7e7] bg-white p-8">
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
                  <h1 className="text-4xl font-semibold">Edit Class</h1>
                </div>
              </div>
            </div>{" "}
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

                  {/* Class Name and Language */}
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

                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Class Language
                      </label>
                      <div className="mt-1 flex gap-2">
                        {["English", "Spanish", "English-Spanish Exchange"].map(
                          (lang) => (
                            <button
                              key={lang}
                              onClick={() =>
                                handleClassDataChange("language", lang)
                              }
                              className={`rounded-full px-4 py-2 text-sm ${
                                classData.language === lang
                                  ? "border border-yellow-500 bg-yellow-400"
                                  : "border border-gray-200"
                              }`}
                            >
                              {lang}
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Class Description
                    </label>{" "}
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
                      className="w-full rounded-3xl border border-gray-300 p-2 focus:border-[#14B82C] focus:outline-none focus:ring-0"
                    />
                    <div className="mt-1 text-right text-xs text-gray-500">
                      {classData.classDescription.length}/400 characters
                    </div>
                  </div>

                  {/* Class Level and Recurrence Type */}
                  <div className="flex flex-row items-start justify-between space-x-4">
                    {classData.classType !== "Individual Premium" ? (
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

                  {/* Location */}
                  <div className="flex flex-row items-start justify-between space-x-4">
                    <div className="flex flex-row items-center space-x-10">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Class Location
                        </label>
                        <div className="mt-1 flex gap-2">
                          {["Physical", "Virtual"].map((location) => (
                            <button
                              key={location}
                              onClick={() =>
                                handleClassDataChange("classLocation", location)
                              }
                              className={`rounded-full px-4 py-2 text-sm ${
                                classData.classLocation === location
                                  ? "border border-yellow-500 bg-yellow-400"
                                  : "border border-gray-200"
                              }`}
                            >
                              {location}
                            </button>
                          ))}
                        </div>
                      </div>
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

                  {/* Available Spots and Duration */}
                  <div className="flex flex-row items-start justify-between space-x-4">
                    {classData.classType !== "Individual Premium" ? (
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
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Class Date
                      </label>
                      <input
                        type="date"
                        value={
                          classData.classDateTime
                            ? new Date(
                                classData.classDateTime,
                              ).toLocaleDateString("en-CA") // Use toLocaleDateString
                            : ""
                        }
                        onChange={handleDateChange}
                        className="w-full rounded-3xl border border-gray-300 p-2 focus:border-[#14B82C] focus:outline-none focus:ring-0"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Class Starting Time
                      </label>
                      <input
                        type="time"
                        value={
                          classData.classDateTime
                            ? classData.classDateTime.toTimeString().slice(0, 5)
                            : ""
                        }
                        onChange={handleTimeChange}
                        className="w-full rounded-3xl border border-gray-300 p-2 focus:border-[#14B82C] focus:outline-none focus:ring-0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex justify-between pt-8">
                <button
                  onClick={() => navigate("/classesTutor")}
                  className="text-md rounded-full border border-gray-200 px-8 py-3 font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateClass}
                  disabled={!isFormValid || isUpdating}
                  className={`text-md flex min-w-[120px] items-center justify-center rounded-full px-8 py-3 font-medium ${
                    isFormValid && !isUpdating
                      ? "cursor-pointer border border-[#042f0c] bg-[#a6fab6] hover:bg-[#95e1a4]"
                      : "cursor-not-allowed border border-gray-300 bg-gray-200"
                  }`}
                >
                  {isUpdating ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </div>{" "}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditClassPage;
