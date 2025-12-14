'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { createMatch, getGames } from '@/lib/firebase/db';
import { uploadMatchBanner } from '@/lib/firebase/storage';
import { GAMES, type MatchType, type Game } from '@/types';

export default function CreateMatchPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [games, setGames] = useState<Game[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [game, setGame] = useState('');
  const [matchType, setMatchType] = useState<MatchType>('friendly');
  const [isTeamMatch, setIsTeamMatch] = useState(false);
  const [maxParticipants, setMaxParticipants] = useState('2');
  const [customMaxParticipants, setCustomMaxParticipants] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  
  // New tournament-like fields
  const [rules, setRules] = useState('');
  const [prizeDescription, setPrizeDescription] = useState('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const fetchedGames = await getGames(true);
        setGames(fetchedGames);
      } catch (error) {
        console.error('Error fetching games:', error);
        setGames([]);
      } finally {
        setGamesLoading(false);
      }
    };
    fetchGames();
  }, []);

  const gameOptions = games.length > 0
    ? games.map((g) => ({ value: g.id, label: `${g.icon} ${g.name}` }))
    : GAMES.map((g) => ({ value: g.id, label: `${g.icon} ${g.name}` }));

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const removeBanner = () => {
    setBannerFile(null);
    setBannerPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getMaxParticipantsValue = () => {
    if (maxParticipants === 'custom') {
      return parseInt(customMaxParticipants) || 2;
    }
    return parseInt(maxParticipants);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!title.trim()) {
      toast.error('Match title is required');
      return;
    }
    if (!game) {
      toast.error('Please select a game');
      return;
    }
    
    const participantCount = getMaxParticipantsValue();
    if (participantCount < 2) {
      toast.error('Minimum 2 participants required');
      return;
    }

    setIsLoading(true);
    try {
      // Create match first to get ID
      const matchId = await createMatch({
        title: title.trim(),
        description: description.trim() || undefined,
        game,
        type: matchType,
        status: 'open',
        isTeamMatch,
        maxParticipants: participantCount,
        participants: [],
        rules: rules.trim() || undefined,
        prizeDescription: prizeDescription.trim() || undefined,
        scheduledTime: scheduledTime ? new Date(scheduledTime) : undefined,
        registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : undefined,
        streamUrl: streamUrl.trim() || undefined,
        isPublic,
        createdBy: user.id,
      });

      // Upload banner if provided
      if (bannerFile) {
        const bannerUrl = await uploadMatchBanner(matchId, bannerFile);
        // Update match with banner URL
        const { updateMatch } = await import('@/lib/firebase/db');
        await updateMatch(matchId, { bannerImage: bannerUrl });
      }

      toast.success('Match created! Participants can now join.');
      router.push('/admin/matches');
    } catch (error) {
      toast.error('Failed to create match');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl">
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
          <h1 className="text-2xl font-bold text-white mb-2">Create Match</h1>
          <p className="text-dark-400 mb-6">
            Create a match with custom settings. Add rules, prizes, and banners to make it exciting!
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Banner Upload */}
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Banner Image (optional)
              </label>
              {bannerPreview ? (
                <div className="relative h-48 rounded-xl overflow-hidden">
                  <Image
                    src={bannerPreview}
                    alt="Banner preview"
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeBanner}
                    className="absolute top-2 right-2 p-2 rounded-lg bg-dark-900/80 text-white hover:bg-red-500 transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-48 rounded-xl border-2 border-dashed border-dark-600 hover:border-cyan-500 transition-colors flex flex-col items-center justify-center gap-3 bg-dark-800/50"
                >
                  <PhotoIcon className="w-12 h-12 text-dark-500" />
                  <span className="text-dark-400">Click to upload a banner image</span>
                  <span className="text-xs text-dark-500">Recommended: 1200×400px, max 5MB</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleBannerChange}
                className="hidden"
              />
            </div>

            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-dark-700 pb-2">
                Basic Information
              </h3>
              
              <Input
                label="Match Title"
                placeholder="e.g., Friday Night Showdown, Ranked 1v1 Challenge"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <Textarea
                label="Description (optional)"
                placeholder="Tell participants what this match is about..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <Select
                  label="Game"
                  options={gameOptions}
                  placeholder={gamesLoading ? 'Loading games...' : 'Select a game'}
                  value={game}
                  onChange={(e) => setGame(e.target.value)}
                />

                <Select
                  label="Match Type"
                  options={[
                    { value: 'friendly', label: '🤝 Friendly - Just for fun' },
                    { value: 'casual', label: '🎮 Casual - Relaxed competition' },
                    { value: 'scrimmage', label: '⚔️ Scrimmage - Practice match' },
                    { value: 'ranked', label: '🏆 Ranked - Competitive' },
                  ]}
                  value={matchType}
                  onChange={(e) => setMatchType(e.target.value as MatchType)}
                />
              </div>
            </div>

            {/* Participants Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-dark-700 pb-2">
                Participants
              </h3>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isTeamMatch"
                  checked={isTeamMatch}
                  onChange={(e) => setIsTeamMatch(e.target.checked)}
                  className="w-5 h-5 rounded border-dark-600 bg-dark-700 text-cyan-500 focus:ring-cyan-500"
                />
                <label htmlFor="isTeamMatch" className="text-dark-200">
                  Team match (teams join instead of individual players)
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Select
                  label={`Max ${isTeamMatch ? 'Teams' : 'Players'}`}
                  options={[
                    { value: '2', label: '2 (1v1)' },
                    { value: '4', label: '4 (2v2 or FFA)' },
                    { value: '6', label: '6 (3v3 or FFA)' },
                    { value: '8', label: '8 (4v4 or FFA)' },
                    { value: '10', label: '10 (5v5 or FFA)' },
                    { value: '16', label: '16' },
                    { value: '20', label: '20' },
                    { value: '32', label: '32' },
                    { value: '50', label: '50' },
                    { value: '100', label: '100' },
                    { value: 'custom', label: 'Custom number...' },
                  ]}
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(e.target.value)}
                />

                {maxParticipants === 'custom' && (
                  <Input
                    label="Custom Number"
                    type="number"
                    min="2"
                    max="1000"
                    placeholder="Enter number"
                    value={customMaxParticipants}
                    onChange={(e) => setCustomMaxParticipants(e.target.value)}
                  />
                )}
              </div>

              <p className="text-sm text-dark-400">
                {isTeamMatch ? 'Teams' : 'Players'} will join from the match page. 
                You can have as many participants as you want!
              </p>
            </div>

            {/* Rules & Prizes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-dark-700 pb-2">
                Rules & Prizes
              </h3>

              <Textarea
                label="Rules (optional)"
                placeholder="Enter match rules, format, restrictions..."
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                rows={4}
              />

              <Input
                label="Prize Description (optional)"
                placeholder="e.g., $50 to the winner, Gaming headset, Bragging rights"
                value={prizeDescription}
                onChange={(e) => setPrizeDescription(e.target.value)}
              />
            </div>

            {/* Scheduling */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-dark-700 pb-2">
                Schedule
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Match Time (optional)"
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  helperText="When the match will take place"
                />

                <Input
                  label="Registration Deadline (optional)"
                  type="datetime-local"
                  value={registrationDeadline}
                  onChange={(e) => setRegistrationDeadline(e.target.value)}
                  helperText="Last time to join"
                />
              </div>

              <Input
                label="Stream URL (optional)"
                placeholder="https://twitch.tv/... or https://youtube.com/..."
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
              />
            </div>

            {/* Visibility */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-dark-700 pb-2">
                Visibility
              </h3>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-5 h-5 rounded border-dark-600 bg-dark-700 text-cyan-500 focus:ring-cyan-500"
                />
                <label htmlFor="isPublic" className="text-dark-200">
                  Public match (visible to everyone, anyone can join)
                </label>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-4 border-t border-dark-700">
              <Button variant="ghost" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isLoading}>
                Create Match
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
