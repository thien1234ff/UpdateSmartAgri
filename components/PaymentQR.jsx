"use client";
import { useEffect, useState } from "react";

export default function PaymentQR({ bankCode = "Vietinbank", accountNumber, orderId, amount }) {
  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    if (!orderId || !amount) return;
    const url = `https://img.vietqr.io/image/${bankCode}-${accountNumber}-compact.png?amount=${amount}&addInfo=DH${orderId}`;
    setQrUrl(url);
  }, [bankCode, accountNumber, orderId, amount]);

  return (
    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl text-center border border-blue-100/50 animate-fade-in">
      <p className="text-sm text-blue-800 mb-3">💳 Quét mã QR để chuyển khoản cho Admin:</p>
      <div className="relative inline-block">
        <img
          src={qrUrl}
          alt="QR Admin"
          className="w-48 mx-auto rounded-2xl shadow-lg transition-transform duration-300 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent rounded-2xl"></div>
      </div>
    </div>
  );
}
