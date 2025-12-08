'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  PencilIcon,
  Cog6ToothIcon,
  TrophyIcon,
  UserGroupIcon,
  ArrowRightStartOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { useAuthStore } from '@/store/authStore';
import { signOut } from '@/lib/firebase/auth';
import { getSchool, getTeam, getTournament } from '@/lib/firebase/db';
import { GAMES, type School, type Team, type Tournament } from '@/types';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, reset } = useAuthStore();
  const [school, setSchool] = useState<School | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }

    const fetchUserData = async () => {
      if (!user) return;

      try {
        // Fetch school
        if (user.schoolId) {
          const fetchedSchool = await getSchool(user.schoolId);
          setSchool(fetchedSchool);
        }

        // Fetch teams
        if (user.teamsJoined.length > 0) {
          const teamPromises = user.teamsJoined.map((id) => getTeam(id));
          const teamResults = await Promise.all(teamPromises);
          setTeams(teamResults.filter((t): t is Team => t !== null));
        }

        // Fetch tournaments
        if (user.tournamentsJoined.length > 0) {
          const tournamentPromises = user.tournamentsJoined.slice(0, 5).map((id) => getTournament(id));
          const tournamentResults = await Promise.all(tournamentPromises);
          setTournaments(tournamentResults.filter((t): t is Tournament => t !== null));
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [user, loading, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      reset();
      router.push('/auth/login');
    } catch (error) {
      toast.error('Failed to sign out');
      console.error(error);
    }
  };

  if (loading || isLoading) {
    return <PageLoader />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-6">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card variant="glass" className="mb-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <Avatar src={user.avatar} alt={user.displayName} size="xl" />

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <h1 className="text-2xl font-bold text-white">{user.displayName}</h1>
                {user.role === 'admin' && (
                  <Badge variant="purple">Admin</Badge>
                )}
              </div>
              <p className="text-dark-400 mb-2">{user.fullName}</p>
              {school && (
                <Link href={`/schools/${school.id}`} className="text-cyan-400 hover:underline">
                  🏫 {school.name}
                </Link>
              )}
              {user.bio && (
                <p className="text-dark-300 mt-3">{user.bio}</p>
              )}
            </div>

            {/* Stats */}
            <div className="flex gap-6 py-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{user.stats.wins}</p>
                <p className="text-sm text-dark-500">Wins</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{user.stats.losses}</p>
                <p className="text-sm text-dark-500">Losses</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{user.stats.tournamentWins}</p>
                <p className="text-sm text-dark-500">🏆</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Link href="/settings">
                <Button variant="secondary" size="sm" leftIcon={<PencilIcon className="w-4 h-4" />}>
                  Edit Profile
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                leftIcon={<ArrowRightStartOnRectangleIcon className="w-4 h-4" />}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Game IDs */}
        <Card variant="default">
          <h2 className="text-lg font-semibold text-white mb-4">Game IDs</h2>
          
          {Object.keys(user.gameTags).length === 0 ? (
            <p className="text-dark-400 text-center py-4">No game IDs added yet</p>
          ) : (
            <div className="space-y-3">
              {GAMES.filter((game) => user.gameTags[game.id]).map((game) => (
                <div
                  key={game.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-dark-700/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{game.icon}</span>
                    <span className="text-white">{game.name}</span>
                  </div>
                  <span className="text-cyan-400 font-mono">{user.gameTags[game.id]}</span>
                </div>
              ))}
            </div>
          )}

          <Link href="/settings">
            <Button variant="secondary" fullWidth className="mt-4" size="sm">
              Manage Game IDs
            </Button>
          </Link>
        </Card>

        {/* Teams */}
        <Card variant="default">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <UserGroupIcon className="w-5 h-5 text-purple-400" />
            My Teams
          </h2>

          {teams.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-dark-400 mb-3">Not part of any team yet</p>
              <Link href="/teams">
                <Button size="sm">Browse Teams</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {teams.map((team) => {
                const game = GAMES.find((g) => g.id === team.game);
                
                return (
                  <Link
                    key={team.id}
                    href={`/teams/${team.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-dark-700/50 hover:bg-dark-700 transition-colors"
                  >
                    {team.logo ? (
                      <img
                        src={team.logo}
                        alt={team.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                        <span className="font-bold text-white">{team.name.charAt(0)}</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-white">{team.name}</p>
                      <p className="text-sm text-dark-400">
                        {game?.icon} {game?.name}
                      </p>
                    </div>
                    {team.captainId === user.id && (
                      <Badge variant="warning" size="sm">Captain</Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        {/* Tournaments */}
        <Card variant="default" className="md:col-span-2">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrophyIcon className="w-5 h-5 text-cyber-yellow" />
            Tournament History
          </h2>

          {tournaments.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-dark-400 mb-3">No tournaments joined yet</p>
              <Link href="/tournaments">
                <Button size="sm">Browse Tournaments</Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {tournaments.map((tournament) => {
                const game = GAMES.find((g) => g.id === tournament.game);
                
                return (
                  <Link
                    key={tournament.id}
                    href={`/tournaments/${tournament.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-dark-700/50 hover:bg-dark-700 transition-colors"
                  >
                    <span className="text-2xl">{game?.icon || '🎮'}</span>
                    <div className="flex-1">
                      <p className="font-medium text-white line-clamp-1">{tournament.title}</p>
                      <p className="text-sm text-dark-400">{game?.name}</p>
                    </div>
                    <Badge
                      variant={tournament.status === 'completed' ? 'info' : 'warning'}
                      size="sm"
                    >
                      {tournament.status}
                    </Badge>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

