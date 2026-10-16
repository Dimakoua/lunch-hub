import curatedDealsData from '../data/curatedDeals.json';
import { Deal, Restaurant } from '../types/restaurant';

const CUSTOM_DEALS_KEY = 'lunch-hub-custom-deals';

export const getCuratedDeals = (): Deal[] => {
  let customDeals: Deal[] = [];
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(CUSTOM_DEALS_KEY);
      if (stored) {
        customDeals = JSON.parse(stored);
      }
    } catch {
      // ignore
    }
  }
  return [...(curatedDealsData as Deal[]), ...customDeals];
};

export const submitDeal = (deal: Omit<Deal, 'id'>): Deal => {
  const newDeal: Deal = {
    ...deal,
    id: `custom-deal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    verifiedDate: new Date().toISOString().split('T')[0],
  };

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(CUSTOM_DEALS_KEY);
      const customDeals: Deal[] = stored ? JSON.parse(stored) : [];
      localStorage.setItem(CUSTOM_DEALS_KEY, JSON.stringify([...customDeals, newDeal]));
    } catch (e) {
      console.error('Failed to save deal to localStorage', e);
    }
  }

  return newDeal;
};

// Overlay curated deals onto restaurant list
export const overlayDeals = (restaurants: Restaurant[]): Restaurant[] => {
  const deals = getCuratedDeals();
  const merged = [...restaurants];

  deals.forEach((deal) => {
    const existingIndex = merged.findIndex(
      (r) =>
        r.name.toLowerCase().includes(deal.name.toLowerCase()) ||
        deal.name.toLowerCase().includes(r.name.toLowerCase()) ||
        (Math.abs(r.lat - deal.lat) < 0.0005 && Math.abs(r.lon - deal.lng) < 0.0005)
    );

    if (existingIndex !== -1) {
      merged[existingIndex] = {
        ...merged[existingIndex],
        deal,
      };
    } else {
      // Include deal spot as a restaurant pin if it's within map range
      merged.push({
        id: deal.id,
        name: deal.name,
        lat: deal.lat,
        lon: deal.lng,
        cuisine: deal.cuisine,
        amenity: 'restaurant',
        deal,
      });
    }
  });

  return merged;
};
