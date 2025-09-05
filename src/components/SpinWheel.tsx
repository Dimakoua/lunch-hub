import React, { useState, useRef } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { Restaurant } from '../types/restaurant';

interface SpinWheelProps {
  restaurants: Restaurant[];
  onRestaurantSelected: (restaurant: Restaurant) => void;
}

export const SpinWheel: React.FC<SpinWheelProps> = ({ 
  restaurants, 
  onRestaurantSelected 
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);

  const handleSpin = () => {
    if (isSpinning || restaurants.length === 0) return;

    setIsSpinning(true);
    setSelectedRestaurant(null);

    // Calculate random rotation (multiple full rotations + random angle)
    const randomRotation = 1440 + Math.random() * 3600; // 4-14 full rotations
    const newRotation = rotation + randomRotation;
    
    setRotation(newRotation);

    // Calculate which restaurant was selected
    const segmentAngle = 360 / restaurants.length;
    const normalizedAngle = (360 - (newRotation % 360)) % 360;
    const selectedIndex = Math.floor(normalizedAngle / segmentAngle);
    const selected = restaurants[selectedIndex] || restaurants[0];

    setTimeout(() => {
      setIsSpinning(false);
      setSelectedRestaurant(selected);
      onRestaurantSelected(selected);
    }, 3000);
  };

  const reset = () => {
    if (isSpinning) return;
    setRotation(0);
    setSelectedRestaurant(null);
  };

  if (restaurants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-xl">
        <p className="text-gray-500 text-center">
          No restaurants found. Search for a location first!
        </p>
      </div>
    );
  }

  const segmentAngle = 360 / restaurants.length;
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ];

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="relative">
        {/* Wheel */}
        <div 
          ref={wheelRef}
          className="relative w-80 h-80 rounded-full border-4 border-gray-300 shadow-lg"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning ? 'transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none'
          }}
        >
          <svg className="w-full h-full" viewBox="0 0 200 200">
            {restaurants.map((restaurant, index) => {
              const startAngle = index * segmentAngle;
              const endAngle = (index + 1) * segmentAngle;
              const startAngleRad = (startAngle * Math.PI) / 180;
              const endAngleRad = (endAngle * Math.PI) / 180;
              
              const x1 = 100 + 90 * Math.cos(startAngleRad);
              const y1 = 100 + 90 * Math.sin(startAngleRad);
              const x2 = 100 + 90 * Math.cos(endAngleRad);
              const y2 = 100 + 90 * Math.sin(endAngleRad);
              
              const largeArcFlag = segmentAngle > 180 ? 1 : 0;
              
              const pathData = [
                `M 100 100`,
                `L ${x1} ${y1}`,
                `A 90 90 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                'Z'
              ].join(' ');
              
              const textAngle = startAngle + segmentAngle / 2;
              const textX = 100 + 60 * Math.cos((textAngle * Math.PI) / 180);
              const textY = 100 + 60 * Math.sin((textAngle * Math.PI) / 180);

              return (
                <g key={restaurant.id}>
                  <path
                    d={pathData}
                    fill={colors[index % colors.length]}
                    stroke="white"
                    strokeWidth="2"
                  />
                  <text
                    x={textX}
                    y={textY}
                    fill="white"
                    fontSize="8"
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${textAngle}, ${textX}, ${textY})`}
                  >
                    {restaurant.name.length > 12 
                      ? restaurant.name.substring(0, 12) + '...' 
                      : restaurant.name
                    }
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Pointer */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
          <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-red-500"></div>
        </div>

        {/* Center button */}
        <button
          onClick={handleSpin}
          disabled={isSpinning}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white border-4 border-gray-300 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center"
        >
          <Play className={`w-6 h-6 text-blue-600 ${isSpinning ? 'animate-pulse' : ''}`} />
        </button>
      </div>

      {/* Controls */}
      <div className="flex gap-4">
        <button
          onClick={handleSpin}
          disabled={isSpinning}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
        >
          <Play className="w-4 h-4" />
          {isSpinning ? 'Spinning...' : 'Spin the Wheel!'}
        </button>
        
        <button
          onClick={reset}
          disabled={isSpinning}
          className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>

      {/* Selected restaurant */}
      {selectedRestaurant && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-xl shadow-lg max-w-md text-center animate-bounce">
          <h3 className="text-xl font-bold mb-2">🎉 Winner!</h3>
          <p className="text-lg font-medium">{selectedRestaurant.name}</p>
          {selectedRestaurant.cuisine && (
            <p className="text-sm opacity-90 mt-1">{selectedRestaurant.cuisine}</p>
          )}
        </div>
      )}
    </div>
  );
};