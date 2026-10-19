import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { getMatchRoom, submitSwipeVote, getClientId, MatchRoom } from '../services/matchmaker';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Share2, MapPin, CheckCircle2, AlertCircle, ArrowLeft, Heart, X, Sparkles, ExternalLink, ShoppingBag, Copy, Check, Star } from 'lucide-react';
import { ShareCardModal } from '../components/ShareCardModal';
import { batchFetchRestaurantDetails, RestaurantDetails } from '../services/restaurantDetails';
import { getFallbackRestaurantImage } from '../utils/restaurantImages';

export const MatchPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [room, setRoom] = useState<MatchRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [slackCopied, setSlackCopied] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [restaurantDetails, setRestaurantDetails] = useState<Map<string, RestaurantDetails>>(new Map());
  
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

  // Load photos, ratings, and menu links for all restaurants in room
  useEffect(() => {
    if (!room || room.restaurants.length === 0) return;
    batchFetchRestaurantDetails(room.restaurants).then((detailsMap) => {
      setRestaurantDetails(new Map(detailsMap));
    });
  }, [room?.id]);

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

  const handleShareSlack = () => {
    if (!matchedRestaurant) return;
    const details = restaurantDetails.get(matchedRestaurant.id);
    const menuPart = details?.menuUrl ? `\n📋 Menu: ${details.menuUrl}` : '';
    const dealPart = matchedRestaurant.deal ? `\n🔥 Lunch Special: ${matchedRestaurant.deal.dealTitle} (${matchedRestaurant.deal.price})` : '';
    const text = `🎉 Consensus Reached! Today's Team Lunch: *${matchedRestaurant.name}*\n📍 Address: ${matchedRestaurant.address || 'Nearby'}\n🍽️ Cuisine: ${matchedRestaurant.cuisine || 'Lunch'}${dealPart}${menuPart}\n🗺️ Walking Directions: https://www.google.com/maps/dir/?api=1&destination=${matchedRestaurant.lat},${matchedRestaurant.lon}\n👉 Decided on Lunch Hub: ${window.location.href}`;

    navigator.clipboard.writeText(text);
    setSlackCopied(true);
    setTimeout(() => setSlackCopied(false), 2500);
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
              <div className="relative h-[480px] w-full max-w-sm mx-auto flex items-center justify-center">
                {/* Visual Stack Cards */}
                {room.restaurants.slice(currentIndex, currentIndex + 2).map((restaurant, idx) => {
                  const isTop = idx === 0;
                  const details = restaurantDetails.get(restaurant.id);
                  const imageUrl = details?.imageUrl || getFallbackRestaurantImage(restaurant.name, restaurant.cuisine, restaurant.amenity);
                  const menuUrl = details?.menuUrl || (restaurant.website || `https://www.google.com/search?q=${encodeURIComponent(restaurant.name + ' ' + (restaurant.address || '') + ' menu')}`);
                  
                  // Animation translation class
                  let transformClass = "scale-[0.98] translate-y-3 z-0 opacity-70";
                  if (isTop) {
                    transformClass = "scale-100 translate-y-0 z-10 shadow-2xl";
                    if (swipeDirection === 'left') {
                      transformClass = "scale-100 -translate-x-full -rotate-12 z-10 opacity-0 transition-all duration-300 ease-out";
                    } else if (swipeDirection === 'right') {
                      transformClass = "scale-100 translate-x-full rotate-12 z-10 opacity-0 transition-all duration-300 ease-out";
                    }
                  }

                  return (
                    <div
                      key={restaurant.id}
                      className={`absolute inset-0 bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200/50 dark:border-dark-border flex flex-col justify-between transition-transform duration-300 ${transformClass}`}
                    >
                      {/* Full-bleed Photo Background */}
                      <img
                        src={imageUrl}
                        alt={restaurant.name}
                        className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                        loading="eager"
                      />
                      {/* Gradient Vignette for perfect text readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/25 pointer-events-none" />

                      {/* Swipe Stamps (LIKE / NOPE) */}
                      {isTop && swipeDirection === 'right' && (
                        <div className="absolute top-8 right-6 z-30 border-4 border-emerald-400 text-emerald-400 font-black text-2xl px-4 py-1.5 rounded-2xl rotate-12 bg-emerald-950/60 backdrop-blur-sm animate-pulse">
                          LIKE ❤️
                        </div>
                      )}
                      {isTop && swipeDirection === 'left' && (
                        <div className="absolute top-8 left-6 z-30 border-4 border-red-500 text-red-500 font-black text-2xl px-4 py-1.5 rounded-2xl -rotate-12 bg-red-950/60 backdrop-blur-sm animate-pulse">
                          NOPE ❌
                        </div>
                      )}

                      {/* Top Header Floating Badges */}
                      <div className="relative z-20 p-5 flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-500/30">
                          {restaurant.cuisine || 'Food & Dining'}
                        </span>
                        <span className="text-xs text-white/90 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 font-medium">
                          📍 {restaurant.address.split(',')[0]}
                        </span>
                      </div>

                      {/* Bottom Info Card Content */}
                      <div className="relative z-20 p-6 flex flex-col justify-end">
                        {/* Rating & Deal Badges */}
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {details?.rating && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-500 text-white shadow-sm">
                              <Star className="w-3.5 h-3.5 fill-current" />
                              {details.rating.toFixed(1)} {details.reviewsCount ? `(${details.reviewsCount})` : ''}
                            </span>
                          )}
                          {restaurant.deal && (
                            <span className="inline-block px-3 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md animate-pulse">
                              🔥 {restaurant.deal.dealTitle} ({restaurant.deal.price})
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-1 drop-shadow-md">
                          {restaurant.name}
                        </h3>

                        {/* Address */}
                        <p className="text-xs sm:text-sm text-slate-200 line-clamp-1 mb-3 drop-shadow">
                          {restaurant.address}
                        </p>

                        {/* Bottom Row Actions */}
                        <div className="border-t border-white/15 pt-3 flex items-center justify-between text-xs text-slate-300">
                          <span className="truncate">
                            {restaurant.opening_hours ? `🕒 ${restaurant.opening_hours}` : (restaurant.phone ? `📞 ${restaurant.phone}` : 'Open for lunch')}
                          </span>
                          <a
                            href={menuUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex-shrink-0 ml-2 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1 transition shadow-sm"
                          >
                            📋 Menu
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border rounded-3xl p-8 text-center shadow-lg max-w-sm mx-auto">
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
              <div className="flex justify-center items-center gap-6 mt-6">
                <button
                  onClick={() => handleSwipe('left')}
                  disabled={animating}
                  className="w-16 h-16 rounded-full bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border flex items-center justify-center text-red-500 shadow-xl hover:scale-110 active:scale-95 transition-all"
                  aria-label="Nope"
                >
                  <X className="w-8 h-8 stroke-[3]" />
                </button>
                <button
                  onClick={() => handleSwipe('right')}
                  disabled={animating}
                  className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 dark:from-emerald-500 dark:to-emerald-600 flex items-center justify-center text-white shadow-xl shadow-emerald-200/50 dark:shadow-none hover:scale-110 active:scale-95 transition-all"
                  aria-label="Like"
                >
                  <Heart className="w-8 h-8 fill-current stroke-[2.5]" />
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Match celebration screen! */
          <div className="bg-white dark:bg-dark-card border-2 border-emerald-500 rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative animate-fade-in max-w-lg mx-auto">
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
              <>
                {/* Restaurant Showcase Card */}
                <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 sm:p-5 mb-5 text-left border border-slate-200 dark:border-dark-border flex items-center gap-4">
                  <img
                    src={restaurantDetails.get(matchedRestaurant.id)?.imageUrl || getFallbackRestaurantImage(matchedRestaurant.name, matchedRestaurant.cuisine, matchedRestaurant.amenity)}
                    alt={matchedRestaurant.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl shadow-md flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-block text-xs font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-0.5 rounded-full">
                        {matchedRestaurant.cuisine || 'Dining'}
                      </span>
                      {restaurantDetails.get(matchedRestaurant.id)?.rating && (
                        <span className="inline-flex items-center gap-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          {restaurantDetails.get(matchedRestaurant.id)?.rating?.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-dark-text truncate">
                      {matchedRestaurant.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-dark-text-secondary flex items-start gap-1 mt-1 truncate">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-slate-400" />
                      {matchedRestaurant.address}
                    </p>
                  </div>
                </div>

                {/* Promotional Voucher / Lunch Special Card */}
                {matchedRestaurant.deal ? (
                  <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-orange-500/10 border-2 border-dashed border-amber-500 rounded-2xl p-4 mb-5 text-left">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                        🎟️ LUNCH SPECIAL UNLOCKED
                      </span>
                      <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">
                        Show Server
                      </span>
                    </div>
                    <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                      {matchedRestaurant.deal.dealTitle} ({matchedRestaurant.deal.price})
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                      Show this match screen at the counter • Valid {matchedRestaurant.deal.validDays || 'today for lunch'}
                    </p>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border-2 border-dashed border-emerald-500/60 rounded-2xl p-3.5 mb-5 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        🎉 GROUP MATCH PERK
                      </span>
                      <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                        Dine-In
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Show this match screen to your server or at checkout to ask about today's lunch specials!
                    </p>
                  </div>
                )}

                {/* Instant Group Order CTA Section (DoorDash & Uber Eats) */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 mb-5 border border-slate-200 dark:border-dark-border text-left">
                  <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    <ShoppingBag className="w-4 h-4 text-blue-600 dark:text-dark-primary" />
                    Ordering in for the group?
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <a
                      href={`https://www.doordash.com/search/store/${encodeURIComponent(matchedRestaurant.name)}/?pickup=true`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs sm:text-sm text-center shadow-sm transition flex items-center justify-center gap-1.5"
                    >
                      <span>🛵 DoorDash</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <a
                      href={`https://www.ubereats.com/search?q=${encodeURIComponent(matchedRestaurant.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm text-center shadow-sm transition flex items-center justify-center gap-1.5"
                    >
                      <span>🥡 Uber Eats</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="space-y-2.5">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${matchedRestaurant.lat},${matchedRestaurant.lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition text-sm flex items-center justify-center gap-2"
                  >
                    <MapPin className="w-4 h-4" />
                    Get Walking Directions
                  </a>

                  {/* Share to Slack / Teams */}
                  <button
                    onClick={handleShareSlack}
                    className="w-full bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition text-sm flex items-center justify-center gap-2"
                  >
                    {slackCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-blue-400" />}
                    {slackCopied ? 'Copied to clipboard for Slack / Teams! 🚀' : '💼 Share Winner to Slack / Teams'}
                  </button>

                  <button
                    onClick={() => setShareModalOpen(true)}
                    className="w-full bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border text-slate-700 dark:text-dark-text py-2.5 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-gray-800 transition text-sm flex items-center justify-center gap-2"
                  >
                    <Share2 className="w-4 h-4 text-emerald-500" />
                    Share Match Card
                  </button>
                </div>
              </>
            )}

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-border">
              <Link
                to="/"
                className="inline-block text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-dark-text-secondary dark:hover:text-dark-text transition"
              >
                ← Back to Restaurants list
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
