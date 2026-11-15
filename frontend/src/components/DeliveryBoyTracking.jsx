import React, { useEffect } from "react";
import scooter from "../assets/scooter.png";
import home from "../assets/home.png";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import { FaMotorcycle, FaLocationDot, FaRoute, FaCircleCheck } from "react-icons/fa6";

/* ---------------- Icons ---------------- */

const deliveryBoyIcon = new L.Icon({
  iconUrl: scooter,
  iconSize: [42, 42],
  iconAnchor: [21, 42],
  popupAnchor: [0, -38],
});

const customerIcon = new L.Icon({
  iconUrl: home,
  iconSize: [42, 42],
  iconAnchor: [21, 42],
  popupAnchor: [0, -38],
});

function FitBoundsMap({ riderPos, customerPos }) {
  const map = useMap();
  useEffect(() => {
    if (riderPos && customerPos && map) {
      try {
        const bounds = L.latLngBounds([riderPos, customerPos]);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      } catch (e) {
        console.log("Map bounds error:", e);
      }
    }
  }, [riderPos, customerPos, map]);
  return null;
}

// Calculate Haversine distance in meters
export function getDistanceMeters(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371000; // meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/* ---------------- Component ---------------- */

function DeliveryBoyTracking({ data, title = "Live Route Tracking" }) {
  // Extract coordinates safely
  const deliveryBoyLocation = data?.deliveryBoyLocation;
  const customerLocation = data?.customerLocation;

  // If data not available, don't render map
  if (!deliveryBoyLocation || !customerLocation) {
    return null;
  }

  const deliveryBoyLat = Number(deliveryBoyLocation.lat);
  const deliveryBoyLon = Number(deliveryBoyLocation.lon);

  const customerLat = Number(customerLocation.lat);
  const customerLon = Number(customerLocation.lon);

  // Extra safety check
  if (
    isNaN(deliveryBoyLat) ||
    isNaN(deliveryBoyLon) ||
    isNaN(customerLat) ||
    isNaN(customerLon) ||
    (deliveryBoyLat === 0 && deliveryBoyLon === 0) ||
    (customerLat === 0 && customerLon === 0)
  ) {
    return null;
  }

  const path = [
    [deliveryBoyLat, deliveryBoyLon],
    [customerLat, customerLon],
  ];

  const center = [
    (deliveryBoyLat + customerLat) / 2,
    (deliveryBoyLon + customerLon) / 2,
  ];

  const distanceMeters = getDistanceMeters(
    deliveryBoyLat,
    deliveryBoyLon,
    customerLat,
    customerLon,
  );

  const isWithin100Meters = distanceMeters !== null && distanceMeters <= 100;

  const distanceFormatted =
    distanceMeters == null
      ? "Calculating..."
      : distanceMeters < 1000
      ? `${distanceMeters} meters`
      : `${(distanceMeters / 1000).toFixed(2)} km`;

  return (
    <div className="w-full">
      <div className="bg-white rounded-3xl shadow-md border border-gray-200 overflow-hidden">
        {/* Header Bar with Live Distance */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
          <div className="flex items-center gap-2 text-xs font-bold">
            <FaRoute className="text-orange-400 text-sm" />
            <span>{title}</span>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-xs ${
                isWithin100Meters
                  ? "bg-emerald-500 text-white animate-pulse"
                  : "bg-orange-500 text-white"
              }`}
            >
              {isWithin100Meters ? (
                <FaCircleCheck size={12} />
              ) : (
                <FaMotorcycle size={12} />
              )}
              <span>Distance: {distanceFormatted}</span>
            </div>
            {isWithin100Meters && (
              <span className="hidden sm:inline-block text-[11px] font-bold text-emerald-300">
                Arrived in range (&lt; 100m)
              </span>
            )}
          </div>
        </div>

        {/* Map Container */}
        <div className="h-[360px] w-full relative">
          <MapContainer
            center={center}
            zoom={14}
            scrollWheelZoom={false}
            className="h-full w-full z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <FitBoundsMap
              riderPos={[deliveryBoyLat, deliveryBoyLon]}
              customerPos={[customerLat, customerLon]}
            />

            {/* Delivery Boy Marker */}
            <Marker
              position={[deliveryBoyLat, deliveryBoyLon]}
              icon={deliveryBoyIcon}
            >
              <Popup>
                <div className="text-center font-bold text-xs p-1">
                  <span className="text-orange-600 block">🛵 Delivery Rider</span>
                  <span>{distanceFormatted} away from customer</span>
                </div>
              </Popup>
            </Marker>

            {/* Customer Marker */}
            <Marker position={[customerLat, customerLon]} icon={customerIcon}>
              <Popup>
                <div className="text-center font-bold text-xs p-1">
                  <span className="text-emerald-600 block">🏠 Customer Doorstep</span>
                  <span>Delivery Destination</span>
                </div>
              </Popup>
            </Marker>

            {/* Line Between Rider & Customer */}
            <Polyline
              positions={path}
              pathOptions={{
                color: isWithin100Meters ? "#10b981" : "#ea580c",
                weight: 5,
                dashArray: "8, 8",
              }}
            />
          </MapContainer>
        </div>

        {/* Footer with Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-xs bg-gray-50 border-t border-gray-100">
          <div className="flex items-center gap-4 text-gray-600 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-600" />
              <span>Rider Location</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <span>Customer Location</span>
            </span>
          </div>

          <div className="text-right">
            <span
              className={`font-bold ${
                isWithin100Meters ? "text-emerald-600" : "text-gray-700"
              }`}
            >
              {isWithin100Meters
                ? "Doorstep Reached (Within 100m)"
                : `Distance between them: ${distanceFormatted}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeliveryBoyTracking;
