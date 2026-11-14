import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { APIProvider, Map, Marker, useMap } from '@vis.gl/react-google-maps';
import { X, Star, MapPin, Phone, Globe, Clock, Navigation, Share2, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Restaurant } from '../types/restaurant';
import { formatDistance } from '../utils/distanceFormatter';
import {
  searchGooglePlace,
  getGooglePlaceDetails,
  type GooglePlaceDetails,
} from '../services/googlePlaces';

const CLEAN_FOOD_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { featureType: 'poi.attraction', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.government', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.medical', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.place_of_worship', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.school', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.sports_complex', stylers: [{ visibility: 'off' }] },
];

interface GoogleMapCanvasProps {
  apiKey: string;
  center: [number, number];
  zoom: number;
  radius?: number;
  restaurants: Restaurant[];
  selectedRestaurant?: Restaurant | null;
  routeGeometry?: [number, number][] | null;
  routeDistance?: number | null;
  routeDuration?: number | null;
  onRestaurantClick: (restaurant: Restaurant) => void;
  onCenterDrag: (lat: number, lon: number) => void;
  onMarkVisited?: (restaurant: Restaurant) => void;
  onShare?: (restaurant: Restaurant) => void;
}

const RadiusCircle: React.FC<{ center: [number, number]; radius?: number }> = ({ center, radius }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !radius || typeof google === 'undefined') return;

    const circle = new google.maps.Circle({
      map,
      center: { lat: center[0], lng: center[1] },
      radius,
      strokeColor: '#2563EB',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#2563EB',
      fillOpacity: 0.1,
      clickable: false,
    });

    return () => {
      circle.setMap(null);
    };
  }, [map, center, radius]);

  return null;
};

const RoutePolyline: React.FC<{
  routeGeometry?: [number, number][] | null;
  fitTrigger: number;
}> = ({ routeGeometry, fitTrigger }) => {
  const map = useMap();
  const lastFitTriggerRef = useRef(0);

  useEffect(() => {
    if (!map || !routeGeometry?.length || typeof google === 'undefined') return;

    const path = routeGeometry.map(([lat, lng]) => ({ lat, lng }));
    const polyline = new google.maps.Polyline({
      map,
      path,
      strokeColor: '#2563EB',
      strokeOpacity: 0.85,
      strokeWeight: 5,
    });

    if (fitTrigger > 0 && fitTrigger !== lastFitTriggerRef.current) {
      lastFitTriggerRef.current = fitTrigger;
      const bounds = new google.maps.LatLngBounds();
      path.forEach((p) => bounds.extend(p));
      map.fitBounds(bounds, { top: 80, right: 360, bottom: 80, left: 40 });
    }

    return () => {
      polyline.setMap(null);
    };
  }, [map, routeGeometry, fitTrigger]);

  return null;
};

// Pan the map only when the search center coordinates actually change,
// or when the user triggers a recenter event, without locking panning.
const MapCenterUpdater: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  const [centerLat, centerLng] = center;

  useEffect(() => {
    if (!map) return;
    map.panTo({ lat: centerLat, lng: centerLng });
  }, [map, centerLat, centerLng]);

  useEffect(() => {
    if (!map) return;
    const onRecenter = () => {
      map.panTo({ lat: centerLat, lng: centerLng });
    };
    window.addEventListener('lunchhub:recenter', onRecenter);
    return () => window.removeEventListener('lunchhub:recenter', onRecenter);
  }, [map, centerLat, centerLng]);

  return null;
};

export const GoogleMapCanvas: React.FC<GoogleMapCanvasProps> = ({
  apiKey,
  center,
  zoom,
  radius,
  restaurants,
  selectedRestaurant,
  routeGeometry,
  routeDistance,
  routeDuration,
  onRestaurantClick,
  onCenterDrag,
  onMarkVisited,
  onShare,
}) => {
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'photos' | 'hours'>('overview');
  const [fitTrigger, setFitTrigger] = useState(0);
  const [placeDetails, setPlaceDetails] = useState<GooglePlaceDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [visitedFeedback, setVisitedFeedback] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const lightboxDialogRef = useRef<HTMLDialogElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const dragStartYRef = useRef<number | null>(null);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDraggingSheet, setIsDraggingSheet] = useState(false);
  const photoUrls = useMemo(() => placeDetails?.photoUrls ?? [], [placeDetails]);

  useEffect(() => {
    const dialog = lightboxDialogRef.current;
    if (!dialog) return;
    if (lightboxIndex !== null && photoUrls[lightboxIndex]) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [lightboxIndex, photoUrls]);

  // Fallback light-dismiss for browsers without <dialog closedby="any"> (e.g. Safari)
  useEffect(() => {
    const dialog = lightboxDialogRef.current;
    if (!dialog || 'closedBy' in HTMLDialogElement.prototype) return;

    const isOutside = (e: PointerEvent) => {
      const r = dialog.getBoundingClientRect();
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };

    let pressedOutside = false;
    const onPointerDown = (e: PointerEvent) => {
      pressedOutside = isOutside(e);
    };
    const onPointerUp = (e: PointerEvent) => {
      if (pressedOutside && isOutside(e)) {
        dialog.close();
      }
      pressedOutside = false;
    };

    dialog.addEventListener('pointerdown', onPointerDown);
    dialog.addEventListener('pointerup', onPointerUp);
    return () => {
      dialog.removeEventListener('pointerdown', onPointerDown);
      dialog.removeEventListener('pointerup', onPointerUp);
    };
  }, []);

  // Load Google Places details when a restaurant is selected (e.g. from Random Picker, Wheel, or List)
  useEffect(() => {
    if (!selectedRestaurant) {
      setPanelOpen(false);
      setPlaceDetails(null);
      return;
    }

    setPanelOpen(true);
    setActiveTab('overview');
    setVisitedFeedback(false);
    setDragOffsetY(0);
    setIsDraggingSheet(false);
    let cancelled = false;
    setLoadingDetails(true);
    setPlaceDetails(null);

    (async () => {
      try {
        const placeId = selectedRestaurant.id.startsWith('gplace:')
          ? selectedRestaurant.id.slice('gplace:'.length)
          : (
              await searchGooglePlace(
                selectedRestaurant.name,
                selectedRestaurant.lat,
                selectedRestaurant.lon
              )
            )?.placeId;

        if (cancelled || !placeId) {
          setLoadingDetails(false);
          return;
        }
        const details = await getGooglePlaceDetails(placeId);
        if (!cancelled) {
          setPlaceDetails(details);
        }
      } finally {
        if (!cancelled) setLoadingDetails(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedRestaurant]);

  // Handle clicking a native Google Maps POI icon (no duplicate pins needed)
  const handleGooglePoiClick = async (placeId: string, lat: number, lng: number) => {
    setPanelOpen(true);
    setActiveTab('overview');
    setVisitedFeedback(false);
    setDragOffsetY(0);
    setIsDraggingSheet(false);
    setLoadingDetails(true);
    setPlaceDetails(null);

    try {
      const details = await getGooglePlaceDetails(placeId);
      setPlaceDetails(details);

      onRestaurantClick({
        id: `gplace:${placeId}`,
        name: details?.name || 'Selected Place',
        lat,
        lon: lng,
        address: details?.formattedAddress,
        cuisine: 'restaurant',
        amenity: 'restaurant',
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  const walkMinutes = routeDuration ? Math.max(1, Math.round(routeDuration / 60)) : null;

  return (
    <div className="relative w-full h-full">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={{ lat: center[0], lng: center[1] }}
          defaultZoom={zoom}
          gestureHandling="greedy"
          disableDefaultUI={false}
          clickableIcons={true}
          styles={CLEAN_FOOD_MAP_STYLES}
          onClick={(e) => {
            if (e.detail.placeId && e.detail.latLng) {
              e.stop();
              handleGooglePoiClick(
                e.detail.placeId,
                e.detail.latLng.lat,
                e.detail.latLng.lng
              );
            }
          }}
          className="w-full h-full rounded-xl"
        >
          <MapCenterUpdater center={center} />
          <RadiusCircle center={center} radius={radius} />
          <RoutePolyline routeGeometry={routeGeometry} fitTrigger={fitTrigger} />
          <Marker
            position={{ lat: center[0], lng: center[1] }}
            draggable={true}
            title="Drag to move your pin"
            onDragEnd={(e) => {
              const lat = e.latLng?.lat();
              const lng = e.latLng?.lng();
              if (lat !== undefined && lng !== undefined) {
                onCenterDrag(lat, lng);
              }
            }}
          />
          {(selectedRestaurant && !restaurants.some((r) => r.id === selectedRestaurant.id)
            ? [...restaurants, selectedRestaurant]
            : restaurants
          ).map((restaurant) => {
            const isSelected = selectedRestaurant?.id === restaurant.id;
            const hasDeal = Boolean(restaurant.deal);
            return (
              <Marker
                key={restaurant.id}
                position={{ lat: restaurant.lat, lng: restaurant.lon }}
                title={
                  hasDeal
                    ? `🔥 ${restaurant.deal!.price} — ${restaurant.name}`
                    : restaurant.name
                }
                onClick={() => {
                  onRestaurantClick(restaurant);
                  setPanelOpen(true);
                }}
                icon={
                  typeof google !== 'undefined'
                    ? {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: isSelected ? 10 : hasDeal ? 8 : 6,
                        fillColor: isSelected
                          ? '#2563EB'
                          : hasDeal
                          ? '#10B981'
                          : '#F97316',
                        fillOpacity: 0.95,
                        strokeColor: hasDeal ? '#FBBF24' : '#FFFFFF',
                        strokeWeight: hasDeal ? 3 : 2,
                      }
                    : undefined
                }
              />
            );
          })}
        </Map>
      </APIProvider>

      {panelOpen && selectedRestaurant && typeof document !== 'undefined' && createPortal(
        <aside
          ref={sheetRef}
          aria-label="Restaurant details"
          onTouchStart={(e) => {
            if (window.innerWidth >= 640) return;
            if (sheetRef.current && sheetRef.current.scrollTop <= 0) {
              dragStartYRef.current = e.touches[0].clientY;
              setIsDraggingSheet(true);
            }
          }}
          onTouchMove={(e) => {
            if (dragStartYRef.current === null) return;
            const deltaY = e.touches[0].clientY - dragStartYRef.current;
            if (deltaY > 0) {
              setDragOffsetY(deltaY);
            } else {
              dragStartYRef.current = null;
              setDragOffsetY(0);
              setIsDraggingSheet(false);
            }
          }}
          onTouchEnd={() => {
            if (dragStartYRef.current === null) return;
            const shouldClose = dragOffsetY > 90;
            dragStartYRef.current = null;
            setIsDraggingSheet(false);
            setDragOffsetY(0);
            if (shouldClose) setPanelOpen(false);
          }}
          style={
            dragOffsetY > 0
              ? {
                  transform: `translateY(${dragOffsetY}px)`,
                  transition: isDraggingSheet ? 'none' : 'transform 200ms ease-out',
                }
              : { transition: 'transform 200ms ease-out' }
          }
          className="fixed inset-x-0 bottom-0 max-h-[72dvh] pb-[env(safe-area-inset-bottom)] rounded-t-3xl z-[10000] sm:inset-x-auto sm:top-3 sm:right-3 sm:bottom-3 sm:w-80 sm:max-h-none sm:pb-0 sm:rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-800 overflow-y-auto flex flex-col"
        >
          {/* Mobile drag handle */}
          <div
            onPointerDown={(e) => {
              if (window.innerWidth >= 640) return;
              e.currentTarget.setPointerCapture(e.pointerId);
              dragStartYRef.current = e.clientY;
              setIsDraggingSheet(true);
            }}
            onPointerMove={(e) => {
              if (dragStartYRef.current === null) return;
              const deltaY = e.clientY - dragStartYRef.current;
              setDragOffsetY(Math.max(0, deltaY));
            }}
            onPointerUp={() => {
              if (dragStartYRef.current === null) return;
              const shouldClose = dragOffsetY > 90;
              dragStartYRef.current = null;
              setIsDraggingSheet(false);
              setDragOffsetY(0);
              if (shouldClose) setPanelOpen(false);
            }}
            onPointerCancel={() => {
              dragStartYRef.current = null;
              setIsDraggingSheet(false);
              setDragOffsetY(0);
            }}
            className="sm:hidden sticky top-0 z-20 flex justify-center py-2.5 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm touch-none cursor-grab active:cursor-grabbing shrink-0"
          >
            <div className="w-10 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
          </div>
          <div className="relative shrink-0">
            {placeDetails?.photoUrls?.[0] ? (
              <button
                type="button"
                onClick={() => setLightboxIndex(0)}
                className="block w-full text-left cursor-zoom-in"
              >
                <img
                  src={placeDetails.photoUrls[0]}
                  alt={selectedRestaurant.name}
                  className="w-full h-44 object-cover"
                />
              </button>
            ) : (
              <div className="w-full h-24 bg-gradient-to-r from-blue-600 to-indigo-600" />
            )}
            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              aria-label="Close panel"
              className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/90 dark:bg-gray-900/90 text-gray-800 dark:text-gray-100 shadow hover:bg-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-3 flex-1">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-snug">
                {placeDetails?.name || selectedRestaurant.name}
              </h2>
              <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-gray-600 dark:text-gray-400">
                {placeDetails?.rating && (
                  <span className="inline-flex items-center gap-1 font-semibold text-gray-900 dark:text-white">
                    {placeDetails.rating.toFixed(1)}
                    <span className="inline-flex items-center">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < Math.round(placeDetails.rating!)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      ))}
                    </span>
                    {placeDetails.userRatingsTotal !== undefined && (
                      <span className="font-normal text-gray-500">
                        ({placeDetails.userRatingsTotal.toLocaleString()})
                      </span>
                    )}
                  </span>
                )}
                {placeDetails?.priceLevel !== undefined && (
                  <span>· {'$'.repeat(Math.max(1, placeDetails.priceLevel))}</span>
                )}
                {selectedRestaurant.cuisine && (
                  <span className="capitalize">
                    · {selectedRestaurant.cuisine.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
            </div>

            <div className="flex border-b border-gray-200 dark:border-gray-800 text-xs font-medium overflow-x-auto">
              {(
                [
                  ['overview', 'Overview'],
                  ['reviews', `Reviews${placeDetails?.reviews?.length ? ` (${placeDetails.reviews.length})` : ''}`],
                  ['photos', `Photos${placeDetails?.photoUrls?.length ? ` (${placeDetails.photoUrls.length})` : ''}`],
                  ['hours', 'Hours'],
                ] as const
              ).map(([tabKey, label]) => (
                <button
                  key={tabKey}
                  type="button"
                  onClick={() => setActiveTab(tabKey)}
                  className={`px-3 py-2 border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === tabKey
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setFitTrigger((c) => c + 1)}
                className="flex flex-col items-center gap-1 py-2 px-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 text-xs font-medium"
              >
                <Navigation className="w-4 h-4" />
                <span>Directions</span>
              </button>
              {onMarkVisited && (
                <button
                  type="button"
                  onClick={() => {
                    onMarkVisited(selectedRestaurant);
                    setVisitedFeedback(true);
                  }}
                  className={`flex flex-col items-center gap-1 py-2 px-2 rounded-xl text-xs font-medium transition-colors ${
                    visitedFeedback
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{visitedFeedback ? 'Visited!' : 'Visited'}</span>
                </button>
              )}
              {onShare && (
                <button
                  type="button"
                  onClick={() => onShare(selectedRestaurant)}
                  className="flex flex-col items-center gap-1 py-2 px-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 text-xs font-medium"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
              )}
            </div>

            {walkMinutes !== null && routeDistance !== null && routeDistance !== undefined && (
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-xs text-blue-800 dark:text-blue-200">
                <span className="font-medium">Walking route shown on map</span>
                <span className="font-semibold">
                  {walkMinutes} min · {formatDistance(routeDistance)}
                </span>
              </div>
            )}

            {loadingDetails && (
              <p className="text-xs text-gray-400 animate-pulse">Loading place details…</p>
            )}

            {activeTab === 'overview' && (
              <div className="space-y-2.5 text-sm text-gray-700 dark:text-gray-300 border-t border-gray-100 dark:border-gray-800 pt-3">
                {placeDetails?.editorialSummary && (
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    {placeDetails.editorialSummary}
                  </p>
                )}

                {placeDetails?.serviceOptions && (
                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    {placeDetails.serviceOptions.dineIn && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                        ✓ Dine-in
                      </span>
                    )}
                    {placeDetails.serviceOptions.takeout && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                        ✓ Takeout
                      </span>
                    )}
                    {placeDetails.serviceOptions.delivery && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                        ✓ Delivery
                      </span>
                    )}
                  </div>
                )}

                {(placeDetails?.formattedAddress || selectedRestaurant.address) && (
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span className="text-xs leading-relaxed">
                      {placeDetails?.formattedAddress || selectedRestaurant.address}
                    </span>
                  </div>
                )}

                {placeDetails?.openNow !== undefined && (
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                    <span
                      className={`text-xs font-medium ${
                        placeDetails.openNow ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {placeDetails.openNow ? 'Open now' : 'Closed'}
                    </span>
                  </div>
                )}

                {placeDetails?.phoneNumber && (
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-blue-600 shrink-0" />
                    <a
                      href={`tel:${placeDetails.phoneNumber}`}
                      className="text-xs hover:underline"
                    >
                      {placeDetails.phoneNumber}
                    </a>
                  </div>
                )}

                {placeDetails?.website && (
                  <div className="flex items-center gap-2.5">
                    <Globe className="w-4 h-4 text-blue-600 shrink-0" />
                    <a
                      href={placeDetails.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline truncate"
                    >
                      Menu / Website ({placeDetails.website.replace(/^https?:\/\//, '')})
                    </a>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-3 border-t border-gray-100 dark:border-gray-800 pt-3">
                {placeDetails?.reviews?.length ? (
                  placeDetails.reviews.map((rev, idx) => (
                    <div key={idx} className="pb-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-900 dark:text-white">{rev.author}</span>
                        {rev.relativeTime && <span className="text-gray-400">{rev.relativeTime}</span>}
                      </div>
                      {rev.rating !== undefined && (
                        <div className="flex items-center gap-0.5 my-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < Math.round(rev.rating!)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-gray-300 dark:text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                      {rev.text && (
                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                          {rev.text}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400">No reviews available yet.</p>
                )}
              </div>
            )}

            {activeTab === 'photos' && (
              <div className="grid grid-cols-2 gap-2 border-t border-gray-100 dark:border-gray-800 pt-3">
                {placeDetails?.photoUrls?.length ? (
                  placeDetails.photoUrls.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setLightboxIndex(idx)}
                      className="block rounded-lg overflow-hidden cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <img
                        src={url}
                        alt={`${selectedRestaurant.name} photo ${idx + 1}`}
                        className="w-full h-24 object-cover hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 col-span-2">No photos available.</p>
                )}
              </div>
            )}

            {activeTab === 'hours' && (
              <div className="space-y-1.5 border-t border-gray-100 dark:border-gray-800 pt-3 text-xs text-gray-600 dark:text-gray-300">
                {placeDetails?.weekdayText?.length ? (
                  placeDetails.weekdayText.map((line) => (
                    <div key={line} className="py-0.5">
                      {line}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400">Opening hours not available.</p>
                )}
              </div>
            )}
          </div>
        </aside>,
        document.body
      )}

      <dialog
        ref={lightboxDialogRef}
        {...({ closedby: 'any' } as Record<string, string>)}
        aria-label={`${selectedRestaurant?.name || 'Restaurant'} photos`}
        onClose={() => setLightboxIndex(null)}
        onKeyDown={(e) => {
          if (photoUrls.length <= 1 || lightboxIndex === null) return;
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            setLightboxIndex((lightboxIndex - 1 + photoUrls.length) % photoUrls.length);
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            setLightboxIndex((lightboxIndex + 1) % photoUrls.length);
          }
        }}
        className="m-auto max-w-[92vw] max-h-[90vh] bg-transparent p-0 border-0 outline-none overflow-visible"
      >
        {lightboxIndex !== null && photoUrls[lightboxIndex] && (
          <div className="relative flex items-center justify-center">
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              aria-label="Close photo viewer"
              autoFocus
              className="absolute -top-3 -right-3 z-10 p-2 rounded-full bg-white/95 text-gray-900 shadow-lg hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <X className="w-5 h-5" />
            </button>

            {photoUrls.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setLightboxIndex((lightboxIndex - 1 + photoUrls.length) % photoUrls.length)
                }
                aria-label="Previous photo"
                className="absolute left-3 z-10 p-2.5 rounded-full bg-black/60 text-white hover:bg-black/80 shadow-lg backdrop-blur-sm transition-colors focus:outline-none focus:ring-2 focus:ring-white"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <img
              src={photoUrls[lightboxIndex]}
              alt={`${selectedRestaurant?.name || 'Restaurant'} photo ${lightboxIndex + 1} of ${photoUrls.length}`}
              className="max-w-[88vw] max-h-[85vh] rounded-xl object-contain shadow-2xl bg-black/20"
            />

            {photoUrls.length > 1 && (
              <button
                type="button"
                onClick={() => setLightboxIndex((lightboxIndex + 1) % photoUrls.length)}
                aria-label="Next photo"
                className="absolute right-3 z-10 p-2.5 rounded-full bg-black/60 text-white hover:bg-black/80 shadow-lg backdrop-blur-sm transition-colors focus:outline-none focus:ring-2 focus:ring-white"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            {photoUrls.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/65 text-white text-xs font-medium backdrop-blur-sm">
                {lightboxIndex + 1} / {photoUrls.length}
              </div>
            )}
          </div>
        )}
      </dialog>
    </div>
  );
};
