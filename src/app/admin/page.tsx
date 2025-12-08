'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  UserGroupIcon,
  DocumentTextIcon,
  TrophyIcon,
  AcademicCapIcon,
  CommandLineIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { isFirebaseConfigured, db } from '@/lib/firebase/config';
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/types';

interface Stats {
  users: number;
  posts: number;
  tournaments: number;
  schools: number;
}

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats>({
    users: 0,
    posts: 0,
    tournaments: 0,
    schools: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!isFirebaseConfigured || !db) {
        setIsLoading(false);
        return;
      }

      try {
        const { collection, getCountFromServer } = await import('firebase/firestore');
        
        const [usersCount, postsCount, tournamentsCount, schoolsCount] = await Promise.all([
          getCountFromServer(collection(db, 'users')),
          getCountFromServer(collection(db, 'posts')),
          getCountFromServer(collection(db, 'tournaments')),
          getCountFromServer(collection(db, 'schools')),
        ]);

        setStats({
          users: usersCount.data().count,
          posts: postsCount.data().count,
          tournaments: tournamentsCount.data().count,
          schools: schoolsCount.data().count,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      name: 'Total Users',
      value: stats.users,
      icon: UserGroupIcon,
      color: 'from-orange-500 to-red-600',
      iconBg: 'bg-orange-500/20',
    },
    {
      name: 'Posts',
      value: stats.posts,
      icon: DocumentTextIcon,
      color: 'from-blue-500 to-cyan-600',
      iconBg: 'bg-blue-500/20',
    },
    {
      name: 'Tournaments',
      value: stats.tournaments,
      icon: TrophyIcon,
      color: 'from-yellow-500 to-orange-600',
      iconBg: 'bg-yellow-500/20',
    },
    {
      name: 'Schools',
      value: stats.schools,
      icon: AcademicCapIcon,
      color: 'from-green-500 to-teal-600',
      iconBg: 'bg-green-500/20',
    },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
            <CommandLineIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Command Center</h1>
            <p className="text-gray-500 text-sm">
              Welcome back, <span className="text-orange-400">{user?.displayName}</span>
            </p>
          </div>
        </div>
      </div>

      {!isFirebaseConfigured && (
        <Card className="mb-6 bg-yellow-500/10 border-yellow-500/30">
          <div className="flex items-start gap-4">
            <span className="text-3xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-yellow-400 mb-1">Firebase Not Configured</h3>
              <p className="text-gray-400 text-sm">
                Copy <code className="bg-gray-800 px-1 rounded">env.local.example</code> to{' '}
                <code className="bg-gray-800 px-1 rounded">.env.local</code> and add your Firebase credentials.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="relative overflow-hidden bg-gray-900 border-gray-800">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${stat.iconBg}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{stat.name}</p>
                  <p className="text-2xl font-bold text-white font-mono">
                    {isLoading ? '...' : stat.value.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color}`} />
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {hasPermission(user?.role || 'player', 'admin') && (
          <Card className="text-center bg-gray-900 border-gray-800 hover:border-yellow-500/50 transition-colors">
            <TrophyIcon className="w-12 h-12 mx-auto mb-3 text-yellow-400" />
            <h3 className="font-semibold text-white mb-2">Create Tournament</h3>
            <p className="text-sm text-gray-500 mb-4">
              Set up a new tournament for players to compete in
            </p>
            <Link
              href="/admin/tournaments/create"
              className="inline-block px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-medium hover:from-yellow-400 hover:to-orange-500 transition-all"
            >
              Create Tournament
            </Link>
          </Card>
        )}

        <Card className="text-center bg-gray-900 border-gray-800 hover:border-blue-500/50 transition-colors">
          <DocumentTextIcon className="w-12 h-12 mx-auto mb-3 text-blue-400" />
          <h3 className="font-semibold text-white mb-2">Create Post</h3>
          <p className="text-sm text-gray-500 mb-4">
            Share announcements and updates with the community
          </p>
          <Link
            href="/admin/posts/create"
            className="inline-block px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-medium hover:from-blue-400 hover:to-cyan-500 transition-all"
          >
            Create Post
          </Link>
        </Card>

        {hasPermission(user?.role || 'player', 'admin') && (
          <Card className="text-center bg-gray-900 border-gray-800 hover:border-green-500/50 transition-colors">
            <AcademicCapIcon className="w-12 h-12 mx-auto mb-3 text-green-400" />
            <h3 className="font-semibold text-white mb-2">Add School</h3>
            <p className="text-sm text-gray-500 mb-4">
              Register a new school to the platform
            </p>
            <Link
              href="/admin/schools/create"
              className="inline-block px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-teal-600 text-white font-medium hover:from-green-400 hover:to-teal-500 transition-all"
            >
              Add School
            </Link>
          </Card>
        )}

        {hasPermission(user?.role || 'player', 'admin') && (
          <Card className="text-center bg-gray-900 border-gray-800 hover:border-orange-500/50 transition-colors">
            <UserGroupIcon className="w-12 h-12 mx-auto mb-3 text-orange-400" />
            <h3 className="font-semibold text-white mb-2">Manage Users</h3>
            <p className="text-sm text-gray-500 mb-4">
              Update roles, permissions, and manage user accounts
            </p>
            <Link
              href="/admin/users"
              className="inline-block px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 text-white font-medium hover:from-orange-400 hover:to-red-500 transition-all"
            >
              Manage Users
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
