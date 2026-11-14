import {
  searchGooglePlace,
  getGooglePlaceDetails,
  type GooglePlaceDetails,
} from './googlePlaces';
import { isGoogleQuotaExceeded } from './quotaState';

export type MapProviderType = 'leaflet' | 'google';

export interface MapProvider {
  readonly type: MapProviderType;
  readonly displayName: string;
  isAvailable(): boolean;
  getDirectionsUrl(lat: number, lon: number, label?: string): string;
  getAttribution(): string;
  getTileUrl(): string;
  searchPlace(query: string, lat?: number, lng?: number): Promise<{ placeId: string; rating?: number; userRatingsTotal?: number; photoRef?: string } | null>;
  getPlaceDetails(placeId: string): Promise<GooglePlaceDetails | null>;
}

class LeafletMapProvider implements MapProvider {
  readonly type: MapProviderType = 'leaflet';
  readonly displayName = 'OpenStreetMap (Leaflet)';

  isAvailable(): boolean {
    return true;
  }

  getDirectionsUrl(lat: number, lon: number, label?: string): string {
    const query = label ? `${lat},${lon} (${encodeURIComponent(label)})` : `${lat},${lon}`;
    return `https://www.openstreetmap.org/directions?to=${query}`;
  }

  getAttribution(): string {
    return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  }

  getTileUrl(): string {
    return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  }

  async searchPlace(): Promise<null> {
    return null;
  }

  async getPlaceDetails(): Promise<null> {
    return null;
  }
}

class GoogleMapProvider implements MapProvider {
  readonly type: MapProviderType = 'google';
  readonly displayName = 'Google Maps';

  isAvailable(): boolean {
    return import.meta.env.VITE_MAP_PROVIDER !== 'leaflet' && !isGoogleQuotaExceeded();
  }

  getDirectionsUrl(lat: number, lon: number, label?: string): string {
    const destination = label ? `${encodeURIComponent(label)}@${lat},${lon}` : `${lat},${lon}`;
    return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
  }

  getAttribution(): string {
    return 'Map data &copy; Google';
  }

  getTileUrl(): string {
    return 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
  }

  searchPlace(query: string, lat?: number, lng?: number) {
    return searchGooglePlace(query, lat, lng);
  }

  getPlaceDetails(placeId: string) {
    return getGooglePlaceDetails(placeId);
  }
}

const PROVIDERS: Record<MapProviderType, () => MapProvider> = {
  leaflet: () => new LeafletMapProvider(),
  google: () => new GoogleMapProvider(),
};

/**
 * Factory for creating a map provider strategy.
 * Falls back to Leaflet if the requested provider is unavailable.
 */
export function createMapProvider(preferred?: MapProviderType): MapProvider {
  const target: MapProviderType =
    preferred ??
    (import.meta.env.VITE_MAP_PROVIDER === 'leaflet' ? 'leaflet' : 'google');

  const provider = PROVIDERS[target]();
  if (!provider.isAvailable()) {
    return PROVIDERS.leaflet();
  }
  return provider;
}
