import { Restaurant } from '../types/restaurant';

export interface Poll {
  id: string;
  createdAt: number;
  restaurants: Restaurant[];
  votes: Record<string, number>;
}

// Use environment variable if available, otherwise default to local wrangler dev server
const API_URL = import.meta.env.VITE_POLLS_API_URL || 'http://localhost:8787';

export const createPoll = async (restaurants: Restaurant[]): Promise<string> => {
  const response = await fetch(`${API_URL}/api/polls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ restaurants }),
  });
  
  if (!response.ok) throw new Error('Failed to create poll');
  
  const data = await response.json();
  return data.id;
};

export const getPoll = async (id: string): Promise<Poll> => {
  const response = await fetch(`${API_URL}/api/polls/${id}`);
  
  if (!response.ok) throw new Error('Failed to fetch poll');
  
  return await response.json();
};

export const voteOnPoll = async (pollId: string, restaurantId: string): Promise<Poll> => {
  const response = await fetch(`${API_URL}/api/polls/${pollId}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ restaurantId }),
  });
  
  if (!response.ok) throw new Error('Failed to submit vote');
  
  return await response.json();
};
