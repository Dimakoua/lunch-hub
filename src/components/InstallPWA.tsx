import React, { useEffect, useState } from 'react';
import { X, Share, PlusSquare } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPWA: React.FC = () => {
  const [showAndroidPrompt, setShowAndroidPrompt] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Check if the app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return;

    const ua = window.navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/.test(ua);
    const isAndroid = /Android/.test(ua);

    // iOS logic
    if (isIOS) {
      const hasPrompted = localStorage.getItem('iosInstallPrompted');
      if (!hasPrompted) {
        // Show after a small delay to not overwhelm the user
        const timer = setTimeout(() => setShowIOSPrompt(true), 3000);
        return () => clearTimeout(timer);
      }
    }

    // Android/Chrome logic
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      const hasPrompted = localStorage.getItem('androidInstallPrompted');
      if (!hasPrompted) {
        // Show after a small delay
        setTimeout(() => setShowAndroidPrompt(true), 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowAndroidPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const closeAndroidPrompt = () => {
    setShowAndroidPrompt(false);
    localStorage.setItem('androidInstallPrompted', 'true');
  };

  const closeIOSPrompt = () => {
    setShowIOSPrompt(false);
    localStorage.setItem('iosInstallPrompted', 'true');
  };

  if (showAndroidPrompt) {
    return (
      <div className="fixed bottom-6 left-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 z-[100] animate-slide-up">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg">
              <PlusSquare className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">Install Lunch Hub</p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Add to home screen for quick access!</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAndroidInstall}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Install
            </button>
            <button
              onClick={closeAndroidPrompt}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showIOSPrompt) {
    return (
      <div className="fixed bottom-6 left-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 z-[100] animate-slide-up">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg">
                <PlusSquare className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <p className="font-semibold text-gray-900 dark:text-white">Install Lunch Hub</p>
            </div>
            <button
              onClick={closeIOSPrompt}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            <div className="flex items-center gap-2 flex-wrap">
              Tap <Share className="w-4 h-4 text-blue-500" /> and then <span className="font-semibold bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-800 dark:text-gray-200 whitespace-nowrap">Add to Home Screen</span> to install on your iPhone.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
