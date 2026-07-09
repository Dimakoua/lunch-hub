import React, { useEffect, useRef, useState } from 'react';
import { X, Share2, Download, Copy, Check } from 'lucide-react';
import { Restaurant } from '../types/restaurant';
import { renderShareCardToCanvas, shareRestaurantCard, downloadRestaurantCard } from '../utils/canvasShareCard';

interface ShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: Restaurant | null;
}

export const ShareCardModal: React.FC<ShareCardModalProps> = ({ isOpen, onClose, restaurant }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareSupported, setShareSupported] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      setShareSupported(true);
    }
  }, []);

  useEffect(() => {
    if (isOpen && restaurant && canvasRef.current) {
      renderShareCardToCanvas(canvasRef.current, restaurant);
    }
  }, [isOpen, restaurant]);

  if (!isOpen || !restaurant) return null;

  const handleShare = async () => {
    const shared = await shareRestaurantCard(restaurant);
    if (!shared) {
      // Fallback: Copy info
      handleCopyLink();
    }
  };

  const handleDownload = () => {
    downloadRestaurantCard(restaurant);
  };

  const handleCopyLink = async () => {
    try {
      const shareText = `Check out this lunch spot: ${restaurant.name} - ${restaurant.address || ''}. Find your next meal at ${window.location.origin}`;
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-dark-border flex items-center justify-between flex-shrink-0">
          <h3 className="text-lg font-bold text-slate-900 dark:text-dark-text">Share Lunch Spot</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-400 hover:text-slate-600 dark:hover:text-dark-text transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex flex-col items-center gap-6">
          <p className="text-sm text-slate-500 dark:text-dark-text-secondary text-center">
            Here is your custom lunch decision card! Share it directly with your friends or download it to post in your group channels.
          </p>

          {/* Canvas Preview */}
          <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-square rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-dark-border">
            <canvas
              ref={canvasRef}
              className="w-full h-full object-contain bg-slate-950"
              style={{ display: 'block' }}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-5 border-t border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-card/50 flex flex-col gap-3 flex-shrink-0">
          <div className="flex gap-3">
            {shareSupported ? (
              <button
                onClick={handleShare}
                className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition flex items-center justify-center gap-2 shadow-sm hover:scale-[1.02] active:scale-[0.98]"
              >
                <Share2 className="w-4 h-4" />
                Share Card
              </button>
            ) : (
              <button
                onClick={handleCopyLink}
                className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition flex items-center justify-center gap-2 shadow-sm hover:scale-[1.02] active:scale-[0.98]"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied Details!' : 'Copy Info'}
              </button>
            )}

            <button
              onClick={handleDownload}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-dark-border text-slate-700 dark:text-dark-text hover:bg-slate-50 dark:hover:bg-gray-800 font-bold text-sm transition flex items-center justify-center gap-2 shadow-sm hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="w-4 h-4" />
              Download PNG
            </button>
          </div>

          {shareSupported && (
            <button
              onClick={handleCopyLink}
              className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-dark-border text-slate-500 dark:text-dark-text-secondary hover:text-slate-700 dark:hover:text-dark-text text-xs font-semibold transition flex items-center justify-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied Details!' : 'Copy Restaurant Details'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
