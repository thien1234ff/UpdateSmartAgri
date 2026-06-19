"use client";
// components/OrderStatusBadge.jsx
import { Check, Clock, Truck, XCircle, RefreshCw } from "lucide-react";

const STATUS_MAP = {
  pending: {
    label: "Đang chờ",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
  },
  processing: {
    label: "Đang xử lý",
    color: "bg-blue-100 text-blue-800",
    icon: RefreshCw,
  },
  shipped: {
    label: "Đã giao",
    color: "bg-indigo-100 text-indigo-800",
    icon: Truck,
  },
  delivered: {
    label: "Đã nhận",
    color: "bg-green-100 text-green-800",
    icon: Check,
  },
  cancelled: {
    label: "Đã huỷ",
    color: "bg-red-100 text-red-800",
    icon: XCircle,
  },
};

export default function OrderStatusBadge({ status }) {
  const cfg = STATUS_MAP[status] ?? STATUS_MAP["pending"];
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}
    >
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}