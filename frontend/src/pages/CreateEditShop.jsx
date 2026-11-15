import React, { useState, useEffect } from "react";
import { IoIosArrowRoundBack } from "react-icons/io";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaStore, FaLocationDot, FaUpload, FaLocationCrosshairs } from "react-icons/fa6";
import { FiCheck, FiImage, FiMapPin } from "react-icons/fi";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import { serverurl } from "../App";
import { setMyShopData } from "../redux/ownerSlice";

// Custom Leaflet restaurant marker icon
const shopMarkerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function RecenterMap({ lat, lon }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lon) {
      map.setView([lat, lon], 16, { animate: true });
    }
  }, [lat, lon, map]);
  return null;
}

function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function CreateEditShop() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { myShopData } = useSelector((state) => state.owner);
  const { currentCity, currentState, currentAddress } = useSelector(
    (state) => state.user,
  );

  const [name, setName] = useState("");
  const [address, setAddress] = useState(currentAddress || "");
  const [city, setCity] = useState(currentCity || "");
  const [state, setState] = useState(currentState || "");
  const [latitude, setLatitude] = useState(22.5726); // Default Kolkata
  const [longitude, setLongitude] = useState(88.3639);
  const [frontendImage, setFrontendImage] = useState(null);
  const [backendImage, setBackendImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const geoApiKey = import.meta.env.VITE_GEOAPIKEY;

  // Reverse geocoding helper (Geoapify with Nominatim fallback)
  const reverseGeocode = async (lat, lon) => {
    try {
      if (geoApiKey) {
        const res = await axios.get(
          `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&format=json&apiKey=${geoApiKey}`,
        );
        const data = res.data?.results?.[0];
        if (data) {
          if (data.city || data.town || data.county) setCity(data.city || data.town || data.county);
          if (data.state) setState(data.state);
          if (data.formatted) setAddress(data.formatted);
          return;
        }
      }

      // Nominatim free OpenStreetMap reverse geocoding fallback
      const nomRes = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      );
      if (nomRes.data) {
        const addr = nomRes.data.address || {};
        const detectedCity = addr.city || addr.town || addr.village || addr.suburb || addr.county || "Kolkata";
        const detectedState = addr.state || "West Bengal";
        setCity(detectedCity);
        setState(detectedState);
        setAddress(nomRes.data.display_name || `${detectedCity}, ${detectedState}`);
      }
    } catch (err) {
      console.log("Reverse geocode skipped/failed:", err.message);
    }
  };

  const handleLocationChange = (lat, lon) => {
    setLatitude(lat);
    setLongitude(lon);
    reverseGeocode(lat, lon);
  };

  // Request browser GPS location
  const detectGPSLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser.");
      return;
    }
    setDetectingLocation(true);
    setErrorMsg("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        handleLocationChange(lat, lon);
        setDetectingLocation(false);
      },
      (err) => {
        console.log("GPS detection failed:", err.message);
        setDetectingLocation(false);
        setErrorMsg("Unable to access GPS location. Please allow location permissions or click on the map to set location.");
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  };

  // Sync with Redux user location if fields are empty
  useEffect(() => {
    if (!myShopData) {
      if (!address && currentAddress) setAddress(currentAddress);
      if (!city && currentCity) setCity(currentCity);
      if (!state && currentState) setState(currentState);
    }
  }, [currentAddress, currentCity, currentState, myShopData]);

  // Fetch shop data on mount & request GPS if new
  useEffect(() => {
    const fetchShop = async () => {
      try {
        const result = await axios.get(`${serverurl}/api/shop/get-my`, {
          withCredentials: true,
        });
        if (result.data.shop) {
          dispatch(setMyShopData(result.data.shop));
        } else {
          // Ask for GPS if registering new restaurant
          detectGPSLocation();
        }
      } catch (error) {
        console.log("FETCH ERROR:", error.response?.data || error.message);
        detectGPSLocation();
      } finally {
        setLoading(false);
      }
    };

    fetchShop();
  }, [dispatch]);

  // Sync form fields when myShopData loads into Redux
  useEffect(() => {
    if (!myShopData) return;
    setName(myShopData.name || "");
    setAddress(myShopData.address || "");
    setCity(myShopData.city || "");
    setState(myShopData.state || "");
    setFrontendImage(myShopData.image || null);

    if (myShopData.location?.coordinates?.length === 2) {
      setLongitude(myShopData.location.coordinates[0]);
      setLatitude(myShopData.location.coordinates[1]);
    }
  }, [myShopData]);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBackendImage(file);
      setFrontendImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !city || !address) {
      setErrorMsg("Please fill out restaurant name, city, and street address.");
      return;
    }

    try {
      setSaving(true);
      setErrorMsg("");
      const formData = new FormData();
      formData.append("name", name);
      formData.append("city", city);
      formData.append("state", state || "West Bengal");
      formData.append("address", address);
      formData.append("latitude", latitude);
      formData.append("longitude", longitude);
      if (backendImage) formData.append("image", backendImage);

      const result = await axios.post(
        `${serverurl}/api/shop/create-edit`,
        formData,
        { withCredentials: true },
      );

      if (result.data.shop) {
        dispatch(setMyShopData(result.data.shop));
        navigate("/");
      }
    } catch (error) {
      console.log(error);
      setErrorMsg(error.response?.data?.message || "Failed to save restaurant profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-[#fafafa] gap-3">
        <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Loading restaurant profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] px-4 py-8 flex justify-center">
      <div className="w-full max-w-2xl space-y-6">
        
        {/* HEADER */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            aria-label="Back"
            className="p-2.5 rounded-2xl bg-white border border-gray-200/80 shadow-xs hover:border-orange-500 hover:text-orange-600 transition"
          >
            <IoIosArrowRoundBack size={26} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              {myShopData ? "Edit Restaurant Profile" : "Register New Restaurant"}
            </h1>
            <p className="text-xs text-gray-500">
              Configure your FeastFlow storefront, map GPS coordinates, and hero banner
            </p>
          </div>
        </div>

        {/* ERROR ALERT */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
            {errorMsg}
          </div>
        )}

        {/* FORM CONTAINER */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          
          {/* BANNER / COVER IMAGE */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              Restaurant Cover Photo
            </label>
            
            <div className="relative rounded-2xl overflow-hidden border-2 border-dashed border-gray-300 hover:border-orange-500 bg-gray-50 transition group">
              {frontendImage ? (
                <div className="relative h-48 w-full overflow-hidden">
                  <img
                    src={frontendImage}
                    alt="Storefront"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-2">
                    <FaUpload />
                    <span>Change Photo</span>
                  </div>
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mb-2">
                    <FiImage size={24} />
                  </div>
                  <p className="text-xs font-bold text-gray-800">Upload Storefront Banner</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">High-resolution JPG, PNG or WebP</p>
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={handleImage}
                className="absolute inset-0 opacity-0 cursor-pointer"
                aria-label="Upload restaurant cover photo"
              />
            </div>
          </div>

          {/* RESTAURANT NAME */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              Restaurant Name
            </label>
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Bella Italia Bistro, Spice Garden"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition"
            />
          </div>

          {/* INTERACTIVE LEAFLET LOCATION MAP & AUTO-FILL */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Restaurant Location & GPS Pin
                </label>
                <p className="text-[11px] text-gray-400">
                  Drag the pin or click on the map to auto-fill your restaurant's address
                </p>
              </div>

              <button
                type="button"
                onClick={detectGPSLocation}
                disabled={detectingLocation}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 text-xs font-bold transition active:scale-95 disabled:opacity-50"
              >
                <FaLocationCrosshairs className={detectingLocation ? "animate-spin" : ""} />
                <span>{detectingLocation ? "Detecting..." : "Detect Current GPS"}</span>
              </button>
            </div>

            {/* LEAFLET MAP */}
            <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-2xs h-64 w-full relative">
              <button
                type="button"
                onClick={detectGPSLocation}
                disabled={detectingLocation}
                className="absolute top-3 right-3 z-[1000] bg-white/95 hover:bg-white text-gray-800 hover:text-orange-600 px-3 py-1.5 rounded-xl text-xs font-bold shadow-md border border-gray-200/80 backdrop-blur-sm flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
                title="Detect Current GPS Location"
              >
                <FaLocationCrosshairs className={`text-orange-600 ${detectingLocation ? "animate-spin" : ""}`} />
                <span>{detectingLocation ? "Locating..." : "Use Current Location"}</span>
              </button>

              <MapContainer
                center={[latitude, longitude]}
                zoom={15}
                className="h-full w-full"
              >
                <TileLayer
                  attribution="&copy; OpenStreetMap contributors"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <RecenterMap lat={latitude} lon={longitude} />
                <MapClickHandler onLocationSelect={handleLocationChange} />
                <Marker
                  position={[latitude, longitude]}
                  icon={shopMarkerIcon}
                  draggable={true}
                  eventHandlers={{
                    dragend: (e) => {
                      const { lat, lng } = e.target._latlng;
                      handleLocationChange(lat, lng);
                    },
                  }}
                />
              </MapContainer>
            </div>
            
            <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
              <span>📍 Coordinates: {latitude.toFixed(5)}, {longitude.toFixed(5)}</span>
              <span className="text-emerald-600 font-semibold">✓ Auto-syncs with Customers within 10 km</span>
            </div>
          </div>

          {/* CITY & STATE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                City
              </label>
              <input
                required
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Kolkata, Mumbai"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                State
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g. West Bengal, Maharashtra"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition"
              />
            </div>
          </div>

          {/* STREET ADDRESS (OWNER CAN ALSO EDIT MANUALLY) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Complete Street Address
              </label>
              <span className="text-[11px] text-gray-400">Can be edited manually anytime</span>
            </div>
            <input
              required
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Shop No. 12, Main Street, Landmark"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition"
            />
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-bold rounded-2xl shadow-md shadow-orange-500/25 active:scale-[0.99] transition duration-200 text-sm disabled:opacity-60 cursor-pointer"
          >
            {saving ? "Saving Storefront..." : myShopData ? "Save Restaurant Changes" : "Create Restaurant Profile"}
          </button>

        </form>

      </div>
    </div>
  );
}

export default CreateEditShop;
