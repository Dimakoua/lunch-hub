import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { searchLocationSuggestions } from '../services/geocoding';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onCurrentLocation: () => void;
  loading: boolean;
}

interface LocationSuggestion {
  display_name: string;
  lat: number;
  lon: number;
  type: string;
  importance: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  onCurrentLocation, 
  loading 
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Debounced search for suggestions
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (query.length >= 3) {
        setIsLoadingSuggestions(true);
        const results = await searchLocationSuggestions(query);
        setSuggestions(results);
        setShowSuggestions(true);
        setIsLoadingSuggestions(false);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        } else if (query.trim()) {
          handleSubmit(e);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSuggestionSelect = (suggestion: LocationSuggestion) => {
    setQuery(suggestion.display_name);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    onSearch(suggestion.display_name);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowSuggestions(false);
      onSearch(query.trim());
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedIndex(-1);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 200);
  };

  return (
    <div className="w-full max-w-2xl mx-auto relative">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center bg-white rounded-full shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
          <Search className="w-5 h-5 text-gray-400 ml-4" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder="Enter address or postal code..."
            className="flex-1 px-4 py-4 text-lg border-none outline-none rounded-full"
            disabled={loading}
            autoComplete="off"
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

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div 
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 max-h-80 overflow-y-auto z-50"
        >
          {isLoadingSuggestions ? (
            <div className="p-4 text-center">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Searching locations...</p>
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionSelect(suggestion)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0 ${
                  index === selectedIndex ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {suggestion.display_name.split(',')[0]}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {suggestion.display_name}
                    </p>
                  </div>
                </div>
              </button>
            ))
          ) : query.length >= 3 ? (
            <div className="p-4 text-center text-gray-500">
              <p className="text-sm">No locations found</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};