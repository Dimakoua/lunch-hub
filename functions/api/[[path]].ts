interface Env {
  POLLS: KVNamespace;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const KV_TTL = 604800; // 7 days in seconds

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
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

  return new Response('API Route Not Found', { status: 404, headers: corsHeaders });
};
