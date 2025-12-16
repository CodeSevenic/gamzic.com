'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, MegaphoneIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { getSponsoredContentById, updateSponsoredContent, getGames } from '@/lib/firebase/db';
import { type SponsoredContentType, type Game } from '@/types';

const contentTypeOptions = [
  { value: 'banner', label: 'Banner Ad' },
  { value: 'native', label: 'Native Ad' },
  { value: 'promotion', label: 'Promotion' },
  { value: 'featured', label: 'Featured' },
];

const gradientOptions = [
  { value: 'from-cyan-600 to-purple-600', label: 'Cyan to Purple (Default)' },
  { value: 'from-red-600 to-orange-600', label: 'Red to Orange (Hot)' },
  { value: 'from-green-600 to-emerald-600', label: 'Green to Emerald (Success)' },
  { value: 'from-purple-600 to-pink-600', label: 'Purple to Pink (Premium)' },
  { value: 'from-blue-600 to-indigo-600', label: 'Blue to Indigo (Cool)' },
  { value: 'from-yellow-600 to-amber-600', label: 'Yellow to Amber (Attention)' },
];

export default function EditSponsoredPage() {
  const router = useRouter();
  const params = useParams();
  const contentId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
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
    targetGames: [] as string[],
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

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const content = await getSponsoredContentById(contentId);
        if (!content) {
          toast.error('Sponsored content not found');
          router.push('/admin/sponsored');
          return;
        }

        setFormData({
          type: content.type,
          title: content.title,
          description: content.description || '',
          imageUrl: content.imageUrl || '',
          logoUrl: content.logoUrl || '',
          sponsorName: content.sponsorName,
          ctaText: content.ctaText || '',
          ctaUrl: content.ctaUrl,
          badge: content.badge || '',
          gradient: content.gradient || 'from-cyan-600 to-purple-600',
          isActive: content.isActive,
          targetGames: content.targetGames || [],
        });
      } catch (error) {
        console.error('Error fetching sponsored content:', error);
        toast.error('Failed to load sponsored content');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [contentId, router]);

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

    setIsSubmitting(true);
    try {
      await updateSponsoredContent(contentId, {
        type: formData.type,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        imageUrl: formData.imageUrl.trim() || undefined,
        logoUrl: formData.logoUrl.trim() || undefined,
        sponsorName: formData.sponsorName.trim(),
        ctaText: formData.ctaText.trim() || 'Learn More',
        ctaUrl: formData.ctaUrl.trim(),
        badge: formData.badge.trim() || undefined,
        gradient: formData.gradient,
        isActive: formData.isActive,
        targetGames: formData.targetGames.length > 0 ? formData.targetGames : undefined,
      });

      toast.success('Sponsored content updated successfully!');
      router.push('/admin/sponsored');
    } catch (error) {
      console.error('Error updating sponsored content:', error);
      toast.error('Failed to update sponsored content');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

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
            Edit Sponsored Content
          </h1>
          <p className="text-dark-400">Update ad details</p>
        </div>
      </div>

      <Card variant="default" padding="lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Select
            label="Ad Type"
            value={formData.type}
            onChange={(e) =>
              setFormData({ ...formData, type: e.target.value as SponsoredContentType })
            }
            options={contentTypeOptions}
          />

          <Input
            label="Sponsor / Company Name"
            placeholder="e.g., TechGear Pro"
            value={formData.sponsorName}
            onChange={(e) => setFormData({ ...formData, sponsorName: e.target.value })}
            required
          />

          <Input
            label="Ad Title"
            placeholder="Enter catchy headline"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <Textarea
            label="Description (Optional)"
            placeholder="Enter ad description..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Banner Image URL"
              placeholder="https://example.com/banner.jpg"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            />
            <Input
              label="Logo URL (Optional)"
              placeholder="https://example.com/logo.png"
              value={formData.logoUrl}
              onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
            />
          </div>

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

          <Input
            label="Badge Text (Optional)"
            placeholder="e.g., 20% OFF, NEW, LIMITED"
            value={formData.badge}
            onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
          />

          <Select
            label="Background Gradient"
            value={formData.gradient}
            onChange={(e) => setFormData({ ...formData, gradient: e.target.value })}
            options={gradientOptions}
          />

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

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 rounded border-dark-600 bg-dark-800 text-cyan-500 focus:ring-cyan-500"
            />
            <span className="text-sm text-dark-200">Active (visible to users)</span>
          </label>

          <div className="flex gap-3 pt-4">
            <Link href="/admin/sponsored" className="flex-1">
              <Button variant="secondary" fullWidth>
                Cancel
              </Button>
            </Link>
            <Button type="submit" isLoading={isSubmitting} fullWidth className="flex-1">
              Update Ad
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
