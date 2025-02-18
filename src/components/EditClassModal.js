import React, { useState, useEffect } from "react";
import { X, Camera } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../src/firebaseConfig";
import { useTranslation } from "react-i18next";
import { Timestamp } from "firebase/firestore";

import Modal from "react-modal";
import { NumberInput } from "@mantine/core";

const getDateValue = (dateTime) => {
  if (!dateTime) return new Date();
  if (dateTime instanceof Date) return dateTime;
  if (dateTime?.toDate) return dateTime.toDate();
  return new Date(dateTime);
};

const EditClassModal = ({
  isOpen,
  onClose,
  classData: initialClassData,
  setClassData: setParentClassData,
}) => {
  const [classData, setClassData] = useState(initialClassData);
  const [classPreviewImage, setClassPreviewImage] = useState(
    initialClassData?.imageUrl
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (initialClassData) {
      setClassData({
        ...initialClassData,
        classDateTime: getDateValue(initialClassData.classDateTime),
      });
      setClassPreviewImage(initialClassData.imageUrl);
    }
  }, [initialClassData]);

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
        existingDateTime.getMilliseconds()
      );

      handleClassDataChange("classDateTime", selectedDate);
    } else {
      handleClassDataChange("classDateTime", null);
    }
  };

  const handleTimeChange = (e) => {
    const [hours, minutes] = e.target.value.split(":");
    const newDate = new Date(classData?.classDateTime || new Date());
    newDate.setHours(parseInt(hours), parseInt(minutes));
    if (!isNaN(newDate.getTime())) {
      handleClassDataChange("classDateTime", newDate);
    } else {
      console.error("Invalid time");
    }
  };

  const handleClassImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setClassPreviewImage(reader.result);
        setClassData((prev) => ({ ...prev, imageUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const getFormattedDate = (date) => {
    if (!date) return "";
    try {
      return date instanceof Date
        ? date.toLocaleDateString("en-CA").split("T")[0]
        : "";
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  // Safely format time for input value
  const getFormattedTime = (date) => {
    if (!date) return "";
    try {
      return date instanceof Date ? date.toTimeString().slice(0, 5) : "";
    } catch (error) {
      console.error("Error formatting time:", error);
      return "";
    }
  };

  const handleClassDataChange = (field, value) => {
    setClassData((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    return (
      classData.className?.trim() &&
      classData.classDescription?.trim() &&
      classData.language &&
      classData.languageLevel &&
      classData.classLocation &&
      classData.classDuration &&
      classData.classDateTime &&
      (classData.classLocation !== "Physical" || classData.classAddress?.trim())
    );
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
    setIsUpdating(true);
    try {
      const classRef = doc(db, "classes", classData.id);
      const dateValue = new Date(classData.classDateTime);
      const localDate = new Date(
        dateValue.getFullYear(),
        dateValue.getMonth(),
        dateValue.getDate(),
        dateValue.getHours(),
        dateValue.getMinutes()
      );
      await updateDoc(classRef, {
        ...classData,
        classDateTime: localDate, // Use the UTC date

        lastUpdated: new Date(),
      });

      setParentClassData({
        ...classData,
        classDateTime: Timestamp.fromDate(classData.classDateTime),
      });
      onClose();
    } catch (error) {
      console.error("Error updating class:", error);
      alert("Failed to update class details. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="max-w-[90vw] w-[1000px] max-h-[90vh] p-4 md:p-6 lg:p-8 mx-auto bg-white rounded-3xl outline-none font-urbanist overflow-y-auto scrollbar-hide"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <div className="relative">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-medium">Edit Class Details</h2>
          <button onClick={onClose} className="rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

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

        <div className="space-y-4">
          <div className="flex flex-row items-start justify-between space-x-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                {t("createClass.className")}
              </label>
              <input
                type="text"
                value={classData.className || ""}
                onChange={(e) =>
                  handleClassDataChange("className", e.target.value)
                }
                className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-gray-300"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                {t("createClass.language.label")}
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

          <div>
            <label className="text-sm font-medium text-gray-700">
              {t("createClass.description.label")}
            </label>
            <textarea
              value={classData.classDescription || ""}
              onChange={(e) =>
                handleClassDataChange("classDescription", e.target.value)
              }
              maxLength={200}
              rows={3}
              className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-gray-300"
            />
          </div>

          <div className="flex flex-row items-start justify-between space-x-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                {t("createClass.level.label")}
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
                {t("createClass.type.label")}
              </label>
              <div className="flex flex-wrap gap-2 mt-1">
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
            <div>
              <label className="text-sm font-medium text-gray-700">
                {t("createClass.location.label")}
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
                  {t("createClass.location.address")}
                </label>
                <input
                  placeholder={t("createClass.location.address.placeholder")}
                  type="text"
                  value={classData.classAddress || ""}
                  onChange={(e) =>
                    handleClassDataChange("classAddress", e.target.value)
                  }
                  className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-gray-300"
                />
              </div>
            )}
          </div>

          <div className="flex flex-row items-start justify-between space-x-4">
            {classData.classType !== "Individual Premium" && (
              <div>
                <label className="text-sm font-medium text-gray-700">
                  {t("createClass.slots.label")}
                </label>

                <NumberInput
                  placeholder={t("createClass.slots.placeholder")}
                  value={classData.availableSpots || ""}
                  min={5}
                  size="md"
                  clampBehavior="strict"
                  onChange={(value) =>
                    handleClassDataChange("availableSpots", value)
                  }
                  classNames={{
                    input:
                      "mt-1 w-full rounded-lg border font-urbanist border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-gray-300",
                  }}
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700">
                {t("createClass.duration.label")}
              </label>
              <div className="flex gap-2 mt-1">
                {[30, 60].map((duration) => (
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
                    {duration} {t("createClass.duration.minutes")}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                {t("createClass.schedule.date")}
              </label>
              <input
                type="date"
                value={getFormattedDate(classData.classDateTime)}
                onChange={handleDateChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:border-[#14B82C] focus:ring-0 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                {t("createClass.schedule.time")}
              </label>
              <input
                type="time"
                value={getFormattedTime(classData?.classDateTime)}
                onChange={handleTimeChange}
                className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-gray-300"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={onClose}
              className="px-8 py-2.5 border border-gray-200 rounded-full text-sm font-medium"
            >
              {t("createClass.buttons.cancel")}
            </button>
            <button
              onClick={handleUpdateClass}
              disabled={!isFormValid() || isUpdating}
              className={`px-8 py-2.5 rounded-full text-sm font-medium min-w-[120px] flex items-center justify-center ${
                isFormValid() && !isUpdating
                  ? "bg-[#a6fab6] border border-[#042f0c] cursor-pointer hover:bg-[#95e1a4]"
                  : "bg-gray-200 border border-gray-300 cursor-not-allowed"
              }`}
            >
              {isUpdating ? "Updating..." : "Update Class"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default EditClassModal;
