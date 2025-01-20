import React, { useState, useEffect } from "react";
import {
  getAuth,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import Modal from "react-modal";
import { ChevronLeft } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTranslation } from "react-i18next";
import PlansModal from "./PlansModal";

Modal.setAppElement("#root");

const AccountTab = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [isPlansModalOpen, setIsPlansModalOpen] = useState(false);
  const [userType, setUserType] = useState(null);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  useEffect(() => {
    const sessionUser = JSON.parse(sessionStorage.getItem("user") || "{}");
    setUserType(sessionUser.userType);
  }, []);

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };
  console.log(user);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError("");

    // Basic validation: check if new passwords match

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError(t("account.errors.passwordMismatch"));
      toast.error(t("account.errors.passwordMismatch"));
      return;
    }

    try {
      setIsLoading(true);

      // We assume 'user' is already signed in with email/password
      const auth = getAuth();
      if (!auth.currentUser) {
        setError(t("account.errors.noUser"));
        return;
      }

      // 1) Re-authenticate user with current credentials
      const userEmail = user?.email; // 'user' is from your AuthContext
      if (!userEmail) {
        setError(t("account.errors.noEmail"));
        return;
      }

      const credential = EmailAuthProvider.credential(
        userEmail,
        passwordForm.currentPassword
      );

      await reauthenticateWithCredential(auth.currentUser, credential);

      // 2) Update the password
      await updatePassword(auth.currentUser, passwordForm.newPassword);
      toast.success(t("account.success.passwordUpdated"));

      // Optionally, close the modal and reset form
      setIsPasswordModalOpen(false);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      // You could display a toast, or set a success message here
    } catch (err) {
      console.error("Error updating password:", err);
      setError(err.message);
      toast.error(error, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <>
      <ToastContainer />

      <div className="max-w-2xl space-y-4">
        <div
          className="flex items-center justify-between p-3 text-lg bg-white border border-gray-200 rounded-full cursor-pointer"
          onClick={() => setIsPasswordModalOpen(true)}
        >
          <div className="flex items-center gap-3">
            <img
              alt="password"
              src="/svgs/password-check.svg"
              className="w-6 h-6"
            />
            <span>{t("account.updatePassword")}</span>
          </div>
          <ChevronLeft className="w-5 h-5 rotate-180" />
        </div>
        {userType === "student" && (
          <div
            className="flex items-center justify-between p-3 text-lg bg-white border rounded-full"
            onClick={() => {
              setIsPlansModalOpen(true);
            }}
          >
            <div className="flex items-center gap-3 text-black">
              <img alt="crown" src="/svgs/crown.svg" className="w-6 h-6" />
              <span>{t("account.manageMembership")}</span>
            </div>
            <ChevronLeft className="w-5 h-5 rotate-180" />
          </div>
        )}
      </div>

      <Modal
        isOpen={isPasswordModalOpen}
        onRequestClose={() => setIsPasswordModalOpen(false)}
        contentLabel="Update Password Modal"
        className="fixed w-full max-w-md p-6 transform -translate-x-1/2 -translate-y-1/2 bg-white outline-none font-urbanist top-1/2 left-1/2 rounded-3xl"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-[1000]"
      >
        <div className="flex flex-col items-center">
          <img alt="password" src="/svgs/update-password.svg" className="" />
          <h2 className="mb-2 text-2xl font-semibold">
            {t("account.modal.title")}
          </h2>
          <p className="mb-6 text-center text-gray-600">
            {t("account.modal.description")}
          </p>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-500 rounded-lg bg-red-50">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="block text-sm text-gray-700">
                {t("account.modal.currentPassword")}
              </label>
              <div className="relative">
                <input
                  type={showPasswords.currentPassword ? "text" : "password"}
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder={t("account.modal.currentPasswordPlaceholder")}
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("currentPassword")}
                  className="absolute transform -translate-y-1/2 right-3 top-1/2"
                >
                  {showPasswords.currentPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5 text-gray-500"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5 text-gray-500"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm text-gray-700">
                {t("account.modal.newPassword")}
              </label>
              <div className="relative">
                <input
                  type={showPasswords.newPassword ? "text" : "password"}
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder={t("account.modal.newPasswordPlaceholder")}
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("newPassword")}
                  className="absolute transform -translate-y-1/2 right-3 top-1/2"
                >
                  {showPasswords.newPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5 text-gray-500"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5 text-gray-500"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm text-gray-700">
                {t("account.modal.confirmPassword")}
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder={t("account.modal.confirmPasswordPlaceholder")}
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("confirmPassword")}
                  className="absolute transform -translate-y-1/2 right-3 top-1/2"
                >
                  {showPasswords.confirmPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5 text-gray-500"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5 text-gray-500"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              className="w-full py-2 font-medium border  rounded-full text-[#042F0C]  border-[#042F0C]"
              onClick={() => setIsPasswordModalOpen(false)}
            >
              {t("account.modal.cancel")}
            </button>
            <button
              type="submit"
              className="w-full py-2 px-2 font-medium text-[#042F0C] bg-[#14B82C] rounded-full border border-[#042F0C]"
              disabled={isLoading}
            >
              {isLoading
                ? t("account.modal.updating")
                : t("account.modal.update")}
            </button>
          </div>
        </form>
      </Modal>
      <PlansModal
        isOpen={isPlansModalOpen}
        onClose={() => setIsPlansModalOpen(false)}
      />
    </>
  );
};

export default AccountTab;
