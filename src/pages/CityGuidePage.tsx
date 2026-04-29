import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MapPin, ChefHat, ArrowRight, Utensils, Clock, DollarSign, Star, Search, Globe, ExternalLink, Quote } from 'lucide-react';
import { CuratedRestaurant } from '../types/restaurant';

interface CityData {
  id: string;
  name: string;
  slug: string;
  country: string;
  description: string;
  longDescription: string;
  lunchCulture: string;
  bestAreas: string[];
  recommendations?: CuratedRestaurant[];
  cuisines: string[];
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
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://thelunchub.com';
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
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-emerald-500"></div>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading guide…</p>
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

  if (currentCity && currentCuisine) {
    return (
      <main className="min-h-screen bg-white dark:bg-gray-950">
        <Helmet>
          <title>{getTitle()}</title>
          <meta name="description" content={getDescription()} />
          <meta name="keywords" content={`best ${currentCuisine.name.toLowerCase()} restaurants ${currentCity.name}, ${currentCity.name} lunch spots, ${currentCuisine.name} food ${currentCity.name}, lunch hub guide`} />
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

        {/* Top bar */}
        <div className="border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
            <nav aria-label="Breadcrumb">
              <ol className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <li><Link to="/guide" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Guides</Link></li>
                <li><span className="text-gray-300 dark:text-gray-600">/</span></li>
                <li><Link to={`/guide/${currentCity.slug}`} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">{currentCity.name}</Link></li>
                <li><span className="text-gray-300 dark:text-gray-600">/</span></li>
                <li className="text-gray-900 dark:text-gray-200 font-medium">{currentCuisine.name}</li>
              </ol>
            </nav>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 pt-10">

          {/* Hero */}
          <header className="mb-12">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl">{currentCuisine.emoji}</span>
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{currentCity.name}, {currentCity.country}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
              Best {currentCuisine.name} Restaurants in {currentCity.name}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mb-6">
              {currentCuisine.description}
            </p>
            <button
              onClick={() => handleSearch(currentCity.name, currentCuisine.name)}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              <Search className="w-4 h-4" />
              Find {currentCuisine.name} Restaurants Near Me
            </button>
          </header>

          {/* Main content grid */}
          <div className="grid lg:grid-cols-3 gap-8 mb-12">
            <div className="lg:col-span-2 space-y-8">

              {/* Dining Tips */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-emerald-500" />
                  Dining Tips
                </h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">{currentCuisine.tips}</p>
                <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Typical dishes to try:</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{currentCuisine.typicalDishes}</p>
                </div>
              </section>

              {/* City lunch culture */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-500" />
                  Lunch Culture in {currentCity.name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-3">{currentCity.lunchCulture}</p>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{currentCity.longDescription}</p>
              </section>

              {/* Recommendations */}
              {(cuisineRecommendations.length > 0 || cityRecommendations.length > 0) && (
                <section>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <Star className="w-5 h-5 text-emerald-500" />
                    Curated Picks
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                    Editorial recommendations to help you shortlist before searching the live map.
                  </p>
                  <div className="space-y-4">
                    {(cuisineRecommendations.length > 0 ? cuisineRecommendations : cityRecommendations.slice(0, 5)).map((item) => (
                      <article
                        key={`${item.name}-${item.area}`}
                        className="overflow-hidden border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
                      >
                        {item.image && (
                          <div className="h-48 w-full overflow-hidden">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                            />
                          </div>
                        )}
                        <div className="p-5">
                          <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="font-semibold text-gray-900 dark:text-white text-base">{item.name}</h3>
                                {item.rating && (
                                  <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                                    <Star className="w-3 h-3 fill-emerald-500" />
                                    {item.rating}
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">{item.cuisine} · {item.area}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">{item.description || item.whyGo}</p>
                              
                              {item.reviews && item.reviews.length > 0 && (
                                <div className="mt-4 space-y-3 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                                  {item.reviews.slice(0, 1).map((review, i) => (
                                    <div key={i} className="relative">
                                      <Quote className="w-4 h-4 text-emerald-200 dark:text-emerald-900 absolute -top-1 -left-1" />
                                      <p className="text-xs text-gray-500 dark:text-gray-400 italic pl-4">
                                        "{review.comment}"
                                      </p>
                                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 pl-4 font-medium">— {review.user}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="sm:text-right shrink-0">
                              <span className="inline-block bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-md">
                                Try: {item.mustTry}
                              </span>
                            </div>
                          </div>
                          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-4">
                            {item.website && (
                              <a
                                href={item.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                              >
                                Visit Website <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            <button
                              onClick={() => handleSearch(currentCity.name, item.cuisine)}
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                            >
                              Find similar <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Quick facts */}
              <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-5 bg-white dark:bg-gray-900">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm uppercase tracking-wide">Quick Facts</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Price Range</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{currentCuisine.priceRange}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <ChefHat className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Best For</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{currentCuisine.bestFor}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Top Areas</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{currentCity.bestAreas.slice(0, 3).join(', ')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Other cuisines */}
              <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-5 bg-white dark:bg-gray-900">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm uppercase tracking-wide">More in {currentCity.name}</h3>
                <div className="space-y-1">
                  {currentCity.cuisines
                    .filter(c => c !== currentCuisine.name)
                    .map((cuisineName) => {
                      const cuisineObj = data.cuisines.find(c => c.name === cuisineName);
                      if (!cuisineObj) return null;
                      return (
                        <Link
                          key={cuisineObj.id}
                          to={`/guide/${currentCity.slug}/${cuisineObj.id}`}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                        >
                          <span className="text-xl">{cuisineObj.emoji}</span>
                          <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{cuisineObj.name}</span>
                          <ArrowRight className="w-3 h-3 ml-auto text-gray-300 group-hover:text-emerald-500 transition-colors" />
                        </Link>
                      );
                    })}
                </div>
              </div>

              {/* Search CTA */}
              <div className="bg-emerald-600 rounded-xl p-5 text-white">
                <h3 className="font-semibold mb-2">Ready to eat?</h3>
                <p className="text-sm text-emerald-100 mb-4">Search live restaurants near you right now.</p>
                <button
                  onClick={() => handleSearch(currentCity.name, currentCuisine.name)}
                  className="w-full bg-white text-emerald-700 hover:bg-emerald-50 text-sm font-semibold py-2 rounded-lg transition-colors"
                >
                  Search Restaurants
                </button>
              </div>
            </aside>
          </div>
        </div>
      </main>
    );
  }

  if (currentCity) {
    return (
      <main className="min-h-screen bg-white dark:bg-gray-950">
        <Helmet>
          <title>{getTitle()}</title>
          <meta name="description" content={getDescription()} />
          <meta name="keywords" content={`best restaurants in ${currentCity.name}, ${currentCity.name} lunch guide, where to eat in ${currentCity.name}, ${currentCity.name} food culture`} />
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

        {/* Top bar */}
        <div className="border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
            <nav aria-label="Breadcrumb">
              <ol className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <li><Link to="/guide" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Guides</Link></li>
                <li><span className="text-gray-300 dark:text-gray-600">/</span></li>
                <li className="text-gray-900 dark:text-gray-200 font-medium">{currentCity.name}</li>
              </ol>
            </nav>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

          {/* Hero */}
          <header className="mb-10">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{currentCity.country}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
              Best Lunch Restaurants in {currentCity.name}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mb-6 leading-relaxed">
              {currentCity.longDescription}
            </p>
            <button
              onClick={() => handleSearch(currentCity.name)}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              <Search className="w-4 h-4" />
              Search All Restaurants in {currentCity.name}
            </button>
          </header>

          {/* Top Picks - main focus */}
          {cityRecommendations.length > 0 && (
            <section className="mb-12">
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-5 h-5 text-emerald-500 fill-emerald-500" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Top Picks in {currentCity.name}
                </h2>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 ml-7">
                Curated recommendations across different cuisines to get you started.
              </p>
              <div className="grid sm:grid-cols-3 gap-4">
                {cityRecommendations.slice(0, 5).map((item, index) => (
                  <article
                    key={`${item.name}-${item.area}`}
                    className="relative flex flex-col border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-900 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-md transition-all group overflow-hidden"
                  >
                    {item.image && (
                      <div className="h-40 w-full overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                    )}
                    <div className="p-6 flex-1 flex flex-col">
                      <span className="absolute top-4 right-4 text-xs font-bold text-gray-300 dark:text-gray-600 group-hover:text-emerald-500/50">#{index + 1}</span>
                      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-2">{item.cuisine} · {item.area}</p>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{item.name}</h3>
                        {item.rating && (
                          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                            <Star className="w-3 h-3 fill-emerald-500" />
                            {item.rating}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed flex-1 line-clamp-3 mb-4">{item.description || item.whyGo}</p>
                      <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-2 mb-3">
                          <Utensils className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">Must try: </span>{item.mustTry}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          {item.website && (
                            <a
                              href={item.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                            >
                              Visit Website <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          <button
                            onClick={() => handleSearch(currentCity.name, item.cuisine)}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                          >
                            Find similar <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Info row */}
          <div className="grid sm:grid-cols-2 gap-5 mb-12">
            <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-5 bg-white dark:bg-gray-900">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-500" />
                Lunch Culture
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{currentCity.lunchCulture}</p>
            </div>
            <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-5 bg-white dark:bg-gray-900">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-500" />
                Best Areas to Eat
              </h2>
              <div className="flex flex-wrap gap-2">
                {currentCity.bestAreas.map(area => (
                  <span key={area} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-full">{area}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Cuisines */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Explore by Cuisine in {currentCity.name}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {currentCity.cuisines.map((cuisineName) => {
                const cuisineObj = data.cuisines.find(c => c.name === cuisineName);
                if (!cuisineObj) return null;
                return (
                  <Link
                    key={cuisineObj.id}
                    to={`/guide/${currentCity.slug}/${cuisineObj.id}`}
                    className="group flex flex-col items-center gap-2 p-5 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all"
                  >
                    <span className="text-3xl">{cuisineObj.emoji}</span>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors text-center">{cuisineObj.name}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 group-hover:text-emerald-500 transition-colors flex items-center gap-1">
                      View spots <ArrowRight className="w-3 h-3" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Bottom CTA */}
          <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-8 bg-gray-50 dark:bg-gray-900 text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Find Your Perfect Lunch in {currentCity.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 max-w-xl mx-auto">
              {currentCity.name} offers {currentCity.cuisines.length}+ cuisine styles. Use our live search to filter by distance, cuisine, opening hours, and more.
            </p>
            <button
              onClick={() => handleSearch(currentCity.name)}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              <Search className="w-4 h-4" />
              Search Restaurants
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Show all cities
  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
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

      {/* Page header */}
      <div className="border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">City Guides</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Restaurant Guides by City
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl">
            Explore the best lunch spots in major cities around the world. Browse by cuisine, discover local culture, and find your next favourite meal.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* Cities grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
          {data.cities.map((cityData) => (
            <Link
              key={cityData.id}
              to={`/guide/${cityData.slug}`}
              className="group flex flex-col border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all overflow-hidden"
            >
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                      {cityData.name}
                    </h2>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{cityData.country}</p>
                  </div>
                  <MapPin className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-emerald-500 transition-colors shrink-0 mt-1" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed flex-1 line-clamp-3 mb-4">
                  {cityData.description}
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    {cityData.cuisines.slice(0, 4).map((cuisineName) => {
                      const cuisineObj = data.cuisines.find(c => c.name === cuisineName);
                      return cuisineObj ? (
                        <span key={cuisineName} className="text-lg" title={cuisineObj.name}>{cuisineObj.emoji}</span>
                      ) : null;
                    })}
                    {cityData.cuisines.length > 4 && (
                      <span className="text-xs text-gray-400 dark:text-gray-500 self-center">+{cityData.cuisines.length - 4}</span>
                    )}
                  </div>
                  <span className="ml-auto text-xs font-medium text-emerald-600 dark:text-emerald-400 group-hover:underline flex items-center gap-1">
                    Explore <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* All cuisines section */}
        <section className="mb-14">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Browse All Cuisines</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {data.cuisines.map((cuisineData) => (
              <div
                key={cuisineData.id}
                className="flex flex-col items-center gap-1.5 p-3 border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-900 text-center"
              >
                <span className="text-2xl">{cuisineData.emoji}</span>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{cuisineData.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-8 bg-gray-50 dark:bg-gray-900 flex flex-col sm:flex-row items-center gap-6">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Ready to find your next lunch?</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Search live restaurants near you filtered by cuisine, distance, and opening hours.</p>
          </div>
          <Link
            to="/restaurants"
            className="shrink-0 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          >
            <Search className="w-4 h-4" />
            Find Restaurants
          </Link>
        </div>
      </div>
    </main>
  );
};

export default CityGuidePage;
