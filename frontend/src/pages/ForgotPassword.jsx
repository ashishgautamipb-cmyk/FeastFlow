import axios from "axios";
import React, { useState } from "react";
import { IoArrowBack } from "react-icons/io5";
import { FiMail, FiKey, FiLock, FiAlertCircle, FiCheckCircle } from "react-icons/fi";
import { HiSparkles } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import { serverurl } from "../App";

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!email) {
      setErr("Please enter your registered email address.");
      return;
    }

    try {
      setLoading(true);
      setErr("");
      setMsg("");
      const result = await axios.post(
        `${serverurl}/api/auth/send-otp`,
        { email },
        { withCredentials: true },
      );

      if (result.data.success) {
        setMsg("OTP sent to your email. Check your inbox and spam folder.");
        setStep(2);
      } else {
        setErr(result.data.message || "Unable to send OTP. Please try again.");
      }
    } catch (error) {
      console.log("SEND OTP ERROR:", error.response?.data || error.message);
      setErr(error.response?.data?.message || "Failed to send OTP. Verify your email.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (!otp) {
      setErr("Please enter the 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);
      setErr("");
      setMsg("");
      const result = await axios.post(`${serverurl}/api/auth/verify-otp`, {
        email,
        otp,
      });

      if (result.data.success) {
        setMsg("OTP verified successfully. Create a new password.");
        setStep(3);
      } else {
        setErr(result.data.message || "Invalid OTP code.");
      }
    } catch (error) {
      console.log("VERIFY ERROR:", error.response?.data || error.message);
      setErr(error.response?.data?.message || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    if (e) e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setErr("Please fill out both password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErr("Passwords do not match. Please re-check.");
      return;
    }

    try {
      setLoading(true);
      setErr("");
      const result = await axios.post(`${serverurl}/api/auth/reset-password`, {
        email,
        newPassword,
      });

      if (result.data.success) {
        navigate("/signin");
      } else {
        setErr(result.data.message || "Unable to reset password.");
      }
    } catch (error) {
      console.log("RESET ERROR:", error.response?.data);
      setErr(error.response?.data?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50/50 p-4 sm:p-6">
      <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.08)] w-full max-w-md p-8 sm:p-10 border border-gray-100">
        
        {/* BACK BUTTON & TITLE */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate("/signin")}
            className="p-2 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 transition"
            aria-label="Back to Sign In"
          >
            <IoArrowBack size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Reset Password
            </h1>
            <p className="text-xs text-gray-500">
              Recover access to your FeastFlow account
            </p>
          </div>
        </div>

        {/* STEP PROGRESS INDICATOR */}
        <div className="flex items-center justify-between mb-8 px-2">
          {["Email", "Verify OTP", "New Password"].map((label, idx) => {
            const currentStep = idx + 1;
            const isCompleted = step > currentStep;
            const isActive = step === currentStep;
            return (
              <div key={label} className="flex flex-col items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted
                      ? "bg-emerald-500 text-white shadow-sm"
                      : isActive
                      ? "bg-orange-600 text-white ring-4 ring-orange-500/10 shadow-sm"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {isCompleted ? "✓" : currentStep}
                </div>
                <span className={`text-[10px] mt-1.5 font-semibold ${isActive ? "text-orange-600" : "text-gray-400"}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* ALERTS */}
        {err && (
          <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200/80 flex items-center gap-2.5 text-xs text-red-700 font-medium">
            <FiAlertCircle className="text-red-500 text-base shrink-0" />
            <span>{err}</span>
          </div>
        )}
        {msg && (
          <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center gap-2.5 text-xs text-emerald-700 font-medium">
            <FiCheckCircle className="text-emerald-500 text-base shrink-0" />
            <span>{msg}</span>
          </div>
        )}

        {/* STEP 1: EMAIL */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Registered Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-bold py-3 rounded-xl shadow-md shadow-orange-500/25 active:scale-[0.99] transition duration-200 text-sm disabled:opacity-60"
            >
              {loading ? "Sending OTP..." : "Send Verification OTP"}
            </button>
          </form>
        )}

        {/* STEP 2: VERIFY OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Enter 6-Digit OTP
              </label>
              <div className="relative">
                <FiKey className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                <input
                  required
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-center text-lg font-mono font-bold tracking-widest text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5 text-center">
                OTP sent to <strong>{email}</strong>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-bold py-3 rounded-xl shadow-md shadow-orange-500/25 active:scale-[0.99] transition duration-200 text-sm disabled:opacity-60"
            >
              {loading ? "Verifying..." : "Verify Code"}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleSendOtp}
                className="text-xs font-bold text-orange-600 hover:underline"
              >
                Resend OTP
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: NEW PASSWORD */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                <input
                  required
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                <input
                  required
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-bold py-3 rounded-xl shadow-md shadow-orange-500/25 active:scale-[0.99] transition duration-200 text-sm disabled:opacity-60"
            >
              {loading ? "Updating..." : "Update Password & Sign In"}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default ForgotPassword;
