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
  private isUsingFallback = false;
  private audioQueue: string[] = [];
  private currentAudioIndex = 0;
  private currentAudio: HTMLAudioElement | null = null;

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

  // Hàm chia nhỏ đoạn văn thành các phần tối đa 180 ký tự để không vượt giới hạn của Google TTS
  private splitTextIntoChunks(text: string, maxLen: number = 180): string[] {
    const chunks: string[] = [];
    let currentChunk = "";
    
    // Tách văn bản theo các từ và khoảng trắng
    const words = text.split(/(\s+)/);
    for (const word of words) {
      if ((currentChunk + word).length > maxLen) {
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = word;
      } else {
        currentChunk += word;
      }
    }
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    return chunks;
  }

  // Hàm phát danh sách các audio được chia nhỏ tuần tự
  private playAudioQueue(onEnd?: () => void) {
    if (this.currentAudioIndex >= this.audioQueue.length) {
      this.isSpeakingState = false;
      this.isUsingFallback = false;
      this.notify();
      if (onEnd) onEnd();
      return;
    }

    const chunk = this.audioQueue[this.currentAudioIndex];
    // Sử dụng API TTS của Google Translate (client=tw-ob để không bị giới hạn CORS)
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=vi&client=tw-ob`;

    this.currentAudio = new Audio(url);
    this.currentAudio.volume = this.config.volume;
    
    // HTML5 Audio điều chỉnh tốc độ đọc thông qua playbackRate
    this.currentAudio.defaultPlaybackRate = this.config.rate;
    this.currentAudio.playbackRate = this.config.rate;

    this.currentAudio.onplay = () => {
      this.isSpeakingState = true;
      this.isPausedState = false;
      this.notify();
    };

    this.currentAudio.onended = () => {
      this.currentAudioIndex++;
      this.playAudioQueue(onEnd);
    };

    this.currentAudio.onerror = (e) => {
      console.error("Google Translate TTS Fallback Audio Error:", e);
      this.currentAudioIndex++;
      this.playAudioQueue(onEnd);
    };

    this.currentAudio.play().catch((err) => {
      console.error("Failed to play Google TTS audio chunk:", err);
      // Nếu trình duyệt chặn phát tự động (autoplay policy), ta vẫn tiếp tục hoặc dừng lại
      this.isSpeakingState = false;
      this.notify();
      if (onEnd) onEnd();
    });
  }

  public speak(text: string, onEnd?: () => void) {
    this.stop(); // Dừng tất cả phát âm hiện tại (cả Web Speech lẫn Google Audio)

    if (!text.trim()) return;

    const voices = this.getVoices();
    const selectedVoice = voices.find((v) => v.name === this.config.voiceName);
    const viVoice = this.getVietnameseVoice();

    // Xác định xem hệ thống/trình duyệt có giọng đọc Tiếng Việt nội bộ khả dụng không
    const hasViVoice = !!viVoice || (!!selectedVoice && selectedVoice.lang.toLowerCase().startsWith("vi"));

    if (this.synth && hasViVoice) {
      this.isUsingFallback = false;
      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;

      utterance.lang = "vi-VN";
      utterance.volume = this.config.volume;
      utterance.rate = this.config.rate;
      utterance.pitch = this.config.pitch;

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      } else if (viVoice) {
        utterance.voice = viVoice;
        this.config.voiceName = viVoice.name;
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
    } else {
      // Nếu không có giọng nói Tiếng Việt nội bộ, dùng Google Translate TTS
      console.log("Không tìm thấy giọng Tiếng Việt hệ thống. Đang kích hoạt Google Translate TTS online fallback.");
      this.isUsingFallback = true;
      this.audioQueue = this.splitTextIntoChunks(text, 180);
      this.currentAudioIndex = 0;
      this.playAudioQueue(onEnd);
    }
  }

  public pause() {
    if (this.isUsingFallback) {
      if (this.currentAudio && this.isSpeakingState && !this.isPausedState) {
        this.currentAudio.pause();
        this.isPausedState = true;
        this.notify();
      }
    } else {
      if (!this.synth || !this.isSpeakingState || this.isPausedState) return;
      this.synth.pause();
      this.isPausedState = true;
      this.notify();
    }
  }

  public resume() {
    if (this.isUsingFallback) {
      if (this.currentAudio && this.isPausedState) {
        this.currentAudio.play().catch((e) => console.error(e));
        this.isPausedState = false;
        this.notify();
      }
    } else {
      if (!this.synth || !this.isPausedState) return;
      this.synth.resume();
      this.isPausedState = false;
      this.notify();
    }
  }

  public stop() {
    // 1. Dừng Google TTS
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.onerror = null;
      this.currentAudio.onended = null;
      this.currentAudio.onplay = null;
      this.currentAudio = null;
    }
    this.audioQueue = [];
    this.currentAudioIndex = 0;

    // 2. Dừng Web Speech API
    if (this.synth) {
      if (this.currentUtterance) {
        this.currentUtterance.onerror = null;
        this.currentUtterance.onend = null;
        this.currentUtterance.onstart = null;
      }
      this.synth.cancel();
    }

    this.isSpeakingState = false;
    this.isPausedState = false;
    this.currentUtterance = null;
    this.isUsingFallback = false;
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
