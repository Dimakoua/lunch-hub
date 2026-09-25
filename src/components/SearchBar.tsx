import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2, X, SlidersHorizontal } from 'lucide-react';
import { searchLocationSuggestions } from '../services/geocoding';
import { getRadiusOptionsInMeters } from '../utils/distanceFormatter';

interface SearchBarProps {
  onSearch: (query: string, radius: number, openNow: boolean) => void;
  onCurrentLocation: (radius: number, openNow: boolean) => void;
  loading: boolean;
  initialRadius?: number;
  initialOpenNow?: boolean;
  compact?: boolean;
  placeholder?: string;
  className?: string;
  onToggleSettings?: () => void;
  isSettingsOpen?: boolean;
  hideInternalFilters?: boolean;
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
  loading,
  initialRadius = 1000,
  initialOpenNow = false,
  compact = false,
  placeholder = 'Search address or neighborhood...',
  className = '',
  onToggleSettings,
  isSettingsOpen = false,
  hideInternalFilters = false
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [radius, setRadius] = useState(initialRadius);
  const [openNow, setOpenNow] = useState(initialOpenNow);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRadius(initialRadius);
  }, [initialRadius]);

  useEffect(() => {
    setOpenNow(initialOpenNow);
  }, [initialOpenNow]);

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
    onSearch(suggestion.display_name, radius, openNow);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowSuggestions(false);
      onSearch(query.trim(), radius, openNow);
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
    <div className={`relative ${compact ? 'w-full' : 'w-full max-w-2xl mx-auto'} ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className={`flex items-center bg-white dark:bg-dark-card ${compact ? 'rounded-xl border border-gray-200/90 dark:border-dark-border shadow-sm' : 'rounded-2xl md:rounded-full shadow-lg border border-gray-200/80 dark:border-dark-border hover:shadow-xl'} transition-all duration-300 ${compact ? 'px-2 py-1' : 'px-2 py-1 sm:py-0'}`}>
          <Search className={`${compact ? 'w-4 h-4 ml-2' : 'w-5 h-5 ml-3'} text-gray-400 dark:text-dark-text-secondary flex-shrink-0`} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            className={`flex-1 min-w-0 border-none outline-none rounded-full bg-transparent dark:text-dark-text ${compact ? 'px-2.5 py-2 text-xs sm:text-sm' : 'px-4 py-3 sm:py-4 text-base sm:text-lg'}`}
            disabled={loading}
            autoComplete="off"
          />
          
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setSuggestions([]);
                  setShowSuggestions(false);
                }}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-dark-text transition-colors duration-200"
                title="Clear search"
              >
                <X className={`${compact ? 'w-4 h-4' : 'w-5 h-5'}`} />
              </button>
            )}
            
            <button
              type="button"
              data-tour-target="settings-button"
              onClick={() => {
                if (onToggleSettings) {
                  onToggleSettings();
                } else {
                  setShowFilters(!showFilters);
                }
              }}
              className={`p-1.5 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 ${
                (onToggleSettings ? isSettingsOpen : showFilters)
                  ? 'text-blue-600 dark:text-dark-primary bg-blue-50 dark:bg-dark-primary/10'
                  : 'text-gray-600 dark:text-dark-text-secondary'
              }`}
              title="Filters & settings"
              aria-label="Filters and search settings"
            >
              <SlidersHorizontal className={`${compact ? 'w-4 h-4' : 'w-5 h-5'}`} />
            </button>

            <button
              type="button"
              onClick={() => onCurrentLocation(radius, openNow)}
              disabled={loading}
              className="p-1.5 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 group"
              title="Use current location"
            >
              {loading ? (
                <Loader2 className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-blue-600 dark:text-dark-primary animate-spin`} />
              ) : (
                <MapPin className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-gray-600 dark:text-dark-text-secondary group-hover:text-blue-600 dark:group-hover:text-dark-primary transition-colors duration-200`} />
              )}
            </button>
            
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className={`bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:bg-dark-primary dark:hover:bg-orange-600 dark:disabled:bg-gray-600 text-white rounded-full transition-all duration-200 font-medium ${compact ? 'px-3 py-1.5 text-xs' : 'px-6 py-3 text-sm hidden md:block'}`}
            >
              Search
            </button>
          </div>
        </div>
      </form>

      {/* Filters Panel (for standalone mode like HomePage) */}
      {!hideInternalFilters && showFilters && (
        <div className={`mt-2 p-3 sm:p-4 bg-white dark:bg-dark-card rounded-2xl shadow-xl border border-gray-200 dark:border-dark-border animate-slide-up ${compact ? 'text-xs' : ''}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-dark-text flex items-center gap-1">
                Search radius
              </label>
              <select
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="px-2.5 py-1.5 border border-gray-300 dark:border-dark-border rounded-lg text-xs bg-white dark:bg-dark-background dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-dark-primary"
              >
                {getRadiusOptionsInMeters().map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center justify-between sm:justify-end">
              <label htmlFor="home-open-now" className="flex items-center cursor-pointer group">
                <span className="text-xs font-semibold text-gray-700 dark:text-dark-text mr-2">
                  Open now only
                </span>
                <div className="relative">
                  <input
                    type="checkbox"
                    id="home-open-now"
                    className="sr-only"
                    checked={openNow}
                    onChange={(e) => setOpenNow(e.target.checked)}
                  />
                  <div
                    className={`block w-8 h-5 rounded-full transition ${
                      openNow ? 'bg-blue-600 dark:bg-dark-primary' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  ></div>
                  <div
                    className={`dot absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition ${
                      openNow ? 'translate-x-3' : ''
                    }`}
                  ></div>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Search Button (only in non-compact mode) */}
      {!compact && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || !query.trim()}
          className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:bg-dark-primary dark:hover:bg-orange-600 dark:disabled:bg-gray-600 text-white px-6 py-3 rounded-full transition-all duration-200 font-medium md:hidden"
        >
          Search
        </button>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-dark-card rounded-xl shadow-2xl border border-gray-200 dark:border-dark-border max-h-80 overflow-y-auto z-[10002]"
        >
          {isLoadingSuggestions ? (
            <div className="p-4 text-center">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-dark-primary mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-dark-text-secondary">Searching locations...</p>
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionSelect(suggestion)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 border-b border-gray-100 dark:border-dark-border last:border-b-0 ${
                  index === selectedIndex ? 'bg-blue-50 dark:bg-gray-700 border-blue-200 dark:border-dark-primary' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-gray-400 dark:text-dark-text-secondary mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-dark-text truncate">
                      {suggestion.display_name.split(',')[0]}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-dark-text-secondary truncate">
                      {suggestion.display_name}
                    </p>
                  </div>
                </div>
              </button>
            ))
          ) : query.length >= 3 ? (
            <div className="p-4 text-center">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-dark-primary mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-dark-text-secondary">Searching locations...</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};