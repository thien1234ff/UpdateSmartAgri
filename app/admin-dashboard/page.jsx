"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import "bootstrap/dist/css/bootstrap.min.css";
import { db, auth } from "../../lib/firebase";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { toast } from "../../lib/toast";

const PAGE_SIZE = 5;

export default function AdminOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [firstDoc, setFirstDoc] = useState(null);
  const [pageHistory, setPageHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // trạng thái cập nhật
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  // ==================================================
  // 1️⃣ Kiểm tra quyền admin
  // ==================================================
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      if (!snap.exists() || snap.data().role !== "admin") {
        toast.error("Bạn không có quyền truy cập trang này!");
        router.push("/");
        return;
      }

      setCheckingAuth(false);
    });

    return () => unsub();
  }, [router]);

  // load đơn hàng
  useEffect(() => {
    if (!checkingAuth) {
      fetchOrders();
    }
  }, [checkingAuth]);

  // ==================================================
  // 2️⃣ Hàm lấy dữ liệu đơn hàng (phân trang)
  // ==================================================
  const fetchOrders = async () => {
    setLoading(true);
    const q = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc"),
      limit(PAGE_SIZE)
    );
    const snap = await getDocs(q);

    if (!snap.empty) {
      setFirstDoc(snap.docs[0]);
      setLastDoc(snap.docs[snap.docs.length - 1]);
      setOrders(formatOrders(snap));
    }
    setLoading(false);
  };

  const fetchNextPage = async () => {
    if (!lastDoc) return;
    setLoading(true);
    const q = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc"),
      startAfter(lastDoc),
      limit(PAGE_SIZE)
    );
    const snap = await getDocs(q);

    if (!snap.empty) {
      setPageHistory((prev) => [...prev, firstDoc]);
      setFirstDoc(snap.docs[0]);
      setLastDoc(snap.docs[snap.docs.length - 1]);
      setOrders(formatOrders(snap));
    }
    setLoading(false);
  };

  const fetchPrevPage = async () => {
    if (pageHistory.length === 0) return;
    const prevDoc = pageHistory[pageHistory.length - 1];

    setLoading(true);
    const q = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc"),
      startAfter(prevDoc),
      limit(PAGE_SIZE)
    );
    const snap = await getDocs(q);

    if (!snap.empty) {
      setPageHistory((prev) => prev.slice(0, -1));
      setFirstDoc(snap.docs[0]);
      setLastDoc(snap.docs[snap.docs.length - 1]);
      setOrders(formatOrders(snap));
    }
    setLoading(false);
  };

  // ==================================================
  // 3️⃣ Format dữ liệu đơn hàng
  // ==================================================
  const formatOrders = (snap) =>
    snap.docs.map((doc) => {
      const data = doc.data();
      let timeStr = "";
      if (data.createdAt?.seconds) {
        const date = new Date(data.createdAt.seconds * 1000);
        timeStr = date.toLocaleString("vi-VN");
      }
      return {
        id: doc.id,
        name: data.customerInfo?.name || "",
        phone: data.customerInfo?.phone || "",
        email: data.customerInfo?.email || "",
        address: data.customerInfo?.address || "",
        total: data.total || 0,
        time: timeStr,
        status: data.status || "pending",
        paymentStatus: data.paymentStatus || "pending",
      };
    });

  // ==================================================
  // 4️⃣ Cập nhật trạng thái đơn hàng & thanh toán
  // ==================================================
  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingStatusId(orderId);
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
      setOrders((prevOrders) =>
        prevOrders.map((o) =>
          o.id === orderId ? { ...o, status: newStatus } : o
        )
      );
      toast.success("Trạng thái đơn hàng đã được cập nhật.");
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi khi cập nhật trạng thái đơn hàng.");
    }
    setUpdatingStatusId(null);
  };

  const handlePaymentChange = async (orderId, newStatus) => {
    setUpdatingStatusId(orderId);
    try {
      await updateDoc(doc(db, "orders", orderId), { paymentStatus: newStatus });
      setOrders((prevOrders) =>
        prevOrders.map((o) =>
          o.id === orderId ? { ...o, paymentStatus: newStatus } : o
        )
      );
      toast.success("Trạng thái thanh toán đã được cập nhật.");
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi khi cập nhật trạng thái thanh toán.");
    }
    setUpdatingStatusId(null);
  };

  // ==================================================
  // 5️⃣ UI
  // ==================================================
  if (checkingAuth) {
    return <p className="text-center mt-5">Đang kiểm tra quyền truy cập...</p>;
  }

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Header />

      <main className="flex-grow-1 container py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="text-success mb-0">📦 Quản Lý Đơn Hàng</h1>
          <button
            className="btn btn-success"
            onClick={() => router.push("/admin-products")}
          >
            🛒 Quản Lý Sản Phẩm
          </button>
        </div>

        <table className="table table-bordered table-striped">
          <thead className="table-success">
            <tr>
              <th>Khách Hàng</th>
              <th>SĐT</th>
              <th>Email</th>
              <th>Địa Chỉ</th>
              <th>Tổng Tiền</th>
              <th>Thời Gian</th>
              <th>Trạng Thái</th>
              <th>Thanh Toán</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center">
                  Đang tải dữ liệu…
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center">
                  Chưa có đơn hàng nào.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.name}</td>
                  <td>{order.phone}</td>
                  <td>{order.email}</td>
                  <td>{order.address}</td>
                  <td>{order.total.toLocaleString("vi-VN")} đ</td>
                  <td>{order.time}</td>

                  {/* trạng thái đơn hàng */}
                  <td>
                    <select
                      className="form-select"
                      style={{ width: "170px" }}
                      value={order.status}
                      disabled={updatingStatusId === order.id}
                      onChange={(e) =>
                        handleStatusChange(order.id, e.target.value)
                      }
                    >
                      <option value="pending">Chờ xử lý</option>
                      <option value="processing">Đang xử lý</option>
                      <option value="shipped">Đã gửi</option>
                      <option value="delivered">Đã nhận</option>
                      <option value="cancelled">Đã hủy</option>
                    </select>
                  </td>

                  {/* trạng thái thanh toán */}
                  <td>
                    <select
                      className="form-select"
                      style={{ width: "160px" }}
                      value={order.paymentStatus}
                      disabled={updatingStatusId === order.id}
                      onChange={(e) =>
                        handlePaymentChange(order.id, e.target.value)
                      }
                    >
                      <option value="pending">Chưa thanh toán</option>
                      <option value="paid">Đã thanh toán</option>
                      <option value="failed">Thanh toán thất bại</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="d-flex justify-content-between mt-3">
          <button
            className="btn btn-outline-secondary"
            onClick={fetchPrevPage}
            disabled={pageHistory.length === 0}
          >
            ⬅ Trang trước
          </button>
          <button
            className="btn btn-outline-primary"
            onClick={fetchNextPage}
            disabled={!lastDoc}
          >
            Trang sau ➡
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
