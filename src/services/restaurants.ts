import { Restaurant } from '../types/restaurant';
import { createMapProvider } from './mapProvider';
import { fetchNearbyGooglePlaces } from './googlePlaces';
import { isGoogleQuotaExceeded } from './quotaState';
import { cacheService } from './cache';
import { overlayDeals } from './deals';
import { CACHE_TTL_LONG, OVERPASS_ENDPOINTS } from '../constants';

interface OverpassTags {
  name?: string;
  cuisine?: string;
  'cuisine:en'?: string;
  phone?: string;
  website?: string;
  opening_hours?: string;
  amenity?: string;
  'addr:housenumber'?: string;
  'addr:street'?: string;
  'addr:city'?: string;
  'addr:postcode'?: string;
  [key: string]: string | undefined;
}

interface OverpassElement {
  id: number;
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: OverpassTags;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

// Haversine formula to calculate distance between two lat/lon points in meters
const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in metres
};

export const fetchRestaurants = async (
  lat: number,
  lon: number,
  radius: number = 1000,
  forceRefresh: boolean = false
): Promise<Restaurant[]> => {
  const providerType = createMapProvider().type;
  const cacheKey = cacheService.generateKey(providerType, lat, lon, radius);
  
  const filterAndOverlay = (rawRestaurants: Restaurant[]): Restaurant[] => {
    const withDeals = overlayDeals(rawRestaurants);
    return withDeals.filter((restaurant) => {
      const distance = haversineDistance(lat, lon, restaurant.lat, restaurant.lon);
      return distance <= radius;
    });
  };

  if (!forceRefresh) {
    const cachedData = cacheService.get<Restaurant[]>(cacheKey);
    if (cachedData) {
      return filterAndOverlay(cachedData);
    }
  }

  // When Google Maps is active, use ONLY Google Places API (unless quota is exceeded, then fall back to Overpass)
  if (providerType === 'google') {
    try {
      const googlePlaces = await fetchNearbyGooglePlaces(lat, lon, radius);
      if (!isGoogleQuotaExceeded()) {
        if (googlePlaces.length > 0) {
          cacheService.set(cacheKey, googlePlaces, CACHE_TTL_LONG);
        }
        return filterAndOverlay(googlePlaces);
      }
    } catch (error) {
      console.error('Error fetching Google Places:', error);
      if (!isGoogleQuotaExceeded()) {
        return [];
      }
    }
  }

  try {
    const safeRadius = Math.min(10000, Math.max(200, Math.round(radius)));
    const safeLat = Number(lat);
    const safeLon = Number(lon);
    if (!Number.isFinite(safeLat) || !Number.isFinite(safeLon)) {
      return [];
    }

    const overpassQuery = `
      [out:json][timeout:15];
      (
        nwr["amenity"~"^(restaurant|fast_food|cafe|pub|bar|food_court)$"]
          (around:${safeRadius},${safeLat},${safeLon});
      );
      out center body 120;
    `;

    let response;
    for (const url of OVERPASS_ENDPOINTS) {
      try {
        response = await fetch(url, {
          method: 'POST',
          body: overpassQuery,
          headers: {
            'Content-Type': 'text/plain',
          },
          signal: AbortSignal.timeout(12000),
        });
        if (response.ok) break;
      } catch {
        console.warn(`Failed to fetch from ${url}, trying next...`);
      }
    }

    if (!response || !response.ok) {
      throw new Error('All Overpass API endpoints failed');
    }

    const responseText = await response.text();
    
    let data: OverpassResponse;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error('Overpass API returned non-JSON response:', responseText);
      throw new Error('Failed to parse response from Overpass API');
    }
    
    const restaurants: Restaurant[] = (data.elements || [])
      .filter((element) => element.tags && element.tags.name)
      .map((element) => {
        const restaurantLat = element.lat || element.center?.lat;
        const restaurantLon = element.lon || element.center?.lon;
        
        if (!restaurantLat || !restaurantLon || !element.tags) return null;

        let osmImage: string | undefined = element.tags.image;
        if (!osmImage && element.tags.wikimedia_commons) {
          const file = element.tags.wikimedia_commons.replace(/^File:/i, '').trim();
          osmImage = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=800`;
        }

        const rawWebsite = element.tags.website;
        const safeWebsite = rawWebsite && (rawWebsite.startsWith('https://') || rawWebsite.startsWith('http://'))
          ? rawWebsite
          : undefined;

        return {
          id: element.id.toString(),
          name: element.tags.name || 'Unknown',
          lat: restaurantLat,
          lon: restaurantLon,
          cuisine: element.tags.cuisine || element.tags['cuisine:en'],
          address: formatAddress(element.tags),
          phone: element.tags.phone,
          website: safeWebsite,
          opening_hours: element.tags.opening_hours,
          amenity: element.tags.amenity || 'restaurant',
          takeaway: element.tags.takeaway,
          image: osmImage,
        };
      })
      .filter((r): r is Restaurant => r !== null);

    // Cache the raw restaurant list for 5 days so dynamic deal overlays remain fresh
    cacheService.set(cacheKey, restaurants, CACHE_TTL_LONG);

    return filterAndOverlay(restaurants);
  } catch (error) {
    console.error('Error fetching restaurants from Overpass:', error);
    return [];
  }
};

const formatAddress = (tags: OverpassTags): string => {
  const parts = [
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:city'],
    tags['addr:postcode']
  ].filter(Boolean);
  
  return parts.length > 0 ? parts.join(', ') : 'Address not available';
};