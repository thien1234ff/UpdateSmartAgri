'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { announcementService, Announcement, AnnouncementType } from '../../lib/announcementService';
import { AnnouncementRegion } from './AnnouncementRegion';
import { toast } from '../../lib/toast';
import { speechManager } from '../../utils/accessibility/speechManager';

interface AccessibilityAnnouncementContextType {
  announce: (message: string, type?: AnnouncementType) => void;
}

const AccessibilityAnnouncementContext = createContext<AccessibilityAnnouncementContextType | undefined>(undefined);

export const AccessibilityAnnouncementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');
  
  const queueRef = useRef<Announcement[]>([]);
  const isProcessingRef = useRef(false);

  // Process the queued announcements sequentially
  const processQueue = useCallback(() => {
    if (isProcessingRef.current || queueRef.current.length === 0) {
      return;
    }

    isProcessingRef.current = true;
    const next = queueRef.current.shift()!;
    const isAssertive = next.type === 'error';

    if (isAssertive) {
      setAssertiveMessage('');
      setPoliteMessage('');
      // Use small timeout to allow screen readers to register DOM changes
      setTimeout(() => {
        setAssertiveMessage(next.message);
      }, 50);
    } else {
      setAssertiveMessage('');
      setPoliteMessage('');
      setTimeout(() => {
        setPoliteMessage(next.message);
      }, 50);
    }

    // Also speak using the built-in TTS speech assistant if enabled
    if (typeof window !== 'undefined') {
      const isTtsEnabled = localStorage.getItem('a11y_tts_enabled') !== 'false';
      if (isTtsEnabled && speechManager && typeof speechManager.speak === 'function') {
        speechManager.speak(next.message);
      }
    }

    // Keep the message in the DOM for 2.5 seconds, then clear and proceed
    setTimeout(() => {
      setPoliteMessage('');
      setAssertiveMessage('');
      isProcessingRef.current = false;
      processQueue();
    }, 2500);
  }, []);

  const announce = useCallback((message: string, type: AnnouncementType = 'info') => {
    announcementService.announce(message, type);
  }, []);

  useEffect(() => {
    // 1. Subscribe to the global announcement service
    const unsubscribe = announcementService.subscribe((announcement) => {
      queueRef.current.push(announcement);
      processQueue();
    });

    // 2. Handle Online / Offline network events
    const handleOnline = () => {
      toast.success("Kết nối mạng đã được khôi phục.");
    };
    const handleOffline = () => {
      toast.error("Mất kết nối mạng. Bạn đang ngoại tuyến.");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 3. Globally intercept fetch requests to catch connection errors and server failures (5xx)
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        if (!response.ok && response.status >= 500) {
          toast.error(`Lỗi máy chủ (${response.status}). Vui lòng thử lại sau.`);
        }
        return response;
      } catch (err) {
        toast.error("Lỗi kết nối mạng hoặc máy chủ không phản hồi.");
        throw err;
      }
    };

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.fetch = originalFetch; // Restore original fetch on unmount
    };
  }, [processQueue]);

  return (
    <AccessibilityAnnouncementContext.Provider value={{ announce }}>
      {children}
      <AnnouncementRegion politeMessage={politeMessage} assertiveMessage={assertiveMessage} />
    </AccessibilityAnnouncementContext.Provider>
  );
};

export const useAccessibilityAnnouncement = () => {
  const context = useContext(AccessibilityAnnouncementContext);
  if (!context) {
    throw new Error('useAccessibilityAnnouncement must be used within an AccessibilityAnnouncementProvider');
  }
  return context;
};
