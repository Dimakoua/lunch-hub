export type FilterField = 'name' | 'cuisine' | 'amenity' | 'keyword';

export interface FilterRule {
  id: string;
  field: FilterField;
  value: string;
}
