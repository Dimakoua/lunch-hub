import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MapPin, ChefHat, ArrowRight, Utensils, Clock, DollarSign, Heart } from 'lucide-react';

interface CityData {
  id: string;
  name: string;
  slug: string;
  country: string;
  description: string;
  longDescription: string;
  lunchCulture: string;
  bestAreas: string[];
  recommendations?: Recommendation[];
  cuisines: string[];
}

interface Recommendation {
  name: string;
  cuisine: string;
  area: string;
  whyGo: string;
  mustTry: string;
}

interface CuisineData {
  id: string;
  name: string;
  emoji: string;
  description: string;
  tips: string;
  bestFor: string;
  priceRange: string;
  typicalDishes: string;
}

interface CityGuideData {
  cities: CityData[];
  cuisines: CuisineData[];
}

const CityGuidePage: React.FC = () => {
  const { city, cuisine } = useParams<{ city?: string; cuisine?: string }>();
  const navigate = useNavigate();
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.lunchhub.com';
  const [data, setData] = useState<CityGuideData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/data/city-cuisines.json');
        const json = await response.json();
        setData(json);
      } catch (error) {
        console.error('Failed to load city guide data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading guide...</p>
        </div>
      </div>
    );
  }

  const currentCity = city ? data.cities.find(c => c.slug === city) : null;
  const currentCuisine = cuisine ? data.cuisines.find(c => c.id === cuisine) : null;
  const cityRecommendations = currentCity?.recommendations ?? [];
  const cuisineRecommendations = currentCuisine
    ? cityRecommendations.filter((item) => item.cuisine.toLowerCase() === currentCuisine.name.toLowerCase())
    : [];

  // Generate page title and description
  const getTitle = () => {
    if (currentCity && currentCuisine) {
      return `Best ${currentCuisine.name} Restaurants in ${currentCity.name} for Lunch | Lunch Hub`;
    }
    if (currentCity) {
      return `Best Restaurants in ${currentCity.name} for Lunch - Find Your Perfect Meal | Lunch Hub`;
    }
    return 'Lunch Guides by City & Cuisine | Lunch Hub';
  };

  const getDescription = () => {
    if (currentCity && currentCuisine) {
      return `Discover the best ${currentCuisine.name.toLowerCase()} lunch spots in ${currentCity.name}. Find authentic restaurants, read local tips, and explore ${currentCity.name}'s diverse food culture with Lunch Hub.`;
    }
    if (currentCity) {
      return `Explore the best lunch restaurants in ${currentCity.name}. Browse by cuisine type, discover local dining culture, and find top-rated spots in ${currentCity.country} with Lunch Hub.`;
    }
    return 'Browse lunch guides by city and cuisine type. Discover the best restaurants in major cities worldwide. Find your perfect lunch spot with Lunch Hub.';
  };

  const getCanonical = () => {
    if (currentCity && currentCuisine) {
      return `${origin}/guide/${currentCity.slug}/${currentCuisine.id}`;
    }
    if (currentCity) {
      return `${origin}/guide/${currentCity.slug}`;
    }
    return `${origin}/guide`;
  };

  const handleSearch = (searchCity?: string, searchCuisine?: string) => {
    if (searchCity && searchCuisine) {
      navigate(`/restaurants?location=${searchCity}&cuisine=${searchCuisine}`);
    } else if (searchCity) {
      navigate(`/restaurants?location=${searchCity}`);
    }
  };

  // Show city + cuisine details with unique content
  if (currentCity && currentCuisine) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Helmet>
          <title>{getTitle()}</title>
          <meta name="description" content={getDescription()} />
          <link rel="canonical" href={getCanonical()} />
          <meta property="og:title" content={getTitle()} />
          <meta property="og:description" content={getDescription()} />
          <meta property="og:type" content="website" />
          <meta property="og:url" content={getCanonical()} />
          <meta name="twitter:card" content="summary_large_image" />
          <script type="application/ld+json">
            {JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'CollectionPage',
              name: getTitle(),
              description: getDescription(),
              url: getCanonical(),
              mainEntity: {
                '@type': 'ItemList',
                name: `${currentCuisine.name} Restaurants in ${currentCity.name}`,
                itemListElement: (cuisineRecommendations.length > 0 ? cuisineRecommendations : cityRecommendations.slice(0, 2)).map((item, index) => ({
                  '@type': 'ListItem',
                  position: index + 1,
                  item: {
                    '@type': 'Restaurant',
                    name: item.name,
                    servesCuisine: item.cuisine,
                    address: {
                      '@type': 'PostalAddress',
                      addressLocality: currentCity.name,
                      addressRegion: item.area,
                    },
                  },
                }))
              }
            })}
          </script>
        </Helmet>

        <div className="container mx-auto px-4 py-12 pt-24">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <ol className="flex items-center space-x-2 text-sm">
              <li><Link to="/guide" className="text-blue-600 hover:text-blue-800 dark:text-blue-400">Guides</Link></li>
              <li className="text-gray-400">/</li>
              <li><Link to={`/guide/${currentCity.slug}`} className="text-blue-600 hover:text-blue-800 dark:text-blue-400">{currentCity.name}</Link></li>
              <li className="text-gray-400">/</li>
              <li className="text-gray-600 dark:text-gray-400">{currentCuisine.name}</li>
            </ol>
          </nav>

          {/* Hero Section */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
              {currentCuisine.emoji} Best {currentCuisine.name} Lunch in {currentCity.name}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">
              {currentCuisine.description}
            </p>
            <button
              onClick={() => handleSearch(currentCity.name, currentCuisine.name)}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Find {currentCuisine.name} Restaurants
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Two-column layout */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Left Column: City & Cuisine Info */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-blue-600" />
                  {currentCity.name}'s Lunch Culture
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {currentCity.lunchCulture}
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  {currentCity.longDescription}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Best Areas for {currentCuisine.name}</h3>
                <ul className="space-y-2">
                  {currentCity.bestAreas.slice(0, 5).map(area => (
                    <li key={area} className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                      {area}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right Column: Cuisine Info */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                  <ChefHat className="w-6 h-6 text-emerald-600" />
                  About {currentCuisine.name} Cuisine
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  {currentCuisine.description}
                </p>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-emerald-50 dark:from-gray-700 dark:to-gray-600 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-gray-900 dark:text-white">Price Range</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-200">{currentCuisine.priceRange}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-emerald-50 dark:from-gray-700 dark:to-gray-600 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-gray-900 dark:text-white">Best For</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-200">{currentCuisine.bestFor}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Cuisine Tips Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm mb-12">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <Utensils className="w-6 h-6 text-blue-600" />
              Dining Tips for {currentCuisine.name} in {currentCity.name}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4 text-lg">
              {currentCuisine.tips}
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Typical Dishes to Try:</h3>
              <p className="text-gray-700 dark:text-gray-300">{currentCuisine.typicalDishes}</p>
            </div>
          </div>

          {/* Local Recommendations */}
          {(cuisineRecommendations.length > 0 || cityRecommendations.length > 0) && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm mb-12">
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                Real Local Picks for {currentCuisine.name} in {currentCity.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                These are editorial recommendations to help you shortlist strong options faster. Compare vibe, area, and signature dishes before opening the live map.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                {(cuisineRecommendations.length > 0 ? cuisineRecommendations : cityRecommendations.slice(0, 3)).map((item) => (
                  <article key={`${item.name}-${item.area}`} className="rounded-lg border border-gray-200 dark:border-gray-700 p-5">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">{item.cuisine} · {item.area}</p>
                    <p className="text-gray-600 dark:text-gray-300 mt-3">{item.whyGo}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-200 mt-3"><span className="font-semibold">Must try:</span> {item.mustTry}</p>
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* Other Cuisines in City */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm mb-12">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
              Explore Other Cuisines in {currentCity.name}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {currentCity.cuisines
                .filter(c => c !== currentCuisine.name)
                .map((cuisineName) => {
                  const cuisineObj = data.cuisines.find(c => c.name === cuisineName);
                  if (!cuisineObj) return null;
                  return (
                    <Link
                      key={cuisineObj.id}
                      to={`/guide/${currentCity.slug}/${cuisineObj.id}`}
                      className="p-4 bg-gradient-to-br from-blue-50 to-emerald-50 dark:from-gray-700 dark:to-gray-600 rounded-lg hover:shadow-lg transition-shadow text-center"
                    >
                      <div className="text-3xl mb-2">{cuisineObj.emoji}</div>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">{cuisineObj.name}</div>
                    </Link>
                  );
                })}
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-blue-600 to-emerald-600 rounded-xl p-8 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to Try {currentCuisine.name}?</h2>
            <p className="text-lg mb-6 opacity-90">
              Find the best {currentCuisine.name.toLowerCase()} restaurants in {currentCity.name} with detailed information and easy navigation.
            </p>
            <button
              onClick={() => handleSearch(currentCity.name, currentCuisine.name)}
              className="inline-flex items-center gap-2 bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Search Now
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Show city details with cuisines
  if (currentCity) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Helmet>
          <title>{getTitle()}</title>
          <meta name="description" content={getDescription()} />
          <link rel="canonical" href={getCanonical()} />
          <meta property="og:title" content={getTitle()} />
          <meta property="og:description" content={getDescription()} />
          <meta property="og:type" content="website" />
          <meta property="og:url" content={getCanonical()} />
          <meta name="twitter:card" content="summary_large_image" />
          <script type="application/ld+json">
            {JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'CollectionPage',
              name: getTitle(),
              description: getDescription(),
              url: getCanonical(),
              areaServed: {
                '@type': 'City',
                name: currentCity.name
              }
            })}
          </script>
        </Helmet>

        <div className="container mx-auto px-4 py-12 pt-24">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <ol className="flex items-center space-x-2 text-sm">
              <li><Link to="/guide" className="text-blue-600 hover:text-blue-800 dark:text-blue-400">Guides</Link></li>
              <li className="text-gray-400">/</li>
              <li className="text-gray-600 dark:text-gray-400">{currentCity.name}</li>
            </ol>
          </nav>

          {/* Hero */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
              <MapPin className="inline w-10 h-10 mr-3 text-blue-600" />
              Best Restaurants in {currentCity.name}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">
              {currentCity.description}
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              {currentCity.longDescription}
            </p>
            <button
              onClick={() => handleSearch(currentCity.name)}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Search All Restaurants
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* City Info Section */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="w-6 h-6 text-emerald-600" />
                Lunch Culture in {currentCity.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                {currentCity.lunchCulture}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <Heart className="w-6 h-6 text-red-600" />
                Best Areas to Eat
              </h2>
              <ul className="space-y-2">
                {currentCity.bestAreas.map(area => (
                  <li key={area} className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    {area}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Cuisines Grid */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
              Explore Cuisines in {currentCity.name}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {currentCity.cuisines.map((cuisineName) => {
                const cuisineObj = data.cuisines.find(c => c.name === cuisineName);
                if (!cuisineObj) return null;
                return (
                  <Link
                    key={cuisineObj.id}
                    to={`/guide/${currentCity.slug}/${cuisineObj.id}`}
                    className="group p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-105 text-center"
                  >
                    <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">{cuisineObj.emoji}</div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">{cuisineObj.name}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">View Best Spots</p>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* City-Level Recommendations */}
          {cityRecommendations.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm mb-12">
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                Recommended Lunch Spots in {currentCity.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Start with these high-confidence picks across different cuisines. They add useful context before you run a live radius search.
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                {cityRecommendations.slice(0, 3).map((item) => (
                  <article key={`${item.name}-${item.area}`} className="rounded-lg border border-gray-200 dark:border-gray-700 p-5">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">{item.cuisine} · {item.area}</p>
                    <p className="text-gray-600 dark:text-gray-300 mt-3">{item.whyGo}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-200 mt-3"><span className="font-semibold">Must try:</span> {item.mustTry}</p>
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* Info Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Find Your Perfect Lunch in {currentCity.name}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {currentCity.name} offers an incredible variety of dining options spanning every major cuisine type. Whether you're searching for authentic {currentCity.cuisines[0]}, adventurous {currentCity.cuisines[1]}, or something entirely different, Lunch Hub helps you discover amazing restaurants based on your location and preferences.
            </p>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Use our powerful search tool to find restaurants by cuisine, distance, or specific dietary needs. Filter by open now, amenities, or price range. If you're feeling indecisive, try our Spin Wheel or Random Picker for instant inspiration!
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              {currentCity.name}'s diverse neighborhoods each have unique dining personalities. Explore our guides above to find the perfect spot for your lunch break.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Show all cities
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Helmet>
        <title>{getTitle()}</title>
        <meta name="description" content={getDescription()} />
        <link rel="canonical" href={`${origin}/guide`} />
        <meta property="og:title" content={getTitle()} />
        <meta property="og:description" content={getDescription()} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${origin}/guide`} />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Lunch Guides by City',
            description: 'Browse restaurant guides by city and cuisine type',
            url: `${origin}/guide`
          })}
        </script>
      </Helmet>

      <div className="container mx-auto px-4 py-12 pt-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
            Restaurant Guides by City
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Discover the best lunch spots in major cities around the world. Explore by cuisine type, dining culture, and local favorites. Use Lunch Hub to find exactly what you're craving.
          </p>
        </div>

        {/* Cities Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {data.cities.map((cityData) => (
            <Link
              key={cityData.id}
              to={`/guide/${cityData.slug}`}
              className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              <div className="p-6 h-full flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <MapPin className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {cityData.name}
                  </h2>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{cityData.country}</p>
                <p className="text-gray-600 dark:text-gray-300 mb-6 flex-grow line-clamp-3">
                  {cityData.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {cityData.cuisines.slice(0, 3).map((cuisineName) => {
                    const cuisineObj = data.cuisines.find(c => c.name === cuisineName);
                    return (
                      <span key={cuisineName} className="text-2xl">
                        {cuisineObj?.emoji}
                      </span>
                    );
                  })}
                  {cityData.cuisines.length > 3 && (
                    <span className="text-sm text-gray-500 dark:text-gray-400 self-center ml-2">
                      +{cityData.cuisines.length - 3}
                    </span>
                  )}
                </div>
                <button className="text-blue-600 dark:text-blue-400 font-semibold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Explore <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-emerald-600 rounded-xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to find your perfect lunch?</h2>
          <p className="text-lg mb-6 opacity-90 max-w-2xl mx-auto">
            Browse our comprehensive city guides or start searching by location to discover amazing restaurants with detailed information, dining tips, and local insights.
          </p>
          <Link
            to="/restaurants"
            className="inline-flex items-center gap-2 bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Start Searching
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </main>
  );
};

export default CityGuidePage;
