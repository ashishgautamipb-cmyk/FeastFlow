import React, { useState } from "react";
import { MdEmail, MdOutlinePhone } from "react-icons/md";
import { FaIndianRupeeSign, FaLocationDot, FaStore, FaMotorcycle } from "react-icons/fa6";
import { FiClock, FiUser, FiPackage, FiCheck } from "react-icons/fi";
import axios from "axios";
import { serverurl } from "../App";
import { useDispatch } from "react-redux";
import { updateOrderStatus } from "../redux/userSlice";

function OwnerOrderCard({ data }) {
  const [availableBoysMap, setAvailableBoysMap] = useState({});
  const [loadingShopId, setLoadingShopId] = useState(null);
  const [fetchingRidersShopId, setFetchingRidersShopId] = useState(null);
  const dispatch = useDispatch();

  const handleUpdateStatus = async (orderId, shopId, status) => {
    try {
      setLoadingShopId(shopId);
      const res = await axios.post(
        `${serverurl}/api/order/update-status/${orderId}/${shopId}`,
        { status },
        { withCredentials: true },
      );

      dispatch(updateOrderStatus({ orderId, shopId, status }));

      if (res.data.availableBoys?.length > 0) {
        setAvailableBoysMap((prev) => ({
          ...prev,
          [shopId]: res.data.availableBoys,
        }));
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoadingShopId(null);
    }
  };

  const fetchNearbyRiders = async (shopId) => {
    try {
      setFetchingRidersShopId(shopId);
      const res = await axios.get(
        `${serverurl}/api/order/nearby-riders/${shopId}`,
        { withCredentials: true },
      );

      if (res.data.success) {
        setAvailableBoysMap((prev) => ({
          ...prev,
          [shopId]: res.data.riders || [],
        }));
      }
    } catch (err) {
      console.log("FETCH NEARBY RIDERS ERROR:", err);
    } finally {
      setFetchingRidersShopId(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "out of delivery":
      case "out for delivery":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "preparing":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-orange-50 text-orange-700 border-orange-200";
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-200/80 p-6 space-y-6 hover:shadow-md transition">
      
      {/* HEADER: CUSTOMER DETAILS & ORDER META */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-gray-900">
              Order #{data?._id?.slice(-6).toUpperCase()}
            </span>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 uppercase tracking-wider">
              {data?.paymentMethod === "online" ? "Prepaid Online" : "Cash on Delivery"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 pt-0.5">
            <span className="flex items-center gap-1 font-semibold text-gray-800">
              <FiUser size={12} className="text-orange-500" />
              {data?.user?.fullName || "Customer"}
            </span>
            {data?.user?.email && (
              <span className="flex items-center gap-1">
                <MdEmail size={13} />
                {data?.user?.email}
              </span>
            )}
            {data?.user?.mobile && (
              <a
                href={`tel:${data?.user?.mobile}`}
                className="flex items-center gap-1 text-orange-600 font-semibold hover:underline"
              >
                <MdOutlinePhone size={13} />
                {data?.user?.mobile}
              </a>
            )}
          </div>
        </div>

        {/* Destination Address Pill */}
        <div className="p-2.5 rounded-2xl bg-gray-50 border border-gray-100 max-w-sm text-xs text-gray-600">
          <div className="flex items-start gap-1.5">
            <FaLocationDot className="text-orange-600 text-xs shrink-0 mt-0.5" />
            <span className="line-clamp-2">{data?.deliveryAddress?.text || "Standard Delivery Address"}</span>
          </div>
        </div>
      </div>

      {/* SHOP ORDERS IN THIS TICKET */}
      {data?.shopOrders?.map((shopOrder) => {
        const availableBoys = availableBoysMap[shopOrder.shop?._id] || [];

        return (
          <div
            key={shopOrder._id}
            className="rounded-2xl border border-gray-200 bg-gray-50/50 p-5 space-y-4"
          >
            {/* KITCHEN CONTROLS & STATUS SELECTOR */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs">
                  <FaStore size={14} />
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase font-semibold">Kitchen Subtotal</span>
                  <div className="flex items-center gap-0.5 font-black text-gray-900 text-sm">
                    <FaIndianRupeeSign size={12} />
                    <span>{shopOrder?.subTotal}</span>
                  </div>
                </div>
              </div>

              {/* Status Selector Dropdown */}
              <div className="flex items-center gap-3">
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${getStatusColor(shopOrder.status)}`}>
                  {shopOrder.status}
                </span>

                <select
                  value={shopOrder.status}
                  disabled={loadingShopId === shopOrder.shop?._id}
                  onChange={(e) =>
                    handleUpdateStatus(
                      data._id,
                      shopOrder.shop?._id,
                      e.target.value,
                    )
                  }
                  className="bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-800 shadow-2xs focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="pending">Pending</option>
                  <option value="preparing">Preparing</option>
                  <option value="out of delivery">Dispatch Rider</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>
            </div>

            {/* FOOD ITEMS TO PREPARE */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Kitchen Items to Cook / Pack
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {shopOrder?.shopOrderItems?.map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-gray-200/80 shadow-2xs"
                  >
                    <img
                      src={item?.item?.image || "/vite.svg"}
                      alt={item?.name}
                      className="w-12 h-12 object-cover rounded-xl bg-gray-50"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-gray-900 truncate">{item?.name}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Qty: <strong className="text-orange-600 font-extrabold">{item.quantity}</strong> • ₹{item.price} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* DELIVERY RIDER ASSIGNMENT STATUS */}
            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Fleet Dispatch & 5 km Rider Radius
                </span>

                {!shopOrder.assignedDeliveryBoy && (
                  <button
                    onClick={() => fetchNearbyRiders(shopOrder.shop?._id || shopOrder.shop)}
                    disabled={fetchingRidersShopId === (shopOrder.shop?._id || shopOrder.shop)}
                    className="text-[11px] font-bold text-orange-600 hover:text-orange-700 underline flex items-center gap-1 cursor-pointer"
                  >
                    <FaMotorcycle size={11} />
                    <span>
                      {fetchingRidersShopId === (shopOrder.shop?._id || shopOrder.shop)
                        ? "Scanning Fleet..."
                        : "Scan Available Riders (5 km)"}
                    </span>
                  </button>
                )}
              </div>

              {shopOrder.assignedDeliveryBoy ? (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between text-xs text-emerald-900">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold">
                      <FaMotorcycle size={14} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                        Assigned Rider On The Road
                      </span>
                      <span className="font-bold text-sm">
                        {shopOrder.assignedDeliveryBoy.fullName}
                      </span>
                    </div>
                  </div>
                  {shopOrder.assignedDeliveryBoy.mobile && (
                    <a
                      href={`tel:${shopOrder.assignedDeliveryBoy.mobile}`}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition"
                    >
                      Call: {shopOrder.assignedDeliveryBoy.mobile}
                    </a>
                  )}
                </div>
              ) : availableBoys.length > 0 ? (
                <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-950 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-blue-900 flex items-center gap-1.5">
                      <FaMotorcycle className="text-blue-600" />
                      <span>{availableBoys.length} Available Riders in 5 km Range:</span>
                    </span>
                    <span className="text-[10px] font-bold bg-blue-200/70 text-blue-800 px-2 py-0.5 rounded-md">
                      Broadcasting Active
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {availableBoys.map((b) => (
                      <div
                        key={b.id || b._id}
                        className="p-2.5 bg-white rounded-xl border border-blue-100 flex items-center justify-between shadow-2xs"
                      >
                        <div>
                          <p className="font-bold text-xs text-gray-900">{b.fullName}</p>
                          <p className="text-[11px] text-gray-500">
                            {b.distanceKm != null ? `📍 ${b.distanceKm} km away` : "📍 Nearby (< 5 km)"}
                          </p>
                        </div>
                        {b.mobile && (
                          <a
                            href={`tel:${b.mobile}`}
                            className="text-[11px] font-bold text-blue-600 hover:underline"
                          >
                            {b.mobile}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-gray-100 text-xs text-gray-500 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FiClock size={14} />
                    <span>Select 'Dispatch Rider' to broadcast to fleet within 5 km.</span>
                  </div>
                  <button
                    onClick={() => handleUpdateStatus(data._id, shopOrder.shop?._id || shopOrder.shop, "out of delivery")}
                    className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition"
                  >
                    Dispatch Now
                  </button>
                </div>
              )}
            </div>

          </div>
        );
      })}

    </div>
  );
}

export default OwnerOrderCard;
