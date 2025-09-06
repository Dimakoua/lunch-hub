import { Restaurant } from '../types/restaurant';

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
  radius: number = 1000
): Promise<Restaurant[]> => {
  try {
    // Convert radius from meters to degrees (approximate) for bounding box
    // This is a rough estimate for the Overpass API query to get a superset of results
    const radiusDegrees = radius / 111000; 
    
    const overpassQuery = `
      [out:json][timeout:25];
      (
        node["amenity"~"^(restaurant|fast_food|cafe|pub|bar|food_court|canteen)$"]
          (${lat - radiusDegrees},${lon - radiusDegrees},${lat + radiusDegrees},${lon + radiusDegrees});
        way["amenity"~"^(restaurant|fast_food|cafe|pub|bar|food_court)$"]
          (${lat - radiusDegrees},${lon - radiusDegrees},${lat + radiusDegrees},${lon + radiusDegrees});
        relation["amenity"~"^(restaurant|fast_food|cafe|pub|bar|food_court)$"]
          (${lat - radiusDegrees},${lon - radiusDegrees},${lat + radiusDegrees},${lon + radiusDegrees});
      );
      out center meta 100;
    `;

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: overpassQuery,
      headers: {
        'Content-Type': 'text/plain',
      },
    });

    const data = await response.json();
    
    const restaurants: Restaurant[] = data.elements
      .filter((element: any) => element.tags && element.tags.name)
      .map((element: any) => {
        const restaurantLat = element.lat || element.center?.lat;
        const restaurantLon = element.lon || element.center?.lon;
        
        if (!restaurantLat || !restaurantLon) return null;

        return {
          id: element.id.toString(),
          name: element.tags.name,
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
      .filter(Boolean);

    // Filter restaurants to be strictly within the circular radius
    const filteredRestaurants = restaurants.filter(restaurant => {
      if (!restaurant) return false; // Should not happen with previous filter(Boolean), but for safety
      const distance = haversineDistance(lat, lon, restaurant.lat, restaurant.lon);
      return distance <= radius;
    });

    return filteredRestaurants;
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    return [];
  }
};

const formatAddress = (tags: any): string => {
  const parts = [
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:city'],
    tags['addr:postcode']
  ].filter(Boolean);
  
  return parts.length > 0 ? parts.join(', ') : 'Address not available';
};