// Google Analytics configuration and GDPR-compliant tracking

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

const GA_TRACKING_ID = 'G-2L6GKWNYFZ';

export const grantConsent = () => {
  if (!window.gtag) {
    return;
  }
  window.gtag('consent', 'update', {
    'ad_user_data': 'granted',
    'ad_personalization': 'granted',
    'ad_storage': 'granted',
    'analytics_storage': 'granted'
  });
  console.log('Google Analytics consent granted');
};

export const revokeConsent = () => {
  if (!window.gtag) {
    return;
  }
  window.gtag('consent', 'update', {
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'ad_storage': 'denied',
    'analytics_storage': 'denied'
  });
  console.log('Google Analytics consent revoked');
};

// Track page views (only if consent given)
export const trackPageView = (path: string, title?: string) => {
  if (!window.gtag) {
    return;
  }

  window.gtag('config', GA_TRACKING_ID, {
    page_path: path,
    page_title: title,
  });
};

// Track custom events (only if consent given)
export function trackEvent(action: string, categoryOrMetadata?: string | Record<string, any>, label?: string, value?: number) {
  console.log(`[Event Logged] ${action}:`, categoryOrMetadata);
  if (!window.gtag) {
    return;
  }

  if (typeof categoryOrMetadata === 'object' && categoryOrMetadata !== null) {
    window.gtag('event', action, categoryOrMetadata);
  } else {
    window.gtag('event', action, {
      event_category: categoryOrMetadata,
      event_label: label,
      value: value,
    });
  }
}

export const trackDirectionsClick = (restaurantName: string, lat: number, lon: number) => {
  trackEvent('directions_clicked', { restaurant_name: restaurantName, destination_lat: lat, destination_lon: lon });
};

export const trackReviewsClick = (restaurantName: string) => {
  trackEvent('reviews_clicked', { restaurant_name: restaurantName });
};

export const trackPollShare = (pollId: string) => {
  trackEvent('poll_shared', { poll_id: pollId });
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

export const trackLanguageChange = (language: string) => {
  trackEvent('language_change', 'user_interaction', language);
};

export const trackLanguageRedirect = (language: string) => {
  trackEvent('language_redirect', 'user_interaction', language);
};

export const trackThemeChange = (theme: string) => {
  trackEvent('theme_change', 'user_interaction', theme);
};
