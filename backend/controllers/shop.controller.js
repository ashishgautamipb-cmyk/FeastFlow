import Shop from "../models/shop.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import Item from "../models/item.model.js";

export const createEditShop = async (req, res) => {
  try {
    const { name, city, state, address, latitude, longitude } = req.body;

    if (!name?.trim() || !city?.trim() || !address?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Restaurant name, city, and street address are required.",
      });
    }

    let image;
    if (req.file) {
      image = await uploadOnCloudinary(req.file.path);
    }

    const latNum = Number(latitude);
    const lonNum = Number(longitude);
    const hasCoordinates = !isNaN(latNum) && !isNaN(lonNum) && (latNum !== 0 || lonNum !== 0);

    let shop = await Shop.findOne({ owner: req.userId });

    // CREATE SHOP
    if (!shop) {
      const shopImage =
        image ||
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800";
      
      const newShopData = {
        name,
        city,
        state: state || "West Bengal",
        address,
        image: shopImage,
        owner: req.userId,
      };

      if (hasCoordinates) {
        newShopData.location = {
          type: "Point",
          coordinates: [lonNum, latNum], // GeoJSON: [longitude, latitude]
        };
      }

      shop = await Shop.create(newShopData);
    }
    // UPDATE SHOP
    else {
      const updateData = {
        name,
        city,
        state: state || shop.state || "West Bengal",
        address,
      };

      if (image) updateData.image = image;
      if (hasCoordinates) {
        updateData.location = {
          type: "Point",
          coordinates: [lonNum, latNum],
        };
      }

      shop = await Shop.findByIdAndUpdate(shop._id, updateData, { new: true });
    }

    await shop.populate("owner");

    return res.status(200).json({
      success: true,
      shop,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// getting owner shop
export const getMyShop = async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.userId })
      .populate("owner")
      .populate("items");

    if (!shop) {
      return res.status(200).json({
        success: true,
        shop: null,
      });
    }

    return res.status(200).json({
      success: true,
      shop,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getShopByCity = async (req, res) => {
  try {
    const { city } = req.params;

    const shops = await Shop.find({
      // match city exactly but ignore uppercase/lowercase
      // ^ → start of word
      // $ → end of word
      // ensures only exact city matches
      // "i" flag → case insensitive
      city: { $regex: new RegExp(`^${city}$`, "i") },
    }).populate("items");

    if (!shops) {
      return res.json({
        success: false,
        message: "NO SHOPS FOUND",
      });
    }

    return res.json({
      success: true,
      shops,
    });
  } catch (error) {
    console.log(error);
    return res.json({
      success: false,
      message: error.message,
    });
  }
};

// 📍 Get shops within a given kilometer range (default 10 km = 10,000 meters)
export const getNearbyShops = async (req, res) => {
  try {
    const { lat, lon, maxDistance = 10000 } = req.query; // in meters

    const latitude = Number(lat);
    const longitude = Number(lon);
    let shops = [];

    if (!isNaN(latitude) && !isNaN(longitude) && (latitude !== 0 || longitude !== 0)) {
      shops = await Shop.find({
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [longitude, latitude],
            },
            $maxDistance: Number(maxDistance),
          },
        },
      })
        .populate("items")
        .populate("owner", "fullName email mobile");
    }

    // Fallback: If no shops found within 10 km (or coordinates not provided), return all shops
    if (!shops || shops.length === 0) {
      shops = await Shop.find()
        .populate("items")
        .populate("owner", "fullName email mobile");
    }

    // Compute Haversine distance in km for each shop
    const shopsWithDistance = shops.map((s) => {
      const sObj = s.toObject ? s.toObject() : { ...s };
      if (!isNaN(latitude) && !isNaN(longitude) && s.location?.coordinates?.length === 2) {
        const [sLon, sLat] = s.location.coordinates;
        const R = 6371; // Earth radius in km
        const dLat = ((sLat - latitude) * Math.PI) / 180;
        const dLon = ((sLon - longitude) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((latitude * Math.PI) / 180) *
            Math.cos((sLat * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        sObj.distanceKm = Number((R * c).toFixed(1));
        sObj.isWithin10Km = sObj.distanceKm <= 10;
      } else {
        sObj.distanceKm = null;
        sObj.isWithin10Km = true;
      }
      return sObj;
    });

    // Sort closest first
    shopsWithDistance.sort((a, b) => {
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });

    return res.status(200).json({
      success: true,
      shops: shopsWithDistance,
      count: shopsWithDistance.length,
    });
  } catch (error) {
    console.log("GET NEARBY SHOPS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
