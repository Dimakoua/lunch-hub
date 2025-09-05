import { Restaurant } from '../types/restaurant';

export const fetchRestaurants = async (
  lat: number,
  lon: number,
  radius: number = 1000
): Promise<Restaurant[]> => {
  try {
    // Convert radius from meters to degrees (approximate)
    const radiusDegrees = radius / 111000;
    
    const overpassQuery = `
      [out:json][timeout:25];
      (
        node["amenity"~"^(restaurant|fast_food|cafe|pub|bar|food_court)$"]
          (${lat - radiusDegrees},${lon - radiusDegrees},${lat + radiusDegrees},${lon + radiusDegrees});
        way["amenity"~"^(restaurant|fast_food|cafe|pub|bar|food_court)$"]
          (${lat - radiusDegrees},${lon - radiusDegrees},${lat + radiusDegrees},${lon + radiusDegrees});
        relation["amenity"~"^(restaurant|fast_food|cafe|pub|bar|food_court)$"]
          (${lat - radiusDegrees},${lon - radiusDegrees},${lat + radiusDegrees},${lon + radiusDegrees});
      );
      out center meta 50;
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
        const lat = element.lat || element.center?.lat;
        const lon = element.lon || element.center?.lon;
        
        if (!lat || !lon) return null;

        return {
          id: element.id.toString(),
          name: element.tags.name,
          lat,
          lon,
          cuisine: element.tags.cuisine || element.tags['cuisine:en'],
          address: formatAddress(element.tags),
          phone: element.tags.phone,
          website: element.tags.website,
          opening_hours: element.tags.opening_hours,
          amenity: element.tags.amenity,
        };
      })
      .filter(Boolean);

    return restaurants;
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