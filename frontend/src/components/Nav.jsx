import React, { useEffect, useState } from "react";
import { FaLocationDot, FaPlus } from "react-icons/fa6";
import { IoIosSearch } from "react-icons/io";
import { FiShoppingCart, FiLogOut, FiUser, FiPackage, FiCompass } from "react-icons/fi";
import { RxCross2 } from "react-icons/rx";
import { TbReceipt2 } from "react-icons/tb";
import { HiSparkles } from "react-icons/hi2";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { serverurl } from "../App";
import { setSearchItems, setUserData } from "../redux/userSlice";
import { setMyShopData } from "../redux/ownerSlice";

function Nav() {
  const { userData, currentCity, cartItems } = useSelector(
    (state) => state.user,
  );
  const { myShopData } = useSelector((state) => state.owner);

  const [showInfo, setShowInfo] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogOut = async () => {
    try {
      await axios.get(`${serverurl}/api/auth/signout`, {
        withCredentials: true,
      });
      dispatch(setUserData(null));
      dispatch(setMyShopData(null));
      navigate("/signin");
    } catch (error) {
      console.log("LOGOUT ERROR:", error);
    }
  };

  const handleSearchItems = async () => {
    try {
      const result = await axios.get(
        `${serverurl}/api/item/search-items?query=${query}&city=${currentCity || ""}`,
        { withCredentials: true },
      );
      if (result.data.success) {
        dispatch(setSearchItems(result.data.items));
      } else {
        dispatch(setSearchItems([]));
      }
    } catch (error) {
      console.log("SEARCH ERROR:", error);
    }
  };

  useEffect(() => {
    if (query.trim()) {
      handleSearchItems();
    } else {
      dispatch(setSearchItems(null));
    }
  }, [query]);

  if (!userData) return null;

  const totalCartCount = cartItems?.reduce((total, item) => total + (item.quantity || 1), 0) || 0;

  const getRoleBadge = (role) => {
    switch (role) {
      case "owner":
        return { label: "Restaurant Partner", color: "bg-purple-100 text-purple-700 border-purple-200" };
      case "deliveryBoy":
        return { label: "Delivery Partner", color: "bg-blue-100 text-blue-700 border-blue-200" };
      default:
        return { label: "Customer", color: "bg-emerald-100 text-emerald-700 border-emerald-200" };
    }
  };

  const roleInfo = getRoleBadge(userData.role);

  return (
    <nav className="w-full h-[76px] fixed top-0 left-0 z-[999] bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] transition-all">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        
        {/* BRAND LOGO */}
        <div 
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5 cursor-pointer group select-none shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/25 group-hover:scale-105 transition-transform">
            <HiSparkles className="text-xl" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-black tracking-tight text-gray-900 group-hover:text-orange-600 transition-colors">
                Feast<span className="text-orange-600">Flow</span>
              </span>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-600 -mt-1 hidden sm:block">
              Fresh Food Delivery
            </span>
          </div>
        </div>

        {/* SEARCH & LOCATION (Customer View - Desktop) */}
        {userData.role === "user" && (
          <div className="hidden md:flex items-center flex-1 max-w-xl mx-4 bg-gray-50/90 hover:bg-gray-50 border border-gray-200/80 focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-500/10 rounded-2xl h-[48px] px-3 shadow-inner transition-all">
            {/* City pill */}
            <div className="flex items-center gap-2 pr-3 border-r border-gray-200 max-w-[170px] shrink-0 text-gray-700">
              <FaLocationDot className="text-orange-500 text-sm shrink-0 animate-pulse" />
              <span className="text-xs font-semibold truncate text-gray-800" title={currentCity || "Locating..."}>
                {currentCity || "Select City"}
              </span>
            </div>

            {/* Input */}
            <div className="flex items-center flex-1 pl-3 gap-2">
              <IoIosSearch className="text-gray-600 text-lg shrink-0" />
              <input
                type="text"
                placeholder="Search food, cuisines, or restaurants..."
                className="w-full bg-transparent text-sm text-gray-800 placeholder-gray-600 outline-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button 
                  onClick={() => setQuery("")}
                  className="text-gray-600 hover:text-gray-600 p-1 rounded-full"
                >
                  <RxCross2 size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* RIGHT ACTION BUTTONS */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Mobile Search Toggle */}
          {userData.role === "user" && (
            <button
              onClick={() => setShowSearch((prev) => !prev)}
              aria-label="Toggle search"
              className="md:hidden p-2.5 rounded-xl text-gray-600 hover:text-orange-600 hover:bg-orange-50 transition"
            >
              {showSearch ? <RxCross2 size={20} /> : <IoIosSearch size={22} />}
            </button>
          )}

          {/* Role: OWNER Actions */}
          {userData.role === "owner" && (
            <>
              {myShopData && (
                <button
                  onClick={() => navigate("/add-item")}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs sm:text-sm shadow-sm shadow-orange-500/30 active:scale-95 transition"
                >
                  <FaPlus size={13} />
                  <span className="hidden sm:inline">Add Dish</span>
                </button>
              )}
              <button
                onClick={() => navigate("/my-orders")}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 hover:border-orange-200 bg-white hover:bg-orange-50/50 text-gray-700 hover:text-orange-600 font-semibold text-xs sm:text-sm transition"
              >
                <TbReceipt2 size={18} />
                <span className="hidden sm:inline">Order Queue</span>
              </button>
            </>
          )}

          {/* Role: CUSTOMER Actions */}
          {userData.role === "user" && (
            <>
              <button
                onClick={() => navigate("/my-orders")}
                className="hidden lg:flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 hover:border-orange-200 bg-white hover:bg-orange-50/50 text-gray-700 hover:text-orange-600 font-semibold text-sm transition"
              >
                <FiPackage size={16} />
                <span>Orders</span>
              </button>

              {/* Cart Button */}
              <button
                onClick={() => navigate("/cart")}
                className="relative flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-xl bg-orange-50 hover:bg-orange-100/80 text-orange-600 font-semibold transition group"
                aria-label="View Cart"
              >
                <FiShoppingCart size={20} className="group-hover:scale-110 transition-transform" />
                <span className="text-sm font-bold hidden sm:inline">Cart</span>
                {totalCartCount > 0 && (
                  <span className="flex items-center justify-center min-w-[20px] h-[20px] px-1 text-[11px] font-black text-white bg-orange-600 rounded-full shadow-sm animate-pulse">
                    {totalCartCount}
                  </span>
                )}
              </button>
            </>
          )}

          {/* Role: DELIVERY BOY Actions */}
          {userData.role === "deliveryBoy" && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Rider Active</span>
            </div>
          )}

          {/* USER PROFILE AVATAR & DROPDOWN */}
          <div className="relative">
            <button
              onClick={() => setShowInfo((prev) => !prev)}
              aria-label="User profile menu"
              className="flex items-center gap-2 p-1 rounded-full border-2 border-orange-200 hover:border-orange-500 focus:outline-none transition group"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                {userData?.fullName?.charAt(0).toUpperCase() || "U"}
              </div>
            </button>

            {/* Dropdown Menu */}
            {showInfo && (
              <div 
                className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 flex flex-col gap-1 z-[9999] animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {userData?.fullName}
                  </p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {userData?.email}
                  </p>
                  <div className="mt-2">
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleInfo.color}`}>
                      {roleInfo.label}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowInfo(false);
                    navigate("/my-orders");
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition"
                >
                  <TbReceipt2 size={18} className="text-gray-400 group-hover:text-orange-500" />
                  <span>My Orders</span>
                </button>

                {userData.role === "owner" && (
                  <button
                    onClick={() => {
                      setShowInfo(false);
                      navigate("/create-edit-shop");
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition"
                  >
                    <FiCompass size={18} className="text-gray-400" />
                    <span>Restaurant Profile</span>
                  </button>
                )}

                <div className="my-1 border-t border-gray-100" />

                <button
                  onClick={handleLogOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition"
                >
                  <FiLogOut size={18} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE SEARCH OVERLAY */}
      {showSearch && userData.role === "user" && (
        <div className="md:hidden w-full px-4 py-3 bg-white border-b border-gray-200 shadow-lg">
          <div className="flex items-center bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 gap-2">
            <IoIosSearch size={20} className="text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search dishes or restaurants..."
              className="w-full bg-transparent text-sm text-gray-800 outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            {query && (
              <button onClick={() => setQuery("")}>
                <RxCross2 size={18} className="text-gray-400" />
              </button>
            )}
          </div>
          {currentCity && (
            <div className="flex items-center gap-1.5 mt-2 px-1 text-xs text-gray-500 font-medium">
              <FaLocationDot className="text-orange-500 text-[11px]" />
              <span>Delivering to {currentCity}</span>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

export default Nav;
