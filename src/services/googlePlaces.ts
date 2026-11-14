import { cacheService } from './cache';
import { markGoogleQuotaExceeded } from './quotaState';

export interface GooglePlaceReview {
  author: string;
  rating?: number;
  relativeTime?: string;
  text?: string;
}

export interface GooglePlaceDetails {
  placeId: string;
  name?: string;
  rating?: number;
  userRatingsTotal?: number;
  formattedAddress?: string;
  priceLevel?: number;
  website?: string;
  phoneNumber?: string;
  googleMapsUrl?: string;
  editorialSummary?: string;
  serviceOptions?: {
    dineIn?: boolean;
    takeout?: boolean;
    delivery?: boolean;
  };
  openNow?: boolean;
  weekdayText?: string[];
  photoUrls?: string[];
  reviews?: GooglePlaceReview[];
}

const CLIENT_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Search for a restaurant via the worker's cached Google Places proxy.
 * Returns null if Google Maps API is not configured on the worker.
 */
export async function searchGooglePlace(
  query: string,
  lat?: number,
  lng?: number
): Promise<{ placeId: string; rating?: number; userRatingsTotal?: number; photoRef?: string } | null> {
  const cacheKey = `gplace_search:${query}:${lat?.toFixed(3) ?? ''}:${lng?.toFixed(3) ?? ''}`;
  const cached = cacheService.get<{ placeId: string; rating?: number; userRatingsTotal?: number; photoRef?: string }>(cacheKey);
  if (cached) return cached;

  try {
    const params = new URLSearchParams({ query });
    if (lat !== undefined && lng !== undefined) {
      params.set('lat', String(lat));
      params.set('lng', String(lng));
    }
    const res = await fetch(`/api/places/search?${params.toString()}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.quotaExceeded) markGoogleQuotaExceeded();
    if (!data || data.configured === false || !data.placeId) return null;

    cacheService.set(cacheKey, data, CLIENT_CACHE_TTL_MS);
    return data;
  } catch {
    return null;
  }
}

/**
 * Fetch detailed place info via the worker's cached Google Places proxy.
 */
export async function getGooglePlaceDetails(placeId: string): Promise<GooglePlaceDetails | null> {
  const cacheKey = `gplace_details:${placeId}`;
  const cached = cacheService.get<GooglePlaceDetails>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(`/api/places/details?placeId=${encodeURIComponent(placeId)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.quotaExceeded) markGoogleQuotaExceeded();
    if (!data || data.configured === false || !data.placeId) return null;

    cacheService.set(cacheKey, data, CLIENT_CACHE_TTL_MS);
    return data;
  } catch {
    return null;
  }
}

const EXCLUDED_CUISINE_TYPES = new Set([
  'grocery store',
  'supermarket',
  'convenience store',
  'department store',
  'shopping mall',
  'gas station',
  'liquor store',
  'drugstore',
  'pharmacy',
  'store',
]);

export async function fetchNearbyGooglePlaces(
  lat: number,
  lng: number,
  radius: number
): Promise<Array<{ id: string; name: string; lat: number; lon: number; address?: string; cuisine?: string; amenity?: string }>> {
  const cacheKey = `gplace_nearby:v2:${lat.toFixed(3)}:${lng.toFixed(3)}:${Math.round(radius / 100) * 100}`;
  const cached = cacheService.get<Array<{ id: string; name: string; lat: number; lon: number; address?: string; cuisine?: string; amenity?: string }>>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(
      `/api/places/nearby?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&radius=${encodeURIComponent(radius)}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (data?.quotaExceeded) markGoogleQuotaExceeded();
    if (!data || !Array.isArray(data.places) || data.places.length === 0) return [];

    const filtered = data.places.filter(
      (p: { cuisine?: string }) => !p.cuisine || !EXCLUDED_CUISINE_TYPES.has(p.cuisine.toLowerCase())
    );
    if (filtered.length > 0) {
      cacheService.set(cacheKey, filtered, CLIENT_CACHE_TTL_MS);
    }
    return filtered;
  } catch {
    return [];
  }
}
