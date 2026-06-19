  "use client"

import { useState, useEffect } from "react"
import { X, Plus, Minus, ShoppingCart, Star, Heart, Sparkles, Zap, MessageCircle, Send, User } from "lucide-react"
import { useCart } from "../contexts/CartContext"
import { db } from "../lib/firebase"
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  where, limit
} from "firebase/firestore"

import { auth } from "../lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import ProductCard from "./ProductCard"

export default function ProductDetailModal({ product, isOpen, onClose, onAddToCart, onViewDetail }) {
  const [quantity, setQuantity] = useState(1)
  const [isLiked, setIsLiked] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [user, setUser] = useState(null)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [showAll, setShowAll] = useState(false);
  const { addToCart } = useCart()
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
    })

    return () => unsubscribe()
  }, [])
  useEffect(() => {
    if (!product?.id) return

    const commentsRef = collection(db, "products", product.id, "comments")
    const q = query(commentsRef, orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setComments(commentsData)
    })

    return () => unsubscribe()
  }, [product?.id])

  useEffect(() => {
    if (!product?.category) return;

    const productsRef = collection(db, "products");
    const q = query(
      productsRef,
      where("category", "==", product.category),
      limit(3) // chỉ lấy 3 sản phẩm liên quan
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((p) => p.id !== product.id); // loại bỏ sản phẩm hiện tại

      setRelatedProducts(productsData);
    });

    return () => unsubscribe();
  }, [product?.category, product?.id]);

  useEffect(() => {
  if (!product?.category) return;

  const productsRef = collection(db, "products");
  const q = showAll
    ? query(productsRef, where("category", "==", product.category))
    : query(productsRef, where("category", "==", product.category), limit(3));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const productsData = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((p) => p.id !== product.id);

    setRelatedProducts(productsData);
  });

  return () => unsubscribe();
}, [product?.category, product?.id, showAll]);

  const handleSubmitComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim() || !user) return

    setIsSubmittingComment(true)
    try {
      const commentsRef = collection(db, "products", product.id, "comments")
      await addDoc(commentsRef, {
        text: newComment.trim(),
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || user.email.split("@")[0],
        createdAt: serverTimestamp(),
      })
      setNewComment("")
    } catch (error) {
      console.error("Error adding comment:", error)
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleAddToCart = async () => {
    setIsAdding(true)

    // Add to cart with quantity
    for (let i = 0; i < quantity; i++) {
      addToCart(product)
    }

    // Call parent notification handler if provided
    if (onAddToCart) {
      onAddToCart(product)
    }

    // Add a small delay for better UX
    setTimeout(() => {
      setIsAdding(false)
      onClose()
    }, 800)
  }

  const incrementQuantity = () => setQuantity((prev) => prev + 1)
  const decrementQuantity = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1))

  useEffect(() => {
    if (!isOpen) {
      // Reset body overflow khi modal đóng
      document.body.style.overflow = '';
      return;
    }

    // DEBUG: modal mở
    console.log('[ProductDetailModal] opened, isOpen=', isOpen);
    document.body.style.overflow = 'hidden';


    const firstFocusableSelector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    const dialogEl = document.querySelector('[aria-labelledby="product-detail-title"]');

    // Move focus vào trong modal khi mở
    const focusableInDialog = Array.from(
      dialogEl?.querySelectorAll(firstFocusableSelector) || []
    ).filter((el) => !el.hasAttribute('disabled'));

    if (focusableInDialog.length > 0) {
      focusableInDialog[0].focus();
      // DEBUG focus vào modal
      console.log('[ProductDetailModal] focus first element', {
        tag: focusableInDialog[0]?.tagName,
        id: focusableInDialog[0]?.id,
        className: focusableInDialog[0]?.className,
      })
    } else {
      console.log('[ProductDetailModal] no focusable elements found in dialog')
    }

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();

      if (e.key === 'Tab') {
        console.log('[ProductDetailModal] Tab pressed', {
          active: document.activeElement?.tagName,
          activeId: document.activeElement?.id,
          activeClass: document.activeElement?.className,
          hasDialog: dialogEl?.contains(document.activeElement),
          focusableCount: dialogEl?.querySelectorAll(firstFocusableSelector).length,
        });
        const focusable = Array.from(
          dialogEl?.querySelectorAll(firstFocusableSelector) || []
        ).filter((el) => !el.hasAttribute('disabled'));

        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;

        if (e.shiftKey) {
          if (active === first || !dialogEl?.contains(active)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (active === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);


  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-500 ${isOpen ? "opacity-100 visible pointer-events-auto" : "opacity-0 invisible pointer-events-none"}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-detail-title"
    >
      {/* Enhanced Backdrop with animated particles */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-black/70 via-emerald-900/20 to-teal-900/30 backdrop-blur-xl transition-all duration-500"
        onClick={onClose}
      >
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-gradient-to-r from-emerald-400/40 to-teal-400/40 rounded-full animate-ping"></div>
          <div className="absolute top-3/4 right-1/4 w-2 h-2 bg-gradient-to-r from-teal-400/50 to-cyan-400/50 rounded-full animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-3/4 w-2.5 h-2.5 bg-gradient-to-r from-green-400/40 to-emerald-400/40 rounded-full animate-bounce delay-500"></div>
          <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-gradient-to-r from-cyan-400/30 to-blue-400/30 rounded-full animate-ping delay-700"></div>
          <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-gradient-to-r from-lime-400/40 to-green-400/40 rounded-full animate-pulse delay-300"></div>

          {/* Floating orbs with glow effect */}
          <div className="absolute top-1/5 right-1/5 w-8 h-8 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-full blur-sm animate-float"></div>
          <div className="absolute bottom-1/5 left-1/5 w-6 h-6 bg-gradient-to-r from-teal-500/20 to-cyan-500/20 rounded-full blur-sm animate-float delay-1000"></div>
        </div>
      </div>

      {/* Modal Content */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div
          className={`relative bg-white/98 backdrop-blur-2xl rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-white/30 transform transition-all duration-700 ${isOpen ? "scale-100 opacity-100 rotate-0" : "scale-95 opacity-0 rotate-1"}`}
          style={{
            boxShadow:
              "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
          }}
        >
          <h2 id="product-detail-title" className="sr-only">
            Chi tiết sản phẩm
          </h2>
          {/* Enhanced Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ chi tiết sản phẩm"
            className="absolute top-6 right-6 z-50 p-3 bg-white/95 hover:bg-white backdrop-blur-xl 
                      rounded-full shadow-xl transition-all duration-300 transform hover:scale-110 
                      hover:rotate-90 group border border-white/20"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onClose();
            }}
          >
            <X size={20} className="text-gray-600 group-hover:text-red-500 transition-colors duration-300" />
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-full 
                            opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-pink-500/10 rounded-full 
                            opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
          {/* Scrollable Content Container */}
          <div className="h-full max-h-[90vh] overflow-y-auto enhanced-scrollbar">
            {/* Product Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[60vh]">
              {/* Left Side - Enhanced Image */}
              <div className="relative bg-gradient-to-br from-emerald-50/80 via-white/90 to-teal-50/80 p-8 flex items-center justify-center overflow-hidden backdrop-blur-sm">
                {/* Enhanced Background Effects */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute -top-20 -right-20 w-48 h-48 bg-gradient-to-br from-emerald-200/30 to-teal-200/30 rounded-full blur-3xl animate-pulse"></div>
                  <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-gradient-to-tr from-green-200/30 to-emerald-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-r from-emerald-300/8 to-teal-300/8 rounded-full blur-3xl animate-spin-slow"></div>

                  {/* Additional decorative elements */}
                  <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-gradient-to-bl from-cyan-200/20 to-blue-200/20 rounded-full blur-2xl animate-pulse delay-500"></div>
                  <div className="absolute bottom-1/4 left-1/4 w-40 h-40 bg-gradient-to-tr from-lime-200/15 to-green-200/15 rounded-full blur-2xl animate-pulse delay-1500"></div>
                </div>

                {/* Product Image with enhanced effects */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-700 animate-pulse"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-3xl group-hover:from-white/40 transition-all duration-500"></div>

                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-teal-400/10 rounded-3xl blur-2xl group-hover:from-emerald-400/20 group-hover:to-teal-400/20 transition-all duration-700"></div>

                  <img
                    src={
                      product.imageUrl ||
                      `/placeholder.svg?height=400&width=400&query=${encodeURIComponent(product.name) || "/placeholder.svg"}`
                    }
                    alt={product.name}
                    className="relative w-full max-w-sm h-80 object-cover rounded-3xl shadow-2xl transition-all duration-700 group-hover:scale-105 group-hover:shadow-3xl border border-white/20"
                    style={{
                      boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1)",
                    }}
                  />

                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 group-hover:animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-200/20 to-transparent -skew-x-12 group-hover:animate-shimmer-delayed opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>

                  {/* Enhanced Floating Elements */}
                  <div className="absolute top-4 left-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-full shadow-lg transform -rotate-3 hover:rotate-0 transition-transform duration-300 border border-white/20 backdrop-blur-sm">
                    <div className="flex items-center gap-1">
                      <Sparkles size={14} className="animate-pulse" />
                      <span className="text-sm font-medium">Tươi ngon</span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 rounded-full blur-lg animate-pulse"></div>
                  </div>

                  {/* Enhanced Like Button */}
                  <button
                    onClick={() => setIsLiked(!isLiked)}
                    className="absolute top-4 right-4 p-3 bg-white/95 backdrop-blur-xl rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 group border border-white/20"
                  >
                    <Heart
                      size={20}
                      className={`transition-all duration-300 ${isLiked ? "text-red-500 fill-red-500 scale-110" : "text-gray-400 group-hover:text-red-400"}`}
                    />
                    {isLiked && (
                      <>
                        <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping"></div>
                        <div className="absolute inset-0 bg-red-500/10 rounded-full animate-pulse"></div>
                      </>
                    )}
                  </button>

                  <div className="absolute bottom-4 right-4 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300 border border-white/20">
                    <span className="text-sm font-bold">{(product.price || 0).toLocaleString("vi-VN")} đ</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-400/30 to-red-400/30 rounded-full blur-lg animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Right Side - Enhanced Product Info */}
              <div className="p-8 flex flex-col justify-between bg-gradient-to-br from-white/95 via-emerald-50/20 to-teal-50/20 relative overflow-hidden backdrop-blur-sm">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-emerald-100/40 to-transparent rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-teal-100/30 to-transparent rounded-full blur-2xl"></div>

                {/* Product Info */}
                <div className="space-y-6 relative z-10">
                  <div className="flex flex-wrap items-center gap-3 animate-slide-in-right">
                    {/* Category Badge */}
                    {product.category && (
                      <span className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full text-sm font-medium shadow-lg transform hover:scale-105 transition-transform duration-300 border border-white/20 backdrop-blur-sm">
                        <Zap size={14} className="inline mr-1 animate-pulse" />
                        {product.category}
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 rounded-full blur-lg animate-pulse"></div>
                      </span>
                    )}

                    {/* Brand Badge */}
                    {product.brand && (
                      <span className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full text-sm font-medium shadow-lg transform hover:scale-105 transition-transform duration-300 border border-white/20 backdrop-blur-sm">
                        <Sparkles size={14} className="inline mr-1" />
                        {product.brand}
                      </span>
                    )}

                    {/* Discount Badge */}
                    {product.discount && product.discount > 0 && (
                      <span className="px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full text-sm font-bold shadow-lg animate-bounce border border-white/20 backdrop-blur-sm">
                        🔥 -{product.discount}%
                      </span>
                    )}

                    {/* Stock Status Badge */}
                    {product.stock !== undefined && (
                      <span
                        className={`px-4 py-2 rounded-full text-sm font-medium shadow-lg border border-white/20 backdrop-blur-sm ${
                          product.stock > 10
                            ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                            : product.stock > 0
                              ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white animate-pulse"
                              : "bg-gradient-to-r from-red-500 to-pink-500 text-white animate-bounce"
                        }`}
                      >
                        {product.stock > 10
                          ? `✅ Còn ${product.stock}`
                          : product.stock > 0
                            ? `⚠️ Chỉ còn ${product.stock}`
                            : "❌ Hết hàng"}
                      </span>
                    )}
                  </div>

                  {/* Enhanced Product Name */}
                  <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent leading-tight animate-slide-in-right delay-100">
                    {product.name}
                  </h1>

                  {/* Enhanced Rating */}
                  <div className="flex items-center gap-2 animate-slide-in-right delay-200">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={`${i < 4 ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} transition-all duration-200 hover:scale-110`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">(4.0) • 128 đánh giá</span>
                  </div>

                  <div className="space-y-2 animate-slide-in-right delay-300">
                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent whitespace-nowrap">
                        {product.discount && product.discount > 0
                          ? ((product.price || 0) * (1 - product.discount / 100)).toLocaleString("vi-VN")
                          : (product.price || 0).toLocaleString("vi-VN")}
                        đ
                      </span>
                      {product.discount && product.discount > 0 && (
                        <span className="text-lg text-gray-400 line-through whitespace-nowrap">
                          {(product.price || 0).toLocaleString("vi-VN")}đ
                        </span>
                      )}
                    </div>
                    {product.discount && product.discount > 0 && (
                      <div className="inline-block px-3 py-1 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full text-sm font-medium shadow-lg animate-bounce">
                        Tiết kiệm {((product.price || 0) * (product.discount / 100)).toLocaleString("vi-VN")}đ (
                        {product.discount}%)
                      </div>
                    )}
                  </div>

                  {(product.weight || product.dimensions) && (
                    <div className="space-y-3 animate-slide-in-right delay-400">
                      <h3 className="text-lg font-semibold text-gray-900">Thông số sản phẩm</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {product.weight && (
                          <div className="flex items-center gap-2 p-3 bg-white/70 backdrop-blur-sm rounded-xl border border-gray-100/50 hover:shadow-lg hover:scale-105 transition-all duration-300 group">
                            <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full group-hover:scale-150 transition-transform duration-300"></div>
                            <span className="text-sm text-gray-700 group-hover:text-blue-700 transition-colors duration-300">
                              ⚖️ {product.weight}
                            </span>
                          </div>
                        )}
                        {product.dimensions && (
                          <div className="flex items-center gap-2 p-3 bg-white/70 backdrop-blur-sm rounded-xl border border-gray-100/50 hover:shadow-lg hover:scale-105 transition-all duration-300 group">
                            <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full group-hover:scale-150 transition-transform duration-300"></div>
                            <span className="text-sm text-gray-700 group-hover:text-purple-700 transition-colors duration-300">
                              📏 {product.dimensions}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Enhanced Description */}
                  {product.description && (
                    <div className="space-y-3 animate-slide-in-right delay-500">
                      <h3 className="text-lg font-semibold text-gray-900">Mô tả sản phẩm</h3>
                      <p className="text-gray-600 leading-relaxed bg-white/70 backdrop-blur-sm p-4 rounded-2xl border border-gray-100/50 shadow-inner">
                        {product.description}
                      </p>
                    </div>
                  )}

                  {product.detailedDescription && (
                    <div className="space-y-3 animate-slide-in-right delay-600">
                      <h3 className="text-lg font-semibold text-gray-900">Mô tả chi tiết</h3>
                      <div className="bg-gradient-to-br from-white/90 to-emerald-50/50 backdrop-blur-sm p-5 rounded-2xl border border-gray-100/50 shadow-lg">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                          {product.detailedDescription}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Enhanced Features */}
                  <div className="space-y-3 animate-slide-in-right delay-700">
                    <h3 className="text-lg font-semibold text-gray-900">Đặc điểm nổi bật</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { text: "100% tự nhiên", delay: "0ms" },
                        { text: "Không hóa chất", delay: "100ms" },
                        { text: "Tươi mỗi ngày", delay: "200ms" },
                        { text: "Giao hàng nhanh", delay: "300ms" },
                      ].map((feature, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-3 bg-white/70 backdrop-blur-sm rounded-xl border border-gray-100/50 hover:shadow-lg hover:scale-105 transition-all duration-300 group"
                          style={{ animationDelay: feature.delay }}
                        >
                          <div className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full group-hover:scale-150 transition-transform duration-300"></div>
                          <span className="text-sm text-gray-700 group-hover:text-emerald-700 transition-colors duration-300">
                            {feature.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6 pt-6 border-t border-gray-200/50 relative z-10">
                  {/* Enhanced Quantity Selector */}
                  <div className="space-y-3 animate-slide-in-up">
                    <label className="text-sm font-medium text-gray-700">Số lượng:</label>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <button
                          onClick={decrementQuantity}
                          disabled={quantity <= 1}
                          aria-label={`Giảm số lượng mua ${product.name}`}
                          className="p-3 hover:bg-emerald-50 rounded-l-2xl transition-all duration-300 disabled:opacity-50 transform hover:scale-110 group"
                        >
                          <Minus size={18} className="group-hover:text-emerald-600 transition-colors duration-300" />
                        </button>
                        <span className="px-6 py-3 font-semibold text-lg min-w-[60px] text-center bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                          {quantity}
                        </span>
                        <button
                          onClick={incrementQuantity}
                          disabled={product.stock !== undefined && quantity >= product.stock}
                          aria-label={`Tăng số lượng mua ${product.name}`}
                          className="p-3 hover:bg-emerald-50 rounded-r-2xl transition-all duration-300 disabled:opacity-50 transform hover:scale-110 group"
                        >
                          <Plus size={18} className="group-hover:text-emerald-600 transition-colors duration-300" />
                        </button>
                      </div>
                      <div className="text-sm text-gray-600">
                        Tổng:{" "}
                        <span className="font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                          {product.discount && product.discount > 0
                            ? ((product.price || 0) * (1 - product.discount / 100) * quantity).toLocaleString("vi-VN")
                            : ((product.price || 0) * quantity).toLocaleString("vi-VN")}
                          đ
                        </span>
                      </div>
                    </div>
                    {product.stock !== undefined && product.stock <= 10 && product.stock > 0 && (
                      <p className="text-sm text-orange-600 font-medium animate-pulse">
                        ⚠️ Chỉ còn {product.stock} sản phẩm trong kho
                      </p>
                    )}
                  </div>

                  {/* Enhanced Action Buttons */}
                  <div className="flex gap-4 animate-slide-in-up delay-100">
                    <button
                      onClick={handleAddToCart}
                      disabled={isAdding || (product.stock !== undefined && product.stock <= 0)}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-gray-400 disabled:to-gray-500 text-white py-4 px-6 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 flex items-center justify-center gap-3 relative overflow-hidden group border border-white/20"
                      style={{
                        boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)",
                      }}
                    >
                      {isAdding ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Đang thêm...</span>
                        </>
                      ) : product.stock !== undefined && product.stock <= 0 ? (
                        <>
                          <span>❌ Hết hàng</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart size={20} className="group-hover:scale-110 transition-transform duration-300" />
                          <span>Thêm vào giỏ hàng</span>
                        </>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 group-hover:animate-shimmer opacity-0 group-hover:opacity-100"></div>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-200/20 to-transparent -skew-x-12 group-hover:animate-shimmer-delayed opacity-0 group-hover:opacity-100"></div>
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-teal-400/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                    </button>

                    <button
                      disabled={product.stock !== undefined && product.stock <= 0}
                      className="px-6 py-4 bg-white/95 hover:bg-white border border-gray-200/50 text-gray-700 hover:text-emerald-600 disabled:text-gray-400 disabled:cursor-not-allowed rounded-2xl font-medium transition-all duration-300 transform hover:scale-105 disabled:scale-100 backdrop-blur-xl shadow-lg hover:shadow-xl group border-white/20"
                      style={{
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.2)",
                      }}
                    >
                      <span className="group-hover:scale-110 inline-block transition-transform duration-300">
                        {product.stock !== undefined && product.stock <= 0 ? "Hết hàng" : "Mua ngay"}
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                  </div>

                  {/* Enhanced Additional Info */}
                  <div className="text-center text-sm text-gray-500 space-y-1 animate-slide-in-up delay-200">
                    <p className="hover:text-emerald-600 transition-colors duration-300">
                      🚚 Miễn phí vận chuyển cho đơn hàng trên 200.000đ
                    </p>
                    <p className="hover:text-emerald-600 transition-colors duration-300">
                      🔄 Đổi trả trong 7 ngày nếu không hài lòng
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments Section - Now scrollable, appears when user scrolls down */}
            <div className="border-t-4 border-gradient-to-r from-emerald-300 via-teal-300 to-emerald-300 bg-gradient-to-br from-gray-50/95 via-white/98 to-emerald-50/40 relative">
              {/* Enhanced separator line with gradient */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 shadow-lg"></div>

              <div className="p-6 relative min-h-[40vh]">
                {/* Enhanced background decoration for comments section */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-100/30 to-transparent rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-teal-100/20 to-transparent rounded-full blur-2xl"></div>

                {/* Comments Header - Enhanced */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-gradient-to-r from-emerald-200/50 to-teal-200/50 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full shadow-xl animate-pulse">
                      <MessageCircle size={20} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                        💬 Bình luận sản phẩm
                      </h3>
                      <p className="text-sm text-gray-500 font-medium">
                        {comments.length} bình luận • Chia sẻ trải nghiệm của bạn
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-400 flex items-center gap-2 bg-white/70 px-3 py-2 rounded-full backdrop-blur-sm border border-gray-200/50">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    Cuộn để xem
                  </div>
                </div>

                {/* Comment Form - Enhanced */}
                {user ? (
                  <form onSubmit={handleSubmitComment} className="mb-6 relative z-10">
                    <div className="flex gap-3">
                      <div className="flex-1 relative">
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="💭 Chia sẻ cảm nhận của bạn về sản phẩm này..."
                          className="w-full p-4 bg-white/95 backdrop-blur-sm border-2 border-gray-200/50 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-300 shadow-lg hover:shadow-xl placeholder-gray-400"
                          rows="3"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 rounded-xl opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      </div>
                      <button
                        type="submit"
                        disabled={!newComment.trim() || isSubmittingComment}
                        className="px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 flex items-center gap-2 group border border-white/20"
                      >
                        {isSubmittingComment ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <Send size={18} className="group-hover:scale-110 transition-transform duration-300" />
                        )}
                        <span className="hidden sm:inline">Gửi</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200/50 rounded-xl shadow-lg relative z-10">
                    <p className="text-amber-700 text-center font-medium">
                      🔐 Vui lòng đăng nhập để bình luận và chia sẻ trải nghiệm
                    </p>
                  </div>
                )}

                {/* Comments List - Enhanced */}
                <div className="space-y-4 relative z-10">
                  {comments.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-20 h-20 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl animate-pulse">
                        <MessageCircle size={28} className="text-emerald-500" />
                      </div>
                      <h4 className="text-xl font-bold text-gray-700 mb-2">Chưa có bình luận nào</h4>
                      <p className="text-gray-500 font-medium">
                        Hãy là người đầu tiên chia sẻ ý kiến về sản phẩm này! 🌟
                      </p>
                    </div>
                  ) : (
                    comments.map((comment, index) => (
                      <div
                        key={comment.id}
                        className="bg-white/98 backdrop-blur-sm p-5 rounded-xl border-2 border-gray-100/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] animate-slide-in-up group relative overflow-hidden"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        {/* Enhanced background decoration for each comment */}
                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-emerald-100/20 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                        <div className="flex items-start gap-4 relative z-10">
                          <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300 border-2 border-white/50">
                            <User size={18} className="text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <span className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors duration-300">
                                {comment.userName}
                              </span>
                              <span className="text-sm text-gray-500 bg-gradient-to-r from-gray-100 to-gray-50 px-3 py-1 rounded-full font-medium shadow-sm">
                                📅 {comment.createdAt?.toDate?.()?.toLocaleDateString("vi-VN") || "Vừa xong"}
                              </span>
                            </div>
                            <p className="text-gray-700 leading-relaxed group-hover:text-gray-900 transition-colors duration-300 font-medium">
                              {comment.text}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Related Products Section using ProductCard component */}
            {relatedProducts.length > 0 && (
              <div className="border-t-4 border-gradient-to-r from-blue-300 via-purple-300 to-blue-300 bg-gradient-to-br from-slate-50/95 via-white/98 to-blue-50/40 relative">
                {/* Enhanced separator line with gradient */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 shadow-lg"></div>

                <div className="p-6 relative">
                  {/* Enhanced background decoration for related products section */}
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-blue-100/30 to-transparent rounded-full blur-2xl"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-purple-100/20 to-transparent rounded-full blur-2xl"></div>

                  {/* Related Products Header */}
                  <div className="text-center mb-8 relative z-10">
                    <div className="inline-flex items-center gap-3 mb-4">
                      <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-xl animate-pulse">
                        <Sparkles size={20} className="text-white" />
                      </div>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        🌟 Sản phẩm liên quan
                      </h3>
                    </div>
                    <p className="text-gray-600 font-medium">
                      Khám phá thêm những sản phẩm tương tự có thể bạn quan tâm
                    </p>
                  </div>

                  {/* Related Products Grid using ProductCard */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                    {relatedProducts.map((relatedProduct, index) => (
                      <div
                        key={relatedProduct.id}
                        className="animate-slide-in-up"
                        style={{ animationDelay: `${index * 150}ms` }}
                      >
                        <ProductCard
                          product={relatedProduct}
                          onAddToCart={onAddToCart}
                          onViewDetail={() => onViewDetail(relatedProduct)}
                        />
                      </div>
                    ))}
                  </div>

                  {/* View More Button */}
                  <button
                    onClick={() => window.location.href = '/products'}
                    className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 
                              hover:from-blue-600 hover:to-purple-600 text-white 
                              rounded-2xl font-semibold transition-all duration-300 
                              transform hover:scale-105 shadow-xl shadow-blue-500/30 
                              hover:shadow-blue-500/50 flex items-center gap-3 mx-auto 
                              group border border-white/20"
                  >
                    <Sparkles 
                      size={18} 
                      className="group-hover:scale-110 transition-transform duration-300" 
                    />
                    <span>Xem thêm sản phẩm</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 group-hover:animate-shimmer opacity-0 group-hover:opacity-100"></div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slide-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(200%) skewX(-12deg); }
        }
        @keyframes shimmer-delayed {
          0% { transform: translateX(-100%) skewX(-12deg); }
          50% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(200%) skewX(-12deg); }
        }
        @keyframes spin-slow {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }
        .animate-slide-in-right { animation: slide-in-right 0.6s ease-out; }
        .animate-slide-in-up { animation: slide-in-up 0.6s ease-out; }
        .animate-shimmer { animation: shimmer 1.5s ease-in-out; }
        .animate-shimmer-delayed { animation: shimmer-delayed 2s ease-in-out; }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        
        /* Enhanced scrollbar styling for comments section */
        .enhanced-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .enhanced-scrollbar::-webkit-scrollbar-track {
          background: rgba(16, 185, 129, 0.1);
          border-radius: 12px;
          margin: 4px;
        }
        .enhanced-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #10b981, #14b8a6);
          border-radius: 12px;
          border: 2px solid rgba(255, 255, 255, 0.2);
        }
        .enhanced-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #059669, #0d9488);
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
        }
      `}</style>
    </div>
  )
}
