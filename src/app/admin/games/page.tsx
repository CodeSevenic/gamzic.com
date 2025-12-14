'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { getGames, deleteGame, updateGame, seedDefaultGames } from '@/lib/firebase/db';
import type { Game } from '@/types';

export default function AdminGamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [gameToDelete, setGameToDelete] = useState<Game | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const fetchGames = async () => {
    try {
      const fetchedGames = await getGames(false); // Get all games, including inactive
      setGames(fetchedGames);
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const handleDelete = async () => {
    if (!gameToDelete) return;

    setIsDeleting(true);
    try {
      await deleteGame(gameToDelete.id);
      setGames((prev) => prev.filter((g) => g.id !== gameToDelete.id));
      toast.success('Game deleted');
      setDeleteModalOpen(false);
      setGameToDelete(null);
    } catch (error) {
      toast.error('Failed to delete game');
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (game: Game) => {
    try {
      await updateGame(game.id, { isActive: !game.isActive });
      setGames((prev) =>
        prev.map((g) => (g.id === game.id ? { ...g, isActive: !g.isActive } : g))
      );
      toast.success(game.isActive ? 'Game deactivated' : 'Game activated');
    } catch (error) {
      toast.error('Failed to update game');
      console.error(error);
    }
  };

  const handleSeedDefaults = async () => {
    setIsSeeding(true);
    try {
      await seedDefaultGames();
      await fetchGames();
      toast.success('Default games seeded successfully!');
    } catch (error) {
      toast.error('Failed to seed games');
      console.error(error);
    } finally {
      setIsSeeding(false);
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Games</h1>
          <p className="text-dark-400">Manage available games for matches & tournaments</p>
        </div>
        <div className="flex items-center gap-3">
          {games.length === 0 && (
            <Button
              variant="secondary"
              leftIcon={<ArrowPathIcon className="w-5 h-5" />}
              onClick={handleSeedDefaults}
              isLoading={isSeeding}
            >
              Seed Defaults
            </Button>
          )}
          <Link href="/admin/games/create">
            <Button leftIcon={<PlusIcon className="w-5 h-5" />}>
              Add Game
            </Button>
          </Link>
        </div>
      </div>

      {games.length === 0 ? (
        <Card variant="glass" className="text-center py-12">
          <p className="text-dark-400 mb-4">No games configured yet</p>
          <div className="flex justify-center gap-3">
            <Button variant="secondary" onClick={handleSeedDefaults} isLoading={isSeeding}>
              Seed Default Games
            </Button>
            <Link href="/admin/games/create">
              <Button>Add Custom Game</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {games.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card variant="default" className="h-full">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-3xl">{game.icon}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white truncate">{game.name}</h3>
                      <Badge 
                        variant={game.isActive ? 'success' : 'default'} 
                        size="sm"
                      >
                        {game.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    {game.description && (
                      <p className="text-sm text-dark-400 line-clamp-2">
                        {game.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-dark-700">
                  <Button
                    variant={game.isActive ? 'ghost' : 'secondary'}
                    size="sm"
                    onClick={() => handleToggleActive(game)}
                  >
                    {game.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/games/${game.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <PencilIcon className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setGameToDelete(game);
                        setDeleteModalOpen(true);
                      }}
                      className="text-red-400 hover:text-red-300"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Game"
        size="sm"
      >
        <div className="p-6">
          <p className="text-dark-300 mb-6">
            Are you sure you want to delete &quot;{gameToDelete?.name}&quot;? 
            Existing matches and tournaments using this game may be affected.
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

