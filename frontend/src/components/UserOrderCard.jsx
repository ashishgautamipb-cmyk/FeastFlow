import axios from "axios";
import React, { useState } from "react";
import { FaRupeeSign, FaStar, FaRegStar, FaLocationDot } from "react-icons/fa6";
import { FiClock, FiShoppingBag, FiTruck } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { serverurl } from "../App";

function UserOrderCard({ data }) {
  const [selectedRating, setSelectedRating] = useState({});
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlerating = async (itemId, rating) => {
    try {
      await axios.post(
        `${serverurl}/api/item/rating`,
        { itemId, rating },
        { withCredentials: true },
      );

      setSelectedRating((prev) => ({
        ...prev,
        [itemId]: rating,
      }));
    } catch (error) {
      console.log("RATING ERROR:", error);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "out of delivery":
      case "out for delivery":
        return "bg-blue-50 text-blue-700 border-blue-200 animate-pulse";
      case "preparing":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-orange-50 text-orange-700 border-orange-200";
    }
  };

  const overallStatus = data?.shopOrders?.[0]?.status || "pending";

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-200/80 p-6 space-y-5 hover:shadow-md transition">
      
      {/* HEADER: ORDER ID, DATE, PAYMENT */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-gray-900 tracking-tight">
              Order #{data._id.slice(-6).toUpperCase()}
            </span>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${getStatusBadge(overallStatus)}`}>
              {overallStatus}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
            <FiClock size={13} />
            <span>Placed on {formatDate(data.createdAt)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-xl font-bold uppercase tracking-wider">
            {data.paymentMethod === "online" ? "Online (Prepaid)" : "Cash on Delivery"}
          </span>
        </div>
      </div>

      {/* SHOP ORDERS LIST */}
      <div className="space-y-4">
        {data.shopOrders?.map((shopOrder, sIdx) => (
          <div
            key={sIdx}
            className="bg-gray-50/70 border border-gray-100 rounded-2xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900 text-sm">
                {shopOrder.shop?.name || "Restaurant"}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${getStatusBadge(shopOrder.status)}`}>
                {shopOrder.status}
              </span>
            </div>

            {/* ORDER ITEMS */}
            <div className="space-y-2">
              {shopOrder.shopOrderItems?.map((item, iIdx) => (
                <div
                  key={iIdx}
                  className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.item?.image || "/vite.svg"}
                      alt={item.name}
                      className="w-12 h-12 rounded-xl object-cover bg-gray-100"
                    />
                    <div>
                      <p className="font-semibold text-gray-900 text-xs sm:text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Qty: <strong>{item.quantity}</strong> × ₹{item.price}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="font-bold text-gray-900 text-xs sm:text-sm">
                      ₹{item.price * item.quantity}
                    </span>

                    {/* Star Rating on Delivered items */}
                    {(shopOrder.status === "delivered" || shopOrder.status === "out of delivery") && item.item?._id && (
                      <div className="flex items-center gap-0.5 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => handlerating(item.item._id, star)}
                            className="text-xs p-0.5 hover:scale-125 transition"
                            title={`Rate ${star} star`}
                          >
                            {(selectedRating[item.item._id] || 0) >= star ? (
                              <FaStar className="text-amber-400" />
                            ) : (
                              <FaRegStar className="text-gray-300" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between text-xs text-gray-600 pt-1">
              <span>Subtotal for this kitchen</span>
              <span className="font-bold text-gray-900">₹{shopOrder.subTotal}</span>
            </div>
          </div>
        ))}
      </div>

      {/* FOOTER: TOTAL & TRACK BUTTON */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div>
          <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block">Total Paid</span>
          <span className="text-lg font-black text-gray-900">₹{data.totalAmount}</span>
        </div>

        <button
          onClick={() => navigate(`/track-order/${data._id}`)}
          className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm shadow-orange-500/25 active:scale-95 transition"
        >
          <FiTruck size={14} />
          <span>Live Order Tracking</span>
        </button>
      </div>

    </div>
  );
}

export default UserOrderCard;
