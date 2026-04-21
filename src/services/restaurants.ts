import { Restaurant } from '../types/restaurant';
import { cacheService } from './cache';
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
  const cacheKey = cacheService.generateKey(lat, lon, radius);
  
  if (!forceRefresh) {
    const cachedData = cacheService.get<Restaurant[]>(cacheKey);
    if (cachedData) {
      return cachedData;
    }
  }

  try {
    // Convert radius from meters to degrees (approximate) for bounding box
    // This is a rough estimate for the Overpass API query to get a superset of results
    const radiusDegrees = radius / 111000; 
    
    const overpassQuery = `
      [out:json][timeout:120];
      (
        node["amenity"~"^(restaurant|fast_food|cafe|pub|bar|food_court)$"]
          (${lat - radiusDegrees},${lon - radiusDegrees},${lat + radiusDegrees},${lon + radiusDegrees});
      );
      out meta 100;
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

        return {
          id: element.id.toString(),
          name: element.tags.name || 'Unknown',
          lat: restaurantLat,
          lon: restaurantLon,
          cuisine: element.tags.cuisine || element.tags['cuisine:en'],
          address: formatAddress(element.tags),
          phone: element.tags.phone,
          website: element.tags.website,
          opening_hours: element.tags.opening_hours,
          amenity: element.tags.amenity,
        };
      })
      .filter((r): r is Restaurant => r !== null);

    // Filter restaurants to be strictly within the circular radius
    const filteredRestaurants = restaurants.filter(restaurant => {
      const distance = haversineDistance(lat, lon, restaurant.lat, restaurant.lon);
      return distance <= radius;
    });

    // Cache the result for 5 days to keep geo search results available
    cacheService.set(cacheKey, filteredRestaurants, CACHE_TTL_LONG);

    return filteredRestaurants;
  } catch (error) {
    console.error('Error fetching restaurants:', error);
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