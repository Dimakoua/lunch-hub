import React, { useState } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onCurrentLocation: () => void;
  loading: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  onCurrentLocation, 
  loading 
}) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center bg-white rounded-full shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
          <Search className="w-5 h-5 text-gray-400 ml-4" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter address or postal code..."
            className="flex-1 px-4 py-4 text-lg border-none outline-none rounded-full"
            disabled={loading}
          />
          <button
            type="button"
            onClick={onCurrentLocation}
            disabled={loading}
            className="p-3 mx-1 rounded-full hover:bg-gray-100 transition-colors duration-200 group"
            title="Use current location"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            ) : (
              <MapPin className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors duration-200" />
            )}
          </button>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-6 py-3 rounded-full mr-1 transition-all duration-200 font-medium"
          >
            Search
          </button>
        </div>
      </form>
    </div>
  );
};