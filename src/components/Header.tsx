import React from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ theme, toggleTheme }) => {
  const { t } = useTranslation();

  // const changeLanguage = (lng: string) => {
  //   i18n.changeLanguage(lng);
  // };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md py-4 px-6 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-dark-primary dark:to-orange-500 rounded-xl p-2">
          <MapPin className="w-6 h-6 text-white" />
        </div>
        <Link to="/">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-dark-primary dark:to-orange-500 bg-clip-text text-transparent cursor-pointer">
            {t('app_title')}
          </div>
        </Link>
      </div>
      <nav className="flex items-center space-x-4">
        <Link to="/guide" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">
          Guides
        </Link>
        <Link to="/blog" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">
          {t('blog')}
        </Link>
        {/* <select
          onChange={(e) => changeLanguage(e.target.value)}
          value={i18n.language}
          className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md px-2 py-1"
        >
          <option value="en">English</option>
          <option value="es">Español</option>
        </select> */}
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
      </nav>
    </header>
  );
};
