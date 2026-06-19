"use client";
import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../lib/firebase"; // ✅ dùng auth có sẵn
import { toast } from "../../lib/toast";
import "./password.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error("Vui lòng nhập email.");
      setMessage("❌ Vui lòng nhập email.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Đã gửi email đặt lại mật khẩu.");
      setMessage("✅ Email đặt lại mật khẩu đã được gửi!");
    } catch (error) {
      console.error(error);
      toast.error("Gửi email thất bại.");
      setMessage("❌ " + error.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-1">
        <h2>Quên Mật Khẩu</h2>
        <p>
          Nhập email bạn đã đăng ký. Chúng tôi sẽ gửi cho bạn liên kết để đặt lại mật khẩu.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="login-btn">
            Gửi Yêu Cầu
          </button>
          {message && (
            <p
              role={message.startsWith("✅") ? "status" : "alert"}
              aria-live="polite"
              style={{
                color: message.startsWith("✅") ? "green" : "red",
                marginTop: "10px",
              }}
            >
              {message}
            </p>
          )}
        </form>

        <div className="links">
          <a href="/login" className="forgot-password">
            Quay lại Đăng nhập
          </a>
        </div>
      </div>
      <div className="login-2"></div>
    </div>
  );
}
