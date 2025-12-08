'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  CalendarDaysIcon,
  UserGroupIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { getTournaments } from '@/lib/firebase/db';
import { GAMES, type Tournament, type TournamentStatus } from '@/types';

const statusColors: Record<TournamentStatus, 'success' | 'warning' | 'info' | 'danger' | 'default'> = {
  draft: 'default',
  registration: 'success',
  in_progress: 'warning',
  completed: 'info',
  cancelled: 'danger',
};

const statusLabels: Record<TournamentStatus, string> = {
  draft: 'Draft',
  registration: 'Open for Registration',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | TournamentStatus>('all');
  const [gameFilter, setGameFilter] = useState<string>('all');

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const status = filter !== 'all' ? filter : undefined;
        const game = gameFilter !== 'all' ? gameFilter : undefined;
        const { tournaments: fetchedTournaments } = await getTournaments(status, game);
        setTournaments(fetchedTournaments);
      } catch (error) {
        console.error('Error fetching tournaments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTournaments();
  }, [filter, gameFilter]);

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <TrophyIcon className="w-7 h-7 text-cyber-yellow" />
            Tournaments
          </h1>
          <p className="text-dark-400 mt-1">Compete and prove your skills</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | TournamentStatus)}
            className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Status</option>
            <option value="registration">Open Registration</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={gameFilter}
            onChange={(e) => setGameFilter(e.target.value)}
            className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Games</option>
            {GAMES.map((game) => (
              <option key={game.id} value={game.id}>
                {game.icon} {game.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tournament Grid */}
      {tournaments.length === 0 ? (
        <Card variant="glass" className="text-center py-12">
          <TrophyIcon className="w-16 h-16 mx-auto mb-4 text-dark-600" />
          <p className="text-dark-400">No tournaments found</p>
          <p className="text-sm text-dark-500 mt-1">Check back soon for upcoming competitions!</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((tournament, index) => {
            const game = GAMES.find((g) => g.id === tournament.game);

            return (
              <motion.div
                key={tournament.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/tournaments/${tournament.id}`}>
                  <Card variant="default" hover padding="none" className="overflow-hidden h-full">
                    {/* Banner */}
                    <div className="relative h-32 bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
                      {tournament.bannerImage ? (
                        <img
                          src={tournament.bannerImage}
                          alt={tournament.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-6xl">{game?.icon || '🎮'}</span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge variant={statusColors[tournament.status]}>
                          {statusLabels[tournament.status]}
                        </Badge>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-white line-clamp-1">
                          {tournament.title}
                        </h3>
                        <Badge variant="info" size="sm">
                          {tournament.type === 'solo' ? 'Solo' : 'Team'}
                        </Badge>
                      </div>

                      {game && (
                        <p className="text-sm text-dark-400 mb-3">
                          {game.icon} {game.name}
                        </p>
                      )}

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-dark-400">
                          <CalendarDaysIcon className="w-4 h-4" />
                          <span>{format(tournament.dateStart, 'MMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-dark-400">
                          <UserGroupIcon className="w-4 h-4" />
                          <span>
                            {tournament.participants.length}
                            {tournament.maxParticipants && ` / ${tournament.maxParticipants}`} participants
                          </span>
                        </div>
                      </div>

                      {tournament.status === 'registration' && (
                        <Button size="sm" fullWidth className="mt-4">
                          Register Now
                        </Button>
                      )}
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

