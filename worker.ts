interface Env {
  POLLS: KVNamespace;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const KV_TTL = 604800; // 7 days in seconds

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
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
        const body: any = await request.json();
        const id = Math.random().toString(36).substring(2, 8);
        
        const pollData = {
          id,
          createdAt: Date.now(),
          restaurants: body.restaurants,
          votes: {}
        };
        
        await env.POLLS.put(id, JSON.stringify(pollData), { expirationTtl: KV_TTL });
        
        return new Response(JSON.stringify({ id }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (err: any) {
        return new Response(`Bad Request: ${err.message}`, { status: 400, headers: corsHeaders });
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

    // POST /api/polls/:id/vote - Vote on a restaurant
    if (request.method === 'POST' && pathname.startsWith('/api/polls/') && pathname.endsWith('/vote')) {
      const parts = pathname.split('/');
      const id = parts[parts.length - 2];
      
      try {
        const { restaurantId } = await request.json();
        const pollString = await env.POLLS.get(id);
        if (!pollString) return new Response('Poll not found', { status: 404, headers: corsHeaders });
        
        const poll = JSON.parse(pollString);
        poll.votes[restaurantId] = (poll.votes[restaurantId] || 0) + 1;
        
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
        const { restaurants, groupSize } = await request.json();
        const id = Math.random().toString(36).substring(2, 8);
        
        const matchData = {
          id,
          createdAt: Date.now(),
          restaurants,
          groupSize: Number(groupSize) || 2,
          votes: {},
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
        const { restaurantId, vote, clientId } = await request.json();
        if (!restaurantId || !vote || !clientId) {
          return new Response('Missing fields', { status: 400, headers: corsHeaders });
        }
        
        const matchString = await env.POLLS.get(`match:${id}`);
        if (!matchString) return new Response('Match room not found', { status: 404, headers: corsHeaders });
        
        const room = JSON.parse(matchString);
        
        room.votes[restaurantId] = room.votes[restaurantId] || { yes: [], no: [] };
        
        const oppositeList = vote === 'yes' ? room.votes[restaurantId].no : room.votes[restaurantId].yes;
        const currentList = vote === 'yes' ? room.votes[restaurantId].yes : room.votes[restaurantId].no;
        
        const oppIndex = oppositeList.indexOf(clientId);
        if (oppIndex > -1) oppositeList.splice(oppIndex, 1);
        
        if (!currentList.includes(clientId)) {
          currentList.push(clientId);
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
        const body: any = await request.json();
        const { restaurantId, lat, lon } = body;
        if (!restaurantId || lat === undefined || lon === undefined) {
          return new Response('Missing parameters', { status: 400, headers: corsHeaders });
        }

        const key = `pop:${restaurantId}`;
        const existingStr = await env.POLLS.get(key);
        let count = 1;
        if (existingStr) {
          try {
            const parsed = JSON.parse(existingStr);
            count = (parsed.count || 0) + 1;
          } catch {
            // ignore
          }
        }

        await env.POLLS.put(key, JSON.stringify({ restaurantId, lat, lon, count }), { expirationTtl: 14400 }); // 4 hours TTL

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
        for (const key of list.keys) {
          const val = await env.POLLS.get(key.name);
          if (val) {
            try {
              results.push(JSON.parse(val));
            } catch {
              // ignore
            }
          }
        }
        return new Response(JSON.stringify(results), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
        const body: any = await request.json();
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
  const kvKey = `details:v2:${input.id}`;

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
  if (input.website && (input.website.startsWith('http://') || input.website.startsWith('https://'))) {
    try {
      const res = await fetch(input.website, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(3000),
      });

      if (res.ok) {
        const html = await res.text();

        // Extract og:image
        const ogMatch =
          html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
          html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
          html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);

        if (ogMatch && ogMatch[1]) {
          imageUrl = makeAbsoluteUrl(ogMatch[1], input.website);
          source = 'website_og';
        }

        // If no og:image, look for hero images or prominent photos
        if (!imageUrl) {
          const imgMatches = [...html.matchAll(/<img[^>]+src=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/gi)];
          for (const m of imgMatches) {
            const src = m[1];
            if (
              !src.includes('logo') &&
              !src.includes('icon') &&
              !src.includes('avatar') &&
              !src.includes('badge') &&
              (src.includes('hero') || src.includes('food') || src.includes('banner') || src.includes('upload') || src.includes('dish') || src.includes('media'))
            ) {
              imageUrl = makeAbsoluteUrl(src, input.website);
              source = 'website_img';
              break;
            }
          }
        }

        // Extract menu URL
        const menuMatch = html.match(/<a[^>]+href=["']([^"']*menu[^"']*)["']/i);
        if (menuMatch && menuMatch[1] && !menuMatch[1].endsWith('.css') && !menuMatch[1].endsWith('.js')) {
          menuUrl = makeAbsoluteUrl(menuMatch[1], input.website);
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
          'User-Agent': 'LunchHubBot/1.0 (https://lunchhub.app; contact@lunchhub.app)',
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
  if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
    return relativeUrl;
  }
  try {
    return new URL(relativeUrl, baseUrl).href;
  } catch {
    return relativeUrl;
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

