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
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-[#e7e7e7] bg-white p-6">
        {/* Lock Icon */}
        <div className="flex justify-center">
          <img alt="bambuu" src="/svgs/forgot-pass.svg" />
        </div>

        {/* Title */}
        <h1 className="text-center text-3xl font-bold">Forgot Password</h1>

        {!isEmailSent ? (
          <>
            {/* Initial State */}
            <p className="text-center text-gray-600">
              We'll send password reset link to your email.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1">
                <label className="block text-sm text-gray-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="enter your email"
                  className="w-full rounded-3xl border border-gray-300 p-2 focus:border-[#14B82C] focus:outline-none focus:ring-0"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-full border border-[#042f0c] bg-[#14b82c] py-3 text-black hover:bg-[#119526] focus:outline-none"
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
              className="flex h-11 w-full items-center justify-center rounded-3xl border border-black bg-[#FFBF00] p-4 text-black hover:opacity-80"
            >
              Change Email
            </button>

            <div className="text-center text-sm">
              <p className="text-gray-600">
                Didn't receive any email yet?{" "}
                <button
                  onClick={handleResendEmail}
                  className="font-semibold text-[#14b82c] hover:underline"
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
