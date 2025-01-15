import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ArrowLeft, Camera } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../firebaseConfig";
import { ClipLoader } from "react-spinners";

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
          `classes/${classId}/image_${Date.now()}_${classImage.name}`
        );
        await uploadBytes(imageRef, classImage);
        imageUrl = await getDownloadURL(imageRef);
      }

      const classAddress =
        classData.classLocation === "Virtual" ? "" : classData.classAddress;

      const updatedClass = {
        ...classData,
        classAddress,
        imageUrl,
        updatedAt: serverTimestamp(),
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
      <div className="flex items-center justify-center h-screen">
        <ClipLoader color="#FFB800" size={40} />
      </div>
    );
  }

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
            <h1 className="text-4xl font-semibold">Edit Class</h1>
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
                  className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-gray-300"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Class Language
                </label>
                <div className="flex gap-2 mt-1">
                  {["English", "Spanish", "English-Spanish Exchange"].map(
                    (lang) => (
                      <button
                        key={lang}
                        onClick={() => handleClassDataChange("language", lang)}
                        className={`px-4 py-2 rounded-full text-sm ${
                          classData.language === lang
                            ? "bg-yellow-400 border border-yellow-500"
                            : "border border-gray-200"
                        }`}
                      >
                        {lang}
                      </button>
                    )
                  )}
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

            {/* Class Level and Recurrence Type */}
            <div className="flex flex-row items-start justify-between space-x-4">
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

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Class Recurrence Type
                </label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {["None", "One-time", "Daily", "Weekly", "Monthly"].map(
                    (type) => (
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
                    )
                  )}
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
                  <div className="flex gap-2 mt-1">
                    {["Physical", "Virtual"].map((location) => (
                      <button
                        key={location}
                        onClick={() =>
                          handleClassDataChange("classLocation", location)
                        }
                        className={`px-4 py-2 rounded-full text-sm ${
                          classData.classLocation === location
                            ? "bg-yellow-400 border border-yellow-500"
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
                        handleClassDataChange("classAddress", e.target.value)
                      }
                      className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-gray-300"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Available Spots and Duration */}
            <div className="flex flex-row items-start justify-between space-x-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Available Spots
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
                  value={classData.classTime}
                  onChange={(e) =>
                    handleClassDataChange("classTime", e.target.value)
                  }
                  className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-gray-300"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-8 mt-8">
          <button
            onClick={() => navigate("/classesTutor")}
            className="px-8 py-3 font-medium border border-gray-200 rounded-full text-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdateClass}
            disabled={!isFormValid || isUpdating}
            className={`px-8 py-3 rounded-full text-md font-medium min-w-[120px] flex items-center justify-center ${
              isFormValid && !isUpdating
                ? "bg-[#a6fab6] border border-[#042f0c] cursor-pointer hover:bg-[#95e1a4]"
                : "bg-gray-200 border border-gray-300 cursor-not-allowed"
            }`}
          >
            {isUpdating ? "Updating..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditClassPage;
