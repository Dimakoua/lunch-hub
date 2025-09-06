// Google Analytics configuration and GDPR-compliant tracking

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

// Replace with your actual Google Analytics ID
const GA_TRACKING_ID = 'G-XXXXXXX';

export const initializeGoogleAnalytics = () => {
  // Check if user has consented
  const consent = localStorage.getItem('cookie-consent');
  if (consent !== 'accepted') {
    return;
  }

  // Check if already loaded
  if (window.gtag) {
    return;
  }

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };

  // Load Google Analytics script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
  document.head.appendChild(script);

  // Configure Google Analytics
  window.gtag('js', new Date());
  window.gtag('config', GA_TRACKING_ID, {
    anonymize_ip: true, // Anonymize IP addresses for GDPR compliance
    allow_google_signals: false, // Disable Google Signals for privacy
    allow_ad_personalization_signals: false, // Disable ad personalization
  });

  console.log('Google Analytics initialized with GDPR compliance');
};

export const disableGoogleAnalytics = () => {
  // Disable Google Analytics tracking
  if (window.gtag) {
    window.gtag('consent', 'update', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
    });
  }

  // Set the disable flag
  (window as any)[`ga-disable-${GA_TRACKING_ID}`] = true;

  console.log('Google Analytics disabled due to user consent');
};

// Track page views (only if consent given)
export const trackPageView = (path: string, title?: string) => {
  const consent = localStorage.getItem('cookie-consent');
  if (consent !== 'accepted' || !window.gtag) {
    return;
  }

  window.gtag('config', GA_TRACKING_ID, {
    page_path: path,
    page_title: title,
  });
};

// Track custom events (only if consent given)
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  const consent = localStorage.getItem('cookie-consent');
  if (consent !== 'accepted' || !window.gtag) {
    return;
  }

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// Common tracking events for the restaurant app
export const trackRestaurantSearch = (location: string, resultsCount: number) => {
  trackEvent('search', 'restaurant', location, resultsCount);
};

export const trackRestaurantView = (restaurantName: string, viewMode: string) => {
  trackEvent('view_restaurant', 'restaurant', `${restaurantName} - ${viewMode}`);
};

export const trackSpinWheel = (restaurantName: string) => {
  trackEvent('spin_wheel', 'engagement', restaurantName);
};

export const trackRandomPick = (restaurantName: string) => {
  trackEvent('random_pick', 'engagement', restaurantName);
};

export const trackLocationPermission = (granted: boolean) => {
  trackEvent('location_permission', 'user_interaction', granted ? 'granted' : 'denied');
};