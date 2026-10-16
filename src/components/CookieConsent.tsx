import React, { useState, useEffect } from 'react';
import { Cookie, X } from 'lucide-react';

interface CookieConsentProps {
  onAccept: () => void;
  onDecline: () => void;
}

export const CookieConsent: React.FC<CookieConsentProps> = ({ onAccept, onDecline }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setIsVisible(false);
    onAccept();
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setIsVisible(false);
    onDecline();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[9999] bg-white/95 dark:bg-dark-card/95 backdrop-blur-md border-t border-gray-200 dark:border-dark-border shadow-xl px-4 py-3 animate-slide-up">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2.5 text-gray-700 dark:text-dark-text">
          <Cookie className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span>
            We use cookies to analyze traffic &amp; improve your experience. No personal tracking.
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end">
          <button
            onClick={handleDecline}
            className="px-3 py-1.5 text-xs text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-dark-text border border-gray-300 dark:border-dark-border rounded-lg transition-colors"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
          >
            Accept
          </button>
          <button
            onClick={handleDecline}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-dark-text rounded-full"
            aria-label="Close cookie consent"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
