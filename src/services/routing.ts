import { cacheService } from './cache';
import { CACHE_TTL_LONG } from '../constants';

export const fetchRoute = async (
  start: [number, number],
  end: [number, number]
): Promise<{ geometry: [number, number][]; duration: number; distance: number } | null> => {
  const cacheKey = cacheService.generateKey('route', start, end);
  const cachedData = cacheService.get<{ geometry: [number, number][]; duration: number; distance: number }>(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  try {
    // Using routing.openstreetmap.de which reliably supports the 'foot' (walking) profile
    const response = await fetch(
      `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`
    );
    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const geometry = route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]); // Convert [lon, lat] to [lat, lon]
      // Use the duration provided by the API (in seconds)
      const duration = route.duration;
      const distance = route.distance;

      const result = {
        geometry,
        duration,
        distance,
      };
      cacheService.set(cacheKey, result, CACHE_TTL_LONG);
      return result;
    }
    return null;
  } catch (error) {
    console.error("Error fetching route:", error);
    return null;
  }
};