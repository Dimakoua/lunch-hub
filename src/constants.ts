// Common time constants used across the app
// Use generic names so the TTL can be adjusted without implying a duration in the identifier.
export const CACHE_TTL_LONG = 1000 * 60 * 60 * 24 * 5; // currently 5 days

// Other common constants can be added here in the future
// Overpass API endpoints (mirrors). Order is tried sequentially when querying.
export const OVERPASS_ENDPOINTS = [
	'https://overpass-api.de/api/interpreter',
	'https://lz4.overpass-api.de/api/interpreter',
	'https://overpass.openstreetmap.fr/api/interpreter',
	'https://overpass.kumi.systems/api/interpreter',
	'https://overpass.nchc.org.tw/api/interpreter',
	'https://overpass.osm.ch/api/interpreter'
];
