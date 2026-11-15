import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { serverurl } from "../App";
import { IoIosArrowRoundBack } from "react-icons/io";
import { 
  FaMotorcycle, 
  FaStore, 
  FaPhone, 
  FaLocationDot, 
  FaCheck, 
  FaClock, 
  FaCircleCheck,
  FaUtensils,
  FaShieldHalved,
  FaKey,
} from "react-icons/fa6";
import { FiPackage, FiShoppingBag, FiTruck } from "react-icons/fi";
import DeliveryBoyTracking from "../components/DeliveryBoyTracking";

function TrackOrderPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { socket } = useSelector((state) => state.user);

  const [currentOrder, setCurrentOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liveRiderCoords, setLiveRiderCoords] = useState(null);
  const [deliveryOtp, setDeliveryOtp] = useState(null);

  // ---------------- Fetch Order ----------------
  const fetchOrder = async () => {
    try {
      const result = await axios.get(
        `${serverurl}/api/order/get-order-by-id/${orderId}`,
        { withCredentials: true },
      );

      if (result.data.success) {
        setCurrentOrder(result.data.order);
      }
    } catch (error) {
      console.log("Error fetching order:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  // Real-time socket updates for rider location, order status, and OTP
  useEffect(() => {
    if (!socket || !orderId) return;

    socket.emit("joinOrder", { orderId });

    socket.on("riderLocationChanged", ({ lat, lon }) => {
      setLiveRiderCoords({ lat, lon });
    });

    socket.on("orderStatusChanged", ({ status, shopOrderId }) => {
      fetchOrder();
    });

    socket.on("deliveryOtpNotification", ({ otp }) => {
      setDeliveryOtp(otp);
    });

    return () => {
      socket.off("riderLocationChanged");
      socket.off("orderStatusChanged");
      socket.off("deliveryOtpNotification");
    };
  }, [socket, orderId]);

  // Status step calculation
  const getStepIndex = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return 1;
      case "preparing":
        return 2;
      case "picked up":
      case "out of delivery":
      case "out for delivery":
        return 3;
      case "delivered":
        return 4;
      default:
        return 1;
    }
  };

  const steps = [
    { title: "Order Confirmed", desc: "Sent to kitchen", icon: FiPackage },
    { title: "Preparing Food", desc: "Freshly cooking", icon: FaUtensils },
    { title: "Picked Up & Out", desc: "Rider on the road", icon: FaMotorcycle },
    { title: "Delivered", desc: "Enjoy your feast!", icon: FaCircleCheck },
  ];

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-[#fafafa] gap-3">
        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Locating your delivery...</p>
      </div>
    );
  }

  if (!currentOrder) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-[#fafafa] px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mb-4">
          <FiPackage size={28} />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Order Not Found</h2>
        <p className="text-xs text-gray-500 mt-1 max-w-sm">
          We could not locate this order tracking reference. It may have expired or been moved.
        </p>
        <button
          onClick={() => navigate("/")}
          className="mt-5 px-5 py-2.5 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 transition"
        >
          Back to FeastFlow Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] px-4 py-8 flex justify-center">
      <div className="w-full max-w-4xl space-y-6">
        
        {/* HEADER BAR */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/my-orders")}
              aria-label="Back to My Orders"
              className="p-2.5 rounded-2xl bg-white border border-gray-200/80 shadow-xs hover:border-orange-500 hover:text-orange-600 transition"
            >
              <IoIosArrowRoundBack size={26} />
            </button>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                Live Order Tracking
              </h1>
              <p className="text-xs text-gray-500">
                Order #{currentOrder._id.slice(-6).toUpperCase()} • Tracking in Real-Time
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-xs font-bold text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>GPS Active</span>
          </div>
        </div>

        {/* LOOP THROUGH ALL SHOP ORDERS IN THIS CHECKOUT */}
        {currentOrder.shopOrders.map((shopOrder, index) => {
          const deliveryBoy = shopOrder.assignedDeliveryBoy;
          const currentStep = getStepIndex(shopOrder.status);

          let deliveryLat = liveRiderCoords?.lat || null;
          let deliveryLon = liveRiderCoords?.lon || null;
          if (!deliveryLat && deliveryBoy && deliveryBoy.location?.coordinates) {
            deliveryLat = deliveryBoy.location.coordinates[1];
            deliveryLon = deliveryBoy.location.coordinates[0];
          }

          const customerLat = currentOrder.deliveryAddress?.latitude;
          const customerLon = currentOrder.deliveryAddress?.longitude;
          const activeOtp = deliveryOtp || shopOrder.deliveryOtp;

          return (
            <div
              key={shopOrder._id || index}
              className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6 sm:p-8 space-y-8"
            >
              {/* RESTAURANT HEADER */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                    <FaStore size={22} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-gray-900 tracking-tight">
                      {shopOrder.shop?.name || "Partner Restaurant"}
                    </h2>
                    <p className="text-xs text-gray-500">
                      Subtotal: <strong className="text-gray-900">₹{shopOrder.subTotal}</strong> • {shopOrder.shopOrderItems?.length || 0} items
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-200 uppercase tracking-wider">
                    {shopOrder.status}
                  </span>
                </div>
              </div>

              {/* ACTIVE DELIVERY OTP CARD (SHOWN TO CUSTOMER WHEN RIDER ARRIVES) */}
              {activeOtp && shopOrder.status !== "delivered" && (
                <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-5 animate-in fade-in duration-300">
                  <div className="space-y-1 text-center sm:text-left">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-200/80 text-amber-900 text-[10px] font-black uppercase tracking-wider">
                      <FaKey size={10} />
                      <span>Doorstep Delivery Verification Code</span>
                    </div>
                    <h3 className="text-lg font-black text-gray-900">
                      Your Delivery OTP
                    </h3>
                    <p className="text-xs text-gray-600 max-w-md">
                      Share this code with your FeastFlow delivery partner upon arrival to safely receive your food.
                    </p>
                  </div>

                  <div className="bg-white px-7 py-3 rounded-2xl border-2 border-amber-400 font-mono font-black text-4xl tracking-widest text-orange-600 shadow-sm">
                    {activeOtp}
                  </div>
                </div>
              )}

              {/* TIMELINE PROGRESS TRACKER */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Delivery Progress
                </h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {steps.map((step, idx) => {
                    const stepNum = idx + 1;
                    const isDone = currentStep >= stepNum;
                    const isCurrent = currentStep === stepNum;
                    const StepIcon = step.icon;

                    return (
                      <div
                        key={step.title}
                        className={`p-4 rounded-2xl border transition-all ${
                          isDone
                            ? "bg-orange-50/60 border-orange-200 text-orange-950"
                            : "bg-gray-50 border-gray-100 text-gray-400 opacity-60"
                        } ${isCurrent ? "ring-2 ring-orange-500 shadow-sm" : ""}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                              isDone ? "bg-orange-600 text-white" : "bg-gray-200 text-gray-500"
                            }`}
                          >
                            {isDone ? <FaCheck size={12} /> : stepNum}
                          </div>
                          <StepIcon size={16} className={isDone ? "text-orange-600" : "text-gray-400"} />
                        </div>
                        <p className="font-bold text-xs text-gray-900">{step.title}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">{step.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RIDER INFORMATION CARD */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-orange-50/70 to-amber-50/70 border border-orange-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-orange-600 font-bold border border-orange-100">
                    <FaMotorcycle size={22} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 block">
                      Dedicated Delivery Partner
                    </span>
                    <h4 className="text-sm font-black text-gray-900">
                      {deliveryBoy ? deliveryBoy.fullName : "Assigning Nearby Rider..."}
                    </h4>
                    {deliveryBoy && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        Verified FeastFlow Rider • Contact: {deliveryBoy.mobile}
                      </p>
                    )}
                  </div>
                </div>

                {deliveryBoy?.mobile && (
                  <a
                    href={`tel:${deliveryBoy.mobile}`}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-orange-600 text-gray-800 hover:text-white border border-gray-200 hover:border-orange-600 shadow-xs text-xs font-bold transition active:scale-95"
                  >
                    <FaPhone size={12} />
                    <span>Call Rider</span>
                  </a>
                )}
              </div>

              {/* LIVE LEAFLET ROUTE MAP */}
              {deliveryLat && deliveryLon && customerLat && customerLon ? (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Live Route GPS Navigation & Distance
                  </h3>
                  <div className="rounded-3xl overflow-hidden border border-gray-200 shadow-xs">
                    <DeliveryBoyTracking
                      data={{
                        deliveryBoyLocation: {
                          lat: deliveryLat,
                          lon: deliveryLon,
                        },
                        customerLocation: {
                          lat: customerLat,
                          lon: customerLon,
                        },
                      }}
                      title="Live Delivery Rider Tracker"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200/60 text-center space-y-1">
                  <p className="text-xs font-bold text-gray-700">GPS Live Map Waiting for Rider Coordinates</p>
                  <p className="text-[11px] text-gray-400">
                    Live road route activates as soon as the delivery partner accepts and shares live GPS coordinates.
                  </p>
                </div>
              )}

              {/* ITEMS ORDERED LIST */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Dishes in this Order
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {shopOrder.shopOrderItems?.map((item, idx) => (
                    <div
                      key={item._id || idx}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100"
                    >
                      <img
                        src={item.item?.image || "/vite.svg"}
                        alt={item.name}
                        className="w-12 h-12 rounded-xl object-cover bg-white"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-900 truncate">{item.name}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {item.quantity} × ₹{item.price} = <strong>₹{item.quantity * item.price}</strong>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* DESTINATION ADDRESS */}
              <div className="pt-2 flex items-start gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100 text-xs text-gray-700">
                <FaLocationDot className="text-orange-600 text-sm shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-gray-900">Destination Doorstep:</span>
                  <span className="text-gray-600">{currentOrder.deliveryAddress?.text || "Saved Address"}</span>
                </div>
              </div>

            </div>
          );
        })}

        {/* SAFETY & ASSURANCE BANNER */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400 font-medium">
          <FaShieldHalved className="text-emerald-500 text-sm" />
          <span>FeastFlow Contactless Delivery & Tamper-Evident Packaging Guaranteed</span>
        </div>

      </div>
    </div>
  );
}

export default TrackOrderPage;
