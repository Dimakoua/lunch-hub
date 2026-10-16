import React, { useState, useRef } from 'react';
import { Play, Check, Share2, MapPin, ExternalLink, Star } from 'lucide-react';
import { Restaurant } from '../types/restaurant';
import { useShakeGesture } from '../hooks/useShakeGesture';
import { trackEvent, trackDirectionsClick, trackReviewsClick } from '../services/analytics';
import { formatWalkingTime, formatDistance } from '../utils/distanceFormatter';

interface SpinWheelProps {
  restaurants: Restaurant[];
  onRestaurantSelected: (restaurant: Restaurant) => void;
  onMarkVisited?: (restaurant: Restaurant) => void;
  userLat?: number;
  userLon?: number;
}

function calcMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const SpinWheel: React.FC<SpinWheelProps> = ({ 
  restaurants, 
  onRestaurantSelected,
  onMarkVisited,
  userLat,
  userLon
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [rotation, setRotation] = useState(0);
  const [copiedShare, setCopiedShare] = useState(false);
  const [isVisitedToday, setIsVisitedToday] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);

  const handleSpin = () => {
    if (isSpinning || restaurants.length === 0) return;

    setIsSpinning(true);
    setSelectedRestaurant(null);
    setIsVisitedToday(false);

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
      trackEvent('wheel_spun', { restaurant_name: selected.name });
    }, 3000);
  };

  useShakeGesture(handleSpin, !isSpinning && restaurants.length > 0);

  if (restaurants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-dark-card rounded-xl">
        <p className="text-gray-500 dark:text-dark-text-secondary text-center">
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

  const distMeters = selectedRestaurant && userLat !== undefined && userLon !== undefined
    ? calcMeters(userLat, userLon, selectedRestaurant.lat, selectedRestaurant.lon)
    : 400; // Default ~5 mins if lat/lon unavailable

  const walkMins = Math.max(1, Math.round(distMeters / 80));

  const handleViralShare = async () => {
    if (!selectedRestaurant) return;
    const shareUrl = `${window.location.origin}/?location=${selectedRestaurant.lat},${selectedRestaurant.lon}`;
    const formattedText = `🎡 The Lunch Wheel has spoken! Today we're eating at ${selectedRestaurant.name} (${selectedRestaurant.cuisine || 'Lunch Spot'}, ${walkMins} min walk). See map or spin again: ${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Today's Lunch Winner!",
          text: formattedText,
          url: shareUrl,
        });
        return;
      } catch {
        // Fall back to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(formattedText);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="relative">
        {/* Wheel */}
        <div 
          ref={wheelRef}
          className="relative w-80 h-80 rounded-full border-4 border-gray-300 dark:border-dark-border shadow-lg overflow-hidden"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning ? 'transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none'
          }}
        >
          <svg 
            className="w-full h-full block" 
            viewBox="0 0 200 200"
            xmlns="http://www.w3.org/2000/svg"
          >
            {restaurants.length === 1 ? (
              <g>
                <circle cx="100" cy="100" r="90" fill={colors[0]} stroke="white" strokeWidth="2" />
                <text
                  x="100"
                  y="100"
                  fill="white"
                  fontSize="12"
                  fontWeight="bold"
                  textAnchor="middle"
                  alignmentBaseline="central"
                >
                  {restaurants[0].name.length > 20 
                    ? restaurants[0].name.substring(0, 20) + '...' 
                    : restaurants[0].name
                  }
                </text>
              </g>
            ) : (
              restaurants.map((restaurant, index) => {
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
                const textX = 100 + 65 * Math.cos((textAngle * Math.PI) / 180);
                const textY = 100 + 65 * Math.sin((textAngle * Math.PI) / 180);

                return (
                  <g key={restaurant.id}>
                    <path
                      d={pathData}
                      fill={colors[index % colors.length]}
                      stroke="white"
                      strokeWidth="1"
                    />
                    <text
                      x={textX}
                      y={textY}
                      fill="white"
                      fontSize={restaurants.length > 10 ? "6" : "8"}
                      fontWeight="bold"
                      textAnchor="middle"
                      alignmentBaseline="central"
                      transform={`rotate(${textAngle}, ${textX}, ${textY})`}
                    >
                      {restaurant.name.length > 15 
                        ? restaurant.name.substring(0, 12) + '...' 
                        : restaurant.name
                      }
                    </text>
                  </g>
                );
              })
            )}
          </svg>
        </div>

        {/* Pointer */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-10">
          <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-red-500 dark:border-b-dark-primary"></div>
        </div>

        {/* Center button */}
        <button
          onClick={handleSpin}
          disabled={isSpinning}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white dark:bg-dark-card border-4 border-gray-300 dark:border-dark-border rounded-full shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center z-10"
        >
          <Play className={`w-6 h-6 text-blue-600 dark:text-dark-primary ${isSpinning ? 'animate-pulse' : ''}`} />
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-4">
          <button
            onClick={handleSpin}
            disabled={isSpinning}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:bg-dark-primary dark:hover:bg-orange-600 dark:disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold transition-all duration-200 flex items-center gap-2 shadow-md"
          >
            <Play className="w-4 h-4" />
            {isSpinning ? 'Spinning...' : 'Spin the Wheel!'}
          </button>
        </div>
        <p className="text-xs text-gray-400 dark:text-dark-text-secondary font-semibold mt-1">
          📱 Tip: Shake your phone to spin!
        </p>
      </div>

      {/* Upgraded Winner Modal */}
      {selectedRestaurant && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-3xl p-6 max-w-md w-full shadow-2xl relative text-gray-900 dark:text-dark-text">
            <button
              onClick={() => setSelectedRestaurant(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-dark-text font-bold text-xl"
            >
              ×
            </button>

            <div className="text-center mb-4">
              <span className="inline-block text-3xl mb-1 animate-bounce">🎡</span>
              <h3 className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                The Wheel Has Spoken!
              </h3>
              <p className="text-xs text-gray-500 dark:text-dark-text-secondary font-medium mt-0.5">
                Here is your official lunch destination today
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-4 border border-gray-200/80 dark:border-dark-border mb-4 space-y-2">
              <h4 className="text-xl font-extrabold text-gray-900 dark:text-dark-text">{selectedRestaurant.name}</h4>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                {selectedRestaurant.cuisine && (
                  <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 rounded-full font-bold">
                    {selectedRestaurant.cuisine}
                  </span>
                )}
                <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                  🚶 {walkMins} min walk
                </span>
                {selectedRestaurant.deal && (
                  <span className="bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 px-2.5 py-0.5 rounded-full font-bold">
                    🔥 {selectedRestaurant.deal.price} Deal
                  </span>
                )}
              </div>

              {selectedRestaurant.deal && (
                <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 pt-1">
                  Deal Special: {selectedRestaurant.deal.dealTitle}
                </div>
              )}
            </div>

            {/* Primary CTAs */}
            <div className="space-y-2.5">
              <a
                href={`https://www.google.com/maps/dir/?api=1&origin=${userLat || ''},${userLon || ''}&destination=${selectedRestaurant.lat},${selectedRestaurant.lon}&travelmode=walking`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackDirectionsClick(selectedRestaurant.name, selectedRestaurant.lat, selectedRestaurant.lon)}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-colors"
              >
                <MapPin className="w-4 h-4" />
                🗺️ Get Walking Directions
              </a>

              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(selectedRestaurant.name + ' menu reviews')}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackReviewsClick(selectedRestaurant.name)}
                className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-colors"
              >
                <Star className="w-4 h-4 fill-current" />
                ⭐ See Menu &amp; Reviews
              </a>

              <button
                onClick={() => {
                  if (onMarkVisited) onMarkVisited(selectedRestaurant);
                  setIsVisitedToday(true);
                }}
                disabled={isVisitedToday}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs border transition-colors flex items-center justify-center gap-2 ${
                  isVisitedToday
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 border-emerald-300'
                    : 'bg-white dark:bg-dark-card border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text hover:bg-gray-100'
                }`}
              >
                <Check className="w-4 h-4" />
                {isVisitedToday ? '✅ Saved to Visited History' : '✅ Mark as Visited Today'}
              </button>

              <button
                onClick={handleViralShare}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
              >
                <Share2 className="w-4 h-4" />
                {copiedShare ? 'Copied Message to Clipboard!' : '📲 Share Result with Coworkers'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
