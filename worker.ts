interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number; metadata?: Record<string, unknown> }): Promise<void>;
  list(options?: { prefix?: string }): Promise<{ keys: Array<{ name: string; metadata?: unknown }> }>;
}

interface Env {
  POLLS: KVNamespace;
  GOOGLE_MAPS_API_KEY?: string;
}

const ALLOWED_ORIGINS = new Set([
  'https://thelunchub.com',
  'https://www.thelunchub.com',
  'https://lunchhub.com',
  'https://www.lunchhub.com',
  'https://lunchhub.app',
  'https://www.lunchhub.app',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:8787',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:8787',
]);

function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin');
  const allowedOrigin = origin && (ALLOWED_ORIGINS.has(origin) || origin.endsWith('.pages.dev') || origin.endsWith('.workers.dev'))
    ? origin
    : 'https://thelunchub.com';
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

function generateSecureId(length = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

function isSafeExternalUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '::1' ||
      host === '[::1]' ||
      host.endsWith('.local') ||
      host.endsWith('.internal') ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
      /^169\.254\./.test(host)
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function sanitizeRestaurantRecord(r: any) {
  if (!r || typeof r !== 'object') return null;
  const id = String(r.id ?? '').slice(0, 128);
  const name = String(r.name ?? '').slice(0, 200);
  const lat = Number(r.lat);
  const lon = Number(r.lon);
  if (!id || !name || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return {
    id,
    name,
    lat,
    lon,
    cuisine: r.cuisine ? String(r.cuisine).slice(0, 100) : undefined,
    address: r.address ? String(r.address).slice(0, 300) : undefined,
    phone: r.phone ? String(r.phone).slice(0, 50) : undefined,
    website: r.website && isSafeExternalUrl(String(r.website)) ? String(r.website).slice(0, 500) : undefined,
    opening_hours: r.opening_hours ? String(r.opening_hours).slice(0, 200) : undefined,
    amenity: String(r.amenity || 'restaurant').slice(0, 50),
    takeaway: r.takeaway ? String(r.takeaway).slice(0, 20) : undefined,
    image: r.image && isSafeExternalUrl(String(r.image)) ? String(r.image).slice(0, 500) : undefined,
    deal: r.deal && typeof r.deal === 'object' ? {
      id: String(r.deal.id ?? '').slice(0, 100),
      name: String(r.deal.name ?? '').slice(0, 200),
      lat: Number(r.deal.lat) || lat,
      lng: Number(r.deal.lng) || lon,
      cuisine: String(r.deal.cuisine ?? '').slice(0, 100),
      dealTitle: String(r.deal.dealTitle ?? '').slice(0, 200),
      price: String(r.deal.price ?? '').slice(0, 30),
      validDays: String(r.deal.validDays ?? '').slice(0, 100),
    } : undefined,
  };
}

const KV_TTL = 604800; // 7 days in seconds
// Stay strictly within Google Maps Platform's free tier:
// Text Search Pro = 5,000/mo, Place Details Enterprise (ratings/hours/website/phone) = 1,000/mo
const GOOGLE_MONTHLY_CAP = 900;

async function canCallGoogleApi(kv: KVNamespace): Promise<boolean> {
  const monthKey = `gplaces:quota:${new Date().toISOString().slice(0, 7)}`;
  const count = Number((await kv.get(monthKey)) || '0');
  return count < GOOGLE_MONTHLY_CAP;
}

async function recordGoogleApiCall(kv: KVNamespace): Promise<void> {
  const monthKey = `gplaces:quota:${new Date().toISOString().slice(0, 7)}`;
  const count = Number((await kv.get(monthKey)) || '0');
  await kv.put(monthKey, String(count + 1), { expirationTtl: 60 * 60 * 24 * 35 });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const corsHeaders = getCorsHeaders(request);

    // Normalize pathname: remove trailing slash (except for root '/')
    const pathname = url.pathname.endsWith('/') && url.pathname.length > 1
      ? url.pathname.slice(0, -1)
      : url.pathname;

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // POST /api/polls - Create a new poll
    if (request.method === 'POST' && pathname === '/api/polls') {
      try {
        const body = (await request.json()) as { restaurants?: unknown };
        if (!Array.isArray(body.restaurants) || body.restaurants.length < 2 || body.restaurants.length > 20) {
          return new Response('Bad Request: Invalid restaurants list', { status: 400, headers: corsHeaders });
        }
        const sanitizedRestaurants = body.restaurants
          .map(sanitizeRestaurantRecord)
          .filter((r): r is NonNullable<typeof r> => r !== null);
        if (sanitizedRestaurants.length < 2) {
          return new Response('Bad Request: At least 2 valid restaurants required', { status: 400, headers: corsHeaders });
        }

        const id = generateSecureId(8);
        const votes: Record<string, number> = Object.create(null);

        const pollData = {
          id,
          createdAt: Date.now(),
          restaurants: sanitizedRestaurants,
          votes,
          voterIds: [] as string[],
        };

        await env.POLLS.put(id, JSON.stringify(pollData), { expirationTtl: KV_TTL });

        return new Response(JSON.stringify({ id }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return new Response(`Bad Request: ${message}`, { status: 400, headers: corsHeaders });
      }
    }

    // GET /api/polls/:id - Fetch poll
    if (request.method === 'GET' && pathname.startsWith('/api/polls/')) {
      const id = pathname.split('/').pop();
      if (!id) return new Response('Not Found', { status: 404, headers: corsHeaders });

      const poll = await env.POLLS.get(id);
      if (!poll) return new Response('Poll not found', { status: 404, headers: corsHeaders });

      return new Response(poll, {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // GET /api/places/status - Check whether Google Places quota is available
    if (request.method === 'GET' && pathname === '/api/places/status') {
      const quotaExceeded = !env.GOOGLE_MAPS_API_KEY || !(await canCallGoogleApi(env.POLLS));
      return new Response(JSON.stringify({ quotaExceeded }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
      });
    }

    // GET /api/places/nearby - Cached Google Places Nearby Search proxy
    if (request.method === 'GET' && pathname === '/api/places/nearby') {
      if (!env.GOOGLE_MAPS_API_KEY) {
        return new Response(JSON.stringify({ configured: false, places: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' }
        });
      }
      const lat = Number(url.searchParams.get('lat'));
      const lng = Number(url.searchParams.get('lng'));
      const radius = Math.min(5000, Math.max(200, Number(url.searchParams.get('radius')) || 1000));
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return new Response(JSON.stringify({ error: 'Missing lat/lng' }), { status: 400, headers: corsHeaders });
      }
      const cacheKey = `gplaces:nearby:v2:${lat.toFixed(3)}:${lng.toFixed(3)}:${Math.round(radius / 100) * 100}`;
      const cached = await env.POLLS.get(cacheKey);
      if (cached) {
        return new Response(cached, {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=604800', 'X-Cache': 'HIT' }
        });
      }

      if (!(await canCallGoogleApi(env.POLLS))) {
        return new Response(JSON.stringify({ configured: false, quotaExceeded: true, places: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' }
        });
      }
      await recordGoogleApiCall(env.POLLS);

      const excludedPrimaryTypes = [
        'grocery_store',
        'supermarket',
        'convenience_store',
        'department_store',
        'shopping_mall',
        'gas_station',
        'liquor_store',
        'drugstore',
        'pharmacy',
        'store',
      ];
      const excludedTypeSet = new Set(excludedPrimaryTypes);

      const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': env.GOOGLE_MAPS_API_KEY,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.location,places.formattedAddress,places.primaryType',
        },
        body: JSON.stringify({
          includedTypes: ['restaurant', 'cafe', 'bakery', 'meal_takeaway'],
          excludedPrimaryTypes,
          maxResultCount: 20,
          locationRestriction: {
            circle: {
              center: { latitude: lat, longitude: lng },
              radius,
            },
          },
        }),
      });
      const data = (await res.json()) as {
        error?: unknown;
        places?: Array<{
          id?: string;
          displayName?: { text?: string };
          location?: { latitude?: number; longitude?: number };
          formattedAddress?: string;
          primaryType?: string;
        }>;
      };
      if (!res.ok) {
        console.error('Google Places searchNearby error:', res.status, JSON.stringify(data));
      }
      const places = (data?.places ?? [])
        .filter(
          (p) =>
            p.id &&
            p.location?.latitude !== undefined &&
            p.location?.longitude !== undefined &&
            (!p.primaryType || !excludedTypeSet.has(p.primaryType))
        )
        .map((p) => ({
          id: `gplace:${p.id}`,
          name: p.displayName?.text || 'Restaurant',
          lat: p.location!.latitude!,
          lon: p.location!.longitude!,
          address: p.formattedAddress,
          cuisine: p.primaryType?.replace(/_/g, ' ') || 'restaurant',
          amenity: 'restaurant',
        }));

      const payload = JSON.stringify({ configured: true, places });
      if (places.length > 0) {
        await env.POLLS.put(cacheKey, payload, { expirationTtl: KV_TTL });
      }
      return new Response(payload, {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': places.length > 0 ? 'public, max-age=604800' : 'no-store', 'X-Cache': 'MISS' }
      });
    }

    // GET /api/places/search - Cached Google Places Text Search proxy
    if (request.method === 'GET' && pathname === '/api/places/search') {
      if (!env.GOOGLE_MAPS_API_KEY) {
        return new Response(JSON.stringify({ configured: false }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' }
        });
      }
      const query = url.searchParams.get('query')?.trim();
      if (!query) {
        return new Response(JSON.stringify({ error: 'Missing query' }), { status: 400, headers: corsHeaders });
      }
      const lat = url.searchParams.get('lat');
      const lng = url.searchParams.get('lng');
      const cacheKey = `gplaces:search:${query.toLowerCase()}:${lat ? Number(lat).toFixed(3) : ''}:${lng ? Number(lng).toFixed(3) : ''}`;

      const cached = await env.POLLS.get(cacheKey);
      if (cached) {
        return new Response(cached, {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=604800', 'X-Cache': 'HIT' }
        });
      }

      if (!(await canCallGoogleApi(env.POLLS))) {
        return new Response(JSON.stringify({ configured: false, quotaExceeded: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' }
        });
      }
      await recordGoogleApiCall(env.POLLS);

      // Use Places API (New) Text Search
      const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': env.GOOGLE_MAPS_API_KEY,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.rating,places.userRatingCount,places.photos',
        },
        body: JSON.stringify({
          textQuery: query,
          ...(lat && lng
            ? {
              locationBias: {
                circle: {
                  center: { latitude: Number(lat), longitude: Number(lng) },
                  radius: 1500,
                },
              },
            }
            : {}),
        }),
      });
      const data = (await res.json()) as {
        places?: Array<{
          id?: string;
          rating?: number;
          userRatingCount?: number;
          photos?: Array<{ name?: string }>;
        }>;
        error?: { message?: string; status?: string };
      };
      const first = data?.places?.[0];
      const payload = JSON.stringify(
        first
          ? {
            configured: true,
            placeId: first.id,
            rating: first.rating,
            userRatingsTotal: first.userRatingCount,
            photoRef: first.photos?.[0]?.name,
          }
          : { configured: true, placeId: null, error: data?.error?.message }
      );

      if (first?.id) {
        await env.POLLS.put(cacheKey, payload, { expirationTtl: KV_TTL });
      }
      return new Response(payload, {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': first?.id ? 'public, max-age=604800' : 'no-store', 'X-Cache': 'MISS' }
      });
    }

    // GET /api/places/details - Cached Google Place Details proxy
    if (request.method === 'GET' && pathname === '/api/places/details') {
      if (!env.GOOGLE_MAPS_API_KEY) {
        return new Response(JSON.stringify({ configured: false }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' }
        });
      }
      const placeId = url.searchParams.get('placeId')?.trim();
      if (!placeId) {
        return new Response(JSON.stringify({ error: 'Missing placeId' }), { status: 400, headers: corsHeaders });
      }
      const cacheKey = `gplaces:details:${placeId}`;
      const cached = await env.POLLS.get(cacheKey);
      if (cached) {
        return new Response(cached, {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=1209600', 'X-Cache': 'HIT' }
        });
      }

      if (!(await canCallGoogleApi(env.POLLS))) {
        return new Response(JSON.stringify({ configured: false, quotaExceeded: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' }
        });
      }
      await recordGoogleApiCall(env.POLLS);

      const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
        headers: {
          'X-Goog-Api-Key': env.GOOGLE_MAPS_API_KEY,
          'X-Goog-FieldMask': 'id,displayName,rating,userRatingCount,formattedAddress,regularOpeningHours,photos,priceLevel,websiteUri,nationalPhoneNumber,googleMapsUri,editorialSummary,reviews,dineIn,takeout,delivery',
        },
      });
      const r = (await res.json()) as {
        id?: string;
        displayName?: { text?: string };
        rating?: number;
        userRatingCount?: number;
        formattedAddress?: string;
        priceLevel?: string;
        websiteUri?: string;
        nationalPhoneNumber?: string;
        googleMapsUri?: string;
        editorialSummary?: { text?: string };
        dineIn?: boolean;
        takeout?: boolean;
        delivery?: boolean;
        regularOpeningHours?: { openNow?: boolean; weekdayDescriptions?: string[] };
        photos?: Array<{ name?: string }>;
        reviews?: Array<{
          authorAttribution?: { displayName?: string };
          rating?: number;
          relativePublishTimeDescription?: string;
          text?: { text?: string };
        }>;
      };
      const priceMap: Record<string, number> = {
        PRICE_LEVEL_FREE: 0,
        PRICE_LEVEL_INEXPENSIVE: 1,
        PRICE_LEVEL_MODERATE: 2,
        PRICE_LEVEL_EXPENSIVE: 3,
        PRICE_LEVEL_VERY_EXPENSIVE: 4,
      };
      const payload = JSON.stringify(
        r?.id
          ? {
            configured: true,
            placeId,
            name: r.displayName?.text,
            rating: r.rating,
            userRatingsTotal: r.userRatingCount,
            formattedAddress: r.formattedAddress,
            priceLevel: r.priceLevel ? priceMap[r.priceLevel] : undefined,
            website: r.websiteUri,
            phoneNumber: r.nationalPhoneNumber,
            googleMapsUrl: r.googleMapsUri,
            editorialSummary: r.editorialSummary?.text,
            serviceOptions: {
              dineIn: r.dineIn,
              takeout: r.takeout,
              delivery: r.delivery,
            },
            weekdayText: r.regularOpeningHours?.weekdayDescriptions,
            photoUrls: (r.photos ?? []).slice(0, 6).map((p) => `/api/places/photo?ref=${encodeURIComponent(p.name ?? '')}&maxwidth=800`),
            reviews: (r.reviews ?? []).slice(0, 5).map((rev) => ({
              author: rev.authorAttribution?.displayName || 'Google User',
              rating: rev.rating,
              relativeTime: rev.relativePublishTimeDescription,
              text: rev.text?.text,
            })),
          }
          : { configured: true, placeId: null }
      );

      if (r?.id) {
        await env.POLLS.put(cacheKey, payload, { expirationTtl: KV_TTL * 2 });
      }
      return new Response(payload, {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': r?.id ? 'public, max-age=1209600' : 'no-store', 'X-Cache': 'MISS' }
      });
    }

    // GET /api/places/photo - Cached Google Place Photo proxy
    if (request.method === 'GET' && pathname === '/api/places/photo') {
      if (!env.GOOGLE_MAPS_API_KEY) {
        return new Response('Google Maps API key not configured', { status: 404, headers: corsHeaders });
      }
      const ref = url.searchParams.get('ref')?.trim();
      const maxwidthNum = Math.min(1600, Math.max(100, Number(url.searchParams.get('maxwidth')) || 800));
      if (!ref) {
        return new Response('Missing photo ref', { status: 400, headers: corsHeaders });
      }
      const isNewPlacesRef = /^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/.test(ref);
      const isLegacyRef = /^[A-Za-z0-9_-]{16,512}$/.test(ref);
      if (!isNewPlacesRef && !isLegacyRef) {
        return new Response('Invalid photo ref', { status: 400, headers: corsHeaders });
      }
      if (!(await canCallGoogleApi(env.POLLS))) {
        return new Response('Quota exceeded', { status: 429, headers: corsHeaders });
      }
      const photoUrl = isNewPlacesRef
        ? `https://places.googleapis.com/v1/${ref}/media?maxWidthPx=${maxwidthNum}&key=${env.GOOGLE_MAPS_API_KEY}`
        : `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxwidthNum}&photo_reference=${encodeURIComponent(ref)}&key=${env.GOOGLE_MAPS_API_KEY}`;
      const res = await fetch(photoUrl, { cf: { cacheEverything: true, cacheTtl: 2592000 } } as RequestInit);
      const headers = new Headers(res.headers);
      headers.set('Cache-Control', 'public, max-age=2592000');
      for (const [k, v] of Object.entries(corsHeaders)) {
        headers.set(k, v);
      }
      return new Response(res.body, { status: res.status, headers });
    }

    // POST /api/polls/:id/vote - Vote on a restaurant
    if (request.method === 'POST' && pathname.startsWith('/api/polls/') && pathname.endsWith('/vote')) {
      const parts = pathname.split('/');
      const id = parts[parts.length - 2];

      try {
        const { restaurantId, clientId } = (await request.json()) as { restaurantId?: string; clientId?: string };
        if (!restaurantId || typeof restaurantId !== 'string') {
          return new Response('Invalid restaurantId', { status: 400, headers: corsHeaders });
        }
        const pollString = await env.POLLS.get(id);
        if (!pollString) return new Response('Poll not found', { status: 404, headers: corsHeaders });

        const poll = JSON.parse(pollString);
        const validRestaurant = Array.isArray(poll.restaurants) && poll.restaurants.some((r: { id?: string }) => r.id === restaurantId);
        if (!validRestaurant) {
          return new Response('Invalid restaurant for this poll', { status: 400, headers: corsHeaders });
        }

        poll.voterIds = Array.isArray(poll.voterIds) ? poll.voterIds : [];
        if (clientId && typeof clientId === 'string') {
          if (poll.voterIds.includes(clientId)) {
            return new Response(JSON.stringify(poll), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          poll.voterIds.push(clientId.slice(0, 64));
        }

        const currentVotes = Number(Object.prototype.hasOwnProperty.call(poll.votes, restaurantId) ? poll.votes[restaurantId] : 0) || 0;
        poll.votes[restaurantId] = currentVotes + 1;

        await env.POLLS.put(id, JSON.stringify(poll), { expirationTtl: KV_TTL });

        return new Response(JSON.stringify(poll), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (err) {
        return new Response('Bad Request', { status: 400, headers: corsHeaders });
      }
    }

    // POST /api/match/create - Create a new matchmaker room
    if (request.method === 'POST' && pathname === '/api/match/create') {
      try {
        const { restaurants, groupSize } = (await request.json()) as { restaurants?: unknown; groupSize?: unknown };
        if (!Array.isArray(restaurants) || restaurants.length < 2 || restaurants.length > 25) {
          return new Response('Bad Request: Invalid restaurants list', { status: 400, headers: corsHeaders });
        }
        const sanitizedRestaurants = restaurants
          .map(sanitizeRestaurantRecord)
          .filter((r): r is NonNullable<typeof r> => r !== null);
        if (sanitizedRestaurants.length < 2) {
          return new Response('Bad Request: At least 2 valid restaurants required', { status: 400, headers: corsHeaders });
        }

        const id = generateSecureId(8);
        const safeGroupSize = Math.min(20, Math.max(2, Math.floor(Number(groupSize) || 2)));

        const matchData = {
          id,
          createdAt: Date.now(),
          restaurants: sanitizedRestaurants,
          groupSize: safeGroupSize,
          votes: Object.create(null),
          matchedRestaurantId: null
        };

        await env.POLLS.put(`match:${id}`, JSON.stringify(matchData), { expirationTtl: KV_TTL });

        return new Response(JSON.stringify({ id }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (err) {
        return new Response('Bad Request', { status: 400, headers: corsHeaders });
      }
    }

    // GET /api/match/:id - Get matchmaker room state
    if (request.method === 'GET' && pathname.startsWith('/api/match/') && !pathname.endsWith('/vote')) {
      const id = pathname.split('/').pop();
      if (!id) return new Response('Not Found', { status: 404, headers: corsHeaders });

      const matchString = await env.POLLS.get(`match:${id}`);
      if (!matchString) return new Response('Match room not found', { status: 404, headers: corsHeaders });

      return new Response(matchString, {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST /api/match/:id/vote - Submit a swipe vote
    if (request.method === 'POST' && pathname.startsWith('/api/match/') && pathname.endsWith('/vote')) {
      const parts = pathname.split('/');
      const id = parts[parts.length - 2];

      try {
        const { restaurantId, vote, clientId } = (await request.json()) as {
          restaurantId?: string;
          vote?: string;
          clientId?: string;
        };
        if (
          !restaurantId ||
          typeof restaurantId !== 'string' ||
          (vote !== 'yes' && vote !== 'no') ||
          !clientId ||
          typeof clientId !== 'string'
        ) {
          return new Response('Missing or invalid fields', { status: 400, headers: corsHeaders });
        }
        const safeClientId = clientId.slice(0, 64);

        const matchString = await env.POLLS.get(`match:${id}`);
        if (!matchString) return new Response('Match room not found', { status: 404, headers: corsHeaders });

        const room = JSON.parse(matchString);
        const validRestaurant = Array.isArray(room.restaurants) && room.restaurants.some((r: { id?: string }) => r.id === restaurantId);
        if (!validRestaurant) {
          return new Response('Invalid restaurant for this room', { status: 400, headers: corsHeaders });
        }

        if (!Object.prototype.hasOwnProperty.call(room.votes, restaurantId)) {
          room.votes[restaurantId] = { yes: [], no: [] };
        }

        const oppositeList = vote === 'yes' ? room.votes[restaurantId].no : room.votes[restaurantId].yes;
        const currentList = vote === 'yes' ? room.votes[restaurantId].yes : room.votes[restaurantId].no;

        const oppIndex = oppositeList.indexOf(safeClientId);
        if (oppIndex > -1) oppositeList.splice(oppIndex, 1);

        if (!currentList.includes(safeClientId)) {
          currentList.push(safeClientId);
        }

        if (vote === 'yes' && room.votes[restaurantId].yes.length >= room.groupSize) {
          room.matchedRestaurantId = restaurantId;
        }

        await env.POLLS.put(`match:${id}`, JSON.stringify(room), { expirationTtl: KV_TTL });

        return new Response(JSON.stringify(room), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (err) {
        return new Response('Bad Request', { status: 400, headers: corsHeaders });
      }
    }

    // POST /api/popularity - Record an anonymous restaurant popularity check-in
    if (request.method === 'POST' && pathname === '/api/popularity') {
      try {
        const body = (await request.json()) as { restaurantId?: string; lat?: number; lon?: number };
        const { restaurantId, lat, lon } = body;
        const numLat = Number(lat);
        const numLon = Number(lon);
        if (!restaurantId || typeof restaurantId !== 'string' || !Number.isFinite(numLat) || !Number.isFinite(numLon)) {
          return new Response('Missing parameters', { status: 400, headers: corsHeaders });
        }

        const safeId = restaurantId.slice(0, 128);
        const key = `pop:${safeId}`;
        const existingStr = await env.POLLS.get(key);
        let count = 1;
        if (existingStr) {
          try {
            const parsed = JSON.parse(existingStr);
            count = (Number(parsed.count) || 0) + 1;
          } catch {
            // ignore
          }
        }

        const record = { restaurantId: safeId, lat: numLat, lon: numLon, count };
        await env.POLLS.put(key, JSON.stringify(record), {
          expirationTtl: 14400, // 4 hours TTL
          metadata: record,
        });

        return new Response(JSON.stringify({ success: true, count }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (err) {
        return new Response('Bad Request', { status: 400, headers: corsHeaders });
      }
    }

    // GET /api/popularity - Fetch active busy hotspots
    if (request.method === 'GET' && pathname === '/api/popularity') {
      try {
        const list = await env.POLLS.list({ prefix: 'pop:' });
        const results = [];
        let fallbackGets = 0;
        for (const key of list.keys) {
          if (key.metadata && typeof key.metadata === 'object') {
            results.push(key.metadata);
          } else if (fallbackGets < 10) {
            fallbackGets++;
            const val = await env.POLLS.get(key.name);
            if (val) {
              try {
                results.push(JSON.parse(val));
              } catch {
                // ignore
              }
            }
          }
        }
        return new Response(JSON.stringify(results), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' }
        });
      } catch (err) {
        return new Response('Server Error', { status: 500, headers: corsHeaders });
      }
    }

    // GET /api/restaurant-details - Scrape or fetch cached restaurant photo, rating, and menu
    if (request.method === 'GET' && pathname === '/api/restaurant-details') {
      const id = url.searchParams.get('id');
      const name = url.searchParams.get('name') || '';
      const address = url.searchParams.get('address') || '';
      const website = url.searchParams.get('website') || '';
      const cuisine = url.searchParams.get('cuisine') || '';
      const amenity = url.searchParams.get('amenity') || '';

      if (!id || !name) {
        return new Response(JSON.stringify({ error: 'Missing id or name parameter' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      try {
        const details = await resolveRestaurantDetails(env, { id, name, address, website, cuisine, amenity });
        return new Response(JSON.stringify(details), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // POST /api/restaurant-details/batch - Batch resolve up to 15 restaurants at once
    if (request.method === 'POST' && pathname === '/api/restaurant-details/batch') {
      try {
        const body = (await request.json()) as { restaurants?: unknown };
        const restaurants = Array.isArray(body.restaurants) ? body.restaurants.slice(0, 15) : [];

        const results = await Promise.all(
          restaurants.map(async (r: any) => {
            try {
              return await resolveRestaurantDetails(env, {
                id: r.id,
                name: r.name || '',
                address: r.address || '',
                website: r.website || '',
                cuisine: r.cuisine || '',
                amenity: r.amenity || '',
              });
            } catch {
              return {
                id: r.id,
                name: r.name,
                imageUrl: getCuisineFallbackImage(r.name, r.cuisine, r.amenity),
                source: 'fallback',
              };
            }
          })
        );

        return new Response(JSON.stringify(results), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Return 404 for unmatched API routes
    // (Non-API routes are handled natively by Cloudflare Assets and never reach here)
    return new Response('API Route Not Found', { status: 404, headers: corsHeaders });
  }
};

// ── Scraper & Image Resolution Logic ─────────────────────────────────────────

interface RestaurantInput {
  id: string;
  name: string;
  address?: string;
  website?: string;
  cuisine?: string;
  amenity?: string;
}

const DETAILS_KV_TTL = 2592000; // 30 days in seconds

async function resolveRestaurantDetails(env: Env, input: RestaurantInput) {
  const safeId = String(input.id).slice(0, 128);
  const safeWebsite = input.website && isSafeExternalUrl(input.website) ? input.website : '';
  let websiteHost = '';
  if (safeWebsite) {
    try {
      websiteHost = new URL(safeWebsite).hostname.toLowerCase();
    } catch {
      websiteHost = '';
    }
  }
  const kvKey = `details:v2:${safeId}:${websiteHost}`;

  // 1. Check Cloudflare KV cache
  try {
    const cached = await env.POLLS.get(kvKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      const img = parsed.imageUrl || '';
      // Ensure we don't serve any legacy fancy stock photos
      if (!img.includes('1559925393') && !img.includes('1550966871') && !img.includes('1501339847') && !img.includes('1495474472')) {
        return { ...parsed, cached: true };
      }
    }
  } catch {
    // continue to scrape if KV get fails
  }

  let imageUrl: string | null = null;
  let menuUrl: string | null = null;
  let rating: number | undefined;
  let reviewsCount: number | undefined;
  let source = 'fallback';

  // 2. Try scraping official website if available
  if (safeWebsite) {
    try {
      const res = await fetch(safeWebsite, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(3000),
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && isSafeExternalUrl(res.url || safeWebsite) && contentType.includes('html')) {
        const html = (await res.text()).slice(0, 250000);

        // Extract og:image
        const ogMatch =
          html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
          html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
          html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);

        if (ogMatch && ogMatch[1]) {
          const candidate = makeAbsoluteUrl(ogMatch[1], safeWebsite);
          if (isSafeExternalUrl(candidate)) {
            imageUrl = candidate;
            source = 'website_og';
          }
        }

        // If no og:image, look for hero images or prominent photos
        if (!imageUrl) {
          const imgMatches = Array.from(html.matchAll(/<img[^>]+src=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/gi));
          for (const m of imgMatches) {
            const src = m[1];
            if (
              !src.includes('logo') &&
              !src.includes('icon') &&
              !src.includes('avatar') &&
              !src.includes('badge') &&
              (src.includes('hero') || src.includes('food') || src.includes('banner') || src.includes('upload') || src.includes('dish') || src.includes('media'))
            ) {
              const candidate = makeAbsoluteUrl(src, safeWebsite);
              if (isSafeExternalUrl(candidate)) {
                imageUrl = candidate;
                source = 'website_img';
                break;
              }
            }
          }
        }

        // Extract menu URL
        const menuMatch = html.match(/<a[^>]+href=["']([^"']*menu[^"']*)["']/i);
        if (menuMatch && menuMatch[1] && !menuMatch[1].endsWith('.css') && !menuMatch[1].endsWith('.js')) {
          const candidate = makeAbsoluteUrl(menuMatch[1], safeWebsite);
          if (isSafeExternalUrl(candidate)) {
            menuUrl = candidate;
          }
        }

        // Extract Schema.org JSON-LD ratings if present
        const jsonLdMatch = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
        if (jsonLdMatch) {
          try {
            const schema = JSON.parse(jsonLdMatch[1]);
            const agg = schema.aggregateRating || schema['@graph']?.find((g: any) => g.aggregateRating)?.aggregateRating;
            if (agg && agg.ratingValue) {
              rating = parseFloat(agg.ratingValue);
              reviewsCount = parseInt(agg.reviewCount || agg.ratingCount || '0', 10);
            }
          } catch {
            // ignore schema parsing errors
          }
        }
      }
    } catch {
      // website fetch failed or timed out
    }
  }

  // 3. Check popular brands for direct, recognizable authentic photos
  const lowerName = input.name.toLowerCase();
  for (const [brand, brandImg] of Object.entries(POPULAR_BRANDS)) {
    if (lowerName.includes(brand)) {
      imageUrl = brandImg;
      source = 'brand';
      break;
    }
  }

  // 4. Query Wikipedia API with redirects and proper User-Agent
  if (!imageUrl) {
    try {
      const cleanName = input.name.replace(/\(.*?\)/g, '').trim();
      const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(cleanName)}&prop=pageimages&format=json&pithumbsize=800&redirects=1`;
      const wikiRes = await fetch(wikiUrl, {
        headers: {
          'User-Agent': 'LunchHubBot/1.0 (https://thelunchub.com; contact@thelunchub.com)',
        },
        signal: AbortSignal.timeout(2500),
      });
      if (wikiRes.ok) {
        const data: any = await wikiRes.json();
        const pages = data.query?.pages;
        if (pages) {
          const firstPage: any = Object.values(pages)[0];
          const src = firstPage?.thumbnail?.source;
          if (src && !src.toLowerCase().includes('.svg') && !src.toLowerCase().includes('logo') && !src.toLowerCase().includes('flag')) {
            imageUrl = src;
            source = 'wiki';
          }
        }
      }
    } catch {
      // wiki query failed
    }
  }

  // 5. Fallback to cuisine-specific authentic photography
  if (!imageUrl) {
    imageUrl = getCuisineFallbackImage(input.name, input.cuisine, input.amenity);
    source = 'fallback';
  }

  // 6. Default Google reviews & menu deep links if none scraped
  if (!menuUrl) {
    menuUrl = `https://www.google.com/search?q=${encodeURIComponent(input.name + ' ' + (input.address || '') + ' menu')}`;
  }

  const result = {
    id: input.id,
    name: input.name,
    imageUrl,
    menuUrl,
    rating: rating || undefined,
    reviewsCount: reviewsCount || undefined,
    source,
  };

  // 7. Cache in Cloudflare KV for 30 days
  try {
    await env.POLLS.put(kvKey, JSON.stringify(result), { expirationTtl: DETAILS_KV_TTL });
  } catch (err) {
    console.error('Failed to cache restaurant details in KV:', err);
  }

  return result;
}

function makeAbsoluteUrl(relativeUrl: string, baseUrl: string): string {
  try {
    const resolved = new URL(relativeUrl, baseUrl);
    if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') {
      return '';
    }
    return resolved.href;
  } catch {
    return '';
  }
}

const POPULAR_BRANDS: Record<string, string> = {
  mcdonald: 'https://images.unsplash.com/photo-1552895638-f7fe08d2f7d5?auto=format&fit=crop&w=800&q=80',
  starbucks: 'https://images.unsplash.com/photo-1507133750040-4a8f57021571?auto=format&fit=crop&w=800&q=80',
  'tim horton': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
  subway: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80',
  chipotle: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=800&q=80',
  'five guys': 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=800&q=80',
  wendy: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=800&q=80',
  'burger king': 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=800&q=80',
  'a&w': 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=800&q=80',
  popeyes: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80',
  "jimmy's coffee": 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
  dineen: 'https://images.unsplash.com/photo-1453614512568-c4024d13c247?auto=format&fit=crop&w=800&q=80',
  balzac: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=800&q=80',
  aroma: 'https://images.unsplash.com/photo-1525610553991-2bede1a236e2?auto=format&fit=crop&w=800&q=80',
  'second cup': 'https://images.unsplash.com/photo-1508766917616-d22f3f1eea14?auto=format&fit=crop&w=800&q=80',
  'pret a manger': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80',
  panera: 'https://images.unsplash.com/photo-1511018556340-d16986a1c194?auto=format&fit=crop&w=800&q=80',
  kinton: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
  sansotei: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
  'pizza pizza': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
  domino: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
};

// Casual, authentic everyday lunch & real cafe photography fallback (NO fancy fine-dining banquets)
function getCuisineFallbackImage(name: string, cuisine?: string, amenity?: string): string {
  const lowerName = name.toLowerCase();
  const lowerCuisine = (cuisine || '').toLowerCase();
  const lowerAmenity = (amenity || '').toLowerCase();
  const combined = `${lowerCuisine} ${lowerAmenity} ${lowerName}`;

  // 1. Popular Brand Match
  for (const [brand, photo] of Object.entries(POPULAR_BRANDS)) {
    if (lowerName.includes(brand)) {
      return photo;
    }
  }

  // 2. Prioritize Real Cafe / Coffee Detection
  const isCafe =
    lowerAmenity === 'cafe' ||
    lowerCuisine.includes('coffee') ||
    lowerCuisine.includes('cafe') ||
    lowerCuisine.includes('tea') ||
    lowerCuisine.includes('espresso') ||
    lowerName.includes('cafe') ||
    lowerName.includes('coffee') ||
    lowerName.includes('espresso') ||
    lowerName.includes('roaster');

  if (isCafe) {
    const realCafePhotos = [
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80', // cozy cafe interior, chalkboard menu, plants, laptop seating
      'https://images.unsplash.com/photo-1453614512568-c4024d13c247?auto=format&fit=crop&w=800&q=80', // real coffee bar counter, espresso machine, brick wall
      'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=800&q=80', // real cafe pastry display case, counter, sunlit cafe tables
      'https://images.unsplash.com/photo-1525610553991-2bede1a236e2?auto=format&fit=crop&w=800&q=80', // lively bustling coffee shop with barista brewing
      'https://images.unsplash.com/photo-1508766917616-d22f3f1eea14?auto=format&fit=crop&w=800&q=80', // friendly baristas making coffee at counter
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash << 5) - hash + name.charCodeAt(i);
    return realCafePhotos[Math.abs(hash) % realCafePhotos.length];
  }

  // 3. Fast Food & Casual Burgers (diner baskets & trays, NOT $35 fine-dining truffles)
  const isFastFood =
    lowerAmenity === 'fast_food' ||
    lowerCuisine.includes('burger') ||
    lowerCuisine.includes('fast_food') ||
    lowerName.includes('burger');

  if (isFastFood) {
    const burgerPhotos = [
      'https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=800&q=80', // casual burger & fries combo on tray
      'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=800&q=80', // casual diner burger lunch with fries
      'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=800&q=80', // diner burger in basket with fries
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash << 5) - hash + name.charCodeAt(i);
    return burgerPhotos[Math.abs(hash) % burgerPhotos.length];
  }

  if (combined.includes('sandwich') || combined.includes('deli') || combined.includes('sub')) {
    return 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80';
  }
  if (combined.includes('bakery') || combined.includes('pastry') || combined.includes('croissant') || combined.includes('bagel')) {
    return 'https://images.unsplash.com/photo-1511018556340-d16986a1c194?auto=format&fit=crop&w=800&q=80';
  }
  if (combined.includes('pizza') || combined.includes('italian')) {
    return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80';
  }
  if (combined.includes('sushi') || combined.includes('japanese')) {
    return 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80';
  }
  if (combined.includes('ramen') || combined.includes('noodle')) {
    return 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80';
  }
  if (combined.includes('mexican') || combined.includes('taco') || combined.includes('burrito')) {
    return 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80';
  }
  if (combined.includes('vietnamese') || combined.includes('pho') || combined.includes('banh mi')) {
    return 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=800&q=80';
  }
  if (combined.includes('chinese') || combined.includes('asian') || combined.includes('dim sum')) {
    return 'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=800&q=80';
  }
  if (combined.includes('thai')) {
    return 'https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=800&q=80';
  }
  if (combined.includes('indian') || combined.includes('curry')) {
    return 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80';
  }
  if (combined.includes('mediterranean') || combined.includes('greek') || combined.includes('shawarma') || combined.includes('falafel')) {
    return 'https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=800&q=80';
  }
  if (combined.includes('salad') || combined.includes('healthy') || combined.includes('bowl')) {
    return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80';
  }
  if (combined.includes('bbq') || combined.includes('grill') || combined.includes('steak')) {
    return 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80';
  }
  if (combined.includes('pub') || combined.includes('bar') || combined.includes('beer')) {
    return 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80';
  }

  // General Casual Daytime Eatery (sunlit cafe bistro, casual dining, NEVER luxury banquet halls)
  const casualLunchPhotos = [
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80', // sunlit casual bistro eatery with patrons having lunch
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80', // cozy casual eatery with chalkboard menu
    'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=800&q=80', // daytime lunch counter & sunny tables
    'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80', // casual lunch plate
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash << 5) - hash + name.charCodeAt(i);
  return casualLunchPhotos[Math.abs(hash) % casualLunchPhotos.length];
}

