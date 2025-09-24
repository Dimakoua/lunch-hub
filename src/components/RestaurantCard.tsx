import React from 'react';
import { MapPin, Phone, Globe, Clock, Utensils } from 'lucide-react';
import { Restaurant } from '../types/restaurant';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onViewOnMap: (restaurant: Restaurant) => void;
  onMarkVisited?: (restaurant: Restaurant) => void;
}

export const RestaurantCard: React.FC<RestaurantCardProps> = ({ 
  restaurant, 
  onViewOnMap,
  onMarkVisited
}) => {
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
        </div>

        {restaurant.cuisine && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900 px-3 py-1 rounded-full">
              {restaurant.cuisine}
            </span>
          </div>
        )}

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

        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-border space-y-2">
          {onMarkVisited && (
            <button
              onClick={() => onMarkVisited(restaurant)}
              className="w-full bg-white dark:bg-dark-card text-blue-600 dark:text-dark-primary border border-blue-100 dark:border-dark-border hover:bg-blue-50 dark:hover:bg-gray-700 py-2.5 px-4 rounded-lg font-medium transition-all duration-200"
            >
              Mark as visited
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
