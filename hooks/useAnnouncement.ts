import { useCallback } from 'react';
import { announce } from '../utils/announce';
import { AnnouncementType } from '../lib/announcementService';

/**
 * Custom React hook for making screen reader announcements.
 * 
 * @returns { announce: (message: string, type: AnnouncementType) => void }
 * 
 * @example
 * const { announce } = useAnnouncement();
 * announce("Login successful", "success");
 */
export function useAnnouncement() {
  const announceMessage = useCallback((message: string, type: AnnouncementType = 'info') => {
    announce(message, type);
  }, []);

  return { announce: announceMessage };
}
