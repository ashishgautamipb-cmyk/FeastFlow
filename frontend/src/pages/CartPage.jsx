import React from "react";
import { IoIosArrowRoundBack } from "react-icons/io";
import { FiShoppingBag, FiShield, FiArrowRight, FiPercent } from "react-icons/fi";
import { FaLocationDot, FaIndianRupeeSign } from "react-icons/fa6";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import CartItemCard from "../components/CartItemCard";

function CartPage() {
  const navigate = useNavigate();
  const { cartItems, totalAmount, currentCity } = useSelector((state) => state.user);

  const deliveryFee = totalAmount > 500 || totalAmount === 0 ? 0 : 50;
  const platformFee = totalAmount > 0 ? 5 : 0;
  const finalTotal = totalAmount + deliveryFee + platformFee;

  return (
    <div className="min-h-screen bg-[#fafafa] px-4 py-8 flex justify-center">
      <div className="w-full max-w-4xl space-y-6">
        
        {/* HEADER */}
        <div className="flex items-center justify-between">
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
                Your Order Cart
              </h1>
              <p className="text-xs text-gray-500">
                {cartItems?.length || 0} unique item{cartItems?.length === 1 ? "" : "s"} selected
              </p>
            </div>
          </div>

          {currentCity && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200/60 text-xs font-semibold text-orange-700">
              <FaLocationDot size={12} className="text-orange-500" />
              <span>{currentCity}</span>
            </div>
          )}
        </div>

        {/* EMPTY CART STATE */}
        {!cartItems || cartItems.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200/80 p-12 text-center shadow-xs space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-orange-50 text-orange-500 mx-auto flex items-center justify-center">
              <FiShoppingBag size={36} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Your feast is waiting to start</h2>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Your cart is currently empty. Explore our catalog of delicious cuisines and hand-crafted dishes!
            </p>
            <div className="pt-2">
              <button
                onClick={() => navigate("/")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold rounded-2xl shadow-md shadow-orange-500/25 hover:from-orange-700 hover:to-orange-600 active:scale-95 transition text-sm"
              >
                <span>Browse Menu</span>
                <FiArrowRight />
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* CART ITEMS LIST */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Review Items
                </span>
                <button
                  onClick={() => navigate("/")}
                  className="text-xs font-bold text-orange-600 hover:underline"
                >
                  + Add more dishes
                </button>
              </div>

              <div className="space-y-3">
                {cartItems.map((item) => (
                  <CartItemCard data={item} key={item.id} />
                ))}
              </div>

              {/* Delivery Promotion Pill */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/70 flex items-center gap-3 text-xs text-emerald-800 font-medium">
                <div className="w-7 h-7 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <FiPercent size={14} />
                </div>
                <span>
                  {totalAmount >= 500
                    ? "🎉 You unlocked FREE Delivery on this order!"
                    : `Add ₹${500 - totalAmount} more to qualify for FREE Delivery!`}
                </span>
              </div>
            </div>

            {/* ORDER SUMMARY */}
            <div className="space-y-4">
              <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
                  Bill Summary
                </h3>

                <div className="space-y-2.5 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Item Total</span>
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
                    <span>Platform & Handling Fee</span>
                    <span className="font-semibold text-gray-900">₹{platformFee}</span>
                  </div>

                  <div className="border-t border-gray-100 pt-3 flex justify-between items-baseline text-sm font-black text-gray-900">
                    <span>To Pay</span>
                    <span className="text-lg text-orange-600">₹{finalTotal}</span>
                  </div>
                </div>

                <button
                  onClick={() => navigate("/checkout")}
                  className="w-full mt-2 py-3.5 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-bold rounded-2xl shadow-md shadow-orange-500/25 active:scale-[0.99] transition duration-200 flex items-center justify-center gap-2 text-sm"
                >
                  <span>Proceed to Checkout</span>
                  <FiArrowRight size={16} />
                </button>
              </div>

              {/* Trust Badge */}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400 font-medium">
                <FiShield className="text-emerald-500 text-base" />
                <span>Encrypted checkout & verified restaurants</span>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default CartPage;
