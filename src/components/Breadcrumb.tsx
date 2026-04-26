import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { generateBreadcrumbSchema, renderSchema } from '../utils/schemaMarkup';

export interface BreadcrumbItem {
  name: string;
  url?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = '' }) => {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.thelunchub.com';
  const breadcrumbItems = items.map((item) => ({
    name: item.name,
    url: item.url ? `${baseUrl}${item.url}` : undefined,
  }));
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems);

  return (
    <>
      <Helmet>
        <script type="application/ld+json">{renderSchema(breadcrumbSchema)}</script>
      </Helmet>

      <nav
        className={`flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-300 ${className}`}
        aria-label="Breadcrumb"
      >
        {items.map((item, index) => (
          <React.Fragment key={`${item.name}-${index}`}>
            {index > 0 && (
              <span className="text-gray-400 dark:text-gray-500">/</span>
            )}
            {item.url ? (
              <Link
                to={item.url}
                className="text-gray-700 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
              >
                {item.name}
              </Link>
            ) : (
              <span className="font-semibold text-gray-900 dark:text-white">{item.name}</span>
            )}
          </React.Fragment>
        ))}
      </nav>
    </>
  );
};
