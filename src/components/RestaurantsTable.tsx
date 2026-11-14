import React, { useId, useMemo, useState } from 'react';
import { ArrowUp, CheckCircle2, EyeOff, MapPin } from 'lucide-react';
import { Restaurant } from '../types/restaurant';
import { formatDistance, formatWalkingTime, haversineDistance } from '../utils/distanceFormatter';

interface RestaurantsTableProps {
  restaurants: Restaurant[];
  userLat: number;
  userLon: number;
  onViewOnMap: (restaurant: Restaurant) => void;
  onMarkVisited?: (restaurant: Restaurant) => void;
  onHide?: (restaurant: Restaurant) => void;
}

type SortColumn = 'name' | 'cuisine' | 'address' | 'distance' | 'deal';
type SortDirection = 'ascending' | 'descending';

const textCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

export const RestaurantsTable: React.FC<RestaurantsTableProps> = ({
  restaurants,
  userLat,
  userLon,
  onViewOnMap,
  onMarkVisited,
  onHide,
}) => {
  const captionId = useId();
  const [sortCol, setSortCol] = useState<SortColumn>('distance');
  const [sortDir, setSortDir] = useState<SortDirection>('ascending');
  const [statusMessage, setStatusMessage] = useState('');

  const rowsWithDistance = useMemo(
    () =>
      restaurants.map((restaurant) => ({
        restaurant,
        distance: haversineDistance(userLat, userLon, restaurant.lat, restaurant.lon),
      })),
    [restaurants, userLat, userLon]
  );

  const sortedRows = useMemo(() => {
    const factor = sortDir === 'ascending' ? 1 : -1;
    return [...rowsWithDistance].sort((a, b) => {
      switch (sortCol) {
        case 'distance':
          return factor * (a.distance - b.distance);
        case 'name':
          return factor * textCollator.compare(a.restaurant.name, b.restaurant.name);
        case 'cuisine':
          return (
            factor *
            textCollator.compare(
              a.restaurant.cuisine || a.restaurant.amenity || '',
              b.restaurant.cuisine || b.restaurant.amenity || ''
            )
          );
        case 'address':
          return (
            factor *
            textCollator.compare(a.restaurant.address || '', b.restaurant.address || '')
          );
        case 'deal':
          return (
            factor *
            textCollator.compare(
              a.restaurant.deal ? a.restaurant.deal.price : '',
              b.restaurant.deal ? b.restaurant.deal.price : ''
            )
          );
      }
    });
  }, [rowsWithDistance, sortCol, sortDir]);

  const handleSort = (col: SortColumn, label: string) => {
    const nextDir: SortDirection =
      sortCol === col && sortDir === 'ascending' ? 'descending' : 'ascending';
    setSortCol(col);
    setSortDir(nextDir);
    setStatusMessage(`Sorted by ${label}, ${nextDir}, ${sortedRows.length} rows`);
  };

  const renderSortHeader = (col: SortColumn, label: string) => {
    const isSorted = sortCol === col;
    return (
      <th
        scope="col"
        aria-sort={isSorted ? sortDir : undefined}
        className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/95 border-b border-gray-200 dark:border-dark-border"
      >
        <button
          type="button"
          onClick={() => handleSort(col, label)}
          className="hover:text-gray-900 dark:hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <span>{label}</span>
          <ArrowUp className="w-3.5 h-3.5 sort-icon shrink-0" aria-hidden="true" />
        </button>
      </th>
    );
  };

  return (
    <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-dark-border shadow-sm overflow-hidden">
      <div role="status" className="sr-only">
        {statusMessage}
      </div>

      {/* Mobile compact card list */}
      <div className="md:hidden divide-y divide-gray-100 dark:divide-dark-border">
        {sortedRows.map(({ restaurant, distance }) => {
          const typeLabel = (restaurant.cuisine || restaurant.amenity || 'Restaurant')
            .split(';')[0]
            .replace(/_/g, ' ');
          return (
            <div
              key={restaurant.id}
              className="p-3.5 flex flex-col gap-2 hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-dark-text truncate">
                      {restaurant.name}
                    </h3>
                    {restaurant.deal && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                        🔥 {restaurant.deal.price}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-dark-text-secondary truncate mt-0.5 capitalize">
                    {typeLabel}
                    {restaurant.address ? ` · ${restaurant.address}` : ''}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 tabular-nums">
                  <div className="text-xs font-semibold text-gray-800 dark:text-dark-text">
                    {formatDistance(distance)}
                  </div>
                  <div className="text-[11px] text-gray-400">
                    {formatWalkingTime(distance)}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => onViewOnMap(restaurant)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300"
                >
                  <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Map</span>
                </button>
                {onMarkVisited && (
                  <button
                    type="button"
                    onClick={() => onMarkVisited(restaurant)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-emerald-100 hover:text-emerald-800 dark:bg-gray-800 dark:text-gray-200"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Visited</span>
                  </button>
                )}
                {onHide && (
                  <button
                    type="button"
                    onClick={() => onHide(restaurant)}
                    aria-label={`Hide ${restaurant.name}`}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                  >
                    <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop table */}
      <div
        tabIndex={0}
        role="region"
        aria-labelledby={captionId}
        className="hidden md:block restaurants-table-wrapper focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <table className="restaurants-table text-sm text-left">
          <caption id={captionId} className="sr-only">
            Nearby restaurants ({sortedRows.length} results)
          </caption>
          <thead>
            <tr>
              {renderSortHeader('name', 'Name')}
              {renderSortHeader('cuisine', 'Type')}
              {renderSortHeader('address', 'Address')}
              {renderSortHeader('distance', 'Distance')}
              {renderSortHeader('deal', 'Deal')}
              <th
                scope="col"
                className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/95 border-b border-gray-200 dark:border-dark-border text-right"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
            {sortedRows.map(({ restaurant, distance }) => {
              const typeLabel = (restaurant.cuisine || restaurant.amenity || 'Restaurant')
                .split(';')[0]
                .replace(/_/g, ' ');
              return (
                <tr
                  key={restaurant.id}
                  className="hover:bg-blue-50/50 dark:hover:bg-gray-800/60 transition-colors"
                >
                  <th
                    scope="row"
                    className="px-4 py-3 font-semibold text-gray-900 dark:text-dark-text bg-white dark:bg-dark-card whitespace-nowrap"
                  >
                    <button
                      type="button"
                      onClick={() => onViewOnMap(restaurant)}
                      className="text-left hover:text-blue-600 dark:hover:text-blue-400 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                    >
                      {restaurant.name}
                    </button>
                  </th>
                  <td className="px-4 py-3 text-gray-600 dark:text-dark-text-secondary capitalize whitespace-nowrap">
                    {typeLabel}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-dark-text-secondary max-w-[260px] truncate">
                    {restaurant.address || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-dark-text whitespace-nowrap tabular-nums">
                    <span className="font-medium">{formatDistance(distance)}</span>
                    <span className="ml-1.5 text-xs text-gray-400">
                      ({formatWalkingTime(distance)})
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {restaurant.deal ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                        🔥 {restaurant.deal.price}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <div className="inline-flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onViewOnMap(restaurant)}
                        title="Show on map"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-900/60"
                      >
                        <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Map</span>
                      </button>
                      {onMarkVisited && (
                        <button
                          type="button"
                          onClick={() => onMarkVisited(restaurant)}
                          title="Mark as visited"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-emerald-100 hover:text-emerald-800 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-emerald-900/50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Visited</span>
                        </button>
                      )}
                      {onHide && (
                        <button
                          type="button"
                          onClick={() => onHide(restaurant)}
                          title="Hide place"
                          aria-label={`Hide ${restaurant.name}`}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                        >
                          <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
