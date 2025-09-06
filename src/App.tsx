import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { RestaurantsPage } from './pages/RestaurantsPage';
import { geocodeAddress, getCurrentLocation } from './services/geocoding';
import { fetchRestaurants } from './services/restaurants';
import { Restaurant, Location } from './types/restaurant';

type ViewMode = 'map' | 'list' | 'wheel' | 'random';
type Theme = 'light' | 'dark';

function AppContent() {
  const navigate = useNavigate();
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

  const handleSearch = async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await geocodeAddress(query);
      if (result) {
        setLocation(result);
        await searchRestaurants(result.lat, result.lon);
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
      await searchRestaurants(position.lat, position.lon);
      navigate('/restaurants');
    } catch (err) {
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
      }
    } catch (err) {
      setError('Error finding restaurants. Please try again.');
    }
  };

  const handleViewOnMap = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setViewMode('map');
  };

  const handleRestaurantSelected = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setViewMode('map');
  };

  // Auto-search when radius changes
  useEffect(() => {
    if (location) {
      searchRestaurants(location.lat, location.lon);
    }
  }, [radius]);

  return (
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
              restaurants={restaurants}
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
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;