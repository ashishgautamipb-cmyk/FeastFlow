import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import {
  acceptOrder,
  pickupOrder,
  getCurrentOrder,
  getDeliveryBoyAssignment,
  getOrderById,
  getUserOrders,
  placeOrder,
  sendDeliveryOtp,
  updateOrderStatus,
  verifyDeliveryOtp,
  verifyPayments,
  getNearbyRiders,
} from "../controllers/order.controller.js";

const orderRouter = express.Router();

orderRouter.post("/place-order", isAuth, placeOrder);
orderRouter.get("/my-orders", isAuth, getUserOrders);
orderRouter.post("/update-status/:orderId/:shopId", isAuth, updateOrderStatus);
orderRouter.get("/nearby-riders/:shopId", isAuth, getNearbyRiders);
orderRouter.get("/get-assignments", isAuth, getDeliveryBoyAssignment);
orderRouter.get("/accept-order/:assignmentId", isAuth, acceptOrder);
orderRouter.post("/pickup-order/:assignmentId", isAuth, pickupOrder);
orderRouter.get("/get-current-order", isAuth, getCurrentOrder);
orderRouter.get("/get-order-by-id/:orderId", isAuth, getOrderById);
orderRouter.post("/send-delivery-otp", isAuth, sendDeliveryOtp);
orderRouter.post("/verify-delivery-otp", isAuth, verifyDeliveryOtp);
orderRouter.post("/verify-payments", isAuth, verifyPayments);

export default orderRouter;
