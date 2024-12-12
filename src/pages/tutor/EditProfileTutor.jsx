import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../firebaseConfig";
import { ImagePlus, ArrowLeft } from "lucide-react";
import countryList from "react-select-country-list";
import ISO6391 from "iso-639-1";

import Sidebar from "../../components/Sidebar";

const LANGUAGES = ["English", "Spanish"];

const TutorEditProfile = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const countries = countryList().getData();

  const languagesList = ISO6391.getAllNames()
    .map((name, index) => ({
      code: ISO6391.getAllCodes()[index],
      name: name,
      nativeName: ISO6391.getNativeName(ISO6391.getAllCodes()[index]),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Form state
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    nativeLanguage: user?.nativeLanguage || "",
    teachingLanguage: user?.teachingLanguage || "Spanish",
    teachingLanguageProficiency:
      user?.teachingLanguageProficiency || "Intermediate",
    country: user?.country || "",
    bio: user?.bio || "",
  });
  const [image, setImage] = useState(null);
  const [selectedImage, setSelectedImage] = useState(user?.photoUrl || null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setSelectedImage(URL.createObjectURL(file));
  };

  const handleImageUpload = async (userId) => {
    if (!image) return user?.photoUrl || null;
    const storageRef = ref(storage, `users/${userId}/${image.name}`);
    await uploadBytes(storageRef, image);
    return await getDownloadURL(storageRef);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProficiencyChange = (level) => {
    setFormData((prev) => ({
      ...prev,
      proficiency: level,
    }));
  };

  const handleSaveChanges = async () => {
    setLoading(true);
    try {
      const photoUrl = await handleImageUpload(user.uid);

      const updatedUserData = {
        ...formData,
        photoUrl: photoUrl || user.photoUrl,
      };

      // Update Firestore
      const userRef = doc(db, "tutors", user.uid);
      await updateDoc(userRef, updatedUserData);

      // Update context and session storage
      const newUserData = {
        ...user,
        ...updatedUserData,
      };
      setUser(newUserData);
      sessionStorage.setItem("user", JSON.stringify(newUserData));

      navigate("/profileTutor");
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
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
            <h1 className="text-4xl font-semibold">Edit Profile</h1>
          </div>
        </div>

        <div className="max-w-2xl">
          <div className="mb-8">
            <div
              className="relative flex items-center justify-center w-24 h-24 mb-4 bg-gray-100 rounded-full cursor-pointer hover:bg-gray-200"
              onClick={() => document.getElementById("profileImage").click()}
            >
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt="Profile"
                  className="object-cover w-full h-full rounded-full"
                />
              ) : (
                <ImagePlus className="w-8 h-8 text-gray-400" />
              )}
              <input
                id="profileImage"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block mb-2 text-sm font-medium">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full p-3 border rounded-lg"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full p-3 border rounded-lg"
                disabled
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">
                Native Language
              </label>
              <select
                name="nativeLanguage"
                value={formData.nativeLanguage}
                onChange={handleInputChange}
                className="w-full p-3 text-gray-600 border rounded-lg"
              >
                <option value="">Select your native language</option>
                {languagesList.map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.name} ({language.nativeName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">
                Teaching Language
              </label>
              <select
                name="learningLanguage"
                value={formData.teachingLanguage}
                onChange={handleInputChange}
                className="w-full p-3 border rounded-lg"
              >
                <option value="">Select language you want to learn</option>
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">
                Your Proficiency in {formData.teachingLanguage}
              </label>
              <div className="flex gap-2">
                {["Normal", "Intermediate", "Advance", "Beginner"].map(
                  (level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => handleProficiencyChange(level)}
                      className={`flex-1 py-2 px-4 rounded-full ${
                        formData.teachingLanguageProficiency === level
                          ? "bg-[#e6fde9] text-black"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {level}
                    </button>
                  )
                )}
              </div>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">Country</label>
              <select
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                className="w-full p-3 border rounded-lg"
              >
                <option value="">Select your country</option>
                {countries.map((country) => (
                  <option key={country.value} value={country.value}>
                    {country.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">Bio</label>
              <textarea
                type="text"
                name="name"
                value={formData.bio}
                onChange={handleInputChange}
                className="w-full p-3 border rounded-lg"
                placeholder="Enter your name"
                rows={5}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-between mt-12">
          <button
            onClick={() => navigate("/profile")}
            className="px-8 py-3 text-[#042f0c] border border-[#5d5d5d] rounded-full"
          >
            Discard Changes
          </button>
          <button
            onClick={handleSaveChanges}
            disabled={loading}
            className="px-8 py-3 text-[#042f0c] bg-[#14b82c] border border-[#5d5d5d] rounded-full disabled:bg-[#b9f9c2] disabled:text-[#b0b0b0] disabled:border-[#b0b0b0]"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorEditProfile;
