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
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { getTournaments, updateTournament, deleteTournament } from '@/lib/firebase/db';
import { type Tournament, type TournamentStatus } from '@/types';
import { useGames } from '@/hooks/useGames';

const statusColors: Record<TournamentStatus, 'success' | 'warning' | 'info' | 'danger' | 'default'> = {
  draft: 'default',
  registration: 'success',
  in_progress: 'warning',
  completed: 'info',
  cancelled: 'danger',
};

export default function AdminTournamentsPage() {
  const { getGameInfo } = useGames();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [tournamentToDelete, setTournamentToDelete] = useState<Tournament | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const { tournaments: fetchedTournaments } = await getTournaments(undefined, undefined, 50);
        setTournaments(fetchedTournaments);
      } catch (error) {
        console.error('Error fetching tournaments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  const handleStatusChange = async (status: TournamentStatus) => {
    if (!selectedTournament) return;

    setIsUpdating(true);
    try {
      await updateTournament(selectedTournament.id, { status });
      setTournaments((prev) =>
        prev.map((t) =>
          t.id === selectedTournament.id ? { ...t, status } : t
        )
      );
      toast.success('Tournament status updated');
      setStatusModalOpen(false);
      setSelectedTournament(null);
    } catch (error) {
      toast.error('Failed to update status');
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!tournamentToDelete) return;

    setIsDeleting(true);
    try {
      await deleteTournament(tournamentToDelete.id);
      setTournaments((prev) => prev.filter((t) => t.id !== tournamentToDelete.id));
      toast.success('Tournament deleted');
      setDeleteModalOpen(false);
      setTournamentToDelete(null);
    } catch (error) {
      toast.error('Failed to delete tournament');
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Tournaments</h1>
          <p className="text-dark-400">Manage competitions</p>
        </div>
        <Link href="/admin/tournaments/create">
          <Button leftIcon={<PlusIcon className="w-5 h-5" />}>
            Create Tournament
          </Button>
        </Link>
      </div>

      {tournaments.length === 0 ? (
        <Card variant="glass" className="text-center py-12">
          <p className="text-dark-400 mb-4">No tournaments yet</p>
          <Link href="/admin/tournaments/create">
            <Button>Create Your First Tournament</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {tournaments.map((tournament, index) => {
            const game = getGameInfo(tournament.game);

            return (
              <motion.div
                key={tournament.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card variant="default" className="flex items-center gap-4">
                  {/* Icon */}
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-3xl">{game.icon}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white truncate">{tournament.title}</h3>
                      <Badge variant={statusColors[tournament.status]} size="sm">
                        {tournament.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-dark-400 mb-1">
                      {game.name} • {tournament.type === 'solo' ? 'Solo' : 'Team'}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-dark-500">
                      <span>{format(tournament.dateStart, 'MMM d, yyyy')}</span>
                      <span className="flex items-center gap-1">
                        <UserGroupIcon className="w-4 h-4" />
                        {tournament.participants.length}
                        {tournament.maxParticipants && ` / ${tournament.maxParticipants}`}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSelectedTournament(tournament);
                        setStatusModalOpen(true);
                      }}
                    >
                      Status
                    </Button>
                    <Link href={`/admin/tournaments/${tournament.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <PencilIcon className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setTournamentToDelete(tournament);
                        setDeleteModalOpen(true);
                      }}
                      className="text-red-400 hover:text-red-300"
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

      {/* Status Change Modal */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="Change Tournament Status"
        size="sm"
      >
        <div className="p-6">
          <p className="text-dark-300 mb-4">
            Select a new status for &quot;{selectedTournament?.title}&quot;
          </p>
          <div className="space-y-2">
            {(['draft', 'registration', 'in_progress', 'completed', 'cancelled'] as TournamentStatus[]).map(
              (status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={isUpdating || selectedTournament?.status === status}
                  className={`
                    w-full p-3 rounded-lg text-left transition-colors
                    ${selectedTournament?.status === status
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'bg-dark-700 text-dark-300 hover:bg-dark-600 hover:text-white'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  <span className="capitalize">{status.replace('_', ' ')}</span>
                </button>
              )
            )}
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Tournament"
        size="sm"
      >
        <div className="p-6">
          <p className="text-dark-300 mb-6">
            Are you sure you want to delete &quot;{tournamentToDelete?.title}&quot;? This action cannot be undone.
            {tournamentToDelete && tournamentToDelete.participants.length > 0 && (
              <span className="block mt-2 text-yellow-400 text-sm">
                ⚠️ This tournament has {tournamentToDelete.participants.length} registered participant(s).
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

