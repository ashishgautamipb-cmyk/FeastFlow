import axios from "axios";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { serverurl } from "../App";
import { setMyOrders } from "../redux/userSlice";

function userGetMyOrders() {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);

  useEffect(() => {
    if (!userData?._id) return;

    const fetchOrders = async () => {
      try {
        const result = await axios.get(`${serverurl}/api/order/my-orders`, {
          withCredentials: true,
        });
        dispatch(setMyOrders(result.data.orders || []));
      } catch (error) {
        console.log("FETCH ORDERS ERROR:", error.response?.data || error.message);
      }
    };

    fetchOrders();
  }, [userData?._id, dispatch]);
}

export default userGetMyOrders;
