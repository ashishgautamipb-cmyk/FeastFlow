import React from "react";
import Nav from "./Nav.jsx";
import { useSelector } from "react-redux";
import { FaUtensils, FaPen, FaPlus, FaLocationDot, FaCompass, FaLocationCrosshairs } from "react-icons/fa6";
import { FiShoppingBag, FiLayers, FiAlertTriangle } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import useGetMyShops from "../hooks/useGetMyShops";
import OwnerItemCard from "./OwnerItemCard.jsx";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";

const shopMarkerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [26, 42],
  iconAnchor: [13, 42],
  popupAnchor: [1, -36],
  shadowSize: [41, 41],
});

function OwnerDashboard() {
  useGetMyShops();

  const { myShopData } = useSelector((state) => state.owner);
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-screen bg-[#fafafa] flex flex-col">
      <Nav />

      <div className="pt-[90px] pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full space-y-8">
        
        {/* NO RESTAURANT YET */}
        {!myShopData && (
          <div className="flex justify-center items-center py-12">
            <div className="w-full max-w-md bg-white shadow-xl rounded-3xl p-8 border border-gray-100 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-orange-50 text-orange-600 mx-auto flex items-center justify-center">
                <FaUtensils size={30} />
              </div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                Partner with FeastFlow
              </h2>
              <p className="text-xs text-gray-500 leading-relaxed">
                Register your restaurant, upload delicious dishes, and receive orders from local customers in real time.
              </p>
              <button
                onClick={() => navigate("/create-edit-shop")}
                className="w-full py-3 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-bold rounded-2xl shadow-md shadow-orange-500/25 active:scale-95 transition text-sm"
              >
                Register Restaurant
              </button>
            </div>
          </div>
        )}

        {/* RESTAURANT PROFILE HERO */}
        {myShopData && (
          <div className="space-y-6">
            
            {/* Restaurant Cover Card */}
            <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm relative group">
              <div className="relative h-56 sm:h-72 w-full overflow-hidden bg-gray-900">
                <img
                  src={myShopData?.image}
                  alt={myShopData?.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/30 to-transparent" />

                {/* Edit Shop Button */}
                <button
                  className="absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-900 p-2.5 rounded-2xl shadow-md backdrop-blur-md transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                  onClick={() => navigate("/create-edit-shop")}
                >
                  <FaPen size={12} className="text-orange-600" />
                  <span>Edit Restaurant Profile</span>
                </button>

                <div className="absolute bottom-5 left-6 right-6 text-white space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-600 px-2.5 py-0.5 rounded-md">
                    Verified Partner
                  </span>
                  <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white drop-shadow-sm">
                    {myShopData?.name}
                  </h1>
                  <div className="flex items-center gap-1.5 text-xs text-gray-200">
                    <FaLocationDot className="text-orange-500 shrink-0" />
                    <span>{myShopData?.address || `${myShopData?.city}, ${myShopData?.state}`}</span>
                  </div>
                </div>
              </div>

              {/* Quick Partner Bar */}
              <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100">
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <FiLayers className="text-orange-600" />
                    <span><strong>{myShopData?.items?.length || 0}</strong> Items Listed</span>
                  </div>
                  <span>•</span>
                  <span>Operating in <strong>{myShopData?.city}</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate("/create-edit-shop")}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-xs transition"
                  >
                    <FaLocationDot size={11} className="text-orange-600" />
                    <span>Edit Location & Map Pin</span>
                  </button>

                  <button
                    onClick={() => navigate("/add-item")}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-bold rounded-xl text-xs shadow-sm shadow-orange-500/20 active:scale-95 transition"
                  >
                    <FaPlus size={11} />
                    <span>Add New Dish</span>
                  </button>
                </div>
              </div>
            </div>

            {/* RESTAURANT LOCATION MAP & COVERAGE RADAR */}
            {(() => {
              const coordinates = myShopData?.location?.coordinates;
              const hasCoords =
                Array.isArray(coordinates) &&
                coordinates.length === 2 &&
                (coordinates[0] !== 0 || coordinates[1] !== 0);

              const shopLon = hasCoords ? coordinates[0] : 88.3639;
              const shopLat = hasCoords ? coordinates[1] : 22.5726;

              if (!hasCoords) {
                return (
                  <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                        <FiAlertTriangle size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm">
                          Restaurant Location Not Pinned!
                        </h3>
                        <p className="text-xs text-gray-600">
                          Auto-detect and save your shop coordinates on the map so customers within 10 km can find you.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate("/create-edit-shop")}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shrink-0 transition"
                    >
                      Pin Location on Map
                    </button>
                  </div>
                );
              }

              return (
                <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden space-y-0">
                  <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
                    <div className="flex items-center gap-2.5">
                      <FaLocationCrosshairs className="text-orange-400" size={16} />
                      <div>
                        <h3 className="text-sm font-black tracking-tight">
                          Restaurant Storefront Location & Coverage Map
                        </h3>
                        <p className="text-[11px] text-gray-300">
                          GPS: {shopLat.toFixed(4)}, {shopLon.toFixed(4)} • Serving 10 km Radius
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-[11px] font-bold text-emerald-300">
                        ✓ 5 km Fleet Dispatch Active
                      </span>
                      <button
                        onClick={() => navigate("/create-edit-shop")}
                        className="px-3 py-1 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <FaPen size={10} />
                        <span>Update GPS</span>
                      </button>
                    </div>
                  </div>

                  <div className="h-64 w-full relative z-0">
                    <MapContainer
                      center={[shopLat, shopLon]}
                      zoom={13}
                      scrollWheelZoom={false}
                      className="h-full w-full"
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />

                      {/* 10 KM Customer Discovery Radius */}
                      <Circle
                        center={[shopLat, shopLon]}
                        radius={10000}
                        pathOptions={{
                          color: "#ea580c",
                          fillColor: "#fed7aa",
                          fillOpacity: 0.12,
                          weight: 1.5,
                          dashArray: "6, 6",
                        }}
                      />

                      {/* 5 KM Rider Dispatch Radius */}
                      <Circle
                        center={[shopLat, shopLon]}
                        radius={5000}
                        pathOptions={{
                          color: "#3b82f6",
                          fillColor: "#bfdbfe",
                          fillOpacity: 0.15,
                          weight: 1.5,
                        }}
                      />

                      <Marker position={[shopLat, shopLon]} icon={shopMarkerIcon}>
                        <Popup>
                          <div className="p-1 font-sans text-center">
                            <span className="font-bold text-xs text-gray-900 block">
                              {myShopData.name}
                            </span>
                            <span className="text-[11px] text-gray-500">
                              {myShopData.address}
                            </span>
                          </div>
                        </Popup>
                      </Marker>
                    </MapContainer>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-600">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5 font-medium">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <span>5 km Rider Dispatch Area</span>
                      </span>
                      <span className="flex items-center gap-1.5 font-medium">
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-600" />
                        <span>10 km Customer Reach</span>
                      </span>
                    </div>

                    <button
                      onClick={() => navigate("/create-edit-shop")}
                      className="text-orange-600 hover:text-orange-700 font-bold underline"
                    >
                      Update Storefront Pin →
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* RESTAURANT MENU ITEMS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-gray-900 tracking-tight">
                  Restaurant Menu Catalog
                </h2>
                <button
                  onClick={() => navigate("/my-orders")}
                  className="text-xs font-bold text-orange-600 hover:underline"
                >
                  View Incoming Orders →
                </button>
              </div>

              {(!myShopData?.items || myShopData.items.length === 0) ? (
                <div className="bg-white rounded-3xl border border-gray-200/80 p-10 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 mx-auto flex items-center justify-center">
                    <FiShoppingBag size={24} />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Your Menu is Empty</h3>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    Start adding your food creations with photos, prices, and descriptions to attract hungry customers.
                  </p>
                  <button
                    onClick={() => navigate("/add-item")}
                    className="px-5 py-2.5 bg-orange-600 text-white font-bold rounded-xl text-xs hover:bg-orange-700 transition"
                  >
                    + Add Your First Dish
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {myShopData.items.map((item, index) => (
                    <OwnerItemCard data={item} key={item._id || index} />
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default OwnerDashboard;
