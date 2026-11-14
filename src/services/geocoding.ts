import { cacheService } from './cache';
import { CACHE_TTL_LONG } from '../constants';
import { createMapProvider } from './mapProvider';

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  importance: number;
}

export const geocodeAddress = async (address: string) => {
  const providerType = createMapProvider().type;
  const cacheKey = cacheService.generateKey('geocode', providerType, address);
  const cached = cacheService.get<{ lat: number; lon: number; display_name: string }>(cacheKey);
  
  if (cached) {
    return cached;
  }

  // Try Google Geocoder when Google Maps is active, fall back to Nominatim if unavailable/denied
  if (providerType === 'google' && typeof google !== 'undefined' && google.maps?.Geocoder) {
    try {
      const geocoder = new google.maps.Geocoder();
      const { results } = await geocoder.geocode({ address });
      if (results && results.length > 0) {
        const loc = results[0].geometry.location;
        const result = {
          lat: loc.lat(),
          lon: loc.lng(),
          display_name: results[0].formatted_address || address,
        };
        cacheService.set(cacheKey, result, CACHE_TTL_LONG);
        return result;
      }
    } catch (error) {
      console.warn('Google Geocoder unavailable, falling back to Nominatim:', error);
    }
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
    );
    const data = await response.json() as NominatimResult[];
    
    if (data.length > 0) {
      const result = {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        display_name: data[0].display_name
      };
      cacheService.set(cacheKey, result, CACHE_TTL_LONG);
      return result;
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

export const searchLocationSuggestions = async (query: string) => {
  if (query.length < 3) return [];

  if (createMapProvider().type === 'google') {
    if (typeof google === 'undefined' || !google.maps?.Geocoder) {
      return [];
    }
    try {
      const geocoder = new google.maps.Geocoder();
      const { results } = await geocoder.geocode({ address: query });
      return (results || []).slice(0, 5).map((item) => ({
        display_name: item.formatted_address,
        lat: item.geometry.location.lat(),
        lon: item.geometry.location.lng(),
        type: item.types?.[0] || 'geocode',
        importance: 1,
      }));
    } catch (error) {
      console.error('Google autocomplete error:', error);
      return [];
    }
  }
  
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
    );
    const data = await response.json() as NominatimResult[];
    
    return data.map((item) => ({
      display_name: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      type: item.type,
      importance: item.importance
    }));
  } catch (error) {
    console.error('Autocomplete error:', error);
    return [];
  }
};

const DOWNTOWN_TORONTO = { lat: 43.6487, lon: -79.3803, label: 'Downtown Core' };

export const getFastFallbackLocation = async (): Promise<{ lat: number; lon: number; label: string }> => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const hub = params.get('hub');
    if (hub) {
      if (hub.toLowerCase().includes('toronto')) {
        return { lat: 43.6487, lon: -79.3803, label: 'Downtown Toronto' };
      }
      if (hub.toLowerCase().includes('nyc') || hub.toLowerCase().includes('new-york')) {
        return { lat: 40.7128, lon: -74.0060, label: 'Downtown NYC' };
      }
      if (hub.toLowerCase().includes('chicago')) {
        return { lat: 41.8781, lon: -87.6298, label: 'Downtown Chicago' };
      }
    }
  }

  const ipPromise = (async () => {
    try {
      const res = await fetch('https://freeipapi.com/api/json');
      if (!res.ok) throw new Error('IP lookup failed');
      const data = await res.json();
      if (data && typeof data.latitude === 'number' && typeof data.longitude === 'number' && data.latitude !== 0) {
        return {
          lat: data.latitude,
          lon: data.longitude,
          label: data.cityName ? `${data.cityName} Area` : 'Downtown Core',
        };
      }
    } catch {
      // fallback
    }
    return DOWNTOWN_TORONTO;
  })();

  const timeoutPromise = new Promise<{ lat: number; lon: number; label: string }>((resolve) => {
    setTimeout(() => resolve(DOWNTOWN_TORONTO), 800);
  });

  return Promise.race([ipPromise, timeoutPromise]);
};

export const getCurrentLocation = (): Promise<{ lat: number; lon: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const result = {
          lat: position.coords.latitude,
          lon: position.coords.longitude
        };
        resolve(result);
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
};