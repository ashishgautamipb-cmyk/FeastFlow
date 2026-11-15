import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaLocationDot, FaCompass, FaCity, FaLocationCrosshairs, FaXmark } from "react-icons/fa6";
import { setLocation, setAddress } from "../redux/mapSlice";
import { setCurrentCity, setCurrentAddress, setcurrentState } from "../redux/userSlice";
import axios from "axios";
import { serverurl } from "../App";

const POPULAR_CITIES = [
  { name: "Kolkata", state: "West Bengal", lat: 22.5726, lon: 88.3639 },
  { name: "Mumbai", state: "Maharashtra", lat: 19.076, lon: 72.8777 },
  { name: "Delhi", state: "Delhi", lat: 28.6139, lon: 77.209 },
  { name: "Bengaluru", state: "Karnataka", lat: 12.9716, lon: 77.5946 },
  { name: "Hyderabad", state: "Telangana", lat: 17.385, lon: 78.4867 },
  { name: "Chennai", state: "Tamil Nadu", lat: 13.0827, lon: 80.2707 },
];

function LocationPromptModal({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const reverseGeocode = async (lat, lon) => {
    try {
      const nomRes = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      );
      if (nomRes.data) {
        const addr = nomRes.data.address || {};
        const detectedCity =
          addr.city ||
          addr.town ||
          addr.village ||
          addr.suburb ||
          addr.district ||
          addr.county ||
          "Kolkata";
        const detectedState = addr.state || "West Bengal";
        const formatted = nomRes.data.display_name || `${detectedCity}, ${detectedState}`;

        dispatch(setCurrentCity(detectedCity));
        dispatch(setcurrentState(detectedState));
        dispatch(setCurrentAddress(formatted));
        dispatch(setAddress(formatted));
      }
    } catch (e) {
      console.log("Reverse geocode skipped:", e.message);
    }
  };

  const handleUpdateCoordinates = async (lat, lon, cityName, stateName) => {
    try {
      setLoading(true);
      setErrorMsg("");

      dispatch(setLocation({ lat, lon }));
      if (cityName) dispatch(setCurrentCity(cityName));
      if (stateName) dispatch(setcurrentState(stateName));

      if (!cityName) {
        await reverseGeocode(lat, lon);
      }

      // Save to backend
      if (userData?._id) {
        await axios.post(
          `${serverurl}/api/user/update-location`,
          { lat, lon },
          { withCredentials: true },
        );
      }

      if (onClose) onClose();
    } catch (err) {
      console.log("Error updating location:", err);
      setErrorMsg("Failed to update location. Please try selecting a city.");
    } finally {
      setLoading(false);
    }
  };

  const detectGPS = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser.");
      return;
    }
    setLoading(true);
    setErrorMsg("");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        handleUpdateCoordinates(lat, lon);
      },
      (err) => {
        console.log("GPS error:", err);
        setLoading(false);
        setErrorMsg("Location access denied or unavailable. Please choose your city below.");
      },
      { timeout: 10000 },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-6 relative">
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
          >
            <FaXmark size={18} />
          </button>
        )}

        {/* Header Icon */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
            <FaLocationDot size={22} />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">
              Set Your Delivery Location
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              FeastFlow shows all restaurants and gourmet dishes within <strong>10 km</strong> of you.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
            {errorMsg}
          </div>
        )}

        {/* GPS Button */}
        <button
          onClick={detectGPS}
          disabled={loading}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-bold text-sm shadow-md shadow-orange-500/20 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
        >
          <FaLocationCrosshairs size={16} />
          <span>{loading ? "Detecting GPS Position..." : "Detect Current GPS Location (Recommended)"}</span>
        </button>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-gray-200 w-full" />
          <span className="bg-white px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 absolute">
            or pick a city
          </span>
        </div>

        {/* Popular Cities Grid */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
            Popular Service Locations
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {POPULAR_CITIES.map((c) => (
              <button
                key={c.name}
                onClick={() => handleUpdateCoordinates(c.lat, c.lon, c.name, c.state)}
                disabled={loading}
                className="p-3 rounded-2xl border border-gray-200/90 hover:border-orange-500 hover:bg-orange-50/50 text-left transition group active:scale-95 cursor-pointer disabled:opacity-60"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 group-hover:text-orange-600">
                  <FaCity size={12} className="text-gray-400 group-hover:text-orange-500" />
                  <span>{c.name}</span>
                </div>
                <span className="text-[10px] text-gray-400 block mt-0.5">
                  {c.state}
                </span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default LocationPromptModal;
