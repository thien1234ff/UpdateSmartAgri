"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Volume2,
  Play,
  Pause,
  Square,
  MessageSquare,
  Eye,
  Keyboard,
  Settings,
  Send,
  Trash2,
  Activity,
  Compass
} from "lucide-react";
import { useAccessibility } from "../../contexts/AccessibilityContext";
import { speechManager } from "../../utils/accessibility/speechManager";

export const AccessibilityPanel: React.FC = () => {
  const {
    isPanelOpen,
    closePanel,
    focusReadingEnabled,
    setFocusReadingEnabled,
    currentFocusedElement,
    speechConfig,
    updateSpeechConfig,
    isPlaying,
    isPaused,
    speakText,
    pauseSpeech,
    resumeSpeech,
    stopSpeech,
    readEntirePage,
    pageData,
    messages,
    sendChatMessage,
    clearChat,
    isAiThinking,
    ttsEnabled,
    setTtsEnabled
  } = useAccessibility();

  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"read" | "focus" | "nav" | "chat" | "settings">("read");
  const [inputText, setInputText] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const navigateTo = (path: string, label: string) => {
    closePanel();
    speakText(`Đang chuyển hướng tới trang ${label}`);
    router.push(path);
  };

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = tabs.findIndex((t) => t.id === activeTab);
    let nextIndex = currentIndex;

    if (e.key === "ArrowRight") {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % tabs.length;
      setActiveTab(tabs[nextIndex].id);
      speakText(`Chuyển sang tab ${tabs[nextIndex].label}`);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      setActiveTab(tabs[nextIndex].id);
      speakText(`Chuyển sang tab ${tabs[nextIndex].label}`);
    }
  };

  useEffect(() => {
    const loadVoices = () => {
      setVoices(speechManager.getVoices());
    };
    loadVoices();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    }
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      }
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiThinking]);

  // Focus management: Shift focus to active tab on open
  useEffect(() => {
    if (isPanelOpen) {
      const timer = setTimeout(() => {
        const activeTabEl = document.getElementById(`tab-${activeTab}`);
        if (activeTabEl) {
          activeTabEl.focus();
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isPanelOpen, activeTab]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    const txt = inputText;
    setInputText("");
    await sendChatMessage(txt);
  };

  const handleSuggestion = async (suggestion: string) => {
    if (isAiThinking) return;
    await sendChatMessage(suggestion);
  };

  if (!isPanelOpen) return null;

  const tabs = [
    { id: "read", label: "Đọc trang", icon: Play },
    { id: "focus", label: "Tiêu điểm", icon: Eye },
    { id: "nav", label: "Chuyển trang", icon: Compass },
    { id: "chat", label: "Trợ lý AI", icon: MessageSquare },
    { id: "settings", label: "Cài đặt", icon: Settings },
  ] as const;

  return (
    <AnimatePresence>
      <motion.div
        ref={panelRef}
        id="a11y-assistant-panel"
        role="dialog"
        aria-label="Bảng điều khiển hỗ trợ tiếp cận"
        aria-modal="true"
        className="fixed bottom-24 right-6 z-50 flex h-[580px] w-96 flex-col rounded-2xl border border-slate-300 bg-white/98 text-slate-800 shadow-2xl backdrop-blur-md focus:outline-none"
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-emerald-50/50 px-4 py-3 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-700 text-white">
              <Volume2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">Trợ lý Tiếp cận</h2>
              <span className="text-[10px] text-emerald-800 font-bold">Agri Accessibility Assistant</span>
            </div>
          </div>
          <button
            onClick={closePanel}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
            aria-label="Đóng bảng điều khiển"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Bar - High Contrast Active/Inactive states */}
        <div 
          className="flex border-b border-slate-200 bg-slate-100/70 p-1" 
          role="tablist" 
          aria-label="Menu điều khiển các chế độ"
          onKeyDown={handleTabKeyDown}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.id}`}
                id={`tab-${tab.id}`}
                tabIndex={0}
                onClick={() => {
                  setActiveTab(tab.id);
                  speakText(`Chuyển sang tab ${tab.label}`);
                }}
                className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-lg py-2 text-[10px] font-bold transition-all focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  isActive
                    ? "bg-emerald-800 text-white shadow-md border border-emerald-900"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Panel */}
        <div className="flex-1 overflow-y-auto p-4" id={`tabpanel-${activeTab}`} role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
          {activeTab === "read" && (
            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wide">Quét Trang Web</h3>
                <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                  Quét và phân tích toàn bộ trang hiện tại để tạo mô tả cấu trúc bằng giọng nói.
                </p>
                <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 bg-white border border-slate-200 rounded-lg p-2.5">
                  <div className="flex-1 min-w-[40%]">🌐 Trang: <span className="font-bold text-slate-800">{pageData?.pageTitle ? pageData.pageTitle.substring(0, 16) + "..." : "Đang tải"}</span></div>
                  <div className="flex-1 min-w-[40%]">🏷️ Tiêu đề: <span className="font-bold text-slate-800">{pageData?.headings.length || 0}</span></div>
                  <div className="flex-1 min-w-[40%]">🖱️ Nút bấm: <span className="font-bold text-slate-800">{pageData?.buttons.length || 0}</span></div>
                  <div className="flex-1 min-w-[40%]">📋 Biểu mẫu: <span className="font-bold text-slate-800">{pageData?.forms.length || 0}</span></div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={readEntirePage}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
                >
                  <Play className="h-4 w-4 fill-white" />
                  Đọc toàn bộ trang (Alt + R)
                </button>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={pauseSpeech}
                    disabled={!isPlaying || isPaused}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors ${
                      isPlaying && !isPaused
                        ? "bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-800"
                        : "bg-slate-100 text-slate-400 border-transparent cursor-not-allowed"
                    }`}
                    aria-label="Tạm dừng đọc (Alt + P)"
                  >
                    <Pause className="h-3.5 w-3.5" />
                    Tạm dừng
                  </button>

                  <button
                    onClick={resumeSpeech}
                    disabled={!isPaused}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors ${
                      isPaused
                        ? "bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-800"
                        : "bg-slate-100 text-slate-400 border-transparent cursor-not-allowed"
                    }`}
                    aria-label="Tiếp tục đọc (Alt + C)"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Tiếp tục
                  </button>

                  <button
                    onClick={stopSpeech}
                    disabled={!isPlaying && !isPaused}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors ${
                      isPlaying || isPaused
                        ? "bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700"
                        : "bg-slate-100 text-slate-400 border-transparent cursor-not-allowed"
                    }`}
                    aria-label="Dừng đọc hoàn toàn (Alt + S)"
                  >
                    <Square className="h-3.5 w-3.5 fill-rose-700 text-rose-700" />
                    Dừng lại
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mt-2 p-1.5 rounded-lg border border-dashed border-slate-300">
                <span className="text-[11px] text-slate-500 font-semibold">Trạng thái phát thanh:</span>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded ${
                  isPlaying ? "bg-emerald-100 text-emerald-800" : isPaused ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
                }`}>
                  {isPlaying ? "🔊 Đang đọc" : isPaused ? "⏸️ Tạm ngưng" : "🔈 Đang chờ"}
                </span>
              </div>
            </div>
          )}

          {activeTab === "focus" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 leading-normal">Chế độ đọc tiêu điểm</h3>
                  <p className="text-[11px] text-slate-500 leading-normal">Tự động phát âm khi chuyển nút bấm, biểu mẫu bằng phím Tab.</p>
                </div>
                <button
                  onClick={() => setFocusReadingEnabled(!focusReadingEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    focusReadingEnabled ? "bg-emerald-700" : "bg-slate-300"
                  }`}
                  role="switch"
                  aria-checked={focusReadingEnabled}
                  aria-label="Bật tắt chế độ đọc tiêu điểm"
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      focusReadingEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/20 p-4 min-h-[160px]">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-emerald-700" />
                  Thành phần đang focus
                </h3>
                
                {currentFocusedElement ? (
                  <div className="flex flex-col gap-2 bg-white p-3 rounded-lg border border-slate-200 shadow-sm mt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5 uppercase">
                        {currentFocusedElement.type}
                      </span>
                      {currentFocusedElement.id && (
                        <span className="text-[9px] font-mono text-slate-400 bg-slate-50 rounded px-1">
                          #{currentFocusedElement.id}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-slate-900">{currentFocusedElement.text || "(Thành phần rỗng)"}</div>
                    {currentFocusedElement.description && (
                      <p className="text-[11px] text-slate-700 italic bg-amber-50/30 p-1.5 rounded border border-amber-200 mt-1 leading-normal">
                        🔊 &quot;{currentFocusedElement.description}&quot;
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center flex-1 text-center py-6">
                    <p className="text-xs text-slate-400 italic">Nhấn Tab trên trang web để kích hoạt và di chuyển tiêu điểm.</p>
                  </div>
                )}
              </div>

              <div className="text-[11px] text-slate-600 bg-amber-50 border border-amber-200 p-3 rounded-lg leading-relaxed">
                💡 **Mẹo:** Bạn có thể bật Chế độ Focus kết hợp với nhấn phím **Tab** hoặc **Shift + Tab** để kiểm tra mọi thành phần tương tác trên màn hình mà không cần dùng chuột.
              </div>
            </div>
          )}

          {activeTab === "nav" && (
            <div className="flex flex-col gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wide">Chuyển Trang Nhanh</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Chuyển nhanh đến các trang chức năng chính của Smart Agriculture bằng bàn phím hoặc giọng nói.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 overflow-y-auto max-h-[300px] pr-1">
                {[
                  { label: "Trang chủ", path: "/", desc: "Quay lại trang chủ chính" },
                  { label: "Sản phẩm", path: "/products", desc: "Cửa hàng sản phẩm nông sản" },
                  { label: "Quản lý nông trại", path: "/farm-management", desc: "Quản lý nông trại của bạn" },
                  { label: "Dự báo thời tiết", path: "/weather", desc: "Thông tin thời tiết nông nghiệp" },
                  { label: "Dự đoán năng suất", path: "/crop-prediction", desc: "Công cụ dự đoán năng suất" },
                  { label: "Diễn đàn", path: "/forum", desc: "Diễn đàn thảo luận và chia sẻ" },
                  { label: "Tin tức & Hướng dẫn", path: "/knowledge", desc: "Kiến thức nông nghiệp và hướng dẫn" },
                  { label: "Hỗ trợ Chatbot", path: "/ai-chat", desc: "Trò chuyện với AI Chatbot" },
                  { label: "Tài khoản cá nhân", path: "/profile", desc: "Hồ sơ cá nhân và cài đặt" },
                ].map((link, idx) => (
                  <button
                    key={idx}
                    onClick={() => navigateTo(link.path, link.label)}
                    className="flex flex-col items-start gap-1 p-3 rounded-xl border border-slate-200 bg-white hover:bg-emerald-50/50 hover:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-left shadow-sm group"
                    aria-label={`Chuyển đến trang ${link.label}. ${link.desc}`}
                  >
                    <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-800 transition-colors">{link.label}</span>
                    <span className="text-[9px] text-slate-400 group-hover:text-slate-600 line-clamp-1 leading-tight">{link.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === "chat" && (
            <div className="flex h-[400px] flex-col gap-2">
              <div className="flex-1 overflow-y-auto border border-slate-200 bg-slate-50 rounded-xl p-3 space-y-3">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 mb-1">Trò chuyện AI Page Assistant</h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed max-w-[200px]">
                      Hỏi bất kỳ thông tin nào xuất hiện trên trang hiện tại. AI sẽ phân tích DOM và trả lời.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-emerald-700 text-white rounded-br-none ml-auto"
                          : "bg-white text-slate-800 border border-slate-200 rounded-bl-none mr-auto"
                      }`}
                    >
                      <div className="whitespace-pre-line">{msg.content}</div>
                      <span className={`text-[8px] mt-1 block ${msg.role === "user" ? "text-emerald-200 text-right" : "text-slate-400"}`}>
                        {msg.timestamp}
                      </span>
                    </div>
                  ))
                )}
                {isAiThinking && (
                  <div className="flex max-w-[85%] rounded-2xl px-4 py-3 bg-white text-slate-600 border border-slate-200 rounded-bl-none mr-auto items-center gap-1.5 shadow-sm">
                    <span className="text-[10px]">Agri Accessibility Assistant đang suy nghĩ</span>
                    <span className="flex gap-1">
                      <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                      <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                      <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                    </span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="overflow-x-auto py-1 flex gap-1.5 scrollbar-none" style={{ scrollbarWidth: "none" }}>
                {[
                  "Trang này có gì?",
                  "Nút thêm ở đâu?",
                  "Có bao nhiêu nông trại?",
                  "Có biểu mẫu không?",
                  "Đọc phần đang focus."
                ].map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestion(sug)}
                    disabled={isAiThinking}
                    className="shrink-0 text-[10px] bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-300 text-slate-700 rounded-full px-3 py-1 font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
                  >
                    {sug}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSend} className="flex gap-1.5">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Hỏi AI về trang này..."
                  disabled={isAiThinking}
                  className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 shadow-inner focus:outline-none focus:ring-2 focus:ring-orange-500"
                  aria-label="Khung câu hỏi của bạn"
                />
                <button
                  type="submit"
                  disabled={isAiThinking || !inputText.trim()}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors ${
                    isAiThinking || !inputText.trim()
                      ? "bg-slate-200 text-slate-400 shadow-none cursor-not-allowed"
                      : "bg-emerald-700 hover:bg-emerald-800"
                  }`}
                  aria-label="Gửi tin nhắn"
                >
                  <Send className="h-4 w-4" />
                </button>
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={clearChat}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
                    aria-label="Xóa cuộc trò chuyện"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </form>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="voice-select" className="text-xs font-bold text-slate-700">
                  Giọng nói (TTS Voice)
                </label>
                <select
                  id="voice-select"
                  value={speechConfig.voiceName}
                  onChange={(e) => updateSpeechConfig({ voiceName: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
                >
                  <option value="">-- Mặc định hệ thống --</option>
                  {voices.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} ({v.lang}) {v.lang.startsWith("vi") ? "🇻🇳" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Toggle TTS System Speech */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 leading-normal">Giọng đọc trợ lý (TTS)</h3>
                  <p className="text-[11px] text-slate-500 leading-normal">Phát giọng thanh hệ thống. Hãy tắt nếu bạn muốn dùng trình đọc Narrator độc lập.</p>
                </div>
                <button
                  onClick={() => setTtsEnabled(!ttsEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    ttsEnabled ? "bg-emerald-700" : "bg-slate-300"
                  }`}
                  role="switch"
                  aria-checked={ttsEnabled}
                  aria-label="Bật tắt giọng đọc trợ lý"
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      ttsEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="flex flex-col gap-3.5 bg-slate-50 border border-slate-200 p-4 rounded-xl">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-700">Tốc độ đọc</span>
                    <span className="font-mono text-emerald-800 font-bold">{speechConfig.rate.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={speechConfig.rate}
                    onChange={(e) => updateSpeechConfig({ rate: parseFloat(e.target.value) })}
                    className="h-1.5 w-full cursor-pointer rounded-lg bg-slate-200 accent-emerald-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    aria-label="Tốc độ đọc"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-700">Cao độ</span>
                    <span className="font-mono text-emerald-800 font-bold">{speechConfig.pitch.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={speechConfig.pitch}
                    onChange={(e) => updateSpeechConfig({ pitch: parseFloat(e.target.value) })}
                    className="h-1.5 w-full cursor-pointer rounded-lg bg-slate-200 accent-emerald-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    aria-label="Cao độ giọng đọc"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-700">Âm lượng</span>
                    <span className="font-mono text-emerald-800 font-bold">{Math.round(speechConfig.volume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1.0"
                    step="0.1"
                    value={speechConfig.volume}
                    onChange={(e) => updateSpeechConfig({ volume: parseFloat(e.target.value) })}
                    className="h-1.5 w-full cursor-pointer rounded-lg bg-slate-200 accent-emerald-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    aria-label="Âm lượng"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Keyboard className="h-3.5 w-3.5 text-emerald-700" />
                  Phím tắt hỗ trợ (Shortcuts)
                </h3>
                <div className="grid grid-cols-2 gap-2 text-[10px] mt-1 text-slate-600">
                  <div className="flex items-center gap-1.5"><kbd className="bg-white px-2 py-0.5 rounded border shadow-sm font-sans font-bold">Alt + A</kbd><span>Mở bảng trợ lý</span></div>
                  <div className="flex items-center gap-1.5"><kbd className="bg-white px-2 py-0.5 rounded border shadow-sm font-sans font-bold">Alt + R</kbd><span>Đọc trang web</span></div>
                  <div className="flex items-center gap-1.5"><kbd className="bg-white px-2 py-0.5 rounded border shadow-sm font-sans font-bold">Alt + S</kbd><span>Dừng giọng đọc</span></div>
                  <div className="flex items-center gap-1.5"><kbd className="bg-white px-2 py-0.5 rounded border shadow-sm font-sans font-bold">Alt + P</kbd><span>Tạm dừng đọc</span></div>
                  <div className="flex items-center gap-1.5"><kbd className="bg-white px-2 py-0.5 rounded border shadow-sm font-sans font-bold">Alt + C</kbd><span>Tiếp tục đọc</span></div>
                  <div className="flex items-center gap-1.5"><kbd className="bg-white px-2 py-0.5 rounded border shadow-sm font-sans font-bold">ESC</kbd><span>Đóng bảng</span></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-2.5 text-[10px] text-slate-400 font-semibold rounded-b-2xl">
          <span>Smart Agri A11y Assistant</span>
          <span>Phiên bản 1.0.0</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
