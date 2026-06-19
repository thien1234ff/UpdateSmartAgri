"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../../lib/firebase";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import OrderDetailModal from "../../components/OrderDetailModal";
import { Package, ChevronLeft, ChevronRight, CheckCircle, Clock } from "lucide-react";

const ORDERS_PER_PAGE = 2;

export default function MyOrders() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Kiểm tra đăng nhập
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // Lấy đơn hàng
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

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setOrders(data);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const openDetail = (order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const formatCurrency = (n) => Number(n || 0).toLocaleString("vi-VN") + " đ";

  // Phân trang
  const totalPages = Math.ceil(orders.length / ORDERS_PER_PAGE);
  const currentOrders = orders.slice(
    (currentPage - 1) * ORDERS_PER_PAGE,
    currentPage * ORDERS_PER_PAGE
  );

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const getPaymentStatus = (status) => {
    if (status === "paid") {
      return {
        text: "Đã thanh toán",
        color: "bg-emerald-100 text-emerald-700 border-emerald-200",
        icon: <CheckCircle size={16} />
      };
    }
    return {
      text: "Chưa thanh toán",
      color: "bg-orange-100 text-orange-700 border-orange-200",
      icon: <Clock size={16} />
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-600">Đang tải đơn hàng...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Đơn hàng của tôi</h1>
            <p className="text-gray-600 mt-1">Tổng cộng: {orders.length} đơn hàng</p>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow">
            <Package size={80} className="mx-auto text-gray-300 mb-6" />
            <p className="text-2xl font-medium text-gray-600">Bạn chưa có đơn hàng nào</p>
            <a href="/products" className="mt-6 inline-block bg-emerald-600 text-white px-8 py-3 rounded-2xl">
              Mua sắm ngay
            </a>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {currentOrders.map((order) => {
                const paymentStatus = getPaymentStatus(order.paymentStatus);
                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-3xl shadow hover:shadow-xl transition-all duration-300 overflow-hidden"
                  >
                    <div className="p-6 flex flex-col md:flex-row gap-6">
                      {/* Ảnh sản phẩm */}
                      <div className="w-28 h-28 flex-shrink-0">
                        {order.items?.[0]?.imageUrl ? (
                          <img
                            src={order.items[0].imageUrl}
                            alt={order.items[0].name}
                            className="w-full h-full object-cover rounded-2xl"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 rounded-2xl flex items-center justify-center">
                            <Package size={40} className="text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Thông tin đơn hàng */}
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-xl">
                              Mã đơn: <span className="text-emerald-600">#{order.id.slice(0, 8).toUpperCase()}</span>
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {order.createdAt?.seconds 
                                ? new Date(order.createdAt.seconds * 1000).toLocaleString("vi-VN")
                                : "—"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-3xl font-bold text-emerald-600">
                              {formatCurrency(order.total)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 text-gray-700">
                          <p><strong>Người nhận:</strong> {order.customerInfo?.name} - {order.customerInfo?.phone}</p>
                          <p className="line-clamp-1"><strong>Địa chỉ:</strong> {order.customerInfo?.address}</p>
                        </div>

                        {/* Trạng thái thanh toán - PHẦN MỚI */}
                        <div className="mt-4 flex items-center gap-3">
                          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium border ${paymentStatus.color}`}>
                            {paymentStatus.icon}
                            {paymentStatus.text}
                          </span>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-3">
                          <button
                            onClick={() => openDetail(order)}
                            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-medium transition"
                          >
                            Xem chi tiết
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Phân trang */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-10">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 px-5 py-3 border rounded-2xl disabled:opacity-50 hover:bg-gray-100 transition"
                >
                  <ChevronLeft size={20} />
                  Trước
                </button>

                <span className="px-6 py-3 text-gray-700 font-medium">
                  Trang {currentPage} / {totalPages}
                </span>

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2 px-5 py-3 border rounded-2xl disabled:opacity-50 hover:bg-gray-100 transition"
                >
                  Sau
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />

      <OrderDetailModal
        order={selectedOrder}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </div>
  );
}