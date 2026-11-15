import React, { useState } from "react";
import { IoIosEye } from "react-icons/io";
import { FaEyeSlash } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";
import { HiSparkles } from "react-icons/hi2";
import { FiUser, FiMail, FiPhone, FiLock, FiAlertCircle } from "react-icons/fi";
import { MdOutlineDeliveryDining, MdOutlineRestaurant } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { serverurl } from "../App";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../../firebase.js";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice.js";
import { setMyShopData } from "../redux/ownerSlice.js";

const getApiErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("user");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    if (e) e.preventDefault();

    if (!fullName || !email || !password || !mobile) {
      setErr("Please fill out all required fields.");
      return;
    }

    try {
      setLoading(true);
      setErr("");
      const result = await axios.post(
        `${serverurl}/api/auth/signup`,
        { fullName, email, password, mobile, role },
        { withCredentials: true },
      );

      dispatch(setUserData(result.data.user));
      if (role === "owner") {
        dispatch(setMyShopData(null));
        navigate("/create-edit-shop");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.log("SIGN UP ERROR:", error.response?.data || error.message);
      setErr(getApiErrorMessage(error, "Unable to register account. Please try again."));
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
      if (!mobile) {
        setErr("Please enter your mobile number before continuing with Google.");
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
          mobile,
        },
        { withCredentials: true },
      );

      dispatch(setUserData(data.user));
      if (role === "owner") {
        dispatch(setMyShopData(null));
        navigate("/create-edit-shop");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.log("GOOGLE SIGN UP ERROR:", error.response?.data || error.message);
      setErr(
        getApiErrorMessage(error, "Google sign up failed. Please try again."),
      );
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { id: "user", label: "Customer", icon: FiUser },
    { id: "owner", label: "Restaurant", icon: MdOutlineRestaurant },
    { id: "deliveryBoy", label: "Delivery Rider", icon: MdOutlineDeliveryDining },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50/50 p-4 sm:p-6">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.08)] p-8 sm:p-10 border border-gray-100 my-8">
        
        {/* BRAND HEADER */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 mx-auto flex items-center justify-center text-white shadow-lg shadow-orange-500/30 mb-3">
            <HiSparkles className="text-2xl" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Create a Feast<span className="text-orange-600">Flow</span> Account
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            Join the official gourmet delivery platform
          </p>
        </div>

        {/* ERROR ALERT */}
        {err && (
          <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200/80 flex items-center gap-2.5 text-xs text-red-700 font-medium">
            <FiAlertCircle className="text-red-500 text-base shrink-0" />
            <span>{err}</span>
          </div>
        )}

        {/* ACCOUNT ROLE SELECTOR TABS */}
        <div className="mb-5">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            Select Your Account Type
          </label>
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-gray-50 border border-gray-200 rounded-2xl">
            {roles.map((r) => {
              const Icon = r.icon;
              const isSelected = role === r.id;
              return (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl text-xs font-bold transition ${
                    isSelected
                      ? "bg-white text-orange-600 shadow-sm border border-gray-100"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Icon size={18} className={isSelected ? "text-orange-600" : "text-gray-400"} />
                  <span className="truncate">{r.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* SIGN UP FORM */}
        <form onSubmit={handleSignUp} className="space-y-4">
          
          {/* FULL NAME */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
              <input
                required
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition"
              />
            </div>
          </div>

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
                placeholder="jane@example.com"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition"
              />
            </div>
          </div>

          {/* MOBILE */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Mobile Number
            </label>
            <div className="relative">
              <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
              <input
                required
                type="tel"
                autoComplete="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="9876543210"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition"
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
              <input
                required
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
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

          {/* SIGN UP BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-bold py-3 rounded-xl shadow-md shadow-orange-500/25 active:scale-[0.99] transition duration-200 text-sm disabled:opacity-60"
          >
            {loading ? "Creating Account..." : "Create Free Account"}
          </button>
        </form>

        {/* DIVIDER */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Or register with</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* GOOGLE SIGN UP */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50/80 rounded-xl py-2.5 px-4 flex items-center justify-center gap-2.5 transition active:scale-[0.99]"
        >
          <FcGoogle size={20} />
          <span className="text-xs sm:text-sm font-semibold text-gray-700">Sign up with Google</span>
        </button>

        {/* SIGN IN LINK */}
        <p className="text-xs text-center mt-6 text-gray-500">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/signin")}
            className="text-orange-600 font-bold hover:underline"
          >
            Sign In
          </button>
        </p>

      </div>
    </div>
  );
};

export default SignUp;
