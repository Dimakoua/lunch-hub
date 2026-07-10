interface Env {
  POLLS: KVNamespace;
  ASSETS: Fetcher;
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

    // Return 404 for unmatched API routes
    if (pathname.startsWith('/api/')) {
      return new Response('API Route Not Found', { status: 404, headers: corsHeaders });
    }

    // Not an API route — serve the React SPA static assets
    try {
      const response = await env.ASSETS.fetch(request);
      if (response.status === 404) {
        const indexUrl = new URL('/index.html', request.url);
        return await env.ASSETS.fetch(new Request(indexUrl.toString(), request));
      }
      return response;
    } catch (err) {
      const indexUrl = new URL('/index.html', request.url);
      return await env.ASSETS.fetch(new Request(indexUrl.toString(), request));
    }
  }
};
