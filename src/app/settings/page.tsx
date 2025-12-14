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
import { Avatar } from '@/components/ui/Avatar';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { useAuthStore } from '@/store/authStore';
import { updateUser, getGames } from '@/lib/firebase/db';
import { uploadAvatar } from '@/lib/firebase/storage';
import { GRADE_YEARS, type GameTags, type Game } from '@/types';

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading, setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [gradeYear, setGradeYear] = useState('');
  const [gameTags, setGameTags] = useState<GameTags>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [games, setGames] = useState<Game[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }

    if (user) {
      setDisplayName(user.displayName);
      setBio(user.bio || '');
      setGradeYear(user.gradeYear || '');
      setGameTags(user.gameTags || {});
    }

    // Fetch games
    const fetchGames = async () => {
      try {
        const gamesList = await getGames(true);
        setGames(gamesList);
      } catch (error) {
        console.error('Error fetching games:', error);
      }
    };
    fetchGames();
  }, [user, loading, router]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGameTagChange = (gameId: string, value: string) => {
    setGameTags((prev) => ({
      ...prev,
      [gameId]: value || undefined,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!displayName.trim()) {
      toast.error('Display name is required');
      return;
    }

    setIsLoading(true);
    try {
      let avatarUrl = user.avatar;

      // Upload new avatar if changed
      if (avatarFile) {
        avatarUrl = await uploadAvatar(user.id, avatarFile);
      }

      // Clean up empty game tags
      const cleanedGameTags: GameTags = {};
      Object.entries(gameTags).forEach(([key, value]) => {
        if (value?.trim()) {
          cleanedGameTags[key] = value.trim();
        }
      });

      await updateUser(user.id, {
        displayName: displayName.trim(),
        bio: bio.trim(),
        gradeYear,
        gameTags: cleanedGameTags,
        avatar: avatarUrl,
      });

      setUser({
        ...user,
        displayName: displayName.trim(),
        bio: bio.trim(),
        gradeYear,
        gameTags: cleanedGameTags,
        avatar: avatarUrl,
      });

      toast.success('Profile updated!');
    } catch (error) {
      toast.error('Failed to update profile');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
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
          <h1 className="text-2xl font-bold text-white mb-6">Profile Settings</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar */}
            <div className="flex justify-center">
              <label className="cursor-pointer group relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <div className="relative">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-24 h-24 rounded-full object-cover ring-4 ring-dark-700"
                    />
                  ) : (
                    <Avatar src={user.avatar} alt={user.displayName} size="xl" />
                  )}
                  <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <PhotoIcon className="w-8 h-8 text-white" />
                  </div>
                </div>
              </label>
            </div>

            <Input
              label="Display Name"
              placeholder="Your gamer tag"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />

            <Textarea
              label="Bio"
              placeholder="Tell us about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
            />

            <Select
              label="Grade / Year"
              options={[
                { value: '', label: 'Not specified' },
                ...GRADE_YEARS.map((g) => ({ value: g, label: g })),
              ]}
              value={gradeYear}
              onChange={(e) => setGradeYear(e.target.value)}
            />

            {/* Game IDs */}
            <div>
              <h3 className="text-sm font-medium text-dark-200 mb-3">Game IDs</h3>
              <div className="space-y-3">
                {games.map((game) => (
                  <Input
                    key={game.id}
                    label={`${game.icon} ${game.name}`}
                    placeholder={`Your ${game.name} username`}
                    value={gameTags[game.id] || ''}
                    onChange={(e) => handleGameTagChange(game.id, e.target.value)}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isLoading}>
                Save Changes
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}

