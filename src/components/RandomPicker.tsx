import React, { useState } from 'react';
import { Shuffle, ArrowRight } from 'lucide-react';
import { Restaurant } from '../types/restaurant';

interface RandomPickerProps {
  restaurants: Restaurant[];
  onRestaurantSelected: (restaurant: Restaurant) => void;
  onMarkVisited?: (restaurant: Restaurant) => void;
}

export const RandomPicker: React.FC<RandomPickerProps> = ({ 
  restaurants, 
  onRestaurantSelected,
  onMarkVisited
}) => {
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleRandomPick = () => {
    if (restaurants.length === 0) return;

    setIsAnimating(true);
    setSelectedRestaurant(null);

    // Animate through several restaurants before selecting final one
    let animationCount = 0;
    const maxAnimations = 10;
    
    const animationInterval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * restaurants.length);
      setSelectedRestaurant(restaurants[randomIndex]);
      animationCount++;

      if (animationCount >= maxAnimations) {
        clearInterval(animationInterval);
        const finalIndex = Math.floor(Math.random() * restaurants.length);
        const finalRestaurant = restaurants[finalIndex];
        
        setTimeout(() => {
          setSelectedRestaurant(finalRestaurant);
          setIsAnimating(false);
          onRestaurantSelected(finalRestaurant);
        }, 200);
      }
    }, 100);
  };

  if (restaurants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-dark-card rounded-xl">
        <p className="text-gray-500 dark:text-dark-text-secondary text-center">
          No restaurants found. Search for a location first!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-lg p-8 min-h-[300px] w-full max-w-md flex flex-col items-center justify-center">
        {!selectedRestaurant ? (
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4 mx-auto">
              <Shuffle className="w-10 h-10 text-blue-600 dark:text-dark-primary" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-dark-text mb-2">
              Ready to discover?
            </h3>
            <p className="text-gray-600 dark:text-dark-text-secondary">
              Click the button below to randomly select a restaurant from {restaurants.length} options!
            </p>
          </div>
        ) : (
          <div className={`text-center w-full ${isAnimating ? 'animate-pulse' : 'animate-fadeIn'}`}>
            <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 dark:from-dark-primary dark:to-orange-500 rounded-full flex items-center justify-center mb-4 mx-auto">
              <span className="text-2xl text-white">🍽️</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-2">
              {selectedRestaurant.name}
            </h3>
            {selectedRestaurant.cuisine && (
              <span className="inline-block text-sm bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-400 px-3 py-1 rounded-full mb-3">
                {selectedRestaurant.cuisine}
              </span>
            )}
            <p className="text-gray-600 dark:text-dark-text-secondary text-sm mb-4">
              {selectedRestaurant.address}
            </p>
            {!isAnimating && (
              <div className="flex flex-col gap-2 text-sm">
                {selectedRestaurant.phone && (
                  <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-dark-text-secondary">
                    <span>📞</span>
                    <span>{selectedRestaurant.phone}</span>
                  </div>
                )}
                {selectedRestaurant.opening_hours && (
                  <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-dark-text-secondary">
                    <span>🕒</span>
                    <span className="text-xs">{selectedRestaurant.opening_hours}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        <button
          onClick={handleRandomPick}
          disabled={isAnimating}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 dark:from-dark-primary dark:to-orange-600 dark:hover:from-orange-500 dark:hover:to-orange-700 dark:disabled:from-gray-600 dark:disabled:to-gray-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 transform hover:scale-105"
        >
          <Shuffle className={`w-5 h-5 ${isAnimating ? 'animate-spin' : ''}`} />
          {isAnimating ? 'Picking...' : 'Pick Random Restaurant'}
        </button>
        
        {selectedRestaurant && !isAnimating && (
          <button
            onClick={() => onRestaurantSelected(selectedRestaurant)}
            className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
          >
            View Details
            <ArrowRight className="w-4 h-4" />
          </button>
        )}

        {onMarkVisited && selectedRestaurant && !isAnimating && (
          <button
            onClick={() => onMarkVisited(selectedRestaurant)}
            className="bg-white dark:bg-dark-card text-blue-600 dark:text-dark-primary border border-blue-200 dark:border-dark-border hover:bg-blue-50 dark:hover:bg-gray-700 px-6 py-3 rounded-lg font-medium transition-all duration-200"
          >
            Mark as visited
          </button>
        )}


      </div>

      <div className="text-center text-sm text-gray-500 dark:text-dark-text-secondary">
        Found {restaurants.length} restaurants in your area
      </div>
    </div>
  );
};
