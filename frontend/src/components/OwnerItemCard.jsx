import axios from "axios";
import React, { useState } from "react";
import { FaPen, FaTrash, FaIndianRupeeSign } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import { serverurl } from "../App";
import { useDispatch } from "react-redux";
import { setMyShopData } from "../redux/ownerSlice";

const OwnerItemCard = ({ data }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${data.name}" from your menu?`)) {
      return;
    }

    try {
      setDeleting(true);
      const result = await axios.get(
        `${serverurl}/api/item/delete/${data._id}`,
        { withCredentials: true },
      );

      if (result.data.success) {
        dispatch(setMyShopData(result.data.shop));
      }
    } catch (error) {
      console.log("DELETE ITEM ERROR:", error);
    } finally {
      setDeleting(false);
    }
  };

  const isVeg = data?.foodType?.toLowerCase() === "veg";

  return (
    <div className="flex flex-col sm:flex-row bg-white rounded-2xl shadow-xs border border-gray-200/80 hover:border-orange-200 hover:shadow-md transition-all duration-200 overflow-hidden w-full group">
      
      {/* DISH THUMBNAIL */}
      <div className="sm:w-44 h-36 sm:h-auto flex-shrink-0 relative overflow-hidden bg-gray-100">
        <img
          src={data.image || "/vite.svg"}
          alt={data.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        
        {/* VEG / NON-VEG BADGE */}
        <div className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-md px-1.5 py-0.5 rounded shadow-xs flex items-center gap-1 border border-white/60">
          <span
            className={`w-3 h-3 border-2 flex items-center justify-center rounded-[2px] ${
              isVeg ? "border-green-600" : "border-red-600"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isVeg ? "bg-green-600" : "bg-red-600"
              }`}
            />
          </span>
          <span className="text-[9px] font-bold tracking-wider uppercase text-gray-700">
            {isVeg ? "Veg" : "Non-Veg"}
          </span>
        </div>
      </div>

      {/* CONTENT & DETAILS */}
      <div className="flex-1 flex flex-col justify-between p-4 sm:p-5 gap-3">
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
              {data.name}
            </h3>
            {data.category && (
              <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full shrink-0">
                {data.category}
              </span>
            )}
          </div>
        </div>

        {/* PRICE & EDIT/DELETE BUTTONS */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center text-lg font-black text-gray-900">
            <FaIndianRupeeSign size={14} className="text-gray-500" />
            <span>{data.price}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/edit-item/${data._id}`)}
              className="p-2 rounded-xl bg-gray-50 hover:bg-orange-50 text-gray-600 hover:text-orange-600 border border-gray-200 hover:border-orange-200 transition"
              title="Edit dish"
              aria-label="Edit dish"
            >
              <FaPen size={12} />
            </button>

            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-2 rounded-xl bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-600 border border-gray-200 hover:border-red-200 transition disabled:opacity-50"
              title="Delete dish"
              aria-label="Delete dish"
            >
              <FaTrash size={12} />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default OwnerItemCard;
