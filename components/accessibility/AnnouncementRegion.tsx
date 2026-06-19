'use client';

import React from 'react';

interface AnnouncementRegionProps {
  politeMessage: string;
  assertiveMessage: string;
}

/**
 * Invisible live region for screen readers.
 * Uses separate polite/assertive divs to ensure reliable announcements
 * across different screen readers and browsers without dynamic role/aria-live switching issues.
 */
export const AnnouncementRegion: React.FC<AnnouncementRegionProps> = ({
  politeMessage,
  assertiveMessage,
}) => {
  return (
    <>
      {/* Polite Live Region: Success, Information, and General Updates */}
      <div
        id="sr-announcer-polite"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: '0',
        }}
      >
        {politeMessage}
      </div>

      {/* Assertive Live Region: Errors and Critical Alerts */}
      <div
        id="sr-announcer-assertive"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: '0',
        }}
      >
        {assertiveMessage}
      </div>
    </>
  );
};
