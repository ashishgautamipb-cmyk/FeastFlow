import React from "react";
import { useSelector } from "react-redux";
import UserDashboard from "../components/UserDashboard";
import OwnerDashboard from "../components/OwnerDashboard";
import DeliveryDashboard from "../components/DeliveryDashboard";
import { useLocation } from "react-router-dom";

const Home = () => {
  const { userData } = useSelector((state) => state.user);
  const location = useLocation();

  // wait for user
  if (!userData) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-[#fafafa] gap-3">
        <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Loading FeastFlow...</p>
      </div>
    );
  }

  return (
    <div>
      {userData.role === "user" && <UserDashboard />}
      {userData.role === "owner" && <OwnerDashboard />}
      {userData.role === "deliveryBoy" && <DeliveryDashboard />}
    </div>
  );
};

export default Home;
