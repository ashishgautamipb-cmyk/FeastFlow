import React, { useEffect } from "react";
import { IoIosArrowRoundBack } from "react-icons/io";
import { FiShoppingBag } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import OwnerOrderCard from "../components/OwnerOrderCard";
import UserOrderCard from "../components/UserOrderCard";
import { setMyOrders } from "../redux/userSlice";

function MyOrders() {
  const { userData, myOrders, socket } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (!socket) return;

    const updateOrders = (order) => {
      dispatch(
        setMyOrders((prev) => {
          const exists = prev.find((o) => o._id === order._id);
          if (exists) {
            return prev.map((o) => (o._id === order._id ? order : o));
          }
          return [order, ...prev];
        }),
      );
    };

    socket.on("newOrder", updateOrders);
    socket.on("orderUpdated", updateOrders);

    return () => {
      socket.off("newOrder", updateOrders);
      socket.off("orderUpdated", updateOrders);
    };
  }, [socket]);

  return (
    <div className="w-full min-h-screen bg-[#fafafa] flex justify-center px-4 py-8">
      <div className="w-full max-w-4xl space-y-6">
        
        {/* ================= HEADER ================= */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            aria-label="Back to home"
            className="p-2.5 rounded-2xl bg-white border border-gray-200/80 shadow-xs hover:border-orange-500 hover:text-orange-600 transition"
          >
            <IoIosArrowRoundBack size={26} />
          </button>

          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              {userData?.role === "owner" ? "Restaurant Order Queue" : "Order History"}
            </h1>
            <p className="text-xs text-gray-500">
              {myOrders?.length || 0} order{myOrders?.length === 1 ? "" : "s"} placed on FeastFlow
            </p>
          </div>
        </div>

        {/* ================= ORDERS LIST ================= */}
        <div className="space-y-5">
          {myOrders && myOrders.length > 0 ? (
            myOrders.map((order, index) =>
              userData?.role === "user" ? (
                <UserOrderCard key={order._id || index} data={order} />
              ) : userData?.role === "owner" ? (
                <OwnerOrderCard key={order._id || index} data={order} />
              ) : null,
            )
          ) : (
            <div className="bg-white rounded-3xl border border-gray-200/80 p-12 text-center shadow-xs space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-orange-50 text-orange-500 mx-auto flex items-center justify-center">
                <FiShoppingBag size={28} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No orders found</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                {userData?.role === "owner"
                  ? "Incoming customer orders for your restaurant will appear here in real-time."
                  : "You haven't placed any orders yet. Discover delicious foods and order your first meal!"}
              </p>
              {userData?.role === "user" && (
                <button
                  onClick={() => navigate("/")}
                  className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-xl text-xs font-bold shadow-sm hover:from-orange-700 hover:to-orange-600 transition"
                >
                  Explore Dishes
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default MyOrders;
