'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlayIcon,
  TrophyIcon,
  MegaphoneIcon,
  SparklesIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  StarIcon,
} from '@heroicons/react/24/solid';
import { type FeedStory, type Match, type Tournament } from '@/types';

interface StoryDisplay {
  id: string;
  type: 'story' | 'live_match' | 'tournament';
  title: string;
  subtitle?: string;
  image?: string;
  icon?: string;
  href: string;
  badge?: string;
  badgeColor?: 'red' | 'yellow' | 'cyan' | 'purple' | 'green';
  isLive?: boolean;
  gradient: string;
  rawData?: FeedStory | Match | Tournament;
}

interface StoriesProps {
  stories: FeedStory[];
  liveMatches: Match[];
  upcomingTournaments: Tournament[];
  getGameInfo: (gameId: string) => { name: string; icon: string };
}

export function Stories({ stories, liveMatches, upcomingTournaments, getGameInfo }: StoriesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [expandedStory, setExpandedStory] = useState<StoryDisplay | null>(null);

  // Build display items from real data only
  const displayItems: StoryDisplay[] = [
    // Live matches (highest priority)
    ...liveMatches.slice(0, 3).map((match): StoryDisplay => {
      const game = getGameInfo(match.game);
      return {
        id: `match-${match.id}`,
        type: 'live_match',
        title: match.title,
        subtitle: `${game.icon} ${game.name}`,
        image: match.bannerImage,
        icon: game.icon,
        href: `/matches/${match.id}`,
        badge: 'LIVE',
        badgeColor: 'red',
        isLive: true,
        gradient: 'from-red-500/80 via-orange-500/60 to-yellow-500/40',
        rawData: match,
      };
    }),

    // Admin-created stories
    ...stories.map(
      (story): StoryDisplay => ({
        id: `story-${story.id}`,
        type: 'story',
        title: story.title,
        subtitle: story.subtitle,
        image: story.imageUrl,
        href: story.linkUrl || '#',
        badge: story.badge,
        badgeColor: story.badgeColor,
        gradient: story.gradient || 'from-cyan-500/80 via-purple-500/60 to-pink-500/40',
        rawData: story,
      })
    ),

    // Tournaments with open registration
    ...upcomingTournaments.slice(0, 3).map((tournament): StoryDisplay => {
      const game = getGameInfo(tournament.game);
      return {
        id: `tournament-${tournament.id}`,
        type: 'tournament',
        title: tournament.title,
        subtitle: `${tournament.participants.length} registered`,
        image: tournament.bannerImage,
        icon: game.icon,
        href: `/tournaments/${tournament.id}`,
        badge: tournament.status === 'registration' ? 'OPEN' : 'LIVE',
        badgeColor: tournament.status === 'registration' ? 'green' : 'yellow',
        gradient: 'from-cyan-500/80 via-blue-500/60 to-purple-500/40',
        rawData: tournament,
      };
    }),
  ];

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [displayItems]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 200;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
    setTimeout(checkScroll, 300);
  };

  if (displayItems.length === 0) return null;

  return (
    <>
      <div className="relative mb-6">
        {/* Section Header */}
        <div className="flex items-center gap-2 mb-3 px-1">
          <SparklesIcon className="w-5 h-5 text-cyber-yellow" />
          <span className="text-sm font-semibold text-dark-300 uppercase tracking-wider">
            Featured
          </span>
        </div>

        {/* Scroll Container */}
        <div className="relative group">
          {/* Left Arrow */}
          <AnimatePresence>
            {canScrollLeft && (
              <motion.button
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-dark-800/90 border border-dark-600 flex items-center justify-center text-white shadow-lg hover:bg-dark-700 transition-colors hidden sm:flex"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Stories Carousel */}
          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 px-1 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {displayItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="flex-shrink-0 snap-start"
              >
                <StoryCard item={item} onClick={() => setExpandedStory(item)} />
              </motion.div>
            ))}
          </div>

          {/* Right Arrow */}
          <AnimatePresence>
            {canScrollRight && (
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-dark-800/90 border border-dark-600 flex items-center justify-center text-white shadow-lg hover:bg-dark-700 transition-colors hidden sm:flex"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Expanded Story Modal */}
      <AnimatePresence>
        {expandedStory && (
          <StoryModal
            item={expandedStory}
            onClose={() => setExpandedStory(null)}
            getGameInfo={getGameInfo}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function StoryCard({ item, onClick }: { item: StoryDisplay; onClick: () => void }) {
  const TypeIcon =
    item.type === 'live_match'
      ? PlayIcon
      : item.type === 'tournament'
      ? TrophyIcon
      : item.type === 'story'
      ? StarIcon
      : MegaphoneIcon;

  return (
    <button onClick={onClick} className="relative w-20 sm:w-24 group focus:outline-none">
      {/* Story Ring */}
      <div
        className={`
        relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl p-[3px]
        ${
          item.isLive
            ? 'bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 animate-pulse'
            : 'bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500'
        }
        group-hover:scale-105 transition-transform duration-200
      `}
      >
        {/* Inner Container */}
        <div
          className={`
          w-full h-full rounded-xl overflow-hidden
          bg-gradient-to-br ${item.gradient}
          relative
        `}
        >
          {/* Background Image or Icon */}
          {item.image ? (
            <img
              src={item.image}
              alt={item.title}
              className="w-full h-full object-cover opacity-60"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-3xl sm:text-4xl">{item.icon || '🎮'}</span>
            </div>
          )}

          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Type Icon */}
          <div className="absolute top-1.5 left-1.5">
            <TypeIcon className={`w-4 h-4 ${item.isLive ? 'text-red-400' : 'text-white/80'}`} />
          </div>

          {/* Badge */}
          {item.badge && (
            <div
              className={`
              absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold
              ${
                item.badgeColor === 'red'
                  ? 'bg-red-500 text-white'
                  : item.badgeColor === 'green'
                  ? 'bg-green-500 text-white'
                  : item.badgeColor === 'purple'
                  ? 'bg-purple-500 text-white'
                  : item.badgeColor === 'yellow'
                  ? 'bg-yellow-500 text-black'
                  : 'bg-cyan-500 text-white'
              }
            `}
            >
              {item.isLive && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-white mr-1 animate-pulse" />
              )}
              {item.badge}
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <p className="mt-2 text-xs text-white font-medium truncate text-center px-1">{item.title}</p>
    </button>
  );
}

function StoryModal({
  item,
  onClose,
  getGameInfo,
}: {
  item: StoryDisplay;
  onClose: () => void;
  getGameInfo: (gameId: string) => { name: string; icon: string };
}) {
  const [progress, setProgress] = useState(0);
  const [shouldClose, setShouldClose] = useState(false);

  // Handle progress timer
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setShouldClose(true);
          return 100;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(timer);
  }, []);

  // Handle close in a separate effect to avoid setState during render
  useEffect(() => {
    if (shouldClose) {
      onClose();
    }
  }, [shouldClose, onClose]);

  const match = item.type === 'live_match' ? (item.rawData as Match) : null;
  const tournament = item.type === 'tournament' ? (item.rawData as Tournament) : null;
  const story = item.type === 'story' ? (item.rawData as FeedStory) : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm h-[70vh] max-h-[600px] rounded-2xl overflow-hidden bg-dark-900"
      >
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-dark-700 z-10">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient}`}>
          {item.image && (
            <img
              src={item.image}
              alt={item.title}
              className="w-full h-full object-cover opacity-40"
            />
          )}
        </div>

        {/* Content Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

        {/* Content */}
        <div className="relative h-full flex flex-col justify-end p-6">
          {/* Badge */}
          {item.badge && (
            <div
              className={`
              inline-flex items-center self-start mb-4 px-3 py-1 rounded-full text-sm font-bold
              ${
                item.badgeColor === 'red'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : item.badgeColor === 'green'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : item.badgeColor === 'purple'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              }
            `}
            >
              {item.isLive && (
                <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse" />
              )}
              {item.badge}
            </div>
          )}

          {/* Title */}
          <h2 className="text-2xl font-bold text-white mb-2">{item.title}</h2>

          {/* Subtitle */}
          {item.subtitle && <p className="text-dark-300 mb-4">{item.subtitle}</p>}

          {/* Match-specific content */}
          {match && match.participants && match.participants.length >= 2 && (
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-center gap-4 py-3 bg-white/10 rounded-xl">
                <div className="text-center flex-1">
                  <p className="font-semibold text-white truncate">{match.participants[0]?.name}</p>
                  <p className="text-3xl font-bold text-cyan-400">
                    {match.scores?.[
                      match.participants[0]?.oduserId || match.participants[0]?.teamId || ''
                    ] || 0}
                  </p>
                </div>
                <span className="text-dark-500 font-bold text-lg">VS</span>
                <div className="text-center flex-1">
                  <p className="font-semibold text-white truncate">{match.participants[1]?.name}</p>
                  <p className="text-3xl font-bold text-purple-400">
                    {match.scores?.[
                      match.participants[1]?.oduserId || match.participants[1]?.teamId || ''
                    ] || 0}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tournament-specific content */}
          {tournament && (
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-4 text-white/80">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  <span>{tournament.participants.length} players</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrophyIcon className="w-4 h-4 text-yellow-400" />
                  <span className="capitalize">{tournament.type}</span>
                </div>
              </div>
              {tournament.prizeDescription && (
                <p className="text-yellow-400 font-medium">{tournament.prizeDescription}</p>
              )}
            </div>
          )}

          {/* CTA Button */}
          <Link
            href={item.href}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold text-center hover:from-cyan-400 hover:to-purple-500 transition-all"
          >
            {item.type === 'live_match'
              ? 'Watch Now'
              : item.type === 'tournament'
              ? 'View Tournament'
              : 'View More'}
          </Link>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-black/30 text-white/60 hover:text-white hover:bg-black/50 transition-colors"
        >
          <span className="sr-only">Close</span>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </motion.div>
    </motion.div>
  );
}
