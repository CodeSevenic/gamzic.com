'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { createTeam } from '@/lib/firebase/db';
import { uploadTeamLogo } from '@/lib/firebase/storage';
import { useGames } from '@/hooks/useGames';

export default function CreateTeamPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { gameOptions } = useGames();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [game, setGame] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
    } else if (!user.schoolId) {
      toast.error('You must join a school first');
      router.push('/schools');
    }
  }, [user, router]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.schoolId) return;

    if (!name.trim()) {
      toast.error('Team name is required');
      return;
    }
    if (!game) {
      toast.error('Please select a game');
      return;
    }

    setIsLoading(true);
    try {
      // Create team first to get ID
      const teamId = await createTeam({
        name: name.trim(),
        description: description.trim(),
        schoolId: user.schoolId,
        game,
        members: [user.id],
        captainId: user.id,
        stats: { wins: 0, losses: 0, tournamentWins: 0 },
      });

      // Upload logo if provided
      if (logoFile) {
        const logoUrl = await uploadTeamLogo(teamId, logoFile);
        // Note: In a real app, you'd update the team with the logo URL
        console.log('Logo uploaded:', logoUrl);
      }

      toast.success('Team created successfully!');
      router.push(`/teams/${teamId}`);
    } catch (error) {
      toast.error('Failed to create team');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user?.schoolId) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto p-4 lg:p-6">
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
          <h1 className="text-2xl font-bold text-white mb-6">Create a Team</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Logo Upload */}
            <div className="flex justify-center">
              <label className="cursor-pointer group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <div className="w-24 h-24 rounded-xl bg-dark-700 border-2 border-dashed border-dark-600 flex items-center justify-center group-hover:border-cyan-500 transition-colors overflow-hidden">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <PhotoIcon className="w-8 h-8 text-dark-500 mx-auto" />
                      <span className="text-xs text-dark-500">Add Logo</span>
                    </div>
                  )}
                </div>
              </label>
            </div>

            <Input
              label="Team Name"
              placeholder="Enter team name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Textarea
              label="Description"
              placeholder="Tell us about your team..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />

            <Select
              label="Game"
              options={gameOptions}
              placeholder="Select a game"
              value={game}
              onChange={(e) => setGame(e.target.value)}
            />

            <Button type="submit" fullWidth isLoading={isLoading}>
              Create Team
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}

