import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import Nav from "./Nav";
import axios from "axios";
import { serverurl } from "../App";
import {
  FaMotorcycle,
  FaStore,
  FaPhone,
  FaLocationDot,
  FaCircleCheck,
  FaIndianRupeeSign,
  FaShieldHalved,
  FaBoxOpen,
  FaRoute,
  FaKey,
  FaUser,
} from "react-icons/fa6";
import { FiPackage, FiRadio, FiCheckCircle, FiClock, FiKey, FiAlertCircle } from "react-icons/fi";
import DeliveryBoyTracking, { getDistanceMeters } from "./DeliveryBoyTracking";

function DeliveryDashboard() {
  const { userData, socket } = useSelector((state) => state.user);

  const [availableAssignments, setAvailableAssignments] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [showOtpBox, setShowOtpBox] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [pickupSuccess, setPickupSuccess] = useState("");
  const [detectingGps, setDetectingGps] = useState(false);

  // Live rider coordinates (supports browser GPS and Dev Simulation)
  const [simulatedCoords, setSimulatedCoords] = useState(null);

  const riderLat =
    simulatedCoords?.lat ||
    userData?.location?.coordinates?.[1] ||
    22.5726;
  const riderLon =
    simulatedCoords?.lon ||
    userData?.location?.coordinates?.[0] ||
    88.3639;

  const detectRiderGps = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setSimulatedCoords({ lat, lon });
        if (userData?._id) {
          try {
            await axios.post(
              `${serverurl}/api/user/update-location`,
              { lat, lon },
              { withCredentials: true },
            );
          } catch (e) {
            console.log("Rider update location error:", e);
          }
        }
        setDetectingGps(false);
      },
      (err) => {
        console.log("GPS error:", err);
        setDetectingGps(false);
        alert("Unable to detect GPS position. Please check browser permissions.");
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  };

  // ---------------------------
  // Fetch Available Assignments
  // ---------------------------
  const getAssignments = async () => {
    try {
      const result = await axios.get(`${serverurl}/api/order/get-assignments`, {
        withCredentials: true,
      });

      if (result.data.success) {
        setAvailableAssignments(result.data.formatted || []);
      }
    } catch (error) {
      console.log("GET ASSIGNMENTS ERROR:", error.response?.data || error.message);
    }
  };

  // ---------------------------
  // Accept Order
  // ---------------------------
  const acceptOrder = async (assignmentId) => {
    try {
      setLoading(true);
      const result = await axios.get(
        `${serverurl}/api/order/accept-order/${assignmentId}`,
        { withCredentials: true },
      );

      if (result.data.success) {
        await getAssignments();
        await getCurrentOrder();
      }
    } catch (error) {
      console.log("ACCEPT ORDER ERROR:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // Fetch Current Active Order
  // ---------------------------
  const getCurrentOrder = async () => {
    try {
      const result = await axios.get(
        `${serverurl}/api/order/get-current-order`,
        { withCredentials: true },
      );

      if (result.data.success) {
        setCurrentOrder(result.data);
      } else {
        setCurrentOrder(null);
      }
    } catch (error) {
      console.log("GET CURRENT ORDER ERROR:", error.response?.data || error.message);
    }
  };

  // ---------------------------
  // Confirm Food Pickup
  // ---------------------------
  const handlePickupOrder = async () => {
    if (!currentOrder?.assignmentId) return;
    try {
      setLoading(true);
      setPickupSuccess("");
      const result = await axios.post(
        `${serverurl}/api/order/pickup-order/${currentOrder.assignmentId}`,
        {},
        { withCredentials: true },
      );

      if (result.data.success) {
        setPickupSuccess("Food picked up! Status updated to 'Picked Up'.");
        await getCurrentOrder();
      }
    } catch (error) {
      console.log("PICKUP ERROR:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // Send Delivery OTP
  // ---------------------------
  const sendOtp = async () => {
    try {
      setLoading(true);
      setOtpError("");
      const result = await axios.post(
        `${serverurl}/api/order/send-delivery-otp`,
        {
          orderId: currentOrder._id,
          shopOrderId: currentOrder.shopOrder._id,
        },
        { withCredentials: true },
      );
      if (result.data.success) {
        setShowOtpBox(true);
      }
    } catch (error) {
      console.log("SEND OTP ERROR:", error);
      setOtpError("Failed to trigger delivery OTP. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // Verify Delivery OTP
  // ---------------------------
  const verifyOtp = async () => {
    try {
      if (!otp.trim()) {
        setOtpError("Please enter the 4-digit customer delivery OTP.");
        return;
      }

      setLoading(true);
      setOtpError("");
      const result = await axios.post(
        `${serverurl}/api/order/verify-delivery-otp`,
        {
          orderId: currentOrder._id,
          shopOrderId: currentOrder.shopOrder._id,
          otp,
        },
        { withCredentials: true },
      );

      if (result.data.success) {
        setShowOtpBox(false);
        setOtp("");
        setCurrentOrder(null);
        setSimulatedCoords(null);
        await getCurrentOrder();
        await getAssignments();
      } else {
        setOtpError(result.data.message || "Invalid OTP code. Ask customer to verify.");
      }
    } catch (error) {
      console.log("VERIFY OTP ERROR:", error);
      setOtpError(error.response?.data?.message || "Invalid or expired OTP code.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // Distance Calculation to Customer
  // ---------------------------
  const customerLat = currentOrder?.deliveryAddress?.latitude;
  const customerLon = currentOrder?.deliveryAddress?.longitude;

  const distanceMeters =
    customerLat != null && customerLon != null
      ? getDistanceMeters(riderLat, riderLon, customerLat, customerLon)
      : null;

  const isWithin100Meters = distanceMeters !== null && distanceMeters <= 100;

  const distanceFormatted =
    distanceMeters == null
      ? "Calculating..."
      : distanceMeters < 1000
      ? `${distanceMeters} meters`
      : `${(distanceMeters / 1000).toFixed(2)} km`;

  // Simulate arriving at doorstep (< 100 meters away)
  const handleSimulateArrival = () => {
    if (!customerLat || !customerLon) return;
    // Offset by ~40 meters (~0.00035 degrees)
    setSimulatedCoords({
      lat: customerLat + 0.00025,
      lon: customerLon + 0.00025,
    });
  };

  // Reset simulation
  const handleResetLocation = () => {
    setSimulatedCoords(null);
  };

  // Broadcast rider location to order room via socket
  useEffect(() => {
    if (!socket || !currentOrder?._id || !riderLat || !riderLon) return;
    socket.emit("riderLocationUpdate", {
      orderId: currentOrder._id,
      lat: riderLat,
      lon: riderLon,
      riderId: userData?._id,
    });
  }, [socket, currentOrder?._id, riderLat, riderLon, userData?._id]);

  useEffect(() => {
    if (!userData) return;
    getAssignments();
    getCurrentOrder();

    const interval = setInterval(() => {
      getAssignments();
    }, 12000);

    return () => clearInterval(interval);
  }, [userData]);

  const shopOrderStatus = currentOrder?.shopOrder?.status;
  const isFoodPickedUp =
    shopOrderStatus === "picked up" || shopOrderStatus === "out of delivery";

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      <Nav />

      <main className="pt-[90px] pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-6">
        
        {/* RIDER STATUS & WELCOME CARD */}
        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <FaMotorcycle size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-gray-900 tracking-tight">
                  {userData?.fullName}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Rider On Duty
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                FeastFlow Delivery Fleet Partner • GPS: {riderLat.toFixed(4)}, {riderLon.toFixed(4)}
                {simulatedCoords && " (Simulation Active)"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={detectRiderGps}
              disabled={detectingGps}
              className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
              title="Detect Current GPS Location"
            >
              <FaLocationDot size={12} className={detectingGps ? "animate-spin" : ""} />
              <span>{detectingGps ? "Locating..." : "Detect Current GPS"}</span>
            </button>
            {simulatedCoords && (
              <button
                onClick={handleResetLocation}
                className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition"
              >
                Reset GPS
              </button>
            )}
            <button
              onClick={() => {
                getAssignments();
                getCurrentOrder();
              }}
              className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition active:scale-95"
            >
              Refresh Feed
            </button>
          </div>
        </div>

        {/* ---------------- ACTIVE ONGOING DELIVERY ---------------- */}
        {currentOrder && (
          <div className="bg-white rounded-3xl border-2 border-emerald-500/80 shadow-xl p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
            
            {/* Header with Status Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    Active Mission
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-800 px-2.5 py-1 rounded-md">
                    Status: {shopOrderStatus}
                  </span>
                </div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight mt-1.5">
                  Delivery in Progress
                </h2>
              </div>
              <span className="text-xs font-mono font-bold text-gray-400">
                #{currentOrder._id?.slice(-6).toUpperCase()}
              </span>
            </div>

            {/* THREE ESSENTIAL INFO CARDS: FOOD, RESTAURANT OWNER, USER */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* 1. RESTAURANT & OWNER INFO */}
              <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-100 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 flex items-center gap-1">
                  <FaStore />
                  <span>Restaurant & Owner</span>
                </span>
                <div>
                  <h4 className="font-black text-gray-900 text-sm">
                    {currentOrder.shop?.name || "Partner Restaurant"}
                  </h4>
                  <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">
                    {currentOrder.shop?.address || "Pickup Point"}
                  </p>
                </div>

                <div className="pt-1 text-xs border-t border-orange-200/60">
                  <span className="text-gray-500 block text-[11px]">Owner:</span>
                  <span className="font-bold text-gray-800">
                    {currentOrder.shop?.owner?.fullName || "Store Manager"}
                  </span>
                  {currentOrder.shop?.owner?.mobile && (
                    <a
                      href={`tel:${currentOrder.shop.owner.mobile}`}
                      className="inline-flex items-center gap-1 text-orange-600 font-bold hover:underline block mt-1"
                    >
                      <FaPhone size={10} />
                      <span>{currentOrder.shop.owner.mobile}</span>
                    </a>
                  )}
                </div>
              </div>

              {/* 2. CUSTOMER & USER INFO */}
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1">
                  <FaUser />
                  <span>Customer Details</span>
                </span>
                <div>
                  <h4 className="font-black text-gray-900 text-sm">
                    {currentOrder.user?.fullName || "Customer"}
                  </h4>
                  <div className="flex items-start gap-1 text-xs text-gray-600 mt-0.5">
                    <FaLocationDot className="text-blue-500 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">
                      {currentOrder.deliveryAddress?.text || "Doorstep Address"}
                    </span>
                  </div>
                </div>

                <div className="pt-1 text-xs border-t border-blue-200/60">
                  {currentOrder.user?.mobile ? (
                    <a
                      href={`tel:${currentOrder.user.mobile}`}
                      className="inline-flex items-center gap-1 text-blue-700 font-bold hover:underline"
                    >
                      <FaPhone size={10} />
                      <span>Call Customer: {currentOrder.user.mobile}</span>
                    </a>
                  ) : (
                    <span className="text-gray-400">Phone not shared</span>
                  )}
                </div>
              </div>

              {/* 3. ORDER SUMMARY / TOTAL */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                    Order Items ({currentOrder.shopOrder?.shopOrderItems?.length || 0})
                  </span>
                  <div className="text-xs text-gray-700 mt-1 space-y-1">
                    {currentOrder.shopOrder?.shopOrderItems?.map((item) => (
                      <div key={item._id} className="flex justify-between text-[11px]">
                        <span className="truncate max-w-[130px]">{item.name} × {item.quantity}</span>
                        <span className="font-bold">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200 flex items-center justify-between font-black text-gray-900 text-sm">
                  <span>Total Bill:</span>
                  <span className="text-emerald-600 text-base">₹{currentOrder.shopOrder?.subTotal}</span>
                </div>
              </div>

            </div>

            {/* PICKUP FOOD BUTTON (CHANGES STATUS OF FOOD) */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                  Kitchen Step 1
                </span>
                <p className="text-xs font-bold text-gray-900">
                  {isFoodPickedUp
                    ? "✓ Food Picked Up from Restaurant Kitchen"
                    : "Collect prepared packages from the restaurant"}
                </p>
              </div>

              {!isFoodPickedUp ? (
                <button
                  onClick={handlePickupOrder}
                  disabled={loading}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-sm transition active:scale-95 disabled:opacity-60 flex items-center gap-1.5"
                >
                  <FaBoxOpen size={14} />
                  <span>{loading ? "Updating..." : "Confirm Food Picked Up"}</span>
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold">
                  <FaCircleCheck size={12} />
                  <span>Food In Transit</span>
                </span>
              )}
            </div>

            {pickupSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold">
                {pickupSuccess}
              </div>
            )}

            {/* LIVE GPS ROUTE MAP WITH DISTANCE COUNTER */}
            {customerLat && customerLon && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <FaRoute className="text-orange-600" />
                    <span>Live GPS Distance: {distanceFormatted}</span>
                  </span>

                  {/* Dev Simulation Button */}
                  <button
                    onClick={handleSimulateArrival}
                    className="text-[11px] font-bold text-orange-600 hover:text-orange-700 underline"
                  >
                    ⚡ [Dev/Demo] Simulate Arriving within 100m
                  </button>
                </div>

                <div className="rounded-3xl overflow-hidden border border-gray-200">
                  <DeliveryBoyTracking
                    data={{
                      deliveryBoyLocation: {
                        lat: riderLat,
                        lon: riderLon,
                      },
                      customerLocation: {
                        lat: customerLat,
                        lon: customerLon,
                      },
                    }}
                    title="Live Rider to Customer Route"
                  />
                </div>
              </div>
            )}

            {/* 100-METER RANGE CHECK & OTP DELIVERY COMPLETION */}
            <div className="pt-2 border-t border-gray-100 space-y-4">
              {otpError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                  {otpError}
                </div>
              )}

              {/* Range status alert */}
              {!isWithin100Meters ? (
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gray-200 text-gray-600 flex items-center justify-center shrink-0">
                      <FiAlertCircle size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">
                        Delivery OTP Locked (Distance: {distanceFormatted})
                      </p>
                      <p className="text-[11px] text-gray-500">
                        You must be within <strong>100 meters</strong> of customer doorstep to request delivery OTP and finish delivery.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleSimulateArrival}
                    className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shrink-0 transition"
                  >
                    Simulate &lt; 100m Arrival
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2">
                  <FaCircleCheck size={14} className="text-emerald-600 shrink-0" />
                  <span>Doorstep In-Range: You are within 100 meters of customer! OTP option unlocked.</span>
                </div>
              )}

              {/* Request OTP & Verify Box */}
              {!showOtpBox ? (
                <button
                  onClick={sendOtp}
                  disabled={loading || !isWithin100Meters}
                  className={`w-full py-3.5 font-bold rounded-2xl text-sm flex items-center justify-center gap-2 transition duration-200 ${
                    isWithin100Meters
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25 active:scale-[0.99] cursor-pointer"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <FaCircleCheck size={16} />
                  <span>
                    {loading
                      ? "Triggering OTP..."
                      : isWithin100Meters
                      ? "Arrived at Doorstep (< 100m) — Request Delivery OTP"
                      : "Arrive Within 100m to Request Delivery OTP"}
                  </span>
                </button>
              ) : (
                <div className="p-5 rounded-2xl bg-orange-50/80 border border-orange-200 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-orange-950">
                    <FiKey className="text-orange-600" />
                    <span>Enter Customer Delivery OTP</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    A 4-digit confirmation code was sent to <strong>{currentOrder.user?.fullName}</strong>. Ask customer for the code upon food handoff.
                  </p>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="1234"
                      className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-center text-lg font-mono font-bold tracking-widest text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                    />
                    <button
                      onClick={verifyOtp}
                      disabled={loading}
                      className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-sm transition active:scale-95 disabled:opacity-60"
                    >
                      {loading ? "Verifying..." : "Confirm & Deliver"}
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ---------------- AVAILABLE ASSIGNMENTS FEED ---------------- */}
        {!currentOrder && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-gray-900 tracking-tight">
                  Available Delivery Requests
                </h2>
                <p className="text-xs text-gray-500">
                  Broadcasted orders within 5 km ready for pickup
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {availableAssignments.length} Available
              </span>
            </div>

            {availableAssignments.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-200/80 p-12 text-center space-y-4 shadow-xs">
                <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
                  <FiRadio size={28} className="animate-pulse" />
                </div>
                <h3 className="text-base font-bold text-gray-900">
                  Radar Active — Listening for New Orders in 5 km Range
                </h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  When local restaurants finish preparing meals and dispatch them, pickup notifications will display here automatically.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableAssignments.map((a) => (
                  <div
                    key={a.assignmentId}
                    className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm hover:shadow-md transition space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                          <FaStore size={18} />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-base">
                            {a.shopName}
                          </h3>
                          <p className="text-xs text-gray-500">
                            Restaurant: {a.shop?.address || "Pickup"} • Owner: {a.shop?.owner?.fullName || "Partner"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 font-black text-emerald-600 text-base">
                        <FaIndianRupeeSign size={14} />
                        <span>{a.subTotal}</span>
                      </div>
                    </div>

                    {/* Customer Destination */}
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-start gap-2 text-xs text-gray-700">
                      <FaLocationDot className="text-orange-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block text-gray-900">Customer: {a.user?.fullName}</span>
                        <span>{a.deliveryAddress?.text || "Customer Address"}</span>
                      </div>
                    </div>

                    {/* Food Items */}
                    <div className="flex flex-wrap gap-2">
                      {a.items?.map((item) => (
                        <span
                          key={item._id}
                          className="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-lg font-medium"
                        >
                          {item.name} × {item.quantity}
                        </span>
                      ))}
                    </div>

                    <div className="pt-2 flex items-center justify-end">
                      <button
                        onClick={() => acceptOrder(a.assignmentId)}
                        disabled={loading}
                        className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-sm shadow-orange-500/25 active:scale-95 transition disabled:opacity-60"
                      >
                        {loading ? "Accepting..." : "Accept Delivery Mission"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

      </main>
    </div>
  );
}

export default DeliveryDashboard;
