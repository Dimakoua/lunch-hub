import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Tooltip, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Restaurant } from '../types/restaurant';
import { shareRestaurant } from '../utils/share';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
const fmtM = (m: number) => m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
const fmtWalk = (m: number) => { const mins = Math.max(1, Math.round(m / 80)); return `${mins} min`; };

interface MapViewProps {
  center: [number, number];
  restaurants: Restaurant[];
  selectedRestaurant?: Restaurant | null;
  onRestaurantSelected?: (restaurant: Restaurant | null) => void;
  onMarkVisited?: (restaurant: Restaurant) => void;
  onCenterDrag?: (lat: number, lon: number) => void;
  zoom?: number;
  routeGeometry?: [number, number][] | null;
  routeDistance: number | null;
  routeDuration: number | null;
  radius?: number;
  breadcrumbItems?: BreadcrumbItem[];
}

const MapController: React.FC<{ center: [number, number]; selectedRestaurant?: Restaurant | null; routeGeometry?: [number, number][] | null }> = ({ 
  center, 
  selectedRestaurant,
  routeGeometry
}) => {
  const map = useMap();

  useEffect(() => {
    if (selectedRestaurant) {
      map.setView([selectedRestaurant.lat, selectedRestaurant.lon], 16);
    }
  }, [selectedRestaurant, map]);

  useEffect(() => {
    const onRecenter = () => {
      try {
        map.setView(center, 15, { animate: true });
      } catch {
        // ignore
      }
    };

    const onFitRoute = (ev: Event) => {
      try {
        // Event detail may provide geometry; fall back to routeGeometry prop
        const detail = (ev as CustomEvent<[number, number][] | undefined>)?.detail;
        const geom = detail || routeGeometry;
        if (!geom || geom.length === 0) return;
        const bounds = L.latLngBounds(geom.map(([lat, lon]) => [lat, lon]));
        map.fitBounds(bounds, { padding: [40, 40] });
      } catch {
        // ignore
      }
    };

    window.addEventListener('lunchhub:recenter', onRecenter);
    window.addEventListener('lunchhub:fitRoute', onFitRoute as EventListener);

    return () => {
      window.removeEventListener('lunchhub:recenter', onRecenter);
      window.removeEventListener('lunchhub:fitRoute', onFitRoute as EventListener);
    };
  }, [map, center, routeGeometry]);

  return null;
};

export const MapView: React.FC<MapViewProps> = ({ 
  center, 
  restaurants, 
  selectedRestaurant,
  onRestaurantSelected,
  onMarkVisited,
  onCenterDrag,
  zoom = 13,
  radius,
  routeGeometry,
  routeDistance,
  routeDuration,
  breadcrumbItems,
}) => {
  const userIcon = L.divIcon({
    html: `<svg viewBox="0 0 24 24" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#2563EB"/><circle cx="12" cy="9.5" r="2.5" fill="white"/></svg>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  const restaurantIcon = L.divIcon({
    html: `<svg viewBox="0 0 24 24" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#10B981"/><circle cx="12" cy="9.5" r="2.5" fill="white"/></svg>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  const selectedIcon = L.divIcon({
    html: `<svg viewBox="0 0 24 24" width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#F59E0B"/><circle cx="12" cy="9.5" r="2.5" fill="white"/></svg>`,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });

  const formatDuration = (seconds: number | null | undefined) => {
    if (seconds === null || seconds === undefined) return 'N/A';
    const minutes = Math.round(seconds / 60);
    return `${minutes} ${minutes === 1 ? 'min' : 'mins'}`;
  };

  const formatDistance = (meters: number | null | undefined) => {
    if (meters === null || meters === undefined) return 'N/A';
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  return (
    <div className="relative w-full h-full">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        className="w-full h-full rounded-xl"
        zoomControl={false}
      >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      <MapController center={center} selectedRestaurant={selectedRestaurant} routeGeometry={routeGeometry} />

      {routeGeometry && (
        <Polyline 
          positions={routeGeometry} 
          color="#2563EB" 
          weight={5} 
          opacity={0.7} 
          dashArray="10, 10"
        />
      )}

      {/* User location marker */}
      <Marker
        position={center}
        icon={userIcon}
        draggable={true}
        eventHandlers={{
          dragend: (event: any) => {
            if (!onCenterDrag) {
              return;
            }
            const marker = event.target;
            const { lat, lng } = marker.getLatLng();
            onCenterDrag(lat, lng);
          },
        }}
      >
        <Tooltip permanent>
          Drag to move your pin
        </Tooltip>
        <Popup autoPan={false} closeOnClick={false}>
          <div className="text-center p-1">
            <strong className="text-sm">Drag this pin</strong>
            <p className="text-xs text-gray-500">Move to update nearby results</p>
          </div>
        </Popup>
      </Marker>

      {/* Restaurant markers */}
      {/* Radius Circle */}
      {radius && (
        <Circle 
          center={center} 
          radius={radius} 
          pathOptions={{ color: '#2563EB', fillColor: '#2563EB', fillOpacity: 0.1, weight: 2 }}
        />
      )}

      {/* Restaurant markers */}
      {restaurants.map((restaurant) => (
        <Marker
          key={restaurant.id}
          position={[restaurant.lat, restaurant.lon]}
          icon={selectedRestaurant?.id === restaurant.id ? selectedIcon : restaurantIcon}
          eventHandlers={{
            click: () => {
              if (onRestaurantSelected) {
                onRestaurantSelected(restaurant);
              }
            },
          }}
        >
          <Tooltip permanent={selectedRestaurant?.id === restaurant.id}>
            {restaurant.name}
          </Tooltip>
          <Popup className="custom-popup" autoPan={false} closeOnClick={false}>
            <div className="p-1 min-w-[150px] max-w-[200px]">
              <h3 className="font-bold text-sm text-gray-900 dark:text-dark-text mb-1">
                {restaurant.name}
              </h3>
              {restaurant.cuisine && (
                <span className="inline-block text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-400 px-1.5 py-0.5 rounded-full mb-1">
                  {restaurant.cuisine}
                </span>
              )}
              {/* <p className="text-xs text-gray-600 dark:text-dark-text-secondary mb-1 line-clamp-1">{restaurant.address}</p> */}

              {/* Distance row */}
              {(() => {
                const isSelected = selectedRestaurant?.id === restaurant.id;
                const straight = haversineM(center[0], center[1], restaurant.lat, restaurant.lon);
                return isSelected && routeDistance !== null && routeDuration !== null ? (
                  <div className="flex items-center gap-2 mb-1 px-1.5 py-1 bg-blue-50 rounded-md">
                    <span className="text-[10px] font-semibold text-blue-700">🚶 {formatDuration(routeDuration)}</span>
                    <span className="text-[10px] text-gray-400">•</span>
                    <span className="text-[10px] text-blue-600">{formatDistance(routeDistance)}</span>
                    <span className="text-[10px] text-gray-400 ml-auto">routed</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 mb-1 text-[10px] text-gray-500">
                    <span>🚶 ~{fmtWalk(straight)}</span>
                    <span className="text-gray-300">•</span>
                    <span>{fmtM(straight)}</span>
                  </div>
                );
              })()}

              <div className="mt-2 flex flex-col gap-1.5">
                {selectedRestaurant?.id !== restaurant.id ? (
                  <button
                    onClick={() => onRestaurantSelected?.(restaurant)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold py-1.5 px-2 rounded-md transition-colors"
                  >
                    Select as Target
                  </button>
                ) : (
                  <button
                    onClick={() => onRestaurantSelected?.(null)}
                    className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-dark-text text-[10px] font-bold py-1.5 px-2 rounded-md transition-colors"
                  >
                    Deselect Target
                  </button>
                )}
                
                <button
                  onClick={() => {
                    if (onMarkVisited) {
                      onMarkVisited(restaurant);
                    }
                    if (selectedRestaurant?.id === restaurant.id) {
                      onRestaurantSelected?.(null);
                    }
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold py-1.5 px-2 rounded-md transition-colors"
                >
                  Mark as Visited
                </button>
              </div>

              <div className="mt-2 pt-1.5 border-t dark:border-dark-border flex flex-row gap-2 justify-between">
                <a 
                  href={`https://www.google.com/maps/dir/?api=1&destination=${restaurant.lat},${restaurant.lon}&travelmode=walking`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-blue-600 hover:underline dark:text-dark-primary"
                >
                  Google Maps
                </a>
                <a 
                  href={`http://maps.apple.com/?daddr=${restaurant.lat},${restaurant.lon}&dirflg=w`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-blue-600 hover:underline dark:text-dark-primary"
                >
                  Apple Maps
                </a>
                <button
                  onClick={() => shareRestaurant(restaurant)}
                  className="text-[10px] text-blue-600 hover:underline dark:text-dark-primary"
                  aria-label={`Share ${restaurant.name}`}
                >
                  Share
                </button>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
      </MapContainer>
      {breadcrumbItems && breadcrumbItems.length > 0 && (
        <div className="absolute top-4 left-4 z-50">
          <Breadcrumb items={breadcrumbItems} className="bg-white/90 dark:bg-dark-card/90 px-3 py-2 rounded-2xl shadow-lg" />
        </div>
      )}
    </div>
  );
};