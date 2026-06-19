"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { X, Package, Clock } from "lucide-react";
import { db, auth } from "../lib/firebase";
import OrderDetailModal from "./OrderDetailModal";

export default function OrdersSection({ onClose }) {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Lắng nghe auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // Lấy danh sách đơn hàng
  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "orders"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(data);
        setLoading(false);
      },
      (err) => {
        console.error("Orders error:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  const openDetail = (order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const formatCurrency = (n) => Number(n || 0).toLocaleString("vi-VN") + " đ";

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">Bạn cần đăng nhập để xem đơn hàng.</p>
        <a href="/login" className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-2xl">
          Đăng nhập
        </a>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Đang tải đơn hàng...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-600">{error}</div>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-8 py-6 border-b flex items-center justify-between bg-gray-50">
          <h2 className="text-3xl font-bold text-gray-900">Đơn hàng của tôi</h2>
          <button 
            onClick={onClose} 
            className="p-3 hover:bg-gray-200 rounded-2xl transition-colors"
          >
            <X size={28} />
          </button>
        </div>

        {/* Danh sách đơn hàng */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {orders.length === 0 ? (
            <div className="text-center py-20">
              <Package size={80} className="mx-auto text-gray-300 mb-6" />
              <p className="text-2xl font-medium text-gray-600">Bạn chưa có đơn hàng nào</p>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all bg-white"
              >
                <div className="flex flex-col md:flex-row md:items-start gap-6">
                  
                  {/* Sản phẩm chính (ảnh + tên) */}
                  <div className="flex gap-5 flex-1">
                    {order.items?.[0]?.imageUrl && (
                      <img
                        src={order.items[0].imageUrl}
                        alt={order.items[0].name}
                        className="w-24 h-24 object-cover rounded-xl border"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-lg leading-tight line-clamp-2">
                        {order.items?.[0]?.name || "Đơn hàng"}
                      </p>
                      {order.items?.length > 1 && (
                        <p className="text-sm text-gray-500 mt-1">
                          +{order.items.length - 1} sản phẩm khác
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Thông tin bên phải */}
                  <div className="text-right md:text-left md:w-80 space-y-2">
                    <div className="flex justify-between md:justify-end items-center gap-4">
                      <span className="text-sm text-gray-500">
                        {order.createdAt?.seconds 
                          ? new Date(order.createdAt.seconds * 1000).toLocaleDateString("vi-VN")
                          : "—"}
                      </span>
                      <span className="font-bold text-2xl text-emerald-600">
                        {formatCurrency(order.total)}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-3 justify-end">
                      <span className={`px-4 py-1.5 rounded-2xl text-sm font-medium ${
                        order.status === "delivered" ? "bg-emerald-100 text-emerald-700" :
                        order.status === "cancelled" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {order.status === "delivered" ? "Đã giao" :
                         order.status === "cancelled" ? "Đã hủy" : "Đang xử lý"}
                      </span>
                    </div>

                    <button
                      onClick={() => openDetail(order)}
                      className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-2xl font-medium transition-all"
                    >
                      Xem chi tiết đơn hàng
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Chi Tiết Đơn Hàng */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </div>
  );
}