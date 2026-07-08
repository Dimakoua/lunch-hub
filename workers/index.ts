interface Env {
  POLLS: KVNamespace;
  ASSETS: Fetcher; // Static assets binding (dist/)
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // POST /api/polls - Create a new poll
    if (request.method === 'POST' && url.pathname === '/api/polls') {
      try {
        const body: any = await request.json();
        // Generate a 6-character random ID
        const id = Math.random().toString(36).substring(2, 8);
        
        const pollData = {
          id,
          createdAt: Date.now(),
          restaurants: body.restaurants,
          votes: {}
        };
        
        await env.POLLS.put(id, JSON.stringify(pollData));
        
        return new Response(JSON.stringify({ id }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (err) {
        return new Response('Bad Request', { status: 400, headers: corsHeaders });
      }
    }

    // GET /api/polls/:id - Fetch poll
    if (request.method === 'GET' && url.pathname.startsWith('/api/polls/')) {
      const id = url.pathname.split('/').pop();
      if (!id) return new Response('Not Found', { status: 404, headers: corsHeaders });
      
      const poll = await env.POLLS.get(id);
      if (!poll) return new Response('Poll not found', { status: 404, headers: corsHeaders });
      
      return new Response(poll, {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST /api/polls/:id/vote - Vote on a restaurant
    if (request.method === 'POST' && url.pathname.startsWith('/api/polls/') && url.pathname.endsWith('/vote')) {
      const parts = url.pathname.split('/');
      const id = parts[parts.length - 2];
      
      try {
        const { restaurantId } = await request.json();
        const pollString = await env.POLLS.get(id);
        if (!pollString) return new Response('Poll not found', { status: 404, headers: corsHeaders });
        
        const poll = JSON.parse(pollString);
        poll.votes[restaurantId] = (poll.votes[restaurantId] || 0) + 1;
        
        await env.POLLS.put(id, JSON.stringify(poll));
        
        return new Response(JSON.stringify(poll), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (err) {
        return new Response('Bad Request', { status: 400, headers: corsHeaders });
      }
    }

    // POST /api/match/create - Create a new matchmaker room
    if (request.method === 'POST' && url.pathname === '/api/match/create') {
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
        
        await env.POLLS.put(`match:${id}`, JSON.stringify(matchData));
        
        return new Response(JSON.stringify({ id }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (err) {
        return new Response('Bad Request', { status: 400, headers: corsHeaders });
      }
    }

    // GET /api/match/:id - Get matchmaker room state
    if (request.method === 'GET' && url.pathname.startsWith('/api/match/') && !url.pathname.endsWith('/vote')) {
      const id = url.pathname.split('/').pop();
      if (!id) return new Response('Not Found', { status: 404, headers: corsHeaders });
      
      const matchString = await env.POLLS.get(`match:${id}`);
      if (!matchString) return new Response('Match room not found', { status: 404, headers: corsHeaders });
      
      return new Response(matchString, {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST /api/match/:id/vote - Submit a swipe vote
    if (request.method === 'POST' && url.pathname.startsWith('/api/match/') && url.pathname.endsWith('/vote')) {
      const parts = url.pathname.split('/');
      const id = parts[parts.length - 2];
      
      try {
        const { restaurantId, vote, clientId } = await request.json();
        if (!restaurantId || !vote || !clientId) {
          return new Response('Missing fields', { status: 400, headers: corsHeaders });
        }
        
        const matchString = await env.POLLS.get(`match:${id}`);
        if (!matchString) return new Response('Match room not found', { status: 404, headers: corsHeaders });
        
        const room = JSON.parse(matchString);
        
        // Initialize vote record for this restaurant if not exists
        room.votes[restaurantId] = room.votes[restaurantId] || { yes: [], no: [] };
        
        // Remove client from opposite list if they somehow revote, and add to current
        const oppositeList = vote === 'yes' ? room.votes[restaurantId].no : room.votes[restaurantId].yes;
        const currentList = vote === 'yes' ? room.votes[restaurantId].yes : room.votes[restaurantId].no;
        
        const oppIndex = oppositeList.indexOf(clientId);
        if (oppIndex > -1) oppositeList.splice(oppIndex, 1);
        
        if (!currentList.includes(clientId)) {
          currentList.push(clientId);
        }
        
        // Check if consensus is reached
        if (vote === 'yes' && room.votes[restaurantId].yes.length >= room.groupSize) {
          room.matchedRestaurantId = restaurantId;
        }
        
        await env.POLLS.put(`match:${id}`, JSON.stringify(room));
        
        return new Response(JSON.stringify(room), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (err) {
        return new Response('Bad Request', { status: 400, headers: corsHeaders });
      }
    }

    // Not an API route — serve the React SPA static assets
    return env.ASSETS.fetch(request);
  },
};
