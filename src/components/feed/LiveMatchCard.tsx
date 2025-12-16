'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { PlayIcon, SignalIcon, UserGroupIcon, ClockIcon } from '@heroicons/react/24/solid';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { type Match } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface LiveMatchCardProps {
  match: Match;
  getGameInfo: (gameId: string) => { name: string; icon: string };
  variant?: 'default' | 'compact' | 'featured';
}

export function LiveMatchCard({ match, getGameInfo, variant = 'default' }: LiveMatchCardProps) {
  const game = getGameInfo(match.game);
  const isLive = match.status === 'in_progress';
  const participants = match.participants || [];

  // Get scores for display
  const scores = match.scores || {};
  const player1 = participants[0];
  const player2 = participants[1];
  const score1 = player1 ? scores[player1.oduserId || player1.teamId || ''] || 0 : 0;
  const score2 = player2 ? scores[player2.oduserId || player2.teamId || ''] || 0 : 0;

  if (variant === 'compact') {
    return (
      <Link href={`/matches/${match.id}`}>
        <Card variant="default" hover padding="sm" className="relative overflow-hidden">
          {/* Live indicator */}
          {isLive && (
            <div className="absolute top-2 right-2">
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-bold text-red-400">LIVE</span>
              </span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <span className="text-2xl">{game.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm truncate">{match.title}</p>
              <p className="text-xs text-dark-400">{game.name}</p>
            </div>
            {isLive && participants.length >= 2 && (
              <div className="flex items-center gap-2 text-lg font-bold">
                <span className="text-cyan-400">{score1}</span>
                <span className="text-dark-500">-</span>
                <span className="text-purple-400">{score2}</span>
              </div>
            )}
          </div>
        </Card>
      </Link>
    );
  }

  if (variant === 'featured') {
    return (
      <Link href={`/matches/${match.id}`}>
        <Card
          variant="neon"
          hover
          padding="none"
          className="relative overflow-hidden ring-2 ring-red-500/30"
        >
          {/* Background Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-orange-500/5 to-transparent" />

          {/* Animated Border */}
          <div className="absolute inset-0 rounded-xl">
            <div className="absolute inset-[-2px] rounded-xl bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 opacity-30 animate-pulse" />
          </div>

          {/* Banner */}
          {match.bannerImage && (
            <div className="relative h-24 overflow-hidden">
              <img
                src={match.bannerImage}
                alt={match.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-900 to-transparent" />
            </div>
          )}

          <div className="relative p-4">
            {/* Live Badge */}
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500 text-white text-xs font-bold">
                <SignalIcon className="w-3 h-3" />
                <span>LIVE NOW</span>
              </span>
              <span className="text-2xl">{game.icon}</span>
            </div>

            {/* Title */}
            <h3 className="font-bold text-white text-lg mb-3">{match.title}</h3>

            {/* VS Section */}
            {participants.length >= 2 && (
              <div className="flex items-center justify-between py-4 px-3 bg-dark-800/50 rounded-xl mb-3">
                {/* Player 1 */}
                <div className="text-center flex-1">
                  <p className="font-semibold text-white truncate">{player1?.name}</p>
                  <motion.p
                    key={score1}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="text-3xl font-bold text-cyan-400"
                  >
                    {score1}
                  </motion.p>
                </div>

                {/* VS */}
                <div className="px-4">
                  <span className="text-dark-500 font-bold text-lg">VS</span>
                </div>

                {/* Player 2 */}
                <div className="text-center flex-1">
                  <p className="font-semibold text-white truncate">{player2?.name}</p>
                  <motion.p
                    key={score2}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="text-3xl font-bold text-purple-400"
                  >
                    {score2}
                  </motion.p>
                </div>
              </div>
            )}

            {/* Watch Button */}
            <button className="w-full py-2.5 rounded-lg bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold flex items-center justify-center gap-2 hover:from-red-400 hover:to-orange-400 transition-all">
              <PlayIcon className="w-5 h-5" />
              Watch Match
            </button>
          </div>
        </Card>
      </Link>
    );
  }

  // Default variant
  return (
    <Link href={`/matches/${match.id}`}>
      <Card variant="default" hover padding="none" className="relative overflow-hidden">
        {/* Top gradient bar for live matches */}
        {isLive && (
          <div className="h-1 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 animate-pulse" />
        )}

        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{game.icon}</span>
              <span className="text-sm text-dark-400">{game.name}</span>
            </div>
            {isLive ? (
              <Badge variant="danger" className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                LIVE
              </Badge>
            ) : (
              <Badge variant={match.status === 'scheduled' ? 'info' : 'default'}>
                {match.status === 'scheduled' ? 'Upcoming' : 'Open'}
              </Badge>
            )}
          </div>

          {/* Title */}
          <h3 className="font-bold text-white mb-3">{match.title}</h3>

          {/* Participants / Scores */}
          {participants.length >= 2 ? (
            <div className="flex items-center gap-3 p-3 bg-dark-800/50 rounded-lg">
              <div className="flex-1 text-right">
                <p className="text-sm text-white font-medium truncate">{player1?.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xl font-bold ${
                    score1 > score2 ? 'text-green-400' : 'text-white'
                  }`}
                >
                  {isLive || match.status === 'completed' ? score1 : '-'}
                </span>
                <span className="text-dark-500">:</span>
                <span
                  className={`text-xl font-bold ${
                    score2 > score1 ? 'text-green-400' : 'text-white'
                  }`}
                >
                  {isLive || match.status === 'completed' ? score2 : '-'}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-white font-medium truncate">{player2?.name}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-dark-400">
              <UserGroupIcon className="w-4 h-4" />
              <span>
                {participants.length} / {match.maxParticipants} players
              </span>
            </div>
          )}

          {/* Time info */}
          {match.scheduledTime && !isLive && (
            <div className="flex items-center gap-2 mt-3 text-sm text-dark-400">
              <ClockIcon className="w-4 h-4" />
              <span>{formatDistanceToNow(match.scheduledTime, { addSuffix: true })}</span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
