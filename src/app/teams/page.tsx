'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { UserGroupIcon, PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { useAuthStore } from '@/store/authStore';
import { getTeams, getSchool } from '@/lib/firebase/db';
import { GAMES, type Team, type School } from '@/types';

export default function TeamsPage() {
  const { user } = useAuthStore();
  const [teams, setTeams] = useState<Team[]>([]);
  const [schools, setSchools] = useState<Record<string, School>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [gameFilter, setGameFilter] = useState<string>('all');

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const fetchedTeams = await getTeams();
        setTeams(fetchedTeams);

        // Fetch schools for teams
        const schoolIds = [...new Set(fetchedTeams.map((t) => t.schoolId))];
        const schoolPromises = schoolIds.map((id) => getSchool(id));
        const schoolResults = await Promise.all(schoolPromises);

        const schoolsMap: Record<string, School> = {};
        schoolResults.forEach((school) => {
          if (school) {
            schoolsMap[school.id] = school;
          }
        });
        setSchools(schoolsMap);
      } catch (error) {
        console.error('Error fetching teams:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeams();
  }, []);

  const filteredTeams = teams.filter((team) => {
    const matchesSearch =
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schools[team.schoolId]?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGame = gameFilter === 'all' || team.game === gameFilter;
    return matchesSearch && matchesGame;
  });

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <UserGroupIcon className="w-7 h-7 text-purple-400" />
            Teams
          </h1>
          <p className="text-dark-400 mt-1">Find or create your squad</p>
        </div>

        {user && (
          <Link href="/teams/create">
            <Button leftIcon={<PlusIcon className="w-5 h-5" />}>
              Create Team
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<MagnifyingGlassIcon className="w-5 h-5" />}
          />
        </div>
        <select
          value={gameFilter}
          onChange={(e) => setGameFilter(e.target.value)}
          className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
        >
          <option value="all">All Games</option>
          {GAMES.map((game) => (
            <option key={game.id} value={game.id}>
              {game.icon} {game.name}
            </option>
          ))}
        </select>
      </div>

      {/* Teams Grid */}
      {filteredTeams.length === 0 ? (
        <Card variant="glass" className="text-center py-12">
          <UserGroupIcon className="w-16 h-16 mx-auto mb-4 text-dark-600" />
          <p className="text-dark-400">
            {searchQuery || gameFilter !== 'all'
              ? 'No teams found matching your criteria'
              : 'No teams available yet'}
          </p>
          {user && (
            <Link href="/teams/create">
              <Button className="mt-4">Create the First Team</Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTeams.map((team, index) => {
            const school = schools[team.schoolId];
            const game = GAMES.find((g) => g.id === team.game);

            return (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/teams/${team.id}`}>
                  <Card variant="default" hover padding="none" className="overflow-hidden h-full">
                    {/* Banner */}
                    <div className="relative h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                      {team.logo ? (
                        <img
                          src={team.logo}
                          alt={team.name}
                          className="w-14 h-14 rounded-xl object-cover border-4 border-dark-800"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center border-4 border-dark-800">
                          <span className="text-xl font-bold text-white">
                            {team.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-white truncate">{team.name}</h3>
                        <Badge variant="info" size="sm">
                          {game?.icon} {game?.name || team.game}
                        </Badge>
                      </div>

                      {school && (
                        <p className="text-sm text-dark-400 mb-3 truncate">
                          🏫 {school.name}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-dark-400">
                          <UserGroupIcon className="w-4 h-4" />
                          <span>{team.members.length} members</span>
                        </div>
                        <div className="text-dark-400">
                          {team.stats.wins}W - {team.stats.losses}L
                        </div>
                      </div>
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

