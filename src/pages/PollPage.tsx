import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { getPoll, voteOnPoll, Poll } from '../services/polls';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Share2, MapPin, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { RestaurantCard } from '../components/RestaurantCard';

export const PollPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [votedFor, setVotedFor] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    // Check if user already voted in this poll from localStorage
    const savedVote = localStorage.getItem(`lunch-hub-vote-${id}`);
    if (savedVote) setVotedFor(savedVote);

    const fetchPoll = async () => {
      try {
        const data = await getPoll(id);
        setPoll(data);
      } catch (err) {
        setError('Poll not found or error loading poll.');
      } finally {
        setLoading(false);
      }
    };
    fetchPoll();
    
    // Poll every 5 seconds for live updates
    const interval = setInterval(fetchPoll, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const handleVote = async (restaurantId: string) => {
    if (!id || votedFor) return; // Prevent double voting
    setVotingId(restaurantId);
    try {
      const updatedPoll = await voteOnPoll(id, restaurantId);
      setPoll(updatedPoll);
      setVotedFor(restaurantId);
      localStorage.setItem(`lunch-hub-vote-${id}`, restaurantId);
    } catch (err) {
      alert('Failed to cast vote. Please try again.');
    } finally {
      setVotingId(null);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-background">
        <LoadingSpinner message="Loading poll..." />
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-dark-background p-6">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-dark-text mb-2">Oops!</h2>
        <p className="text-slate-600 dark:text-dark-text-secondary mb-6">{error}</p>
        <Link to="/" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium">Go Home</Link>
      </div>
    );
  }

  // Calculate total votes to show percentages
  const totalVotes = Object.values(poll.votes).reduce((sum, count) => sum + count, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-background pb-20 pt-6 px-4 sm:px-6">
      <Helmet>
        <title>Team Lunch Poll - Lunch Hub</title>
        <meta name="description" content="Vote on where to eat for the upcoming team lunch!" />
      </Helmet>

      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:text-dark-text-secondary dark:hover:text-dark-text transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium hidden sm:inline">Back to Home</span>
          </Link>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border px-4 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-dark-text shadow-sm hover:bg-slate-50 dark:hover:bg-dark-border transition-colors"
          >
            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4 text-blue-500" />}
            {copied ? 'Copied!' : 'Share Poll'}
          </button>
        </div>

        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-dark-primary/20 rounded-2xl mb-4 text-blue-600 dark:text-dark-primary">
            <MapPin className="w-8 h-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-dark-text mb-4">Where should we eat?</h1>
          <p className="text-slate-600 dark:text-dark-text-secondary text-lg">
            {votedFor ? "Thanks for voting! Waiting for others..." : "Cast your vote below. No login required."}
          </p>
        </div>

        <div className="space-y-4">
          {poll.restaurants.map((restaurant) => {
            const votes = poll.votes[restaurant.id] || 0;
            const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
            const isWinner = totalVotes > 0 && votes === Math.max(...Object.values(poll.votes));

            return (
              <div 
                key={restaurant.id} 
                className={`relative overflow-hidden bg-white dark:bg-dark-card border rounded-2xl p-4 transition-all ${
                  votedFor === restaurant.id 
                    ? 'border-blue-500 dark:border-dark-primary ring-2 ring-blue-500/20' 
                    : 'border-slate-200 dark:border-dark-border'
                }`}
              >
                {/* Progress Bar Background */}
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-blue-50/50 dark:bg-dark-primary/5 transition-all duration-1000 ease-out z-0" 
                  style={{ width: `${percentage}%` }} 
                />

                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-dark-text truncate">
                        {restaurant.name}
                      </h3>
                      {restaurant.cuisine && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-dark-border text-slate-600 dark:text-dark-text-secondary">
                          {restaurant.cuisine}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-dark-text-secondary truncate">
                      {restaurant.address}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 sm:w-48">
                    <div className="text-right">
                      <div className="font-black text-2xl text-slate-900 dark:text-dark-text leading-none">{votes}</div>
                      <div className="text-xs font-medium text-slate-500 dark:text-dark-text-secondary">votes ({percentage}%)</div>
                    </div>
                    
                    {!votedFor && (
                      <button
                        onClick={() => handleVote(restaurant.id)}
                        disabled={votingId !== null}
                        className="bg-slate-900 dark:bg-dark-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 dark:hover:bg-blue-600 transition-colors disabled:opacity-50"
                      >
                        {votingId === restaurant.id ? <LoadingSpinner size="sm" /> : 'Vote'}
                      </button>
                    )}
                    {votedFor === restaurant.id && (
                      <div className="flex items-center gap-1 text-blue-600 dark:text-dark-primary font-bold text-sm bg-blue-50 dark:bg-dark-primary/10 px-4 py-2.5 rounded-xl">
                        <CheckCircle2 className="w-4 h-4" />
                        Voted
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default PollPage;
