"use client";

import React from "react";
import { motion } from "framer-motion";
import { Accessibility } from "lucide-react";
import { useAccessibility } from "../../contexts/AccessibilityContext";

export const AccessibilityButton: React.FC = () => {
  const { togglePanel, isPanelOpen } = useAccessibility();

  return (
    <motion.button
      id="a11y-assistant-button"
      onClick={togglePanel}
      className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full border shadow-2xl focus:outline-none transition-all duration-300 ${
        isPanelOpen
          ? "bg-rose-600 hover:bg-rose-700 border-rose-500 text-white focus:ring-rose-300"
          : "bg-emerald-700 hover:bg-emerald-800 border-emerald-600 text-white focus:ring-emerald-400"
      }`}
      aria-label={isPanelOpen ? "Đóng bảng điều khiển hỗ trợ tiếp cận" : "Mở bảng điều khiển hỗ trợ tiếp cận (Alt + A)"}
      aria-expanded={isPanelOpen}
      aria-haspopup="dialog"
      aria-controls="a11y-assistant-panel"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      layout
    >
      <Accessibility className="h-7 w-7 animate-pulse-slow" />
      <span className="sr-only">Hỗ trợ tiếp cận</span>
    </motion.button>
  );
};
