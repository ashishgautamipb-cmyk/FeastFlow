import React from "react";

function CategoryCard({ name, image, onClick, isSelected = false }) {
  return (
    <div
      onClick={onClick}
      className={`group relative flex flex-col items-center cursor-pointer shrink-0 transition-all duration-200 select-none ${
        isSelected ? "scale-105" : "hover:-translate-y-1"
      }`}
    >
      {/* Circle Image Wrapper */}
      <div
        className={`w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden bg-white p-1 transition-all duration-300 shadow-sm ${
          isSelected
            ? "border-2 border-orange-500 shadow-md shadow-orange-500/20 ring-4 ring-orange-500/10"
            : "border border-gray-200 group-hover:border-orange-300 group-hover:shadow-md"
        }`}
      >
        <div className="w-full h-full rounded-xl overflow-hidden bg-orange-50/50">
          <img
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            src={image}
            alt={name}
            loading="lazy"
          />
        </div>
      </div>

      {/* Label */}
      <span
        className={`mt-2 text-xs sm:text-sm font-semibold tracking-tight transition-colors text-center line-clamp-1 max-w-[100px] ${
          isSelected
            ? "text-orange-600 font-bold"
            : "text-gray-700 group-hover:text-orange-600"
        }`}
      >
        {name}
      </span>
    </div>
  );
}

export default CategoryCard;
