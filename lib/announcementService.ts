export type AnnouncementType = 'success' | 'error' | 'warning' | 'info';

export interface Announcement {
  id: string;
  message: string;
  type: AnnouncementType;
  timestamp: number;
}

type AnnouncementListener = (announcement: Announcement) => void;

class AnnouncementService {
  private listeners = new Set<AnnouncementListener>();
  private lastMessage = '';
  private lastType: AnnouncementType | null = null;
  private lastTimestamp = 0;

  /**
   * Sends an announcement to the screen reader.
   * Prevents rapid duplicated announcements of the same type and message within 1 second.
   */
  announce(message: string, type: AnnouncementType = 'info') {
    if (typeof window === 'undefined') return;

    const trimmed = message.trim();
    if (!trimmed) return;

    const now = Date.now();
    // Deduplication check
    if (
      this.lastMessage === trimmed &&
      this.lastType === type &&
      now - this.lastTimestamp < 1000
    ) {
      return;
    }

    this.lastMessage = trimmed;
    this.lastType = type;
    this.lastTimestamp = now;

    const announcement: Announcement = {
      id: Math.random().toString(36).substring(2, 9),
      message: trimmed,
      type,
      timestamp: now,
    };

    this.listeners.forEach((listener) => {
      try {
        listener(announcement);
      } catch (err) {
        console.error('Error in announcement listener:', err);
      }
    });
  }

  /**
   * Subscribe to announcements.
   * Returns an unsubscribe function.
   */
  subscribe(listener: AnnouncementListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const announcementService = new AnnouncementService();
