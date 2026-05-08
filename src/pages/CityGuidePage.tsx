import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MapPin, ChefHat, ArrowRight, Utensils, Clock, DollarSign, Star, Search, Globe, ExternalLink, ChevronLeft } from 'lucide-react';
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
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-dark-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-slate-100 border-t-blue-600 dark:border-dark-border dark:border-t-dark-primary"></div>
          <p className="mt-4 text-sm font-medium text-slate-500 dark:text-dark-text-secondary">Loading lunch guides...</p>
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

  const GradientText = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <span className={`bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-dark-primary dark:to-orange-500 bg-clip-text text-transparent ${className}`}>
      {children}
    </span>
  );

  if (currentCity && currentCuisine) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-dark-background">
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
        </Helmet>

        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-white/80 dark:bg-dark-card/80 backdrop-blur-md border-b border-slate-200 dark:border-dark-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <nav aria-label="Breadcrumb">
              <ol className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-dark-text-secondary">
                <li><Link to="/guide" className="hover:text-blue-600 dark:hover:text-dark-primary transition-colors">Guides</Link></li>
                <li><span className="text-slate-300 dark:text-dark-border">/</span></li>
                <li><Link to={`/guide/${currentCity.slug}`} className="hover:text-blue-600 dark:hover:text-dark-primary transition-colors">{currentCity.name}</Link></li>
                <li><span className="text-slate-300 dark:text-dark-border">/</span></li>
                <li className="text-slate-900 dark:text-dark-text font-semibold">{currentCuisine.name}</li>
              </ol>
            </nav>
            <Link to={`/guide/${currentCity.slug}`} className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-dark-primary hover:opacity-80 transition-opacity">
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to {currentCity.name}</span>
            </Link>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Hero Section */}
          <header className="mb-12 relative">
            <div className="absolute -top-12 -left-12 w-48 h-48 bg-blue-100 dark:bg-dark-primary/5 rounded-full blur-3xl -z-10" />
            <div className="flex items-center gap-4 mb-6">
              <div className="text-5xl sm:text-6xl bg-white dark:bg-dark-card p-4 rounded-3xl shadow-xl shadow-blue-500/5 dark:shadow-none border border-slate-100 dark:border-dark-border">
                {currentCuisine.emoji}
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-dark-primary/10 text-blue-600 dark:text-dark-primary text-xs font-bold uppercase tracking-wider mb-2">
                  <MapPin className="w-3 h-3" />
                  {currentCity.name}, {currentCity.country}
                </span>
                <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-dark-text leading-tight">
                  Best <GradientText>{currentCuisine.name}</GradientText> Spots
                </h1>
              </div>
            </div>
            <p className="text-lg sm:text-xl text-slate-600 dark:text-dark-text-secondary max-w-3xl mb-8 leading-relaxed font-medium">
              {currentCuisine.description}
            </p>
            <button
              onClick={() => handleSearch(currentCity.name, currentCuisine.name)}
              className="group relative inline-flex items-center gap-3 bg-slate-900 dark:bg-dark-primary text-white dark:text-black px-8 py-4 rounded-2xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-slate-200 dark:shadow-dark-primary/20"
            >
              <Search className="w-5 h-5" />
              Find {currentCuisine.name} Restaurants Near Me
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </header>

          <div className="grid lg:grid-cols-12 gap-8 sm:gap-12">
            <div className="lg:col-span-8 space-y-12">
              {/* Recommendations */}
              {(cuisineRecommendations.length > 0 || cityRecommendations.length > 0) && (
                <section>
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-dark-text mb-2">Editor's Curated Picks</h2>
                      <p className="text-slate-500 dark:text-dark-text-secondary">Hand-selected lunch spots we love in {currentCity.name}.</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-1 text-amber-500">
                      <Star className="w-5 h-5 fill-current" />
                      <Star className="w-5 h-5 fill-current" />
                      <Star className="w-5 h-5 fill-current" />
                    </div>
                  </div>
                  
                  <div className="grid gap-6">
                    {(cuisineRecommendations.length > 0 ? cuisineRecommendations : cityRecommendations.slice(0, 5)).map((item) => (
                      <article
                        key={`${item.name}-${item.area}`}
                        className="group relative overflow-hidden bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-3xl transition-all hover:shadow-2xl hover:shadow-blue-500/10 dark:hover:shadow-none hover:-translate-y-1"
                      >
                        <div className="flex flex-col md:flex-row">
                          {item.image && (
                            <div className="md:w-2/5 h-64 md:h-auto overflow-hidden relative">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent md:hidden" />
                              <div className="absolute bottom-4 left-4 md:hidden">
                                <h3 className="text-xl font-bold text-white">{item.name}</h3>
                              </div>
                            </div>
                          )}
                          <div className="p-6 md:p-8 flex-1">
                            <div className="flex items-start justify-between mb-4">
                              <div className="hidden md:block">
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-dark-text group-hover:text-blue-600 dark:group-hover:text-dark-primary transition-colors">
                                  {item.name}
                                </h3>
                                <p className="text-sm font-bold text-blue-600 dark:text-dark-primary uppercase tracking-widest mt-1">
                                  {item.cuisine} · {item.area}
                                </p>
                              </div>
                              {item.rating && (
                                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-dark-background px-3 py-1.5 rounded-2xl border border-slate-100 dark:border-dark-border text-slate-900 dark:text-dark-text text-sm font-black">
                                  <Star className="w-4 h-4 text-amber-500 fill-current" />
                                  {item.rating}
                                </div>
                              )}
                            </div>
                            
                            <p className="text-slate-600 dark:text-dark-text-secondary leading-relaxed mb-6 italic font-medium">
                              "{item.description || item.whyGo}"
                            </p>

                            <div className="grid sm:grid-cols-2 gap-4 mb-8">
                              <div className="bg-slate-50 dark:bg-dark-background p-4 rounded-2xl border border-slate-100 dark:border-dark-border">
                                <p className="text-[10px] font-black text-slate-400 dark:text-dark-text-secondary uppercase tracking-[0.2em] mb-1">Must Try</p>
                                <p className="text-sm font-bold text-slate-900 dark:text-dark-text line-clamp-1">{item.mustTry}</p>
                              </div>
                              <div className="bg-blue-50/50 dark:bg-dark-primary/5 p-4 rounded-2xl border border-blue-100/50 dark:border-dark-primary/10">
                                <p className="text-[10px] font-black text-blue-400 dark:text-dark-primary uppercase tracking-[0.2em] mb-1">Cuisine</p>
                                <p className="text-sm font-bold text-blue-700 dark:text-dark-primary line-clamp-1">{item.cuisine}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              {item.website && (
                                <a
                                  href={item.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-dark-text hover:text-blue-600 dark:hover:text-dark-primary transition-colors underline decoration-2 underline-offset-4 decoration-slate-200 dark:decoration-dark-border"
                                >
                                  Official Website <ExternalLink className="w-4 h-4" />
                                </a>
                              )}
                              <button
                                onClick={() => handleSearch(currentCity.name, item.cuisine)}
                                className="ml-auto inline-flex items-center gap-2 text-sm font-black text-blue-600 dark:text-dark-primary uppercase tracking-widest hover:translate-x-1 transition-transform"
                              >
                                Find Similar <ArrowRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {/* Tips & Culture */}
              <div className="grid md:grid-cols-2 gap-8">
                <section className="bg-white dark:bg-dark-card p-8 rounded-[2rem] border border-slate-200 dark:border-dark-border shadow-sm">
                  <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl flex items-center justify-center mb-6">
                    <Utensils className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-dark-text mb-4">Dining Tips</h2>
                  <p className="text-slate-600 dark:text-dark-text-secondary leading-relaxed mb-6 font-medium">
                    {currentCuisine.tips}
                  </p>
                  <div className="bg-slate-50 dark:bg-dark-background rounded-2xl p-6 border border-slate-100 dark:border-dark-border">
                    <h3 className="text-xs font-black text-slate-400 dark:text-dark-text-secondary uppercase tracking-widest mb-3">Typical Dishes</h3>
                    <p className="text-sm font-bold text-slate-700 dark:text-dark-text leading-relaxed">
                      {currentCuisine.typicalDishes}
                    </p>
                  </div>
                </section>

                <section className="bg-white dark:bg-dark-card p-8 rounded-[2rem] border border-slate-200 dark:border-dark-border shadow-sm">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/30 rounded-2xl flex items-center justify-center mb-6">
                    <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-dark-text mb-4">Local Culture</h2>
                  <p className="text-slate-600 dark:text-dark-text-secondary leading-relaxed font-medium">
                    {currentCity.lunchCulture}
                  </p>
                </section>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-4 space-y-8">
              <div className="sticky top-24 space-y-8">
                {/* Quick Facts Card */}
                <div className="bg-slate-900 dark:bg-dark-card text-white p-8 rounded-[2rem] shadow-2xl shadow-slate-900/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 mb-8">Guide Intelligence</h3>
                  <div className="space-y-8">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                        <DollarSign className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Price Range</p>
                        <p className="text-lg font-bold">{currentCuisine.priceRange}</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                        <ChefHat className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Best For</p>
                        <p className="text-lg font-bold">{currentCuisine.bestFor}</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Primary Areas</p>
                        <p className="text-sm font-bold leading-relaxed">{currentCity.bestAreas.slice(0, 3).join(', ')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* More Cuisines */}
                <div className="bg-white dark:bg-dark-card p-8 rounded-[2rem] border border-slate-200 dark:border-dark-border shadow-sm">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 dark:text-dark-text-secondary mb-6">Explore {currentCity.name}</h3>
                  <div className="grid gap-2">
                    {currentCity.cuisines
                      .filter(c => c !== currentCuisine.name)
                      .map((cuisineName) => {
                        const cuisineObj = data.cuisines.find(c => c.name === cuisineName);
                        if (!cuisineObj) return null;
                        return (
                          <Link
                            key={cuisineObj.id}
                            to={`/guide/${currentCity.slug}/${cuisineObj.id}`}
                            className="flex items-center gap-3 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-dark-background transition-all group border border-transparent hover:border-slate-100 dark:hover:border-dark-border"
                          >
                            <span className="text-2xl group-hover:scale-110 transition-transform">{cuisineObj.emoji}</span>
                            <span className="text-sm font-bold text-slate-700 dark:text-dark-text group-hover:text-blue-600 dark:group-hover:text-dark-primary transition-colors">
                              {cuisineName}
                            </span>
                            <ArrowRight className="w-4 h-4 ml-auto text-slate-300 group-hover:text-blue-500 transition-colors" />
                          </Link>
                        );
                      })}
                  </div>
                </div>

                {/* CTA */}
                <div className="bg-gradient-to-br from-blue-600 to-emerald-600 dark:from-dark-primary dark:to-orange-500 p-1 rounded-[2rem]">
                  <div className="bg-white dark:bg-dark-card rounded-[1.9rem] p-8 text-center">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-dark-text mb-2">Ready to eat?</h3>
                    <p className="text-sm text-slate-500 dark:text-dark-text-secondary mb-6 font-medium">Search live restaurants near you in {currentCity.name}.</p>
                    <button
                      onClick={() => handleSearch(currentCity.name, currentCuisine.name)}
                      className="w-full bg-slate-900 dark:bg-dark-primary text-white dark:text-black font-black py-4 rounded-2xl hover:opacity-90 transition-opacity"
                    >
                      Open Map
                    </button>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    );
  }

  if (currentCity) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-dark-background">
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
        </Helmet>

        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-white/80 dark:bg-dark-card/80 backdrop-blur-md border-b border-slate-200 dark:border-dark-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <nav aria-label="Breadcrumb">
              <ol className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-dark-text-secondary">
                <li><Link to="/guide" className="hover:text-blue-600 dark:hover:text-dark-primary transition-colors">Guides</Link></li>
                <li><span className="text-slate-300 dark:text-dark-border">/</span></li>
                <li className="text-slate-900 dark:text-dark-text font-semibold">{currentCity.name}</li>
              </ol>
            </nav>
            <Link to="/guide" className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-dark-primary hover:opacity-80 transition-opacity">
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">All Cities</span>
            </Link>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Hero */}
          <header className="mb-16 relative">
            <div className="absolute -top-12 -left-12 w-64 h-64 bg-emerald-100 dark:bg-dark-primary/5 rounded-full blur-3xl -z-10" />
            <div className="flex items-center gap-2 mb-6">
              <Globe className="w-5 h-5 text-emerald-500" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-dark-primary">{currentCity.country}</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-dark-text mb-6 leading-[1.1]">
              The Ultimate Lunch <br /><GradientText>Guide to {currentCity.name}</GradientText>
            </h1>
            <p className="text-xl sm:text-2xl text-slate-600 dark:text-dark-text-secondary max-w-3xl mb-10 leading-relaxed font-medium">
              {currentCity.longDescription}
            </p>
            <button
              onClick={() => handleSearch(currentCity.name)}
              className="group relative inline-flex items-center gap-3 bg-slate-900 dark:bg-dark-primary text-white dark:text-black px-8 py-4 rounded-2xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-slate-200 dark:shadow-dark-primary/20"
            >
              <Search className="w-5 h-5" />
              Explore All Spots in {currentCity.name}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </header>

          {/* Featured Picks */}
          {cityRecommendations.length > 0 && (
            <section className="mb-20">
              <div className="flex items-end justify-between mb-10">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-6 h-6 text-amber-500 fill-current" />
                    <h2 className="text-3xl font-black text-slate-900 dark:text-dark-text">Top Recommendations</h2>
                  </div>
                  <p className="text-slate-500 dark:text-dark-text-secondary text-lg">Our favorite lunch destinations across {currentCity.name}.</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {cityRecommendations.slice(0, 6).map((item, index) => (
                  <article
                    key={`${item.name}-${item.area}`}
                    className="group flex flex-col bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-[2.5rem] overflow-hidden transition-all hover:shadow-2xl hover:shadow-emerald-500/10 dark:hover:shadow-none hover:-translate-y-1"
                  >
                    <div className="relative h-64 overflow-hidden">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-100 dark:bg-dark-background flex items-center justify-center">
                          <Utensils className="w-12 h-12 text-slate-300 dark:text-dark-border" />
                        </div>
                      )}
                      <div className="absolute top-4 left-4 bg-white/90 dark:bg-dark-card/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 dark:border-dark-border shadow-lg">
                        <p className="text-[10px] font-black text-blue-600 dark:text-dark-primary uppercase tracking-widest">{item.cuisine}</p>
                      </div>
                      <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-md w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm border border-white/10">
                        #{index + 1}
                      </div>
                    </div>
                    <div className="p-8 flex-1 flex flex-col">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-dark-text group-hover:text-emerald-600 dark:group-hover:text-dark-primary transition-colors leading-tight">
                          {item.name}
                        </h3>
                        {item.rating && (
                          <div className="flex items-center gap-1 font-black text-emerald-600 dark:text-dark-primary">
                            <Star className="w-4 h-4 fill-current" />
                            {item.rating}
                          </div>
                        )}
                      </div>
                      <p className="text-slate-500 dark:text-dark-text-secondary font-medium mb-6 line-clamp-3 italic flex-1">
                        "{item.description || item.whyGo}"
                      </p>
                      
                      <div className="pt-6 border-t border-slate-100 dark:border-dark-border mt-auto">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center shrink-0">
                            <ChefHat className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <p className="text-xs font-bold text-slate-700 dark:text-dark-text">
                            <span className="text-slate-400 uppercase tracking-widest mr-2">Try:</span> {item.mustTry}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          {item.website && (
                            <a
                              href={item.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-black text-slate-900 dark:text-dark-text hover:text-emerald-600 dark:hover:text-emerald-primary underline decoration-2 underline-offset-4 decoration-slate-200 dark:decoration-dark-border"
                            >
                              Website
                            </a>
                          )}
                          <button
                            onClick={() => handleSearch(currentCity.name, item.cuisine)}
                            className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-600 dark:text-dark-primary uppercase tracking-widest hover:translate-x-1 transition-transform"
                          >
                            Find Similar <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Culture & Areas */}
          <div className="grid md:grid-cols-2 gap-8 mb-20">
            <section className="bg-white dark:bg-dark-card p-10 rounded-[3rem] border border-slate-200 dark:border-dark-border">
              <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/30 rounded-2xl flex items-center justify-center mb-8">
                <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-dark-text mb-6">Lunch Culture</h2>
              <p className="text-lg text-slate-600 dark:text-dark-text-secondary leading-relaxed font-medium">
                {currentCity.lunchCulture}
              </p>
            </section>
            <section className="bg-white dark:bg-dark-card p-10 rounded-[3rem] border border-slate-200 dark:border-dark-border">
              <div className="w-14 h-14 bg-blue-50 dark:bg-blue-950/30 rounded-2xl flex items-center justify-center mb-8">
                <MapPin className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-dark-text mb-6">Best Food Areas</h2>
              <div className="flex flex-wrap gap-3">
                {currentCity.bestAreas.map(area => (
                  <span key={area} className="px-5 py-3 rounded-2xl bg-slate-50 dark:bg-dark-background border border-slate-100 dark:border-dark-border text-slate-700 dark:text-dark-text font-bold text-sm">
                    {area}
                  </span>
                ))}
              </div>
            </section>
          </div>

          {/* Cuisines Explorer */}
          <section className="mb-20">
            <h2 className="text-3xl font-black text-slate-900 dark:text-dark-text mb-10 text-center">
              Explore <GradientText>{currentCity.name}</GradientText> by Cuisine
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {currentCity.cuisines.map((cuisineName) => {
                const cuisineObj = data.cuisines.find(c => c.name === cuisineName);
                if (!cuisineObj) return null;
                return (
                  <Link
                    key={cuisineObj.id}
                    to={`/guide/${currentCity.slug}/${cuisineObj.id}`}
                    className="group flex flex-col items-center justify-center p-8 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-[2rem] transition-all hover:border-blue-400 dark:hover:border-dark-primary hover:bg-blue-50/30 dark:hover:bg-dark-primary/5 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1"
                  >
                    <span className="text-5xl mb-4 group-hover:scale-125 transition-transform duration-500">{cuisineObj.emoji}</span>
                    <span className="text-lg font-black text-slate-800 dark:text-dark-text text-center leading-tight mb-2">{cuisineObj.name}</span>
                    <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Final CTA */}
          <div className="bg-slate-900 dark:bg-dark-card rounded-[3rem] p-8 sm:p-16 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/20 to-emerald-600/20 pointer-events-none" />
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-6 relative z-10">Find Your Perfect Lunch <br />in {currentCity.name}</h2>
            <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto relative z-10">
              {currentCity.name} offers {currentCity.cuisines.length}+ distinct cuisine styles. Use our real-time map to find exactly what you're craving.
            </p>
            <button
              onClick={() => handleSearch(currentCity.name)}
              className="relative z-10 inline-flex items-center gap-3 bg-white text-slate-900 px-10 py-5 rounded-2xl font-black text-lg transition-all hover:scale-[1.05] active:scale-[0.95] shadow-2xl shadow-blue-500/20"
            >
              <Search className="w-6 h-6" />
              Open Live Search
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Show all cities
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-dark-background">
      <Helmet>
        <title>{getTitle()}</title>
        <meta name="description" content={getDescription()} />
        <link rel="canonical" href={`${origin}/guide`} />
        <meta property="og:title" content={getTitle()} />
        <meta property="og:description" content={getDescription()} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${origin}/guide`} />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      {/* Page header */}
      <div className="bg-white dark:bg-dark-card border-b border-slate-200 dark:border-dark-border py-16 sm:py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-50 to-transparent dark:from-dark-primary/5 dark:to-transparent" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-600 dark:bg-dark-primary rounded-xl flex items-center justify-center">
              <Globe className="w-6 h-6 text-white dark:text-black" />
            </div>
            <span className="text-sm font-black uppercase tracking-[0.3em] text-blue-600 dark:text-dark-primary">Global Guides</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-black text-slate-900 dark:text-dark-text mb-8 leading-[0.9]">
            The World's Best <br /><GradientText>Lunch Destinations</GradientText>
          </h1>
          <p className="text-xl sm:text-2xl text-slate-500 dark:text-dark-text-secondary max-w-3xl leading-relaxed font-medium">
            Hand-crafted restaurant guides for the world's greatest food cities. Discover authentic flavors, local tips, and curated recommendations.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        {/* Cities grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
          {data.cities.map((cityData) => (
            <Link
              key={cityData.id}
              to={`/guide/${cityData.slug}`}
              className="group flex flex-col bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-[2.5rem] overflow-hidden transition-all hover:shadow-2xl hover:shadow-blue-500/10 dark:hover:shadow-none hover:-translate-y-1"
            >
              <div className="p-10 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-dark-text group-hover:text-blue-600 dark:group-hover:text-dark-primary transition-colors">
                      {cityData.name}
                    </h2>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-dark-text-secondary mt-1">{cityData.country}</p>
                  </div>
                  <div className="w-12 h-12 bg-slate-50 dark:bg-dark-background rounded-2xl flex items-center justify-center group-hover:bg-blue-600 dark:group-hover:bg-dark-primary transition-colors duration-500">
                    <MapPin className="w-6 h-6 text-slate-300 dark:text-dark-border group-hover:text-white dark:group-hover:text-black transition-colors" />
                  </div>
                </div>
                <p className="text-lg text-slate-500 dark:text-dark-text-secondary leading-relaxed font-medium mb-10 line-clamp-3">
                  {cityData.description}
                </p>
                <div className="mt-auto flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {cityData.cuisines.slice(0, 4).map((cuisineName) => {
                      const cuisineObj = data.cuisines.find(c => c.name === cuisineName);
                      return cuisineObj ? (
                        <div key={cuisineName} className="w-10 h-10 rounded-full bg-slate-50 dark:bg-dark-background border-4 border-white dark:border-dark-card flex items-center justify-center text-xl shadow-sm" title={cuisineObj.name}>
                          {cuisineObj.emoji}
                        </div>
                      ) : null;
                    })}
                  </div>
                  {cityData.cuisines.length > 4 && (
                    <span className="text-xs font-black text-slate-400 dark:text-dark-text-secondary">+{cityData.cuisines.length - 4} More</span>
                  )}
                  <div className="ml-auto w-10 h-10 rounded-full border border-slate-200 dark:border-dark-border flex items-center justify-center group-hover:border-blue-600 dark:group-hover:border-dark-primary transition-colors">
                    <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 dark:group-hover:text-dark-primary transition-all group-hover:translate-x-0.5" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* All cuisines section */}
        <section className="mb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 dark:text-dark-text mb-4">Discover by Flavor</h2>
            <p className="text-slate-500 dark:text-dark-text-secondary font-medium">Our guides cover every craving imaginable.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {data.cuisines.map((cuisineData) => (
              <div
                key={cuisineData.id}
                className="flex flex-col items-center gap-3 p-6 bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border rounded-3xl text-center hover:scale-105 transition-transform cursor-default"
              >
                <span className="text-4xl shadow-sm">{cuisineData.emoji}</span>
                <span className="text-xs font-black text-slate-700 dark:text-dark-text uppercase tracking-widest">{cuisineData.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Massive CTA */}
        <div className="bg-gradient-to-br from-blue-600 to-emerald-600 dark:from-dark-primary dark:to-orange-500 rounded-[4rem] p-1 shadow-2xl shadow-blue-500/20">
          <div className="bg-white dark:bg-dark-card rounded-[3.9rem] p-12 sm:p-20 flex flex-col lg:flex-row items-center gap-12 sm:gap-16">
            <div className="flex-1 text-center lg:text-left">
              <h2 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-dark-text mb-6">Ready to find <br />your next meal?</h2>
              <p className="text-xl text-slate-500 dark:text-dark-text-secondary font-medium leading-relaxed max-w-xl">
                Skip the guesswork. Use our real-time search engine to find the best-rated lunch spots within walking distance.
              </p>
            </div>
            <Link
              to="/restaurants"
              className="shrink-0 bg-slate-900 dark:bg-dark-primary text-white dark:text-black px-12 py-6 rounded-3xl font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-slate-900/20 dark:shadow-dark-primary/20"
            >
              Start Searching Now
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default CityGuidePage;
