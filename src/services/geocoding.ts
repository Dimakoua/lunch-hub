import { cacheService } from './cache';
import { CACHE_TTL_LONG } from '../constants';

export const geocodeAddress = async (address: string) => {
  const cacheKey = cacheService.generateKey('geocode', address);
  const cached = cacheService.get<{ lat: number; lon: number; display_name: string }>(cacheKey);
  
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
    );
    const data = await response.json();
    
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
  
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
    );
    const data = await response.json();
    
    return data.map((item: any) => ({
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

export const getCurrentLocation = (): Promise<{ lat: number; lon: number }> => {
  const cacheKey = cacheService.generateKey('currentLocation');
  const cached = cacheService.get<{ lat: number; lon: number }>(cacheKey);
  if (cached) {
    return Promise.resolve(cached);
  }

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
        // Cache detected location so repeated "detect" clicks use cached coords
        cacheService.set(cacheKey, result, CACHE_TTL_LONG);
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