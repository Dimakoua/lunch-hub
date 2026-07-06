import { Restaurant } from '../types/restaurant';

export interface MatchRoom {
  id: string;
  createdAt: number;
  restaurants: Restaurant[];
  groupSize: number;
  votes: Record<string, { yes: string[]; no: string[] }>;
  matchedRestaurantId: string | null;
}

const API_URL = import.meta.env.VITE_POLLS_API_URL 
  || (import.meta.env.PROD ? '' : 'http://localhost:8787');

// Helper to get or generate a unique persistent client ID for voting
export const getClientId = (): string => {
  if (typeof window === 'undefined') return 'server-env';
  let clientId = localStorage.getItem('lunchhub_client_id');
  if (!clientId) {
    clientId = 'usr_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('lunchhub_client_id', clientId);
  }
  return clientId;
};

export const createMatchRoom = async (restaurants: Restaurant[], groupSize: number): Promise<string> => {
  const response = await fetch(`${API_URL}/api/match/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ restaurants, groupSize }),
  });
  
  if (!response.ok) throw new Error('Failed to create match room');
  
  const data = await response.json();
  return data.id;
};

export const getMatchRoom = async (id: string): Promise<MatchRoom> => {
  const response = await fetch(`${API_URL}/api/match/${id}`);
  
  if (!response.ok) throw new Error('Failed to fetch match room');
  
  return await response.json();
};

export const submitSwipeVote = async (
  roomId: string,
  restaurantId: string,
  vote: 'yes' | 'no'
): Promise<MatchRoom> => {
  const clientId = getClientId();
  const response = await fetch(`${API_URL}/api/match/${roomId}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ restaurantId, vote, clientId }),
  });
  
  if (!response.ok) throw new Error('Failed to submit swipe vote');
  
  return await response.json();
};
