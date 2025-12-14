'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  MapPinIcon,
  UserGroupIcon,
  TrophyIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { useAuthStore } from '@/store/authStore';
import { getSchool, getUser, getTeams, joinSchool } from '@/lib/firebase/db';
import type { School, User, Team } from '@/types';
import toast from 'react-hot-toast';

export default function SchoolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [school, setSchool] = useState<School | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  const schoolId = params.id as string;
  const isMember = user?.schoolId === schoolId;

  useEffect(() => {
    const fetchSchoolData = async () => {
      try {
        const [fetchedSchool, fetchedTeams] = await Promise.all([
          getSchool(schoolId),
          getTeams(schoolId),
        ]);

        if (!fetchedSchool) {
          router.push('/schools');
          return;
        }

        setSchool(fetchedSchool);
        setTeams(fetchedTeams);

        // Fetch some members (limit to 12 for display)
        const memberPromises = fetchedSchool.members.slice(0, 12).map((id) => getUser(id));
        const memberResults = await Promise.all(memberPromises);
        setMembers(memberResults.filter((m): m is User => m !== null));
      } catch (error) {
        console.error('Error fetching school:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchoolData();
  }, [schoolId, router]);

  const handleJoinSchool = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    setIsJoining(true);
    try {
      await joinSchool(user.id, schoolId);
      setUser({ ...user, schoolId });
      setSchool((prev) =>
        prev ? { ...prev, members: [...prev.members, user.id] } : null
      );
      setMembers((prev) => [...prev, user]);
      toast.success('Successfully joined the school!');
    } catch (error) {
      toast.error('Failed to join school');
      console.error(error);
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (!school) {
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
        <span>Back to Schools</span>
      </button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card variant="glass" className="mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Logo */}
            <div className="relative">
              {school.logo ? (
                <img
                  src={school.logo}
                  alt={school.name}
                  className="w-24 h-24 rounded-2xl object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">
                    {school.name.charAt(0)}
                  </span>
                </div>
              )}
              {school.isVerified && (
                <Badge variant="success" size="sm" className="absolute -top-2 -right-2">
                  ✓
                </Badge>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-white mb-2">{school.name}</h1>
              <div className="flex items-center justify-center sm:justify-start gap-1 text-dark-400 mb-3">
                <MapPinIcon className="w-4 h-4" />
                <span>{school.location}</span>
              </div>
              {school.description && (
                <p className="text-dark-300">{school.description}</p>
              )}
            </div>

            {/* Stats & Action */}
            <div className="flex flex-col items-center gap-4">
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{school.members.length}</p>
                  <p className="text-sm text-dark-500">Players</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{school.teams.length}</p>
                  <p className="text-sm text-dark-500">Teams</p>
                </div>
              </div>
              
              {!isMember && (
                <Button onClick={handleJoinSchool} isLoading={isJoining}>
                  Join School
                </Button>
              )}
              {isMember && (
                <Badge variant="success">Member</Badge>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Teams */}
        <Card variant="default">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <UserGroupIcon className="w-5 h-5 text-cyan-400" />
            Teams
          </h2>

          {teams.length === 0 ? (
            <p className="text-dark-400 text-center py-4">No teams yet</p>
          ) : (
            <div className="space-y-3">
              {teams.map((team) => (
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
                    <p className="text-sm text-dark-400">{team.members.length} members</p>
                  </div>
                  <Badge variant="info" size="sm">{team.game}</Badge>
                </Link>
              ))}
            </div>
          )}

          {isMember && (
            <Link href="/teams/create">
              <Button variant="secondary" fullWidth className="mt-4">
                Create Team
              </Button>
            </Link>
          )}
        </Card>

        {/* Members */}
        <Card variant="default">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrophyIcon className="w-5 h-5 text-cyber-yellow" />
            Top Players
          </h2>

          {members.length === 0 ? (
            <p className="text-dark-400 text-center py-4">No members yet</p>
          ) : (
            <div className="space-y-3">
              {members.map((member, index) => (
                <Link
                  key={member.id}
                  href={`/users/${member.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-dark-700/50 hover:bg-dark-700 transition-colors"
                >
                  <span className="w-6 text-center text-dark-500 font-medium">
                    #{index + 1}
                  </span>
                  <Avatar 
                    src={member.avatar} 
                    alt={member.displayName} 
                    size="sm"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-white hover:text-cyan-400 transition-colors">{member.displayName}</p>
                    <p className="text-sm text-dark-400">
                      {member.stats.wins}W - {member.stats.losses}L
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {school.members.length > 12 && (
            <p className="text-sm text-dark-500 text-center mt-4">
              +{school.members.length - 12} more players
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}

