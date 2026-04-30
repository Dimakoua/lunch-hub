import { useState, useEffect, lazy, Suspense, useMemo, useCallback, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { CookieConsent } from './components/CookieConsent';
import { InstallPWA } from './components/InstallPWA';
import { BottomNav } from './components/BottomNav';
import { Footer } from './components/Footer';

const HomePage = lazy(() => import('./pages/HomePage'));
const RestaurantsPage = lazy(() => import('./pages/RestaurantsPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'));
const CityGuidePage = lazy(() => import('./pages/CityGuidePage'));
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
import { setImperialUnitsOverride, useImperialUnits } from './utils/distanceFormatter';

type ViewMode = 'map' | 'list' | 'wheel' | 'random' | 'history';
type Theme = 'light' | 'dark';

function App() {
  const navigate = useNavigate();
  const pageLocation = useLocation();
  const lastProcessedQueryRef = useRef<string | null>(null);
  const skipNextAutoSearchRef = useRef(false);
  const ONBOARDING_STORAGE_KEY = 'lunch-hub-tour-seen';
  const TOUR_DEMO_ID = '__tour_demo__';
  const TOUR_DEMO_RESTAURANT: Restaurant = {
    id: TOUR_DEMO_ID,
    name: 'The Lunch Spot (demo)',
    lat: 0,
    lon: 0,
    cuisine: 'Italian',
    address: '123 Example Street',
    amenity: 'restaurant',
  };
  const [showTour, setShowTour] = useState(false);
  const [location, setLocation] = useState<Location | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [radius, setRadius] = useState(1000); // 1km default
  const UNITS_STORAGE_KEY = 'lunch-hub-units';
  const [useImperial, setUseImperial] = useState<boolean>(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('lunch-hub-units') : null;
    const val = stored !== null ? stored === 'imperial' : useImperialUnits();
    setImperialUnitsOverride(val);
    return val;
  });
  const [showSettings, setShowSettings] = useState(true);
  const [filterByOpenNow, setFilterByOpenNow] = useState(false); // NEW STATE
  const [locationUpdating, setLocationUpdating] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    return savedTheme || 'light';
  });
  const [showCookieConsent, setShowCookieConsent] = useState(false);
  const VISITED_STORAGE_KEY = 'lunch-hub-visited-restaurants';
  const HIDDEN_STORAGE_KEY = 'lunch-hub-hidden-restaurants';
  const FILTER_STORAGE_KEY = 'lunch-hub-filter-rules';
  const HISTORY_EMPTY_MESSAGE = 'All nearby restaurants are already in your visited history. Remove saved places to see them again.';
  const FILTER_EMPTY_MESSAGE = 'All nearby restaurants were filtered out by your preferences. Adjust filters to see more options.';
  const [visitedRestaurants, setVisitedRestaurants] = useState<Restaurant[]>(() => {
    if (typeof window === 'undefined') return [];
    const stored = window.localStorage.getItem(VISITED_STORAGE_KEY);
    if (!stored) return [];
    try { const p: Restaurant[] = JSON.parse(stored); return Array.isArray(p) ? p : []; }
    catch { return []; }
  });
  const [hiddenRestaurants, setHiddenRestaurants] = useState<Restaurant[]>(() => {
    if (typeof window === 'undefined') return [];
    const stored = window.localStorage.getItem(HIDDEN_STORAGE_KEY);
    if (!stored) return [];
    try { const p: Restaurant[] = JSON.parse(stored); return Array.isArray(p) ? p : []; }
    catch { return []; }
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
    setVisitedRestaurants((prev) => prev.filter((r) => r.id !== TOUR_DEMO_ID));
    setShowTour(false);
  };

  const handleTourStepChange = (stepIndex: number) => {
    // Step 6 is "Track Your History" — inject demo entry so the tab isn't empty
    // Step 7 is "Restore a Restaurant" — also in history, keep demo visible
    if (stepIndex === 6 || stepIndex === 7) {
      setVisitedRestaurants((prev) =>
        prev.some((r) => r.id === TOUR_DEMO_ID) ? prev : [...prev, TOUR_DEMO_RESTAURANT]
      );
    } else {
      setVisitedRestaurants((prev) => prev.filter((r) => r.id !== TOUR_DEMO_ID));
    }
  };

  const handleToggleUnits = (imperial: boolean) => {
    setImperialUnitsOverride(imperial);
    setUseImperial(imperial);
    localStorage.setItem(UNITS_STORAGE_KEY, imperial ? 'imperial' : 'metric');
    // Snap radius to closest option in the new unit system
    const opts = imperial
      ? [1609, 3219, 8047]
      : [1000, 2000, 5000];
    setRadius((prev) => opts.reduce((closest, v) =>
      Math.abs(v - prev) < Math.abs(closest - prev) ? v : closest
    ));
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(HIDDEN_STORAGE_KEY, JSON.stringify(hiddenRestaurants));
    } catch (err) {
      console.warn('Failed to persist hidden restaurants to storage', err);
    }
  }, [hiddenRestaurants]);

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

    filtered = filtered.filter(
      (restaurantItem) => !hiddenRestaurants.some((h) => h.id === restaurantItem.id)
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
  }, [visitedRestaurants, hiddenRestaurants, filterRules, shouldExcludeByFilter, filterByOpenNow]);

  const searchRestaurants = useCallback(async (lat: number, lon: number, searchRadius?: number, openNow?: boolean, forceRefresh: boolean = false, includeCuisine?: string) => {
    try {
      const currentRadius = searchRadius !== undefined ? searchRadius : radius;
      const foundRestaurants = await fetchRestaurants(lat, lon, currentRadius, forceRefresh);
      const restaurantsToFilter = includeCuisine
        ? foundRestaurants.filter((restaurant) => {
            if (!restaurant.cuisine) {
              return false;
            }
            return restaurant.cuisine.toLowerCase().split(';').some((c) => c.trim().includes(includeCuisine.toLowerCase()));
          })
        : foundRestaurants;

      setRestaurants(restaurantsToFilter);
      if (restaurantsToFilter.length === 0) {
        if (includeCuisine) {
          setError('No restaurants found for that cuisine in this area. Try a different cuisine or increase the search radius.');
        } else {
          setError('No restaurants found in this area. Try increasing the search radius.');
        }
        return 0;
      }
      const availableAfterFilters = applyAvailabilityFilters(restaurantsToFilter, openNow);
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

  useEffect(() => {
    if (pageLocation.pathname !== '/restaurants') {
      return;
    }
    
    const searchParams = new URLSearchParams(pageLocation.search);
    const locationParam = searchParams.get('location');
    const cuisineParam = searchParams.get('cuisine');
    if (!locationParam) {
      return;
    }

    const queryKey = `${locationParam}|${cuisineParam ?? ''}`;
    if (queryKey === lastProcessedQueryRef.current) {
      return;
    }

    lastProcessedQueryRef.current = queryKey;
    setLocation(null);
    setRestaurants([]);
    setError(null);
    setLoading(true);

    (async () => {
      try {
        const result = await geocodeAddress(locationParam);
        if (result) {
          skipNextAutoSearchRef.current = true;
          setLocation(result);
          const availableCount = await searchRestaurants(
            result.lat,
            result.lon,
            undefined,
            undefined,
            false,
            cuisineParam ? cuisineParam.trim() : undefined
          );
          trackRestaurantSearch(locationParam, availableCount);
        } else {
          setError('Location not found. Please try a different address.');
        }
      } catch (err) {
        setError('Error finding location. Please try again.');
        console.error('Geocoding error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [pageLocation.pathname, pageLocation.search, searchRestaurants]);

  const handleSearch = async (query: string, searchRadius?: number, openNow?: boolean) => {
    setLoading(true);
    setError(null);
    if (searchRadius !== undefined) setRadius(searchRadius);
    if (openNow !== undefined) setFilterByOpenNow(openNow);
    
    try {
      const result = await geocodeAddress(query);
      if (result) {
        skipNextAutoSearchRef.current = true;
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
      skipNextAutoSearchRef.current = true;
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

  const handleLocationDrag = async (lat: number, lon: number) => {
    setLocationUpdating(true);
    setError(null);
    setSelectedRestaurant(null);
    setViewMode('map');
    skipNextAutoSearchRef.current = true;
    const newLocation = { lat, lon };
    setLocation(newLocation);

    try {
      const cuisineParam = new URLSearchParams(pageLocation.search).get('cuisine');
      const availableCount = await searchRestaurants(
        lat,
        lon,
        undefined,
        undefined,
        false,
        cuisineParam ? cuisineParam.trim() : undefined
      );
      trackRestaurantSearch('dragged_pin', availableCount);
    } catch {
      setError('Error updating restaurants after moving the marker.');
    } finally {
      setLocationUpdating(false);
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
    if (!location) {
      return;
    }
    if (skipNextAutoSearchRef.current) {
      skipNextAutoSearchRef.current = false;
      return;
    }

    let isCancelled = false;

    (async () => {
      try {
        setLoading(true);
        await searchRestaurants(location.lat, location.lon);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [radius, location, searchRestaurants]);

  const availableRestaurants = useMemo(
    () => applyAvailabilityFilters(restaurants),
    [restaurants, applyAvailabilityFilters]
  );

  const hiddenByHistoryCount = useMemo(
    () => restaurants.filter((r) => visitedRestaurants.some((v) => v.id === r.id)).length,
    [restaurants, visitedRestaurants]
  );

  const hiddenByUserCount = useMemo(
    () => restaurants.filter((r) => hiddenRestaurants.some((h) => h.id === r.id)).length,
    [restaurants, hiddenRestaurants]
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
      if (prev.some((item) => item.id === restaurant.id)) return prev;
      return [...prev, restaurant];
    });
  };

  const hideRestaurant = (restaurant: Restaurant) => {
    setHiddenRestaurants((prev) => {
      if (prev.some((item) => item.id === restaurant.id)) return prev;
      return [...prev, restaurant];
    });
  };

  const unhideRestaurant = (restaurantId: string) => {
    setHiddenRestaurants((prev) => prev.filter((r) => r.id !== restaurantId));
  };

  const clearHiddenRestaurants = () => setHiddenRestaurants([]);

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
                  hiddenRestaurants={hiddenRestaurants}
                  filterRules={filterRules}
                  hiddenByHistoryCount={hiddenByHistoryCount}
                  hiddenByFiltersCount={hiddenByFiltersCount}
                  hiddenByUserCount={hiddenByUserCount}
                  onMarkRestaurantVisited={markRestaurantVisited}
                  onRemoveVisitedRestaurant={removeVisitedRestaurant}
                  onClearVisitedRestaurants={clearVisitedRestaurants}
                  onHideRestaurant={hideRestaurant}
                  onUnhideRestaurant={unhideRestaurant}
                  onClearHiddenRestaurants={clearHiddenRestaurants}
                  onAddFilterRule={addFilterRule}
                  onRemoveFilterRule={removeFilterRule}
                  onClearFilterRules={clearFilterRules}
                  onCenterDrag={handleLocationDrag}
                  locationUpdating={locationUpdating}
                  filterByOpenNow={filterByOpenNow} // NEW PROP
                  setFilterByOpenNow={setFilterByOpenNow} // NEW PROP
                  onOpenTour={openTour}
                  tourOpen={showTour}
                  onTourClose={handleTourClose}
                  onTourStepChange={handleTourStepChange}
                  useImperial={useImperial}
                  onToggleUnits={handleToggleUnits}
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
          <Route path="/guide" element={<CityGuidePage />} />
          <Route path="/guide/:city" element={<CityGuidePage />} />
          <Route path="/guide/:city/:cuisine" element={<CityGuidePage />} />
        </Routes>
      </Suspense>
      <Footer />
      <InstallPWA currentPath={pageLocation.pathname} />
      <BottomNav />
    </div>
  );
}

export default App;
