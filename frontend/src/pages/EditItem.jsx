import React, { useEffect, useState } from "react";
import { IoIosArrowRoundBack } from "react-icons/io";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { FaUtensils, FaUpload, FaLeaf, FaDrumstickBite } from "react-icons/fa6";
import { FiImage } from "react-icons/fi";
import axios from "axios";
import { setMyShopData } from "../redux/ownerSlice";
import { serverurl } from "../App";

function EditItem() {
  const navigate = useNavigate();
  const { itemId } = useParams();
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [frontendImage, setFrontendImage] = useState("");
  const [backendImage, setBackendImage] = useState(null);
  const [category, setCategory] = useState("Snacks");
  const [foodType, setFoodType] = useState("veg");
  const [errorMsg, setErrorMsg] = useState("");

  const categories = [
    "Snacks",
    "Main Course",
    "Desserts",
    "Pizza",
    "Burgers",
    "Sandwiches",
    "South Indian",
    "North Indian",
    "Chinese",
    "Fast Food",
    "Beverages",
    "Salads",
    "Others",
  ];

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBackendImage(file);
      setFrontendImage(URL.createObjectURL(file));
    }
  };

  useEffect(() => {
    const handleGetItemById = async () => {
      try {
        setFetching(true);
        const result = await axios.get(
          `${serverurl}/api/item/get-by-id/${itemId}`,
          { withCredentials: true },
        );

        if (result.data.success && result.data.item) {
          const item = result.data.item;
          setName(item.name || "");
          setPrice(item.price || "");
          setCategory(item.category || "Snacks");
          setFoodType(item.foodType || "veg");
          setFrontendImage(item.image || "");
        }
      } catch (error) {
        console.log(error);
        setErrorMsg("Failed to load dish details.");
      } finally {
        setFetching(false);
      }
    };

    if (itemId) handleGetItemById();
  }, [itemId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !price) {
      setErrorMsg("Please enter both dish name and pricing.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("category", category);
      formData.append("foodType", foodType);
      formData.append("price", price);

      if (backendImage) {
        formData.append("image", backendImage);
      }

      const result = await axios.post(
        `${serverurl}/api/item/edit-item/${itemId}`,
        formData,
        { withCredentials: true },
      );

      if (result.data.shop) {
        dispatch(setMyShopData(result.data.shop));
      }
      navigate("/");
    } catch (error) {
      console.log(error);
      setErrorMsg(error.response?.data?.message || "Failed to update dish.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-[#fafafa] gap-3">
        <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Loading dish details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] px-4 py-8 flex justify-center">
      <div className="w-full max-w-xl space-y-6">
        
        {/* HEADER */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            aria-label="Back"
            className="p-2.5 rounded-2xl bg-white border border-gray-200/80 shadow-xs hover:border-orange-500 hover:text-orange-600 transition"
          >
            <IoIosArrowRoundBack size={26} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Edit Dish
            </h1>
            <p className="text-xs text-gray-500">
              Update pricing, photos, dietary tags, and categorization
            </p>
          </div>
        </div>

        {/* ERROR ALERT */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
            {errorMsg}
          </div>
        )}

        {/* FORM CONTAINER */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6 sm:p-8 space-y-5">
          
          {/* FOOD IMAGE UPLOAD */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              Food Image
            </label>
            <div className="relative rounded-2xl overflow-hidden border-2 border-dashed border-gray-300 hover:border-orange-500 bg-gray-50 transition group">
              {frontendImage ? (
                <div className="relative h-48 w-full overflow-hidden">
                  <img
                    src={frontendImage}
                    alt="Food preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-2">
                    <FaUpload />
                    <span>Change Image</span>
                  </div>
                </div>
              ) : (
                <div className="py-10 flex flex-col items-center justify-center text-center px-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mb-2">
                    <FiImage size={24} />
                  </div>
                  <p className="text-xs font-bold text-gray-800">Upload Dish Image</p>
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={handleImage}
                className="absolute inset-0 opacity-0 cursor-pointer"
                aria-label="Upload food dish photo"
              />
            </div>
          </div>

          {/* NAME */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              Dish Name
            </label>
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Margherita Basil Pizza"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition"
            />
          </div>

          {/* PRICE & CATEGORY */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Price (₹)
              </label>
              <input
                required
                type="number"
                min="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="249"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition cursor-pointer bg-white"
              >
                {categories.map((cate, index) => (
                  <option value={cate} key={index}>
                    {cate}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* FOOD TYPE SELECTOR */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              Dietary Specification
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFoodType("veg")}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs font-bold transition ${
                  foodType === "veg"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <FaLeaf className={foodType === "veg" ? "text-emerald-600" : "text-gray-400"} />
                <span>Vegetarian</span>
              </button>

              <button
                type="button"
                onClick={() => setFoodType("non veg")}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs font-bold transition ${
                  foodType === "non veg"
                    ? "bg-red-50 border-red-500 text-red-800 shadow-xs"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <FaDrumstickBite className={foodType === "non veg" ? "text-red-600" : "text-gray-400"} />
                <span>Non-Vegetarian</span>
              </button>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-bold rounded-2xl shadow-md shadow-orange-500/25 active:scale-[0.99] transition duration-200 text-sm disabled:opacity-60 cursor-pointer mt-2"
          >
            {loading ? "Saving Changes..." : "Save Dish Changes"}
          </button>

        </form>

      </div>
    </div>
  );
}

export default EditItem;
