import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../firebaseConfig";
import { ImagePlus, ArrowLeft, Camera } from "lucide-react";
import { getTutorProfile, updateTutorProfile } from "../../api/examPrepApi";

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

  // Form state
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    nativeLanguage: user?.nativeLanguage || "",
    teachingLanguage: user?.teachingLanguage || "",
    teachingLanguageProficiency:
      user?.teachingLanguageProficiency || "Intermediate",
    country: user?.country || "",
    bio: user?.bio || "",
    videoLink: user?.videoLink || "",
  });
  const [image, setImage] = useState(null);
  const [selectedImage, setSelectedImage] = useState(user?.photoUrl || null);

  useEffect(() => {
    // Fetch tutor profile from API
    const fetchProfile = async () => {
      if (!user?.uid) return;
      setLoading(true);
      try {
        const profileResponse = await getTutorProfile(
          user.uid,
          user?.accessToken,
        );
        const profile = profileResponse.tutor || {};
        setFormData({
          name: profile.name || "",
          email: profile.email || "",
          nativeLanguage: profile.nativeLanguage || "",
          teachingLanguage: profile.teachingLanguage || "",
          teachingLanguageProficiency:
            profile.teachingLanguageProficiency || "Intermediate",
          country: profile.country || "",
          bio: profile.bio || "",
          videoLink: profile.videoLink || "",
        });
        setSelectedImage(profile.photoUrl || null);
      } catch (err) {
        // fallback to user context if API fails
        setFormData({
          name: user.name || "",
          email: user.email || "",
          nativeLanguage: user.nativeLanguage || "",
          teachingLanguage: user.teachingLanguage || "",
          teachingLanguageProficiency:
            user.teachingLanguageProficiency || "Intermediate",
          country: user.country || "",
          bio: user.bio || "",
          videoLink: user.videoLink || "",
        });
        setSelectedImage(user.photoUrl || null);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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
    // Form validation
    if (!formData.teachingLanguage) {
      alert("Please select a teaching language");
      return;
    }

    setLoading(true);
    try {
      const photoUrl = await handleImageUpload(user.uid);
      const updatedUserData = {
        ...formData,
        photoUrl: photoUrl || selectedImage || user.photoUrl,
        tutorId: user.uid,
      };
      // Update profile via API
      const updatedProfile = await updateTutorProfile(
        updatedUserData,
        user?.accessToken,
      );
      // Optionally update Firestore only for the image (if needed)
      // const userRef = doc(db, "tutors", user.uid);
      // await updateDoc(userRef, { photoUrl: updatedUserData.photoUrl });
      // Update context and session storage
      const newUserData = {
        ...user,
        ...updatedProfile,
        photoUrl: updatedUserData.photoUrl, // ensure image is updated
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
                  <h1 className="text-4xl font-semibold">Edit Profile</h1>
                </div>
              </div>
            </div>
            <div className="overflow-y-auto">
              <div className="max-w-3xl">
                <div className="mb-8">
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
                    <div className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md">
                      <Camera className="h-4 w-4 text-gray-700" />
                    </div>
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
                    <label className="mb-1 block text-lg font-medium">
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
                    <label className="mb-1 block text-lg font-medium">
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
                    <label className="mb-1 block text-lg font-medium">
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
                    <label className="mb-1 block text-lg font-medium">
                      Teaching Language
                    </label>
                    <select
                      name="teachingLanguage"
                      value={formData.teachingLanguage}
                      onChange={handleInputChange}
                      className="w-full rounded-3xl border border-gray-300 p-3 focus:border-[#14B82C] focus:outline-none focus:ring-0"
                    >
                      <option value="">
                        Select language you want to teach
                      </option>
                      {TEACHINGLANGUAGES.map((lang) => (
                        <option key={lang} value={lang}>
                          {lang}
                        </option>
                      ))}
                    </select>
                    {!formData.teachingLanguage && (
                      <p className="mt-1 text-sm text-red-500">
                        Please select a teaching language
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-lg font-medium">
                      Your Proficiency in{" "}
                      {formData.teachingLanguage || "Teaching Language"}
                    </label>
                    <div className="flex gap-2">
                      {["Beginner", "Intermediate", "Advanced", "Native"].map(
                        (level) => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => handleProficiencyChange(level)}
                            className={`flex-1 rounded-3xl border px-4 py-2 text-xl ${
                              formData.teachingLanguageProficiency === level
                                ? "border-[#14B82C] bg-[#e6fde9] text-black"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {level}
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-lg font-medium">
                      Video Link
                    </label>
                    <div className="flex items-center rounded-3xl border border-[#E7E7E7] p-3">
                      <img
                        src="/svgs/video-play.svg"
                        alt="Link"
                        className="mr-2 h-6 w-6 text-[#14B82C]"
                      />
                      <input
                        type="text"
                        name="videoLink"
                        value={formData.videoLink || ""}
                        onChange={handleInputChange}
                        className="flex-1 border-none bg-transparent p-0 text-base font-normal text-black focus:outline-none"
                        placeholder="http://youtube.video..."
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-lg font-medium">
                      Country
                    </label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full rounded-2xl border p-3 text-xl"
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
                    <label className="mb-1 block text-lg font-medium">
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      className="w-full rounded-2xl border p-3 text-xl"
                      placeholder="Tell us about yourself"
                      rows={5}
                    />
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

export default TutorEditProfile;
