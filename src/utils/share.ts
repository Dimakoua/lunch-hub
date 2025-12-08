// src/utils/share.ts

import { Restaurant } from '../types/restaurant';

export const shareRestaurant = async (restaurant: Restaurant) => {
  const shareText = `Check out this lunch spot: ${restaurant.name} - ${restaurant.address}.`;
  const shareData = {
    title: 'Lunch Hub',
    text: shareText,
    url: window.location.href, // Could be improved to link directly to restaurant in future
  };

  if (navigator.share && navigator.canShare(shareData)) {
    try {
      await navigator.share(shareData);
      console.log('Restaurant shared successfully');
    } catch (error) {
      console.error('Error sharing restaurant:', error);
    }
  } else {
    // Fallback for browsers that do not support Web Share API
    try {
      await navigator.clipboard.writeText(shareText + ' ' + window.location.href);
      alert('Restaurant details copied to clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      alert('Could not copy restaurant details to clipboard.');
    }
  }
};
