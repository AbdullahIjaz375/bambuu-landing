import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ArrowLeft } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import countryList from "react-select-country-list";
import ISO6391 from "iso-639-1";

const BecomeAnExpertUser = () => {
  const { user } = useAuth();
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
    name: "",
    nativeLanguage: "English",
    country: "",
    aboutYourself: "",
    teachingLanguage: "Spanish",
    proficiencyLevel: "Intermediate",
  });

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
      proficiencyLevel: level,
    }));
  };

  const handleLanguageSelection = (language) => {
    setFormData((prev) => ({
      ...prev,
      teachingLanguage: language,
    }));
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
            <h1 className="text-4xl font-semibold">Become an Expert</h1>
          </div>
        </div>

        <p className="mb-8 text-gray-600">
          We're excited that you are interested in joining our team! Please fill
          out this form and our team will reach out to you after reviewing it.
        </p>

        <div className="max-w-2xl">
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
              <label className="block mb-2 text-sm font-medium">
                Native Language
              </label>
              <select
                name="nativeLanguage"
                value={formData.nativeLanguage}
                onChange={handleInputChange}
                className="w-full p-3 text-gray-600 border rounded-lg"
              >
                {languagesList.map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.name} ({language.nativeName})
                  </option>
                ))}{" "}
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">Country</label>
              <select
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                className="w-full p-3 border rounded-lg"
              >
                {countries.map((country) => (
                  <option key={country.value} value={country.value}>
                    {country.label}
                  </option>
                ))}{" "}
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">
                Tell us about yourself
              </label>
              <textarea
                name="aboutYourself"
                value={formData.aboutYourself}
                onChange={handleInputChange}
                className="w-full p-3 border rounded-lg"
                placeholder="Enter details about your teaching expertise (max 500 letter)"
                rows={4}
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">
                Teaching Language
              </label>
              <div className="flex gap-2">
                {["English", "Spanish"].map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => handleLanguageSelection(lang)}
                    className={`flex-1 py-2 px-4 rounded-full ${
                      formData.teachingLanguage === lang
                        ? "bg-[#e6fde9] text-black"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">
                Teaching Language Proficiency Level
              </label>
              <div className="flex gap-2">
                {["Beginner", "Intermediate", "Advanced"].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => handleProficiencyChange(level)}
                    className={`flex-1 py-2 px-4 rounded-full ${
                      formData.proficiencyLevel === level
                        ? "bg-[#e6fde9] text-black"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {level}
                  </button>
                ))}
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
            Submit Form
          </button>
        </div>
      </div>
    </div>
  );
};

export default BecomeAnExpertUser;
