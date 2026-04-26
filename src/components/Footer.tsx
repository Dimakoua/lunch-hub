import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-emerald-600 p-3 shadow-lg shadow-blue-500/10">
                <span className="text-white text-lg font-bold">LH</span>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">Lunch Hub</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">A smarter way to discover lunch nearby.</p>
              </div>
            </div>
            <p className="max-w-md text-sm leading-6">
              Professional restaurant discovery with maps, reviews, and meal inspiration designed for busy eaters who want fast, confident decisions.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:col-span-2">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-900 dark:text-white">Product</h2>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <Link to="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/restaurants" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Find restaurants
                  </Link>
                </li>
                <li>
                  <Link to="/blog" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-900 dark:text-white">Need help?</h2>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <a href="mailto:hello@lunchhub.com" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    hello@lunchhub.com
                  </a>
                </li>
                <li>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Built for lunch lovers.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-200 dark:border-gray-800 pt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">© {currentYear} Lunch Hub. All rights reserved.</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Designed to help you discover better lunch options faster.</p>
        </div>
      </div>
    </footer>
  );
};
