import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { serverurl } from "../App";
import { FaStore, FaArrowLeft } from "react-icons/fa";
import { FaLocationDot } from "react-icons/fa6";
import { MdRestaurantMenu } from "react-icons/md";
import { HiSparkles } from "react-icons/hi2";
import FoodCard from "../components/FoodCard";

function Shop() {
  const { shopId } = useParams();
  const [items, setItems] = useState([]);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleShop = async () => {
    try {
      setLoading(true);
      const result = await axios.get(
        `${serverurl}/api/item/get-by-shop/${shopId}`,
        { withCredentials: true },
      );

      setShop(result.data.shop);
      setItems(result.data.items || []);
    } catch (error) {
      console.log("FETCH SHOP ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleShop();
  }, [shopId]);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      
      {/* FLOATING BACK BUTTON */}
      <button
        className="fixed top-5 left-5 z-30 flex items-center gap-2 bg-white/90 backdrop-blur-md hover:bg-white text-gray-900 px-4 py-2 rounded-2xl shadow-lg border border-gray-200 transition font-bold text-xs cursor-pointer active:scale-95"
        onClick={() => navigate("/")}
      >
        <FaArrowLeft size={12} />
        <span>Back to FeastFlow</span>
      </button>

      {/* RESTAURANT HERO COVER */}
      {shop && (
        <div className="relative w-full h-72 md:h-96 overflow-hidden bg-gray-900">
          <img
            src={shop.image}
            className="w-full h-full object-cover opacity-80"
            alt={shop.name}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent" />

          <div className="absolute bottom-6 left-0 right-0 max-w-7xl mx-auto px-6 flex flex-col md:flex-row md:items-end justify-between gap-4 text-white">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-600/90 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wider">
                <HiSparkles />
                <span>Verified Kitchen Partner</span>
              </div>

              <h1 className="text-3xl md:text-5xl font-black tracking-tight drop-shadow-md">
                {shop.name}
              </h1>

              <div className="flex items-center gap-2 text-sm text-gray-200">
                <FaLocationDot className="text-orange-500 shrink-0" />
                <p className="font-medium">
                  {shop.address || `${shop.city}, ${shop.state}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl text-xs font-semibold border border-white/20">
                {items.length} dishes on menu
              </span>
            </div>
          </div>
        </div>
      )}

      {/* MENU CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-200/80 pb-4">
          <div>
            <h2 className="flex items-center gap-2 text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              <MdRestaurantMenu className="text-orange-500 text-2xl" />
              <span>Full Restaurant Menu</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Select dishes to add to your FeastFlow cart
            </p>
          </div>
        </div>

        {items.length > 0 ? (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {items.map((item) => (
              <FoodCard key={item._id} data={item} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center text-gray-500">
            {loading ? "Loading delicious menu items..." : "No items currently listed on this menu."}
          </div>
        )}
      </div>

    </div>
  );
}

export default Shop;
