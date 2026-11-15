import mongoose from "mongoose";

const shopSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    image: { type: String, required: true },
    //Store a user’s ID here and link this document to that user.
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    city: { type: String, required: true },
    state: { type: String, required: true },
    address: { type: String, required: true },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [88.3639, 22.5726] }, // default [lon, lat]
    },
    // array because we add multiple items in our cart
    items: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item",
      },
    ],
  },
  { timestamps: true },
);

shopSchema.index({ location: "2dsphere" });

const Shop = mongoose.model("Shop", shopSchema);

export default Shop;
