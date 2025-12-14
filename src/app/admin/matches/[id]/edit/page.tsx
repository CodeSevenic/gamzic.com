'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { getMatch, updateMatch, getGames, updateMatchScores } from '@/lib/firebase/db';
import { uploadMatchBanner } from '@/lib/firebase/storage';
import { GAMES, type Match, type MatchType, type MatchStatus, type Game, type MatchParticipant } from '@/types';
import { Timestamp } from 'firebase/firestore';

const formatDateForInput = (date: Date): string => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
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

export default function EditMatchPage() {
  const router = useRouter();
  const params = useParams();
  const matchId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [match, setMatch] = useState<Match | null>(null);
  const [dynamicGames, setDynamicGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [game, setGame] = useState('');
  const [matchType, setMatchType] = useState<MatchType>('friendly');
  const [status, setStatus] = useState<MatchStatus>('open');
  const [isTeamMatch, setIsTeamMatch] = useState(false);
  const [maxParticipants, setMaxParticipants] = useState('2');
  const [customMaxParticipants, setCustomMaxParticipants] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  
  // New fields
  const [rules, setRules] = useState('');
  const [prizeDescription, setPrizeDescription] = useState('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [existingBanner, setExistingBanner] = useState<string | null>(null);
  
  // Scores
  const [scores, setScores] = useState<Record<string, string>>({});
  const [winnerId, setWinnerId] = useState('');

  const predefinedOptions = ['2', '4', '6', '8', '10', '16', '20', '32', '50', '100'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedMatch, fetchedGames] = await Promise.all([
          getMatch(matchId),
          getGames(false),
        ]);
        
        if (!fetchedMatch) {
          toast.error('Match not found');
          router.push('/admin/matches');
          return;
        }
        
        setMatch(fetchedMatch);
        setDynamicGames(fetchedGames);
        setTitle(fetchedMatch.title);
        setDescription(fetchedMatch.description || '');
        setGame(fetchedMatch.game);
        setMatchType(fetchedMatch.type);
        setStatus(fetchedMatch.status);
        setIsTeamMatch(fetchedMatch.isTeamMatch);
        
        // Handle max participants
        const maxPart = fetchedMatch.maxParticipants.toString();
        if (predefinedOptions.includes(maxPart)) {
          setMaxParticipants(maxPart);
        } else {
          setMaxParticipants('custom');
          setCustomMaxParticipants(maxPart);
        }
        
        if (fetchedMatch.scheduledTime) {
          setScheduledTime(formatDateForInput(fetchedMatch.scheduledTime));
        }
        if (fetchedMatch.registrationDeadline) {
          setRegistrationDeadline(formatDateForInput(fetchedMatch.registrationDeadline));
        }
        setStreamUrl(fetchedMatch.streamUrl || '');
        setIsPublic(fetchedMatch.isPublic);
        setRules(fetchedMatch.rules || '');
        setPrizeDescription(fetchedMatch.prizeDescription || '');
        setWinnerId(fetchedMatch.winnerId || '');
        
        if (fetchedMatch.bannerImage) {
          setExistingBanner(fetchedMatch.bannerImage);
          setBannerPreview(fetchedMatch.bannerImage);
        }
        
        // Initialize scores
        if (fetchedMatch.scores) {
          const scoreStrings: Record<string, string> = {};
          Object.entries(fetchedMatch.scores).forEach(([key, value]) => {
            scoreStrings[key] = value.toString();
          });
          setScores(scoreStrings);
        } else if (fetchedMatch.participants) {
          const initialScores: Record<string, string> = {};
          fetchedMatch.participants.forEach((p) => {
            const id = p.oduserId || p.teamId || '';
            if (id) initialScores[id] = '0';
          });
          setScores(initialScores);
        }
      } catch (error) {
        console.error('Error fetching match:', error);
        toast.error('Failed to load match');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [matchId, router]);

  const gameOptions = dynamicGames.length > 0
    ? dynamicGames.map((g) => ({ value: g.id, label: `${g.icon} ${g.name}` }))
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
    setExistingBanner(null);
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

    setIsSaving(true);
    try {
      const updateData: Record<string, unknown> = {
        title: title.trim(),
        game,
        type: matchType,
        status,
        isTeamMatch,
        maxParticipants: participantCount,
        isPublic,
      };

      if (description.trim()) {
        updateData.description = description.trim();
      }
      if (rules.trim()) {
        updateData.rules = rules.trim();
      }
      if (prizeDescription.trim()) {
        updateData.prizeDescription = prizeDescription.trim();
      }
      if (scheduledTime) {
        updateData.scheduledTime = new Date(scheduledTime);
      }
      if (registrationDeadline) {
        updateData.registrationDeadline = new Date(registrationDeadline);
      }
      if (streamUrl.trim()) {
        updateData.streamUrl = streamUrl.trim();
      }

      // Handle banner
      if (bannerFile) {
        const bannerUrl = await uploadMatchBanner(matchId, bannerFile);
        updateData.bannerImage = bannerUrl;
      } else if (!bannerPreview && existingBanner) {
        // Banner was removed
        updateData.bannerImage = null;
      }

      await updateMatch(matchId, updateData as Partial<Match>);

      // Update scores if in progress or completed
      if ((status === 'in_progress' || status === 'completed') && Object.keys(scores).length > 0) {
        const numericScores: Record<string, number> = {};
        Object.entries(scores).forEach(([key, value]) => {
          numericScores[key] = parseInt(value) || 0;
        });
        await updateMatchScores(matchId, numericScores, status === 'completed' ? winnerId : undefined);
      }

      toast.success('Match updated successfully!');
      router.push('/admin/matches');
    } catch (error) {
      toast.error('Failed to update match');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const getParticipantId = (p: MatchParticipant) => p.oduserId || p.teamId || '';

  if (isLoading) {
    return <PageLoader />;
  }

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
          <h1 className="text-2xl font-bold text-white mb-6">Edit Match</h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Banner Upload */}
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Banner Image
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
                placeholder="e.g., Weekly Showdown #5"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <Textarea
                label="Description"
                placeholder="Describe the match..."
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
                  label="Match Type"
                  options={[
                    { value: 'friendly', label: '🤝 Friendly' },
                    { value: 'casual', label: '🎮 Casual' },
                    { value: 'scrimmage', label: '⚔️ Scrimmage' },
                    { value: 'ranked', label: '🏆 Ranked' },
                  ]}
                  value={matchType}
                  onChange={(e) => setMatchType(e.target.value as MatchType)}
                />
              </div>

              <Select
                label="Status"
                options={[
                  { value: 'open', label: '🟢 Open for Join' },
                  { value: 'scheduled', label: '📅 Scheduled' },
                  { value: 'in_progress', label: '🔴 In Progress' },
                  { value: 'completed', label: '✅ Completed' },
                  { value: 'cancelled', label: '❌ Cancelled' },
                ]}
                value={status}
                onChange={(e) => setStatus(e.target.value as MatchStatus)}
              />
            </div>

            {/* Participants */}
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
                  Team match
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Select
                  label={`Max ${isTeamMatch ? 'Teams' : 'Players'}`}
                  options={[
                    { value: '2', label: '2 (1v1)' },
                    { value: '4', label: '4' },
                    { value: '6', label: '6' },
                    { value: '8', label: '8' },
                    { value: '10', label: '10' },
                    { value: '16', label: '16' },
                    { value: '20', label: '20' },
                    { value: '32', label: '32' },
                    { value: '50', label: '50' },
                    { value: '100', label: '100' },
                    { value: 'custom', label: 'Custom...' },
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
                    value={customMaxParticipants}
                    onChange={(e) => setCustomMaxParticipants(e.target.value)}
                  />
                )}
              </div>
            </div>

            {/* Current Participants */}
            {match?.participants && match.participants.length > 0 && (
              <div className="p-4 bg-dark-700/50 rounded-lg space-y-3">
                <h3 className="font-medium text-white">
                  Current Participants ({match.participants.length}/{match.maxParticipants})
                </h3>
                <div className="space-y-2">
                  {match.participants.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-dark-600/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-white">{p.name}</span>
                        <span className="text-xs text-dark-400">
                          Joined {format(toDate(p.joinedAt), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      {match.winnerId === getParticipantId(p) && (
                        <Badge variant="success" size="sm">Winner</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scores */}
            {(status === 'in_progress' || status === 'completed') && match?.participants && match.participants.length > 0 && (
              <div className="p-4 bg-dark-700/50 rounded-lg space-y-4">
                <h3 className="font-medium text-white">Scores</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {match.participants.map((p) => {
                    const id = getParticipantId(p);
                    return (
                      <Input
                        key={id}
                        label={p.name}
                        type="number"
                        placeholder="0"
                        value={scores[id] || '0'}
                        onChange={(e) => setScores((prev) => ({ ...prev, [id]: e.target.value }))}
                      />
                    );
                  })}
                </div>
                {status === 'completed' && (
                  <Select
                    label="Winner"
                    options={[
                      { value: '', label: 'Select winner...' },
                      ...match.participants.map((p) => ({
                        value: getParticipantId(p),
                        label: p.name,
                      })),
                    ]}
                    value={winnerId}
                    onChange={(e) => setWinnerId(e.target.value)}
                  />
                )}
              </div>
            )}

            {/* Rules & Prizes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-dark-700 pb-2">
                Rules & Prizes
              </h3>

              <Textarea
                label="Rules"
                placeholder="Enter match rules..."
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                rows={4}
              />

              <Input
                label="Prize Description"
                placeholder="e.g., $50 prize pool, Gaming gear"
                value={prizeDescription}
                onChange={(e) => setPrizeDescription(e.target.value)}
              />
            </div>

            {/* Schedule */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-dark-700 pb-2">
                Schedule
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Match Time"
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />

                <Input
                  label="Registration Deadline"
                  type="datetime-local"
                  value={registrationDeadline}
                  onChange={(e) => setRegistrationDeadline(e.target.value)}
                />
              </div>

              <Input
                label="Stream URL"
                placeholder="https://twitch.tv/..."
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
              />
            </div>

            {/* Visibility */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-5 h-5 rounded border-dark-600 bg-dark-700 text-cyan-500 focus:ring-cyan-500"
              />
              <label htmlFor="isPublic" className="text-dark-200">
                Public match
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-dark-700">
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
