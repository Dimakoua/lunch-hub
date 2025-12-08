import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MapPin, List, Shuffle, RotateCcw, Settings, Sun, Moon, History, Trash2, Sparkles } from 'lucide-react';
import { RestaurantCard } from '../components/RestaurantCard';
import { MapView } from '../components/MapView';
import { SpinWheel } from '../components/SpinWheel';
import { RandomPicker } from '../components/RandomPicker';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Restaurant, Location } from '../types/restaurant';
import { FilterRule, FilterField } from '../types/filter';
import { trackRestaurantView, trackSpinWheel, trackRandomPick } from '../services/analytics';
import { fetchRoute } from '../services/routing'; // Import fetchRoute
import { OnboardingTour } from '../components/OnboardingTour';

type ViewMode = 'map' | 'list' | 'wheel' | 'random' | 'history';
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
  filterRules: FilterRule[];
  visitedRestaurants: Restaurant[];
  hiddenByHistoryCount: number;
  hiddenByFiltersCount: number;
  onMarkRestaurantVisited: (restaurant: Restaurant) => void;
  onRemoveVisitedRestaurant: (restaurantId: string) => void;
  onClearVisitedRestaurants: () => void;
  onAddFilterRule: (field: FilterField, value: string) => void;
  onRemoveFilterRule: (ruleId: string) => void;
  onClearFilterRules: () => void;
  onOpenTour: () => void;
  tourOpen: boolean;
  onTourClose: () => void;
}

const RestaurantsPage: React.FC<RestaurantsPageProps> = ({
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
  onRestaurantSelected,
  filterRules,
  visitedRestaurants,
  hiddenByHistoryCount,
  hiddenByFiltersCount,
  onMarkRestaurantVisited,
  onRemoveVisitedRestaurant,
  onClearVisitedRestaurants,
  onAddFilterRule,
  onRemoveFilterRule,
  onClearFilterRules,
  onOpenTour,
  tourOpen,
  onTourClose
}) => {
  const [routeGeometry, setRouteGeometry] = useState<[number, number][] | null>(null);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  const [routeDuration, setRouteDuration] = useState<number | null>(null);
  const [newFilterField, setNewFilterField] = useState<FilterField>('name');
  const [newFilterValue, setNewFilterValue] = useState('');
  const canAddFilter = newFilterValue.trim().length > 0;

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

  const handleSpinWheelResult = (restaurant: Restaurant): void => {
    trackSpinWheel(restaurant.name);
    onRestaurantSelected(restaurant);
  };

  const handleRandomPickResult = (restaurant: Restaurant): void => {
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
            
            <div className="flex flex-col items-end md:flex-row md:items-center gap-2 md:gap-4">
              <div className="text-right md:text-left">
                <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
                  Showing {restaurants.length} restaurants
                </p>
                <p className="text-xs text-gray-500 dark:text-dark-text-secondary">
                  within {radius}m radius
                </p>
                {hiddenByHistoryCount > 0 && (
                  <p className="text-xs text-gray-500 dark:text-dark-text-secondary">
                    {hiddenByHistoryCount} hidden by history
                  </p>
                )}
                {hiddenByFiltersCount > 0 && (
                  <p className="text-xs text-gray-500 dark:text-dark-text-secondary">
                    {hiddenByFiltersCount} hidden by filters
                  </p>
                )}
                {visitedRestaurants.length > 0 && (
                  <p className="text-xs text-gray-500 dark:text-dark-text-secondary">
                    History size: {visitedRestaurants.length}
                  </p>
                )}
              </div>

              <button
                onClick={onOpenTour}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                title="Show onboarding tour"
              >
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span className="sr-only">Open onboarding tour</span>
              </button>

              <button
                data-tour-target="settings-button"
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
            <div className="mt-4 space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-dark-background rounded-lg border border-gray-200 dark:border-dark-border">
                <div className="flex flex-col gap-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-dark-text">
                    Search radius
                  </label>
                  <select
                    value={radius}
                    onChange={(event) => {
                      setRadius(Number(event.target.value));
                      onRestaurantSelected(null);
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-dark-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-dark-primary focus:border-transparent bg-white dark:bg-dark-card dark:text-dark-text"
                  >
                    <option value={500}>500m</option>
                    <option value={1000}>1km</option>
                    <option value={2000}>2km</option>
                    <option value={5000}>5km</option>
                  </select>
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-dark-background rounded-lg border border-gray-200 dark:border-dark-border">
                <div className="flex flex-col gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-dark-text">
                      Filters
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-dark-text-secondary">
                      Exclude restaurants by brand, cuisine, amenity, or keyword to tailor suggestions.
                    </p>
                  </div>

                  <div className="flex flex-col md:flex-row gap-3">
                    <select
                      value={newFilterField}
                      onChange={(event) => setNewFilterField(event.target.value as FilterField)}
                      className="px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md text-sm bg-white dark:bg-dark-card dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-dark-primary"
                    >
                      <option value="name">Name</option>
                      <option value="cuisine">Cuisine</option>
                      <option value="amenity">Amenity</option>
                      <option value="keyword">Keyword</option>
                    </select>

                    <input
                      value={newFilterValue}
                      onChange={(event) => setNewFilterValue(event.target.value)}
                      placeholder="e.g. Tim Hortons"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md text-sm bg-white dark:bg-dark-card dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-dark-primary"
                    />

                    <button
                      onClick={() => {
                        if (!canAddFilter) {
                          return;
                        }
                        onAddFilterRule(newFilterField, newFilterValue);
                        setNewFilterValue('');
                      }}
                      disabled={!canAddFilter}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                        canAddFilter
                          ? 'bg-blue-600 hover:bg-blue-700 dark:bg-dark-primary dark:hover:bg-orange-600 text-white'
                          : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Add filter
                    </button>
                  </div>

                  {filterRules.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {filterRules.map((rule) => (
                        <span
                          key={rule.id}
                          className="inline-flex items-center gap-2 px-3 py-1 text-xs rounded-full bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text"
                        >
                          <span className="font-medium capitalize">{rule.field}</span>
                          <span className="text-gray-500 dark:text-dark-text-secondary">{rule.value}</span>
                          <button
                            onClick={() => onRemoveFilterRule(rule.id)}
                            className="text-gray-400 hover:text-red-500"
                            aria-label={`Remove filter ${rule.value}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-dark-text-secondary">
                      No filters active.
                    </p>
                  )}

                  {filterRules.length > 0 && (
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-dark-text-secondary">
                      <span>{hiddenByFiltersCount} hidden by filters</span>
                      <button
                        onClick={onClearFilterRules}
                        className="text-blue-600 dark:text-dark-primary hover:underline"
                      >
                        Clear all filters
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* View Mode Tabs */}
          <div
            className="mt-4 flex flex-wrap gap-2"
            data-tour-target="view-mode-tabs"
          >
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
            <button
              onClick={() => setViewMode('history')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                viewMode === 'history' 
                  ? 'bg-amber-500 dark:bg-orange-500 text-white shadow-md' 
                  : 'bg-white dark:bg-dark-card text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-dark-border'
              }`}
              data-tour-target="history-tab"
            >
              <History className="w-4 h-4" />
              History
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
              <div
                data-tour-target="map-container"
                className="h-[calc(100vh-180px)] min-h-[400px] bg-white dark:bg-dark-card rounded-xl shadow-lg overflow-hidden"
              >
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
                    onMarkVisited={onMarkRestaurantVisited}
                  />
                ))}
              </div>
            )}

            {viewMode === 'random' && (
              <div className="flex justify-center">
                <RandomPicker 
                  restaurants={restaurants}
                  onRestaurantSelected={handleRandomPickResult}
                  onMarkVisited={onMarkRestaurantVisited}
                />
              </div>
            )}

            {viewMode === 'wheel' && (
              <div className="flex justify-center">
                <SpinWheel 
                  restaurants={restaurants}
                  onRestaurantSelected={handleSpinWheelResult}
                  onMarkVisited={onMarkRestaurantVisited}
                />
              </div>
            )}

            {viewMode === 'history' && (
              <div className="bg-white dark:bg-dark-card rounded-xl shadow-lg p-6 border border-gray-100 dark:border-dark-border">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text">Visited restaurants</h2>
                    <p className="text-sm text-gray-500 dark:text-dark-text-secondary">
                      Manage your saved places or clear the list to rediscover them in search results.
                    </p>
                  </div>
                  {visitedRestaurants.length > 0 && (
                    <button
                      onClick={onClearVisitedRestaurants}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900 transition-colors duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear history
                    </button>
                  )}
                </div>

                {visitedRestaurants.length === 0 ? (
                  <div className="text-center py-10 text-gray-500 dark:text-dark-text-secondary">
                    You have not marked any restaurants as visited yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {visitedRestaurants.map((restaurant) => (
                      <div
                        key={restaurant.id}
                        className="border border-gray-200 dark:border-dark-border rounded-xl p-4 bg-gray-50 dark:bg-dark-background"
                      >
                        <h3 className="text-base font-semibold text-gray-900 dark:text-dark-text mb-1">
                          {restaurant.name}
                        </h3>
                        {restaurant.cuisine && (
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">{restaurant.cuisine}</p>
                        )}
                        {restaurant.address && (
                          <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-2">{restaurant.address}</p>
                        )}
                        <button
                          onClick={() => onRemoveVisitedRestaurant(restaurant.id)}
                          className="mt-2 inline-flex items-center justify-center w-full px-3 py-2 text-sm font-medium text-blue-600 dark:text-dark-primary bg-white dark:bg-dark-card border border-blue-200 dark:border-dark-border rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-200"
                        >
                          Return to results
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      <OnboardingTour isOpen={tourOpen} onClose={onTourClose} />
    </div>
  );
};

export default RestaurantsPage;
