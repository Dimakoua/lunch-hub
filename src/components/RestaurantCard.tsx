import React from 'react';
import { MapPin, Phone, Globe, Clock, Utensils, PersonStanding, EyeOff } from 'lucide-react';
import { Restaurant } from '../types/restaurant';
import { formatDistance, formatWalkingTime } from '../utils/distanceFormatter';
import { trackDirectionsClick, trackReviewsClick } from '../services/analytics';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onViewOnMap: (restaurant: Restaurant) => void;
  onMarkVisited?: (restaurant: Restaurant) => void;
  onHide?: (restaurant: Restaurant) => void;
  userLat?: number;
  userLon?: number;
  useImperial?: boolean; // triggers re-render when units change
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDist(m: number): string {
  return formatDistance(m);
}

function formatWalk(m: number): string {
  return formatWalkingTime(m);
}

export const RestaurantCard: React.FC<RestaurantCardProps> = ({ 
  restaurant, 
  onViewOnMap,
  onMarkVisited,
  onHide,
  userLat,
  userLon,
  useImperial: _useImperial, // consumed only to trigger re-render
}) => {
  const distMeters =
    userLat !== undefined && userLon !== undefined
      ? haversineMeters(userLat, userLon, restaurant.lat, restaurant.lon)
      : null;
  const getAmenityIcon = (amenity: string) => {
    switch (amenity) {
      case 'restaurant':
        return <Utensils className="w-5 h-5" />;
      case 'fast_food':
        return <span className="text-lg">🍔</span>;
      case 'cafe':
        return <span className="text-lg">☕</span>;
      case 'pub':
      case 'bar':
        return <span className="text-lg">🍺</span>;
      default:
        return <Utensils className="w-5 h-5" />;
    }
  };

  const formatAmenityName = (amenity: string) => {
    return amenity.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="bg-white dark:bg-dark-card rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 dark:border-dark-border group">
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-50 dark:bg-gray-700 rounded-lg text-blue-600 dark:text-dark-primary">
              {getAmenityIcon(restaurant.amenity)}
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-dark-text group-hover:text-blue-600 dark:group-hover:text-dark-primary transition-colors duration-200">
                {restaurant.name}
              </h3>
              <span className="text-sm text-gray-500 dark:text-dark-text-secondary bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                {formatAmenityName(restaurant.amenity)}
              </span>
            </div>
          </div>
          {distMeters !== null && (
            <div className="flex-shrink-0 flex flex-col items-end gap-0.5">
              <span className="text-sm font-semibold text-gray-800 dark:text-dark-text">{formatDist(distMeters)}</span>
              <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-dark-text-secondary">
                <PersonStanding className="w-3 h-3" />
                {formatWalk(distMeters)}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          {restaurant.cuisine && (
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/40 px-2.5 py-0.5 rounded-full">
              {restaurant.cuisine}
            </span>
          )}
          {restaurant.deal && (
            <span className="text-xs font-bold text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/60 px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-700 animate-pulse">
              🔥 {restaurant.deal.dealTitle} ({restaurant.deal.price})
            </span>
          )}
        </div>

        <div className="space-y-2 text-sm text-gray-600 dark:text-dark-text-secondary">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{restaurant.address}</span>
          </div>
          
          {restaurant.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 flex-shrink-0" />
              <a 
                href={`tel:${restaurant.phone}`}
                className="hover:text-blue-600 dark:hover:text-dark-primary transition-colors duration-200"
              >
                {restaurant.phone}
              </a>
            </div>
          )}
          
          {restaurant.website && (
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 flex-shrink-0" />
              <a 
                href={restaurant.website}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-600 dark:hover:text-dark-primary transition-colors duration-200 truncate"
              >
                Visit Website
              </a>
            </div>
          )}
          
          {restaurant.opening_hours && (
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span className="text-xs">{restaurant.opening_hours}</span>
            </div>
          )}
        </div>

        {/* Outbound verification links */}
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-dark-border flex flex-wrap items-center gap-2 text-xs">
          <a
            href={`https://www.google.com/search?q=${encodeURIComponent(restaurant.name + ' ' + (restaurant.address || '') + ' menu reviews')}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackReviewsClick(restaurant.name)}
            className="flex-1 text-center py-1.5 px-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 font-semibold transition-colors border border-amber-200/60 dark:border-amber-800/40"
          >
            ⭐ Google Reviews &amp; Menu
          </a>
          <a
            href={`https://www.google.com/maps/dir/?api=1&origin=${userLat || ''},${userLon || ''}&destination=${restaurant.lat},${restaurant.lon}&travelmode=walking`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackDirectionsClick(restaurant.name, restaurant.lat, restaurant.lon)}
            className="flex-1 text-center py-1.5 px-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 font-semibold transition-colors border border-blue-200/60 dark:border-blue-800/40"
          >
            🗺️ Walking Directions
          </a>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-dark-border space-y-2">
          {onMarkVisited && (
            <button
              data-tour-target="mark-as-visited-btn"
              onClick={() => onMarkVisited(restaurant)}
              className="w-full bg-white dark:bg-dark-card text-blue-600 dark:text-dark-primary border border-blue-100 dark:border-dark-border hover:bg-blue-50 dark:hover:bg-gray-700 py-2.5 px-4 rounded-lg font-medium transition-all duration-200"
            >
              Mark as visited
            </button>
          )}
          {onHide && (
            <button
              onClick={() => onHide(restaurant)}
              className="w-full flex items-center justify-center gap-2 bg-white dark:bg-dark-card text-gray-500 dark:text-dark-text-secondary border border-gray-200 dark:border-dark-border hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-900/20 dark:hover:text-red-400 py-2.5 px-4 rounded-lg font-medium transition-all duration-200"
            >
              <EyeOff className="w-4 h-4" />
              Not interested
            </button>
          )}
          <button
            onClick={() => onViewOnMap(restaurant)}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-dark-primary dark:to-orange-600 dark:hover:to-orange-500 text-white py-2.5 px-4 rounded-lg font-medium transition-all duration-200 transform hover:scale-[1.02]"
          >
            View on Map
          </button>
        </div>
      </div>
    </div>
  );
};
