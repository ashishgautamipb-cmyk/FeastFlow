import axios from "axios";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  setCurrentAddress,
  setCurrentCity,
  setcurrentState,
} from "../redux/userSlice.js";
import { setAddress, setLocation } from "../redux/mapSlice.js";

function useGetCity() {
  const apiKey = import.meta.env.VITE_GEOAPIKEY;
  const dispatch = useDispatch();

  useEffect(() => {
    if (!navigator.geolocation) {
      dispatch(setCurrentCity("Kolkata"));
      dispatch(setcurrentState("West Bengal"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        dispatch(setLocation({ lat: latitude, lon: longitude }));

        let city = "Kolkata";
        let state = "West Bengal";
        let formatted = "Kolkata, West Bengal";
        let addressLine = "Kolkata";

        try {
          if (apiKey) {
            const result = await axios.get(
              `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&format=json&apiKey=${apiKey}`,
            );
            const resultData = result?.data?.results?.[0];
            if (resultData) {
              city =
                resultData.city ||
                resultData.town ||
                resultData.village ||
                resultData.municipality ||
                resultData.district ||
                resultData.county ||
                resultData.suburb ||
                resultData.state ||
                "Kolkata";
              state = resultData.state || "West Bengal";
              formatted = resultData.formatted || `${city}, ${state}`;
              addressLine = resultData.address_line2 || city;
            }
          }
        } catch (err) {
          console.log("Geoapify geocode skipped or failed:", err.message);
        }

        dispatch(setCurrentCity(city));
        dispatch(setcurrentState(state));
        dispatch(setCurrentAddress(formatted));
        dispatch(setAddress(addressLine));
      },
      (geoErr) => {
        console.log("Location access not granted:", geoErr.message);
        dispatch(setCurrentCity("Kolkata"));
        dispatch(setcurrentState("West Bengal"));
      },
      { timeout: 10000 },
    );
  }, [apiKey, dispatch]);
}

export default useGetCity;
