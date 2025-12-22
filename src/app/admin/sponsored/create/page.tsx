'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, MegaphoneIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { createSponsoredContent, getGames } from '@/lib/firebase/db';
import { useAuthStore } from '@/store/authStore';
import { type SponsoredContentType, type AdPlacement, type AdPosition, type AdDisplaySize, type Game } from '@/types';

const contentTypeOptions = [
  { value: 'banner', label: 'Banner Ad' },
  { value: 'native', label: 'Native Ad' },
  { value: 'promotion', label: 'Promotion' },
  { value: 'featured', label: 'Featured' },
];

const displaySizeOptions: { value: AdDisplaySize; label: string; description: string }[] = [
  { value: 'full', label: '🖼️ Full Size', description: 'Large banner with image, like a post' },
  { value: 'compact', label: '📦 Compact', description: 'Card style, medium height' },
  { value: 'inline', label: '➖ Inline', description: 'Single line, minimal space' },
];

const gradientOptions = [
  { value: 'from-cyan-600 to-purple-600', label: 'Cyan to Purple (Default)' },
  { value: 'from-red-600 to-orange-600', label: 'Red to Orange (Hot)' },
  { value: 'from-green-600 to-emerald-600', label: 'Green to Emerald (Success)' },
  { value: 'from-purple-600 to-pink-600', label: 'Purple to Pink (Premium)' },
  { value: 'from-blue-600 to-indigo-600', label: 'Blue to Indigo (Cool)' },
  { value: 'from-yellow-600 to-amber-600', label: 'Yellow to Amber (Attention)' },
];

const frequencyOptions = [
  { value: '3', label: 'High - Every 3 posts' },
  { value: '5', label: 'Normal - Every 5 posts (Default)' },
  { value: '7', label: 'Low - Every 7 posts' },
  { value: '10', label: 'Minimal - Every 10 posts' },
];

const priorityOptions = [
  { value: '10', label: '10 - Highest Priority (Shows First)' },
  { value: '8', label: '8 - High Priority' },
  { value: '5', label: '5 - Normal Priority (Default)' },
  { value: '3', label: '3 - Low Priority' },
  { value: '1', label: '1 - Lowest Priority' },
];

const placementOptions: { value: AdPlacement; label: string }[] = [
  { value: 'feed', label: '📱 Feed (Main feed page)' },
  { value: 'stories', label: '📖 Stories Bar' },
  { value: 'sidebar', label: '📌 Sidebar' },
  { value: 'match_page', label: '🎮 Match Pages' },
  { value: 'tournament_page', label: '🏆 Tournament Pages' },
];

const positionOptions: { value: AdPosition; label: string }[] = [
  { value: 'anywhere', label: 'Anywhere (Based on frequency)' },
  { value: 'top', label: 'Top (First items in feed)' },
  { value: 'middle', label: 'Middle (After first few posts)' },
  { value: 'bottom', label: 'Bottom (Later in feed)' },
];

const minPostsOptions = [
  { value: '0', label: 'Always show (even with no posts)' },
  { value: '1', label: 'At least 1 post' },
  { value: '3', label: 'At least 3 posts' },
  { value: '5', label: 'At least 5 posts' },
  { value: '10', label: 'At least 10 posts' },
];

export default function CreateSponsoredPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [games, setGames] = useState<Game[]>([]);
  const [formData, setFormData] = useState({
    type: 'banner' as SponsoredContentType,
    title: '',
    description: '',
    imageUrl: '',
    logoUrl: '',
    sponsorName: '',
    ctaText: '',
    ctaUrl: '',
    badge: '',
    gradient: 'from-cyan-600 to-purple-600',
    isActive: true,
    frequency: 5,
    priority: 5,
    targetGames: [] as string[],
    // Display size
    displaySize: 'full' as AdDisplaySize,
    // Placement controls
    placements: ['feed'] as AdPlacement[],
    position: 'anywhere' as AdPosition,
    minPostsRequired: 0,
    showOnEmptyFeed: true,
  });

  // Fetch available games
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const gamesData = await getGames(true);
        setGames(gamesData);
      } catch (error) {
        console.error('Error fetching games:', error);
      }
    };
    fetchGames();
  }, []);

  const handleGameToggle = (gameId: string) => {
    setFormData((prev) => ({
      ...prev,
      targetGames: prev.targetGames.includes(gameId)
        ? prev.targetGames.filter((id) => id !== gameId)
        : [...prev.targetGames, gameId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!formData.sponsorName.trim()) {
      toast.error('Sponsor name is required');
      return;
    }

    if (!formData.ctaUrl.trim()) {
      toast.error('Call-to-action URL is required');
      return;
    }

    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    setIsSubmitting(true);
    try {
      // Build create data, using null for empty optional fields (Firebase doesn't accept undefined)
      const createData: Record<string, unknown> = {
        type: formData.type,
        title: formData.title.trim(),
        sponsorName: formData.sponsorName.trim(),
        ctaText: formData.ctaText.trim() || 'Learn More',
        ctaUrl: formData.ctaUrl.trim(),
        gradient: formData.gradient,
        isActive: formData.isActive,
        frequency: formData.frequency,
        priority: formData.priority,
        createdBy: user.id,
        // Display size
        displaySize: formData.displaySize,
        // Placement controls
        placements: formData.placements,
        position: formData.position,
        minPostsRequired: formData.minPostsRequired,
        showOnEmptyFeed: formData.showOnEmptyFeed,
      };
      
      // Optional fields - only include if they have values
      if (formData.description.trim()) createData.description = formData.description.trim();
      if (formData.imageUrl.trim()) createData.imageUrl = formData.imageUrl.trim();
      if (formData.logoUrl.trim()) createData.logoUrl = formData.logoUrl.trim();
      if (formData.badge.trim()) createData.badge = formData.badge.trim();
      createData.targetGames = formData.targetGames.length > 0 ? formData.targetGames : [];
      
      await createSponsoredContent(createData as Parameters<typeof createSponsoredContent>[0]);

      toast.success('Sponsored content created successfully!');
      router.push('/admin/sponsored');
    } catch (error) {
      console.error('Error creating sponsored content:', error);
      toast.error('Failed to create sponsored content');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/sponsored">
          <Button variant="secondary" size="sm">
            <ArrowLeftIcon className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MegaphoneIcon className="w-7 h-7 text-cyan-400" />
            Create Sponsored Content
          </h1>
          <p className="text-dark-400">Add a new ad or promotion to the feed</p>
        </div>
      </div>

      <Card variant="default" padding="lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Content Type */}
          <Select
            label="Ad Type"
            value={formData.type}
            onChange={(e) =>
              setFormData({ ...formData, type: e.target.value as SponsoredContentType })
            }
            options={contentTypeOptions}
          />

          {/* Sponsor Name */}
          <Input
            label="Sponsor / Company Name"
            placeholder="e.g., TechGear Pro"
            value={formData.sponsorName}
            onChange={(e) => setFormData({ ...formData, sponsorName: e.target.value })}
            required
          />

          {/* Title */}
          <Input
            label="Ad Title"
            placeholder="Enter catchy headline"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          {/* Description */}
          <Textarea
            label="Description (Optional)"
            placeholder="Enter ad description..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />

          {/* Images */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Banner Image URL"
              placeholder="https://example.com/banner.jpg"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              helperText="Main ad image"
            />
            <Input
              label="Logo URL (Optional)"
              placeholder="https://example.com/logo.png"
              value={formData.logoUrl}
              onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
              helperText="Company logo"
            />
          </div>

          {/* CTA */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="CTA Button Text"
              placeholder="e.g., Shop Now, Learn More"
              value={formData.ctaText}
              onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
            />
            <Input
              label="CTA URL"
              placeholder="https://sponsor-website.com"
              value={formData.ctaUrl}
              onChange={(e) => setFormData({ ...formData, ctaUrl: e.target.value })}
              required
            />
          </div>

          {/* Badge */}
          <Input
            label="Badge Text (Optional)"
            placeholder="e.g., 20% OFF, NEW, LIMITED"
            value={formData.badge}
            onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
          />

          {/* Gradient */}
          <Select
            label="Background Gradient"
            value={formData.gradient}
            onChange={(e) => setFormData({ ...formData, gradient: e.target.value })}
            options={gradientOptions}
          />

          {/* Display Size */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              Display Size
            </label>
            <div className="grid grid-cols-3 gap-3">
              {displaySizeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, displaySize: option.value })}
                  className={`
                    p-3 rounded-lg text-left transition-all border
                    ${
                      formData.displaySize === option.value
                        ? 'bg-cyan-500/20 border-cyan-500/50 ring-1 ring-cyan-500/30'
                        : 'bg-dark-700 border-dark-600 hover:border-dark-500'
                    }
                  `}
                >
                  <div className="text-sm font-medium text-white">{option.label}</div>
                  <div className="text-xs text-dark-400 mt-1">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Frequency & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Select
                label="Display Frequency"
                value={String(formData.frequency)}
                onChange={(e) => setFormData({ ...formData, frequency: parseInt(e.target.value) })}
                options={frequencyOptions}
              />
              <p className="text-xs text-dark-500 mt-1">How often this ad appears in the feed</p>
            </div>
            <div>
              <Select
                label="Priority Level"
                value={String(formData.priority)}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                options={priorityOptions}
              />
              <p className="text-xs text-dark-500 mt-1">Higher priority ads show first</p>
            </div>
          </div>

          {/* Placement Controls */}
          <div className="border border-dark-700 rounded-lg p-4 space-y-4 bg-dark-800/50">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              📍 Placement Controls
            </h3>

            {/* Where to show */}
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Where to Display
              </label>
              <div className="flex flex-wrap gap-2">
                {placementOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      const newPlacements = formData.placements.includes(option.value)
                        ? formData.placements.filter((p) => p !== option.value)
                        : [...formData.placements, option.value];
                      setFormData({ ...formData, placements: newPlacements.length > 0 ? newPlacements : ['feed'] });
                    }}
                    className={`
                      px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                      ${
                        formData.placements.includes(option.value)
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                          : 'bg-dark-700 text-dark-300 border border-dark-600 hover:border-dark-500'
                      }
                    `}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Position in feed */}
            <Select
              label="Position in Feed"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value as AdPosition })}
              options={positionOptions}
            />

            {/* Minimum posts required */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Select
                  label="Minimum Posts Required"
                  value={String(formData.minPostsRequired)}
                  onChange={(e) => setFormData({ ...formData, minPostsRequired: parseInt(e.target.value) })}
                  options={minPostsOptions}
                />
                <p className="text-xs text-dark-500 mt-1">Don&apos;t show until feed has this many posts</p>
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.showOnEmptyFeed}
                    onChange={(e) => setFormData({ ...formData, showOnEmptyFeed: e.target.checked })}
                    className="w-4 h-4 rounded border-dark-600 bg-dark-800 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="text-sm text-dark-200">Show on empty/minimal feed</span>
                </label>
              </div>
            </div>
          </div>

          {/* Target Games */}
          {games.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Target Games (Optional)
              </label>
              <p className="text-xs text-dark-400 mb-3">
                Leave empty to show to all users, or select specific games to target
              </p>
              <div className="flex flex-wrap gap-2">
                {games.map((game) => (
                  <button
                    key={game.id}
                    type="button"
                    onClick={() => handleGameToggle(game.id)}
                    className={`
                      px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                      ${
                        formData.targetGames.includes(game.id)
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                          : 'bg-dark-700 text-dark-300 border border-dark-600 hover:border-dark-500'
                      }
                    `}
                  >
                    {game.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 rounded border-dark-600 bg-dark-800 text-cyan-500 focus:ring-cyan-500"
            />
            <span className="text-sm text-dark-200">Active (visible to users)</span>
          </label>

          {/* Preview */}
          {formData.title && (
            <div className="border-t border-dark-700 pt-6">
              <p className="text-sm text-dark-400 mb-3">Preview (Banner Style):</p>
              <div
                className={`relative rounded-xl overflow-hidden bg-gradient-to-r ${formData.gradient}`}
              >
                {formData.imageUrl && (
                  <div className="absolute inset-0">
                    <img
                      src={formData.imageUrl}
                      alt={formData.title}
                      className="w-full h-full object-cover opacity-40"
                    />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
                <div className="relative p-4 flex items-center gap-4">
                  {formData.logoUrl && (
                    <img
                      src={formData.logoUrl}
                      alt={formData.sponsorName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-white/60 font-medium uppercase tracking-wider">
                        Sponsored
                      </span>
                      {formData.badge && (
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-yellow-500 text-black">
                          {formData.badge}
                        </span>
                      )}
                    </div>
                    <h4 className="text-white font-bold text-lg leading-tight mb-1">
                      {formData.title}
                    </h4>
                    {formData.description && (
                      <p className="text-white/70 text-sm line-clamp-1">{formData.description}</p>
                    )}
                  </div>
                  <span className="shrink-0 px-4 py-2 rounded-lg font-medium text-sm bg-white text-dark-900">
                    {formData.ctaText || 'Learn More'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Link href="/admin/sponsored" className="flex-1">
              <Button variant="secondary" fullWidth>
                Cancel
              </Button>
            </Link>
            <Button type="submit" isLoading={isSubmitting} fullWidth className="flex-1">
              Create Ad
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
