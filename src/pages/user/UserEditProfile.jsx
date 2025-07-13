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

const UserEditProfile = () => {
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
    learningLanguage: user?.learningLanguage || "Spanish",
    learningLanguageProficiency:
      user?.learningLanguageProficiency || "Intermediate",
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
      learningLanguageProficiency: level, // or 'proficiency' if you choose option 1
    }));
  };

  const handleSaveChanges = async () => {
    if (!formData.name) {
      alert("Please enter your name.");
      return;
    }
    setLoading(true);

    try {
      let photoURL = user.photoUrl;
      if (image) {
        photoURL = await handleImageUpload(user.uid);
      }

      const userRef = doc(db, "students", user.uid);
      const updatedData = {
        name: formData.name,
        nativeLanguage: formData.nativeLanguage,
        learningLanguage: formData.learningLanguage,
        learningLanguageProficiency: formData.learningLanguageProficiency,
        country: formData.country,
        bio: formData.bio,
        photoUrl: photoURL,
      };

      await updateDoc(userRef, updatedData);

      const updatedUser = { ...user, ...updatedData };
      setUser(updatedUser);
      sessionStorage.setItem("user", JSON.stringify(updatedUser));

      navigate("/profileUser");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-white">
      <div className="h-full w-[272px] flex-shrink-0 p-4">
        <Sidebar user={user} />
      </div>
      <div className="min-w-[calc(100% - 272px)] h-[calc(100vh-0px)] flex-1 overflow-x-auto p-4 pl-0">
        <div className="h-[calc(100vh-32px)] overflow-y-auto rounded-3xl border border-[#e7e7e7] bg-white p-[16px]">
          <div className="flex h-full flex-col">
            <div className="sticky top-0 z-10 bg-white">
              <div className="mb-6 flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-4">
                  <button
                    className="rounded-full bg-[#F6F6F6] p-3"
                    onClick={() => navigate(-1)}
                  >
                    <ArrowLeft size="30" className="stroke-1" />
                  </button>
                  <h1 className="text-2xl font-medium text-black">
                    Edit Profile
                  </h1>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto">
              <div className="max-w-3xl">
                <div
                  className="relative mb-4 flex h-32 w-32 cursor-pointer items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
                  onClick={() =>
                    document.getElementById("profileImage").click()
                  }
                >
                  {selectedImage ? (
                    <img
                      src={selectedImage}
                      alt="Profile"
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <ImagePlus className="h-8 w-8 text-gray-400" />
                  )}
                  <div className="absolute bottom-1 right-0 rounded-full bg-black p-1 shadow-lg">
                    <img src="/svgs/camera.svg" alt="camera" />
                  </div>
                  <input
                    id="profileImage"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="mb-1 block text-lg font-medium text-[#3D3D3D]">
                      Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full rounded-3xl border border-gray-300 p-3 focus:border-[#14B82C] focus:outline-none focus:ring-0"
                      placeholder="Enter your name"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-lg font-medium text-[#3D3D3D]">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full rounded-3xl border border-gray-300 p-3 focus:border-[#14B82C] focus:outline-none focus:ring-0"
                      disabled
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-lg font-medium text-[#3D3D3D]">
                      Native Language
                    </label>
                    <select
                      name="nativeLanguage"
                      value={formData.nativeLanguage}
                      onChange={handleInputChange}
                      className="w-full rounded-3xl border border-gray-300 p-3 focus:border-[#14B82C] focus:outline-none focus:ring-0"
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
                    <label className="mb-1 block text-lg font-medium text-[#3D3D3D]">
                      Learning Language
                    </label>
                    <select
                      name="learningLanguage"
                      value={formData.learningLanguage}
                      onChange={handleInputChange}
                      className="w-full rounded-3xl border border-gray-300 p-3 focus:border-[#14B82C] focus:outline-none focus:ring-0"
                    >
                      <option value="">
                        Select language you want to learn
                      </option>
                      {TEACHINGLANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang}>
                          {lang}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-lg font-medium text-[#3D3D3D]">
                      Your Proficiency in {formData.learningLanguage}
                    </label>
                    <div className="flex gap-2 text-xl">
                      {["Beginner", "Intermediate", "Advanced"].map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => handleProficiencyChange(level)}
                          className={`rounded-full border px-4 py-2 ${
                            formData.learningLanguageProficiency === level
                              ? "bg-[#e6fde9] text-black"
                              : "text-gray-600"
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-lg font-medium text-[#3D3D3D]">
                      Country
                    </label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full rounded-3xl border border-gray-300 p-3 focus:border-[#14B82C] focus:outline-none focus:ring-0"
                    >
                      <option value="">Select your country</option>
                      {COUNTRIES.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="mt-12 flex justify-between">
                <button
                  onClick={() => navigate(-1)}
                  className="rounded-full border border-[#5d5d5d] px-8 py-3 text-[#042f0c]"
                >
                  Discard Changes
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={loading}
                  className="rounded-full border border-[#5d5d5d] bg-[#14b82c] px-8 py-3 text-[#042f0c] disabled:border-[#b0b0b0] disabled:bg-[#b9f9c2] disabled:text-[#b0b0b0]"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserEditProfile;
