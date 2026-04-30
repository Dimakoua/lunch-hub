import React, { useEffect, useState, useRef } from 'react';
import { X, Share, PlusSquare } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallPWAProps {
  currentPath: string;
}

export const InstallPWA: React.FC<InstallPWAProps> = ({ currentPath }) => {
  const [showAndroidPrompt, setShowAndroidPrompt] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [hasSpentTime, setHasSpentTime] = useState(false);
  const [pageVisits, setPageVisits] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    const visits = sessionStorage.getItem('lunchhub-page-visits');
    return visits ? Number(visits) : 0;
  });
  const [isIOS, setIsIOS] = useState(false);
  const lastPathRef = useRef(currentPath);
  const timerRef = useRef<number | null>(null);
  const androidTimerRef = useRef<number | null>(null);
  const iosTimerRef = useRef<number | null>(null);

  const canPrompt = currentPath === '/' && (hasSpentTime || pageVisits >= 2);

  // Debug logging
  React.useEffect(() => {
    console.log('[InstallPWA Init]', {
      currentPath,
      canPrompt,
      hasSpentTime,
      pageVisits,
      isIOS
    });
  }, [currentPath, canPrompt, hasSpentTime, pageVisits, isIOS]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return;

    const ua = window.navigator.userAgent;
    const isIosDevice = /iPhone|iPad|iPod/.test(ua);
    setIsIOS(isIosDevice);

    const storedVisits = sessionStorage.getItem('lunchhub-page-visits');
    setPageVisits(storedVisits ? Number(storedVisits) : 0);

    timerRef.current = window.setTimeout(() => setHasSpentTime(true), 10000);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (androidTimerRef.current) window.clearTimeout(androidTimerRef.current);
      if (iosTimerRef.current) window.clearTimeout(iosTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (currentPath !== lastPathRef.current) {
      lastPathRef.current = currentPath;
      setPageVisits((prev) => {
        const next = prev + 1;
        sessionStorage.setItem('lunchhub-page-visits', String(next));
        return next;
      });
    }
  }, [currentPath]);

  useEffect(() => {
    if (!isIOS || showIOSPrompt) return;
    const hasPrompted = localStorage.getItem('iosInstallPrompted');
    if (hasPrompted || !canPrompt) return;

    iosTimerRef.current = window.setTimeout(() => setShowIOSPrompt(true), 3000);
    return () => {
      if (iosTimerRef.current) window.clearTimeout(iosTimerRef.current);
    };
  }, [isIOS, canPrompt, showIOSPrompt]);

  useEffect(() => {
    if (!deferredPrompt || showAndroidPrompt) return;
    const hasPrompted = localStorage.getItem('androidInstallPrompted');
    
    console.log('[InstallPWA Android Prompt]', {
      deferredPrompt: !!deferredPrompt,
      canPrompt,
      hasPrompted,
      pageVisits,
      hasSpentTime
    });
    
    if (hasPrompted || !canPrompt) return;

    androidTimerRef.current = window.setTimeout(() => {
      console.log('[InstallPWA] Showing Android prompt');
      setShowAndroidPrompt(true);
    }, 3000);
    return () => {
      if (androidTimerRef.current) window.clearTimeout(androidTimerRef.current);
    };
  }, [deferredPrompt, canPrompt, showAndroidPrompt]);

  useEffect(() => {
    if (!canPrompt) {
      setShowAndroidPrompt(false);
      setShowIOSPrompt(false);
    }
  }, [canPrompt]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('[InstallPWA] Listening for beforeinstallprompt event');

    const handler = (e: Event) => {
      console.log('[InstallPWA] beforeinstallprompt event fired!');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
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
      <div className="fixed bottom-20 left-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 z-[2001] animate-slide-up lg:bottom-6">
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
      <div className="fixed bottom-20 left-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 z-[2001] animate-slide-up lg:bottom-6">
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
