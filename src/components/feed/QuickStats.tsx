'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  TrophyIcon,
  FireIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  BoltIcon,
  UserGroupIcon,
} from '@heroicons/react/24/solid';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { type User, type Game } from '@/types';

interface QuickStatsProps {
  variant: 'leaderboard' | 'trending' | 'activity';
  topPlayers?: User[];
  games?: Game[];
  stats?: {
    totalMatches: number;
    activeTournaments: number;
    totalUsers: number;
    matchesThisWeek: number;
  };
}

export function QuickStats({ variant, topPlayers = [], games = [], stats }: QuickStatsProps) {
  if (variant === 'leaderboard') {
    if (topPlayers.length === 0) {
      return (
        <Card variant="glass" padding="sm" className="overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <TrophyIcon className="w-4 h-4 text-yellow-400" />
              Top Players
            </h4>
          </div>
          <div className="text-center py-4">
            <p className="text-sm text-dark-400">No leaderboard data yet</p>
            <p className="text-xs text-dark-500">Play matches to climb the ranks!</p>
          </div>
        </Card>
      );
    }

    return (
      <Card variant="glass" padding="sm" className="overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <TrophyIcon className="w-4 h-4 text-yellow-400" />
            Top Players
          </h4>
        </div>
        <div className="space-y-2">
          {topPlayers.slice(0, 5).map((user, index) => (
            <Link
              key={user.id}
              href={`/users/${user.id}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-700/50 transition-colors group"
            >
              <span
                className={`
                  w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                  ${
                    index === 0
                      ? 'bg-yellow-500 text-black'
                      : index === 1
                      ? 'bg-gray-400 text-black'
                      : index === 2
                      ? 'bg-amber-600 text-white'
                      : 'bg-dark-700 text-dark-300'
                  }
                `}
              >
                {index + 1}
              </span>
              <Avatar src={user.avatar} alt={user.displayName} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate group-hover:text-cyan-400 transition-colors">
                  {user.displayName}
                </p>
                <p className="text-xs text-dark-400">{user.stats.wins} wins</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-green-400">{user.stats.wins}</p>
                <p className="text-[10px] text-dark-500">wins</p>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    );
  }

  if (variant === 'trending') {
    if (games.length === 0) {
      return (
        <Card variant="glass" padding="sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <FireIcon className="w-4 h-4 text-orange-400" />
              Active Games
            </h4>
          </div>
          <div className="text-center py-4">
            <p className="text-sm text-dark-400">No game data available</p>
          </div>
        </Card>
      );
    }

    return (
      <Card variant="glass" padding="sm">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <FireIcon className="w-4 h-4 text-orange-400" />
            Active Games
          </h4>
        </div>
        <div className="space-y-2">
          {games.slice(0, 4).map((game) => (
            <div key={game.id} className="flex items-center gap-3 p-2 rounded-lg bg-dark-800/50">
              <span className="text-xl">{game.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{game.name}</p>
              </div>
              {game.isActive && (
                <div className="flex items-center gap-1 text-xs font-medium text-green-400">
                  <ArrowTrendingUpIcon className="w-3 h-3" />
                  <span>Active</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    );
  }

  // Activity/Platform stats
  if (!stats) {
    return (
      <Card variant="glass" padding="sm">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <ChartBarIcon className="w-4 h-4 text-cyan-400" />
            Platform Activity
          </h4>
        </div>
        <div className="text-center py-4">
          <p className="text-sm text-dark-400">Loading stats...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="glass" padding="sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-white flex items-center gap-2">
          <ChartBarIcon className="w-4 h-4 text-cyan-400" />
          Platform Activity
        </h4>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
          <BoltIcon className="w-5 h-5 text-green-400 mb-1" />
          <p className="text-lg font-bold text-white">{stats.totalUsers}</p>
          <p className="text-xs text-dark-400">Total Users</p>
        </div>
        <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
          <TrophyIcon className="w-5 h-5 text-purple-400 mb-1" />
          <p className="text-lg font-bold text-white">{stats.activeTournaments}</p>
          <p className="text-xs text-dark-400">Active Tournaments</p>
        </div>
        <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
          <UserGroupIcon className="w-5 h-5 text-cyan-400 mb-1" />
          <p className="text-lg font-bold text-white">{stats.matchesThisWeek}</p>
          <p className="text-xs text-dark-400">Matches This Week</p>
        </div>
        <div className="p-3 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20">
          <FireIcon className="w-5 h-5 text-orange-400 mb-1" />
          <p className="text-lg font-bold text-white">{stats.totalMatches.toLocaleString()}</p>
          <p className="text-xs text-dark-400">Total Matches</p>
        </div>
      </div>
    </Card>
  );
}

// Compact widget for sidebar or mobile
export function QuickStatsWidget({
  stats,
}: {
  stats?: { totalUsers: number; activeTournaments: number; matchesThisWeek: number };
}) {
  if (!stats) return null;

  return (
    <div className="flex items-center gap-4 p-3 bg-dark-800/50 rounded-xl border border-dark-700/50">
      <div className="text-center">
        <p className="text-lg font-bold text-green-400">{stats.totalUsers}</p>
        <p className="text-[10px] text-dark-400">Users</p>
      </div>
      <div className="w-px h-8 bg-dark-700" />
      <div className="text-center">
        <p className="text-lg font-bold text-purple-400">{stats.activeTournaments}</p>
        <p className="text-[10px] text-dark-400">Tournaments</p>
      </div>
      <div className="w-px h-8 bg-dark-700" />
      <div className="text-center">
        <p className="text-lg font-bold text-cyan-400">{stats.matchesThisWeek}</p>
        <p className="text-[10px] text-dark-400">This Week</p>
      </div>
    </div>
  );
}
