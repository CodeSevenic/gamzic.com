'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { createGame } from '@/lib/firebase/db';

const EMOJI_SUGGESTIONS = ['🎮', '🎯', '⚽', '🏀', '🎲', '🃏', '🏆', '⚔️', '🔫', '🚗', '🏎️', '🎖️', '🦸', '🧙', '🎪', '🎭'];

export default function CreateGamePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🎮');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Game name is required');
      return;
    }
    if (!icon) {
      toast.error('Please select or enter an icon');
      return;
    }

    setIsLoading(true);
    try {
      await createGame({
        name: name.trim(),
        icon,
        description: description.trim() || undefined,
        isActive,
      });

      toast.success('Game added successfully!');
      router.push('/admin/games');
    } catch (error) {
      toast.error('Failed to add game');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-dark-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        <span>Back</span>
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card variant="glass" padding="lg">
          <h1 className="text-2xl font-bold text-white mb-6">Add Game</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Icon Selection */}
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Game Icon
              </label>
              <div className="flex items-center gap-4 mb-3">
                <div className="w-16 h-16 rounded-xl bg-dark-700 flex items-center justify-center">
                  <span className="text-4xl">{icon}</span>
                </div>
                <Input
                  placeholder="Enter emoji or icon"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-24"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {EMOJI_SUGGESTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setIcon(emoji)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-colors ${
                      icon === emoji
                        ? 'bg-cyan-500/20 border border-cyan-500/50'
                        : 'bg-dark-700 hover:bg-dark-600'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Game Name"
              placeholder="e.g., Valorant, FIFA 24, Fortnite"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Textarea
              label="Description (optional)"
              placeholder="Brief description of the game..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />

            {/* Active Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-5 h-5 rounded border-dark-600 bg-dark-700 text-cyan-500 focus:ring-cyan-500"
              />
              <label htmlFor="isActive" className="text-dark-200">
                Active (visible in game selection dropdowns)
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isLoading}>
                Add Game
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}

