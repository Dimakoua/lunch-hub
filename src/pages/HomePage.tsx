import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MapPin, Shuffle, RotateCcw, Sun, Moon } from 'lucide-react';
import { SearchBar } from '../components/SearchBar';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface HomePageProps {
  onSearch: (query: string) => void;
  onCurrentLocation: () => void;
  loading: boolean;
  error: string | null;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onSearch,
  onCurrentLocation,
  loading,
  error,
  theme,
  toggleTheme
}) => {
  return (
    <main className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
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

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8 sm:p-6 md:p-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-dark-primary dark:to-orange-500 rounded-2xl p-4 shadow-lg">
              <MapPin className="w-12 h-12 text-white" />
            </div>
          </div>
          <Link to="/">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 dark:from-dark-primary dark:via-orange-500 dark:to-yellow-500 bg-clip-text text-transparent mb-4 cursor-pointer">
              Lunch Hub
            </h1>
          </Link>
          <Link to="/blog" className="text-blue-600 hover:underline dark:text-blue-400 text-lg mt-2 block">Our Blog</Link>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-dark-text-secondary max-w-2xl mx-auto">
            Discover amazing restaurants near you. Search by location or let us find your next favorite meal!
          </p>
        </div>

        <SearchBar 
          onSearch={onSearch}
          onCurrentLocation={onCurrentLocation}
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

        <div className="mt-8 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
          <section className="text-center p-6">
            <div className="w-16 h-16 bg-blue-100 dark:bg-dark-card rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-blue-600 dark:text-dark-primary" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-2">Find Nearby</h3>
            <p className="text-gray-600 dark:text-dark-text-secondary">Discover restaurants within your chosen radius</p>
          </section>
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
    </main>
  );
};