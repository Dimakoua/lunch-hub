import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Tooltip, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Restaurant } from '../types/restaurant';
import { fetchRoute } from '../services/routing';
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
  zoom?: number;
}

const MapController: React.FC<{ center: [number, number]; selectedRestaurant?: Restaurant | null }> = ({ 
  center, 
  selectedRestaurant 
}) => {
  const map = useMap();

  useEffect(() => {
    if (selectedRestaurant) {
      map.setView([selectedRestaurant.lat, selectedRestaurant.lon], 16);
    } else {
      map.setView(center, 13);
    }
  }, [center, selectedRestaurant, map]);

  return null;
};

export const MapView: React.FC<MapViewProps> = ({ 
  center, 
  restaurants, 
  selectedRestaurant,
  zoom = 13 
}) => {
  const [route, setRoute] = useState<any>(null);
  const [routeDuration, setRouteDuration] = useState<number | null>(null);

  useEffect(() => {
    if (selectedRestaurant) {
      fetchRoute(center, [selectedRestaurant.lat, selectedRestaurant.lon]).then(
        (routeInfo) => {
          if (routeInfo) {
            setRoute(routeInfo.geometry);
            setRouteDuration(routeInfo.duration);
          }
        }
      );
    } else {
      setRoute(null);
      setRouteDuration(null);
    }
  }, [selectedRestaurant, center]);

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

      {route && (
        <Polyline positions={route.coordinates.map((c: any) => [c[1], c[0]])} color="blue">
          {routeDuration && (
            <Tooltip permanent>
              {`~ ${Math.round(routeDuration / 60)} min walk`}
            </Tooltip>
          )}
        </Polyline>
      )}
      
      {/* User location marker */}
      <Marker position={center} icon={userIcon}>
        <Tooltip permanent>
          Your Location
        </Tooltip>
        <Popup>
          <div className="text-center">
            <strong>Your Location</strong>
          </div>
        </Popup>
      </Marker>

      {/* Restaurant markers */}
      {restaurants.map((restaurant) => (
        <Marker
          key={restaurant.id}
          position={[restaurant.lat, restaurant.lon]}
          icon={selectedRestaurant?.id === restaurant.id ? selectedIcon : restaurantIcon}
        >
          <Tooltip permanent={selectedRestaurant?.id === restaurant.id}>
            {restaurant.name}
          </Tooltip>
          <Popup className="custom-popup">
            <div className="p-2 min-w-[200px]">
              <h3 className="font-bold text-lg text-gray-900 mb-2">
                {restaurant.name}
              </h3>
              {restaurant.cuisine && (
                <span className="inline-block text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full mb-2">
                  {restaurant.cuisine}
                </span>
              )}
              <p className="text-sm text-gray-600 mb-2">{restaurant.address}</p>
              {restaurant.phone && (
                <p className="text-sm">
                  <strong>Phone:</strong> {restaurant.phone}
                </p>
              )}
              {restaurant.website && (
                <p className="text-sm mt-1">
                  <a 
                    href={restaurant.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Visit Website
                  </a>
                </p>
              )}
              <div className="mt-2 pt-2 border-t">
                <p className="text-sm mt-1">
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&destination=${restaurant.lat},${restaurant.lon}&travelmode=walking`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Open in Google Maps
                  </a>
                </p>
                <p className="text-sm mt-1">
                  <a 
                    href={`http://maps.apple.com/?daddr=${restaurant.lat},${restaurant.lon}&dirflg=w`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Open in Apple Maps
                  </a>
                </p>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};