import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ArrowLeft, Camera } from "lucide-react";
import Sidebar from "../../components/Sidebar";

const AddClassTutor = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [classPreviewImage, setClassPreviewImage] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    className: "",
    classLanguage: "English",
    classDescription: "",
    isRecurring: false,
    recurringFrequency: "Daily",
    classDate: "",
    classDuration: "30 min",
    classStartTime: "",
    timeZone: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleClassImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setClassPreviewImage(URL.createObjectURL(file));
    }
  };

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

        <div className="max-w-5xl">
          <div className="space-y-6">
            {/* Image Upload */}
            <div>
              <label className="block mb-2 text-sm font-medium">
                Class Image
              </label>
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
            <div className="flex flex-row items-center justify-between space-x-8">
              <div className="w-full">
                <label className="block mb-2 text-sm font-medium">
                  Class Name
                </label>
                <input
                  type="text"
                  name="className"
                  value={formData.className}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg"
                  placeholder="Class name"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">
                  Class Language
                </label>
                <div className="flex gap-2">
                  {["English", "Spanish"].map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          classLanguage: lang,
                        }))
                      }
                      className={`flex-1 py-2 px-4 rounded-full ${
                        formData.classLanguage === lang
                          ? "bg-yellow-400 border border-yellow-500"
                          : "border border-gray-200"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium">
                Class Description
              </label>
              <textarea
                name="classDescription"
                value={formData.classDescription}
                onChange={handleInputChange}
                className="w-full p-3 border rounded-lg"
                placeholder="Enter short description of class (max 200 letters)"
                maxLength={200}
                rows={4}
              />
            </div>
            <div className="flex flex-row items-center justify-between space-x-8">
              <div>
                <label className="block mb-2 text-sm font-medium">
                  Recurring Class
                </label>
                <div className="flex gap-2">
                  {["No", "Yes"].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          isRecurring: option === "Yes",
                        }))
                      }
                      className={`flex-1 py-2 px-4 rounded-full ${
                        (option === "Yes" ? true : false) ===
                        formData.isRecurring
                          ? "bg-yellow-400 border border-yellow-500"
                          : "border border-gray-200"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">
                  Recurring Frequency
                </label>
                <div className="flex flex-wrap gap-2">
                  {["Daily", "Daily (Weekdays)", "Weekly", "Monthly"].map(
                    (freq) => (
                      <button
                        key={freq}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            recurringFrequency: freq,
                          }))
                        }
                        className={`py-2 px-4 rounded-full ${
                          formData.recurringFrequency === freq
                            ? "bg-yellow-400 border border-yellow-500"
                            : "border border-gray-200"
                        }`}
                      >
                        {freq}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium">
                  Class Date
                </label>
                <input
                  type="date"
                  name="classDate"
                  value={formData.classDate}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">
                  Class Duration
                </label>
                <div className="flex gap-2">
                  {["30 min", "60 min", "90 min", "120 min"].map((duration) => (
                    <button
                      key={duration}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          classDuration: duration,
                        }))
                      }
                      className={`py-2 px-4 rounded-full ${
                        formData.classDuration === duration
                          ? "bg-yellow-400 border border-yellow-500"
                          : "border border-gray-200"
                      }`}
                    >
                      {duration}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium">
                  Class Starting Time
                </label>
                <input
                  type="time"
                  name="classStartTime"
                  value={formData.classStartTime}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">
                  Time Zone
                </label>
                <select
                  name="timeZone"
                  value={formData.timeZone}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="">Select time zone</option>
                  {/* Add time zone options here */}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-12">
          <button
            onClick={() => navigate(-1)}
            className="px-8 py-3 text-[#042f0c] border border-[#5d5d5d] rounded-full"
          >
            Cancel
          </button>
          <button
            disabled={loading}
            className="px-8 py-3 text-[#042f0c] bg-[#14b82c] border border-[#5d5d5d] rounded-full disabled:bg-[#b9f9c2] disabled:text-[#b0b0b0] disabled:border-[#b0b0b0]"
          >
            Create a Class
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddClassTutor;
