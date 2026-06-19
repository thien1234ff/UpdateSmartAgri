"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { DOMExtractedData, SpeechConfig, Message, FocusedElementData } from "../types/accessibility";
import { parseCurrentPage } from "../utils/accessibility/domParser";
import { speechManager } from "../utils/accessibility/speechManager";

interface AccessibilityContextType {
  isPanelOpen: boolean;
  focusReadingEnabled: boolean;
  currentFocusedElement: FocusedElementData | null;
  speechConfig: SpeechConfig;
  isPlaying: boolean;
  isPaused: boolean;
  messages: Message[];
  pageData: DOMExtractedData | null;
  isScanning: boolean;
  isAiThinking: boolean;
  ttsEnabled: boolean;
  srAnnouncement: string;
  togglePanel: () => void;
  openPanel: () => void;
  closePanel: () => void;
  setFocusReadingEnabled: (enabled: boolean) => void;
  setTtsEnabled: (enabled: boolean) => void;
  speakText: (text: string) => void;
  pauseSpeech: () => void;
  resumeSpeech: () => void;
  stopSpeech: () => void;
  updateSpeechConfig: (config: Partial<SpeechConfig>) => void;
  sendChatMessage: (text: string) => Promise<void>;
  clearChat: () => void;
  readEntirePage: () => void;
  rescanPage: () => void;
  announceToScreenReader: (text: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error("useAccessibility must be used within an AccessibilityProvider");
  }
  return context;
};

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [focusReadingEnabled, setFocusReadingEnabledState] = useState(true);
  const [currentFocusedElement, setCurrentFocusedElement] = useState<FocusedElementData | null>(null);
  
  const [speechConfig, setSpeechConfig] = useState<SpeechConfig>({
    volume: 1.0,
    rate: 1.0,
    pitch: 1.0,
    voiceName: "",
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  
  const [pageData, setPageData] = useState<DOMExtractedData | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const [ttsEnabled, setTtsEnabledState] = useState(true);
  const [srAnnouncement, setSrAnnouncement] = useState("");

  const lastAnnouncedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedConfig = localStorage.getItem("a11y_speech_config");
      const savedFocusMode = localStorage.getItem("a11y_focus_mode");
      const savedTtsEnabled = localStorage.getItem("a11y_tts_enabled");
      
      if (savedConfig) {
        try {
          const parsed = JSON.parse(savedConfig);
          setSpeechConfig(parsed);
          speechManager.updateConfig(parsed);
        } catch (e) {
          console.error("Error loading voice config:", e);
        }
      } else {
        const viVoice = speechManager.getVietnameseVoice();
        if (viVoice) {
          const initial = { ...speechConfig, voiceName: viVoice.name };
          setSpeechConfig(initial);
          speechManager.updateConfig(initial);
        }
      }

      if (savedFocusMode) {
        setFocusReadingEnabledState(savedFocusMode === "true");
      }

      if (savedTtsEnabled) {
        setTtsEnabledState(savedTtsEnabled === "true");
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = speechManager.subscribe((state) => {
      setIsPlaying(state.isPlaying);
      setIsPaused(state.isPaused);
    });
    return () => unsubscribe();
  }, []);

  const rescanPage = useCallback(() => {
    setIsScanning(true);
    setTimeout(() => {
      try {
        const extracted = parseCurrentPage();
        setPageData(extracted);
      } catch (err) {
        console.error("Failed to parse DOM:", err);
      } finally {
        setIsScanning(false);
      }
    }, 350);
  }, []);

  useEffect(() => {
    speechManager.stop();
    rescanPage();
    setMessages([]);
  }, [pathname, rescanPage]);

  const announceToScreenReader = useCallback((text: string) => {
    setSrAnnouncement("");
    setTimeout(() => {
      setSrAnnouncement(text);
    }, 50);
  }, []);

  const speakText = useCallback((text: string, onEnd?: () => void) => {
    announceToScreenReader(text);

    if (ttsEnabled) {
      speechManager.speak(text, onEnd);
    } else {
      if (onEnd) setTimeout(onEnd, 100);
    }
  }, [ttsEnabled, announceToScreenReader]);

  const setTtsEnabled = useCallback((enabled: boolean) => {
    setTtsEnabledState(enabled);
    localStorage.setItem("a11y_tts_enabled", String(enabled));
    if (enabled) {
      speakText("Đã bật giọng đọc trợ lý.");
    } else {
      announceToScreenReader("Đã tắt giọng đọc trợ lý. Sử dụng trình đọc màn hình của bạn.");
    }
  }, [speakText, announceToScreenReader]);

  const pauseSpeech = useCallback(() => {
    speechManager.pause();
  }, []);

  const resumeSpeech = useCallback(() => {
    speechManager.resume();
  }, []);

  const stopSpeech = useCallback(() => {
    speechManager.stop();
  }, []);

  const updateSpeechConfig = useCallback((newConfig: Partial<SpeechConfig>) => {
    setSpeechConfig((prev) => {
      const updated = { ...prev, ...newConfig };
      localStorage.setItem("a11y_speech_config", JSON.stringify(updated));
      speechManager.updateConfig(updated);
      return updated;
    });
  }, []);

  const togglePanel = useCallback(() => {
    setIsPanelOpen((prev) => {
      const next = !prev;
      if (next) {
        speakText("Đã mở bảng điều khiển hỗ trợ tiếp cận.");
      } else {
        speechManager.stop();
        setTimeout(() => {
          const floatingBtn = document.getElementById("a11y-assistant-button");
          floatingBtn?.focus();
        }, 100);
      }
      return next;
    });
  }, [speakText]);

  const openPanel = useCallback(() => {
    setIsPanelOpen(true);
    speakText("Đã mở bảng hỗ trợ tiếp cận.");
  }, [speakText]);

  const closePanel = useCallback(() => {
    setIsPanelOpen(false);
    speechManager.stop();
    setTimeout(() => {
      const floatingBtn = document.getElementById("a11y-assistant-button");
      floatingBtn?.focus();
    }, 100);
  }, []);

  const setFocusReadingEnabled = useCallback((enabled: boolean) => {
    setFocusReadingEnabledState(enabled);
    localStorage.setItem("a11y_focus_mode", String(enabled));
    if (enabled) {
      speakText("Đã bật chế độ đọc tiêu điểm. Nhấn Tab để bắt đầu di chuyển.");
    } else {
      speakText("Đã tắt chế độ đọc tiêu điểm.");
    }
  }, [speakText]);

  const readEntirePage = useCallback(() => {
    if (!pageData) return;

    const summaryParts: string[] = [];

    // 1. Check if Cart is open
    if (pageData.isCartOpen) {
      summaryParts.push("Bạn đang mở Giỏ hàng.");
      
      if (pageData.cartItems && pageData.cartItems.length > 0) {
        summaryParts.push(`Giỏ hàng hiện có ${pageData.cartItems.length} mặt hàng.`);
        pageData.cartItems.forEach((item, index) => {
          summaryParts.push(`Mặt hàng ${index + 1}: ${item.name}, số lượng: ${item.quantity}, giá: ${item.price}.`);
          if (item.actions && item.actions.length > 0) {
            summaryParts.push(`Các chức năng cho mặt hàng này gồm: ${item.actions.join(", ")}.`);
          }
        });
        if (pageData.cartTotal) {
          summaryParts.push(`Tổng cộng tiền hàng là: ${pageData.cartTotal}.`);
        }
        summaryParts.push("Các chức năng chung gồm có nút Thanh toán và nút Xóa tất cả.");
      } else {
        summaryParts.push("Giỏ hàng của bạn hiện đang trống.");
      }
      
      const fullSpeechText = summaryParts.join("\n");
      speakText(fullSpeechText);
      return;
    }

    // 2. Check if Checkout is open
    if (pageData.isCheckoutOpen) {
      summaryParts.push("Bạn đang ở giao diện Thanh toán đơn hàng.");
      summaryParts.push("Vui lòng điền thông tin vào các trường bắt buộc.");
      
      const checkoutForm = pageData.forms.find(f => f.id === "checkout-form");
      if (checkoutForm && checkoutForm.inputs.length > 0) {
        summaryParts.push("Các thông tin cần nhập gồm:");
        checkoutForm.inputs.forEach((input) => {
          summaryParts.push(`• Trường ${input.text}`);
        });
      }
      
      summaryParts.push("Sau khi điền đầy đủ thông tin, chọn nút Đặt hàng để hoàn tất.");
      
      const fullSpeechText = summaryParts.join("\n");
      speakText(fullSpeechText);
      return;
    }

    // 3. Normal page reading
    summaryParts.push(`Bạn đang ở trang: ${pageData.pageTitle || "Nông nghiệp thông minh"}.`);
    
    const landmarksCount = pageData.landmarks.length;
    const headingsCount = pageData.headings.length;
    const buttonsCount = pageData.buttons.length;
    const formsCount = pageData.forms.length;
    const tablesCount = pageData.tables.length;
    const cardsCount = pageData.cards.length;

    summaryParts.push("Trang hiện có:");
    if (headingsCount > 0) summaryParts.push(`• ${headingsCount} tiêu đề.`);
    if (landmarksCount > 0) summaryParts.push(`• ${landmarksCount} vùng bố cục.`);
    if (buttonsCount > 0) summaryParts.push(`• ${buttonsCount} nút chức năng và liên kết.`);
    if (formsCount > 0) summaryParts.push(`• ${formsCount} biểu mẫu nhập dữ liệu.`);
    if (tablesCount > 0) summaryParts.push(`• ${tablesCount} bảng dữ liệu.`);
    if (cardsCount > 0) {
      const cardType = pageData.cards[0]?.title.includes("🌾") || pageData.pageTitle.includes("nông trại") ? "nông trại" : "mục nội dung";
      summaryParts.push(`• ${cardsCount} ${cardType}.`);
    }

    summaryParts.push("Bắt đầu đọc nội dung chính từ trên xuống dưới.");
    
    if (pageData.headings.length > 0) {
      summaryParts.push("Danh sách các tiêu đề chính trên trang gồm có:");
      pageData.headings.forEach((h, index) => {
        summaryParts.push(`Tiêu đề ${index + 1}: ${h.text}`);
      });
    }

    if (pageData.paragraphs.length > 0) {
      summaryParts.push("Nội dung chi tiết:");
      pageData.paragraphs.slice(0, 8).forEach((p) => {
        summaryParts.push(p);
      });
    }

    if (pageData.cards.length > 0) {
      summaryParts.push("Danh sách các thẻ hiển thị:");
      pageData.cards.forEach((c) => {
        let cardDesc = `Thẻ ${c.title}. Chi tiết: ${c.content}`;
        if (c.buttons && c.buttons.length > 0) {
          const actionLabels = c.buttons
            .map((b) => b.ariaLabel || b.text)
            .filter(Boolean);
          if (actionLabels.length > 0) {
            cardDesc += `. Các chức năng khả dụng gồm: ${actionLabels.join(", ")}`;
          }
        }
        summaryParts.push(cardDesc);
      });
    }

    const fullSpeechText = summaryParts.join("\n");
    speakText(fullSpeechText);
  }, [pageData, speakText]);

  const sendChatMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    let currentData = pageData;
    try {
      currentData = parseCurrentPage();
      setPageData(currentData);
    } catch (e) {
      console.error("Rescan before AI failed", e);
    }

    const userMsgId = Date.now().toString();
    const userMsg: Message = {
      id: userMsgId,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString("vi-VN"),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsAiThinking(true);

    try {
      const response = await fetch("/api/accessibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          pageData: currentData,
          history: messages,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Network error");
      }

      const replyText = data.reply;
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: replyText,
        timestamp: new Date().toLocaleTimeString("vi-VN"),
      };

      setMessages((prev) => [...prev, aiMsg]);
      speakText(replyText);
    } catch (err: any) {
      console.error("Chat API failed:", err);
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Không thể kết nối đến máy chủ AI. Vui lòng thử lại sau.",
        timestamp: new Date().toLocaleTimeString("vi-VN"),
      };
      setMessages((prev) => [...prev, errMsg]);
      speakText(errMsg.content);
    } finally {
      setIsAiThinking(false);
    }
  }, [messages, pageData, speakText]);

  const clearChat = useCallback(() => {
    setMessages([]);
    speakText("Đã xóa lịch sử trò chuyện.");
  }, [speakText]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        togglePanel();
      }
      else if (e.altKey && (e.key === "r" || e.key === "R")) {
        e.preventDefault();
        readEntirePage();
      }
      else if (e.altKey && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        stopSpeech();
      }
      else if (e.altKey && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        pauseSpeech();
      }
      else if (e.altKey && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
        resumeSpeech();
      }
      else if (e.key === "Escape" && isPanelOpen) {
        e.preventDefault();
        closePanel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPanelOpen, togglePanel, readEntirePage, stopSpeech, pauseSpeech, resumeSpeech, closePanel]);

  const parseFocusedElement = useCallback((element: HTMLElement): FocusedElementData | null => {
    if (!element || element === document.body || element === document.documentElement) {
      return null;
    }

    let parent: HTMLElement | null = element;
    while (parent) {
      if (parent.id === "a11y-assistant-panel" || parent.id === "a11y-assistant-button") {
        return null;
      }
      parent = parent.parentElement;
    }

    const tagName = element.tagName.toLowerCase();
    const id = element.id || undefined;
    const role = element.getAttribute("role") || "";
    const ariaLabel = element.getAttribute("aria-label") || "";
    const placeholder = element.getAttribute("placeholder") || "";
    const alt = element.getAttribute("alt") || "";
    
    let text = element.innerText || element.textContent || "";
    text = text.replace(/\s+/g, " ").trim();

    let typeText = "Thành phần";
    let desc = "";

    if (tagName === "button" || role === "button" || element.classList.contains("btn")) {
      typeText = "Nút";
      const btnLabel = ariaLabel || text || placeholder || "Chức năng";
      desc = `Nút ${btnLabel}`;
    }
    else if (tagName === "input") {
      const type = element.getAttribute("type") || "text";
      if (type === "checkbox") {
        typeText = "Hộp chọn";
        const isChecked = (element as HTMLInputElement).checked;
        const inputLabel = ariaLabel || placeholder || "Hộp kiểm";
        desc = `Hộp chọn ${inputLabel}, ${isChecked ? "đã chọn" : "chưa chọn"}`;
      } else if (type === "radio") {
        typeText = "Nút chọn";
        const isChecked = (element as HTMLInputElement).checked;
        const inputLabel = ariaLabel || placeholder || "Lựa chọn";
        desc = `Lút chọn ${inputLabel}, ${isChecked ? "đã chọn" : "chưa chọn"}`;
      } else {
        typeText = "Ô nhập dữ liệu";
        const inputLabel = ariaLabel || placeholder || "Nhập thông tin";
        const val = (element as HTMLInputElement).value;
        desc = `Ô nhập ${inputLabel} ${val ? `, giá trị hiện tại là ${val}` : ""}`;
      }
    } else if (tagName === "textarea") {
      typeText = "Khung nhập nội dung";
      const inputLabel = ariaLabel || placeholder || "Mô tả";
      desc = `Khung nhập ${inputLabel}`;
    } else if (tagName === "select") {
      typeText = "Danh sách lựa chọn";
      const selectLabel = ariaLabel || "Chọn mục";
      const valText = (element as HTMLSelectElement).options[(element as HTMLSelectElement).selectedIndex]?.text || "";
      desc = `Danh sách chọn ${selectLabel}, giá trị đang chọn ${valText}`;
    }
    else if (tagName === "a" || role === "link") {
      typeText = "Liên kết";
      const linkLabel = ariaLabel || text || "Đến liên kết";
      desc = `Liên kết ${linkLabel}`;
    }
    else if (/^h[1-6]$/.test(tagName)) {
      const level = tagName.substring(1);
      typeText = `Tiêu đề cấp ${level}`;
      desc = `Tiêu đề cấp ${level}, ${text}`;
    }
    else if (element.classList.contains("farm-card") || element.classList.contains("product-card")) {
      typeText = "Thẻ thông tin";
      const titleEl = element.querySelector("h3, h4, h5, strong");
      const titleText = titleEl ? (titleEl.textContent || "") : "Nông nghiệp";
      desc = `Thẻ thông tin ${titleText}`;
    }
    else if (tagName === "td" || tagName === "th") {
      typeText = "Ô bảng dữ liệu";
      desc = `${tagName === "th" ? "Tiêu đề cột" : "Ô dữ liệu"} ${text}`;
    }
    else if (tagName === "img") {
      typeText = "Hình ảnh";
      desc = `Hình ảnh: ${alt || ariaLabel || "Không có mô tả"}`;
    }
    else {
      if (ariaLabel) {
        desc = ariaLabel;
      } else if (text && text.length < 60) {
        desc = text;
      } else {
        desc = "Thành phần trang";
      }
    }

    return {
      text: text.substring(0, 100),
      type: typeText,
      tagName: tagName,
      id,
      ariaLabel: ariaLabel || undefined,
      description: desc,
    };
  }, []);

  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const parsed = parseFocusedElement(target);
      if (!parsed) {
        setCurrentFocusedElement(null);
        return;
      }

      setCurrentFocusedElement(parsed);

      if (focusReadingEnabled && lastAnnouncedElementRef.current !== target) {
        lastAnnouncedElementRef.current = target;
        speakText(parsed.description || parsed.text);
      }
    };

    const handleFocusOut = () => {
      setTimeout(() => {
        if (document.activeElement === document.body) {
          setCurrentFocusedElement(null);
          lastAnnouncedElementRef.current = null;
        }
      }, 50);
    };

    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);

    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
    };
  }, [focusReadingEnabled, parseFocusedElement, speakText]);

  return (
    <AccessibilityContext.Provider
      value={{
        isPanelOpen,
        focusReadingEnabled,
        currentFocusedElement,
        speechConfig,
        isPlaying,
        isPaused,
        messages,
        pageData,
        isScanning,
        isAiThinking,
        ttsEnabled,
        srAnnouncement,
        togglePanel,
        openPanel,
        closePanel,
        setFocusReadingEnabled,
        setTtsEnabled,
        speakText,
        pauseSpeech,
        resumeSpeech,
        stopSpeech,
        updateSpeechConfig,
        sendChatMessage,
        clearChat,
        readEntirePage,
        rescanPage,
        announceToScreenReader,
      }}
    >
      {children}

      {/* Hidden announcer for screen readers (Windows Narrator / NVDA) */}
      <div
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
        role="status"
      >
        {srAnnouncement}
      </div>
    </AccessibilityContext.Provider>
  );
};
