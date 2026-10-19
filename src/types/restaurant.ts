export interface Deal {
  id: string;
  name: string;
  lat: number;
  lng: number;
  cuisine: string;
  dealTitle: string;
  price: string;
  validDays: string;
  verifiedDate?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  lat: number;
  lon: number;
  cuisine?: string;
  address?: string;
  phone?: string;
  website?: string;
  opening_hours?: string;
  amenity: string;
  takeaway?: string;
  deal?: Deal;
  image?: string;
  rating?: number;
  reviewsCount?: number;
  menuUrl?: string;
}

export interface Review {
  user: string;
  comment: string;
  rating: number;
  date?: string;
}

export interface CuratedRestaurant {
  name: string;
  cuisine: string;
  area: string;
  whyGo: string;
  mustTry: string;
  website?: string;
  image?: string;
  rating?: number;
  description?: string;
  reviews?: Review[];
}

export interface Location {
  lat: number;
  lon: number;
  display_name?: string;
}
