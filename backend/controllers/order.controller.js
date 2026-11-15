import DeliveryAssingment from "../models/deliveryAssingment.model.js";
import Order from "../models/order.model.js";
import Shop from "../models/shop.model.js";
import User from "../models/user.model.js";
import { sendOtpToUser } from "../utils/mail.js";

import Razorpay from "razorpay";
import dotenv from "dotenv";

dotenv.config();

let instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const placeOrder = async (req, res) => {
  try {
    const { cartItems, paymentMethod, deliveryAddress, totalAmount } = req.body;

    if (!cartItems) {
      return res.json({
        success: false,
        message: "CART IS EMPTY",
      });
    }

    if (
      !deliveryAddress ||
      !deliveryAddress.latitude ||
      !deliveryAddress.longitude
    ) {
      return res.json({
        success: false,
        message: "DELIVERY IS EMPTY",
      });
    }

    const groupItemByShop = {};
    // Object to store grouped cart items by shop
    // Example structure after grouping:
    // {
    //   shop1: [item1, item2],
    //   shop2: [item3]
    // }

    // Loop through each cart item
    cartItems.forEach((item) => {
      // Get the shop ID from the current item
      const shopId = item.shop._id || item.shop;

      // If this shop does NOT exist yet in the object,
      // create a new array for that shop
      if (!groupItemByShop[shopId]) {
        groupItemByShop[shopId] = [];
      }

      // Push the current item into that shop's array
      // This groups all items belonging to the same shop
      groupItemByShop[shopId].push(item);
    });

    // After loop ends:
    // All cart items are grouped by shop inside groupItemByShop
    // Useful for:
    // - Showing cart shop-wise
    // - Calculating totals per shop
    // - Creating separate orders per shop

    // ----------------------------------------

    const shopOrders = await Promise.all(
      Object.keys(groupItemByShop).map(async (shopId) => {
        const shop = await Shop.findById(shopId).populate("owner");

        if (!shop) {
          throw new Error("Shop not found");
        }

        const items = groupItemByShop[shopId];

        /*
===========================
GROUP ITEMS BY SHOP NOTES
===========================

Goal:
Group cart items shop-wise, then get items of each shop easily.

-----------------------------------
STEP 1: After grouping
-----------------------------------

groupItemByShop = {
  s1: [burger, pizza],
  s2: [tea]
}

Meaning:
key   = shopId
value = array of items for that shop

So:
- "s1" contains 2 items
- "s2" contains 1 item

Think of it like labeled boxes:
s1 → items of shop s1
s2 → items of shop s2

-----------------------------------
STEP 2: Get all shop IDs
-----------------------------------

Object.keys(groupItemByShop)

Gives:
["s1", "s2"]

This means:
Loop will run once per shop.

-----------------------------------
STEP 3: Inside loop
-----------------------------------

First loop:
shopId = "s1"

Now we want items of this shop.

const items = groupItemByShop[shopId];

This becomes:
const items = groupItemByShop["s1"];

Which equals:
items = [burger, pizza]

So:
object[key] → returns value stored at that key

Here:
groupItemByShop[shopId]
returns → items array of that shop

-----------------------------------
IMPORTANT MEMORY TRICK
-----------------------------------

groupItemByShop structure:
{
  shopId: itemsArray
}

So:
groupItemByShop["s1"] → items of shop s1
groupItemByShop["s2"] → items of shop s2

We are NOT getting shopId again.
We are getting the VALUE stored under that key.

*/

        const subTotal = items.reduce(
          (sum, i) => sum + Number(i.price) * Number(i.quantity),
          0,
        );

        return {
          shop: shop._id,
          owner: shop.owner._id,
          subTotal,
          shopOrderItems: items.map((i) => ({
            item: i.id,
            price: i.price,
            quantity: i.quantity,
            name: i.name,
          })),
        };
      }),
    );

    // =========================
    // ONLINE PAYMENT
    // =========================
    if (paymentMethod === "online") {
      const razorOrder = await instance.orders.create({
        amount: Math.round(totalAmount * 100),
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      });

      const newOrder = await Order.create({
        user: req.userId,
        paymentMethod,
        deliveryAddress,
        totalAmount,
        shopOrders,
        razorpayOrderId: razorOrder.id,
        payment: false,
      });

      return res.json({
        razorOrder,
        orderId: newOrder._id,
      });
    }

    // =========================
    // CASH ON DELIVERY
    // =========================
    const newOrder = await Order.create({
      user: req.userId,
      paymentMethod,
      deliveryAddress,
      totalAmount,
      shopOrders,
    });

    await newOrder.populate("shopOrders.owner", "name socketId");
    await newOrder.populate("user", "name email mobile socketId"); // ✅ FIXED

    const io = req.app.get("io");

    if (io) {
      // 🔥 OWNER UPDATE
      newOrder.shopOrders.forEach((shopOrder) => {
        const ownerSocketId = shopOrder.owner?.socketId;

        console.log("COD Owner socket:", ownerSocketId);

        if (ownerSocketId) {
          io.to(ownerSocketId).emit("newOrder", {
            _id: newOrder._id,
            paymentMethod: newOrder.paymentMethod,
            user: newOrder.user,
            shopOrders: shopOrder,
            createdAt: newOrder.createdAt,
            deliveryAddress: newOrder.deliveryAddress,
            payment: newOrder.payment,
          });
        }
      });

      // 🔥 USER UPDATE (ADDED FIX)
      const userSocketId = newOrder.user?.socketId;

      if (userSocketId) {
        io.to(userSocketId).emit("orderUpdated", newOrder);
      }
    }

    return res.json({
      success: true,
      newOrder,
    });
  } catch (error) {
    console.log(error);
  }
};

export const verifyPayments = async (req, res) => {
  try {
    const { razorpay_payment_id, orderId } = req.body;

    const payment = await instance.payments.fetch(razorpay_payment_id);
    if (!payment || payment.status !== "captured") {
      return res.json({ success: false, message: "PAYMENT FAILED" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: "NO ORDER FOUND" });
    }

    // ✅ Set payment on each shopOrder
    order.shopOrders.forEach((shopOrder) => {
      shopOrder.payment = true;
      shopOrder.razorpayPaymentId = razorpay_payment_id;
    });
    await order.save();

    // ✅ No duplicate populates + socketId included
    await order.populate("shopOrders.shopOrderItems.item", "name image price");
    await order.populate("shopOrders.shop", "name");

    await newOrder.populate("shopOrders.owner", "name socketId");
    await newOrder.populate("user", "name email mobile socketId");

    const io = req.app.get("io");

    if (io) {
      newOrder.shopOrders.forEach((shopOrder) => {
        const ownerSocketId = shopOrder.owner?.socketId;

        if (ownerSocketId) {
          io.to(ownerSocketId).emit("newOrder", {
            _id: newOrder._id,
            paymentMethod: newOrder.paymentMethod,
            user: newOrder.user,
            shopOrders: shopOrder,
            createdAt: newOrder.createdAt,
            deliveryAddress: newOrder.deliveryAddress,
            payment: false,
          });
        }
      });

      const userSocketId = newOrder.user?.socketId;

      if (userSocketId) {
        io.to(userSocketId).emit("orderUpdated", newOrder);
      }
    }

    return res.json({ success: true, message: "PAYMENT VERIFIED", order });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getUserOrders = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 🧑 Customer
    if (user.role === "user") {
      const orders = await Order.find({ user: req.userId })
        .sort({ createdAt: -1 })
        .populate("shopOrders.shop", "name")
        .populate("shopOrders.owner", "name email mobile")
        .populate("shopOrders.shopOrderItems.item", "name image price")
        .populate("shopOrders.assignedDeliveryBoy", "fullName mobile");

      return res.json({
        success: true,
        orders,
      });
    }

    // 🏪 Owner
    if (user.role === "owner") {
      const orders = await Order.find({ "shopOrders.owner": req.userId })
        .sort({ createdAt: -1 })
        .populate("shopOrders.shop", "name")
        .populate("user", "fullName email mobile")
        .populate("shopOrders.assignedDeliveryBoy", "fullName mobile");

      const filterOrders = orders.map((order) => ({
        _id: order._id,
        paymentMethod: order.paymentMethod,
        user: order.user,
        createdAt: order.createdAt,
        deliveryAddress: order.deliveryAddress,
        payment: order.payment,

        shopOrders: order.shopOrders.filter((o) => {
          const ownerId = o.owner?._id ? o.owner._id.toString() : o.owner?.toString();
          return ownerId === req.userId.toString();
        }),
      }));

      return res.json({
        success: true,
        orders: filterOrders, // ALWAYS send "orders"
      });
    }

    return res.status(403).json({
      success: false,
      message: "Unauthorized role",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, shopId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const shopOrders = order.shopOrders.find(
      (o) => o.shop.toString() === shopId,
    );

    if (!shopOrders) {
      return res
        .status(404)
        .json({ success: false, message: "Shop order not found" });
    }

    shopOrders.status = status;

    // future we load delivery boy name , id location etc etc here
    let deliveryBoyPayLoad = [];

    if (status === "out of delivery" && !shopOrders.assignment) {
      const shopDoc = await Shop.findById(shopOrders.shop);
      const { longitude, latitude } = order.deliveryAddress;

      const centerLon =
        shopDoc?.location?.coordinates?.length === 2 && shopDoc.location.coordinates[0] !== 0
          ? shopDoc.location.coordinates[0]
          : Number(longitude);
      const centerLat =
        shopDoc?.location?.coordinates?.length === 2 && shopDoc.location.coordinates[1] !== 0
          ? shopDoc.location.coordinates[1]
          : Number(latitude);

      let nearByDeliveryBoys = [];
      if (!isNaN(centerLon) && !isNaN(centerLat) && (centerLon !== 0 || centerLat !== 0)) {
        nearByDeliveryBoys = await User.find({
          role: "deliveryBoy",
          location: {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: [centerLon, centerLat],
              },
              $maxDistance: 5000, // 5 km range as required
            },
          },
        });
      }

      // If no delivery boys within 5km, search all delivery boys as fallback
      if (nearByDeliveryBoys.length === 0) {
        nearByDeliveryBoys = await User.find({ role: "deliveryBoy" });
      }

      // stored all delivery boy ID within 5km radius
      const nearById = nearByDeliveryBoys.map((b) => b._id);

      // -------------------------------------------------------
      // STEP 3: Find delivery boys who are already BUSY
      // -------------------------------------------------------

      // REF--finding from Deliveryassingment model
      const busyIds = await DeliveryAssingment.find({
        // Only check assignments for nearby delivery boys
        assignedTo: { $in: nearById },

        // Ignore assignments that are not active
        status: {
          $nin: ["brodcasted", "expired"],
          // means:
          // include only "assigned"
          // because:
          // broadcasted → not accepted yet
          // expired → no longer valid
        },
      })

        // -------------------------------------------------------
        // STEP 4: Get only unique deliveryBoy IDs
        // -------------------------------------------------------
        // .distinct("assignedTo") returns unique deliveryBoy IDs who are currently busy.
        .distinct("assignedTo");
      // busyId now contains:
      // delivery boys who are already assigned to some order

      const busyIdset = new Set(busyIds.map((id) => String(id)));
      //➡️ Convert busy delivery boy IDs into a Set of strings
      // So you can quickly check who is busy and who is free.

      const availableBoys = nearByDeliveryBoys.filter(
        (b) => !busyIdset.has(String(b._id)),
      );

      const candidates = availableBoys.map((b) => b._id);

      if (candidates.length === 0) {
        await order.save();
        return res.json({
          message: "NO DELIVERY BOY AVAILABLE AT THIS TIME",
        });
      }

      // created delivery assignment means out for delivery order
      const deliveryAssignment = await DeliveryAssingment.create({
        // orderId coming from frontend params  & stored order variable above
        order: order._id,
        shop: shopOrders.shop,
        shopOrderId: shopOrders._id,
        // candidates mean delivery boy available within 10 km area || const candidates = availableBoys.map((b) => b._id);
        broscastedTo: candidates,
        status: "brodcasted",
      });

      // Delivery Boy clicks ACCEPT
      //         ↓
      // DeliveryAssignment.assignedTo = boyId (delivery boy id stored to DeliveryAssingment model)
      //         ↓
      // Copy boyId into -

      // shopOrders.assignedDeliveryBoy (so that we can show in frotend delivery boy details name mobile)
      shopOrders.assignedDeliveryBoy = deliveryAssignment.assignedTo;

      // shopOrderSchema model we need assignment id to track
      shopOrders.assignment = deliveryAssignment._id;

      deliveryBoyPayLoad = availableBoys.map((b) => {
        let distanceKm = null;
        if (
          b.location?.coordinates?.length === 2 &&
          (b.location.coordinates[0] !== 0 || b.location.coordinates[1] !== 0) &&
          !isNaN(centerLon) &&
          !isNaN(centerLat)
        ) {
          const [bLon, bLat] = b.location.coordinates;
          const R = 6371;
          const dLat = ((bLat - centerLat) * Math.PI) / 180;
          const dLon = ((bLon - centerLon) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((centerLat * Math.PI) / 180) *
              Math.cos((bLat * Math.PI) / 180) *
              Math.sin(dLon / 2) *
              Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          distanceKm = Number((R * c).toFixed(1));
        }
        return {
          id: b._id,
          fullName: b.fullName,
          longitude: b.location?.coordinates?.[0],
          latitude: b.location?.coordinates?.[1],
          mobile: b.mobile,
          distanceKm,
        };
      });

      const io = req.app.get("io");
      if (io) {
        io.emit("newAssignmentAvailable", {
          assignmentId: deliveryAssignment._id,
          shopName: shopDoc?.name,
          orderId: order._id,
        });
      }
    }

    await order.save(); // always need to save parent doc

    await order.populate("shopOrders.shop", "name");
    await order.populate(
      "shopOrders.assignedDeliveryBoy",
      "fullName email mobile",
    );

    const updatedShopOrder = order.shopOrders.find(
      (o) => o.shop._id.toString() === shopId,
    );

    const io = req.app.get("io");
    if (io) {
      io.to(order._id.toString()).emit("orderStatusChanged", {
        orderId: order._id,
        shopOrderId: updatedShopOrder?._id,
        status,
      });
    }

    return res.json({
      success: true,
      shopOrders: updatedShopOrder,
      assignedDeliveryBoy: updatedShopOrder?.assignedDeliveryBoy,
      availableBoys: deliveryBoyPayLoad,
      assignment: updatedShopOrder?.assignment?._id || updatedShopOrder?.assignment,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// need to understand this properly tomorrow
export const getDeliveryBoyAssignment = async (req, res) => {
  try {
    const deliveryBoyId = req.userId;

    const assignments = await DeliveryAssingment.find({
      $or: [
        { broscastedTo: deliveryBoyId, status: "brodcasted" },
      ],
    })
      .populate({
        path: "order",
        populate: [
          { path: "user", select: "fullName email mobile" },
          { path: "shopOrders.shopOrderItems.item", select: "name price image foodType" },
        ],
      })
      .populate({
        path: "shop",
        populate: { path: "owner", select: "fullName email mobile" },
      });

    const formatted = assignments
      .filter((a) => a.order && a.shop)
      .map((a) => {
        const shopOrder = a.order.shopOrders?.find(
          (so) => so._id.toString() === a.shopOrderId.toString(),
        );

        return {
          assignmentId: a._id,
          order: a.order._id,
          shopOrderId: a.shopOrderId,
          shop: {
            id: a.shop._id,
            name: a.shop.name,
            address: a.shop.address,
            city: a.shop.city,
            image: a.shop.image,
            location: a.shop.location,
            owner: a.shop.owner,
          },
          shopName: a.shop.name,
          user: a.order.user,
          deliveryAddress: a.order.deliveryAddress,
          items: shopOrder?.shopOrderItems || [],
          subTotal: shopOrder?.subTotal,
          status: a.status,
          orderStatus: shopOrder?.status,
        };
      });

    return res.json({
      success: true,
      formatted,
    });
  } catch (error) {
    console.log("GET ASSIGNMENTS ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const acceptOrder = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await DeliveryAssingment.findById(assignmentId);

    if (!assignment) {
      return res.json({
        success: false,
        message: "assingments not found",
      });
    }

    if (assignment.status !== "brodcasted") {
      return res.json({
        success: false,
        message: "assingments is expired",
      });
    }

    //  Check if this delivery boy is already busy with another order
    // ---------------------------------------------------------------
    // We search in DeliveryAssignment collection for assignments where:
    // assignedTo = req.userId
    // → means orders already accepted by THIS delivery boy
    //
    // status: { $nin: ["brodcasted", "completed"] }
    // → $nin = "not in"
    // → ignore:
    //    - "brodcasted"  → only sent, not accepted yet (still free)
    //    - "completed"   → already finished
    const alredayAssigned = await DeliveryAssingment.findOne({
      assignedTo: req.userId,
      status: { $nin: ["brodcasted", "completed"] },
    });

    if (alredayAssigned) {
      return res.json({
        success: false,
        message: "You already have an active delivery",
      });
    }

    // the logged-in delivery boy accepted the order his id gonna save inside DeliveryAssingment model-(assignedTo) & Order model-shopOrderSchema -assignedDeliveryBoy we can see frontend delivery boy details
    assignment.assignedTo = req.userId;

    //statues changed now no one else gonna accepted this
    assignment.status = "assigned";

    assignment.acceptedAt = new Date();

    await assignment.save();

    //“Go to the Orders model & compare inside assignment=deliveryAssingmentSchema ID
    //And findById() returns the full document so now inside order i've everything
    // take the id inside deliveryAssingmentSchema & find if this ID exists in order model if found returen full object & stored order variable
    const order = await Order.findById(assignment.order);

    if (!order) {
      return res.json({ message: "Order not found" });
    }

    const shoporder = order.shopOrders.find(
      (so) => so._id.toString() === assignment.shopOrderId.toString(),
    );
    shoporder.assignedDeliveryBoy = req.userId;
    shoporder.status = "out of delivery";

    await order.save();

    return res.json({
      success: true,
      message: "ORDER ACCEPTED",
    });
  } catch (error) {
    console.log(error);
  }
};

export const pickupOrder = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const assignment = await DeliveryAssingment.findById(assignmentId);
    if (!assignment) {
      return res.json({ success: false, message: "Assignment not found" });
    }

    const order = await Order.findById(assignment.order);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    const shopOrder = order.shopOrders.find(
      (so) => so._id.toString() === assignment.shopOrderId.toString(),
    );
    if (shopOrder) {
      shopOrder.status = "picked up";
      assignment.status = "picked up";
      await assignment.save();
      await order.save();

      const io = req.app.get("io");
      if (io) {
        io.to(order._id.toString()).emit("orderStatusChanged", {
          orderId: order._id,
          shopOrderId: shopOrder._id,
          status: "picked up",
        });
      }
    }

    return res.json({
      success: true,
      message: "Food picked up successfully! Heading to customer.",
      shopOrder,
    });
  } catch (error) {
    console.log("PICKUP ORDER ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// showing delivery boy current assigned order

export const getCurrentOrder = async (req, res) => {
  try {
    const assignment = await DeliveryAssingment.findOne({
      assignedTo: req.userId,
      status: { $in: ["assigned", "picked up"] },
    })
      .populate({
        path: "shop",
        populate: { path: "owner", select: "fullName email mobile" },
      })
      .populate("assignedTo", "fullName email mobile location")
      .populate({
        path: "order",
        populate: [
          { path: "user", select: "fullName email location mobile" },
          { path: "shopOrders.shopOrderItems.item", select: "name price image foodType description" },
        ],
      });

    if (!assignment) {
      return res.json({
        success: false,
        message: "ASSIGNMENT NOT FOUND",
      });
    }

    if (!assignment.order) {
      return res.json({
        success: false,
        message: "ORDER NOT FOUND",
      });
    }

    if (!assignment.shopOrderId) {
      return res.json({
        success: false,
        message: "SHOP ORDER ID NOT FOUND IN ASSIGNMENT",
      });
    }

    if (!Array.isArray(assignment.order.shopOrders)) {
      return res.json({
        success: false,
        message: "SHOP ORDERS NOT FOUND",
      });
    }

    // Find correct shopOrder inside order
    const shopOrder = assignment.order.shopOrders.find(
      (so) => so._id.toString() === assignment.shopOrderId.toString(),
    );

    if (!shopOrder) {
      return res.json({
        success: false,
        message: "SHOP ORDER NOT FOUND",
      });
    }

    let deliveryBoyLocation = { lat: null, lon: null };
    // MongoDB stores GeoJSON coordinates as:
    // coordinates: [longitude, latitude]
    //inside assignment have current DeliveryAssingment model Schema
    // assignment.assignedTo -> refers to the delivery boy (UserModel)
    // assignedTo.location.coordinates -> contains [lon, lat]
    //
    // coordinates[0] = longitude
    // coordinates[1] = latitude
    //
    if (
      assignment.assignedTo?.location?.coordinates &&
      assignment.assignedTo.location.coordinates.length >= 2
    ) {
      deliveryBoyLocation.lat = assignment.assignedTo.location.coordinates[1];
      deliveryBoyLocation.lon = assignment.assignedTo.location.coordinates[0];
    }

    let CustomerLocation = { lat: null, lon: null };

    if (assignment.order.deliveryAddress) {
      CustomerLocation.lat = assignment.order.deliveryAddress.latitude || null;
      CustomerLocation.lon = assignment.order.deliveryAddress.longitude || null;
    }

    return res.json({
      success: true,
      // have order id because .populate order line above inside assignment variable
      // assignment.order._id
      //
      // This is the ORIGINAL Order document _id.
      // It was created when the user placed the order.
      //
      // Flow:
      // 1️⃣ User places order → MongoDB creates Order._id
      // 2️⃣ That same Order._id is stored inside DeliveryAssignment.order (as reference)
      // 3️⃣ We populate("order") → now assignment.order becomes full Order document
      // 4️⃣ assignment.order._id → gives the main Order ID
      //
      // Important:
      // - This does NOT create a new ID.
      // - This does NOT modify the database.
      // - It only sends the existing Order ID to frontend.
      // - This ID uniquely identifies the entire order.
      _id: assignment.order._id,
      assignmentId: assignment._id,
      shop: assignment.shop,
      user: assignment.order.user,
      shopOrder,
      deliveryAddress: assignment.order.deliveryAddress,
      deliveryBoyLocation,
      deliveryBoy: assignment.assignedTo, // for showing at frontend showing delivery boy name
      CustomerLocation,
    });
  } catch (error) {
    console.log("GET CURRENT ORDER ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getOrderById = async (req, res) => {
  try {
    // Extract orderId from request URL params
    // Example route: /api/order/get-order/:orderId
    const { orderId } = req.params;

    // Find the main Order document by its _id
    // IMPORTANT: This is the ORIGINAL Order created when user placed order
    // It contains an array called `shopOrders`
    const order = await Order.findById(orderId)

      // -------------------------
      // Populate 1️⃣ Shop Details
      // -------------------------
      // Inside Order → shopOrders[] → each shopOrder has `shop` field (ObjectId)
      // That ObjectId refers to Shop model
      // After populate, shopOrder.shop becomes full Shop document instead of just id
      .populate({
        path: "shopOrders.shop",
        model: "Shop",
      })

      // -------------------------
      // Populate 2️⃣ Assigned Delivery Boy
      // -------------------------
      // Inside shopOrders → assignedDeliveryBoy (ObjectId ref User)
      // After populate, we get full User document of delivery boy
      .populate({
        path: "shopOrders.assignedDeliveryBoy",
        model: "User",
      })

      // -------------------------
      // Populate 3️⃣ Items Inside Each Shop Order
      // -------------------------
      // Structure:
      // Order → shopOrders[] → shopOrderItems[] → item (ObjectId ref Item)
      // This replaces item id with full Item document
      .populate({
        path: "shopOrders.shopOrderItems.item",
        model: "Item",
      })

      // -------------------------
      // Convert Mongoose Document to Plain JS Object
      // -------------------------
      // .lean() makes query faster
      // Returns normal JS object instead of Mongoose document
      // We cannot use .save() after this
      .lean();

    // If no order found with this id
    if (!order) {
      return res.json({
        success: false,
        message: "NO ORDER FOUND",
      });
    }

    return res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.log("GET CURRENT ORDER ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const sendDeliveryOtp = async (req, res) => {
  try {
    const { orderId, shopOrderId } = req.body;

    const order = await Order.findById(orderId).populate("user");

    const shopOrder = order.shopOrders.id(shopOrderId);

    if (!order || !shopOrder) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    shopOrder.deliveryOtp = otp;
    shopOrder.otpExpires = Date.now() + 5 * 60 * 1000;

    await order.save();

    try {
      await sendOtpToUser(order.user, otp);
    } catch (mailErr) {
      console.log("Could not send delivery OTP email:", mailErr.message);
    }

    const io = req.app.get("io");
    if (io) {
      io.to(order._id.toString()).emit("deliveryOtpNotification", {
        orderId: order._id,
        shopOrderId: shopOrder._id,
        otp,
        customerName: order.user?.fullName,
      });
    }

    return res.json({
      success: true,
      otp,
      message: `OTP sent successfully to ${order.user?.fullName || "customer"}`,
    });
  } catch (error) {
    console.log("SEND DELIVERY OTP ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const verifyDeliveryOtp = async (req, res) => {
  try {
    const { orderId, shopOrderId, otp } = req.body;

    const order = await Order.findById(orderId).populate("user");

    const shopOrder = order.shopOrders.id(shopOrderId);

    if (!order || !shopOrder) {
      return res.json({
        success: false,
        message: "NO ORDER FOUND",
      });
    }

    if (
      shopOrder.deliveryOtp !== otp ||
      !shopOrder.otpExpires ||
      shopOrder.otpExpires < Date.now()
    ) {
      return res.json({
        success: false,
        message: "INVALID OTP",
      });
    }

    shopOrder.status = "delivered";
    shopOrder.deliveredAt = Date.now();

    await order.save();

    await DeliveryAssingment.updateMany(
      { shopOrderId: shopOrder._id, order: order._id },
      { status: "completed" },
    );

    const io = req.app.get("io");
    if (io) {
      io.to(order._id.toString()).emit("orderStatusChanged", {
        orderId: order._id,
        shopOrderId: shopOrder._id,
        status: "delivered",
      });
    }

    return res.json({
      success: true,
      message: "ORDER DELIVERED",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// 📍 Get nearby available riders within 5km of a shop
export const getNearbyRiders = async (req, res) => {
  try {
    const { shopId } = req.params;
    const shopDoc = await Shop.findById(shopId);
    if (!shopDoc) {
      return res.status(404).json({ success: false, message: "Shop not found" });
    }

    const [centerLon, centerLat] = shopDoc.location?.coordinates || [0, 0];

    let riders = [];
    if (centerLon !== 0 || centerLat !== 0) {
      riders = await User.find({
        role: "deliveryBoy",
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [centerLon, centerLat],
            },
            $maxDistance: 5000, // 5 km
          },
        },
      }).select("fullName mobile location isOnline");
    }

    if (riders.length === 0) {
      riders = await User.find({ role: "deliveryBoy" }).select(
        "fullName mobile location isOnline",
      );
    }

    const busyIds = await DeliveryAssingment.find({
      assignedTo: { $in: riders.map((r) => r._id) },
      status: { $in: ["assigned", "picked up"] },
    }).distinct("assignedTo");

    const busySet = new Set(busyIds.map((id) => String(id)));

    const formattedRiders = riders.map((r) => {
      let distanceKm = null;
      if (
        r.location?.coordinates?.length === 2 &&
        (r.location.coordinates[0] !== 0 || r.location.coordinates[1] !== 0) &&
        centerLon !== 0 &&
        centerLat !== 0
      ) {
        const [rLon, rLat] = r.location.coordinates;
        const R = 6371;
        const dLat = ((rLat - centerLat) * Math.PI) / 180;
        const dLon = ((rLon - centerLon) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((centerLat * Math.PI) / 180) *
            Math.cos((rLat * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distanceKm = Number((R * c).toFixed(1));
      }
      return {
        id: r._id,
        fullName: r.fullName,
        mobile: r.mobile,
        location: r.location,
        distanceKm,
        isAvailable: !busySet.has(String(r._id)),
      };
    });

    return res.status(200).json({
      success: true,
      riders: formattedRiders,
    });
  } catch (error) {
    console.log("GET NEARBY RIDERS ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getTodayOrderdelivires = async (req, res) => {
  try {
    const deliveryBoyId = req.userId;
    const startsofday = new Date();

    // set when count new day start formatted  hours , min , sec , mili-sec
    startsofday.setHours(0, 0, 0, 0);

    // 🔍 Fetch orders delivered TODAY by a specific delivery boy (current loggedin delivery boy)
    // - Matches orders where at least ONE shopOrder item:
    //   • is assigned to this delivery boy (current logged in delivery boy id)
    //   • has status = "delivered"
    //   • was delivered after start of the day (today)
    // - Uses $elemMatch to ensure all conditions apply to the SAME item in the array

    const orders = await Order.find({
      shopOrders: {
        $elemMatch: {
          assignedDeliveryBoy: deliveryBoyId,
          status: "delivered",
          deliveredAt: { $gte: startsofday },
        },
      },
    }).lean();

    let todayDeliveries = [];
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
