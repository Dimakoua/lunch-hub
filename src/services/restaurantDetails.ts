import { Restaurant } from '../types/restaurant';
import { getFallbackRestaurantImage } from '../utils/restaurantImages';

export interface RestaurantDetails {
  id: string;
  name: string;
  imageUrl: string;
  menuUrl?: string;
  rating?: number;
  reviewsCount?: number;
  source: 'scraped' | 'wiki' | 'fallback' | 'kv_cache' | 'client_fallback';
}

const detailsMemoryCache = new Map<string, RestaurantDetails>();

export async function fetchRestaurantDetails(restaurant: Restaurant): Promise<RestaurantDetails> {
  if (restaurant.image) {
    const details: RestaurantDetails = {
      id: restaurant.id,
      name: restaurant.name,
      imageUrl: restaurant.image,
      menuUrl: restaurant.website || `https://www.google.com/search?q=${encodeURIComponent(restaurant.name + ' ' + (restaurant.address || '') + ' menu')}`,
      source: 'scraped',
    };
    preloadImage(details.imageUrl);
    detailsMemoryCache.set(restaurant.id, details);
    return details;
  }

  if (detailsMemoryCache.has(restaurant.id)) {
    return detailsMemoryCache.get(restaurant.id)!;
  }

  try {
    const params = new URLSearchParams({
      id: restaurant.id,
      name: restaurant.name,
      address: restaurant.address || '',
      website: restaurant.website || '',
      cuisine: restaurant.cuisine || '',
      amenity: restaurant.amenity || '',
    });

    const res = await fetch(`/api/restaurant-details?${params.toString()}`);
    if (res.ok) {
      const data: RestaurantDetails = await res.json();
      // Preload image
      if (data.imageUrl) {
        preloadImage(data.imageUrl);
      }
      detailsMemoryCache.set(restaurant.id, data);
      return data;
    }
  } catch {
    // Worker request failed, proceed to client fallback
  }

  const fallback: RestaurantDetails = {
    id: restaurant.id,
    name: restaurant.name,
    imageUrl: getFallbackRestaurantImage(restaurant.name, restaurant.cuisine, restaurant.amenity),
    menuUrl: restaurant.website || `https://www.google.com/search?q=${encodeURIComponent(restaurant.name + ' ' + (restaurant.address || '') + ' menu')}`,
    source: 'client_fallback',
  };

  preloadImage(fallback.imageUrl);
  detailsMemoryCache.set(restaurant.id, fallback);
  return fallback;
}

export async function batchFetchRestaurantDetails(restaurants: Restaurant[]): Promise<Map<string, RestaurantDetails>> {
  const result = new Map<string, RestaurantDetails>();
  const toFetch: Restaurant[] = [];

  for (const r of restaurants) {
    if (r.image) {
      const details: RestaurantDetails = {
        id: r.id,
        name: r.name,
        imageUrl: r.image,
        menuUrl: r.website || `https://www.google.com/search?q=${encodeURIComponent(r.name + ' ' + (r.address || '') + ' menu')}`,
        source: 'scraped',
      };
      preloadImage(details.imageUrl);
      detailsMemoryCache.set(r.id, details);
      result.set(r.id, details);
    } else if (detailsMemoryCache.has(r.id)) {
      result.set(r.id, detailsMemoryCache.get(r.id)!);
    } else {
      toFetch.push(r);
    }
  }

  if (toFetch.length === 0) {
    return result;
  }

  try {
    const res = await fetch('/api/restaurant-details/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurants: toFetch.map((r) => ({
          id: r.id,
          name: r.name,
          address: r.address || '',
          website: r.website || '',
          cuisine: r.cuisine || '',
          amenity: r.amenity || '',
        })),
      }),
    });

    if (res.ok) {
      const items: RestaurantDetails[] = await res.json();
      for (const item of items) {
        if (item.imageUrl) preloadImage(item.imageUrl);
        detailsMemoryCache.set(item.id, item);
        result.set(item.id, item);
      }
    }
  } catch {
    // If batch fails, fallback each individually
  }

  // Fill in any that failed with client fallback
  for (const r of toFetch) {
    if (!result.has(r.id)) {
      const fallback: RestaurantDetails = {
        id: r.id,
        name: r.name,
        imageUrl: getFallbackRestaurantImage(r.name, r.cuisine, r.amenity),
        menuUrl: r.website || `https://www.google.com/search?q=${encodeURIComponent(r.name + ' ' + (r.address || '') + ' menu')}`,
        source: 'client_fallback',
      };
      preloadImage(fallback.imageUrl);
      detailsMemoryCache.set(r.id, fallback);
      result.set(r.id, fallback);
    }
  }

  return result;
}

function preloadImage(url: string) {
  if (typeof window === 'undefined') return;
  const img = new Image();
  img.src = url;
}
