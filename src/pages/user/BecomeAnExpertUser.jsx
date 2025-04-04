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
  const [submitStatus, setSubmitStatus] = useState({ type: "", message: "" });
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

  // Validation state
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.country) newErrors.country = "Country is required";
    if (!formData.aboutYourself.trim())
      newErrors.aboutYourself = "Please tell us about yourself";
    if (formData.aboutYourself.length > 500)
      newErrors.aboutYourself = "Bio must be less than 500 characters";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
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

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setSubmitStatus({
        type: "error",
        message: "Please fill in all required fields correctly.",
      });
      return;
    }

    setLoading(true);
    setSubmitStatus({ type: "", message: "" });

    // Construct the email body
    const emailBody = `
      Name: ${formData.name}
      Native Language: ${formData.nativeLanguage}
      Country: ${formData.country}
      About Yourself: ${formData.aboutYourself}
      Teaching Language: ${formData.teachingLanguage}
      Proficiency Level: ${formData.proficiencyLevel}
      User Email: ${user?.email || "No email provided"}
    `;

    // Construct the mailto link
    const mailtoLink = `mailto:admin@bammbuu.co?subject=Become an Expert Application&body=${encodeURIComponent(
      emailBody
    )}`;

    // Open the user's email client
    window.location.href = mailtoLink;

    setSubmitStatus({
      type: "success",
      message: "Your application has been prepared. Please send the email.",
    });

    setLoading(false);
  };

  return (
    <div className="flex h-screen bg-white">
      <div className="flex-shrink-0 w-64 h-full">
        <Sidebar user={user} />
      </div>
      <div className="flex-1 overflow-x-auto min-w-[calc(100%-16rem)] h-full">
        <div className="flex flex-col h-full">
          <div className="flex-1 p-8 bg-white border-2 border-[#e7e7e7] rounded-3xl m-2">
            {/* Fixed Header Section */}
            <div className="sticky top-0 z-10 bg-white">
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
            </div>

            {/* Status Messages */}
            {submitStatus.message && (
              <div
                className={`p-4 mb-6 rounded-lg ${
                  submitStatus.type === "success"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {submitStatus.message}
              </div>
            )}

            {/* Scrollable Content */}
            <div className="overflow-y-auto">
              <p className="mb-8 text-gray-600">
                Interested in becoming a language expert with Bammbuu? We're excited that you are interested in joining our team!
                Please fill out this form and our team will reach out to you
                after reviewing it.
              </p>

              <form className="max-w-3xl">
                <div className="space-y-6">
                  <div>
                    <label className="block mb-2 text-sm font-medium">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full p-3 border rounded-lg ${
                        errors.name ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter your name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                    )}
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
                        <option key={language.code} value={language.name}>
                          {language.name} ({language.nativeName})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className={`w-full p-3 border rounded-lg ${
                        errors.country ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <option value="">Select a country</option>
                      {countries.map((country) => (
                        <option key={country.value} value={country.value}>
                          {country.label}
                        </option>
                      ))}
                    </select>
                    {errors.country && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.country}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium">
                      Tell us about yourself{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="aboutYourself"
                      value={formData.aboutYourself}
                      onChange={handleInputChange}
                      className={`w-full p-3 border rounded-lg ${
                        errors.aboutYourself
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter details about your teaching expertise (max 500 characters)"
                      rows={4}
                    />
                    {errors.aboutYourself && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.aboutYourself}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-gray-500">
                      {formData.aboutYourself.length}/500 characters
                    </p>
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
                          className={` w-32 py-2 px-4 border border-gray-300 rounded-full ${
                            formData.teachingLanguage === lang
                              ? "bg-[#14B82C] text-[#042f0c]"
                              : "bg-gray-100 text-gray-600 border border-gray-300"
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
                          className={` w-32 py-2 px-4  rounded-full ${
                            formData.proficiencyLevel === level
                              ? "bg-[#14B82C] text-[#042f0c]"
                              : "bg-gray-100 text-gray-600 border border-gray-300"
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div className="flex justify-between mt-12">
              <button
                onClick={() => navigate(-1)}
                className="px-8 py-3 text-[#042f0c] border border-[#5d5d5d] rounded-full"
              >
                Cancel
              </button>
              <button
                disabled={
                  loading ||
                  !formData.name ||
                  !formData.nativeLanguage ||
                  !formData.aboutYourself ||
                  !formData.teachingLanguage ||
                  !formData.country
                }
                className="px-8 py-3 text-[#042f0c] bg-[#14b82c] border border-[#5d5d5d] rounded-full disabled:bg-[#b9f9c2] disabled:text-[#b0b0b0] disabled:border-[#b0b0b0]"
                onClick={handleSubmit}
              >
                {loading ? "Submitting..." : "Submit Form"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BecomeAnExpertUser;
