import { announcementService, AnnouncementType } from '../lib/announcementService';

/**
 * Global utility function to trigger a screen reader announcement.
 * Safe to call from anywhere (React components, regular JS files, etc.).
 * 
 * @param message The text content to be announced
 * @param type The type/severity of the announcement ('success' | 'error' | 'warning' | 'info')
 */
export function announce(message: string, type: AnnouncementType = 'info'): void {
  announcementService.announce(message, type);
}
