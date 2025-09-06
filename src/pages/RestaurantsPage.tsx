import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MapPin, List, Shuffle, RotateCcw, Settings, Sun, Moon } from 'lucide-react';
import { RestaurantCard } from '../components/RestaurantCard';
import { MapView } from '../components/MapView';
import { SpinWheel } from '../components/SpinWheel';
import { RandomPicker } from '../components/RandomPicker';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Restaurant, Location } from '../types/restaurant';
import { trackRestaurantView, trackSpinWheel, trackRandomPick } from '../services/analytics';
import { fetchRoute } from '../services/routing'; // Import fetchRoute

type ViewMode = 'map' | 'list' | 'wheel' | 'random';
type Theme = 'light' | 'dark';

interface RestaurantsPageProps {
  location: Location;
  restaurants: Restaurant[];
  loading: boolean;
  error: string | null;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  selectedRestaurant: Restaurant | null;
  radius: number;
  setRadius: (radius: number) => void;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  theme: Theme;
  toggleTheme: () => void;
  onViewOnMap: (restaurant: Restaurant) => void;
  onRestaurantSelected: (restaurant: Restaurant | null) => void;
}

export const RestaurantsPage: React.FC<RestaurantsPageProps> = ({
  location,
  restaurants,
  loading,
  error,
  viewMode,
  setViewMode,
  selectedRestaurant,
  radius,
  setRadius,
  showSettings,
  setShowSettings,
  theme,
  toggleTheme,
  onViewOnMap,
  onRestaurantSelected
}) => {
  const [routeGeometry, setRouteGeometry] = useState<[number, number][] | null>(null);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  const [routeDuration, setRouteDuration] = useState<number | null>(null);

  useEffect(() => {
    const getRoute = async () => {
      if (selectedRestaurant && location.lat && location.lon) {
        const route = await fetchRoute(
          [location.lat, location.lon],
          [selectedRestaurant.lat, selectedRestaurant.lon]
        );
        if (route) {
          setRouteGeometry(route.geometry);
          setRouteDistance(route.distance);
          setRouteDuration(route.duration);
        } else {
          setRouteGeometry(null);
          setRouteDistance(null);
          setRouteDuration(null);
        }
      } else {
        setRouteGeometry(null);
        setRouteDistance(null);
        setRouteDuration(null);
      }
    };

    getRoute();
  }, [selectedRestaurant, location]);

  const handleSpinWheelResult = (restaurant: Restaurant) => {
    trackSpinWheel(restaurant.name);
    onRestaurantSelected(restaurant);
  };

  const handleRandomPickResult = (restaurant: Restaurant) => {
    trackRandomPick(restaurant.name);
    onRestaurantSelected(restaurant);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-background">
      <Helmet>
        <title>Lunch Hub - Restaurants Near You</title>
        <meta name="description" content={`Found ${restaurants.length} restaurants near you. Explore on map, browse list, or use our fun selection tools!`} />
      </Helmet>
      
      {/* Header */}
      <header className="bg-white dark:bg-dark-card shadow-sm border-b border-gray-200 dark:border-dark-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-dark-primary dark:to-orange-500 rounded-xl p-2">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <Link to="/">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-dark-primary dark:to-orange-500 bg-clip-text text-transparent cursor-pointer">
                  Lunch Hub
                </h1>
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
                  Found {restaurants.length} restaurants
                </p>
                <p className="text-xs text-gray-500 dark:text-dark-text-secondary">
                  within {radius}m radius
                </p>
              </div>
              
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
              >
                <Settings className="w-5 h-5 text-gray-600 dark:text-dark-text-secondary" />
              </button>

              <button
                onClick={toggleTheme}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 theme-toggle-button"
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5 text-gray-600" />
                ) : (
                  <Sun className="w-5 h-5 text-yellow-400" />
                )}
              </button>
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-dark-background rounded-lg border border-gray-200 dark:border-dark-border">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700 dark:text-dark-text">
                  Search Radius:
                </label>
                <select
                  value={radius}
                  onChange={(e) => {
                    setRadius(Number(e.target.value));
                    onRestaurantSelected(null);
                  }}
                  className="px-3 py-1 border border-gray-300 dark:border-dark-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-dark-primary focus:border-transparent bg-white dark:bg-dark-card dark:text-dark-text"
                >
                  <option value={500}>500m</option>
                  <option value={1000}>1km</option>
                  <option value={2000}>2km</option>
                  <option value={5000}>5km</option>
                </select>
              </div>
            </div>
          )}

          {/* View Mode Tabs */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setViewMode('map')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                viewMode === 'map' 
                  ? 'bg-blue-600 dark:bg-dark-primary text-white shadow-md' 
                  : 'bg-white dark:bg-dark-card text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-dark-border'
              }`}
            >
              <MapPin className="w-4 h-4" />
              Map
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                viewMode === 'list' 
                  ? 'bg-blue-600 dark:bg-dark-primary text-white shadow-md' 
                  : 'bg-white dark:bg-dark-card text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-dark-border'
              }`}
            >
              <List className="w-4 h-4" />
              List
            </button>
            <button
              onClick={() => setViewMode('random')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                viewMode === 'random' 
                  ? 'bg-purple-600 dark:bg-dark-primary text-white shadow-md' 
                  : 'bg-white dark:bg-dark-card text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-dark-border'
              }`}
            >
              <Shuffle className="w-4 h-4" />
              Random
            </button>
            <button
              onClick={() => setViewMode('wheel')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                viewMode === 'wheel' 
                  ? 'bg-emerald-600 dark:bg-dark-primary text-white shadow-md' 
                  : 'bg-white dark:bg-dark-card text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-dark-border'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              Wheel
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <LoadingSpinner message="Finding restaurants..." />
        ) : error ? (
          <div className="bg-red-50 border border-red-200 dark:bg-red-900 dark:border-red-700 rounded-lg p-4 text-center">
            <p className="text-red-700 dark:text-red-200">{error}</p>
          </div>
        ) : (
          <>
            {viewMode === 'map' && (
              <div className="h-[600px] bg-white dark:bg-dark-card rounded-xl shadow-lg overflow-hidden">
                <MapView 
                  center={[location.lat, location.lon]}
                  restaurants={restaurants}
                  selectedRestaurant={selectedRestaurant}
                  routeGeometry={routeGeometry}
                  routeDistance={routeDistance}
                  routeDuration={routeDuration}
                  radius={radius}
                />
              </div>
            )}

            {viewMode === 'list' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {restaurants.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    onViewOnMap={(restaurantToView) => {
                      trackRestaurantView(restaurantToView.name, 'map');
                      onViewOnMap(restaurantToView);
                    }}
                  />
                ))}
              </div>
            )}

            {viewMode === 'random' && (
              <div className="flex justify-center">
                <RandomPicker 
                  restaurants={restaurants}
                  onRestaurantSelected={handleRandomPickResult}
                />
              </div>
            )}

            {viewMode === 'wheel' && (
              <div className="flex justify-center">
                <SpinWheel 
                  restaurants={restaurants}
                  onRestaurantSelected={handleSpinWheelResult}
                />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};