'use client';

import React, { useEffect, useState } from 'react';
import { toast, ToastItem } from '../../lib/toast';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

/**
 * Beautiful, floating glassmorphic visual notification stack.
 * Rendered at the root level of the application.
 */
export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    // Subscribe to toast additions/removals
    return toast.subscribe((newToasts) => {
      setToasts(newToasts);
    });
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none"
      aria-hidden="true" // Hide from assistive technology to prevent double narration
    >
      {toasts.map((item) => {
        let bgClass = '';
        let borderClass = '';
        let iconColor = '';
        let IconComponent = Info;

        switch (item.type) {
          case 'success':
            bgClass = 'bg-emerald-50/95 dark:bg-emerald-950/95';
            borderClass = 'border-emerald-200/50 dark:border-emerald-800/50';
            iconColor = 'text-emerald-500';
            IconComponent = CheckCircle2;
            break;
          case 'error':
            bgClass = 'bg-red-50/95 dark:bg-red-950/95';
            borderClass = 'border-red-200/50 dark:border-red-800/50';
            iconColor = 'text-red-500';
            IconComponent = AlertCircle;
            break;
          case 'warning':
            bgClass = 'bg-amber-50/95 dark:bg-amber-950/95';
            borderClass = 'border-amber-200/50 dark:border-amber-800/50';
            iconColor = 'text-amber-500';
            IconComponent = AlertTriangle;
            break;
          case 'info':
          default:
            bgClass = 'bg-sky-50/95 dark:bg-sky-950/95';
            borderClass = 'border-sky-200/50 dark:border-sky-800/50';
            iconColor = 'text-sky-500';
            IconComponent = Info;
            break;
        }

        return (
          <div
            key={item.id}
            className={`flex items-start gap-3 p-4 rounded-2xl border shadow-xl backdrop-blur-md pointer-events-auto transition-all duration-300 ${bgClass} ${borderClass}`}
            style={{
              animation: 'toastSlideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            }}
          >
            <IconComponent className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                {item.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => toast.dismiss(item.id)}
              className="p-1 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-lg transition-colors flex-shrink-0"
              tabIndex={-1} // Avoid cluttering keyboard tab order (toasts automatically disappear)
            >
              <X className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" />
            </button>
          </div>
        );
      })}

      <style jsx global>{`
        @keyframes toastSlideInRight {
          from {
            transform: translateX(120%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};
export default ToastContainer;
