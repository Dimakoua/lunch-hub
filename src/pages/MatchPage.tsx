import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { getMatchRoom, submitSwipeVote, getClientId, MatchRoom } from '../services/matchmaker';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Share2, MapPin, CheckCircle2, AlertCircle, ArrowLeft, Heart, X, Sparkles, MessageSquare } from 'lucide-react';
import { ShareCardModal } from '../components/ShareCardModal';

export const MatchPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [room, setRoom] = useState<MatchRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  
  // Swipe State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [animating, setAnimating] = useState(false);

  const clientId = getClientId();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Poll room updates every 3 seconds
  useEffect(() => {
    if (!id) return;

    const fetchRoom = async () => {
      try {
        const data = await getMatchRoom(id);
        setRoom(data);
        
        // If a match is found, trigger confetti
        if (data.matchedRestaurantId) {
          triggerConfetti();
        }
      } catch (err) {
        setError('Match room not found.');
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
    const interval = setInterval(fetchRoom, 3000);
    return () => {
      clearInterval(interval);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [id]);

  // Set the swipe index correctly if the user refreshes
  // (We check which restaurants the user has already voted on)
  useEffect(() => {
    if (!room) return;
    const votedIndex = room.restaurants.findIndex(r => {
      const votes = room.votes[r.id];
      if (!votes) return true;
      return !votes.yes.includes(clientId) && !votes.no.includes(clientId);
    });
    if (votedIndex !== -1) {
      setCurrentIndex(votedIndex);
    } else {
      setCurrentIndex(room.restaurants.length);
    }
  }, [room, clientId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (!id || !room || animating || currentIndex >= room.restaurants.length) return;

    const currentRestaurant = room.restaurants[currentIndex];
    setSwipeDirection(direction);
    setAnimating(true);

    // Wait for CSS slide animation
    setTimeout(async () => {
      try {
        const vote = direction === 'right' ? 'yes' : 'no';
        const updatedRoom = await submitSwipeVote(id, currentRestaurant.id, vote);
        setRoom(updatedRoom);
        setCurrentIndex(prev => prev + 1);
      } catch (err) {
        alert('Failed to submit vote. Please try again.');
      } finally {
        setSwipeDirection(null);
        setAnimating(false);
      }
    }, 300);
  };

  // Simple, elegant custom canvas confetti engine
  const triggerConfetti = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'];
    const particles = Array.from({ length: 150 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      r: Math.random() * 6 + 4,
      d: Math.random() * canvas.height,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngleIncremental: Math.random() * 0.07 + 0.02,
      tiltAngle: 0,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, idx) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
        p.x += Math.sin(p.tiltAngle);
        p.tilt = Math.sin(p.tiltAngle - idx / 3) * 15;

        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();
      });

      // Keep animating if particles haven't reached the bottom
      if (particles.some(p => p.y < canvas.height)) {
        animationFrameRef.current = requestAnimationFrame(draw);
      }
    };
    draw();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-background">
        <LoadingSpinner message="Entering Swipe Match Room..." />
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-dark-background p-6">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-dark-text mb-2">Room Error</h2>
        <p className="text-slate-600 dark:text-dark-text-secondary mb-6">{error}</p>
        <Link to="/" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:bg-blue-700 transition">Go Home</Link>
      </div>
    );
  }

  const isMatched = room.matchedRestaurantId !== null;
  const matchedRestaurant = room.restaurants.find(r => r.id === room.matchedRestaurantId);
  const currentRestaurant = room.restaurants[currentIndex];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-background pb-20 pt-6 px-4 sm:px-6 relative overflow-hidden">
      <Helmet>
        <title>Swipe to Match Lunch - Lunch Hub</title>
        <meta name="description" content="Swipe on restaurants with your friends to find the perfect match!" />
      </Helmet>

      {/* Confetti Overlay */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-50 w-full h-full" />

      <div className="max-w-md mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:text-dark-text-secondary dark:hover:text-dark-text transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Leave Room</span>
          </Link>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border px-4 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-dark-text shadow-sm hover:bg-slate-50 dark:hover:bg-dark-border transition-colors"
          >
            <Share2 className="w-4 h-4 text-blue-600 dark:text-dark-primary" />
            {copied ? 'Copied!' : 'Invite Friends'}
          </button>
        </div>

        {/* Swipe match active UI */}
        {!isMatched ? (
          <div>
            {/* Room Info */}
            <div className="text-center mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-dark-primary/10 dark:text-dark-primary mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                Room Code: {room.id}
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-dark-text">Tinder for Food</h2>
              <p className="text-sm text-slate-500 dark:text-dark-text-secondary mt-1">
                Deciding for a group of <span className="font-bold text-slate-800 dark:text-dark-text">{room.groupSize}</span> people
              </p>
            </div>

            {currentIndex < room.restaurants.length ? (
              <div className="relative h-[420px] w-full flex items-center justify-center">
                {/* Visual Stack Cards */}
                {room.restaurants.slice(currentIndex, currentIndex + 2).map((restaurant, idx) => {
                  const isTop = idx === 0;
                  
                  // Animation translation class
                  let transformClass = "scale-[0.98] translate-y-3 z-0 opacity-70";
                  if (isTop) {
                    transformClass = "scale-100 translate-y-0 z-10 shadow-xl";
                    if (swipeDirection === 'left') {
                      transformClass = "scale-100 -translate-x-full -rotate-12 z-10 opacity-0 transition-all duration-300 ease-out";
                    } else if (swipeDirection === 'right') {
                      transformClass = "scale-100 translate-x-full rotate-12 z-10 opacity-0 transition-all duration-300 ease-out";
                    }
                  }

                  return (
                    <div
                      key={restaurant.id}
                      className={`absolute inset-0 bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border rounded-3xl p-6 flex flex-col justify-between transition-transform duration-300 ${transformClass}`}
                    >
                      <div>
                        {/* Cuisine Tag & Distance */}
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40 px-3 py-1 rounded-full">
                            {restaurant.cuisine || 'Food & Dining'}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-dark-text-secondary">
                            📍 {restaurant.address.split(',')[0]}
                          </span>
                        </div>

                        {/* Title & Amenities */}
                        <h3 className="text-2xl font-black text-slate-900 dark:text-dark-text leading-tight mb-2">
                          {restaurant.name}
                        </h3>
                        
                        {/* Meta Rows */}
                        <p className="text-sm text-slate-500 dark:text-dark-text-secondary mb-4 line-clamp-2">
                          {restaurant.address}
                        </p>
                      </div>

                      {/* Bottom action tips */}
                      <div className="border-t border-slate-50 dark:border-dark-border/40 pt-4 flex flex-col gap-1.5 text-xs text-slate-400">
                        {restaurant.phone && <span>📞 {restaurant.phone}</span>}
                        {restaurant.opening_hours && <span className="truncate">🕒 {restaurant.opening_hours}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border rounded-3xl p-8 text-center shadow-lg">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-dark-text mb-2">All Swiped!</h3>
                <p className="text-sm text-slate-500 dark:text-dark-text-secondary mb-6">
                  You've swiped on every restaurant. Waiting for your friends to agree on a match!
                </p>
                <div className="animate-pulse flex items-center justify-center gap-2 text-blue-600 dark:text-dark-primary text-xs font-bold uppercase tracking-wider">
                  <span className="w-2.5 h-2.5 bg-blue-600 dark:bg-dark-primary rounded-full" />
                  Live Syncing State...
                </div>
              </div>
            )}

            {/* Action swipe buttons */}
            {currentIndex < room.restaurants.length && (
              <div className="flex justify-center items-center gap-6 mt-8">
                <button
                  onClick={() => handleSwipe('left')}
                  disabled={animating}
                  className="w-16 h-16 rounded-full bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border flex items-center justify-center text-red-500 shadow-lg hover:scale-110 active:scale-95 transition-all"
                  aria-label="Nope"
                >
                  <X className="w-8 h-8 stroke-[3]" />
                </button>
                <button
                  onClick={() => handleSwipe('right')}
                  disabled={animating}
                  className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 dark:from-emerald-500 dark:to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200/50 dark:shadow-none hover:scale-110 active:scale-95 transition-all"
                  aria-label="Like"
                >
                  <Heart className="w-8 h-8 fill-current stroke-[2.5]" />
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Match celebration screen! */
          <div className="bg-white dark:bg-dark-card border-2 border-emerald-500 rounded-3xl p-8 text-center shadow-2xl relative">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-emerald-500 text-white rounded-full p-3 shadow-lg">
              <Sparkles className="w-8 h-8" />
            </div>

            <h2 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-6 mb-2">
              IT'S A MATCH! 🎉
            </h2>
            <p className="text-sm text-slate-500 dark:text-dark-text-secondary mb-6">
              Everyone in the group agreed on this restaurant!
            </p>

            {matchedRestaurant && (
              <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-6 mb-8 text-left border border-slate-100 dark:border-dark-border">
                <h3 className="text-xl font-bold text-slate-900 dark:text-dark-text mb-1">
                  {matchedRestaurant.name}
                </h3>
                <span className="inline-block text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full mb-3">
                  {matchedRestaurant.cuisine || 'Dining'}
                </span>
                <p className="text-xs text-slate-500 dark:text-dark-text-secondary flex items-start gap-1">
                  <MapPin className="w-4 h-4 flex-shrink-0 text-slate-400" />
                  {matchedRestaurant.address}
                </p>
              </div>
            )}

            <div className="space-y-3">
              {matchedRestaurant && (
                <>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${matchedRestaurant.lat},${matchedRestaurant.lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition text-sm"
                  >
                    Get Walking Directions
                  </a>
                  <button
                    onClick={() => setShareModalOpen(true)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition text-sm flex items-center justify-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Share Match Card
                  </button>
                </>
              )}
              <Link
                to="/"
                className="block w-full bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-dark-text py-3 rounded-xl font-bold transition text-sm"
              >
                Go back to Restaurants list
              </Link>
            </div>
          </div>
        )}
      </div>

      <ShareCardModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        restaurant={matchedRestaurant || null}
      />
    </div>
  );
};
export default MatchPage;
