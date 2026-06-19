import { announce } from '../utils/announce';
import { AnnouncementType } from './announcementService';

export interface ToastItem {
  id: string;
  message: string;
  type: AnnouncementType;
  duration?: number;
}

type ToastListener = (toasts: ToastItem[]) => void;
const listeners = new Set<ToastListener>();
let activeToasts: ToastItem[] = [];

const notify = () => {
  listeners.forEach((listener) => listener([...activeToasts]));
};

/**
 * Custom lightweight visual toast system.
 * Automatically integrates with the screen reader announcement system.
 */
export const toast = {
  success(message: string, duration = 4000) {
    this.add(message, 'success', duration);
  },
  error(message: string, duration = 5000) {
    this.add(message, 'error', duration);
  },
  warning(message: string, duration = 4000) {
    this.add(message, 'warning', duration);
  },
  info(message: string, duration = 4000) {
    this.add(message, 'info', duration);
  },

  add(message: string, type: AnnouncementType, duration = 4000) {
    if (typeof window === 'undefined') return;

    const id = Math.random().toString(36).substring(2, 9);
    const item: ToastItem = { id, message, type, duration };
    activeToasts.push(item);
    notify();

    // Automatically trigger screen reader announcement (polite or assertive based on type)
    announce(message, type);

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }
  },

  dismiss(id: string) {
    activeToasts = activeToasts.filter((t) => t.id !== id);
    notify();
  },

  subscribe(listener: ToastListener) {
    listeners.add(listener);
    listener([...activeToasts]);
    return () => {
      listeners.delete(listener);
    };
  },
};
export type { AnnouncementType };
export type Toast = typeof toast;
