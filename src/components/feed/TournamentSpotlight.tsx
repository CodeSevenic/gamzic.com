'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  TrophyIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  ClockIcon,
  GiftIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/solid';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { type Tournament } from '@/types';
import { format, formatDistanceToNow, isAfter } from 'date-fns';

interface TournamentSpotlightProps {
  tournament: Tournament;
  getGameInfo: (gameId: string) => { name: string; icon: string };
  variant?: 'default' | 'compact' | 'featured';
}

export function TournamentSpotlight({
  tournament,
  getGameInfo,
  variant = 'default',
}: TournamentSpotlightProps) {
  const game = getGameInfo(tournament.game);
  const isRegistrationOpen = tournament.status === 'registration';
  const isInProgress = tournament.status === 'in_progress';
  const spotsLeft = tournament.maxParticipants
    ? tournament.maxParticipants - tournament.participants.length
    : null;
  const registrationEnds = isAfter(tournament.registrationDeadline, new Date());

  if (variant === 'compact') {
    return (
      <Link href={`/tournaments/${tournament.id}`}>
        <Card variant="default" hover padding="sm" className="relative overflow-hidden">
          {/* Accent line */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 to-purple-500" />

          <div className="flex items-center gap-3 pl-2">
            <span className="text-2xl">{game.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm truncate">{tournament.title}</p>
              <div className="flex items-center gap-2 text-xs text-dark-400">
                <span>{game.name}</span>
                <span>•</span>
                <span>{tournament.participants.length} players</span>
              </div>
            </div>
            <Badge
              variant={isRegistrationOpen ? 'success' : isInProgress ? 'warning' : 'default'}
              size="sm"
            >
              {isRegistrationOpen ? 'Open' : isInProgress ? 'Live' : 'Soon'}
            </Badge>
          </div>
        </Card>
      </Link>
    );
  }

  if (variant === 'featured') {
    return (
      <Card variant="glass" padding="none" className="relative overflow-hidden">
        {/* Background Banner */}
        <div className="relative h-40 overflow-hidden">
          {tournament.bannerImage ? (
            <img
              src={tournament.bannerImage}
              alt={tournament.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <span className="text-7xl">{game.icon}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/60 to-transparent" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge
              variant={isRegistrationOpen ? 'success' : isInProgress ? 'warning' : 'info'}
              className="backdrop-blur-sm"
            >
              {isRegistrationOpen
                ? '🎯 Registration Open'
                : isInProgress
                ? '🔥 In Progress'
                : '📅 Upcoming'}
            </Badge>
            {tournament.prizeDescription && (
              <Badge variant="warning" className="backdrop-blur-sm">
                <GiftIcon className="w-3 h-3 mr-1" />
                Prize Pool
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">{tournament.title}</h3>
              <p className="text-sm text-dark-400 flex items-center gap-2">
                <span>{game.icon}</span>
                <span>{game.name}</span>
                <span>•</span>
                <span className="capitalize">{tournament.type}</span>
              </p>
            </div>
            <TrophyIcon className="w-8 h-8 text-yellow-400" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-dark-800/50 rounded-lg p-2 text-center">
              <UserGroupIcon className="w-4 h-4 mx-auto text-cyan-400 mb-1" />
              <p className="text-sm font-bold text-white">{tournament.participants.length}</p>
              <p className="text-[10px] text-dark-400">Players</p>
            </div>
            <div className="bg-dark-800/50 rounded-lg p-2 text-center">
              <CalendarDaysIcon className="w-4 h-4 mx-auto text-purple-400 mb-1" />
              <p className="text-sm font-bold text-white">
                {format(tournament.dateStart, 'MMM d')}
              </p>
              <p className="text-[10px] text-dark-400">Start Date</p>
            </div>
            <div className="bg-dark-800/50 rounded-lg p-2 text-center">
              <ClockIcon className="w-4 h-4 mx-auto text-green-400 mb-1" />
              <p className="text-sm font-bold text-white">{spotsLeft !== null ? spotsLeft : '∞'}</p>
              <p className="text-[10px] text-dark-400">Spots Left</p>
            </div>
          </div>

          {/* Prize Description */}
          {tournament.prizeDescription && (
            <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-sm text-yellow-400 flex items-center gap-2">
                <GiftIcon className="w-4 h-4" />
                <span className="font-medium">{tournament.prizeDescription}</span>
              </p>
            </div>
          )}

          {/* Registration Deadline */}
          {isRegistrationOpen && registrationEnds && (
            <p className="text-xs text-dark-400 mb-3 flex items-center gap-1">
              <ClockIcon className="w-3 h-3" />
              Registration ends{' '}
              {formatDistanceToNow(tournament.registrationDeadline, { addSuffix: true })}
            </p>
          )}

          {/* CTA */}
          <Link href={`/tournaments/${tournament.id}`}>
            <Button fullWidth variant={isRegistrationOpen ? 'primary' : 'secondary'}>
              {isRegistrationOpen ? 'Register Now' : 'View Details'}
              <ArrowRightIcon className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  // Default variant
  return (
    <Link href={`/tournaments/${tournament.id}`}>
      <Card variant="default" hover padding="none" className="relative overflow-hidden">
        {/* Mini Banner */}
        <div className="relative h-20 overflow-hidden">
          {tournament.bannerImage ? (
            <img
              src={tournament.bannerImage}
              alt={tournament.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
              <span className="text-4xl">{game.icon}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900 to-transparent" />

          {/* Status Badge */}
          <div className="absolute top-2 right-2">
            <Badge
              variant={isRegistrationOpen ? 'success' : isInProgress ? 'warning' : 'default'}
              size="sm"
            >
              {isRegistrationOpen ? 'Open' : isInProgress ? 'Live' : tournament.status}
            </Badge>
          </div>
        </div>

        <div className="p-3">
          <h4 className="font-semibold text-white text-sm mb-2 truncate">{tournament.title}</h4>

          <div className="flex items-center justify-between text-xs text-dark-400">
            <span className="flex items-center gap-1">
              <UserGroupIcon className="w-3 h-3" />
              {tournament.participants.length}
              {tournament.maxParticipants && ` / ${tournament.maxParticipants}`}
            </span>
            <span className="flex items-center gap-1">
              <CalendarDaysIcon className="w-3 h-3" />
              {format(tournament.dateStart, 'MMM d')}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

// Component for displaying multiple tournaments in a row
export function TournamentRow({
  tournaments,
  getGameInfo,
  title = 'Hot Tournaments',
}: {
  tournaments: Tournament[];
  getGameInfo: (gameId: string) => { name: string; icon: string };
  title?: string;
}) {
  if (tournaments.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-dark-300 uppercase tracking-wider flex items-center gap-2">
          <TrophyIcon className="w-4 h-4 text-yellow-400" />
          {title}
        </h3>
        <Link
          href="/tournaments"
          className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
        >
          View All
          <ArrowRightIcon className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {tournaments.slice(0, 3).map((tournament, index) => (
          <motion.div
            key={tournament.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <TournamentSpotlight
              tournament={tournament}
              getGameInfo={getGameInfo}
              variant="default"
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
