import React, { useState, useEffect, lazy, Suspense, useMemo } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { CookieConsent } from './components/CookieConsent';
import { Header } from './components/Header';

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

type ViewMode = 'map' | 'list' | 'wheel' | 'random' | 'history';
type Theme = 'light' | 'dark';

function App() {
  const navigate = useNavigate();
  const pageLocation = useLocation();
  const [location, setLocation] = useState<Location | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [radius, setRadius] = useState(1000); // 1km default
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    return savedTheme || 'light';
  });
  const [showCookieConsent, setShowCookieConsent] = useState(false);
  const VISITED_STORAGE_KEY = 'lunch-hub-visited-restaurants';
  const HISTORY_EMPTY_MESSAGE = 'All nearby restaurants are already in your visited history. Remove saved places to see them again.';
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

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
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
  }, [location]);

  const handleCookieAccept = () => {
    setShowCookieConsent(false);
    grantConsent();
  };

  const handleCookieDecline = () => {
    setShowCookieConsent(false);
    revokeConsent();
  };

  const handleSearch = async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await geocodeAddress(query);
      if (result) {
        setLocation(result);
        const availableCount = await searchRestaurants(result.lat, result.lon);
        trackRestaurantSearch(query, availableCount);
        navigate('/restaurants');
      } else {
        setError('Location not found. Please try a different address.');
      }
    } catch (err) {
      setError('Error searching for location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCurrentLocation = async () => {
    setLoading(true);
    setError(null);
    try {
      const position = await getCurrentLocation();
      const newLocation = { lat: position.lat, lon: position.lon };
      setLocation(newLocation);
      const availableCount = await searchRestaurants(position.lat, position.lon);
      trackLocationPermission(true);
      trackRestaurantSearch('current_location', availableCount);
      navigate('/restaurants');
    } catch (err) {
      trackLocationPermission(false);
      setError('Unable to get your location. Please enter an address manually.');
    } finally {
      setLoading(false);
    }
  };

  const searchRestaurants = async (lat: number, lon: number) => {
    try {
      const foundRestaurants = await fetchRestaurants(lat, lon, radius);
      setRestaurants(foundRestaurants);
      if (foundRestaurants.length === 0) {
        setError('No restaurants found in this area. Try increasing the search radius.');
        return 0;
      }
      const filteredCount = foundRestaurants.filter(
        (restaurantItem) => !visitedRestaurants.some((visited) => visited.id === restaurantItem.id)
      ).length;
      if (filteredCount === 0) {
        setError(HISTORY_EMPTY_MESSAGE);
      } else {
        setError(null);
      }
      return filteredCount;
    } catch (err) {
      setError('Error finding restaurants. Please try again.');
      return 0;
    }
  };

  const handleViewOnMap = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setViewMode('map');
  };

  const handleRestaurantSelected = (restaurant: Restaurant | null): void => {
    if(!restaurant) return;
    setSelectedRestaurant(restaurant);
    setViewMode('map');
  };

  // Auto-search when radius changes
  useEffect(() => {
    if (location) {
      searchRestaurants(location.lat, location.lon);
    }
  }, [radius]);

  const availableRestaurants = useMemo(
    () => restaurants.filter((restaurantItem) => !visitedRestaurants.some((visited) => visited.id === restaurantItem.id)),
    [restaurants, visitedRestaurants]
  );

  useEffect(() => {
    if (restaurants.length === 0) {
      return;
    }
    if (availableRestaurants.length === 0) {
      setError((prev) => (prev === HISTORY_EMPTY_MESSAGE ? prev : HISTORY_EMPTY_MESSAGE));
    } else if (error === HISTORY_EMPTY_MESSAGE) {
      setError(null);
    }
  }, [availableRestaurants, restaurants.length, error]);

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

  // Determine if header should be shown
  const showHeader = pageLocation.pathname.startsWith('/blog');

  return (
    <>
      {showCookieConsent && (
        <CookieConsent
          onAccept={handleCookieAccept}
          onDecline={handleCookieDecline}
        />
      )}
      {showHeader && <Header theme={theme} toggleTheme={toggleTheme} />}
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
                  totalRestaurants={restaurants.length}
                  visitedRestaurants={visitedRestaurants}
                  onMarkRestaurantVisited={markRestaurantVisited}
                  onRemoveVisitedRestaurant={removeVisitedRestaurant}
                  onClearVisitedRestaurants={clearVisitedRestaurants}
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
    </>
  );
}

export default App;
