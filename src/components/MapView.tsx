import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Tooltip, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Restaurant } from '../types/restaurant';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapViewProps {
  center: [number, number];
  restaurants: Restaurant[];
  selectedRestaurant?: Restaurant | null;
  onRestaurantSelected?: (restaurant: Restaurant | null) => void;
  onMarkVisited?: (restaurant: Restaurant) => void;
  zoom?: number;
  routeGeometry?: [number, number][] | null;
  routeDistance: number | null;
  routeDuration: number | null;
  radius?: number;
}

const MapController: React.FC<{ center: [number, number]; selectedRestaurant?: Restaurant | null }> = ({ 
  center, 
  selectedRestaurant 
}) => {
  const map = useMap();

  useEffect(() => {
    if (selectedRestaurant) {
      map.setView([selectedRestaurant.lat, selectedRestaurant.lon], 16);
    }
  }, [selectedRestaurant, map]);

  return null;
};

export const MapView: React.FC<MapViewProps> = ({ 
  center, 
  restaurants, 
  selectedRestaurant,
  onRestaurantSelected,
  onMarkVisited,
  zoom = 13,
  radius,
  routeGeometry,
  routeDistance,
  routeDuration
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
    return `${minutes} min`;
  };

  const formatDistance = (meters: number | null | undefined) => {
    if (meters === null || meters === undefined) return 'N/A';
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  return (
    <MapContainer 
      center={center} 
      zoom={zoom} 
      className="w-full h-full rounded-xl"
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      <MapController center={center} selectedRestaurant={selectedRestaurant} />

      {routeGeometry && (
        <Polyline 
          positions={routeGeometry} 
          color="#2563EB" 
          weight={5} 
          opacity={0.7} 
          dashArray="10, 10"
        />
      )}

      {/* Route Info Overlay */}
      {routeDistance !== null && routeDuration !== null && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white dark:bg-dark-card p-3 rounded-lg shadow-md text-sm font-medium text-gray-800 dark:text-dark-text flex items-center space-x-4">
          <p>
            <strong className="text-blue-600 dark:text-dark-primary">Distance:</strong> {formatDistance(routeDistance)}
          </p>
          <p>
            <strong className="text-blue-600 dark:text-dark-primary">Est. Walk Time:</strong> {formatDuration(routeDuration)}
          </p>
        </div>
      )}

      {/* User location marker */}
      <Marker position={center} icon={userIcon}>
        <Tooltip permanent>
          Your Location
        </Tooltip>
        <Popup autoPan={false} closeOnClick={false}>
          <div className="text-center p-1">
            <strong className="text-sm">Your Location</strong>
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
              <p className="text-xs text-gray-600 dark:text-dark-text-secondary mb-1 line-clamp-1">{restaurant.address}</p>
              
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
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};