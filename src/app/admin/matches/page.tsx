'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  UserGroupIcon,
  UserIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { getMatches, deleteMatch, updateMatch, getGames } from '@/lib/firebase/db';
import { GAMES, type Match, type MatchStatus, type Game } from '@/types';

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

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [matchToDelete, setMatchToDelete] = useState<Match | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [{ matches: fetchedMatches }, fetchedGames] = await Promise.all([
          getMatches(undefined, undefined, 50),
          getGames(false),
        ]);
        setMatches(fetchedMatches);
        setGames(fetchedGames);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getGameInfo = (gameId: string) => {
    const dynamicGame = games.find((g) => g.id === gameId);
    if (dynamicGame) return { name: dynamicGame.name, icon: dynamicGame.icon };
    const defaultGame = GAMES.find((g) => g.id === gameId);
    if (defaultGame) return { name: defaultGame.name, icon: defaultGame.icon };
    return { name: gameId, icon: '🎮' };
  };

  const handleDelete = async () => {
    if (!matchToDelete) return;

    setIsDeleting(true);
    try {
      await deleteMatch(matchToDelete.id);
      setMatches((prev) => prev.filter((m) => m.id !== matchToDelete.id));
      toast.success('Match deleted');
      setDeleteModalOpen(false);
      setMatchToDelete(null);
    } catch (error) {
      toast.error('Failed to delete match');
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (matchId: string, status: MatchStatus) => {
    try {
      const updateData: Partial<Match> = { status };
      if (status === 'completed') {
        updateData.completedAt = new Date();
      }
      await updateMatch(matchId, updateData);
      setMatches((prev) =>
        prev.map((m) => (m.id === matchId ? { ...m, ...updateData } : m))
      );
      toast.success('Match status updated');
    } catch (error) {
      toast.error('Failed to update status');
      console.error(error);
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Matches</h1>
          <p className="text-dark-400">Manage standalone matches - participants join to compete</p>
        </div>
        <Link href="/admin/matches/create">
          <Button leftIcon={<PlusIcon className="w-5 h-5" />}>
            Create Match
          </Button>
        </Link>
      </div>

      {matches.length === 0 ? (
        <Card variant="glass" className="text-center py-12">
          <p className="text-dark-400 mb-4">No matches created yet</p>
          <Link href="/admin/matches/create">
            <Button>Create Your First Match</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {matches.map((match, index) => {
            const gameInfo = getGameInfo(match.game);
            const participantCount = match.participants?.length || 0;
            const slotsText = `${participantCount}/${match.maxParticipants}`;

            return (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card variant="default" className="flex items-center gap-4">
                  {/* Game Icon */}
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">{gameInfo.icon}</span>
                  </div>

                  {/* Match Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Link href={`/admin/matches/${match.id}`} className="hover:text-cyan-400 transition-colors">
                        <h3 className="font-semibold text-white truncate">{match.title}</h3>
                      </Link>
                      <Badge variant={statusColors[match.status]} size="sm">
                        {statusLabels[match.status]}
                      </Badge>
                      <Badge variant="default" size="sm">
                        {matchTypeLabels[match.type]}
                      </Badge>
                    </div>
                    
                    {/* Participants */}
                    <div className="flex items-center gap-2 text-sm text-dark-300 mb-1">
                      {match.isTeamMatch ? (
                        <UserGroupIcon className="w-4 h-4" />
                      ) : (
                        <UserIcon className="w-4 h-4" />
                      )}
                      <span className={participantCount >= match.maxParticipants ? 'text-green-400' : ''}>
                        {slotsText} {match.isTeamMatch ? 'teams' : 'players'} joined
                      </span>
                      {match.participants && match.participants.length > 0 && (
                        <span className="text-dark-500">
                          ({match.participants.map(p => p.name).join(' vs ')})
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-dark-500">
                      <span>{gameInfo.name}</span>
                      {match.scheduledTime && (
                        <span>{format(match.scheduledTime, 'MMM d, yyyy h:mm a')}</span>
                      )}
                    </div>
                  </div>

                  {/* Quick Status Actions */}
                  <div className="flex items-center gap-2">
                    {match.status === 'scheduled' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleStatusChange(match.id, 'in_progress')}
                        leftIcon={<PlayIcon className="w-4 h-4" />}
                      >
                        Start
                      </Button>
                    )}
                    {match.status === 'in_progress' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleStatusChange(match.id, 'completed')}
                      >
                        Complete
                      </Button>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link href={`/admin/matches/${match.id}`}>
                      <Button variant="ghost" size="sm" title="View & Manage">
                        <EyeIcon className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Link href={`/admin/matches/${match.id}/edit`}>
                      <Button variant="ghost" size="sm" title="Edit">
                        <PencilIcon className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setMatchToDelete(match);
                        setDeleteModalOpen(true);
                      }}
                      className="text-red-400 hover:text-red-300"
                      title="Delete"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Match"
        size="sm"
      >
        <div className="p-6">
          <p className="text-dark-300 mb-6">
            Are you sure you want to delete the match &quot;{matchToDelete?.title}&quot;? This action cannot be undone.
            {matchToDelete?.participants && matchToDelete.participants.length > 0 && (
              <span className="block mt-2 text-yellow-400 text-sm">
                ⚠️ This match has {matchToDelete.participants.length} participant(s) who already joined.
              </span>
            )}
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} isLoading={isDeleting}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
