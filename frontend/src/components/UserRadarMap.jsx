import React, { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import { FaStore, FaLocationDot, FaCompass, FaChevronRight, FaLocationCrosshairs } from "react-icons/fa6";
import { useDispatch, useSelector } from "react-redux";
import { setLocation, setAddress } from "../redux/mapSlice";
import { setCurrentCity, setCurrentAddress, setcurrentState } from "../redux/userSlice";
import axios from "axios";
import { serverurl } from "../App";
import homeIconImg from "../assets/home.png";

// Custom icons
const userHomeIcon = new L.Icon({
  iconUrl: homeIconImg,
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -34],
});

const restaurantMapIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [26, 42],
  iconAnchor: [13, 42],
  popupAnchor: [1, -36],
  shadowSize: [41, 41],
});

function RecenterRadarMap({ lat, lon }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lon && map) {
      map.setView([lat, lon], 13, { animate: true });
    }
  }, [lat, lon, map]);
  return null;
}

function UserRadarMap({ userLat, userLon, shops = [], onSelectShop }) {
  const [detecting, setDetecting] = useState(false);
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        dispatch(setLocation({ lat, lon }));
        try {
          const nomRes = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
          );
          if (nomRes.data) {
            const addr = nomRes.data.address || {};
            const detectedCity =
              addr.city ||
              addr.town ||
              addr.village ||
              addr.suburb ||
              addr.district ||
              "Kolkata";
            const detectedState = addr.state || "West Bengal";
            const formatted = nomRes.data.display_name || `${detectedCity}, ${detectedState}`;
            dispatch(setCurrentCity(detectedCity));
            dispatch(setcurrentState(detectedState));
            dispatch(setCurrentAddress(formatted));
            dispatch(setAddress(formatted));
          }
          if (userData?._id) {
            await axios.post(
              `${serverurl}/api/user/update-location`,
              { lat, lon },
              { withCredentials: true },
            );
          }
        } catch (e) {
          console.log("Radar geocode error:", e);
        } finally {
          setDetecting(false);
        }
      },
      (err) => {
        console.log("Radar GPS error:", err);
        setDetecting(false);
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  };

  if (!userLat || !userLon) return null;

  // Filter shops that have valid coordinates
  const validShops = shops.filter(
    (s) =>
      s.location?.coordinates?.length === 2 &&
      (s.location.coordinates[0] !== 0 || s.location.coordinates[1] !== 0) &&
      !isNaN(s.location.coordinates[0]) &&
      !isNaN(s.location.coordinates[1]),
  );

  const within10KmShops = validShops.filter(
    (s) => s.distanceKm == null || s.distanceKm <= 10,
  );

  return (
    <div className="w-full bg-white rounded-3xl border border-gray-200/80 shadow-md overflow-hidden space-y-0">
      {/* MAP HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-gradient-to-r from-orange-600 to-amber-600 text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <FaCompass className="text-amber-200" size={16} />
          </div>
          <div>
            <h3 className="text-sm font-black tracking-tight">
              10 KM Restaurant Discovery Radar
            </h3>
            <p className="text-[11px] text-orange-100">
              Showing kitchens delivering directly to your current GPS position
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-black/20 backdrop-blur border border-white/20 text-xs font-bold text-white">
            <strong>{within10KmShops.length}</strong> Shops in 10 km
          </span>
        </div>
      </div>

      {/* LEAFLET CONTAINER */}
      <div className="h-[380px] w-full relative z-0">
        <button
          type="button"
          onClick={detectLocation}
          disabled={detecting}
          className="absolute top-3 right-3 z-[1000] bg-white/95 hover:bg-white text-gray-800 hover:text-orange-600 px-3 py-1.5 rounded-xl text-xs font-bold shadow-md border border-gray-200/80 backdrop-blur-sm flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
          title="Detect Current GPS Location"
        >
          <FaLocationCrosshairs className={`text-orange-600 ${detecting ? "animate-spin" : ""}`} />
          <span>{detecting ? "Locating..." : "Detect Current Location"}</span>
        </button>

        <MapContainer
          center={[userLat, userLon]}
          zoom={13}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <RecenterRadarMap lat={userLat} lon={userLon} />

          {/* 10 KM RADIUS CIRCLE (10,000 meters) */}
          <Circle
            center={[userLat, userLon]}
            radius={10000}
            pathOptions={{
              color: "#ea580c",
              fillColor: "#fed7aa",
              fillOpacity: 0.15,
              weight: 2,
              dashArray: "6, 6",
            }}
          />

          {/* USER LOCATION MARKER */}
          <Marker position={[userLat, userLon]} icon={userHomeIcon}>
            <Popup>
              <div className="p-1 text-center font-sans space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 block">
                  Your Delivery Location
                </span>
                <p className="text-xs font-bold text-gray-800">
                  Center of 10 km Delivery Zone
                </p>
              </div>
            </Popup>
          </Marker>

          {/* RESTAURANT MARKERS WITHIN 10 KM */}
          {within10KmShops.map((shop) => {
            const [sLon, sLat] = shop.location.coordinates;
            return (
              <Marker
                key={shop._id}
                position={[sLat, sLon]}
                icon={restaurantMapIcon}
              >
                <Popup>
                  <div className="w-48 p-1 font-sans space-y-2">
                    <img
                      src={shop.image}
                      alt={shop.name}
                      className="w-full h-24 object-cover rounded-xl"
                    />
                    <div>
                      <h4 className="font-bold text-xs text-gray-900 truncate">
                        {shop.name}
                      </h4>
                      <p className="text-[11px] text-gray-500 truncate">
                        {shop.address || `${shop.city}, ${shop.state}`}
                      </p>
                      {shop.distanceKm != null && (
                        <span className="inline-block mt-1 text-[10px] font-extrabold bg-orange-100 text-orange-800 px-2 py-0.5 rounded-md">
                          📍 {shop.distanceKm} km away
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => onSelectShop && onSelectShop(shop._id)}
                      className="w-full py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 transition"
                    >
                      <span>View Menu</span>
                      <FaChevronRight size={10} />
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* FOOTER LEGEND */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-600">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-600" />
            <span>10 km Delivery Perimeter</span>
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span>Partner Restaurants</span>
          </span>
        </div>
        <span className="font-semibold text-orange-700">
          Click any pin on the map to preview restaurant details
        </span>
      </div>
    </div>
  );
}

export default UserRadarMap;
