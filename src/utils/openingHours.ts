// src/utils/openingHours.ts

import OpeningHoursParser from 'opening_hours';
import { Restaurant } from '../types/restaurant';

/**
 * Checks if a restaurant is currently open based on its opening_hours string.
 * @param restaurant The restaurant object containing the opening_hours string.
 * @param date The Date object to check against (defaults to current time).
 * @returns True if the restaurant is open, false otherwise or if opening_hours is not available/parsable.
 */
export const isRestaurantOpen = (restaurant: Restaurant, date: Date = new Date()): boolean => {
  if (!restaurant.opening_hours) {
    return false; // No opening hours specified, so can't confirm it's open
  }

  try {
    const oh = new OpeningHoursParser(restaurant.opening_hours);
    return oh.getState(date);
  } catch (error) {
    console.warn(`Error parsing opening_hours for ${restaurant.name || restaurant.id}: ${restaurant.opening_hours}`, error);
    return false; // Error parsing, so can't confirm it's open
  }
};
