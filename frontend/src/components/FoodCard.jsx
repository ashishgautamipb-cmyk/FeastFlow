import React from "react";
import { FaStar, FaMinus, FaPlus, FaCartPlus } from "react-icons/fa6";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, updateQuantity, removeCartItem } from "../redux/userSlice";

function FoodCard({ data }) {
  const dispatch = useDispatch();
  const { cartItems } = useSelector((state) => state.user);

  // Find if this item is already in the Redux cart
  const cartItem = cartItems?.find((item) => String(item.id) === String(data._id));
  const inCartQuantity = cartItem ? cartItem.quantity : 0;

  const handleAddFirstTime = () => {
    dispatch(
      addToCart({
        id: data._id,
        name: data.name,
        price: data.price,
        image: data.image,
        shop: data.shop,
        quantity: 1,
        foodType: data.foodType,
      })
    );
  };

  const handleIncrease = () => {
    if (cartItem) {
      dispatch(updateQuantity({ id: data._id, quantity: inCartQuantity + 1 }));
    } else {
      handleAddFirstTime();
    }
  };

  const handleDecrease = () => {
    if (inCartQuantity > 1) {
      dispatch(updateQuantity({ id: data._id, quantity: inCartQuantity - 1 }));
    } else if (inCartQuantity === 1) {
      dispatch(removeCartItem(data._id));
    }
  };

  const ratingAvg = data?.rating?.average || 4.5;
  const ratingCount = data?.rating?.count || 12;

  return (
    <div className="group relative bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_30px_-6px_rgba(0,0,0,0.12)] transition-all duration-300 flex flex-col overflow-hidden hover:-translate-y-1">
      {/* FOOD IMAGE & BADGES */}
      <div className="relative w-full h-[180px] overflow-hidden bg-gray-100">
        <img
          src={data.image}
          alt={data.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Gradient shadow for contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 opacity-60" />

        {/* VEG / NON-VEG FSSAI STANDARD BADGE */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2 py-1 rounded-md shadow-sm flex items-center gap-1.5 border border-white/40">
          <span
            className={`w-3.5 h-3.5 border-2 flex items-center justify-center rounded-[3px] ${
              data.foodType === "veg"
                ? "border-green-600"
                : "border-red-600"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                data.foodType === "veg" ? "bg-green-600" : "bg-red-600"
              }`}
            />
          </span>
          <span className="text-[10px] font-bold tracking-wider uppercase text-gray-700">
            {data.foodType === "veg" ? "Veg" : "Non-Veg"}
          </span>
        </div>

        {/* CATEGORY CHIP */}
        {data.category && (
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-medium text-white tracking-wide">
            {data.category}
          </div>
        )}
      </div>

      {/* CONTENT INFO */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* Rating & Shop */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded-md text-amber-700">
              <FaStar className="text-amber-500 text-xs" />
              <span className="text-xs font-bold">{Number(ratingAvg).toFixed(1)}</span>
              <span className="text-[10px] text-gray-500">({ratingCount})</span>
            </div>

            {data?.shop?.name && (
              <span className="text-xs font-medium text-gray-500 truncate max-w-[120px]" title={data.shop.name}>
                {data.shop.name}
              </span>
            )}
          </div>

          {/* Dish Name */}
          <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-1 group-hover:text-orange-600 transition-colors" title={data.name}>
            {data.name}
          </h3>
        </div>

        {/* PRICE & INTERACTIVE ADD-TO-CART BUTTON */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Price</span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-lg font-black text-gray-900">₹{data.price}</span>
            </div>
          </div>

          {/* Action: Add or Stepper */}
          {inCartQuantity === 0 ? (
            <button
              onClick={handleAddFirstTime}
              className="flex items-center gap-1.5 px-4 py-2 bg-orange-50 hover:bg-orange-500 text-orange-600 hover:text-white border border-orange-200 hover:border-orange-500 rounded-xl font-bold text-xs uppercase tracking-wider shadow-xs hover:shadow-md transition-all active:scale-95"
            >
              <FaCartPlus size={13} />
              <span>Add</span>
            </button>
          ) : (
            <div className="flex items-center bg-orange-600 text-white rounded-xl shadow-sm shadow-orange-500/30 overflow-hidden font-bold">
              <button
                onClick={handleDecrease}
                className="px-2.5 py-2 hover:bg-orange-700 active:scale-90 transition text-xs"
                aria-label="Decrease quantity"
              >
                <FaMinus size={11} />
              </button>
              <span className="px-2.5 text-xs font-extrabold select-none">
                {inCartQuantity}
              </span>
              <button
                onClick={handleIncrease}
                className="px-2.5 py-2 hover:bg-orange-700 active:scale-90 transition text-xs"
                aria-label="Increase quantity"
              >
                <FaPlus size={11} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FoodCard;
