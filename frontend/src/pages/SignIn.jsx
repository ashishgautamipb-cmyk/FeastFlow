import React, { useState } from "react";
import { IoIosEye } from "react-icons/io";
import { FaEyeSlash } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";
import { HiSparkles } from "react-icons/hi2";
import { FiMail, FiLock, FiAlertCircle } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { serverurl } from "../App";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../../firebase.js";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice.js";

const getApiErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const SignIn = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("user");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setErr("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      setErr("");
      const result = await axios.post(
        `${serverurl}/api/auth/signin`,
        { email, password },
        { withCredentials: true },
      );

      dispatch(setUserData(result.data.user));
      navigate("/");
    } catch (error) {
      console.log("SIGN IN ERROR:", error.response?.data || error.message);
      setErr(getApiErrorMessage(error, "Unable to sign in. Please verify your credentials."));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      if (!auth) {
        setErr("Google Sign-In is unavailable because VITE_FIREBASE_APIKEY is not configured in .env.");
        return;
      }
      setLoading(true);
      setErr("");
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      const { data } = await axios.post(
        `${serverurl}/api/auth/google-auth`,
        {
          fullName: result.user.displayName,
          email: result.user.email,
          role,
          mobile: "0000000000",
        },
        { withCredentials: true },
      );

      dispatch(setUserData(data.user));
      navigate("/");
    } catch (error) {
      console.log("GOOGLE SIGN IN ERROR:", error.response?.data || error.message);
      setErr(getApiErrorMessage(error, "Google sign in failed. Please check your setup."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50/50 p-4 sm:p-6">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.08)] p-8 sm:p-10 border border-gray-100">
        
        {/* BRAND HEADER */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 mx-auto flex items-center justify-center text-white shadow-lg shadow-orange-500/30 mb-3">
            <HiSparkles className="text-2xl" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Feast<span className="text-orange-600">Flow</span>
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            Welcome back! Sign in to order gourmet meals or manage your orders.
          </p>
        </div>

        {/* ERROR ALERT */}
        {err && (
          <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200/80 flex items-center gap-2.5 text-xs text-red-700 font-medium animate-in fade-in duration-200">
            <FiAlertCircle className="text-red-500 text-base shrink-0" />
            <span>{err}</span>
          </div>
        )}

        {/* SIGN IN FORM */}
        <form onSubmit={handleSignIn} className="space-y-4">
          
          {/* EMAIL */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition"
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-xs font-semibold text-orange-600 hover:text-orange-700 transition"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
              <input
                required
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-11 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <FaEyeSlash size={18} /> : <IoIosEye size={20} />}
              </button>
            </div>
          </div>

          {/* SIGN IN BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-bold py-3 rounded-xl shadow-md shadow-orange-500/25 active:scale-[0.99] transition duration-200 text-sm disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In to FeastFlow"}
          </button>
        </form>

        {/* DIVIDER */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Or continue with</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* GOOGLE SIGN IN */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50/80 rounded-xl py-2.5 px-4 flex items-center justify-center gap-2.5 transition active:scale-[0.99]"
        >
          <FcGoogle size={20} />
          <span className="text-xs sm:text-sm font-semibold text-gray-700">Continue with Google</span>
        </button>

        {/* SIGN UP LINK */}
        <p className="text-xs text-center mt-6 text-gray-500">
          Don't have an account yet?{" "}
          <button
            type="button"
            onClick={() => navigate("/signup")}
            className="text-orange-600 font-bold hover:underline"
          >
            Create an Account
          </button>
        </p>

      </div>
    </div>
  );
};

export default SignIn;
