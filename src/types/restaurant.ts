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
}

export interface Location {
  lat: number;
  lon: number;
  display_name?: string;
}