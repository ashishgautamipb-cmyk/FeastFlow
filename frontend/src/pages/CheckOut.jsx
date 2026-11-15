import React, { useEffect, useState } from "react";
import { IoIosArrowRoundBack } from "react-icons/io";
import { FaLocationDot, FaIndianRupeeSign } from "react-icons/fa6";
import { FaSearch, FaRegCreditCard, FaMobileAlt } from "react-icons/fa";
import { BiCurrentLocation } from "react-icons/bi";
import { MdDeliveryDining, MdOutlineSecurity } from "react-icons/md";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { useDispatch, useSelector } from "react-redux";
import "leaflet/dist/leaflet.css";
import { setAddress, setLocation } from "../redux/mapSlice";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { serverurl } from "../App";

function RecenterMap({ location }) {
  const map = useMap();
  if (location?.lat && location?.lon) {
    map.setView([location.lat, location.lon], 16, { animate: true });
  }
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

function CheckOut() {
  const { location, address } = useSelector((state) => state.map);
  const { cartItems, totalAmount } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [addressInput, setAddressInput] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [loading, setLoading] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const apiKey = import.meta.env.VITE_GEOAPIKEY;
  const navigate = useNavigate();

  const deliveryFee = totalAmount > 500 || totalAmount === 0 ? 0 : 50;
  const platformFee = totalAmount > 0 ? 5 : 0;
  const amountWithDeliveryFee = totalAmount + deliveryFee + platformFee;

  const handleMapLocationSelect = (lat, lng) => {
    dispatch(setLocation({ lat, lon: lng }));
    getAddressByLatLng(lat, lng);
  };

  const onDragEnd = (e) => {
    const { lat, lng } = e.target._latlng;
    handleMapLocationSelect(lat, lng);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        handleMapLocationSelect(latitude, longitude);
        setDetectingLocation(false);
      },
      (error) => {
        console.log("GPS ERROR:", error);
        alert("Unable to detect current location. Please grant location permissions.");
        setDetectingLocation(false);
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  };

  const getAddressByLatLng = async (lat, lng) => {
    try {
      if (apiKey) {
        const result = await axios.get(
          `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&format=json&apiKey=${apiKey}`,
        );
        if (result?.data?.results?.[0]?.formatted) {
          dispatch(setAddress(result.data.results[0].formatted));
          setAddressInput(result.data.results[0].formatted);
          return;
        }
      }

      // Nominatim free OpenStreetMap fallback
      const nomRes = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      );
      if (nomRes?.data?.display_name) {
        dispatch(setAddress(nomRes.data.display_name));
        setAddressInput(nomRes.data.display_name);
      }
    } catch (error) {
      console.log("REVERSE GEOCODE ERROR:", error);
    }
  };

  const getLatLngByAddress = async () => {
    if (!addressInput.trim() || !apiKey) return;
    try {
      const result = await axios.get(
        `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(addressInput)}&apiKey=${apiKey}`,
      );
      if (result?.data?.features?.[0]?.properties) {
        const { lat, lon } = result.data.features[0].properties;
        dispatch(setLocation({ lat, lon }));
      }
    } catch (error) {
      console.log("FORWARD GEOCODE ERROR:", error);
    }
  };

  const handlePlaceOrder = async () => {
    if (!cartItems || cartItems.length === 0) {
      alert("Your cart is empty.");
      navigate("/");
      return;
    }

    if (!location?.lat || !location?.lon) {
      alert("Please select or confirm your delivery address on the map.");
      return;
    }

    try {
      setLoading(true);
      const result = await axios.post(
        `${serverurl}/api/order/place-order`,
        {
          paymentMethod,
          totalAmount: amountWithDeliveryFee,
          cartItems,
          deliveryAddress: {
            text: addressInput || address || "Current Location",
            latitude: location.lat,
            longitude: location.lon,
          },
        },
        { withCredentials: true },
      );

      if (paymentMethod === "cod") {
        navigate("/order-placed");
      } else {
        const orderId = result.data.orderId;
        const razorOrder = result.data.razorOrder;
        openRazorpayWindow(orderId, razorOrder);
      }
    } catch (error) {
      console.log("ORDER PLACEMENT ERROR:", error);
      alert(error.response?.data?.message || "Failed to place order.");
    } finally {
      setLoading(false);
    }
  };

  const openRazorpayWindow = (orderId, razorOrder) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: razorOrder.amount,
      currency: "INR",
      name: "FeastFlow Food Delivery",
      description: "Gourmet Meal & Restaurant Delivery Order",
      order_id: razorOrder.id,
      theme: {
        color: "#ea580c",
      },
      method: {
        card: true,
        upi: true,
        netbanking: true,
        wallet: true,
      },
      handler: async function (response) {
        try {
          const result = await axios.post(
            `${serverurl}/api/order/verify-payments`,
            {
              razorpay_payment_id: response.razorpay_payment_id,
              orderId,
            },
            { withCredentials: true },
          );
          if (result.data.success) {
            navigate("/order-placed");
          }
        } catch (error) {
          console.log("PAYMENT VERIFY ERROR:", error);
        }
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  useEffect(() => {
    if (address) {
      setAddressInput(address);
    }
  }, [address]);

  return (
    <div className="min-h-screen bg-[#fafafa] px-4 py-8 flex justify-center">
      <div className="w-full max-w-5xl space-y-6">
        
        {/* HEADER */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/cart")}
            aria-label="Back to Cart"
            className="p-2.5 rounded-2xl bg-white border border-gray-200/80 shadow-xs hover:border-orange-500 hover:text-orange-600 transition"
          >
            <IoIosArrowRoundBack size={26} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Checkout & Delivery Details
            </h1>
            <p className="text-xs text-gray-500">
              Confirm your delivery coordinates and select payment method
            </p>
          </div>
        </div>

        {/* 2-COLUMN CHECKOUT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: DELIVERY ADDRESS & MAP */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-7 shadow-xs space-y-5">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <FaLocationDot className="text-orange-600" />
                <span>Delivery Pinpoint & Address</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Drag the marker to pinpoint your exact delivery doorstep.
              </p>
            </div>

            {/* Address Search Bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Enter street name, building or landmark..."
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition"
                />
              </div>

              <button
                type="button"
                onClick={getLatLngByAddress}
                className="p-2.5 rounded-xl bg-orange-600 text-white hover:bg-orange-700 transition shadow-xs shrink-0"
                title="Search Address"
              >
                <FaSearch size={14} />
              </button>

              <button
                type="button"
                onClick={getCurrentLocation}
                className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition shrink-0"
                title="Detect Current GPS Location"
              >
                <BiCurrentLocation size={16} />
              </button>
            </div>

            {/* LEAFLET MAP CONTAINER */}
            <div className="w-full h-[280px] sm:h-[340px] rounded-2xl overflow-hidden border border-gray-200 relative z-0">
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={detectingLocation}
                className="absolute top-3 right-3 z-[1000] bg-white/95 hover:bg-white text-gray-800 hover:text-orange-600 px-3 py-1.5 rounded-xl text-xs font-bold shadow-md border border-gray-200/80 backdrop-blur-sm flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
                title="Detect Current GPS Location"
              >
                <BiCurrentLocation className={`text-orange-600 text-sm ${detectingLocation ? "animate-spin" : ""}`} />
                <span>{detectingLocation ? "Locating..." : "Use Current Location"}</span>
              </button>

              {location?.lat && location?.lon ? (
                <MapContainer
                  center={[location.lat, location.lon]}
                  zoom={16}
                  className="w-full h-full z-0"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <RecenterMap location={location} />
                  <MapClickHandler onLocationSelect={handleMapLocationSelect} />
                  <Marker
                    position={[location.lat, location.lon]}
                    draggable
                    eventHandlers={{ dragend: onDragEnd }}
                  />
                </MapContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-50 text-xs text-gray-400">
                  Loading map location...
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-orange-50/70 border border-orange-100 flex items-start gap-2.5 text-xs text-orange-950">
              <FaLocationDot className="text-orange-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Pinned Address: </span>
                <span className="text-gray-700">{addressInput || "No address selected yet"}</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: PAYMENT & SUMMARY */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* PAYMENT METHOD SELECTION */}
            <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-gray-900">
                Payment Method
              </h2>

              <div className="space-y-3">
                {/* Cash on delivery */}
                <div
                  onClick={() => setPaymentMethod("cod")}
                  className={`flex items-center gap-3.5 p-4 rounded-2xl border-2 cursor-pointer transition ${
                    paymentMethod === "cod"
                      ? "border-orange-500 bg-orange-50/40 shadow-xs"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <MdDeliveryDining size={22} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">Cash on Delivery</p>
                    <p className="text-xs text-gray-500">Pay cash or scan QR when food arrives</p>
                  </div>
                  <span
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === "cod"
                        ? "border-orange-600 bg-orange-600 text-white"
                        : "border-gray-300"
                    }`}
                  >
                    {paymentMethod === "cod" && <span className="w-2 h-2 rounded-full bg-white" />}
                  </span>
                </div>

                {/* Online payment */}
                <div
                  onClick={() => setPaymentMethod("online")}
                  className={`flex items-center gap-3.5 p-4 rounded-2xl border-2 cursor-pointer transition ${
                    paymentMethod === "online"
                      ? "border-orange-500 bg-orange-50/40 shadow-xs"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <FaRegCreditCard size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">Online Payment</p>
                    <p className="text-xs text-gray-500">UPI, Cards, Net Banking & Wallets (Razorpay)</p>
                  </div>
                  <span
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === "online"
                        ? "border-orange-600 bg-orange-600 text-white"
                        : "border-gray-300"
                    }`}
                  >
                    {paymentMethod === "online" && <span className="w-2 h-2 rounded-full bg-white" />}
                  </span>
                </div>
              </div>
            </div>

            {/* ORDER SUMMARY */}
            <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
                Order Summary
              </h2>

              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {cartItems?.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-xs text-gray-700">
                    <span className="font-medium truncate max-w-[200px]">
                      {item.name} <span className="text-gray-400">× {item.quantity}</span>
                    </span>
                    <span className="font-semibold text-gray-900">
                      ₹{item.price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-2 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900">₹{totalAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>
                    {deliveryFee === 0 ? (
                      <span className="text-emerald-600 font-bold uppercase">Free</span>
                    ) : (
                      `₹${deliveryFee}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Platform & Handling</span>
                  <span className="font-semibold text-gray-900">₹{platformFee}</span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between items-baseline text-sm font-black text-gray-900">
                  <span>Total Payable</span>
                  <span className="text-lg text-orange-600">₹{amountWithDeliveryFee}</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-bold rounded-2xl shadow-md shadow-orange-500/25 active:scale-[0.99] transition duration-200 text-sm disabled:opacity-60"
              >
                {loading
                  ? "Processing Order..."
                  : paymentMethod === "cod"
                  ? "Confirm & Place Order"
                  : `Pay ₹${amountWithDeliveryFee} & Place Order`}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 font-medium">
                <MdOutlineSecurity className="text-emerald-600 text-sm" />
                <span>100% Secure & Encrypted Transaction</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

export default CheckOut;
