import React, { useState } from "react";
import { auth } from "../firebaseConfig";
import { sendPasswordResetEmail } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isEmailSent, setIsEmailSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await sendPasswordResetEmail(auth, email);
      setIsEmailSent(true);
    } catch (error) {
      toast.error("Error sending reset email: " + error.message);
    }
  };

  const handleResendEmail = async () => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Reset email sent again");
    } catch (error) {
      toast.error("Error sending reset email: " + error.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-6 space-y-6 bg-white rounded-3xl border-2 border-[#e7e7e7]">
        {/* Lock Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 flex items-center justify-center bg-[#fff5d1] rounded-full">
            <img alt="bambuu" src="/images/forgot-password.png" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-center">Forgot Password</h1>

        {!isEmailSent ? (
          <>
            {/* Initial State */}
            <p className="text-center text-gray-600">
              We'll send password reset link to your email.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-gray-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#14b82c] text-black rounded-full hover:bg-[#119526] focus:outline-none border border-[#042f0c]"
              >
                Continue
              </button>
            </form>
          </>
        ) : (
          <>
            {/* Email Sent State */}
            <p className="text-center text-gray-600">
              An email with password rest link is sent to
              <br />
              <span className="font-semibold text-black">{email}</span> open the
              link and reset your password.
            </p>

            <button
              onClick={() => setIsEmailSent(false)}
              className="w-full py-3 bg-[#ffb822] text-black rounded-full hover:bg-[#ffa822] focus:outline-none"
            >
              Change Email
            </button>

            <div className="text-sm text-center">
              <p className="text-gray-600">
                Didn't receive any email yet?{" "}
                <button
                  onClick={handleResendEmail}
                  className="text-[#14b82c] font-semibold hover:underline"
                >
                  Resend Email
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
