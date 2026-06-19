"use client"

import { useEffect, useState, useRef } from "react"
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore"
import { db, auth } from "../lib/firebase"
import { useAuth } from "../contexts/AuthContext"
import Header from "../components/Header"
import HeroSection from "../components/HeroSection"
import FeaturesSection from "../components/FeaturesSection"
import KnowledgeSection from "../components/KnowledgeSection"
import ContactSection from "../components/ContactSection"
import Footer from "../components/Footer"
import ProductCard from "../components/ProductCard"
import ProductDetailModal from "../components/ProductDetailModal"
import { useSearchParams } from "next/navigation"
import { useCart } from "../contexts/CartContext"
import { ShoppingCart, X, Plus, Minus, Trash2, Package, Sparkles } from "lucide-react"
import { toast } from "../lib/toast"
import { STORE_LOCATION, getLatLngFromAddress, haversineDistance, calculateShippingFee } from "../utils/shipping"

export default function HomePage() {
  const { user, userRole, loading } = useAuth()
  const [products, setProducts] = useState([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [orderMessage, setOrderMessage] = useState("")
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const { cart, addToCart, changeQuantity, removeFromCart, clearCart, calculateCartTotal } = useCart()
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get("search")?.toLowerCase() || ""
  const [distanceKm, setDistanceKm] = useState(0)
  const [isCalcShipping, setIsCalcShipping] = useState(false)
  const [paymentMethodState, setPaymentMethodState] = useState("")
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isProductsLoaded, setIsProductsLoaded] = useState(false)

  // ==================== FOCUS TRAP CHO MODAL GIỎ HÀNG & THANH TOÁN ====================
  const cartModalRef = useRef(null);
  const closeButtonRef = useRef(null);

  const checkoutModalRef = useRef(null);
  const checkoutCloseRef = useRef(null);

  // Focus trap cho Giỏ hàng
  const handleCartKeyDown = (e) => {
    if (!isCartOpen || !cartModalRef.current) return;
    if (e.key === "Escape") {
      setIsCartOpen(false);
      return;
    }
    if (e.key === "Tab") {
      const focusable = cartModalRef.current.querySelectorAll(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { last.focus(); e.preventDefault(); }
      } else {
        if (document.activeElement === last) { first.focus(); e.preventDefault(); }
      }
    }
  };

  // Focus trap cho Thanh toán
  const handleCheckoutKeyDown = (e) => {
    if (!isCheckoutOpen || !checkoutModalRef.current) return;
    if (e.key === "Escape") {
      setIsCheckoutOpen(false);
      return;
    }
    if (e.key === "Tab") {
      const focusable = checkoutModalRef.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { last.focus(); e.preventDefault(); }
      } else {
        if (document.activeElement === last) { first.focus(); e.preventDefault(); }
      }
    }
  };

  // Tự động focus khi mở modal
  useEffect(() => {
    if (isCartOpen && cartModalRef.current) {
      setTimeout(() => closeButtonRef.current?.focus(), 100);
    }
  }, [isCartOpen]);

  useEffect(() => {
    if (isCheckoutOpen && checkoutModalRef.current) {
      setTimeout(() => {
        const firstInput = checkoutModalRef.current.querySelector('input[name="customerName"]');
        if (firstInput) firstInput.focus();
        else checkoutCloseRef.current?.focus();
      }, 150);
    }
  }, [isCheckoutOpen]);


  const openDetail = (product) => {
    setSelectedProduct(product)
    setIsDetailOpen(true)
  }

  const closeDetail = () => {
    setSelectedProduct(null)
    setIsDetailOpen(false)
  }

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("name"))
    const unsub = onSnapshot(
      q,
      (snap) => {
        let list = []
        snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }))
        if (searchQuery) {
          list = list.filter(
            (p) => p.name?.toLowerCase().includes(searchQuery) || p.description?.toLowerCase().includes(searchQuery),
          )
        }
        setProducts(list)
        setTimeout(() => setIsProductsLoaded(true), 300)
      },
      (error) => {
        console.error("Lỗi khi lấy sản phẩm:", error.message)
      },
    )
    return () => unsub()
  }, [searchQuery])

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

  const handleAddressBlur = async (e) => {
    const address = e.target.value.trim()
    if (!address) return
    const km = await calculateShippingFromAddress(address)
    console.log("[Distance]", address, "=>", km, "km")
  }

  function showNotification(msg) {
    setOrderMessage(msg)
    setTimeout(() => setOrderMessage(""), 3500)
  }

  async function handlePlaceOrder(e) {
    e.preventDefault()
    if (isPlacingOrder) return
    if (!auth.currentUser) {
      toast.error("Vui lòng đăng nhập để đặt hàng.")
      showNotification("Vui lòng đăng nhập để đặt hàng.")
      return
    }

    const form = new FormData(e.target)
    const name = form.get("customerName")?.trim()
    const phone = form.get("customerPhone")?.trim()
    const email = form.get("customerEmail")?.trim() || ""
    const address = form.get("customerAddress")?.trim()
    const paymentMethod = form.get("paymentMethod")
    const deliveryTime = form.get("deliveryTime") || "standard"
    const note = form.get("orderNote")?.trim() || ""

    const distance = distanceKm

    // Explicit Form Validation Errors (WCAG 2.2 SC 4.1.3 & 3.3.1)
    if (!name) {
      toast.error("Vui lòng nhập Họ và Tên.")
      showNotification("Vui lòng nhập Họ và Tên.")
      return
    }
    if (!phone) {
      toast.error("Vui lòng nhập Số điện thoại.")
      showNotification("Vui lòng nhập Số điện thoại.")
      return
    }
    if (!address) {
      toast.error("Vui lòng nhập Địa chỉ giao hàng.")
      showNotification("Vui lòng nhập Địa chỉ giao hàng.")
      return
    }
    if (!paymentMethod) {
      toast.error("Vui lòng chọn Phương thức thanh toán.")
      showNotification("Vui lòng chọn Phương thức thanh toán.")
      return
    }

    if (cart.length === 0) {
      toast.error("Giỏ hàng trống, không thể đặt hàng.")
      showNotification("Giỏ hàng trống, không thể đặt hàng.")
      return
    }

    const subtotal = calculateCartTotal()
    const shipping = calculateShippingFee(subtotal, distance)
    const total = subtotal + shipping

    const orderData = {
      customerInfo: { name, phone, email, address },
      items: cart.map((it) => ({
        id: it.id,
        name: it.name,
        price: Number(it.price) || 0,
        quantity: Number(it.quantity) || 1,
        total: (Number(it.price) || 0) * (Number(it.quantity) || 1),
      })),
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
    }

    try {
      setIsPlacingOrder(true)
      const docRef = await addDoc(collection(db, "orders"), orderData)
      console.log("Đơn hàng được lưu với ID:", docRef.id)
      clearCart(true)
      setIsCheckoutOpen(false)
      setIsCartOpen(false)
      e.target.reset()
      setDistanceKm(0)
      toast.success("Đặt hàng thành công!")
      showNotification("🎉 Đặt hàng thành công!")
    } catch (err) {
      console.error("Lỗi khi lưu đơn hàng:", err.code, err.message)
      toast.error("Đặt hàng thất bại. Vui lòng thử lại.")
      showNotification("❌ Lỗi khi đặt hàng. Vui lòng thử lại!")
    } finally {
      setIsPlacingOrder(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-blue-500 border-r-purple-500"></div>
          <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-blue-300 opacity-20"></div>
          <div className="absolute inset-2 animate-pulse rounded-full h-12 w-12 bg-gradient-to-r from-blue-400 to-purple-400 opacity-20"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Header user={user} userRole={userRole} setIsCartOpen={setIsCartOpen} cartCount={cart.length} />
      <main>
        <HeroSection />
        <FeaturesSection />

        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative overflow-hidden" id="products" tabIndex={-1}>
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-green-500/5 rounded-3xl"></div>
          <div className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-teal-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 left-10 w-24 h-24 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-full blur-2xl animate-pulse delay-1000"></div>

          <div className="relative z-10">
            <div className="text-center mb-16 animate-fade-in">
              <div className="inline-flex items-center gap-2 mb-4">
                <Sparkles className="text-emerald-500 animate-pulse" size={24} />
                <h2 className="text-4xl md:text-5xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-600 mb-16 animate-text-shimmer leading-tight md:leading-snug">
                  {searchQuery ? `Kết quả tìm kiếm cho "${searchQuery}"` : "Sản phẩm nổi bật"}
                </h2>
                <Sparkles className="text-emerald-500 animate-pulse delay-500" size={24} />
              </div>
              <div className="w-32 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 mx-auto rounded-full shadow-lg animate-shimmer"></div>
              <div className="w-16 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 mx-auto rounded-full mt-2 animate-pulse"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.length > 0 ? (
                (searchQuery ? products : products.slice(0, 8)).map((p, index) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onAddToCart={() => {
                      addToCart(p)
                    }}
                    onViewDetail={() => openDetail(p)}
                    index={index}
                    isLoaded={isProductsLoaded}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-16 animate-fade-in">
                  <div className="relative inline-block">
                    <Package size={80} className="mx-auto text-gray-300 mb-6 animate-bounce" />
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 rounded-full blur-xl animate-pulse"></div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy sản phẩm</h3>
                  <p className="text-gray-500 text-lg font-medium">😔 Không tìm thấy sản phẩm nào phù hợp</p>
                </div>
              )}
            </div>

            {!searchQuery && products.length > 8 && (
              <div className="text-center mt-16 animate-fade-in">
                <a
                  href="/products"
                  className="group inline-flex items-center gap-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 hover:from-emerald-600 hover:via-teal-600 hover:to-green-600 text-white px-10 py-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/25 transform hover:-translate-y-2 hover:scale-105 active:scale-95 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  <Package
                    size={24}
                    className="relative z-10 group-hover:rotate-12 transition-transform duration-300"
                  />
                  <span className="relative z-10">Xem tất cả sản phẩm</span>
                  <div className="relative z-10 w-2 h-2 bg-white/50 rounded-full group-hover:animate-ping"></div>
                </a>
              </div>
            )}
          </div>
        </section>

        <KnowledgeSection />
        <ContactSection />
      </main>
      <Footer />

      {/* ==================== MODAL GIỎ HÀNG (đồng nhất với /products) ==================== */}
      <div
        className={`fixed inset-0 z-50 transition-all duration-300 ${isCartOpen ? "opacity-100 visible pointer-events-auto" : "opacity-0 invisible pointer-events-none"}`}
        role="dialog"
        aria-modal={isCartOpen ? "true" : undefined}
        aria-labelledby="cart-title"
        aria-hidden={!isCartOpen}
        onKeyDown={handleCartKeyDown}
        {...(!isCartOpen ? { inert: "" } : {})}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} aria-hidden="true" />

        <div
          ref={cartModalRef}
          className={`absolute right-0 top-0 h-full w-full max-w-md bg-white/95 backdrop-blur-lg shadow-2xl transform transition-all duration-500 ease-out ${isCartOpen ? "translate-x-0" : "translate-x-full"} focus:outline-none`}
          tabIndex={-1}
        >
          {/* Nội dung modal giỏ hàng giữ nguyên như cũ của bạn */}
          <div className="flex flex-col h-full">
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

            <div className="flex-1 overflow-y-auto p-6" id="cart-items">
              {cart.length === 0 ? (
                <div className="text-center py-12 animate-fade-in">
                  <ShoppingCart size={48} className="mx-auto text-gray-300 animate-bounce" />
                  <p className="text-gray-500 mt-4">Giỏ hàng trống</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 p-4 bg-gradient-to-r from-gray-50 to-emerald-50/30 rounded-2xl border border-gray-100/50"
                    >
                      <div className="relative overflow-hidden rounded-xl flex-shrink-0">
                        <img
                          src={
                            item.imageUrl ||
                            `/placeholder.svg?height=80&width=80&query=${encodeURIComponent(item.name)}`
                          }
                          alt={item.name}
                          className="w-16 h-16 object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900">{item.name}</h3>
                        <p className="text-red-600 font-semibold mt-1">
                          {(item.price || 0).toLocaleString("vi-VN")} đ
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
                            onClick={() => {
                              removeFromCart(item.id)
                              if (cart.length === 1) setIsCartOpen(false)
                            }}
                            className="p-2 hover:bg-red-100 text-red-500 rounded-lg ml-auto focus:outline-none focus:ring-2 focus:ring-red-500 focus-visible:ring-offset-2"
                            aria-label={`Xóa ${item.name} khỏi giỏ hàng`}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

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
        className={`fixed inset-0 z-50 transition-all duration-300 ${isCheckoutOpen ? "flex opacity-100 pointer-events-auto" : "hidden opacity-0 pointer-events-none"} items-center justify-center p-4`}
        role="dialog"
        aria-modal={isCheckoutOpen ? "true" : undefined}
        aria-labelledby="checkout-title"
        aria-hidden={!isCheckoutOpen}
        onKeyDown={handleCheckoutKeyDown}
        {...(!isCheckoutOpen ? { inert: "" } : {})}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsCheckoutOpen(false)}></div>
        
        <div
          ref={checkoutModalRef}
          className="relative bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20 animate-scale-in focus:outline-none"
          tabIndex={-1}
        >
          <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-emerald-50 to-teal-50">
            <h2 id="checkout-title" className="text-2xl font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Thanh toán
            </h2>
          </div>

          <form className="p-6 space-y-6" onSubmit={handlePlaceOrder}>
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
                <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-2">Họ và Tên *</label>
                <input
                  id="customerName"
                  name="customerName"
                  placeholder="Họ và Tên"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:shadow-lg focus:shadow-emerald-500/10 outline-none transition-all duration-300 bg-white/50 backdrop-blur-sm"
                />
              </div>
              <div>
                <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại *</label>
                <input
                  id="customerPhone"
                  name="customerPhone"
                  placeholder="Số điện thoại"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:shadow-lg focus:shadow-emerald-500/10 outline-none transition-all duration-300 bg-white/50 backdrop-blur-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                id="customerEmail"
                name="customerEmail"
                placeholder="Email"
                type="email"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:shadow-lg focus:shadow-emerald-500/10 outline-none resize-none transition-all duration-300 bg-white/50 backdrop-blur-sm"
              />
            </div>

            <div>
              <label htmlFor="customerAddress" className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ giao hàng *</label>
              <textarea
                id="customerAddress"
                name="customerAddress"
                placeholder="Địa chỉ giao hàng"
                required
                rows={3}
                onBlur={handleAddressBlur}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:shadow-lg focus:shadow-emerald-500/10 outline-none resize-none transition-all duration-300 bg-white/50 backdrop-blur-sm"
              ></textarea>
            </div>

            <div>
              <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-2">Phương thức thanh toán *</label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                required
                value={paymentMethodState}
                onChange={(e) => {
                  setPaymentMethodState(e.target.value)
                  setOrderMessage("")
                }}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:shadow-lg focus backlash-emerald-500/10 outline-none bg-white/50 backdrop-blur-sm transition-all duration-300"
              >
                <option value="">Chọn phương thức</option>
                <option value="cod">COD</option>
                <option value="bank">Chuyển khoản (QR Admin)</option>
                <option value="momo">Ví MoMo</option>
                <option value="card">Thẻ</option>
                <option value="vnpay">VNPay</option>
              </select>
              {paymentMethodState === "bank" && (
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl text-center border border-blue-100/50 animate-fade-in">
                  <p className="text-sm text-blue-800 mb-3">💳 Quét mã QR để chuyển khoản cho Admin:</p>
                  <div className="relative inline-block">
                    <img
                      src={`https://img.vietqr.io/image/Vietinbank-102877011195-compact.png?amount=${calculateCartTotal() + calculateShippingFee(calculateCartTotal(), distanceKm)}&addInfo=Thanh+toan+don+hang`}
                      alt="QR Admin"
                      className="w-48 mx-auto rounded-2xl shadow-lg transition-transform duration-300 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent rounded-2xl"></div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="deliveryTime" className="block text-sm font-medium text-gray-700 mb-2">Thời gian giao</label>
                <select
                  id="deliveryTime"
                  name="deliveryTime"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:shadow-lg focus:shadow-emerald-500/10 outline-none bg-white/50 backdrop-blur-sm transition-all duration-300"
                >
                  <option value="standard">2-3 ngày</option>
                  <option value="fast">1-2 ngày</option>
                  <option value="express">Trong ngày</option>
                </select>
              </div>
              <div>
                <label htmlFor="orderNote" className="block text-sm font-medium text-gray-700 mb-2">Ghi chú đơn hàng</label>
                <textarea
                  id="orderNote"
                  name="orderNote"
                  placeholder="Ghi chú đơn hàng"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:shadow-lg focus:shadow-emerald-500/10 outline-none resize-none transition-all duration-300 bg-white/50 backdrop-blur-sm"
                ></textarea>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
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

          {orderMessage && (
            <div
              role="alert"
              aria-live="assertive"
              className="mx-6 mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 rounded-2xl animate-slide-up backdrop-blur-sm"
            >
              <p className="text-green-800 text-center font-medium">{orderMessage}</p>
            </div>
          )}
        </div>
      </div>

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          isOpen={isDetailOpen}
          onClose={closeDetail}
          onAddToCart={(product) => {
            addToCart(product)
          }}
        />
      )}

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