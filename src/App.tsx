import React, { useState, useEffect, lazy, Suspense, useMemo, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { CookieConsent } from './components/CookieConsent';
import { InstallPWA } from './components/InstallPWA';
import { BottomNav } from './components/BottomNav';
import { Footer } from './components/Footer';

const HomePage = lazy(() => import('./pages/HomePage'));
const RestaurantsPage = lazy(() => import('./pages/RestaurantsPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'));
import { geocodeAddress, getCurrentLocation } from './services/geocoding';
import { fetchRestaurants } from './services/restaurants';
import { 
  grantConsent,
  revokeConsent,
  trackPageView,
  trackRestaurantSearch,
  trackLocationPermission 
} from './services/analytics';
import { Restaurant, Location } from './types/restaurant';
import { FilterRule, FilterField } from './types/filter';
import { isRestaurantOpen } from './utils/openingHours'; // NEW IMPORT

type ViewMode = 'map' | 'list' | 'wheel' | 'random' | 'history';
type Theme = 'light' | 'dark';

function App() {
  const navigate = useNavigate();
  const pageLocation = useLocation();
  const ONBOARDING_STORAGE_KEY = 'lunch-hub-tour-seen';
  const [showTour, setShowTour] = useState(false);
  const [location, setLocation] = useState<Location | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [radius, setRadius] = useState(1000); // 1km default
  const [showSettings, setShowSettings] = useState(true);
  const [filterByOpenNow, setFilterByOpenNow] = useState(false); // NEW STATE
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    return savedTheme || 'light';
  });
  const [showCookieConsent, setShowCookieConsent] = useState(false);
  const VISITED_STORAGE_KEY = 'lunch-hub-visited-restaurants';
  const FILTER_STORAGE_KEY = 'lunch-hub-filter-rules';
  const HISTORY_EMPTY_MESSAGE = 'All nearby restaurants are already in your visited history. Remove saved places to see them again.';
  const FILTER_EMPTY_MESSAGE = 'All nearby restaurants were filtered out by your preferences. Adjust filters to see more options.';
  const [visitedRestaurants, setVisitedRestaurants] = useState<Restaurant[]>(() => {
    if (typeof window === 'undefined') {
      return [];
    }
    const stored = window.localStorage.getItem(VISITED_STORAGE_KEY);
    if (!stored) {
      return [];
    }
    try {
      const parsed: Restaurant[] = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn('Failed to parse visited restaurants from storage', err);
      return [];
    }
  });
  const [filterRules, setFilterRules] = useState<FilterRule[]>(() => {
    if (typeof window === 'undefined') {
      return [];
    }
    const stored = window.localStorage.getItem(FILTER_STORAGE_KEY);
    if (!stored) {
      return [];
    }
    try {
      const parsed: FilterRule[] = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn('Failed to parse filters from storage', err);
      return [];
    }
  });

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    if (pageLocation.pathname !== '/restaurants') {
      return;
    }
    if (showTour) {
      return;
    }
    const seenTour = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!seenTour) {
      setShowTour(true);
    }
  }, [pageLocation.pathname, showTour]);

  const handleTourClose = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    }
    setShowTour(false);
  };

  const openTour = () => {
    setViewMode('map');
    setShowTour(true);
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(VISITED_STORAGE_KEY, JSON.stringify(visitedRestaurants));
    } catch (err) {
      console.warn('Failed to persist visited restaurants to storage', err);
    }
  }, [visitedRestaurants]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filterRules));
    } catch (err) {
      console.warn('Failed to persist filters to storage', err);
    }
  }, [filterRules]);

  // Check cookie consent on app load
  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShowCookieConsent(true);
    }
  }, []);

  // Track page views
  useEffect(() => {
    const path = window.location.pathname;
    const title = document.title;
    trackPageView(path, title);
  }, [pageLocation.pathname]);

  const handleCookieAccept = () => {
    setShowCookieConsent(false);
    grantConsent();
  };

  const handleCookieDecline = () => {
    setShowCookieConsent(false);
    revokeConsent();
  };

  const shouldExcludeByFilter = useCallback((restaurantItem: Restaurant, rule: FilterRule) => {
    const value = rule.value?.trim().toLowerCase();
    if (!value) {
      return false;
    }

    const matchers: Record<FilterField, string | undefined> = {
      name: restaurantItem.name,
      cuisine: restaurantItem.cuisine,
      amenity: restaurantItem.amenity,
      keyword: [
        restaurantItem.name,
        restaurantItem.cuisine,
        restaurantItem.amenity,
        restaurantItem.address,
        restaurantItem.opening_hours,
      ]
        .filter(Boolean)
        .join(' '),
    };

    const source = matchers[rule.field];
    if (!source) {
      return false;
    }
    return source.toLowerCase().includes(value);
  }, []);

  const applyAvailabilityFilters = useCallback((restaurantList: Restaurant[], openNow?: boolean) => {
    let filtered = restaurantList.filter(
      (restaurantItem) => !visitedRestaurants.some((visited) => visited.id === restaurantItem.id)
    );

    if (filterRules.length > 0) {
      filtered = filtered.filter(
        (restaurantItem) => !filterRules.some((rule) => shouldExcludeByFilter(restaurantItem, rule))
      );
    }

    const checkOpenNow = openNow !== undefined ? openNow : filterByOpenNow;
    if (checkOpenNow) {
      filtered = filtered.filter((restaurant) => isRestaurantOpen(restaurant));
    }

    return filtered;
  }, [visitedRestaurants, filterRules, shouldExcludeByFilter, filterByOpenNow]);

  const searchRestaurants = useCallback(async (lat: number, lon: number, searchRadius?: number, openNow?: boolean, forceRefresh: boolean = false) => {
    try {
      const currentRadius = searchRadius !== undefined ? searchRadius : radius;
      const foundRestaurants = await fetchRestaurants(lat, lon, currentRadius, forceRefresh);
      setRestaurants(foundRestaurants);
      if (foundRestaurants.length === 0) {
        setError('No restaurants found in this area. Try increasing the search radius.');
        return 0;
      }
      const availableAfterFilters = applyAvailabilityFilters(foundRestaurants, openNow);
      if (availableAfterFilters.length === 0) {
        if (filterRules.length > 0) {
          setError(FILTER_EMPTY_MESSAGE);
        } else {
          setError(HISTORY_EMPTY_MESSAGE);
        }
      } else {
        setError(null);
      }
      return availableAfterFilters.length;
    } catch {
      setError('Error finding restaurants. Please try again.');
      return 0;
    }
  }, [radius, applyAvailabilityFilters, filterRules.length]);

  const handleSearch = async (query: string, searchRadius?: number, openNow?: boolean) => {
    setLoading(true);
    setError(null);
    if (searchRadius !== undefined) setRadius(searchRadius);
    if (openNow !== undefined) setFilterByOpenNow(openNow);
    
    try {
      const result = await geocodeAddress(query);
      if (result) {
        setLocation(result);
        const availableCount = await searchRestaurants(
          result.lat, 
          result.lon, 
          searchRadius !== undefined ? searchRadius : radius,
          openNow !== undefined ? openNow : filterByOpenNow
        );
        trackRestaurantSearch(query, availableCount);
        navigate('/restaurants');
      } else {
        setError('Location not found. Please try a different address.');
      }
    } catch {
      setError('Error searching for location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCurrentLocation = async (searchRadius?: number, openNow?: boolean) => {
    setLoading(true);
    setError(null);
    if (searchRadius !== undefined) setRadius(searchRadius);
    if (openNow !== undefined) setFilterByOpenNow(openNow);

    try {
      const position = await getCurrentLocation();
      const newLocation = { lat: position.lat, lon: position.lon };
      setLocation(newLocation);
      const availableCount = await searchRestaurants(
        position.lat,
        position.lon,
        searchRadius !== undefined ? searchRadius : radius,
        openNow !== undefined ? openNow : filterByOpenNow
      );
      trackLocationPermission(true);
      trackRestaurantSearch('current_location', availableCount);
      navigate('/restaurants');
    } catch {
      trackLocationPermission(false);
      setError('Unable to get your location. Please enter an address manually.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewOnMap = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setViewMode('map');
  };

  const handleRestaurantSelected = (restaurant: Restaurant | null): void => {
    setSelectedRestaurant(restaurant);
    if (restaurant) {
      setViewMode('map');
    }
  };

  // Auto-search when radius changes
  useEffect(() => {
    if (location) {
      searchRestaurants(location.lat, location.lon);
    }
  }, [radius, location, searchRestaurants]);

  const availableRestaurants = useMemo(
    () => applyAvailabilityFilters(restaurants),
    [restaurants, applyAvailabilityFilters]
  );

  const hiddenByHistoryCount = useMemo(
    () => restaurants.filter((restaurantItem) => visitedRestaurants.some((visited) => visited.id === restaurantItem.id)).length,
    [restaurants, visitedRestaurants]
  );

  const hiddenByFiltersCount = useMemo(
    () => {
      if (filterRules.length === 0) {
        return 0;
      }
      const withoutVisited = restaurants.filter(
        (restaurantItem) => !visitedRestaurants.some((visited) => visited.id === restaurantItem.id)
      );
      return withoutVisited.filter((restaurantItem) =>
        filterRules.some((rule) => shouldExcludeByFilter(restaurantItem, rule))
      ).length;
    },
    [restaurants, visitedRestaurants, filterRules, shouldExcludeByFilter]
  );

  useEffect(() => {
    if (restaurants.length === 0) {
      return;
    }
    if (availableRestaurants.length === 0) {
      const message = filterRules.length > 0 ? FILTER_EMPTY_MESSAGE : HISTORY_EMPTY_MESSAGE;
      setError((prev) => (prev === message ? prev : message));
    } else if (error && (error === HISTORY_EMPTY_MESSAGE || error === FILTER_EMPTY_MESSAGE)) {
      setError(null);
    }
  }, [availableRestaurants, restaurants.length, error, filterRules.length]);

  const markRestaurantVisited = (restaurant: Restaurant) => {
    setVisitedRestaurants((prev) => {
      if (prev.some((item) => item.id === restaurant.id)) {
        return prev;
      }
      return [...prev, restaurant];
    });
  };

  const removeVisitedRestaurant = (restaurantId: string) => {
    setVisitedRestaurants((prev) => prev.filter((restaurantItem) => restaurantItem.id !== restaurantId));
  };

  const clearVisitedRestaurants = () => {
    setVisitedRestaurants([]);
  };

  const addFilterRule = (field: FilterField, value: string) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return;
    }
    setFilterRules((prev) => {
      const exists = prev.some(
        (rule) => rule.field === field && rule.value.toLowerCase() === trimmedValue.toLowerCase()
      );
      if (exists) {
        return prev;
      }
      const id = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      return [...prev, { id, field, value: trimmedValue }];
    });
  };

  const removeFilterRule = (ruleId: string) => {
    setFilterRules((prev) => prev.filter((rule) => rule.id !== ruleId));
  };

  const clearFilterRules = () => {
    setFilterRules([]);
  };

  const handleRetry = async () => {
    if (location) {
      setLoading(true);
      await searchRestaurants(location.lat, location.lon, undefined, undefined, true);
      setLoading(false);
    }
  };

  return (
    <div className="pb-16 lg:pb-0">
      {showCookieConsent && (
        <CookieConsent
          onAccept={handleCookieAccept}
          onDecline={handleCookieDecline}
        />
      )}
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route 
            path="/" 
            element={
              <HomePage
                onSearch={handleSearch}
                onCurrentLocation={handleCurrentLocation}
                loading={loading}
                error={error}
                theme={theme}
                toggleTheme={toggleTheme}
              />
            } 
          />
          <Route 
            path="/restaurants" 
            element={
              location ? (
                <RestaurantsPage
                  location={location}
                  loading={loading}
                  error={error}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                  selectedRestaurant={selectedRestaurant}
                  radius={radius}
                  setRadius={setRadius}
                  showSettings={showSettings}
                  setShowSettings={setShowSettings}
                  theme={theme}
                  toggleTheme={toggleTheme}
                  onViewOnMap={handleViewOnMap}
                  onRestaurantSelected={handleRestaurantSelected}
                  restaurants={availableRestaurants}
                  visitedRestaurants={visitedRestaurants}
                  filterRules={filterRules}
                  hiddenByHistoryCount={hiddenByHistoryCount}
                  hiddenByFiltersCount={hiddenByFiltersCount}
                  onMarkRestaurantVisited={markRestaurantVisited}
                  onRemoveVisitedRestaurant={removeVisitedRestaurant}
                  onClearVisitedRestaurants={clearVisitedRestaurants}
                  onAddFilterRule={addFilterRule}
                  onRemoveFilterRule={removeFilterRule}
                  onClearFilterRules={clearFilterRules}
                  filterByOpenNow={filterByOpenNow} // NEW PROP
                  setFilterByOpenNow={setFilterByOpenNow} // NEW PROP
                  onOpenTour={openTour}
                  tourOpen={showTour}
                  onTourClose={handleTourClose}
                  onRetry={handleRetry}
                />
              ) : (
                <HomePage
                  onSearch={handleSearch}
                  onCurrentLocation={handleCurrentLocation}
                  loading={loading}
                  error={error}
                  theme={theme}
                  toggleTheme={toggleTheme}
                />
              )
            }
          />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
        </Routes>
      </Suspense>
      <Footer />
      <InstallPWA />
      <BottomNav />
    </div>
  );
}

export default App;
