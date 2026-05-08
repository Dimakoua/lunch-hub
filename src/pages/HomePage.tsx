import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MapPin, Shuffle, RotateCcw, Sun, Moon, Sparkles, ArrowRight, BookOpen } from 'lucide-react';
import { SearchBar } from '../components/SearchBar';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { SEOContent } from '../components/SEOContent';
import {
  generateFAQSchema,
  generateLocalBusinessSchema,
  renderSchema,
} from '../utils/schemaMarkup';

interface HomePageProps {
  onSearch: (query: string, radius: number, openNow: boolean) => void;
  onCurrentLocation: (radius: number, openNow: boolean) => void;
  loading: boolean;
  error: string | null;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const HomePage: React.FC<HomePageProps> = ({
  onSearch,
  onCurrentLocation,
  loading,
  error,
  theme,
  toggleTheme
}) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.thelunchub.com';
  const isPWA = typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches;
  const localBusinessSchema = generateLocalBusinessSchema(origin);
  const faqSchema = generateFAQSchema([
    {
      question: 'How do I search for restaurants?',
      answer: 'Enter your location or use current location, then select a search radius and filters to explore restaurants nearby.',
    },
    {
      question: 'What is the Spin Wheel feature?',
      answer: 'The Spin Wheel helps you choose a restaurant randomly when you can\'t decide, making lunch planning fun and fast.',
    },
    {
      question: 'Can I use Lunch Hub offline?',
      answer: 'Yes, Lunch Hub is a Progressive Web App, allowing cached access after the initial load for offline use.',
    },
    {
      question: 'Is my location data private?',
      answer: 'Location is only used to find nearby restaurants. Your data is not sold and is handled in a privacy-friendly manner.',
    },
    {
      question: 'Can Lunch Hub help with group lunch decisions?',
      answer: 'Yes, Lunch Hub includes tools that simplify group dining decisions with team coordination and polling features.',
    },
  ]);

  const GradientText = ({ children }: { children: React.ReactNode }) => (
    <span className="bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-dark-primary dark:to-orange-500 bg-clip-text text-transparent">
      {children}
    </span>
  );

  return (
    <main className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-dark-background">
      <Helmet>
        <title>Lunch Hub - Discover Best Restaurants Near You for Lunch</title>
        <meta name="description" content="Discover amazing lunch restaurants near you. Use our random picker, spin wheel, or map to find your next favorite meal in seconds!" />
        <meta name="keywords" content="lunch picker, find restaurants near me, random restaurant generator, lunch hub, where to eat, restaurant map" />
        <link rel="canonical" href={`${origin}/`} />
        <meta property="og:title" content="Lunch Hub - Discover Best Restaurants Near You" />
        <meta property="og:description" content="Take the stress out of lunch. Discover nearby eateries with our interactive map and fun decision tools." />
        <meta property="og:url" content={`${origin}/`} />
        <script type="application/ld+json">
          {renderSchema(localBusinessSchema)}
        </script>
        <script type="application/ld+json">
          {renderSchema(faqSchema)}
        </script>
      </Helmet>
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-0">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-100/50 dark:bg-dark-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-24 w-96 h-96 bg-emerald-100/50 dark:bg-dark-primary/5 rounded-full blur-3xl" />
      </div>

      {!isPWA && (
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={toggleTheme}
            className="p-3 bg-white/80 dark:bg-dark-card/80 backdrop-blur-md hover:bg-white dark:hover:bg-dark-card rounded-2xl shadow-sm border border-slate-200 dark:border-dark-border transition-all duration-200"
          >
            {theme === 'light' ? (
              <Moon className="w-6 h-6 text-slate-600" />
            ) : (
              <Sun className="w-6 h-6 text-yellow-400" />
            )}
          </button>
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12 sm:p-6 md:p-8">
        <div className="text-center mb-16 max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-10">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-dark-primary dark:to-orange-500 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-white dark:bg-dark-card rounded-[1.8rem] p-6 shadow-2xl border border-slate-100 dark:border-dark-border">
                <MapPin className="w-16 h-16 text-blue-600 dark:text-dark-primary" />
              </div>
            </div>
          </div>
          
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black text-slate-900 dark:text-dark-text tracking-tight leading-[0.9] mb-8">
            Decide Lunch <br /><GradientText>Faster.</GradientText>
          </h1>
          
          <p className="text-xl sm:text-2xl text-slate-500 dark:text-dark-text-secondary max-w-2xl mx-auto font-medium leading-relaxed">
            Stop scrolling. Start eating. Discover amazing restaurants near you with our live map and decision tools.
          </p>
        </div>

        <div className="w-full max-w-3xl mb-16">
          <SearchBar 
            onSearch={onSearch}
            onCurrentLocation={onCurrentLocation}
            loading={loading}
          />
        </div>

        {loading && (
          <div className="mb-12">
            <LoadingSpinner message="Locating your appetite..." />
          </div>
        )}

        {error && (
          <div className="mb-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-2xl p-6 max-w-md">
            <p className="text-red-700 dark:text-red-200 text-center font-bold">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl w-full mb-20">
          <div className="bg-white dark:bg-dark-card p-10 rounded-[2.5rem] border border-slate-200 dark:border-dark-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
            <div className="w-14 h-14 bg-blue-50 dark:bg-dark-primary/10 rounded-2xl flex items-center justify-center mb-6">
              <MapPin className="w-7 h-7 text-blue-600 dark:text-dark-primary" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-dark-text mb-3">Live Map</h3>
            <p className="text-slate-500 dark:text-dark-text-secondary font-medium">Find restaurants within walking distance of your current position.</p>
          </div>
          <div className="bg-white dark:bg-dark-card p-10 rounded-[2.5rem] border border-slate-200 dark:border-dark-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
            <div className="w-14 h-14 bg-purple-50 dark:bg-purple-900/10 rounded-2xl flex items-center justify-center mb-6">
              <Shuffle className="w-7 h-7 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-dark-text mb-3">Randomizer</h3>
            <p className="text-slate-500 dark:text-dark-text-secondary font-medium">Let our high-speed picker choose your next meal when you're indecisive.</p>
          </div>
          <div className="bg-white dark:bg-dark-card p-10 rounded-[2.5rem] border border-slate-200 dark:border-dark-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl flex items-center justify-center mb-6">
              <RotateCcw className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-dark-text mb-3">Spin Wheel</h3>
            <p className="text-slate-500 dark:text-dark-text-secondary font-medium">Gamify your lunch choice with our interactive wheel—perfect for groups!</p>
          </div>
        </div>

        {/* Cuisines CTA */}
        <div className="w-full max-w-5xl mb-24 grid md:grid-cols-2 gap-8">
          <div className="bg-slate-900 dark:bg-dark-card p-12 rounded-[3rem] text-white flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full -mr-16 -mt-16 blur-3xl" />
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Curated Guides</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black mb-6">Explore the <br /><span className="text-blue-400">Best Cuisines</span></h2>
            <p className="text-slate-400 text-lg mb-8 font-medium">
              Not sure what you're craving? Browse our expert city guides for the best-rated lunch spots by cuisine.
            </p>
            <Link
              to="/guide"
              className="inline-flex items-center gap-2 bg-white text-slate-900 hover:scale-[1.05] transition-transform px-8 py-4 rounded-2xl font-black w-fit"
            >
              Browse Guides
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-emerald-600 dark:from-dark-primary dark:to-orange-500 p-12 rounded-[3rem] text-white flex flex-col justify-center relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16 blur-3xl" />
            <div className="flex items-center gap-2 mb-6">
              <BookOpen className="w-5 h-5 text-white" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-blue-100">Lunch Journal</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black mb-6">Get Food <br /><span className="text-blue-100">Inspiration</span></h2>
            <p className="text-blue-50 text-lg mb-8 font-medium">
              Read our latest blog posts for restaurant reviews, dining tips, and healthy lunch habits.
            </p>
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30 transition-all px-8 py-4 rounded-2xl font-black w-fit"
            >
              Read Blog
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        <div className="w-full max-w-5xl border-t border-slate-200 dark:border-dark-border pt-16">
          <SEOContent />
        </div>
      </div>
    </main>
  );
};
export default HomePage;
