import axios from "axios";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { serverurl } from "../App";
import { setShopsInMyCity } from "../redux/userSlice";

function useGetShopByCity() {
  const dispatch = useDispatch();
  const { currentCity, userData } = useSelector((state) => state.user);
  const { location } = useSelector((state) => state.map);

  useEffect(() => {
    if (!userData?._id) return;

    const fetchByShops = async () => {
      try {
        let endpoint = `${serverurl}/api/shop/get-nearby?maxDistance=10000`;
        if (location?.lat && location?.lon) {
          endpoint = `${serverurl}/api/shop/get-nearby?lat=${location.lat}&lon=${location.lon}&maxDistance=10000`;
        } else if (currentCity) {
          endpoint = `${serverurl}/api/shop/get-by-city/${encodeURIComponent(currentCity)}`;
        }

        const result = await axios.get(endpoint, { withCredentials: true });
        dispatch(setShopsInMyCity(result.data.shops || []));
      } catch (error) {
        console.log("SHOP FETCH ERROR:", error.response?.data || error.message);
        dispatch(setShopsInMyCity([]));
      }
    };

    fetchByShops();
  }, [currentCity, location?.lat, location?.lon, userData?._id, dispatch]);
}

export default useGetShopByCity;
