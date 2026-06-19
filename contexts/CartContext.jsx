'use client';
import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "../lib/toast";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [userUid, setUserUid] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Theo dõi trạng thái đăng nhập để lấy UID người dùng hiện tại
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUserUid(currentUser ? currentUser.uid : "anonymous");
      setIsLoaded(false);
    });
    return () => unsubscribe();
  }, []);

  // Tải giỏ hàng từ localStorage dựa theo userUid
  useEffect(() => {
    if (userUid === null) return;
    try {
      const savedCart = localStorage.getItem(`cart_${userUid}`);
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      } else {
        // Hỗ trợ migration giỏ hàng cũ từ key chung "cart" sang tài khoản ẩn danh
        const oldCart = localStorage.getItem("cart");
        if (oldCart && userUid === "anonymous") {
          setCart(JSON.parse(oldCart));
          localStorage.setItem(`cart_${userUid}`, oldCart);
          localStorage.removeItem("cart");
        } else {
          setCart([]);
        }
      }
    } catch (error) {
      console.error("Lỗi khi tải giỏ hàng từ localStorage:", error);
      setCart([]);
    }
    setIsLoaded(true);
  }, [userUid]);

  // Lưu giỏ hàng vào localStorage dựa theo userUid khi có thay đổi
  useEffect(() => {
    if (userUid !== null && isLoaded) {
      try {
        localStorage.setItem(`cart_${userUid}`, JSON.stringify(cart));
      } catch (error) {
        console.error("Lỗi khi lưu giỏ hàng vào localStorage:", error);
      }
    }
  }, [cart, userUid, isLoaded]);

  // Hàm thêm vào giỏ hàng
  const addToCart = (product) => {
    setCart((prev) => {
      const idx = prev.findIndex((p) => p.id === product.id);
      const price = Number(product.price) || 0;
      const discount = Number(product.discount) || 0;
      const discountedPrice = discount > 0
      ? Math.round(price * (1 - discount / 100))
      : price;
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          quantity: copy[idx].quantity + 1,
          price,
          discount,
          discountedPrice,
        };
        return copy;
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: price || 0,
          imageUrl: product.imageUrl || "",
          quantity: 1,
          discount: discount || 0,
          discountedPrice,
        },
      ];
    });
    toast.success(`Đã thêm ${product.name} vào giỏ hàng.`);
  };

  // Hàm thay đổi số lượng
  const changeQuantity = (productId, delta) => {
    let announced = false;
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === productId) {
          const newQty = Math.max(1, item.quantity + delta);
          if (!announced) {
            const numberWords = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín', 'mười'];
            const qtyWord = numberWords[newQty] || String(newQty);
            toast.success(`Số lượng đã cập nhật thành ${qtyWord}.`);
            announced = true;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  // Hàm xóa sản phẩm khỏi giỏ hàng
  const removeFromCart = (productId) => {
    const item = cart.find((i) => i.id === productId);
    if (item) {
      toast.success(`Đã xóa ${item.name} khỏi giỏ hàng.`);
    }
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  // Hàm xóa toàn bộ giỏ hàng (hỗ trợ xóa âm thầm khi thanh toán thành công)
  const clearCart = (silent = false) => {
    if (!silent && !confirm("Bạn có chắc muốn xóa tất cả sản phẩm trong giỏ hàng?")) return;
    setCart([]);
  };

  // Hàm tính tổng giá trị giỏ hàng
  const calculateCartTotal = () => {
    return cart.reduce((sum, item) => {
      const price = Number(item.price) || 0;
      const discount = Number(item.discount) || 0;
      const quantity = Number(item.quantity) || 0;

      const discountedPrice = discount > 0
        ? Math.round(price * (1 - discount / 100))
        : price;

      return sum + discountedPrice * quantity;
    }, 0);
  };


  return (
    <CartContext.Provider
      value={{ cart, addToCart, changeQuantity, removeFromCart, clearCart, calculateCartTotal }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);