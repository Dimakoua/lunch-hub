import React from 'react';
import { Home, MapPin, BookOpen } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const BottomNav: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pb-safe z-[2000] lg:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-16">
        <Link 
          to="/" 
          className={`flex flex-col items-center gap-1 transition-colors ${
            isActive('/') ? 'text-blue-600 dark:text-orange-500' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-medium uppercase tracking-wider">Home</span>
        </Link>
        <Link 
          to="/restaurants" 
          className={`flex flex-col items-center gap-1 transition-colors ${
            isActive('/restaurants') ? 'text-blue-600 dark:text-orange-500' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <MapPin className="w-6 h-6" />
          <span className="text-[10px] font-medium uppercase tracking-wider">Find</span>
        </Link>
        <Link 
          to="/blog" 
          className={`flex flex-col items-center gap-1 transition-colors ${
            isActive('/blog') ? 'text-blue-600 dark:text-orange-500' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <BookOpen className="w-6 h-6" />
          <span className="text-[10px] font-medium uppercase tracking-wider">Blog</span>
        </Link>
      </div>
    </nav>
  );
};
