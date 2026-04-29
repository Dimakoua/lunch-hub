import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { MapPin, List, Shuffle, RotateCcw, Settings, Sun, Moon, History, Trash2, Share2, Loader2, ChevronLeft, Navigation, Route } from 'lucide-react';
import { RestaurantCard } from '../components/RestaurantCard';
import { MapView } from '../components/MapView';
import { SpinWheel } from '../components/SpinWheel';
import { RandomPicker } from '../components/RandomPicker';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Breadcrumb } from '../components/Breadcrumb';
import { Restaurant, Location } from '../types/restaurant';
import { FilterRule, FilterField } from '../types/filter';
import { trackRestaurantView, trackSpinWheel, trackRandomPick } from '../services/analytics';
import { fetchRoute } from '../services/routing'; // Import fetchRoute
import { OnboardingTour } from '../components/OnboardingTour';
import { shareRestaurant } from '../utils/share'; // Added shareRestaurant

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
  filterByOpenNow: boolean;
  setFilterByOpenNow: (value: boolean) => void;
  tourOpen: boolean;
  onTourClose: () => void;
  onRetry: () => void;
}

// ── Inline helpers ──────────────────────────────────────────────────────────
function calcDist(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmtDist(m: number) { return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`; }
function fmtWalk(m: number) { const mins = Math.max(1, Math.round(m / 80)); return `${mins} min`; }

interface HistoryCardProps {
  restaurant: Restaurant;
  userLat: number;
  userLon: number;
  onRemove: (id: string) => void;
}

const HistoryCard: React.FC<HistoryCardProps> = ({ restaurant, userLat, userLon, onRemove }) => {
  const dist = calcDist(userLat, userLon, restaurant.lat, restaurant.lon);
  return (
    <>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
          <History className="w-4 h-4 text-amber-500" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-text truncate">{restaurant.name}</h3>
          {restaurant.cuisine && (
            <span className="inline-block text-[11px] bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 px-2 py-0.5 rounded-full mt-0.5">
              {restaurant.cuisine}
            </span>
          )}
        </div>
        <div className="flex-shrink-0 flex flex-col items-end gap-0.5">
          <span className="text-xs font-semibold text-gray-700 dark:text-dark-text">{fmtDist(dist)}</span>
          <span className="text-[11px] text-gray-400 dark:text-dark-text-secondary">{fmtWalk(dist)} walk</span>
        </div>
      </div>
      {restaurant.address && (
        <p className="text-xs text-gray-500 dark:text-dark-text-secondary line-clamp-2 pl-12">{restaurant.address}</p>
      )}
      <button
        onClick={() => onRemove(restaurant.id)}
        className="mt-1 inline-flex items-center justify-center w-full px-3 py-2 text-sm font-medium text-blue-600 dark:text-dark-primary bg-blue-50 dark:bg-dark-primary/10 hover:bg-blue-100 dark:hover:bg-dark-primary/20 rounded-lg transition-colors duration-200"
      >
        Restore to results
      </button>
    </>
  );
};

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
  tourOpen,
  onTourClose,
  filterByOpenNow,
  setFilterByOpenNow,
  onRetry
}) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://thelunchub.com';
  const [routeGeometry, setRouteGeometry] = useState<[number, number][] | null>(null);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  const [routeDuration, setRouteDuration] = useState<number | null>(null);
  const [newFilterField, setNewFilterField] = useState<FilterField>('name');
  const [newFilterValue, setNewFilterValue] = useState('');
  const [showFilterSuggestions, setShowFilterSuggestions] = useState(false);
  const canAddFilter = newFilterValue.trim().length > 0;

  // Compute suggestions based on current restaurants and selected category
  const filterSuggestions = useMemo(() => {
    if (newFilterField === 'keyword') return [];
    
    const values = new Set<string>();
    restaurants.forEach(r => {
      if (newFilterField === 'name' && r.name) values.add(r.name);
      if (newFilterField === 'cuisine' && r.cuisine) {
        // Cuisines can be semicolon separated in OSM
        r.cuisine.split(';').forEach(c => values.add(c.trim()));
      }
      if (newFilterField === 'amenity' && r.amenity) values.add(r.amenity);
    });

    const query = newFilterValue.toLowerCase().trim();
    return Array.from(values)
      .filter(v => v.toLowerCase().includes(query))
      .sort((a, b) => a.localeCompare(b))
      .slice(0, 10); // Limit to 10 suggestions
  }, [restaurants, newFilterField, newFilterValue]);

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

  const handleTourStepChange = useCallback((stepIndex: number) => {
    // Step 0 is map-container, so force map view
    if (stepIndex === 0) {
      setViewMode('map');
    } else {
      // Other steps are header-based, better to be in list view to ensure header is visible and stable
      setViewMode('list');
    }
  }, [setViewMode]);

  const isPWA = typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches;

  const viewModeLabels: Record<ViewMode, string> = {
    map: 'Map',
    list: 'List',
    wheel: 'Spin Wheel',
    random: 'Random',
    history: 'History',
  };

  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'Restaurants' },
    { name: viewModeLabels[viewMode] },
  ];

  React.useEffect(() => {
    setShowSettings(viewMode === 'map');
  }, [viewMode, setShowSettings]);

  const settingsPanel = showSettings && (
    <div className="space-y-4">
      <div className="p-3 bg-gray-50 dark:bg-dark-background rounded-lg border border-gray-200 dark:border-dark-border">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-dark-text-secondary">
            Search radius
          </label>
          <select
            value={radius}
            onChange={(event) => {
              setRadius(Number(event.target.value));
              onRestaurantSelected(null);
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-dark-primary bg-white dark:bg-dark-card dark:text-dark-text"
          >
            <option value={500}>500m</option>
            <option value={1000}>1km</option>
            <option value={2000}>2km</option>
            <option value={5000}>5km</option>
          </select>
        </div>
      </div>

      <div className="p-3 bg-gray-50 dark:bg-dark-background rounded-lg border border-gray-200 dark:border-dark-border">
        <div className="flex items-center justify-between">
          <label htmlFor="open-now-filter" className="flex items-center cursor-pointer">
            <span className="text-sm font-medium text-gray-700 dark:text-dark-text mr-3">
              Open now only
            </span>
            <div className="relative">
              <input
                type="checkbox"
                id="open-now-filter"
                className="sr-only"
                checked={filterByOpenNow}
                onChange={(e) => setFilterByOpenNow(e.target.checked)}
              />
              <div
                className={`block w-9 h-5 rounded-full transition ${
                  filterByOpenNow ? 'bg-blue-500 dark:bg-dark-primary' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              ></div>
              <div
                className={`dot absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition ${
                  filterByOpenNow ? 'translate-x-4' : ''
                }`}
              ></div>
            </div>
          </label>
        </div>
      </div>

      <div className="p-3 bg-gray-50 dark:bg-dark-background rounded-lg border border-gray-200 dark:border-dark-border">
        <div className="flex flex-col gap-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-dark-text-secondary">
              Filters
            </h3>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex gap-1.5 items-stretch relative">
              <select
                value={newFilterField}
                onChange={(event) => setNewFilterField(event.target.value as FilterField)}
                className="w-20 px-1.5 py-1 border border-gray-300 dark:border-dark-border rounded-md text-[10px] font-black uppercase tracking-tight bg-gray-50 dark:bg-gray-800 dark:text-dark-text focus:outline-none transition-colors cursor-pointer"
              >
                <option value="name">Name</option>
                <option value="cuisine">Cuisine</option>
                <option value="amenity">Amenity</option>
                <option value="keyword">Keyword</option>
              </select>

              <div className="flex-1 min-w-0 relative group">
                <input
                  value={newFilterValue}
                  onChange={(event) => {
                    setNewFilterValue(event.target.value);
                    setShowFilterSuggestions(true);
                  }}
                  onFocus={() => setShowFilterSuggestions(true)}
                  onBlur={() => {
                    // Delay hiding to allow for click on suggestion
                    setTimeout(() => setShowFilterSuggestions(false), 200);
                  }}
                  placeholder="Value..."
                  className="w-full px-2 py-1 border border-gray-300 dark:border-dark-border rounded-md text-xs bg-white dark:bg-dark-card dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-blue-500 transition-shadow"
                  autoComplete="disabled"
                  name={`filter-value-${newFilterField}`}
                  id={`filter-value-${newFilterField}`}
                />

                {showFilterSuggestions && filterSuggestions.length > 0 && (
                  <div className="fixed bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-md shadow-xl z-50 max-h-40 overflow-y-auto ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100" style={{
                    width: `${document.getElementById(`filter-value-${newFilterField}`)?.getBoundingClientRect().width ?? 0}px`,
                  }}>
                    {filterSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => {
                          onAddFilterRule(newFilterField, suggestion);
                          setNewFilterValue('');
                          setShowFilterSuggestions(false);
                        }}
                        className="w-full text-left px-2 py-1.5 text-[11px] hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:text-dark-text transition-colors border-b border-gray-50 dark:border-gray-700/50 last:border-0"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  if (!canAddFilter) return;
                  onAddFilterRule(newFilterField, newFilterValue);
                  setNewFilterValue('');
                  setShowFilterSuggestions(false);
                }}
                disabled={!canAddFilter}
                className={`flex-shrink-0 px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${
                  canAddFilter
                    ? 'bg-blue-600 dark:bg-dark-primary text-white shadow-sm hover:bg-blue-700 active:scale-95'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                }`}
              >
                Add
              </button>
            </div>
          </div>

          {filterRules.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {filterRules.map((rule) => (
                <span
                  key={rule.id}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] rounded-md bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text shadow-sm"
                >
                  <span className="font-bold uppercase opacity-60">{rule.field}</span>
                  <span className="truncate max-w-[80px]">{rule.value}</span>
                  <button
                    onClick={() => onRemoveFilterRule(rule.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors ml-0.5"
                    aria-label={`Remove filter ${rule.value}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-gray-400 italic">No filters active.</p>
          )}

          {filterRules.length > 0 && (
            <button
              onClick={onClearFilterRules}
              className="text-[11px] font-bold text-blue-600 dark:text-dark-primary hover:underline text-left mt-1"
            >
              Clear all filters ({hiddenByFiltersCount} hidden)
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const tabBase = 'px-2 sm:px-3 py-2 rounded-full font-medium transition-all duration-200 flex items-center gap-1.5 text-[11px] sm:text-sm min-w-0';
  const tabInactive = 'bg-white dark:bg-dark-card text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-dark-border';

  const viewModeTabs = (
    <div className="fixed left-3 right-3 bottom-20 z-[9999] flex justify-center lg:left-1/2 lg:right-auto lg:-translate-x-1/2 lg:transform lg:bottom-8">
      <div className="max-w-[calc(100vw-1.5rem)] lg:w-auto lg:max-w-xl flex items-center justify-center gap-0.5 bg-white/95 dark:bg-dark-card/95 backdrop-blur-md rounded-full shadow-xl px-1.5 py-1 border border-gray-200/70 dark:border-dark-border/70 overflow-hidden">
      <button
        onClick={() => setViewMode('map')}
        className={`${tabBase} ${
          viewMode === 'map'
            ? 'bg-gradient-to-r from-blue-600 to-blue-700 dark:from-dark-primary dark:to-orange-600 text-white shadow-md'
            : tabInactive
        }`}
      >
        <MapPin className="w-4 h-4" />
        <span className="hidden sm:inline">Map</span>
      </button>
      <button
        onClick={() => setViewMode('list')}
        className={`${tabBase} ${
          viewMode === 'list'
            ? 'bg-gradient-to-r from-blue-600 to-blue-700 dark:from-dark-primary dark:to-orange-600 text-white shadow-md'
            : tabInactive
        }`}
      >
        <List className="w-4 h-4" />
        <span className="hidden sm:inline">List</span>
      </button>
      <button
        onClick={() => setViewMode('random')}
        className={`${tabBase} ${
          viewMode === 'random'
            ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md'
            : tabInactive
        }`}
      >
        <Shuffle className="w-4 h-4" />
        <span className="hidden sm:inline">Random</span>
      </button>
      <button
        onClick={() => setViewMode('wheel')}
        className={`${tabBase} ${
          viewMode === 'wheel'
            ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-md'
            : tabInactive
        }`}
      >
        <RotateCcw className="w-4 h-4" />
        <span className="hidden sm:inline">Wheel</span>
      </button>
      <button
        onClick={() => setViewMode('history')}
        className={`${tabBase} ${
          viewMode === 'history'
            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
            : tabInactive
        }`}
        data-tour-target="history-tab"
      >
        <History className="w-4 h-4" />
        <span className="hidden sm:inline">History</span>
      </button>
    </div>  </div>  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-background pb-24 lg:pb-0">
      <Helmet>
        <title>Lunch Hub - Restaurants Near You</title>
        <meta name="description" content={`Found ${restaurants.length} restaurants near you. Explore on map, browse list, or use our fun selection tools!`} />
        <meta name="keywords" content="restaurants near me, lunch map, restaurant list, find food, nearby eateries" />
        <link rel="canonical" href={`${origin}${window.location.pathname}`} />
      </Helmet>
      
      {/* Selected restaurant banner removed — sharing now available in the map popup. */}

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {viewMode !== 'map' && (
          <div className="mb-6">
            <Breadcrumb items={breadcrumbItems} className="mb-4" />
          </div>
        )}
        {viewMode !== 'map' && showSettings && (
          <div className="mb-6 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-3xl shadow-xl p-4">
            {settingsPanel}
          </div>
        )}
        {loading ? (
          <LoadingSpinner message="Finding restaurants..." />
        ) : error ? (
          <div className="bg-red-50 border border-red-200 dark:bg-red-900/30 dark:border-red-800 rounded-xl p-8 text-center flex flex-col items-center gap-4">
            <p className="text-red-700 dark:text-red-200 text-lg font-medium">{error}</p>
            <button
              onClick={onRetry}
              disabled={loading}
              className="mt-2 inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-bold shadow-md transition-all duration-200 hover:scale-105 active:scale-95 disabled:scale-100 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <RotateCcw className="w-5 h-5" />
              )}
              {loading ? 'Retrying...' : 'Retry Search'}
            </button>
          </div>
        ) : (
          <>
            {viewMode === 'map' && (
              <div
                data-tour-target="map-container"
                className="fixed inset-0 z-40"
              >
                {/* Full-screen map */}
                <div className="absolute inset-0">
                  <MapView 
                    center={[location.lat, location.lon]}
                    restaurants={restaurants}
                    selectedRestaurant={selectedRestaurant}
                    onRestaurantSelected={onRestaurantSelected}
                    onMarkVisited={onMarkRestaurantVisited}
                    routeGeometry={routeGeometry}
                    routeDistance={routeDistance}
                    routeDuration={routeDuration}
                    radius={radius}
                    breadcrumbItems={breadcrumbItems}
                  />
                </div>

                {/* Left Floating Sidebar HUD */}
                <div className={`absolute inset-x-3 sm:inset-x-4 z-[9999] max-w-sm sm:w-72 md:w-80 flex flex-col gap-3 top-3 sm:top-4`}>
                  <div className="bg-white/90 dark:bg-dark-card/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/60 dark:border-dark-border/60 flex flex-col overflow-hidden">
                    {/* HUD Header */}
                    <div className="px-2 py-2 sm:px-4 sm:py-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-700/50 flex-shrink-0">
                      <button
                        onClick={() => setViewMode('list')}
                        className="flex items-center gap-1 text-xs sm:gap-1.5 sm:text-sm font-bold text-blue-600 dark:text-dark-primary hover:scale-105 transition-transform"
                      >
                        <ChevronLeft className="w-4 h-4 stroke-[3px]" />
                        <span className="hidden sm:inline">List</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          data-tour-target="settings-button"
                          onClick={() => setShowSettings(!showSettings)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            showSettings
                              ? 'bg-blue-100 dark:bg-dark-primary/20 text-blue-600 dark:text-dark-primary'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-dark-text-secondary'
                          }`}
                          aria-label="Filters"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button
                          onClick={toggleTheme}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-dark-text-secondary transition-colors"
                          aria-label="Toggle theme"
                        >
                          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-yellow-400" />}
                        </button>
                      </div>
                    </div>

                    {/* Stats section */}
                    <div className="px-4 py-2 bg-gray-50/50 dark:bg-gray-800/30 flex items-center justify-between text-[11px] font-medium text-gray-500 dark:text-dark-text-secondary border-b border-gray-100 dark:border-gray-700/50 flex-shrink-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-900 dark:text-dark-text font-bold">{restaurants.length}</span>
                        <span>visible</span>
                        {hiddenByHistoryCount + hiddenByFiltersCount > 0 && (
                          <span className="opacity-60">
                            ({hiddenByHistoryCount + hiddenByFiltersCount} hidden)
                          </span>
                        )}
                      </div>
                      <span>{radius}m radius</span>
                    </div>

                    {/* Settings / Filters Panel - Expands inside sidebar */}
                    {settingsPanel && (
                      <div className={`p-4 overflow-y-auto ${isPWA ? 'max-h-[calc(100dvh-18rem)]' : 'max-h-[calc(100dvh-12rem)]'}`}>
                        {settingsPanel}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right-side floating map actions */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 z-[9999] flex flex-col gap-2">
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('lunchhub:recenter'))}
                    className="w-10 h-10 flex items-center justify-center bg-white dark:bg-dark-card shadow-md rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200/50 dark:border-dark-border/50"
                    aria-label="Recenter map"
                    title="Recenter"
                  >
                    <Navigation className="w-5 h-5 text-blue-600 dark:text-dark-primary" />
                  </button>
                  {routeGeometry && (
                    <button
                      onClick={() => window.dispatchEvent(new CustomEvent('lunchhub:fitRoute', { detail: routeGeometry }))}
                      className="w-10 h-10 flex items-center justify-center bg-white dark:bg-dark-card shadow-md rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200/50 dark:border-dark-border/50"
                      aria-label="Fit route"
                      title="Fit route"
                    >
                      <Route className="w-5 h-5 text-emerald-600" />
                    </button>
                  )}
                  {selectedRestaurant && (
                    <button
                      onClick={() => shareRestaurant(selectedRestaurant)}
                      className="w-10 h-10 flex items-center justify-center bg-white dark:bg-dark-card shadow-md rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200/50 dark:border-dark-border/50"
                      aria-label="Share restaurant"
                      title="Share"
                    >
                      <Share2 className="w-5 h-5 text-purple-600" />
                    </button>
                  )}
                </div>

              </div>
            )}

            {viewMode === 'list' && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-dark-text">
                    Nearby restaurants
                    <span className="ml-2 text-sm font-normal text-gray-400 dark:text-dark-text-secondary">
                      {restaurants.length} visible
                      {hiddenByHistoryCount + hiddenByFiltersCount > 0 && ` (${hiddenByHistoryCount + hiddenByFiltersCount} hidden)`}
                    </span>
                  </h2>
                </div>
                {restaurants.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-dark-text-secondary gap-3">
                    <MapPin className="w-10 h-10 opacity-30" />
                    <p className="text-base">No restaurants found in this area.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {restaurants.map((restaurant) => (
                      <RestaurantCard
                        key={restaurant.id}
                        restaurant={restaurant}
                        userLat={location.lat}
                        userLon={location.lon}
                        onViewOnMap={(restaurantToView) => {
                          trackRestaurantView(restaurantToView.name, 'map');
                          onViewOnMap(restaurantToView);
                        }}
                        onMarkVisited={onMarkRestaurantVisited}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {viewMode === 'random' && (
              <div className="flex flex-col items-center gap-2">
                <div className="w-full max-w-lg">
                  <div className="mb-4 text-center">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-dark-text">Random pick</h2>
                    <p className="text-sm text-gray-500 dark:text-dark-text-secondary">Let luck decide your lunch from {restaurants.length} options</p>
                  </div>
                  <RandomPicker 
                    restaurants={restaurants}
                    onRestaurantSelected={handleRandomPickResult}
                    onMarkVisited={onMarkRestaurantVisited}
                  />
                </div>
              </div>
            )}

            {viewMode === 'wheel' && (
              <div className="flex flex-col items-center gap-2">
                <div className="w-full max-w-2xl">
                  <div className="mb-4 text-center">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-dark-text">Spin the wheel</h2>
                    <p className="text-sm text-gray-500 dark:text-dark-text-secondary">Give it a spin and see where lunch takes you</p>
                  </div>
                  <SpinWheel 
                    restaurants={restaurants}
                    onRestaurantSelected={handleSpinWheelResult}
                    onMarkVisited={onMarkRestaurantVisited}
                  />
                </div>
              </div>
            )}

            {viewMode === 'history' && (
              <>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text">Visited restaurants</h2>
                    <p className="text-sm text-gray-500 dark:text-dark-text-secondary">
                      {visitedRestaurants.length === 0
                        ? 'Mark restaurants as visited to track them here.'
                        : `${visitedRestaurants.length} place${visitedRestaurants.length !== 1 ? 's' : ''} visited — restore any to see it in results again.`}
                    </p>
                  </div>
                  {visitedRestaurants.length > 0 && (
                    <button
                      onClick={onClearVisitedRestaurants}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/40 transition-colors duration-200 self-start md:self-auto"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear all
                    </button>
                  )}
                </div>

                {visitedRestaurants.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-dark-text-secondary gap-3">
                    <History className="w-10 h-10 opacity-30" />
                    <p className="text-base">No visited restaurants yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {visitedRestaurants.map((restaurant) => (
                      <div
                        key={restaurant.id}
                        className="bg-white dark:bg-dark-card rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 dark:border-dark-border p-5 flex flex-col gap-2"
                      >
                        <HistoryCard
                          restaurant={restaurant}
                          userLat={location.lat}
                          userLon={location.lon}
                          onRemove={onRemoveVisitedRestaurant}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      {viewModeTabs}

      <div className="fixed right-4 bottom-32 z-[9999] flex flex-col gap-2 lg:bottom-10">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="w-12 h-12 rounded-2xl bg-white dark:bg-dark-card shadow-xl border border-gray-200/70 dark:border-dark-border/70 flex items-center justify-center text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          aria-label="Toggle filters"
        >
          <Settings className="w-5 h-5" />
        </button>
        <button
          onClick={toggleTheme}
          className="w-12 h-12 rounded-2xl bg-white dark:bg-dark-card shadow-xl border border-gray-200/70 dark:border-dark-border/70 flex items-center justify-center text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-yellow-400" />}
        </button>
      </div>

      <OnboardingTour 
        isOpen={tourOpen} 
        onClose={onTourClose} 
        onStepChange={handleTourStepChange}
      />
    </div>
  );
};

export default RestaurantsPage;
