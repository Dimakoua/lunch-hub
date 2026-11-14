import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export function useIsMobile(breakpointPx: number = 640): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < breakpointPx : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia(`(max-width: ${breakpointPx - 1}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [breakpointPx]);

  return isMobile;
}

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  ariaLabel?: string;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  open,
  onClose,
  title,
  ariaLabel,
  children,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragStartYRef = useRef<number | null>(null);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!open) {
      setDragOffsetY(0);
      setIsDragging(false);
      dragStartYRef.current = null;
    }
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  const finishDrag = () => {
    if (dragStartYRef.current === null) return;
    const shouldClose = dragOffsetY > 90;
    dragStartYRef.current = null;
    setIsDragging(false);
    setDragOffsetY(0);
    if (shouldClose) onClose();
  };

  return createPortal(
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 bg-black/30 backdrop-blur-[1px] z-[9999]"
      />
      <aside
        aria-label={ariaLabel || title || 'Panel'}
        style={
          dragOffsetY > 0
            ? {
                transform: `translateY(${dragOffsetY}px)`,
                transition: isDragging ? 'none' : 'transform 200ms ease-out',
              }
            : { transition: 'transform 200ms ease-out' }
        }
        className="fixed inset-x-0 bottom-0 max-h-[80dvh] pb-[env(safe-area-inset-bottom)] rounded-t-3xl z-[10000] bg-white dark:bg-gray-900 shadow-2xl border-t border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden"
      >
        {/* Drag handle + optional header */}
        <div
          onPointerDown={(e) => {
            if ((e.target as HTMLElement).closest('button')) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            dragStartYRef.current = e.clientY;
            setIsDragging(true);
          }}
          onPointerMove={(e) => {
            if (dragStartYRef.current === null) return;
            setDragOffsetY(Math.max(0, e.clientY - dragStartYRef.current));
          }}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
          className="shrink-0 touch-none cursor-grab active:cursor-grabbing bg-white/95 dark:bg-gray-900/95 border-b border-gray-100 dark:border-gray-800"
        >
          <div className="flex justify-center pt-2.5 pb-1">
            <div className="w-10 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
          </div>
          <div className="flex items-center justify-between px-4 pb-2.5">
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {title || ''}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close sheet"
              className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable content with pull-down-at-top swipe-to-close */}
        <div
          ref={scrollRef}
          onTouchStart={(e) => {
            if (scrollRef.current && scrollRef.current.scrollTop <= 0) {
              dragStartYRef.current = e.touches[0].clientY;
              setIsDragging(true);
            }
          }}
          onTouchMove={(e) => {
            if (dragStartYRef.current === null) return;
            const deltaY = e.touches[0].clientY - dragStartYRef.current;
            if (deltaY > 0) {
              setDragOffsetY(deltaY);
            } else {
              dragStartYRef.current = null;
              setDragOffsetY(0);
              setIsDragging(false);
            }
          }}
          onTouchEnd={finishDrag}
          className="flex-1 overflow-y-auto p-4"
        >
          {children}
        </div>
      </aside>
    </>,
    document.body
  );
};
