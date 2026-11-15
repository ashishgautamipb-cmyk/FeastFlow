import React from "react";
import { FaCircleCheck, FaBagShopping, FaArrowRight } from "react-icons/fa6";
import { HiSparkles } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";

function OrderPlaced() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50/50 flex flex-col justify-center items-center px-4 text-center relative overflow-hidden">
      
      {/* Decorative Glow */}
      <div className="absolute w-96 h-96 bg-orange-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.08)] p-8 sm:p-12 max-w-lg w-full relative z-10 space-y-6">
        
        {/* Success Icon */}
        <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-500 mx-auto flex items-center justify-center ring-8 ring-emerald-500/10 shadow-sm animate-in zoom-in-50 duration-300">
          <FaCircleCheck size={44} />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-bold uppercase tracking-wider">
            <HiSparkles />
            <span>Order Confirmed</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Your Feast is on Its Way!
          </h1>

          <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
            Thank you for ordering with FeastFlow. The restaurant is preparing your food with verified hygiene standards.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate("/my-orders")}
            className="flex-1 py-3 px-5 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-bold rounded-2xl shadow-md shadow-orange-500/25 active:scale-95 transition text-sm flex items-center justify-center gap-2"
          >
            <span>Track in My Orders</span>
            <FaArrowRight size={13} />
          </button>

          <button
            onClick={() => navigate("/")}
            className="py-3 px-5 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-2xl active:scale-95 transition text-sm flex items-center justify-center gap-2"
          >
            <FaBagShopping size={14} className="text-gray-400" />
            <span>Order More</span>
          </button>
        </div>

      </div>
    </div>
  );
}

export default OrderPlaced;
