// components/OrderDetailModal.jsx
"use client";
import { useEffect, useRef } from "react";
import { X, ArrowLeft, User, MapPin, Package, CreditCard, Clock } from "lucide-react";

export default function OrderDetailModal({ order, isOpen, onClose }) {
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);

  const formatCurrency = (n) =>
    Number(n || 0).toLocaleString("vi-VN") + " đ";

  // Focus Trap + Esc key
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "Tab") {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Tự động focus khi modal mở
  useEffect(() => {
    if (isOpen && modalRef.current) {
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  if (!order || !isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-all duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="bg-white w-full max-w-4xl max-h-[95vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col focus:outline-none"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b px-8 py-5 flex items-center justify-between bg-gray-50 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="p-3 hover:bg-gray-200 rounded-2xl transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
              aria-label="Quay lại"
            >
              <ArrowLeft size={26} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Đơn hàng #{order.id?.slice(0, 8).toUpperCase()}
              </h1>
              <p className="text-sm text-gray-500">
                {order.createdAt?.seconds 
                  ? new Date(order.createdAt.seconds * 1000).toLocaleString("vi-VN")
                  : order.time || "—"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-5 py-2 rounded-2xl text-sm font-medium ${
              order.paymentStatus === "paid" 
                ? "bg-emerald-100 text-emerald-700" 
                : "bg-orange-100 text-orange-700"
            }`}>
              {order.paymentStatus === "paid" ? "✅ Đã thanh toán" : "⏳ Chưa thanh toán"}
            </span>
          </div>
        </div>

        {/* Nội dung */}
        <div className="flex-1 overflow-y-auto p-8 space-y-10">
          
          {/* Thông tin khách hàng */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <User className="text-emerald-600" size={28} />
                <h3 className="text-xl font-semibold">Thông tin người nhận</h3>
              </div>
              <p className="text-2xl font-medium">{order.customerInfo?.name}</p>
              <p className="text-lg text-gray-700 mt-1">{order.customerInfo?.phone}</p>
              {order.customerInfo?.email && <p className="text-gray-600">{order.customerInfo?.email}</p>}
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="text-emerald-600" size={28} />
                <h3 className="text-xl font-semibold">Địa chỉ giao hàng</h3>
              </div>
              <p className="text-gray-700 leading-relaxed text-lg">
                {order.customerInfo?.address}
              </p>
              {order.distanceKm && (
                <p className="mt-3 text-sm text-gray-600">
                  Khoảng cách: <span className="font-medium">{order.distanceKm.toFixed(2)} km</span>
                </p>
              )}
            </div>
          </div>

          {/* Danh sách sản phẩm */}
          <div>
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-3">
              <Package className="text-emerald-600" size={28} />
              Sản phẩm trong đơn
            </h3>
            <div className="space-y-6">
              {order.items?.map((item, index) => (
                <div key={index} className="flex gap-6 border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-all">
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-28 h-28 object-cover rounded-xl border flex-shrink-0"
                    />
                  )}
                  <div className="flex-1">
                    <p className="text-xl font-medium text-gray-900">{item.name}</p>
                    <div className="mt-4 flex justify-between items-end">
                      <div>
                        <span className="text-2xl font-semibold text-emerald-600">
                          {formatCurrency(item.discountedPrice || item.price)}
                        </span>
                        <span className="text-gray-500 ml-3">× {item.quantity}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency((item.discountedPrice || item.price) * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tổng thanh toán */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-3xl p-8 border border-emerald-100">
            <div className="flex justify-between items-end">
              <span className="text-2xl text-gray-700">Tổng thanh toán</span>
              <span className="text-4xl font-bold text-emerald-700">
                {formatCurrency(order.total)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}