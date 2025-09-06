import React, { useState, useEffect } from 'react';
import { Cookie, X, Shield, Eye } from 'lucide-react';

interface CookieConsentProps {
  onAccept: () => void;
  onDecline: () => void;
}

export const CookieConsent: React.FC<CookieConsentProps> = ({ onAccept, onDecline }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // Show popup after a short delay for better UX
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

  const handleClose = () => {
    // Treat close as decline
    handleDecline();
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center p-4">
        {/* Cookie Consent Modal */}
        <div className="bg-white dark:bg-dark-card rounded-xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-dark-border animate-slide-up">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <Cookie className="w-5 h-5 text-blue-600 dark:text-dark-primary" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-dark-text">
                  Cookie Consent
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-dark-text-secondary" />
              </button>
            </div>

            {/* Content */}
            <div className="mb-6">
              <p className="text-gray-600 dark:text-dark-text-secondary text-sm mb-3">
                We use cookies and similar technologies to improve your experience and analyze website traffic. 
                This helps us understand how you use our service and improve it.
              </p>

              {showDetails && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-3 text-sm">
                  <h4 className="font-semibold text-gray-900 dark:text-dark-text mb-2">
                    What data do we collect?
                  </h4>
                  <ul className="text-gray-600 dark:text-dark-text-secondary space-y-1 text-xs">
                    <li>• Page views and user interactions</li>
                    <li>• Device and browser information</li>
                    <li>• General location (country/city level)</li>
                    <li>• Referral sources</li>
                  </ul>
                  <p className="text-gray-600 dark:text-dark-text-secondary mt-2 text-xs">
                    We do not collect personal information or track individual users across websites.
                  </p>
                </div>
              )}

              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-blue-600 dark:text-dark-primary text-sm hover:underline flex items-center gap-1"
              >
                <Eye className="w-4 h-4" />
                {showDetails ? 'Hide details' : 'Show details'}
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleDecline}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text-secondary rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 font-medium"
              >
                Decline
              </button>
              <button
                onClick={handleAccept}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-dark-primary dark:hover:bg-orange-600 text-white rounded-lg transition-colors duration-200 font-medium"
              >
                Accept
              </button>
            </div>

            {/* Privacy Notice */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-border">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-dark-text-secondary">
                <Shield className="w-3 h-3" />
                <span>GDPR compliant • Your privacy matters</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
};