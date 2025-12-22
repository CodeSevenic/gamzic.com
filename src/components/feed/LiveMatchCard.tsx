'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { PlayIcon, SignalIcon, UserGroupIcon, ClockIcon, BoltIcon, FireIcon, TvIcon } from '@heroicons/react/24/solid';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { type Match, type MatchEvent } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface LiveMatchCardProps {
  match: Match;
  getGameInfo: (gameId: string) => { name: string; icon: string };
  variant?: 'default' | 'compact' | 'featured';
}

// Event type icons/emojis
const EVENT_ICONS: Record<string, string> = {
  goal: '⚽',
  assist: '🎯',
  kill: '💀',
  round_win: '🏆',
  point: '📍',
  save: '🧤',
  penalty: '🔴',
  other: '📌',
};

export function LiveMatchCard({ match, getGameInfo, variant = 'default' }: LiveMatchCardProps) {
  const game = getGameInfo(match.game);
  const isLive = match.status === 'in_progress';
  const participants = match.participants || [];
  const events = match.events || [];

  // Get scores for display
  const scores = match.scores || {};
  const player1 = participants[0];
  const player2 = participants[1];
  const score1 = player1 ? scores[player1.oduserId || player1.teamId || ''] || 0 : 0;
  const score2 = player2 ? scores[player2.oduserId || player2.teamId || ''] || 0 : 0;

  // Get recent events (last 3)
  const recentEvents = events.slice(-3).reverse();

  // Get scorers for each team
  const player1Id = player1?.oduserId || player1?.teamId || '';
  const player2Id = player2?.oduserId || player2?.teamId || '';
  const player1Events = events.filter(e => e.participantId === player1Id);
  const player2Events = events.filter(e => e.participantId === player2Id);

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
            {/* Live Badge & Game Info */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500 text-white text-xs font-bold">
                  <SignalIcon className="w-3 h-3" />
                  <span>LIVE NOW</span>
                </span>
                {match.currentRound && (
                  <span className="px-2 py-1 rounded-full bg-dark-700 text-dark-300 text-xs">
                    Round {match.currentRound}
                  </span>
                )}
                {match.currentMap && (
                  <span className="px-2 py-1 rounded-full bg-dark-700 text-dark-300 text-xs">
                    {match.currentMap}
                  </span>
                )}
              </div>
              <span className="text-2xl">{game.icon}</span>
            </div>

            {/* Title */}
            <h3 className="font-bold text-white text-lg mb-3">{match.title}</h3>

            {/* VS Section with Score */}
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
                  {/* Player 1 events summary */}
                  {player1Events.length > 0 && (
                    <div className="mt-1 flex flex-wrap justify-center gap-1">
                      {player1Events.slice(-3).map((event, idx) => (
                        <span key={idx} className="text-xs" title={event.description || event.type}>
                          {EVENT_ICONS[event.type] || '📌'}
                        </span>
                      ))}
                    </div>
                  )}
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
                  {/* Player 2 events summary */}
                  {player2Events.length > 0 && (
                    <div className="mt-1 flex flex-wrap justify-center gap-1">
                      {player2Events.slice(-3).map((event, idx) => (
                        <span key={idx} className="text-xs" title={event.description || event.type}>
                          {EVENT_ICONS[event.type] || '📌'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recent Events Feed */}
            {recentEvents.length > 0 && (
              <div className="mb-3 p-2 bg-dark-800/30 rounded-lg">
                <p className="text-[10px] text-dark-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <BoltIcon className="w-3 h-3" />
                  Recent Activity
                </p>
                <div className="space-y-1">
                  {recentEvents.map((event, idx) => (
                    <motion.div
                      key={event.id || idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center gap-2 text-xs"
                    >
                      <span>{EVENT_ICONS[event.type] || '📌'}</span>
                      <span className="text-cyan-400 font-medium">{event.participantName}</span>
                      <span className="text-dark-400">{event.description || event.type}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Watch Button / Stream Link */}
            <div className="flex gap-2">
              <button className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold flex items-center justify-center gap-2 hover:from-red-400 hover:to-orange-400 transition-all">
                <PlayIcon className="w-5 h-5" />
                Watch Match
              </button>
              {match.streamUrl && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.open(match.streamUrl, '_blank', 'noopener,noreferrer');
                  }}
                  className="px-4 py-2.5 rounded-lg bg-purple-500/20 text-purple-400 font-semibold flex items-center justify-center gap-2 hover:bg-purple-500/30 transition-all"
                >
                  <TvIcon className="w-5 h-5" />
                </button>
              )}
            </div>
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
              {match.currentMap && (
                <span className="text-xs text-dark-500">• {match.currentMap}</span>
              )}
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
                {/* Show event icons for player 1 */}
                {isLive && player1Events.length > 0 && (
                  <div className="flex justify-end gap-0.5 mt-1">
                    {player1Events.slice(-2).map((e, i) => (
                      <span key={i} className="text-[10px]">{EVENT_ICONS[e.type] || '📌'}</span>
                    ))}
                  </div>
                )}
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
                {/* Show event icons for player 2 */}
                {isLive && player2Events.length > 0 && (
                  <div className="flex gap-0.5 mt-1">
                    {player2Events.slice(-2).map((e, i) => (
                      <span key={i} className="text-[10px]">{EVENT_ICONS[e.type] || '📌'}</span>
                    ))}
                  </div>
                )}
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

          {/* Latest event for live matches */}
          {isLive && recentEvents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 flex items-center gap-2 text-xs text-dark-400 p-2 bg-dark-800/30 rounded"
            >
              <FireIcon className="w-3 h-3 text-orange-400" />
              <span className="text-cyan-400">{recentEvents[0].participantName}</span>
              <span>{recentEvents[0].description || recentEvents[0].type}</span>
            </motion.div>
          )}

          {/* Time info */}
          {match.scheduledTime && !isLive && (
            <div className="flex items-center gap-2 mt-3 text-sm text-dark-400">
              <ClockIcon className="w-4 h-4" />
              <span>{formatDistanceToNow(match.scheduledTime, { addSuffix: true })}</span>
            </div>
          )}

          {/* Stream link indicator */}
          {isLive && match.streamUrl && (
            <div className="flex items-center gap-2 mt-2 text-xs text-purple-400">
              <TvIcon className="w-3 h-3" />
              <span>Stream available</span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
