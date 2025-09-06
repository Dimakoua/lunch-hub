import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { MapPin, List, Shuffle, RotateCcw, Settings, Sun, Moon } from 'lucide-react';
import { SearchBar } from './components/SearchBar';
import { RestaurantCard } from './components/RestaurantCard';
import { MapView } from './components/MapView';
import { SpinWheel } from './components/SpinWheel';
import { RandomPicker } from './components/RandomPicker';
import { LoadingSpinner } from './components/LoadingSpinner';
import { geocodeAddress, getCurrentLocation } from './services/geocoding';
import { fetchRestaurants } from './services/restaurants';
import { Restaurant, Location } from './types/restaurant';

type ViewMode = 'map' | 'list' | 'wheel' | 'random';
type Theme = 'light' | 'dark';

function App() {
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

  const renderContent = () => {
    if (!location) {
      return (
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <Helmet>
            <title>Lunch Hub - Discover Restaurants Near You</title>
            <meta name="description" content="Discover amazing restaurants near you. Search by location or let us find your next favorite meal!" />
          </Helmet>
          {/* Background Pattern */}
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 theme-toggle-button"
            >
              {theme === 'light' ? (
                <Moon className="w-6 h-6 text-gray-600" />
              ) : (
                <Sun className="w-6 h-6 text-yellow-400" />
              )}
            </button>
          </div>
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-repeat bg-center" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }} />
          </div>

          <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-dark-primary dark:to-orange-500 rounded-2xl p-4 shadow-lg">
                  <MapPin className="w-12 h-12 text-white" />
                </div>
              </div>
              <h1 
                className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 dark:from-dark-primary dark:via-orange-500 dark:to-yellow-500 bg-clip-text text-transparent mb-4"
                onClick={() => window.location.href = "/"}
                style={{ cursor: 'pointer' }}
              >
                Lunch Hub
              </h1>
              <p className="text-xl text-gray-600 dark:text-dark-text-secondary max-w-2xl mx-auto">
                Discover amazing restaurants near you. Search by location or let us find your next favorite meal!
              </p>
            </div>

            <SearchBar 
              onSearch={handleSearch}
              onCurrentLocation={handleCurrentLocation}
              loading={loading}
            />

            {loading && (
              <div className="mt-8">
                <LoadingSpinner message="Finding your location..." />
              </div>
            )}

            {error && (
              <div className="mt-6 bg-red-50 border border-red-200 dark:bg-red-900 dark:border-red-700 rounded-lg p-4 max-w-md">
                <p className="text-red-700 dark:text-red-200 text-center">{error}</p>
              </div>
            )}

            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-blue-100 dark:bg-dark-card rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-blue-600 dark:text-dark-primary" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-2">Find Nearby</h3>
                <p className="text-gray-600 dark:text-dark-text-secondary">Discover restaurants within your chosen radius</p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-purple-100 dark:bg-dark-card rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shuffle className="w-8 h-8 text-purple-600 dark:text-dark-primary" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-2">Random Choice</h3>
                <p className="text-gray-600 dark:text-dark-text-secondary">Can't decide? Let us pick for you!</p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-dark-card rounded-full flex items-center justify-center mx-auto mb-4">
                  <RotateCcw className="w-8 h-8 text-emerald-600 dark:text-dark-primary" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-2">Spin to Win</h3>
                <p className="text-gray-600 dark:text-dark-text-secondary">Use our fun wheel to choose your meal</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-background">
        <Helmet>
          <title>Lunch Hub - Discover Restaurants Near You</title>
          <meta name="description" content="Discover amazing restaurants near you. Search by location or let us find your next favorite meal!" />
        </Helmet>
        {/* Header */}
        <header className="bg-white dark:bg-dark-card shadow-sm border-b border-gray-200 dark:border-dark-border">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-dark-primary dark:to-orange-500 rounded-xl p-2">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <h1 
                  className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-dark-primary dark:to-orange-500 bg-clip-text text-transparent"
                  onClick={() => window.location.href = "/"}
                  style={{ cursor: 'pointer' }}
                >
                  Lunch Hub
                </h1>
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
                    onChange={(e) => setRadius(Number(e.target.value))}
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
                  />
                </div>
              )}

              {viewMode === 'list' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {restaurants.map((restaurant) => (
                    <RestaurantCard
                      key={restaurant.id}
                      restaurant={restaurant}
                      onViewOnMap={handleViewOnMap}
                    />
                  ))}
                </div>
              )}

              {viewMode === 'random' && (
                <div className="flex justify-center">
                  <RandomPicker 
                    restaurants={restaurants}
                    onRestaurantSelected={handleRestaurantSelected}
                  />
                </div>
              )}

              {viewMode === 'wheel' && (
                <div className="flex justify-center">
                  <SpinWheel 
                    restaurants={restaurants}
                    onRestaurantSelected={handleRestaurantSelected}
                  />
                </div>
              )}
            </>
          )}
        </main>
      </div>
    );
  };

  return renderContent();
}

export default App;