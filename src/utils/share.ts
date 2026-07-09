// src/utils/share.ts

import { Restaurant } from '../types/restaurant';
import { shareRestaurantCard, downloadRestaurantCard } from './canvasShareCard';

export { shareRestaurantCard, downloadRestaurantCard };

export const shareRestaurant = async (restaurant: Restaurant) => {
  // Try sharing the beautiful image card first
  const sharedCard = await shareRestaurantCard(restaurant);
  if (sharedCard) return;

  // Fallback for browsers that do not support sharing image files
  const shareText = `Check out this lunch spot: ${restaurant.name} - ${restaurant.address || ''}.`;
  const shareData = {
    title: 'Lunch Hub',
    text: shareText,
    url: window.location.origin,
  };

  if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
    try {
      await navigator.share(shareData);
      console.log('Restaurant shared successfully');
    } catch (error) {
      console.error('Error sharing restaurant:', error);
    }
  } else {
    // Fallback for browsers that do not support Web Share API
    try {
      await navigator.clipboard.writeText(shareText + ' ' + window.location.origin);
      alert('Restaurant details copied to clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      alert('Could not copy restaurant details to clipboard.');
    }
  }
};
