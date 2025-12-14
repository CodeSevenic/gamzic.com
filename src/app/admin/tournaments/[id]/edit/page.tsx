'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { getTournament, updateTournament } from '@/lib/firebase/db';
import { uploadTournamentBanner } from '@/lib/firebase/storage';
import { type Tournament, type TournamentType, type TournamentStatus } from '@/types';
import { useGames } from '@/hooks/useGames';

const formatDateForInput = (date: Date): string => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export default function EditTournamentPage() {
  const router = useRouter();
  const params = useParams();
  const tournamentId = params.id as string;
  const { gameOptions } = useGames();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [game, setGame] = useState('');
  const [type, setType] = useState<TournamentType>('solo');
  const [status, setStatus] = useState<TournamentStatus>('draft');
  const [rules, setRules] = useState('');
  const [prizeDescription, setPrizeDescription] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchTournament = async () => {
      try {
        const fetchedTournament = await getTournament(tournamentId);
        if (!fetchedTournament) {
          toast.error('Tournament not found');
          router.push('/admin/tournaments');
          return;
        }
        setTournament(fetchedTournament);
        setTitle(fetchedTournament.title);
        setDescription(fetchedTournament.description || '');
        setGame(fetchedTournament.game);
        setType(fetchedTournament.type);
        setStatus(fetchedTournament.status);
        setRules(fetchedTournament.rules || '');
        setPrizeDescription(fetchedTournament.prizeDescription || '');
        setMaxParticipants(fetchedTournament.maxParticipants?.toString() || '');
        setDateStart(formatDateForInput(fetchedTournament.dateStart));
        setDateEnd(formatDateForInput(fetchedTournament.dateEnd));
        setRegistrationDeadline(formatDateForInput(fetchedTournament.registrationDeadline));
        if (fetchedTournament.bannerImage) {
          setBannerPreview(fetchedTournament.bannerImage);
        }
      } catch (error) {
        console.error('Error fetching tournament:', error);
        toast.error('Failed to load tournament');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTournament();
  }, [tournamentId, router]);

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

    setIsSaving(true);
    try {
      let bannerImage = tournament?.bannerImage;

      // Upload new banner if provided
      if (bannerFile) {
        bannerImage = await uploadTournamentBanner(tournamentId, bannerFile);
      }

      await updateTournament(tournamentId, {
        title: title.trim(),
        description: description.trim(),
        game,
        type,
        status,
        rules: rules.trim(),
        prizeDescription: prizeDescription.trim(),
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : undefined,
        dateStart: new Date(dateStart),
        dateEnd: new Date(dateEnd),
        registrationDeadline: new Date(registrationDeadline),
        bannerImage,
      });

      toast.success('Tournament updated successfully!');
      router.push('/admin/tournaments');
    } catch (error) {
      toast.error('Failed to update tournament');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

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
          <h1 className="text-2xl font-bold text-white mb-6">Edit Tournament</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Banner Upload */}
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">
                Banner Image
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
                options={gameOptions}
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

            <Select
              label="Status"
              options={[
                { value: 'draft', label: 'Draft' },
                { value: 'registration', label: 'Registration Open' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
              value={status}
              onChange={(e) => setStatus(e.target.value as TournamentStatus)}
            />

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

            {/* Participants Info */}
            {tournament && tournament.participants.length > 0 && (
              <div className="p-4 bg-dark-700/50 rounded-lg">
                <p className="text-sm text-dark-400">
                  <span className="text-white font-medium">{tournament.participants.length}</span> participant(s) registered
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSaving}>
                Save Changes
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}

