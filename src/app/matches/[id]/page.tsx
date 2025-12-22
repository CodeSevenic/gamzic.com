'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  CalendarDaysIcon,
  UserGroupIcon,
  UserIcon,
  PlayIcon,
  ArrowLeftIcon,
  ClockIcon,
  GlobeAltIcon,
  TrophyIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  GiftIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { useAuthStore } from '@/store/authStore';
import { subscribeToMatch, getUsersByIds, joinMatch, leaveMatch, getSponsoredContentByPlacement } from '@/lib/firebase/db';
import { type Match, type User, type MatchStatus, type MatchType, type SponsoredContent as SponsoredContentType, type AdDisplaySize } from '@/types';
import { useGames } from '@/hooks/useGames';
import { SponsoredContent } from '@/components/feed/SponsoredContent';
import { Timestamp } from 'firebase/firestore';

// Helper to convert Firestore Timestamp or Date to Date
const toDate = (value: Date | Timestamp | unknown): Date => {
  if (!value) return new Date();
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value !== null && 'seconds' in value) {
    return new Date((value as { seconds: number }).seconds * 1000);
  }
  return new Date(value as string | number);
};

const statusColors: Record<MatchStatus, 'success' | 'warning' | 'info' | 'danger' | 'default'> = {
  open: 'success',
  scheduled: 'info',
  in_progress: 'warning',
  completed: 'default',
  cancelled: 'danger',
};

const statusLabels: Record<MatchStatus, string> = {
  open: 'Open to Join',
  scheduled: 'Scheduled',
  in_progress: 'Live Now',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const matchTypeLabels: Record<MatchType, string> = {
  friendly: 'Friendly',
  scrimmage: 'Scrimmage',
  ranked: 'Ranked',
  casual: 'Casual',
};

export default function MatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { getGameInfo } = useGames();
  const [match, setMatch] = useState<Match | null>(null);
  const [participantUsers, setParticipantUsers] = useState<Record<string, User>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [sponsoredAds, setSponsoredAds] = useState<SponsoredContentType[]>([]);

  const matchId = params.id as string;
  const game = match ? getGameInfo(match.game) : null;
  const participantCount = match?.participants?.length || 0;
  const isFull = match ? participantCount >= match.maxParticipants : false;
  const isJoined = user && match?.participants?.some(p => p.oduserId === user.id);
  const canJoin = match?.status === 'open' && !isFull && !isJoined && user;

  // Subscribe to real-time match updates
  useEffect(() => {
    const unsubscribe = subscribeToMatch(matchId, async (updatedMatch) => {
      if (!updatedMatch) {
        router.push('/matches');
        return;
      }
      setMatch(updatedMatch);
      setIsLoading(false);

      // Fetch user details for ALL participants that have oduserId (works for both solo and team matches)
      if (updatedMatch.participants && updatedMatch.participants.length > 0) {
        const userIds = updatedMatch.participants
          .filter(p => p.oduserId) // Get all participants with a user ID
          .map(p => p.oduserId as string);
        
        if (userIds.length > 0) {
          try {
            const users = await getUsersByIds(userIds);
            setParticipantUsers(users);
          } catch (error) {
            console.error('Error fetching participant users:', error);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [matchId, router]);

  // Fetch ads for match pages
  useEffect(() => {
    const fetchAds = async () => {
      try {
        const ads = await getSponsoredContentByPlacement('match_page');
        setSponsoredAds(ads.slice(0, 2)); // Show max 2 ads
      } catch (error) {
        console.error('Error fetching ads:', error);
      }
    };
    fetchAds();
  }, []);

  const handleJoin = async () => {
    if (!user || !match) return;

    setIsJoining(true);
    try {
      await joinMatch(match.id, {
        oduserId: user.id,
        name: user.displayName,
        joinedAt: new Date(),
      });
      toast.success('Successfully joined the match!');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to join match';
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!user || !match) return;

    setIsJoining(true);
    try {
      await leaveMatch(match.id, user.id);
      toast.success('Left the match');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to leave match';
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (!match) {
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
        <span>Back to Matches</span>
      </button>

      {/* Live indicator for in-progress matches */}
      {match.status === 'in_progress' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-3"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <span className="text-red-400 font-medium">This match is LIVE! Scores update in real-time.</span>
        </motion.div>
      )}

      {/* Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative h-48 md:h-64 rounded-2xl overflow-hidden mb-6 ${match.status === 'in_progress' ? 'ring-2 ring-red-500/50' : ''}`}
      >
        {match.bannerImage ? (
          <img
            src={match.bannerImage}
            alt={match.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
            <span className="text-8xl">{game?.icon || '🎮'}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={statusColors[match.status]}>
              {match.status === 'in_progress' && (
                <span className="mr-1 inline-block w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              )}
              {statusLabels[match.status]}
            </Badge>
            <Badge variant="default">
              {matchTypeLabels[match.type]}
            </Badge>
            {match.prizeDescription && (
              <Badge variant="warning">
                <GiftIcon className="w-3 h-3 mr-1" />
                Prize
              </Badge>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">{match.title}</h1>
        </div>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Live Scoreboard - Show prominently for in-progress or completed matches */}
          {(match.status === 'in_progress' || match.status === 'completed') && match.participants && match.participants.length > 0 && (
            <Card variant="glass" className={match.status === 'in_progress' ? 'border border-red-500/30 bg-gradient-to-br from-red-500/5 to-orange-500/5' : ''}>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrophyIcon className={`w-5 h-5 ${match.status === 'in_progress' ? 'text-red-400' : 'text-yellow-400'}`} />
                {match.status === 'in_progress' ? 'Live Scoreboard' : 'Final Results'}
                {match.status === 'in_progress' && (
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 animate-pulse">
                    LIVE
                  </span>
                )}
              </h2>
              
              <div className="grid gap-4 sm:grid-cols-2">
                {match.participants.map((participant) => {
                  const participantId = participant.oduserId || participant.teamId || '';
                  const participantUser = participantUsers[participantId];
                  const score = match.scores?.[participantId] ?? 0;
                  const isWinner = match.winnerId === participantId;
                  
                  return (
                    <motion.div
                      key={participantId}
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      className={`p-4 rounded-xl ${
                        isWinner 
                          ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/50' 
                          : 'bg-dark-700/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        {match.isTeamMatch ? (
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                            {participant.name.charAt(0)}
                          </div>
                        ) : participantUser ? (
                          <Link href={`/users/${participantId}`}>
                            <Avatar 
                              src={participantUser.avatar} 
                              alt={participantUser.displayName} 
                              size="lg"
                              className="cursor-pointer hover:ring-2 hover:ring-cyan-500 transition-all"
                            />
                          </Link>
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-dark-600 flex items-center justify-center text-white font-bold">
                            {participant.name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1">
                          {participantUser && !match.isTeamMatch ? (
                            <Link 
                              href={`/users/${participantId}`}
                              className="font-semibold text-white hover:text-cyan-400 transition-colors"
                            >
                              {participantUser.displayName}
                              {isWinner && ' 🏆'}
                            </Link>
                          ) : (
                            <span className="font-semibold text-white">
                              {participant.name}
                              {isWinner && ' 🏆'}
                            </span>
                          )}
                          {isWinner && (
                            <p className="text-xs text-yellow-400">Winner!</p>
                          )}
                        </div>
                      </div>
                      <div className={`text-4xl font-bold text-center ${isWinner ? 'text-yellow-400' : 'text-white'}`}>
                        {score}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Description */}
          {match.description && (
            <Card variant="default">
              <h2 className="text-lg font-semibold text-white mb-3">About</h2>
              <p className="text-dark-300 whitespace-pre-wrap">{match.description}</p>
            </Card>
          )}

          {/* Rules */}
          {match.rules && (
            <Card variant="default">
              <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5 text-cyan-400" />
                Rules
              </h2>
              <p className="text-dark-300 whitespace-pre-wrap">{match.rules}</p>
            </Card>
          )}

          {/* Prize */}
          {match.prizeDescription && (
            <Card variant="glass" className="border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-orange-500/10">
              <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <GiftIcon className="w-5 h-5 text-yellow-400" />
                Prize
              </h2>
              <p className="text-yellow-200 font-medium text-lg">{match.prizeDescription}</p>
            </Card>
          )}

          {/* Participants */}
          <Card variant="default">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              {match.isTeamMatch ? (
                <UserGroupIcon className="w-5 h-5 text-cyan-400" />
              ) : (
                <UserIcon className="w-5 h-5 text-cyan-400" />
              )}
              Participants ({participantCount} / {match.maxParticipants})
            </h2>

            {participantCount === 0 ? (
              <div className="text-center py-8">
                <p className="text-dark-400 mb-2">No participants yet</p>
                <p className="text-sm text-dark-500">Be the first to join this match!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {match.participants?.map((participant, idx) => {
                  const participantId = participant.oduserId || participant.teamId || '';
                  const participantUser = participant.oduserId ? participantUsers[participant.oduserId] : null;
                  const isWinner = match.winnerId === participantId;
                  const hasUserProfile = !!participantUser;
                  
                  const content = (
                    <div className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      isWinner 
                        ? 'bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-500/20' 
                        : 'bg-dark-700/50 hover:bg-dark-700'
                    } ${hasUserProfile ? 'cursor-pointer' : ''}`}>
                      {/* Avatar - show user avatar if available, otherwise show initial */}
                      {participantUser ? (
                        <Avatar 
                          src={participantUser.avatar} 
                          alt={participantUser.displayName} 
                          size="md"
                        />
                      ) : (
                        <div className={`w-10 h-10 ${match.isTeamMatch ? 'rounded-lg' : 'rounded-full'} bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold`}>
                          {participant.name.charAt(0)}
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${isWinner ? 'text-yellow-400' : 'text-white'} ${hasUserProfile ? 'hover:text-cyan-400' : ''}`}>
                          {participantUser?.displayName || participant.name}
                          {isWinner && ' 🏆'}
                        </p>
                        <p className="text-xs text-dark-400">
                          {match.isTeamMatch && !participantUser && 'Team • '}
                          Joined {format(toDate(participant.joinedAt), 'MMM d, h:mm a')}
                        </p>
                        {participantUser && (
                          <p className="text-xs text-dark-500">
                            {participantUser.stats?.wins || 0} wins • {participantUser.stats?.matches || 0} matches
                          </p>
                        )}
                      </div>
                      
                      {match.scores?.[participantId] !== undefined && (
                        <div className="text-right">
                          <p className="text-xs text-dark-400">Score</p>
                          <p className={`text-lg font-bold ${isWinner ? 'text-yellow-400' : 'text-white'}`}>
                            {match.scores[participantId]}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                  
                  // Wrap in Link only if we have a user profile
                  return hasUserProfile ? (
                    <Link
                      key={participantId || idx}
                      href={`/users/${participant.oduserId}`}
                    >
                      {content}
                    </Link>
                  ) : (
                    <div key={participantId || idx}>
                      {content}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Match Info */}
          <Card variant="neon">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center text-2xl">
                  {game?.icon || '🎮'}
                </div>
                <div>
                  <p className="text-sm text-dark-400">Game</p>
                  <p className="font-medium text-white">{game?.name || match.game}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center">
                  <PlayIcon className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-dark-400">Match Type</p>
                  <p className="font-medium text-white">{matchTypeLabels[match.type]}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center">
                  {match.isTeamMatch ? (
                    <UserGroupIcon className="w-5 h-5 text-purple-400" />
                  ) : (
                    <UserIcon className="w-5 h-5 text-purple-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-dark-400">Format</p>
                  <p className="font-medium text-white">
                    {match.isTeamMatch ? 'Team Match' : 'Solo Match'} ({match.maxParticipants} {match.isTeamMatch ? 'teams' : 'players'})
                  </p>
                </div>
              </div>

              {match.scheduledTime && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center">
                    <CalendarDaysIcon className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm text-dark-400">Match Time</p>
                    <p className="font-medium text-white">
                      {format(match.scheduledTime, 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
              )}

              {match.registrationDeadline && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center">
                    <ClockIcon className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm text-dark-400">Registration Deadline</p>
                    <p className="font-medium text-white">
                      {format(match.registrationDeadline, 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
              )}

              {match.isPublic && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center">
                    <GlobeAltIcon className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-dark-400">Visibility</p>
                    <p className="font-medium text-white">Public Match</p>
                  </div>
                </div>
              )}

              {match.streamUrl && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center">
                    <VideoCameraIcon className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm text-dark-400">Watch Live</p>
                    <a
                      href={match.streamUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-cyan-400 hover:underline"
                    >
                      View Stream
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Join/Leave Button */}
            <div className="mt-6">
              {canJoin && (
                <Button
                  fullWidth
                  onClick={handleJoin}
                  isLoading={isJoining}
                >
                  Join Match
                </Button>
              )}

              {isJoined && match.status === 'open' && (
                <Button
                  variant="danger"
                  fullWidth
                  onClick={handleLeave}
                  isLoading={isJoining}
                >
                  Leave Match
                </Button>
              )}

              {isFull && !isJoined && match.status !== 'completed' && (
                <div className="text-center py-2">
                  <p className="text-sm text-dark-400">Match is full</p>
                </div>
              )}

              {!user && match.status === 'open' && (
                <p className="text-sm text-center text-dark-400">
                  Sign in to join this match
                </p>
              )}

              {isJoined && match.status !== 'open' && (
                <div className="flex items-center justify-center gap-2 py-2">
                  <ClockIcon className="w-4 h-4 text-cyan-400" />
                  <p className="text-sm text-cyan-400">You&apos;re in this match!</p>
                </div>
              )}
            </div>
          </Card>

          {/* Sponsored Content */}
          {sponsoredAds.length > 0 && (
            <div className="space-y-3 mt-2">
              {sponsoredAds.map((ad) => (
                <SponsoredContent
                  key={ad.id}
                  item={ad}
                  variant="sidebar"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
