import { cacheService } from './cache';
import { CACHE_TTL_LONG } from '../constants';
import { createMapProvider } from './mapProvider';

export const fetchRoute = async (
  start: [number, number],
  end: [number, number]
): Promise<{ geometry: [number, number][]; duration: number; distance: number } | null> => {
  const providerType = createMapProvider().type;
  const cacheKey = cacheService.generateKey('route', providerType, start, end);
  const cachedData = cacheService.get<{ geometry: [number, number][]; duration: number; distance: number }>(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  // Try Google DirectionsService when Google Maps is active, fall back to OSM walking route if unavailable/denied
  if (providerType === 'google' && typeof google !== 'undefined' && google.maps?.DirectionsService) {
    try {
      const service = new google.maps.DirectionsService();
      const response = await service.route({
        origin: { lat: start[0], lng: start[1] },
        destination: { lat: end[0], lng: end[1] },
        travelMode: google.maps.TravelMode.WALKING,
      });

      const leg = response.routes?.[0]?.legs?.[0];
      const overviewPath = response.routes?.[0]?.overview_path;
      if (leg && overviewPath && overviewPath.length > 0) {
        const geometry: [number, number][] = overviewPath.map((pt) => [pt.lat(), pt.lng()]);
        const result = {
          geometry,
          duration: leg.duration?.value ?? 0,
          distance: leg.distance?.value ?? 0,
        };
        cacheService.set(cacheKey, result, CACHE_TTL_LONG);
        return result;
      }
    } catch (error) {
      console.warn('Google DirectionsService unavailable, falling back to OSM walking route:', error);
    }
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