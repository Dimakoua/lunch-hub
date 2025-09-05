export const fetchRoute = async (
  start: [number, number],
  end: [number, number]
): Promise<{ geometry: any; duration: number } | null> => {
  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/walking/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`
    );
    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      return {
        geometry: data.routes[0].geometry,
        duration: estimateWalkingDuration(data.routes[0].distance),
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching route:", error);
    return null;
  }
};

function estimateWalkingDuration(
  distanceMeters: number,
  speedKmh: number = 5
): number {
  if (distanceMeters < 0) {
    throw new Error("Distance cannot be negative");
  }
  if (speedKmh <= 0) {
    throw new Error("Speed must be greater than zero");
  }

  const speedMps = (speedKmh * 1000) / 3600; // convert km/h → m/s
  return distanceMeters / speedMps; // seconds
}