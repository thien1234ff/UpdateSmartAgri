"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp , doc, updateDoc, runTransaction,setDoc,getDoc} from "firebase/firestore"
import { db, auth } from "../../lib/firebase"
import Header from "../../components/Header"
import Footer from "../../components/Footer"
import { useCart } from "../../contexts/CartContext"
import { ShoppingCart, X, Plus, Minus, Trash2, Package, Search, Filter } from "lucide-react"
import ProductDetailModal from "../../components/ProductDetailModal"
import ProductCard from "../../components/ProductCard"
import { STORE_LOCATION, getLatLngFromAddress, haversineDistance, calculateShippingFee } from "../../utils/shipping"
import OrdersSection from "../../components/OrdersSection"
import PaymentQR from "../../components/PaymentQR"
export default function Store() {
  const router = useRouter();
  const [allProducts, setAllProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [currentCategory, setCurrentCategory] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [orderMessage, setOrderMessage] = useState("")
  const [showAdminQR, setShowAdminQR] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [productsPerPage] = useState(12)
  const searchRef = useRef(null)
  const [paymentMethodState, setPaymentMethodState] = useState("")
  const { cart, addToCart, changeQuantity, removeFromCart, clearCart, calculateCartTotal } = useCart()
  const [distanceKm, setDistanceKm] = useState(0)
  const [isCalcShipping, setIsCalcShipping] = useState(false)
  const [view, setView] = useState("products")
  const [createdOrderId, setCreatedOrderId] = useState(null);
  const [createdOrderTotal, setCreatedOrderTotal] = useState(0);
  const [orderPaymentStatus, setOrderPaymentStatus] = useState("unpaid");
  const [showQR, setShowQR] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [address, setAddress] = useState("")
  const [error, setError] = useState("")
  // STATE dành cho modal chi tiết
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const openDetail = (product) => {
    setSelectedProduct(product)
    setIsDetailOpen(true)
  }
  const closeDetail = () => {
    setSelectedProduct(null)
    setIsDetailOpen(false)
  }

  // Khi component mount xong ở client
  useEffect(() => {
    setMounted(true)
  }, [])

  // Lấy danh sách sản phẩm realtime
  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("name"))
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list = []
        snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }))
        setAllProducts(list)
      },
      (error) => {
        console.error("Lỗi khi lấy sản phẩm:", error.message)
      },
    )
    return () => unsub()
  }, [])

  // Cập nhật categories khi allProducts thay đổi
  useEffect(() => {
    const cats = Array.from(new Set(allProducts.map((p) => (p.category ? p.category : "khác")))).sort()
    setCategories(cats)
    filterProducts(allProducts, currentCategory, searchTerm)
  }, [allProducts])

  // Lọc sản phẩm mỗi khi currentCategory hoặc searchTerm thay đổi
  useEffect(() => {
    filterProducts(allProducts, currentCategory, searchTerm)
    setCurrentPage(1)
  }, [currentCategory, searchTerm])
  // Hàm lọc sản phẩm
  function filterProducts(products, category, search) {
    const s = (search || "").trim().toLowerCase()
    const filtered = products.filter((p) => {
      const matchesCategory = category === "all" || (p.category || "") === category
      const hay = `${p.name} ${p.description || ""} ${p.category || ""}`.toLowerCase()
      const matchesSearch = s === "" || hay.includes(s)
      return matchesCategory && matchesSearch
    })
    setFilteredProducts(filtered)
  }
  function showNotification(msg) {
    setOrderMessage(msg)
    setTimeout(() => setOrderMessage(""), 3500)
  }
  // ---------- TÍNH PHÍ VẬN CHUYỂN ----------------
  // Nếu bạn muốn tính phí tự động dựa trên địa chỉ, hãy gọi hàm này
  // trong `handleAddressBlur` (xem phía dưới). Ngược lại, nếu muốn
  // người dùng nhập km, chỉ cần bỏ hàm này và dùng `distanceKm` trực tiếp.
  async function calculateShippingFromAddress(address) {
    if (!address) {
      setDistanceKm(0)
      return 0
    }
    setIsCalcShipping(true)
    try {
      const { lat, lng } = await getLatLngFromAddress(address)
      const d = haversineDistance(STORE_LOCATION.lat, STORE_LOCATION.lng, lat, lng)
      const km = Number(d.toFixed(2))
      setDistanceKm(km)
      return km
    } catch (err) {
      console.error("Không tính được khoảng cách:", err)
      setDistanceKm(0)
      return 0
    } finally {
      setIsCalcShipping(false)
    }
  }
  // --------- Xử lý khi người dùng rời khỏi ô địa chỉ ----------
  const handleAddressBlur = async (e) => {
    const input = e.target.value.trim()
    setAddress(input)
    setError("") // reset lỗi trước

    if (!input) return

    const result = await getLatLngFromAddress(input)

    if (!result.success) {
      setError("Địa chỉ không hợp lệ. Vui lòng kiểm tra lại.")
    } else {
      // giả sử bạn có hàm tính khoảng cách từ lat/lng
      const km = await calculateShippingFromAddress(result.input)
      console.log("[Distance]", input, "=>", km, "km")
    }
  }
async function handlePlaceOrder(e) {
  e.preventDefault();
  if (isPlacingOrder) return;
  if (!auth.currentUser) {
    setOrderMessage("Vui lòng đăng nhập để đặt hàng.");
    return;
  }

  const form = new FormData(e.target);
  const name = form.get("customerName")?.trim();
  const phone = form.get("customerPhone")?.trim();
  const email = form.get("customerEmail")?.trim() || "";
  const address = form.get("customerAddress")?.trim();
  const paymentMethod = form.get("paymentMethod");
  const deliveryTime = form.get("deliveryTime") || "standard";
  const note = form.get("orderNote")?.trim() || "";

  const distance = distanceKm;

  if (!name || !phone || !address || !paymentMethod) {
    setOrderMessage("Vui lòng nhập đầy đủ thông tin bắt buộc.");
    return;
  }

  if (cart.length === 0) {
    setOrderMessage("Giỏ hàng trống, không thể đặt hàng.");
    return;
  }

  const subtotal = calculateCartTotal();
  const shipping = calculateShippingFee(subtotal, distance);
  const total = subtotal + shipping;

  const orderData = {
    customerInfo: { name, phone, email, address },
    items: cart.map((it) => {
      const price = Number(it.price) || 0;
      const quantity = Number(it.quantity) || 1;
      const discount = Number(it.discount) || 0;
      const discountedPrice = discount > 0
        ? Number(Math.round(price * (1 - discount / 100)))
        : price;
      return {
        id: it.id,
        name: it.name,
        price, // giá gốc
        discount, // phần trăm giảm giá
        discountedPrice, // giá sau khi giảm
        quantity,
        total: discountedPrice * quantity,
        imageUrl: it.imageUrl || "",
      };
    }),

    paymentMethod,
    deliveryTime,
    note,
    distanceKm: distance,
    subtotal: Number(subtotal),
    shipping: Number(shipping),
    total: Number(total),
    status: "pending",
    paymentStatus: "unpaid",
    createdAt: serverTimestamp(),
    userId: auth.currentUser.uid,
  };

  try {
    setIsPlacingOrder(true);

    // Tạo tham chiếu cho tài liệu đơn hàng mới
    const orderRef = doc(collection(db, "orders")); // Tạo ID trước

    // Sử dụng transaction để cập nhật tồn kho và lưu đơn hàng
    await runTransaction(db, async (transaction) => {
      // Lưu trữ dữ liệu tồn kho đã đọc
      const stockData = [];

      // Giai đoạn đọc: Kiểm tra số lượng tồn kho
      for (const item of cart) {
        const productRef = doc(db, "products", item.id);
        const productSnap = await transaction.get(productRef); // Thao tác đọc

        if (!productSnap.exists()) {
          throw new Error(`Sản phẩm ${item.name} không tồn tại.`);
        }

        const productData = productSnap.data();
        const currentStock = productData.stock || 0;

        if (currentStock < item.quantity) {
          throw new Error(`Sản phẩm ${item.name} không đủ số lượng tồn kho.`);
        }

        // Lưu thông tin để sử dụng trong giai đoạn ghi
        stockData.push({
          productRef,
          currentStock,
          quantity: item.quantity,
        });
      }

      // Giai đoạn ghi: Cập nhật tồn kho và lưu đơn hàng
      for (const { productRef, currentStock, quantity } of stockData) {
        transaction.update(productRef, {
          stock: currentStock - quantity,
        }); // Thao tác ghi
      }
      orderData.orderId = orderRef.id;
      // Lưu đơn hàng
      transaction.set(orderRef, orderData); // Thao tác ghi
      setCreatedOrderId(orderRef.id);
      setCreatedOrderTotal(total);
      setOrderPaymentStatus("unpaid");
      setShowQR(true);
      if (paymentMethod === "bank") {
        setPaymentMethodState("bank"); // đồng bộ state để QR hiện
        setShowQR(true);
        setIsQRModalOpen(true); 
      }
    });

    console.log("Đơn hàng được lưu với ID:", orderRef.id);
    clearCart();
    setIsCheckoutOpen(false);
    setIsCartOpen(false);
    e.target.reset();
    setDistanceKm(0);
    showNotification("🎉 Đặt hàng thành công!");
    
  } catch (err) {
    console.error("Lỗi khi xử lý đơn hàng:", err.message);
    showNotification(`❌ Lỗi: ${err.message}`);
  } finally {
    setIsPlacingOrder(false);
  }
}
  useEffect(() => {
  if (!createdOrderId) return;

  const interval = setInterval(async () => {
    const snap = await getDoc(doc(db, "orders", createdOrderId));
    if (snap.exists()) {
      const data = snap.data();
      setOrderPaymentStatus(data.paymentStatus);
    }
  }, 5000); // kiểm tra mỗi 5 giây

  return () => clearInterval(interval);
}, [createdOrderId]);
  // ==================== FOCUS TRAP CHO MODAL GIỎ HÀNG ====================
  const cartModalRef = useRef(null);
  const closeButtonRef = useRef(null);

  const handleCartKeyDown = (e) => {
    if (!isCartOpen || !cartModalRef.current) return;

    if (e.key === "Escape") {
      setIsCartOpen(false);
      return;
    }

    if (e.key === "Tab") {
      const focusableElements = cartModalRef.current.querySelectorAll(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    }
  };

  // Tự động focus khi mở modal
  useEffect(() => {
    if (isCartOpen && cartModalRef.current) {
      setTimeout(() => {
        if (closeButtonRef.current) {
          closeButtonRef.current.focus();
        } else {
          cartModalRef.current.focus();
        }
      }, 100);
    }
  }, [isCartOpen]);
  // ==================== FOCUS TRAP CHO MODAL CHECKOUT ====================
  const checkoutModalRef = useRef(null);
  const checkoutCloseRef = useRef(null);

  const handleCheckoutKeyDown = (e) => {
    if (!isCheckoutOpen || !checkoutModalRef.current) return;

    if (e.key === "Escape") {
      setIsCheckoutOpen(false);
      return;
    }

    if (e.key === "Tab") {
      const focusableElements = checkoutModalRef.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea, [tabindex]:not([tabindex="-1"])'
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

  // Tự động focus khi mở modal Thanh toán
  useEffect(() => {
    if (isCheckoutOpen && checkoutModalRef.current) {
      setTimeout(() => {
        // Ưu tiên focus vào input Họ và Tên
        const firstInput = checkoutModalRef.current.querySelector('input[name="customerName"]');
        if (firstInput) {
          firstInput.focus();
        } else if (checkoutCloseRef.current) {
          checkoutCloseRef.current.focus();
        }
      }, 150);
    }
  }, [isCheckoutOpen]);
  // Phân trang
  const indexOfLastProduct = currentPage * productsPerPage
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct)
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage)

  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  const productsCountText =
    filteredProducts.length === 0 ? "Không có sản phẩm" : `Hiển thị ${filteredProducts.length} sản phẩm`
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-200/30 to-teal-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-green-200/30 to-emerald-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <Header setIsCartOpen={setIsCartOpen} cartCount={cart.length} />
      <main className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        {view === "products" ? (
          <>
            <div className="text-center mb-12 animate-fade-in">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-emerald-700 mb-4 leading-tight tracking-tight">
                Sản Phẩm Nông Sản Tươi Ngon
              </h1>
              <div className="w-24 h-1 bg-emerald-500 mx-auto rounded-full"></div>
              <p className="text-gray-600 mt-5 text-lg">{productsCountText}</p>
            </div>

            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6 mb-8 animate-slide-up delay-500">
              {/* ---------- TAB CHUYỂN VIEW ---------- */}
              <div className="flex justify-center gap-4 mb-6">
                <button
                  onClick={() => setView("products")}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                    view === "products"
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25"
                      : "bg-gray-100/80 text-gray-700 hover:bg-gray-200/80 hover:shadow-md"
                  }`}
                >
                  Sản phẩm
                </button>
                <button
                  onClick={() => router.push('/orders')}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                    view === "orders"
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25"
                      : "bg-gray-100/80 text-gray-700 hover:bg-gray-200/80 hover:shadow-md"
                  }`}
                >
                  Đơn hàng của tôi
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 relative group">
                  <Search
                    size={20}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors"
                  />
                  <input
                    type="text"
                    placeholder="Tìm kiếm sản phẩm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:shadow-lg focus:shadow-emerald-500/10 outline-none transition-all duration-300 bg-white/50 backdrop-blur-sm"
                  />
                </div>
                <div className="flex items-center gap-2 group w-full md:w-auto">
                  <Filter size={20} className="text-gray-400 group-hover:text-emerald-500 transition-colors" />
                  <select
                    value={currentCategory}
                    onChange={(e) => setCurrentCategory(e.target.value)}
                    className="w-full md:w-auto px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:shadow-lg focus:shadow-emerald-500/10 outline-none bg-white/50 backdrop-blur-sm transition-all duration-300 hover:shadow-md"
                  >
                    <option value="all">Tất cả danh mục</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
              {filteredProducts.length === 0 ? (
                <div className="col-span-full text-center py-16 animate-fade-in">
                  <div className="relative">
                    <Package size={64} className="mx-auto text-gray-400 mb-4 animate-bounce" />
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-full blur-xl animate-pulse"></div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy sản phẩm</h3>
                  <p className="text-gray-600">😔 Không tìm thấy sản phẩm nào phù hợp</p>
                </div>
              ) : (
                currentProducts.map((product, index) => {
                  return (
                    <div key={product.id} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                      <ProductCard
                        product={product}
                        onAddToCart={(p) => {
                          console.log("Thêm vào giỏ:", p); // Kiểm tra discount có không
                          addToCart(p)
                          showNotification(`Đã thêm "${p.name}" vào giỏ hàng! 🛒`)
                        }}
                        onViewDetail={openDetail}
                      />
                    </div>
                  );
                })
              )}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 animate-fade-in">
                <div className="w-full overflow-x-auto">
                  <div className="inline-flex items-center gap-2 px-1">
                    <button
                      onClick={() => currentPage > 1 && paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-3 py-2 rounded-xl font-medium transition-all duration-300 ${
                        currentPage === 1
                          ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                          : "bg-white/80 text-gray-700 hover:bg-gray-50 border border-gray-200 hover:shadow-md"
                      }`}
                      aria-label="Previous"
                    >
                      «
                    </button>
                    {(() => {
                      const windowSize = 5;
                      let start = Math.max(1, currentPage - Math.floor(windowSize / 2));
                      let end = Math.min(totalPages, start + windowSize - 1);
                      if (end - start + 1 < windowSize) {
                        start = Math.max(1, end - windowSize - 1 + 2); // keep 5 pages when near end
                      }
                      const pages = [];
                      for (let p = start; p <= end; p++) pages.push(p);
                      return pages.map((p) => (
                        <button
                          key={p}
                          onClick={() => paginate(p)}
                          className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                            currentPage === p
                              ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25"
                              : "bg-white/80 text-gray-700 hover:bg-gray-50 border border-gray-200 hover:shadow-md backdrop-blur-sm"
                          }`}
                        >
                          {p}
                        </button>
                      ));
                    })()}
                    <button
                      onClick={() => currentPage < totalPages && paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-2 rounded-xl font-medium transition-all duration-300 ${
                        currentPage === totalPages
                          ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                          : "bg-white/80 text-gray-700 hover:bg-gray-50 border border-gray-200 hover:shadow-md"
                      }`}
                      aria-label="Next"
                    >
                      »
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : null}
      </main>

      {/* Modal */}
      {selectedProduct && <ProductDetailModal product={selectedProduct} isOpen={isDetailOpen} onClose={closeDetail} onViewDetail={openDetail}  />}
      {/* ==================== MODAL GIỎ HÀNG - FOCUS TRAP ĐÃ SỬA ==================== */}
      <div
        className={`fixed inset-0 z-50 transition-all duration-300 ${isCartOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        onKeyDown={handleCartKeyDown}
      >
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
          onClick={() => setIsCartOpen(false)}
          aria-hidden="true"
        />

        <div
          ref={cartModalRef}
          className={`absolute right-0 top-0 h-full w-full max-w-md bg-white/95 backdrop-blur-lg shadow-2xl transform transition-all duration-500 ease-out ${isCartOpen ? "translate-x-0" : "translate-x-full"} focus:outline-none`}
          tabIndex={-1}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200/50 bg-gradient-to-r from-emerald-50 to-teal-50">
              <div className="flex items-center gap-2">
                <ShoppingCart size={24} className="text-emerald-500" />
                <h2 id="cart-title" className="text-xl font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Giỏ hàng
                </h2>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setIsCartOpen(false)}
                aria-label="Đóng giỏ hàng"
                className="p-2 hover:bg-white/50 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus-visible:ring-offset-2"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Danh sách sản phẩm */}
            <div className="flex-1 overflow-y-auto p-6" id="cart-items">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart size={48} className="mx-auto text-gray-300" />
                  <p className="text-gray-500 mt-4">Giỏ hàng trống</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => {
                    const price = Number(item.price) || 0;
                    const discount = Number(item.discount) || 0;
                    const discountedPrice = discount > 0
                      ? Math.round(price * (1 - discount / 100))
                      : price;

                    return (
                      <div key={item.id} className="flex gap-4 p-4 bg-gradient-to-r from-gray-50 to-emerald-50/30 rounded-2xl border border-gray-100/50">
                        <div className="relative overflow-hidden rounded-xl flex-shrink-0">
                          <img
                            src={item.imageUrl || `/placeholder.svg?height=80&width=80&query=${encodeURIComponent(item.name)}`}
                            alt={item.name}
                            className="w-16 h-16 object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
                          <p className="text-red-600 font-semibold mt-1">
                            {discountedPrice.toLocaleString("vi-VN")} đ
                          </p>

                          <div className="flex items-center gap-3 mt-3">
                            <button
                              type="button"
                              onClick={() => changeQuantity(item.id, -1)}
                              disabled={item.quantity <= 1}
                              className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus-visible:ring-offset-2"
                              aria-label={`Giảm số lượng ${item.name}`}
                            >
                              <Minus size={18} />
                            </button>

                            <span className="px-4 py-1 bg-white rounded-lg font-medium min-w-[40px] text-center border">
                              {item.quantity}
                            </span>

                            <button
                              type="button"
                              onClick={() => changeQuantity(item.id, 1)}
                              className="p-2 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus-visible:ring-offset-2"
                              aria-label={`Tăng số lượng ${item.name}`}
                            >
                              <Plus size={18} />
                            </button>

                            <button
                              type="button"
                              onClick={() => removeFromCart(item.id)}
                              className="p-2 hover:bg-red-100 text-red-500 rounded-lg ml-auto focus:outline-none focus:ring-2 focus:ring-red-500 focus-visible:ring-offset-2"
                              aria-label={`Xóa ${item.name}`}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="border-t border-gray-200/50 p-6 bg-gradient-to-r from-emerald-50/50 to-teal-50/50">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Tổng cộng:</span>
                  <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    {calculateCartTotal().toLocaleString("vi-VN")} đ
                  </span>
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setIsCheckoutOpen(true)}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-3 rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus-visible:ring-offset-2"
                  >
                    Thanh toán
                  </button>
                  <button
                    type="button"
                    onClick={clearCart}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-gray-400 focus-visible:ring-offset-2"
                  >
                    Xóa tất cả
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-50 transition-all duration-300 ${isCheckoutOpen ? "flex opacity-100" : "hidden opacity-0"} items-center justify-center p-4`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
        onKeyDown={handleCheckoutKeyDown}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsCheckoutOpen(false)}></div>
        
        <div
          ref={checkoutModalRef}
          className="relative bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl max-w-2xl w-full h-[90svh] sm:h-auto sm:max-h-[90vh] max-h-[100svh] border border-white/20 animate-scale-in flex flex-col focus:outline-none"
          tabIndex={-1}
        >
          <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-emerald-50 to-teal-50">
            <h2 id="checkout-title" className="text-2xl font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Thanh toán
            </h2>
          </div>

          <form id="checkout-form" className="p-6 space-y-6 overflow-y-auto grow" onSubmit={handlePlaceOrder}>
            <div className="bg-gradient-to-r from-gray-50 to-emerald-50/30 rounded-2xl p-4 border border-gray-100/50">
              <h3 className="font-semibold text-gray-900 mb-3">Tóm tắt đơn hàng</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Tiền hàng</span>
                  <span className="font-medium">{calculateCartTotal().toLocaleString("vi-VN")} đ</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>
                    Phí vận chuyển {distanceKm ? `(${distanceKm.toFixed(1)} km)` : "(—)"}
                    {isCalcShipping && <span className="ml-2 text-xs text-gray-500 animate-pulse">(đang tính...)</span>}
                  </span>
                  <span className="font-medium bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    {calculateShippingFee(calculateCartTotal(), distanceKm).toLocaleString("vi-VN")} đ
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-semibold">
                  <span>Tổng cộng</span>
                  <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    {(calculateCartTotal() + calculateShippingFee(calculateCartTotal(), distanceKm)).toLocaleString(
                      "vi-VN",
                    )}{" "}
                    đ
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Họ và Tên *</label>
                <input
                  name="customerName"
                  placeholder="Họ và Tên"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:shadow-lg focus:shadow-emerald-500/10 outline-none transition-all duration-300 bg-white/50 backdrop-blur-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại *</label>
                <input
                  name="customerPhone"
                  placeholder="Số điện thoại"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:shadow-lg focus:shadow-emerald-500/10 outline-none transition-all duration-300 bg-white/50 backdrop-blur-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                name="customerEmail"
                placeholder="Email"
                type="email"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:shadow-lg focus:shadow-emerald-500/10 outline-none resize-none transition-all duration-300 bg-white/50 backdrop-blur-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Địa chỉ giao hàng *
              </label>
              <textarea
                name="customerAddress"
                placeholder="Địa chỉ giao hàng"
                required
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onBlur={handleAddressBlur}
                className={`w-full px-4 py-3 border ${
                  error ? "border-red-500" : "border-gray-200"
                } rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:shadow-lg focus:shadow-emerald-500/10 outline-none resize-none transition-all duration-300 bg-white/50 backdrop-blur-sm`}
              ></textarea>
              {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phương thức thanh toán *</label>
              <select
                name="paymentMethod"
                required
                value={paymentMethodState}
                onChange={(e) => {
                  setPaymentMethodState(e.target.value)
                  setOrderMessage("")
                  setShowAdminQR(false)
                  setShowQR(false); 
                }}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:shadow-lg focus:shadow-emerald-500/10 outline-none bg-white/50 backdrop-blur-sm transition-all duration-300"
              >
                <option value="">Chọn phương thức</option>
                <option value="cod">COD</option>
                <option value="bank">Chuyển khoản (QR Admin)</option>
                <option value="momo">Ví MoMo</option>
                <option value="card">Thẻ</option>
                <option value="vnpay">VNPay</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Thời gian giao</label>
                <select
                  name="deliveryTime"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:shadow-lg focus:shadow-emerald-500/10 outline-none bg-white/50 backdrop-blur-sm transition-all duration-300"
                >
                  <option value="standard">2-3 ngày</option>
                  <option value="fast">1-2 ngày</option>
                  <option value="express">Trong ngày</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú đơn hàng</label>
                <textarea
                  name="orderNote"
                  placeholder="Ghi chú đơn hàng"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:shadow-lg focus:shadow-emerald-500/10 outline-none resize-none transition-all duration-300 bg-white/50 backdrop-blur-sm"
                ></textarea>
              </div>
            </div>

            <div className="flex gap-3 pt-4 sticky bottom-0 bg-white/95 backdrop-blur-lg pb-2">
              <button
                type="submit"
                disabled={isPlacingOrder}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-gray-300 disabled:to-gray-400 text-white py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg shadow-emerald-500/25 disabled:shadow-none"
              >
                {isPlacingOrder ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Đang xử lý...
                  </span>
                ) : (
                  "Đặt hàng"
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="px-6 py-3 bg-gray-100/80 hover:bg-gray-200/80 text-gray-700 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      </div>
      {isQRModalOpen && paymentMethodState === "bank" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <h3 className="text-xl font-semibold text-center mb-4">
              Quét mã QR để thanh toán
            </h3>
            <PaymentQR
              bankCode="Vietinbank"
              accountNumber="102877011195"
              orderId={createdOrderId}
              amount={createdOrderTotal}
            />
            {orderPaymentStatus === "paid" ? (
              <p className="text-green-600 font-semibold mt-4 text-center">
                ✅ Đơn hàng đã được thanh toán!
              </p>
            ) : (
              <p className="text-yellow-600 mt-4 text-center">
                ⏳ Đang chờ thanh toán...
              </p>
            )}

            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setIsQRModalOpen(false)}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
      {isQRModalOpen && paymentMethodState === "bank" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <h3 className="text-xl font-semibold text-center mb-4">
              Quét mã QR để thanh toán
            </h3>
            <PaymentQR
              bankCode="Vietinbank"
              accountNumber="102877011195"
              orderId={createdOrderId}
              amount={createdOrderTotal}
            />
            {orderPaymentStatus === "paid" ? (
              <p className="text-green-600 font-semibold mt-4 text-center">
                ✅ Đơn hàng đã được thanh toán!
              </p>
            ) : (
              <p className="text-yellow-600 mt-4 text-center">
                ⏳ Đang chờ thanh toán...
              </p>
            )}

            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setIsQRModalOpen(false)}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes shimmer {
          0% { transform: scaleX(1); }
          50% { transform: scaleX(1.1); }
          100% { transform: scaleX(1); }
        }
        @keyframes gradient { 
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-fade-in { animation: fade-in 0.6s ease-out; }
        .animate-slide-up { animation: slide-up 0.6s ease-out; }
        .animate-scale-in { animation: scale-in 0.4s ease-out; }
        .animate-shimmer { animation: shimmer 2s ease-in-out infinite; }
        .animate-gradient { 
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  )
}
