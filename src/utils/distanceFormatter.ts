import i18n from '../i18n';

// Locales that use imperial units (miles/feet)
const IMPERIAL_LOCALES = ['en-US', 'en', 'en-GB'];

// Module-level override — set by the user's unit preference toggle
let _imperialOverride: boolean | null = null;

/**
 * Override the locale-based unit detection with an explicit user preference.
 * Pass null to fall back to locale detection.
 */
export const setImperialUnitsOverride = (v: boolean): void => {
  _imperialOverride = v;
};

/**
 * Detects if the current locale uses imperial units (miles/feet) or metric (km/m)
 */
export const shouldUseImperialUnits = (): boolean => {
  if (_imperialOverride !== null) return _imperialOverride;
  const language = i18n.language || 'en';
  // Check if current language is in imperial list or if locale starts with imperial prefix
  return IMPERIAL_LOCALES.some(locale => language.toLowerCase().startsWith(locale.toLowerCase())) 
    || navigator.language?.toLowerCase().startsWith('en-us');
};

/**
 * Format distance in meters to human-readable format based on locale
 * @param meters Distance in meters
 * @returns Formatted distance string
 */
export const formatDistance = (meters: number | null | undefined): string => {
  if (meters === null || meters === undefined) return 'N/A';
  
  const useImperial = shouldUseImperialUnits();
  
  if (useImperial) {
    // Convert to feet/miles
    const feet = meters * 3.28084;
    if (feet < 1000) {
      return `${Math.round(feet)} ft`;
    }
    const miles = feet / 5280;
    return `${miles.toFixed(1)} mi`;
  } else {
    // Metric: meters/kilometers
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    const km = meters / 1000;
    return `${km.toFixed(1)} km`;
  }
};

/**
 * Format walking time in meters to human-readable format
 * Assumes average walking speed of 1.4 m/s (5 km/h or 3.1 mph)
 */
export const formatWalkingTime = (meters: number): string => {
  const walkingSpeedMs = 1.4; // meters per second
  const seconds = meters / walkingSpeedMs;
  const mins = Math.max(1, Math.round(seconds / 60));
  return `${mins} ${mins === 1 ? 'min' : 'mins'}`;
};

/**
 * Format radius selector value (in meters) to display text based on locale
 */
export const formatRadiusOption = (meters: number): string => {
  const useImperial = shouldUseImperialUnits();
  
  if (useImperial) {
    // Convert to miles
    const miles = (meters / 1609.34).toFixed(1);
    return `${miles} mi`;
  } else {
    // Metric: kilometers
    const km = meters / 1000;
    return `${km} km`;
  }
};

/**
 * Convert radius display value back to meters
 * Used for radius selector options
 */
export const getRadiusOptionsInMeters = (): { value: number; label: string }[] => {
  const useImperial = shouldUseImperialUnits();
  
  if (useImperial) {
    return [
      { value: 1609, label: '1 mi' },      // ~1 mile
      { value: 3219, label: '2 mi' },      // ~2 miles
      { value: 8047, label: '5 mi' },      // ~5 miles
    ];
  } else {
    return [
      { value: 1000, label: '1 km' },
      { value: 2000, label: '2 km' },
      { value: 5000, label: '5 km' },
    ];
  }
};

/**
 * Calculate great-circle distance in meters between two coordinates.
 */
export const haversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dPhi = ((lat2 - lat1) * Math.PI) / 180;
  const dLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) * Math.sin(dLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};
