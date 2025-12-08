'use client';

import { useState } from 'react';
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
import { createTournament } from '@/lib/firebase/db';
import { uploadTournamentBanner } from '@/lib/firebase/storage';
import { GAMES, type TournamentType } from '@/types';

export default function CreateTournamentPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [game, setGame] = useState('');
  const [type, setType] = useState<TournamentType>('solo');
  const [rules, setRules] = useState('');
  const [prizeDescription, setPrizeDescription] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!game) {
      toast.error('Please select a game');
      return;
    }
    if (!dateStart || !dateEnd || !registrationDeadline) {
      toast.error('Please fill in all date fields');
      return;
    }

    setIsLoading(true);
    try {
      const tournamentId = await createTournament({
        title: title.trim(),
        description: description.trim(),
        game,
        type,
        rules: rules.trim(),
        prizeDescription: prizeDescription.trim(),
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : undefined,
        dateStart: new Date(dateStart),
        dateEnd: new Date(dateEnd),
        registrationDeadline: new Date(registrationDeadline),
        participants: [],
        createdBy: user.id,
        status: 'registration',
      });

      // Upload banner if provided
      if (bannerFile) {
        await uploadTournamentBanner(tournamentId, bannerFile);
      }

      toast.success('Tournament created successfully!');
      router.push('/admin/tournaments');
    } catch (error) {
      toast.error('Failed to create tournament');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl">
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
          <h1 className="text-2xl font-bold text-white mb-6">Create Tournament</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Banner Upload */}
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">
                Banner Image (optional)
              </label>
              <label className="cursor-pointer block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerChange}
                  className="hidden"
                />
                <div className="h-40 rounded-xl bg-dark-700 border-2 border-dashed border-dark-600 flex items-center justify-center hover:border-cyan-500 transition-colors overflow-hidden">
                  {bannerPreview ? (
                    <img
                      src={bannerPreview}
                      alt="Banner preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center">
                      <PhotoIcon className="w-10 h-10 text-dark-500 mx-auto" />
                      <span className="text-sm text-dark-500">Click to upload banner</span>
                    </div>
                  )}
                </div>
              </label>
            </div>

            <Input
              label="Tournament Title"
              placeholder="Enter tournament name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <Textarea
              label="Description"
              placeholder="Describe your tournament..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <Select
                label="Game"
                options={GAMES.map((g) => ({
                  value: g.id,
                  label: `${g.icon} ${g.name}`,
                }))}
                placeholder="Select a game"
                value={game}
                onChange={(e) => setGame(e.target.value)}
              />

              <Select
                label="Format"
                options={[
                  { value: 'solo', label: 'Solo (Individual)' },
                  { value: 'team', label: 'Team' },
                ]}
                value={type}
                onChange={(e) => setType(e.target.value as TournamentType)}
              />
            </div>

            <Input
              label="Max Participants (optional)"
              type="number"
              placeholder="Leave empty for unlimited"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(e.target.value)}
            />

            <Textarea
              label="Rules"
              placeholder="Enter tournament rules..."
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              rows={4}
            />

            <Input
              label="Prize Description (optional)"
              placeholder="e.g., $100 Prize Pool, Gaming Headset, etc."
              value={prizeDescription}
              onChange={(e) => setPrizeDescription(e.target.value)}
            />

            <div className="grid gap-4 md:grid-cols-3">
              <Input
                label="Registration Deadline"
                type="datetime-local"
                value={registrationDeadline}
                onChange={(e) => setRegistrationDeadline(e.target.value)}
                required
              />

              <Input
                label="Start Date"
                type="datetime-local"
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
                required
              />

              <Input
                label="End Date"
                type="datetime-local"
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isLoading}>
                Create Tournament
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}

