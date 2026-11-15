import axios from "axios";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { serverurl } from "../App";
import { setMyShopData } from "../redux/ownerSlice";
import { useLocation } from "react-router-dom";

function useGetMyShops() {
  const dispatch = useDispatch();
  const location = useLocation();

  useEffect(() => {
    // 🔥 ONLY run on home/dashboard

    if (location.pathname !== "/") return;

    const fetchShop = async () => {
      try {
        const result = await axios.get(`${serverurl}/api/shop/get-my`, {
          withCredentials: true,
        });
        if (result.data.shop) {
          dispatch(setMyShopData(result.data.shop));
        } else {
          dispatch(setMyShopData(null));
        }
      } catch (error) {
        console.log("HOOK ERROR:", error.response?.data || error.message);
        dispatch(setMyShopData(null));
      }
    };

    fetchShop();
  }, [location.pathname, dispatch]);
}

export default useGetMyShops;
