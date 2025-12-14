'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  UserMinusIcon,
  PlayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  UserGroupIcon,
  GlobeAltIcon,
  VideoCameraIcon,
  TrophyIcon,
  CalendarDaysIcon,
  PlusIcon,
  MinusIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { subscribeToMatch, updateMatch, deleteMatch, getUsersByIds, getGames, updateMatchScores } from '@/lib/firebase/db';
import { GAMES, type Match, type MatchStatus, type Game, type User, type MatchParticipant } from '@/types';
import { Timestamp } from 'firebase/firestore';

const statusColors: Record<MatchStatus, 'success' | 'warning' | 'info' | 'danger' | 'default'> = {
  open: 'info',
  scheduled: 'default',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'danger',
};

const statusLabels: Record<MatchStatus, string> = {
  open: 'Open for Join',
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const matchTypeLabels: Record<string, string> = {
  friendly: 'Friendly',
  scrimmage: 'Scrimmage',
  ranked: 'Ranked',
  casual: 'Casual',
};

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

export default function MatchDetailPage() {
  const router = useRouter();
  const params = useParams();
  const matchId = params.id as string;

  const [match, setMatch] = useState<Match | null>(null);
  const [participantUsers, setParticipantUsers] = useState<Record<string, User>>({});
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [removeParticipantModal, setRemoveParticipantModal] = useState<MatchParticipant | null>(null);
  const [scoresModalOpen, setScoresModalOpen] = useState(false);
  
  // Loading states
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isSavingScores, setIsSavingScores] = useState(false);
  const [updatingScoreFor, setUpdatingScoreFor] = useState<string | null>(null);
  
  // Scores
  const [scores, setScores] = useState<Record<string, string>>({});
  const [winnerId, setWinnerId] = useState('');

  // Subscribe to real-time match updates
  useEffect(() => {
    const fetchGames = async () => {
      const fetchedGames = await getGames(false);
      setGames(fetchedGames);
    };
    fetchGames();

    const unsubscribe = subscribeToMatch(matchId, async (updatedMatch) => {
      if (!updatedMatch) {
        toast.error('Match not found');
        router.push('/admin/matches');
        return;
      }

      setMatch(updatedMatch);
      setWinnerId(updatedMatch.winnerId || '');
      setIsLoading(false);

      // Initialize/update scores
      if (updatedMatch.scores) {
        const scoreStrings: Record<string, string> = {};
        Object.entries(updatedMatch.scores).forEach(([key, value]) => {
          scoreStrings[key] = value.toString();
        });
        setScores(scoreStrings);
      } else if (updatedMatch.participants) {
        const initialScores: Record<string, string> = {};
        updatedMatch.participants.forEach((p) => {
          const id = p.oduserId || p.teamId || '';
          if (id) initialScores[id] = '0';
        });
        setScores((prev) => ({ ...initialScores, ...prev }));
      }

      // Fetch user details for ALL participants that have oduserId (works for both solo and team matches)
      if (updatedMatch.participants) {
        const userIds = updatedMatch.participants
          .filter((p) => p.oduserId)
          .map((p) => p.oduserId as string);
        
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

  const getGameInfo = (gameId: string) => {
    const dynamicGame = games.find((g) => g.id === gameId);
    if (dynamicGame) return { name: dynamicGame.name, icon: dynamicGame.icon };
    const defaultGame = GAMES.find((g) => g.id === gameId);
    if (defaultGame) return { name: defaultGame.name, icon: defaultGame.icon };
    return { name: gameId, icon: '🎮' };
  };

  const getParticipantId = (p: MatchParticipant) => p.oduserId || p.teamId || '';

  const handleDelete = async () => {
    if (!match) return;
    setIsDeleting(true);
    try {
      await deleteMatch(match.id);
      toast.success('Match deleted');
      router.push('/admin/matches');
    } catch (error) {
      toast.error('Failed to delete match');
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRemoveParticipant = async () => {
    if (!match || !removeParticipantModal) return;
    setIsRemoving(true);
    try {
      const updatedParticipants = match.participants.filter(
        (p) => getParticipantId(p) !== getParticipantId(removeParticipantModal)
      );
      
      await updateMatch(match.id, { 
        participants: updatedParticipants,
        status: 'open',
      });
      
      const participantId = getParticipantId(removeParticipantModal);
      setScores((prev) => {
        const newScores = { ...prev };
        delete newScores[participantId];
        return newScores;
      });
      
      toast.success(`${removeParticipantModal.name} removed from match`);
      setRemoveParticipantModal(null);
    } catch (error) {
      toast.error('Failed to remove participant');
      console.error(error);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleStatusChange = async (newStatus: MatchStatus) => {
    if (!match) return;
    setIsUpdatingStatus(true);
    try {
      const updateData: Partial<Match> = { status: newStatus };
      if (newStatus === 'completed') {
        updateData.completedAt = new Date();
      }
      await updateMatch(match.id, updateData);
      toast.success(`Match status updated to ${statusLabels[newStatus]}`);
    } catch (error) {
      toast.error('Failed to update status');
      console.error(error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Quick score increment/decrement for live matches
  const handleQuickScore = async (participantId: string, delta: number) => {
    if (!match) return;
    setUpdatingScoreFor(participantId);
    try {
      const currentScore = parseInt(scores[participantId] || '0');
      const newScore = Math.max(0, currentScore + delta);
      
      const numericScores: Record<string, number> = {};
      Object.entries(scores).forEach(([key, value]) => {
        numericScores[key] = key === participantId ? newScore : (parseInt(value) || 0);
      });
      
      await updateMatchScores(match.id, numericScores);
      setScores((prev) => ({ ...prev, [participantId]: newScore.toString() }));
    } catch (error) {
      toast.error('Failed to update score');
      console.error(error);
    } finally {
      setUpdatingScoreFor(null);
    }
  };

  const handleSaveScores = async () => {
    if (!match) return;
    setIsSavingScores(true);
    try {
      const numericScores: Record<string, number> = {};
      Object.entries(scores).forEach(([key, value]) => {
        numericScores[key] = parseInt(value) || 0;
      });
      
      await updateMatchScores(
        match.id, 
        numericScores, 
        match.status === 'completed' ? winnerId : undefined
      );
      
      toast.success('Scores updated');
      setScoresModalOpen(false);
    } catch (error) {
      toast.error('Failed to update scores');
      console.error(error);
    } finally {
      setIsSavingScores(false);
    }
  };

  const handleSetWinner = async (participantId: string) => {
    if (!match) return;
    try {
      const numericScores: Record<string, number> = {};
      Object.entries(scores).forEach(([key, value]) => {
        numericScores[key] = parseInt(value) || 0;
      });
      
      await updateMatchScores(match.id, numericScores, participantId);
      await updateMatch(match.id, { status: 'completed', completedAt: new Date() });
      setWinnerId(participantId);
      toast.success('Winner declared and match completed!');
    } catch (error) {
      toast.error('Failed to set winner');
      console.error(error);
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (!match) {
    return null;
  }

  const gameInfo = getGameInfo(match.game);
  const participantCount = match.participants?.length || 0;
  const isFull = participantCount >= match.maxParticipants;
  const isLive = match.status === 'in_progress';

  return (
    <div className="p-6">
      {/* Live Match Banner */}
      {isLive && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="relative flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
              </span>
              <span className="text-lg font-bold text-red-400">MATCH IS LIVE</span>
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<CheckCircleIcon className="w-4 h-4" />}
              onClick={() => setScoresModalOpen(true)}
            >
              Declare Winner
            </Button>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{match.title}</h1>
              <Badge variant={statusColors[match.status]}>
                {isLive && <span className="mr-1 inline-block w-2 h-2 rounded-full bg-red-400 animate-pulse" />}
                {statusLabels[match.status]}
              </Badge>
            </div>
            <p className="text-dark-400 mt-1">
              {gameInfo.icon} {gameInfo.name} • {matchTypeLabels[match.type]}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Link href={`/admin/matches/${match.id}/edit`}>
            <Button variant="secondary" leftIcon={<PencilIcon className="w-4 h-4" />}>
              Edit
            </Button>
          </Link>
          <Button 
            variant="danger" 
            leftIcon={<TrashIcon className="w-4 h-4" />}
            onClick={() => setDeleteModalOpen(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Scoring Panel - Show prominently when match is in progress */}
          {isLive && match.participants && match.participants.length > 0 && (
            <Card variant="glass" className="border-2 border-red-500/30 bg-gradient-to-br from-red-500/10 to-orange-500/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <TrophyIcon className="w-6 h-6 text-red-400" />
                  Live Scoring
                  <span className="ml-2 text-xs px-2 py-1 rounded-full bg-red-500 text-white animate-pulse">
                    LIVE
                  </span>
                </h2>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                {match.participants.map((participant) => {
                  const participantId = getParticipantId(participant);
                  const participantUser = participantUsers[participantId];
                  const currentScore = parseInt(scores[participantId] || '0');
                  const isUpdating = updatingScoreFor === participantId;
                  
                  return (
                    <motion.div
                      key={participantId}
                      className="p-4 rounded-xl bg-dark-800/80 border border-dark-700"
                      animate={isUpdating ? { scale: [1, 1.02, 1] } : {}}
                    >
                      {/* Participant Info */}
                      <div className="flex items-center gap-3 mb-4">
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
                              className="cursor-pointer"
                            />
                          </Link>
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-dark-600 flex items-center justify-center text-white font-bold">
                            {participant.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          {participantUser && !match.isTeamMatch ? (
                            <Link 
                              href={`/users/${participantId}`}
                              className="font-semibold text-white hover:text-cyan-400 transition-colors"
                            >
                              {participantUser.displayName}
                            </Link>
                          ) : (
                            <span className="font-semibold text-white">{participant.name}</span>
                          )}
                          {participantUser?.email && (
                            <p className="text-xs text-dark-400">{participantUser.email}</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Score Controls */}
                      <div className="flex items-center justify-center gap-4">
                        <button
                          onClick={() => handleQuickScore(participantId, -1)}
                          disabled={isUpdating || currentScore <= 0}
                          className="w-12 h-12 rounded-full bg-red-500/20 hover:bg-red-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                        >
                          <MinusIcon className="w-6 h-6 text-red-400" />
                        </button>
                        
                        <div className="text-5xl font-bold text-white min-w-[80px] text-center">
                          {currentScore}
                        </div>
                        
                        <button
                          onClick={() => handleQuickScore(participantId, 1)}
                          disabled={isUpdating}
                          className="w-12 h-12 rounded-full bg-green-500/20 hover:bg-green-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                        >
                          <PlusIcon className="w-6 h-6 text-green-400" />
                        </button>
                      </div>
                      
                      {/* Declare Winner Button */}
                      <Button
                        variant="secondary"
                        size="sm"
                        fullWidth
                        className="mt-4"
                        onClick={() => handleSetWinner(participantId)}
                        leftIcon={<TrophyIcon className="w-4 h-4" />}
                      >
                        Declare Winner
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Participants Section */}
          <Card variant="default">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                {match.isTeamMatch ? (
                  <UserGroupIcon className="w-5 h-5 text-purple-400" />
                ) : (
                  <UserIcon className="w-5 h-5 text-purple-400" />
                )}
                Participants ({participantCount}/{match.maxParticipants})
              </h2>
              {isFull && (
                <Badge variant="success" size="sm">Full</Badge>
              )}
            </div>

            {participantCount === 0 ? (
              <div className="text-center py-8 bg-dark-700/30 rounded-lg">
                <UserIcon className="w-12 h-12 mx-auto mb-3 text-dark-500" />
                <p className="text-dark-400">No participants have joined yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {match.participants.map((participant, idx) => {
                  const participantId = getParticipantId(participant);
                  const user = participantUsers[participantId];
                  const isWinner = match.winnerId === participantId;
                  const score = match.scores?.[participantId];

                  return (
                    <motion.div
                      key={participantId || idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`flex items-center justify-between p-4 rounded-xl ${
                        isWinner 
                          ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30' 
                          : 'bg-dark-700/50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        {match.isTeamMatch ? (
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                            {participant.name.charAt(0)}
                          </div>
                        ) : user ? (
                          <Link href={`/users/${participantId}`}>
                            <Avatar 
                              src={user.avatar} 
                              alt={user.displayName} 
                              size="lg"
                              className="cursor-pointer"
                            />
                          </Link>
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-dark-600 flex items-center justify-center text-white font-bold">
                            {participant.name.charAt(0)}
                          </div>
                        )}
                        
                        {/* Info */}
                        <div>
                          <div className="flex items-center gap-2">
                            {user && !match.isTeamMatch ? (
                              <Link 
                                href={`/users/${participantId}`}
                                className="font-semibold text-white hover:text-cyan-400 transition-colors"
                              >
                                {user.displayName}
                              </Link>
                            ) : (
                              <span className="font-semibold text-white">{participant.name}</span>
                            )}
                            {isWinner && (
                              <Badge variant="warning" size="sm">
                                <TrophyIcon className="w-3 h-3 mr-1" />
                                Winner
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-dark-400 mt-1">
                            <span className="flex items-center gap-1">
                              <ClockIcon className="w-3 h-3" />
                              Joined {format(toDate(participant.joinedAt), 'MMM d, h:mm a')}
                            </span>
                            {user?.email && !match.isTeamMatch && (
                              <span className="text-dark-500">{user.email}</span>
                            )}
                          </div>
                          {user && !match.isTeamMatch && (
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-dark-500">
                                {user.stats?.matches || 0} matches • {user.stats?.wins || 0} wins
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right side - Score & Actions */}
                      <div className="flex items-center gap-4">
                        {score !== undefined && (
                          <div className="text-right">
                            <p className="text-xs text-dark-400">Score</p>
                            <p className={`text-2xl font-bold ${isWinner ? 'text-yellow-400' : 'text-white'}`}>{score}</p>
                          </div>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRemoveParticipantModal(participant)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          title="Remove participant"
                        >
                          <UserMinusIcon className="w-5 h-5" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Description */}
          {match.description && (
            <Card variant="default">
              <h2 className="text-lg font-semibold text-white mb-3">Description</h2>
              <p className="text-dark-300 whitespace-pre-wrap">{match.description}</p>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card variant="glass">
            <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {match.status === 'open' && isFull && (
                <Button
                  fullWidth
                  variant="secondary"
                  leftIcon={<CalendarDaysIcon className="w-4 h-4" />}
                  onClick={() => handleStatusChange('scheduled')}
                  isLoading={isUpdatingStatus}
                >
                  Mark as Scheduled
                </Button>
              )}
              
              {match.status === 'scheduled' && (
                <Button
                  fullWidth
                  leftIcon={<PlayIcon className="w-4 h-4" />}
                  onClick={() => handleStatusChange('in_progress')}
                  isLoading={isUpdatingStatus}
                  className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                >
                  🔴 Start Live Match
                </Button>
              )}
              
              {match.status === 'in_progress' && (
                <>
                  <Button
                    fullWidth
                    variant="secondary"
                    leftIcon={<TrophyIcon className="w-4 h-4" />}
                    onClick={() => setScoresModalOpen(true)}
                  >
                    Update Scores
                  </Button>
                  <Button
                    fullWidth
                    variant="primary"
                    leftIcon={<CheckCircleIcon className="w-4 h-4" />}
                    onClick={() => handleStatusChange('completed')}
                    isLoading={isUpdatingStatus}
                  >
                    Complete Match
                  </Button>
                </>
              )}
              
              {match.status === 'completed' && (
                <Button
                  fullWidth
                  variant="secondary"
                  leftIcon={<TrophyIcon className="w-4 h-4" />}
                  onClick={() => setScoresModalOpen(true)}
                >
                  Edit Final Scores
                </Button>
              )}
              
              {(match.status === 'open' || match.status === 'scheduled') && (
                <Button
                  fullWidth
                  variant="ghost"
                  leftIcon={<XCircleIcon className="w-4 h-4" />}
                  onClick={() => handleStatusChange('cancelled')}
                  isLoading={isUpdatingStatus}
                  className="text-red-400 hover:bg-red-500/10"
                >
                  Cancel Match
                </Button>
              )}
            </div>
          </Card>

          {/* Match Details */}
          <Card variant="default">
            <h3 className="font-semibold text-white mb-4">Match Details</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center text-xl">
                  {gameInfo.icon}
                </div>
                <div>
                  <p className="text-xs text-dark-400">Game</p>
                  <p className="font-medium text-white">{gameInfo.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center">
                  <PlayIcon className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-dark-400">Type</p>
                  <p className="font-medium text-white">{matchTypeLabels[match.type]}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center">
                  {match.isTeamMatch ? (
                    <UserGroupIcon className="w-5 h-5 text-purple-400" />
                  ) : (
                    <UserIcon className="w-5 h-5 text-cyan-400" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-dark-400">Format</p>
                  <p className="font-medium text-white">
                    {match.isTeamMatch ? 'Team' : 'Solo'} ({match.maxParticipants} max)
                  </p>
                </div>
              </div>

              {match.scheduledTime && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center">
                    <CalendarDaysIcon className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-xs text-dark-400">Scheduled</p>
                    <p className="font-medium text-white">
                      {format(match.scheduledTime, 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center">
                  <GlobeAltIcon className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-dark-400">Visibility</p>
                  <p className="font-medium text-white">
                    {match.isPublic ? 'Public' : 'Private'}
                  </p>
                </div>
              </div>

              {match.streamUrl && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center">
                    <VideoCameraIcon className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-xs text-dark-400">Stream</p>
                    <a
                      href={match.streamUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-cyan-400 hover:underline truncate block max-w-[150px]"
                    >
                      {match.streamUrl}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Timestamps */}
          <Card variant="default">
            <h3 className="font-semibold text-white mb-4">Timeline</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-dark-400">Created</span>
                <span className="text-white">{format(match.createdAt, 'MMM d, yyyy h:mm a')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">Updated</span>
                <span className="text-white">{format(match.updatedAt, 'MMM d, yyyy h:mm a')}</span>
              </div>
              {match.completedAt && (
                <div className="flex justify-between">
                  <span className="text-dark-400">Completed</span>
                  <span className="text-green-400">{format(match.completedAt, 'MMM d, yyyy h:mm a')}</span>
                </div>
              )}
            </div>
          </Card>

          {/* View Public Page */}
          <Link href={`/matches/${match.id}`}>
            <Button variant="ghost" fullWidth>
              View Public Page →
            </Button>
          </Link>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Match"
        size="sm"
      >
        <div className="p-6">
          <p className="text-dark-300 mb-6">
            Are you sure you want to delete &quot;{match.title}&quot;? This action cannot be undone.
            {participantCount > 0 && (
              <span className="block mt-2 text-yellow-400 text-sm">
                ⚠️ This match has {participantCount} participant(s).
              </span>
            )}
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} isLoading={isDeleting}>
              Delete Match
            </Button>
          </div>
        </div>
      </Modal>

      {/* Remove Participant Modal */}
      <Modal
        isOpen={!!removeParticipantModal}
        onClose={() => setRemoveParticipantModal(null)}
        title="Remove Participant"
        size="sm"
      >
        <div className="p-6">
          <p className="text-dark-300 mb-6">
            Remove <span className="text-white font-semibold">{removeParticipantModal?.name}</span> from this match?
            The match will be reopened for others to join.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setRemoveParticipantModal(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleRemoveParticipant} isLoading={isRemoving}>
              Remove
            </Button>
          </div>
        </div>
      </Modal>

      {/* Scores Modal */}
      <Modal
        isOpen={scoresModalOpen}
        onClose={() => setScoresModalOpen(false)}
        title={match.status === 'completed' ? 'Edit Final Scores' : 'Update Scores & Declare Winner'}
        size="md"
      >
        <div className="p-6">
          {match.participants.length === 0 ? (
            <p className="text-dark-400 text-center py-4">No participants to score</p>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {match.participants.map((p) => {
                  const id = getParticipantId(p);
                  const user = participantUsers[id];
                  return (
                    <div key={id} className="space-y-2">
                      <div className="flex items-center gap-2">
                        {user && !match.isTeamMatch && (
                          <Avatar src={user.avatar} alt={user.displayName} size="sm" />
                        )}
                        <span className="text-white font-medium">{user?.displayName || p.name}</span>
                      </div>
                      <Input
                        type="number"
                        placeholder="0"
                        value={scores[id] || '0'}
                        onChange={(e) => setScores((prev) => ({ ...prev, [id]: e.target.value }))}
                      />
                    </div>
                  );
                })}
              </div>
              
              <Select
                label="Winner"
                options={[
                  { value: '', label: 'Select winner...' },
                  ...match.participants.map((p) => {
                    const id = getParticipantId(p);
                    const user = participantUsers[id];
                    return {
                      value: id,
                      label: user?.displayName || p.name,
                    };
                  }),
                ]}
                value={winnerId}
                onChange={(e) => setWinnerId(e.target.value)}
              />
              <p className="text-xs text-dark-400">
                Selecting a winner will automatically complete the match.
              </p>
            </div>
          )}
          
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setScoresModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveScores} isLoading={isSavingScores}>
              Save {winnerId ? '& Complete Match' : 'Scores'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
