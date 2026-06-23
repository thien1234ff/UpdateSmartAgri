"use client"

import { Eye, ShoppingCart, Sparkles } from "lucide-react"

export default function ProductCard({ product, onAddToCart, onViewDetail }) {
  const isLowStock = product.stock && product.stock <= 5
  const isOutOfStock = product.stock === 0

  return (
    <div className="group relative bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/30 overflow-hidden hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-700 transform hover:scale-[1.02] hover:-translate-y-3 animate-fade-in product-card">
      <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700 transform group-hover:scale-150"></div>
      <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-br from-orange-400/20 to-red-400/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700 delay-100 transform group-hover:scale-125"></div>

      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/8 via-teal-500/5 to-orange-500/8 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-1000">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000 delay-200"></div>
      </div>

      <div className="relative overflow-hidden rounded-t-3xl">
        <img
          src={product.imageUrl || `/placeholder.svg?height=200&width=200&query=${encodeURIComponent(product.name)}`}
          alt={product.name}
          className="w-full h-48 object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        <div className="absolute top-3 right-3 transition-all duration-500 transform group-hover:scale-110">
          <button
            onClick={() => onViewDetail(product)}
            aria-label={`Xem chi tiết ${product.name}`}
            className="p-3 bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg hover:from-gray-800 hover:to-gray-700 transition-all duration-300 transform hover:scale-110 hover:rotate-3 border border-white/30 ring-2 ring-white/20 hover:shadow-xl"
          >
            <Eye size={18} className="text-white drop-shadow-sm" />
          </button>
        </div>

        {product.discount && product.discount > 0 && (
          <div className="absolute top-3 left-3 px-3 py-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full shadow-lg border border-white/20 transform group-hover:scale-105 transition-transform duration-300">
            -{product.discount}%
          </div>
        )}

        {product.category && (
          <div
            className={`absolute top-3 ${product.discount && product.discount > 0 ? "left-20" : "left-3"} px-3 py-1 bg-gradient-to-r from-orange-500/90 to-red-500/90 backdrop-blur-sm text-white text-xs font-semibold rounded-full shadow-lg border border-white/20 transform group-hover:scale-105 transition-transform duration-300`}
          >
            {product.category}
          </div>
        )}

        {product.stock !== undefined && (
          <div
            className={`absolute bottom-3 right-3 px-2 py-1 text-xs font-semibold rounded-full shadow-lg border border-white/20 ${
              isOutOfStock
                ? "bg-gradient-to-r from-red-500/90 to-red-600/90 text-white"
                : isLowStock
                  ? "bg-gradient-to-r from-yellow-500/90 to-orange-500/90 text-white"
                  : "bg-gradient-to-r from-green-500/90 to-emerald-500/90 text-white"
            }`}
          >
            {isOutOfStock ? "Hết hàng" : `Còn ${product.stock}`}
          </div>
        )}
      </div>

      <div className="p-6 relative z-10">
        {product.brand && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-gray-500 font-medium">Thương hiệu:</span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              {product.brand}
            </span>
          </div>
        )}

        <h3 className="font-bold text-lg bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3 group-hover:from-emerald-700 group-hover:to-teal-700 transition-all duration-500 line-clamp-2">
          {product.name}
        </h3>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2 group-hover:text-gray-700 transition-colors duration-300">
          {product.description}
        </p>

        {(product.weight || product.dimensions) && (
          <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
            {product.weight && (
              <span className="flex items-center gap-1">
                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                {product.weight}
              </span>
            )}
            {product.dimensions && (
              <span className="flex items-center gap-1">
                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                {product.dimensions}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-6">
          <div className="flex flex-col gap-1">
            {product.discount && product.discount > 0 && (
              <span className="text-sm text-gray-400 line-through whitespace-nowrap">
                {(product.price || 0).toLocaleString("vi-VN")}đ
              </span>
            )}
            <div className="flex items-center gap-2">
              <Sparkles
                size={16}
                className="text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              />
              <span className="text-xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent group-hover:from-orange-500 group-hover:via-red-500 group-hover:to-pink-500 transition-all duration-500 whitespace-nowrap">
                {product.discount && product.discount > 0
                  ? ((product.price || 0) * (1 - product.discount / 100)).toLocaleString("vi-VN")
                  : (product.price || 0).toLocaleString("vi-VN")}
                đ
              </span>
            </div>
          </div>

          <button
            onClick={() => onAddToCart(product)}
            disabled={isOutOfStock}
            aria-label={isOutOfStock ? `${product.name} đã hết hàng` : `Thêm ${product.name} vào giỏ hàng`}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-semibold transition-all duration-500 transform hover:scale-105 hover:-translate-y-1 shadow-lg border border-white/20 ml-4 ${
              isOutOfStock
                ? "bg-gray-400 text-gray-600 cursor-not-allowed opacity-50"
                : "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40"
            }`}
          >
            <ShoppingCart size={16} className="transition-transform duration-300 group-hover:rotate-12" />
            <span>{isOutOfStock ? "Hết hàng" : "Thêm"}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
