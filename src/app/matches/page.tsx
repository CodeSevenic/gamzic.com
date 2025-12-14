'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  CalendarDaysIcon,
  UserGroupIcon,
  UserIcon,
  PlayIcon,
  ClockIcon,
  GiftIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { getMatches } from '@/lib/firebase/db';
import { useAuthStore } from '@/store/authStore';
import { type Match, type MatchStatus, type MatchType } from '@/types';
import { useGames } from '@/hooks/useGames';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

const statusColors: Record<MatchStatus, 'success' | 'warning' | 'info' | 'danger' | 'default'> = {
  open: 'success',
  scheduled: 'info',
  in_progress: 'warning',
  completed: 'default',
  cancelled: 'danger',
};

const statusLabels: Record<MatchStatus, string> = {
  open: 'Open to Join',
  scheduled: 'Scheduled',
  in_progress: 'Live Now',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const matchTypeLabels: Record<MatchType, string> = {
  friendly: 'Friendly',
  scrimmage: 'Scrimmage',
  ranked: 'Ranked',
  casual: 'Casual',
};

const matchTypeColors: Record<MatchType, 'success' | 'warning' | 'info' | 'danger' | 'default'> = {
  friendly: 'default',
  scrimmage: 'info',
  ranked: 'warning',
  casual: 'default',
};

export default function MatchesPage() {
  const { gameOptions, getGameInfo } = useGames();
  const { user } = useAuthStore();
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | MatchStatus>('all');
  const [gameFilter, setGameFilter] = useState<string>('all');

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const status = statusFilter !== 'all' ? statusFilter : undefined;
        const game = gameFilter !== 'all' ? gameFilter : undefined;
        const { matches: fetchedMatches } = await getMatches(status, game);
        setMatches(fetchedMatches);
      } catch (error) {
        console.error('Error fetching matches:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatches();
  }, [statusFilter, gameFilter]);

  if (isLoading) {
    return <PageLoader />;
  }

  // Sort matches: open first, then by date
  const sortedMatches = [...matches].sort((a, b) => {
    // Open matches first
    if (a.status === 'open' && b.status !== 'open') return -1;
    if (b.status === 'open' && a.status !== 'open') return 1;
    // Then in_progress
    if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
    if (b.status === 'in_progress' && a.status !== 'in_progress') return 1;
    return 0;
  });

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <PlayIcon className="w-7 h-7 text-green-400" />
            Matches
          </h1>
          <p className="text-dark-400 mt-1">Find and join matches to compete</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | MatchStatus)}
            className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Status</option>
            <option value="open">Open to Join</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">Live Now</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={gameFilter}
            onChange={(e) => setGameFilter(e.target.value)}
            className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Games</option>
            {gameOptions.map((game) => (
              <option key={game.value} value={game.value}>
                {game.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Matches Grid */}
      {sortedMatches.length === 0 ? (
        <Card variant="glass" className="text-center py-12">
          <PlayIcon className="w-16 h-16 mx-auto mb-4 text-dark-600" />
          <p className="text-dark-400">No matches found</p>
          <p className="text-sm text-dark-500 mt-1">Check back soon for upcoming matches!</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedMatches.map((match, index) => {
            const game = getGameInfo(match.game);
            const participantCount = match.participants?.length || 0;
            const isFull = participantCount >= match.maxParticipants;
            const isJoined = user && match.participants?.some(p => p.oduserId === user.id);
            const canJoin = match.status === 'open' && !isFull && !isJoined;

            return (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/matches/${match.id}`}>
                  <Card 
                    variant="default" 
                    hover 
                    padding="none" 
                    className={`overflow-hidden h-full ${match.status === 'in_progress' ? 'ring-2 ring-yellow-500/50' : ''}`}
                  >
                    {/* Banner */}
                    <div className="relative h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                      {match.bannerImage ? (
                        <img
                          src={match.bannerImage}
                          alt={match.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-5xl">{game.icon}</span>
                        </div>
                      )}
                      
                      {/* Status Badge */}
                      <div className="absolute top-2 right-2">
                        <Badge variant={statusColors[match.status]}>
                          {match.status === 'in_progress' && (
                            <span className="mr-1 inline-block w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                          )}
                          {statusLabels[match.status]}
                        </Badge>
                      </div>

                      {/* Match Type */}
                      <div className="absolute top-2 left-2 flex gap-1">
                        <Badge variant={matchTypeColors[match.type]} size="sm">
                          {matchTypeLabels[match.type]}
                        </Badge>
                        {match.prizeDescription && (
                          <Badge variant="warning" size="sm">
                            <GiftIcon className="w-3 h-3" />
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-white line-clamp-1">
                          {match.title}
                        </h3>
                      </div>

                      <p className="text-sm text-dark-400 mb-3">
                        {game.icon} {game.name}
                      </p>

                      <div className="space-y-2 text-sm">
                        {/* Participants */}
                        <div className="flex items-center gap-2 text-dark-400">
                          {match.isTeamMatch ? (
                            <UserGroupIcon className="w-4 h-4" />
                          ) : (
                            <UserIcon className="w-4 h-4" />
                          )}
                          <span className={isFull ? 'text-green-400' : ''}>
                            {participantCount} / {match.maxParticipants} {match.isTeamMatch ? 'teams' : 'players'}
                          </span>
                        </div>

                        {/* Scheduled Time */}
                        {match.scheduledTime && (
                          <div className="flex items-center gap-2 text-dark-400">
                            <CalendarDaysIcon className="w-4 h-4" />
                            <span>{format(match.scheduledTime, 'MMM d, h:mm a')}</span>
                          </div>
                        )}

                        {/* Participants Preview */}
                        {match.participants && match.participants.length > 0 && (
                          <div className="flex items-center gap-2 text-dark-500 text-xs">
                            <ClockIcon className="w-3 h-3" />
                            <span className="truncate">
                              {match.participants.map(p => p.name).join(' vs ')}
                            </span>
                          </div>
                        )}
                      </div>

                      {isJoined ? (
                        <div className="mt-4 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-green-500/10 border border-green-500/30">
                          <CheckCircleIcon className="w-4 h-4 text-green-400" />
                          <span className="text-sm font-medium text-green-400">Joined</span>
                        </div>
                      ) : canJoin ? (
                        <Button size="sm" fullWidth className="mt-4">
                          Join Match
                        </Button>
                      ) : isFull && match.status === 'open' ? (
                        <div className="mt-4 text-center text-sm text-dark-400">
                          Match Full - View Details
                        </div>
                      ) : null}
                    </div>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

