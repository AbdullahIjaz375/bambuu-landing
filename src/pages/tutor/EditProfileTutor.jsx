import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../firebaseConfig";
import { ImagePlus, ArrowLeft } from "lucide-react";

import Sidebar from "../../components/Sidebar";

const TEACHINGLANGUAGES = ["English", "Spanish"];

const LANGUAGES = [
  { code: "eng", name: "English" },
  { code: "spa", name: "Spanish" },
  { code: "fra", name: "French" },
  { code: "deu", name: "German" },
  { code: "ita", name: "Italian" },
  { code: "por", name: "Portuguese" },
  { code: "rus", name: "Russian" },
  { code: "jpn", name: "Japanese" },
  { code: "kor", name: "Korean" },
  { code: "zho", name: "Chinese" },
  { code: "ara", name: "Arabic" },
  { code: "hin", name: "Hindi" },
  { code: "ben", name: "Bengali" },
  { code: "pan", name: "Punjabi" },
  { code: "vie", name: "Vietnamese" },
];

const COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo (Congo-Brazzaville)",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czechia (Czech Republic)",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini (fmr. Swaziland)",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Holy See",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestine State",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States of America",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
];

const TutorEditProfile = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  // No need for languages state and useEffect anymore since we're using hardcoded data

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
      teachingLanguageProficiency: level,
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

        <div className="max-w-3xl">
          <div className="mb-8">
            <div
              className="relative flex items-center justify-center w-32 h-32 mb-4 bg-gray-100 rounded-full cursor-pointer hover:bg-gray-200"
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
              <label className="block mb-1 text-lg font-medium">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full p-3 text-xl border rounded-2xl"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="block mb-1 text-lg font-medium">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full p-3 text-xl border rounded-2xl"
                disabled
              />
            </div>

            <div>
              <label className="block mb-1 text-lg font-medium">
                Native Language
              </label>
              <select
                name="nativeLanguage"
                value={formData.nativeLanguage}
                onChange={handleInputChange}
                className="w-full p-3 text-xl border rounded-2xl"
              >
                <option value="">Select your native language</option>
                {LANGUAGES.map((language) => (
                  <option key={language.code} value={language.name}>
                    {language.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1 text-lg font-medium">
                Teaching Language
              </label>
              <select
                name="teachingLanguage"
                value={formData.teachingLanguage}
                onChange={handleInputChange}
                className="w-full p-3 text-xl border rounded-2xl"
              >
                <option value="">Select language you want to teach</option>
                {TEACHINGLANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 text-lg font-medium">
                Your Proficiency in {formData.teachingLanguage}
              </label>
              <div className="flex gap-2">
                {["Beginner", "Intermediate", "Advanced", "Native"].map(
                  (level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => handleProficiencyChange(level)}
                      className={`flex-1 py-2 px-4 text-xl rounded-3xl border ${
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
              <label className="block mb-1 text-lg font-medium">Country</label>
              <select
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                className="w-full p-3 text-xl border rounded-2xl"
              >
                <option value="">Select your country</option>
                {COUNTRIES.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1 text-lg font-medium">Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                className="w-full p-3 text-xl border rounded-2xl"
                placeholder="Tell us about yourself"
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
