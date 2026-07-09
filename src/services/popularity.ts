import { Restaurant } from '../types/restaurant';

export interface HeatPoint {
  lat: number;
  lon: number;
  intensity: number;
  restaurantId?: string;
  isSimulated?: boolean;
}

// Haversine distance helper
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export const reportRestaurantVisit = async (restaurant: Restaurant): Promise<void> => {
  try {
    await fetch('/api/popularity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        restaurantId: restaurant.id,
        lat: restaurant.lat,
        lon: restaurant.lon,
      }),
    });
  } catch (error) {
    console.error('Failed to report popularity check-in:', error);
  }
};

export const fetchPopularityData = async (
  userLat: number,
  userLon: number,
  loadedRestaurants: Restaurant[]
): Promise<HeatPoint[]> => {
  let livePoints: HeatPoint[] = [];

  // 1. Fetch live pings from Cloudflare KV
  try {
    const response = await fetch('/api/popularity');
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        livePoints = data.map((item: any) => ({
          lat: Number(item.lat),
          lon: Number(item.lon),
          intensity: Math.min(5, Number(item.count || 1)),
          restaurantId: item.restaurantId,
          isSimulated: false,
        }));
      }
    }
  } catch (error) {
    console.error('Failed to fetch live popularity data:', error);
  }

  // 2. Cold-Start Check: If fewer than 3 live coordinate coordinates are fetched, generate hybrid simulation
  if (livePoints.length < 3 && loadedRestaurants.length > 0) {
    const simulatedPoints: HeatPoint[] = [];
    const currentHour = new Date().getHours();

    // Group restaurants by spatial clusters (approx 150m grid)
    const grid: { [key: string]: Restaurant[] } = {};
    loadedRestaurants.forEach((r) => {
      const gridKey = `${(r.lat).toFixed(3)}_${(r.lon).toFixed(3)}`;
      if (!grid[gridKey]) grid[gridKey] = [];
      grid[gridKey].push(r);
    });

    // Generate hotspots for dense restaurant areas
    Object.keys(grid).forEach((key) => {
      const cluster = grid[key];
      if (cluster.length >= 2) {
        // Find cluster centroid
        const avgLat = cluster.reduce((sum, r) => sum + r.lat, 0) / cluster.length;
        const avgLon = cluster.reduce((sum, r) => sum + r.lon, 0) / cluster.length;

        // Base intensity is proportional to cluster density
        let intensity = Math.min(3, 1 + (cluster.length - 2) * 0.5);

        // Adjust based on time of day
        let hourMatches = 0;
        cluster.forEach((r) => {
          const cuisine = (r.cuisine || '').toLowerCase();
          const amenity = r.amenity.toLowerCase();

          if (currentHour >= 7 && currentHour < 11) {
            // Breakfast/Coffee hours
            if (cuisine.includes('coffee') || cuisine.includes('cafe') || cuisine.includes('bakery')) {
              hourMatches++;
            }
          } else if (currentHour >= 11 && currentHour < 15) {
            // Lunch rush peak hours
            if (amenity.includes('fast_food') || cuisine.includes('burger') || cuisine.includes('sandwich') || cuisine.includes('pizza')) {
              hourMatches++;
            }
          } else if (currentHour >= 17 && currentHour < 22) {
            // Dinner / drinks
            if (cuisine.includes('pub') || cuisine.includes('bar') || cuisine.includes('italian') || cuisine.includes('sushi')) {
              hourMatches++;
            }
          }
        });

        intensity += Math.min(2, hourMatches * 0.4);

        simulatedPoints.push({
          lat: avgLat,
          lon: avgLon,
          intensity,
          isSimulated: true,
        });
      }
    });

    // Return merged results, keeping simulated points farther from user to avoid clustering too close
    return [...livePoints, ...simulatedPoints].slice(0, 15);
  }

  return livePoints;
};
