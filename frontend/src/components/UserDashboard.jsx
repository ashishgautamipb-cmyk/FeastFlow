import React, { useEffect, useRef, useState } from "react";
import Nav from "./Nav";
import { categories } from "../category";
import CategoryCard from "./CategoryCard";
import {
  FaChevronLeft,
  FaChevronRight,
  FaStore,
  FaLocationDot,
  FaLeaf,
  FaDrumstickBite,
  FaFire,
  FaBolt,
  FaShieldHeart,
  FaLocationCrosshairs,
} from "react-icons/fa6";
import { FiSearch, FiX, FiMapPin } from "react-icons/fi";
import { HiSparkles } from "react-icons/hi2";
import { useDispatch, useSelector } from "react-redux";
import FoodCard from "./FoodCard";
import { useNavigate } from "react-router-dom";
import { setSearchItems } from "../redux/userSlice";
import UserRadarMap from "./UserRadarMap";
import LocationPromptModal from "./LocationPromptModal";

function UserDashboard() {
  const { currentCity, currentAddress, shopsInMyCity, itemsInMyCity, searchItems, userData } =
    useSelector((state) => state.user);
  const { location } = useSelector((state) => state.map);

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [dietFilter, setDietFilter] = useState("all"); // 'all', 'veg', 'non-veg'
  const [filterWithin10Km, setFilterWithin10Km] = useState(false);
  const [updatedItemList, setUpdatedItemList] = useState([]);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const userLat = location?.lat || 22.5726; // Default Kolkata if not yet retrieved
  const userLon = location?.lon || 88.3639;

  // Filter shops by 10 km if toggle is active
  const filteredShops = (shopsInMyCity || []).filter((s) => {
    if (!filterWithin10Km) return true;
    return s.distanceKm == null || s.distanceKm <= 10;
  });

  const handleFilterByCategory = (category) => {
    setSelectedCategory(category);
    let list = itemsInMyCity || [];
    if (category !== "All") {
      list = list.filter((i) => i.category?.toLowerCase() === category.toLowerCase());
    }
    if (dietFilter === "veg") {
      list = list.filter((i) => i.foodType === "veg");
    } else if (dietFilter === "non-veg") {
      list = list.filter((i) => i.foodType === "non veg");
    }
    setUpdatedItemList(list);
  };

  const handleDietFilter = (type) => {
    setDietFilter(type);
    let list = itemsInMyCity || [];
    if (selectedCategory !== "All") {
      list = list.filter((i) => i.category?.toLowerCase() === selectedCategory.toLowerCase());
    }
    if (type === "veg") {
      list = list.filter((i) => i.foodType === "veg");
    } else if (type === "non-veg") {
      list = list.filter((i) => i.foodType === "non veg");
    }
    setUpdatedItemList(list);
  };

  useEffect(() => {
    setUpdatedItemList(itemsInMyCity || []);
    setSelectedCategory("All");
    setDietFilter("all");
  }, [itemsInMyCity]);

  // Open location prompt if location is missing
  useEffect(() => {
    if (!location?.lat && !location?.lon) {
      const timer = setTimeout(() => setShowLocationModal(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [location?.lat, location?.lon]);

  const cateScrollref = useRef();
  const shopScrollref = useRef();

  const scrollHandler = (ref, direction) => {
    if (ref.current) {
      ref.current.scrollBy({
        left: direction === "left" ? -280 : 280,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      <Nav />

      {/* LOCATION SELECTOR MODAL */}
      <LocationPromptModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />

      {/* TOP PADDING TO CLEAR FIXED NAVBAR */}
      <div className="pt-[76px]">

        {/* HERO SECTION */}
        <section className="relative overflow-hidden bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 text-white py-12 md:py-16 px-4 sm:px-6 lg:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            {/* Hero Copy */}
            <div className="max-w-2xl text-center md:text-left space-y-4">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold text-orange-100 uppercase tracking-wider">
                  <HiSparkles className="text-amber-300" />
                  <span>Next-Gen Food Delivery</span>
                </div>

                <button
                  onClick={() => setShowLocationModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/20 hover:bg-black/30 backdrop-blur-md border border-white/20 text-xs font-bold text-white transition active:scale-95 cursor-pointer"
                >
                  <FaLocationDot className="text-amber-300" />
                  <span>Serving: <strong>{currentCity || "Detecting GPS..."}</strong> (Change)</span>
                </button>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
                Gourmet Meals, Delivered <span className="text-amber-200 underline decoration-amber-300/40">Fresh & Fast</span>.
              </h1>

              <p className="text-sm sm:text-base text-orange-100 max-w-xl leading-relaxed">
                Experience hand-crafted dishes from top-rated restaurants in{" "}
                <span className="font-bold text-white underline decoration-wavy decoration-amber-300">
                  {currentCity || "your area"}
                </span>
                . Browse kitchens within 10 km, track live GPS deliveries, and enjoy hot meals.
              </p>

              {/* Guarantees Pill */}
              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-4 text-xs font-medium text-white/90">
                <div className="flex items-center gap-1.5 bg-black/15 backdrop-blur px-3 py-1.5 rounded-xl border border-white/10">
                  <FaBolt className="text-amber-300" />
                  <span>30 Min Delivery</span>
                </div>
                <div className="flex items-center gap-1.5 bg-black/15 backdrop-blur px-3 py-1.5 rounded-xl border border-white/10">
                  <FaShieldHeart className="text-emerald-300" />
                  <span>100% Quality Assured</span>
                </div>
                <div className="flex items-center gap-1.5 bg-black/15 backdrop-blur px-3 py-1.5 rounded-xl border border-white/10">
                  <FaFire className="text-amber-300" />
                  <span>10 KM Radius</span>
                </div>
              </div>
            </div>

            {/* Quick Promo Card */}
            <div className="w-full max-w-sm bg-white/15 backdrop-blur-xl border border-white/25 rounded-3xl p-6 text-white shadow-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-200">Special Promo</span>
                <span className="bg-amber-400 text-gray-900 font-extrabold text-[11px] px-2.5 py-0.5 rounded-full">50% OFF</span>
              </div>
              <h3 className="text-xl font-extrabold">Craving something special?</h3>
              <p className="text-xs text-orange-100">
                Use code <span className="font-mono font-bold bg-white/20 px-2 py-0.5 rounded text-white">FEAST50</span> at checkout for half price on your first culinary order!
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setShowLocationModal(true)}
                  className="text-[11px] text-white/90 hover:text-white flex items-center gap-1.5 underline decoration-dotted"
                >
                  <FaLocationDot className="text-amber-300" />
                  <span>Delivering to: <strong>{currentAddress || currentCity || "Tap to set GPS location"}</strong></span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* SEARCH RESULTS OVERLAY (When Search is Active) */}
        {searchItems && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
            <div className="bg-white rounded-3xl border border-orange-100 shadow-xl p-6 sm:p-8">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <FiSearch className="text-orange-500 text-xl" />
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                      Search Results
                    </h2>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Found {searchItems.length} dish{searchItems.length === 1 ? "" : "es"} matching your query
                  </p>
                </div>

                <button
                  onClick={() => dispatch(setSearchItems(null))}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold transition"
                >
                  <FiX size={15} />
                  <span>Close Results</span>
                </button>
              </div>

              {searchItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {searchItems.map((item) => (
                    <FoodCard data={item} key={item._id} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-base font-medium">No dishes found matching your search.</p>
                  <p className="text-xs text-gray-400 mt-1">Try searching for generic terms like "pizza", "burger", or "rice".</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* MAIN BODY CONTAINER */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">

          {/* ================= 10 KM RADAR MAP SECTION ================= */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                  <FaLocationCrosshairs className="text-orange-500" />
                  <span>Interactive Map: Restaurants in 10 km Range</span>
                </h2>
                <p className="text-xs sm:text-sm text-gray-500">
                  Visual map view of nearby restaurants delivering directly to your location
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={() => setShowLocationModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold border border-orange-200 transition active:scale-95 flex items-center gap-1.5"
                >
                  <FaLocationDot size={12} />
                  <span>Change Location Pin</span>
                </button>
              </div>
            </div>

            <UserRadarMap
              userLat={userLat}
              userLon={userLon}
              shops={shopsInMyCity}
              onSelectShop={(id) => navigate(`/shop/${id}`)}
            />
          </section>

          {/* ================= CATEGORIES SECTION ================= */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  Inspiration for Your Order
                </h2>
                <p className="text-xs sm:text-sm text-gray-500">
                  Explore top cuisines and curated food categories
                </p>
              </div>

              {/* Scroll buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => scrollHandler(cateScrollref, "left")}
                  aria-label="Scroll left"
                  className="w-8 h-8 rounded-full bg-white border border-gray-200 hover:border-orange-500 text-gray-700 hover:text-orange-600 flex items-center justify-center shadow-xs transition"
                >
                  <FaChevronLeft size={12} />
                </button>
                <button
                  onClick={() => scrollHandler(cateScrollref, "right")}
                  aria-label="Scroll right"
                  className="w-8 h-8 rounded-full bg-white border border-gray-200 hover:border-orange-500 text-gray-700 hover:text-orange-600 flex items-center justify-center shadow-xs transition"
                >
                  <FaChevronRight size={12} />
                </button>
              </div>
            </div>

            {/* Category horizontal track */}
            <div
              ref={cateScrollref}
              className="flex gap-4 sm:gap-6 overflow-x-auto py-2 scroll-smooth scrollbar-none"
            >
              {/* "All" Category Pill */}
              <div
                onClick={() => handleFilterByCategory("All")}
                className={`group relative flex flex-col items-center cursor-pointer shrink-0 transition-all duration-200 select-none ${
                  selectedCategory === "All" ? "scale-105" : "hover:-translate-y-1"
                }`}
              >
                <div
                  className={`w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl flex flex-col items-center justify-center bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-sm transition-all ${
                    selectedCategory === "All"
                      ? "ring-4 ring-orange-500/20 shadow-md shadow-orange-500/30"
                      : "opacity-90 hover:opacity-100"
                  }`}
                >
                  <HiSparkles size={28} />
                  <span className="text-[11px] font-black tracking-wider uppercase mt-1">All</span>
                </div>
                <span className={`mt-2 text-xs sm:text-sm font-semibold ${selectedCategory === "All" ? "text-orange-600 font-bold" : "text-gray-700"}`}>
                  All Items
                </span>
              </div>

              {categories.map((cat, index) => (
                <CategoryCard
                  key={index}
                  name={cat.category}
                  image={cat.image}
                  isSelected={selectedCategory?.toLowerCase() === cat.category?.toLowerCase()}
                  onClick={() => handleFilterByCategory(cat.category)}
                />
              ))}
            </div>
          </section>

          {/* ================= TOP RESTAURANTS IN 10 KM RANGE ================= */}
          {filteredShops && filteredShops.length > 0 && (
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                    <FaStore className="text-orange-500" />
                    <span>Restaurants Delivering in 10 km</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Hand-picked gourmet restaurants within your 10 km zone
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setFilterWithin10Km(!filterWithin10Km)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                      filterWithin10Km
                        ? "bg-orange-600 text-white border-orange-600 shadow-xs"
                        : "bg-white text-gray-700 border-gray-200 hover:border-orange-500"
                    }`}
                  >
                    {filterWithin10Km ? "✓ Showing 10 km Only" : "Filter <= 10 km"}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => scrollHandler(shopScrollref, "left")}
                      aria-label="Scroll shops left"
                      className="w-8 h-8 rounded-full bg-white border border-gray-200 hover:border-orange-500 text-gray-700 hover:text-orange-600 flex items-center justify-center shadow-xs transition"
                    >
                      <FaChevronLeft size={12} />
                    </button>
                    <button
                      onClick={() => scrollHandler(shopScrollref, "right")}
                      aria-label="Scroll shops right"
                      className="w-8 h-8 rounded-full bg-white border border-gray-200 hover:border-orange-500 text-gray-700 hover:text-orange-600 flex items-center justify-center shadow-xs transition"
                    >
                      <FaChevronRight size={12} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Shops list track */}
              <div
                ref={shopScrollref}
                className="flex gap-5 overflow-x-auto py-2 scroll-smooth scrollbar-none"
              >
                {filteredShops.map((shop) => (
                  <div
                    key={shop._id}
                    onClick={() => navigate(`/shop/${shop._id}`)}
                    className="w-64 sm:w-72 shrink-0 bg-white rounded-2xl border border-gray-100 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.06)] hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group hover:-translate-y-1"
                  >
                    <div className="relative h-40 w-full overflow-hidden bg-gray-100">
                      <img
                        src={shop.image}
                        alt={shop.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-600 px-2 py-0.5 rounded-md">
                          Verified Partner
                        </span>
                        {shop.distanceKm != null && (
                          <span className="text-[10px] font-extrabold bg-black/60 backdrop-blur px-2 py-0.5 rounded-md text-amber-300">
                            📍 {shop.distanceKm} km
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-4 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-gray-900 text-base group-hover:text-orange-600 transition-colors truncate">
                          {shop.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <FaLocationDot className="text-orange-500 shrink-0 text-xs" />
                        <span className="truncate">{shop.address || `${shop.city}, ${shop.state}`}</span>
                      </div>
                      <div className="pt-2 flex items-center justify-between text-xs font-semibold text-orange-600">
                        <span>Explore Menu</span>
                        <FaChevronRight size={10} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ================= FOOD ITEMS CATALOG ================= */}

          {/* ================= FOOD ITEMS CATALOG ================= */}
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/60 pb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  Popular Dishes Near You
                </h2>
                <p className="text-xs sm:text-sm text-gray-500">
                  Showing {updatedItemList.length} item{updatedItemList.length === 1 ? "" : "s"} {selectedCategory !== "All" && `in ${selectedCategory}`}
                </p>
              </div>

              {/* Diet filter pills */}
              <div className="flex items-center gap-2 self-start sm:self-auto bg-gray-100 p-1 rounded-2xl border border-gray-200/60 text-xs font-bold">
                <button
                  onClick={() => handleDietFilter("all")}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    dietFilter === "all"
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => handleDietFilter("veg")}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition ${
                    dietFilter === "veg"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-gray-600 hover:text-emerald-700"
                  }`}
                >
                  <FaLeaf size={11} />
                  <span>Pure Veg</span>
                </button>
                <button
                  onClick={() => handleDietFilter("non-veg")}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition ${
                    dietFilter === "non-veg"
                      ? "bg-red-600 text-white shadow-xs"
                      : "text-gray-600 hover:text-red-700"
                  }`}
                >
                  <FaDrumstickBite size={11} />
                  <span>Non-Veg</span>
                </button>
              </div>
            </div>

            {/* FOOD ITEMS RESPONSIVE GRID */}
            {updatedItemList && updatedItemList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {updatedItemList.map((item, index) => (
                  <FoodCard key={item._id || index} data={item} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-gray-200/80 p-12 text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-500 mx-auto flex items-center justify-center">
                  <FaStore size={28} />
                </div>
                <h3 className="text-lg font-bold text-gray-800">No food items found</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  {selectedCategory !== "All"
                    ? `There are currently no items available under the "${selectedCategory}" category in your area.`
                    : "No restaurants or dishes are registered yet in this location. Stay tuned!"}
                </p>
                {selectedCategory !== "All" && (
                  <button
                    onClick={() => handleFilterByCategory("All")}
                    className="px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 transition"
                  >
                    View All Items
                  </button>
                )}
              </div>
            )}
          </section>

        </main>

        {/* FOOTER */}
        <footer className="mt-20 border-t border-gray-200 bg-white py-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div className="flex flex-col items-center md:items-start gap-1">
              <span className="text-xl font-black text-gray-900 tracking-tight">
                Feast<span className="text-orange-600">Flow</span>
              </span>
              <p className="text-xs text-gray-500">
                Official Gourmet Delivery & Restaurant Network. Delivering happiness fresh and hot.
              </p>
            </div>
            <div className="flex items-center gap-6 text-xs text-gray-500 font-medium">
              <span>Verified Kitchens</span>
              <span>•</span>
              <span>Encrypted Checkout</span>
              <span>•</span>
              <span>Real-Time GPS Tracking</span>
            </div>
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} FeastFlow Inc. All rights reserved.
            </p>
          </div>
        </footer>

      </div>
    </div>
  );
}

export default UserDashboard;
