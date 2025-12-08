'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  CalendarDaysIcon,
  UserGroupIcon,
  ClockIcon,
  TrophyIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { useAuthStore } from '@/store/authStore';
import { getTournament, getUser, registerForTournament, unregisterFromTournament } from '@/lib/firebase/db';
import { GAMES, type Tournament, type User, type TournamentStatus } from '@/types';

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

export default function TournamentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);

  const tournamentId = params.id as string;
  const isRegistered = user && tournament?.participants.includes(user.id);
  const game = tournament ? GAMES.find((g) => g.id === tournament.game) : null;

  useEffect(() => {
    const fetchTournament = async () => {
      try {
        const fetchedTournament = await getTournament(tournamentId);
        if (!fetchedTournament) {
          router.push('/tournaments');
          return;
        }
        setTournament(fetchedTournament);

        // Fetch participants (for solo tournaments)
        if (fetchedTournament.type === 'solo') {
          const participantPromises = fetchedTournament.participants.map((id) => getUser(id));
          const participantResults = await Promise.all(participantPromises);
          setParticipants(participantResults.filter((p): p is User => p !== null));
        }
      } catch (error) {
        console.error('Error fetching tournament:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTournament();
  }, [tournamentId, router]);

  const handleRegister = async () => {
    if (!user || !tournament) return;

    setIsRegistering(true);
    try {
      await registerForTournament(tournament.id, user.id, user.id);
      setTournament((prev) =>
        prev ? { ...prev, participants: [...prev.participants, user.id] } : null
      );
      setParticipants((prev) => [...prev, user]);
      toast.success('Successfully registered for tournament!');
    } catch (error) {
      toast.error('Failed to register');
      console.error(error);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleUnregister = async () => {
    if (!user || !tournament) return;

    setIsRegistering(true);
    try {
      await unregisterFromTournament(tournament.id, user.id, user.id);
      setTournament((prev) =>
        prev ? { ...prev, participants: prev.participants.filter((id) => id !== user.id) } : null
      );
      setParticipants((prev) => prev.filter((p) => p.id !== user.id));
      toast.success('Successfully unregistered from tournament');
    } catch (error) {
      toast.error('Failed to unregister');
      console.error(error);
    } finally {
      setIsRegistering(false);
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (!tournament) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-6">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-dark-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        <span>Back to Tournaments</span>
      </button>

      {/* Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative h-48 md:h-64 rounded-2xl overflow-hidden mb-6"
      >
        {tournament.bannerImage ? (
          <img
            src={tournament.bannerImage}
            alt={tournament.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 flex items-center justify-center">
            <span className="text-8xl">{game?.icon || '🎮'}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <Badge variant={statusColors[tournament.status]} className="mb-2">
            {statusLabels[tournament.status]}
          </Badge>
          <h1 className="text-2xl md:text-3xl font-bold text-white">{tournament.title}</h1>
        </div>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Description */}
          {tournament.description && (
            <Card variant="default">
              <h2 className="text-lg font-semibold text-white mb-3">About</h2>
              <p className="text-dark-300 whitespace-pre-wrap">{tournament.description}</p>
            </Card>
          )}

          {/* Rules */}
          {tournament.rules && (
            <Card variant="default">
              <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5 text-cyan-400" />
                Rules
              </h2>
              <p className="text-dark-300 whitespace-pre-wrap">{tournament.rules}</p>
            </Card>
          )}

          {/* Participants */}
          <Card variant="default">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <UserGroupIcon className="w-5 h-5 text-cyan-400" />
              Participants ({tournament.participants.length}
              {tournament.maxParticipants && ` / ${tournament.maxParticipants}`})
            </h2>

            {participants.length === 0 ? (
              <p className="text-dark-400 text-center py-4">No participants yet</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-dark-700/50"
                  >
                    <Avatar src={participant.avatar} alt={participant.displayName} size="sm" />
                    <span className="text-sm text-white truncate">{participant.displayName}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tournament Info */}
          <Card variant="neon">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center text-2xl">
                  {game?.icon || '🎮'}
                </div>
                <div>
                  <p className="text-sm text-dark-400">Game</p>
                  <p className="font-medium text-white">{game?.name || tournament.game}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center">
                  <TrophyIcon className="w-5 h-5 text-cyber-yellow" />
                </div>
                <div>
                  <p className="text-sm text-dark-400">Format</p>
                  <p className="font-medium text-white">{tournament.type === 'solo' ? 'Solo' : 'Team'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center">
                  <CalendarDaysIcon className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm text-dark-400">Start Date</p>
                  <p className="font-medium text-white">
                    {format(tournament.dateStart, 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center">
                  <ClockIcon className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-dark-400">Registration Deadline</p>
                  <p className="font-medium text-white">
                    {format(tournament.registrationDeadline, 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>

              {tournament.prizeDescription && (
                <div className="pt-4 border-t border-dark-700">
                  <p className="text-sm text-dark-400 mb-1">Prize</p>
                  <p className="font-medium text-cyber-yellow">{tournament.prizeDescription}</p>
                </div>
              )}
            </div>

            {/* Registration Button */}
            {tournament.status === 'registration' && user && (
              <div className="mt-6">
                {isRegistered ? (
                  <Button
                    variant="danger"
                    fullWidth
                    onClick={handleUnregister}
                    isLoading={isRegistering}
                  >
                    Unregister
                  </Button>
                ) : (
                  <Button
                    fullWidth
                    onClick={handleRegister}
                    isLoading={isRegistering}
                    disabled={
                      tournament.maxParticipants
                        ? tournament.participants.length >= tournament.maxParticipants
                        : false
                    }
                  >
                    {tournament.maxParticipants &&
                    tournament.participants.length >= tournament.maxParticipants
                      ? 'Tournament Full'
                      : 'Register Now'}
                  </Button>
                )}
              </div>
            )}

            {!user && tournament.status === 'registration' && (
              <p className="mt-4 text-sm text-center text-dark-400">
                Sign in to register for this tournament
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

