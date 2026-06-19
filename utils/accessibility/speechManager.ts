import { SpeechConfig } from "../../types/accessibility";

class SpeechManager {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private config: SpeechConfig = {
    volume: 1,
    rate: 1.0,
    pitch: 1.0,
    voiceName: "",
  };

  private isSpeakingState = false;
  private isPausedState = false;
  private listeners: Set<(state: { isPlaying: boolean; isPaused: boolean }) => void> = new Set();

  // Cấu hình fallback dùng Google Translate TTS khi trình duyệt không hỗ trợ giọng Tiếng Việt
  // (Đã loại bỏ online fallback do Google chặn kết nối không chính thức)

  constructor() {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      this.synth = window.speechSynthesis;

      // Cố gắng tìm giọng tiếng Việt ngay lập tức nếu voices đã sẵn sàng
      const initialVoices = this.synth.getVoices();
      if (initialVoices.length && !this.config.voiceName) {
        const viVoice = initialVoices.find((v) => v.lang.toLowerCase().startsWith("vi"));
        if (viVoice) {
          this.config.voiceName = viVoice.name;
        }
      }

      // Đăng ký sự kiện thay đổi voices để cập nhật khi tải xong (dùng addEventListener để tránh bị ghi đè)
      this.synth.addEventListener("voiceschanged", () => {
        const voices = this.synth!.getVoices();
        if (voices.length && !this.config.voiceName) {
          const viVoice = voices.find((v) => v.lang.toLowerCase().startsWith("vi"));
          if (viVoice) {
            this.config.voiceName = viVoice.name;
          }
        }
      });
    }
  }

  public subscribe(callback: (state: { isPlaying: boolean; isPaused: boolean }) => void) {
    this.listeners.add(callback);
    callback({ isPlaying: this.isSpeakingState, isPaused: this.isPausedState });
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify() {
    this.listeners.forEach((cb) =>
      cb({ isPlaying: this.isSpeakingState, isPaused: this.isPausedState })
    );
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }

  public getVietnameseVoice(): SpeechSynthesisVoice | null {
    const voices = this.getVoices();
    return (
      voices.find((v) => {
        const lang = v.lang.toLowerCase();
        return lang.startsWith("vi") || lang.includes("vi-vn") || lang.includes("vi_vn");
      }) || null
    );
  }

  public updateConfig(newConfig: Partial<SpeechConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  public speak(text: string, onEnd?: () => void) {
    if (!this.synth) return;

    this.stop();

    if (!text.trim()) return;

    const voices = this.getVoices();
    if (!voices.length) {
      console.error("Chưa có giọng đọc khả dụng, thử lại sau.");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance;

    // Thiết lập ngôn ngữ rõ ràng là Tiếng Việt để trình duyệt chọn giọng phù hợp nhất
    utterance.lang = "vi-VN";

    utterance.volume = this.config.volume;
    utterance.rate = this.config.rate;
    utterance.pitch = this.config.pitch;

    const selectedVoice = voices.find((v) => v.name === this.config.voiceName);
    const viVoice = this.getVietnameseVoice();

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    } else if (viVoice) {
      utterance.voice = viVoice;
      this.config.voiceName = viVoice.name;
    } else {
      console.warn("Không tìm thấy giọng nói Tiếng Việt cụ thể trên trình duyệt/hệ thống này. Đang sử dụng giọng nói mặc định của hệ thống với cấu hình lang='vi-VN'.");
    }

    utterance.onstart = () => {
      this.isSpeakingState = true;
      this.isPausedState = false;
      this.notify();
    };

    utterance.onend = () => {
      this.isSpeakingState = false;
      this.isPausedState = false;
      this.currentUtterance = null;
      this.notify();
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      console.error("Speech Synthesis Error:", e);
      this.isSpeakingState = false;
      this.isPausedState = false;
      this.currentUtterance = null;
      this.notify();
      if (onEnd) onEnd();
    };

    this.synth.speak(utterance);
  }

  public pause() {
    if (!this.synth || !this.isSpeakingState || this.isPausedState) return;
    this.synth.pause();
    this.isPausedState = true;
    this.notify();
  }

  public resume() {
    if (!this.synth || !this.isPausedState) return;
    this.synth.resume();
    this.isPausedState = false;
    this.notify();
  }

  public stop() {
    if (!this.synth) return;
    // Xóa handlers trước khi cancel để tránh onerror/"interrupted" bắn ra khi ngắt utterance cũ
    if (this.currentUtterance) {
      this.currentUtterance.onerror = null;
      this.currentUtterance.onend = null;
      this.currentUtterance.onstart = null;
    }
    this.synth.cancel();
    this.isSpeakingState = false;
    this.isPausedState = false;
    this.currentUtterance = null;
    this.notify();
  }

  public getState() {
    return {
      isPlaying: this.isSpeakingState,
      isPaused: this.isPausedState,
      config: this.config,
    };
  }
}

export const speechManager =
  typeof window !== "undefined" ? new SpeechManager() : ({} as SpeechManager);
