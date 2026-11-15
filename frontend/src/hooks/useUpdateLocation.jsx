import axios from "axios";
import { useEffect } from "react";
import { serverurl } from "../App";
import { useSelector } from "react-redux";

function useUpdateLocation() {
  const { userData } = useSelector((state) => state.user);

  useEffect(() => {
    // Only track and upload location when user is authenticated
    if (!userData?._id) return;
    if (!navigator.geolocation) return;

    const updateLocation = async (lat, lon) => {
      try {
        await axios.post(
          `${serverurl}/api/user/update-location`,
          { lat, lon },
          { withCredentials: true },
        );
      } catch (error) {
        console.log("UPDATE LOCATION ERROR:", error.response?.data?.message || error.message);
      }
    };

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        updateLocation(pos.coords.latitude, pos.coords.longitude);
      },
      (error) => {
        console.log("Geolocation watch skipped:", error.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
      },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [userData?._id]);
}

export default useUpdateLocation;
