import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ArrowLeft } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import countryList from "react-select-country-list";
import ISO6391 from "iso-639-1";
import { useTranslation } from "react-i18next";

// Import or define your translations
const translations = {
  "languageExperts": {
    "title": "Language Experts",
    "intro": "Join our community of language experts and help others learn your native language. Share your expertise and connect with students from around the world.",
    "email": {
      "subject": "Language Expert Application"
    },
    "form": {
      "name": {
        "label": "Full Name",
        "placeholder": "Enter your full name",
        "error": "Please enter your name"
      },
      "nativeLanguage": {
        "label": "Native Language"
      },
      "country": {
        "label": "Country",
        "placeholder": "Select your country",
        "error": "Please select your country"
      },
      "aboutYourself": {
        "label": "About Yourself",
        "placeholder": "Tell us about yourself, your teaching experience, and why you want to become a language expert...",
        "error": "Please tell us about yourself",
        "errorLength": "Bio should be less than 500 characters",
        "charCount": "{{count}}/500 characters"
      },
      "teachingLanguage": {
        "label": "Language You Want to Teach"
      },
      "proficiencyLevel": {
        "label": "Proficiency Level You Can Teach",
        "levels": {
          "beginner": "Beginner",
          "intermediate": "Intermediate",
          "advanced": "Advanced"
        }
      }
    },
    "buttons": {
      "cancel": "Cancel",
      "submit": "Submit Application",
      "submitting": "Submitting..."
    },
    "status": {
      "success": "Your application has been submitted successfully. We'll review it and get back to you soon.",
      "formError": "Please fix the errors in the form before submitting."
    }
  }
};

const BecomeAnExpertUser = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ type: "", message: "" });
  const countries = countryList().getData();

  // Initialize translations if needed
  useEffect(() => {
    // This is a fallback if the translation system isn't properly initialized
    if (!i18n.exists('languageExperts.title')) {
      i18n.addResourceBundle('en', 'translation', translations, true, true);
    }
  }, [i18n]);

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
    if (!formData.name.trim())
      newErrors.name = t("languageExperts.form.name.error", "Please enter your name");
    if (!formData.country)
      newErrors.country = t("languageExperts.form.country.error", "Please select your country");
    if (!formData.aboutYourself.trim())
      newErrors.aboutYourself = t("languageExperts.form.aboutYourself.error", "Please tell us about yourself");
    if (formData.aboutYourself.length > 500)
      newErrors.aboutYourself = t(
        "languageExperts.form.aboutYourself.errorLength",
        "Bio should be less than 500 characters"
      );

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
        message: t("languageExperts.status.formError", "Please fix the errors in the form before submitting.")
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
    const mailtoLink = `mailto:admin@bammbuu.co?subject=${encodeURIComponent(
      t("languageExperts.email.subject", "Language Expert Application")
    )}&body=${encodeURIComponent(emailBody)}`;

    // Open the user's email client
    window.location.href = mailtoLink;

    setSubmitStatus({
      type: "success",
      message: t("languageExperts.status.success", "Your application has been submitted successfully. We'll review it and get back to you soon.")
    });

    setLoading(false);
  };

  // Function to get translation with fallback
  const getTranslation = (key, fallback) => {
    const result = t(key);
    // If result is the same as the key, it means translation is missing
    return result === key ? fallback : result;
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
                  <h1 className="text-4xl font-semibold">
                    {getTranslation("languageExperts.title", "Language Experts")}
                  </h1>
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
                {getTranslation("languageExperts.intro", "Join our community of language experts and help others learn your native language. Share your expertise and connect with students from around the world.")}
              </p>

              <form className="max-w-3xl">
                <div className="space-y-6">
                  <div>
                    <label className="block mb-2 text-sm font-medium">
                      {getTranslation("languageExperts.form.name.label", "Full Name")}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full p-3 border rounded-lg ${
                        errors.name ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder={getTranslation("languageExperts.form.name.placeholder", "Enter your full name")}
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium">
                      {getTranslation("languageExperts.form.nativeLanguage.label", "Native Language")}
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
                      {getTranslation("languageExperts.form.country.label", "Country")}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className={`w-full p-3 border rounded-lg ${
                        errors.country ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <option value="">
                        {getTranslation("languageExperts.form.country.placeholder", "Select your country")}
                      </option>
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
                      {getTranslation("languageExperts.form.aboutYourself.label", "About Yourself")}{" "}
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
                      placeholder={getTranslation(
                        "languageExperts.form.aboutYourself.placeholder", 
                        "Tell us about yourself, your teaching experience, and why you want to become a language expert..."
                      )}
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
                      {getTranslation("languageExperts.form.teachingLanguage.label", "Language You Want to Teach")}
                    </label>
                    <div className="flex gap-2">
                      {["English", "Spanish"].map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => handleLanguageSelection(lang)}
                          className={`w-32 py-2 px-4 border border-gray-300 rounded-full ${
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
                      {getTranslation("languageExperts.form.proficiencyLevel.label", "Proficiency Level You Can Teach")}
                    </label>
                    <div className="flex gap-2">
                      {["Beginner", "Intermediate", "Advanced"].map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => handleProficiencyChange(level)}
                          className={`w-32 py-2 px-4 rounded-full ${
                            formData.proficiencyLevel === level
                              ? "bg-[#14B82C] text-[#042f0c]"
                              : "bg-gray-100 text-gray-600 border border-gray-300"
                          }`}
                        >
                          {getTranslation(
                            `languageExperts.form.proficiencyLevel.levels.${level.toLowerCase()}`,
                            level
                          )}
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
                {getTranslation("languageExperts.buttons.cancel", "Cancel")}
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
                {loading
                  ? getTranslation("languageExperts.buttons.submitting", "Submitting...")
                  : getTranslation("languageExperts.buttons.submit", "Submit Application")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BecomeAnExpertUser;