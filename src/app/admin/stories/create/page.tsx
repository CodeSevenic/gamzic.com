'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, SparklesIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { createFeedStory, getMatches, getTournaments, getPosts } from '@/lib/firebase/db';
import { useAuthStore } from '@/store/authStore';
import { type FeedStoryType, type Match, type Tournament, type Post } from '@/types';

const storyTypeOptions = [
  { value: 'announcement', label: 'Announcement' },
  { value: 'highlight', label: 'Highlight' },
  { value: 'promotion', label: 'Promotion' },
  { value: 'update', label: 'Update' },
  { value: 'event', label: 'Event' },
];

const badgeColorOptions = [
  { value: '', label: 'No Badge' },
  { value: 'cyan', label: 'Cyan (Default)' },
  { value: 'red', label: 'Red (Urgent)' },
  { value: 'green', label: 'Green (Success)' },
  { value: 'yellow', label: 'Yellow (Warning)' },
  { value: 'purple', label: 'Purple (Special)' },
];

const linkTypeOptions = [
  { value: '', label: 'No Link' },
  { value: 'match', label: 'Match' },
  { value: 'tournament', label: 'Tournament' },
  { value: 'post', label: 'Post' },
  { value: 'user', label: 'User Profile' },
  { value: 'external', label: 'External URL' },
];

const gradientOptions = [
  { value: 'from-cyan-500/80 via-purple-500/60 to-pink-500/40', label: 'Cyan to Purple (Default)' },
  { value: 'from-red-500/80 via-orange-500/60 to-yellow-500/40', label: 'Red to Yellow (Hot)' },
  {
    value: 'from-green-500/80 via-emerald-500/60 to-teal-500/40',
    label: 'Green to Teal (Success)',
  },
  { value: 'from-purple-500/80 via-pink-500/60 to-red-500/40', label: 'Purple to Red (Premium)' },
  { value: 'from-blue-500/80 via-indigo-500/60 to-purple-500/40', label: 'Blue to Purple (Cool)' },
];

export default function CreateStoryPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [formData, setFormData] = useState({
    type: 'announcement' as FeedStoryType,
    title: '',
    subtitle: '',
    imageUrl: '',
    linkType: '',
    linkId: '',
    linkUrl: '',
    badge: '',
    badgeColor: '' as 'red' | 'yellow' | 'cyan' | 'purple' | 'green' | '',
    gradient: 'from-cyan-500/80 via-purple-500/60 to-pink-500/40',
    isActive: true,
    isPriority: false,
  });

  // Fetch existing content for dropdowns
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const [matchesResult, tournamentsResult, postsResult] = await Promise.all([
          getMatches(undefined, undefined, 50),
          getTournaments(undefined, undefined, 50),
          getPosts({}, 50),
        ]);
        setMatches(matchesResult.matches);
        setTournaments(tournamentsResult.tournaments);
        setPosts(postsResult.posts);
      } catch (error) {
        console.error('Error fetching content:', error);
      } finally {
        setIsLoadingContent(false);
      }
    };
    fetchContent();
  }, []);

  // Generate dropdown options based on link type
  const getContentOptions = () => {
    switch (formData.linkType) {
      case 'match':
        return [
          { value: '', label: 'Select a match...' },
          ...matches.map((m) => ({
            value: m.id,
            label: `${m.title} (${m.status})`,
          })),
        ];
      case 'tournament':
        return [
          { value: '', label: 'Select a tournament...' },
          ...tournaments.map((t) => ({
            value: t.id,
            label: `${t.name} (${t.status})`,
          })),
        ];
      case 'post':
        return [
          { value: '', label: 'Select a post...' },
          ...posts.map((p) => ({
            value: p.id,
            label: p.content.substring(0, 50) + (p.content.length > 50 ? '...' : ''),
          })),
        ];
      default:
        return [];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    setIsSubmitting(true);
    try {
      // Build the link URL based on link type
      let finalLinkUrl = formData.linkUrl;
      if (formData.linkType && formData.linkType !== 'external' && formData.linkId) {
        switch (formData.linkType) {
          case 'match':
            finalLinkUrl = `/matches/${formData.linkId}`;
            break;
          case 'tournament':
            finalLinkUrl = `/tournaments/${formData.linkId}`;
            break;
          case 'post':
            finalLinkUrl = `/feed#${formData.linkId}`;
            break;
          case 'user':
            finalLinkUrl = `/users/${formData.linkId}`;
            break;
        }
      }

      await createFeedStory({
        type: formData.type,
        title: formData.title.trim(),
        subtitle: formData.subtitle.trim() || undefined,
        imageUrl: formData.imageUrl.trim() || undefined,
        linkUrl: finalLinkUrl || undefined,
        linkType: formData.linkType
          ? (formData.linkType as 'match' | 'tournament' | 'post' | 'user' | 'external')
          : undefined,
        linkId: formData.linkId || undefined,
        badge: formData.badge.trim() || undefined,
        badgeColor: formData.badgeColor || undefined,
        gradient: formData.gradient,
        isActive: formData.isActive,
        isPriority: formData.isPriority,
        createdBy: user.id,
      });

      toast.success('Story created successfully!');
      router.push('/admin/stories');
    } catch (error) {
      console.error('Error creating story:', error);
      toast.error('Failed to create story');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/stories">
          <Button variant="secondary" size="sm">
            <ArrowLeftIcon className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <SparklesIcon className="w-7 h-7 text-cyber-yellow" />
            Create Story
          </h1>
          <p className="text-dark-400">Add a new story to the feed carousel</p>
        </div>
      </div>

      <Card variant="default" padding="lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Story Type */}
          <Select
            label="Story Type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as FeedStoryType })}
            options={storyTypeOptions}
          />

          {/* Title */}
          <Input
            label="Title"
            placeholder="Enter story title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          {/* Subtitle */}
          <Input
            label="Subtitle (Optional)"
            placeholder="Enter a short subtitle"
            value={formData.subtitle}
            onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
          />

          {/* Image URL */}
          <Input
            label="Image URL (Optional)"
            placeholder="https://example.com/image.jpg"
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            helperText="Background image for the story card"
          />

          {/* Link Type */}
          <Select
            label="Link To"
            value={formData.linkType}
            onChange={(e) => setFormData({ ...formData, linkType: e.target.value })}
            options={linkTypeOptions}
          />

          {/* Link selector based on type */}
          {formData.linkType &&
            formData.linkType !== 'external' &&
            formData.linkType !== 'user' && (
              <Select
                label={`Select ${
                  formData.linkType.charAt(0).toUpperCase() + formData.linkType.slice(1)
                }`}
                value={formData.linkId}
                onChange={(e) => setFormData({ ...formData, linkId: e.target.value })}
                options={getContentOptions()}
                disabled={isLoadingContent}
              />
            )}

          {/* User ID input (still manual since there could be many users) */}
          {formData.linkType === 'user' && (
            <Input
              label="User ID"
              placeholder="Enter user ID"
              value={formData.linkId}
              onChange={(e) => setFormData({ ...formData, linkId: e.target.value })}
              helperText="Enter the user's ID to link to their profile"
            />
          )}

          {formData.linkType === 'external' && (
            <Input
              label="External URL"
              placeholder="https://example.com"
              value={formData.linkUrl}
              onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
            />
          )}

          {/* Badge */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Badge Text (Optional)"
              placeholder="e.g., NEW, LIVE, HOT"
              value={formData.badge}
              onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
            />
            <Select
              label="Badge Color"
              value={formData.badgeColor}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  badgeColor: e.target.value as 'red' | 'yellow' | 'cyan' | 'purple' | 'green' | '',
                })
              }
              options={badgeColorOptions}
            />
          </div>

          {/* Gradient */}
          <Select
            label="Background Gradient"
            value={formData.gradient}
            onChange={(e) => setFormData({ ...formData, gradient: e.target.value })}
            options={gradientOptions}
          />

          {/* Options */}
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 rounded border-dark-600 bg-dark-800 text-cyan-500 focus:ring-cyan-500"
              />
              <span className="text-sm text-dark-200">Active (visible to users)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPriority}
                onChange={(e) => setFormData({ ...formData, isPriority: e.target.checked })}
                className="w-4 h-4 rounded border-dark-600 bg-dark-800 text-cyan-500 focus:ring-cyan-500"
              />
              <span className="text-sm text-dark-200">Priority (shows first)</span>
            </label>
          </div>

          {/* Preview */}
          {formData.title && (
            <div className="border-t border-dark-700 pt-6">
              <p className="text-sm text-dark-400 mb-3">Preview:</p>
              <div className="flex justify-center">
                <div className="w-24">
                  <div
                    className={`
                      relative w-24 h-24 rounded-2xl p-[3px]
                      bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500
                    `}
                  >
                    <div
                      className={`w-full h-full rounded-xl overflow-hidden bg-gradient-to-br ${formData.gradient} relative`}
                    >
                      {formData.imageUrl ? (
                        <img
                          src={formData.imageUrl}
                          alt={formData.title}
                          className="w-full h-full object-cover opacity-60"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <SparklesIcon className="w-8 h-8 text-white/60" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      {formData.badge && (
                        <div
                          className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold
                            ${
                              formData.badgeColor === 'red'
                                ? 'bg-red-500 text-white'
                                : formData.badgeColor === 'green'
                                ? 'bg-green-500 text-white'
                                : formData.badgeColor === 'purple'
                                ? 'bg-purple-500 text-white'
                                : formData.badgeColor === 'yellow'
                                ? 'bg-yellow-500 text-black'
                                : 'bg-cyan-500 text-white'
                            }`}
                        >
                          {formData.badge}
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-white font-medium truncate text-center">
                    {formData.title}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Link href="/admin/stories" className="flex-1">
              <Button variant="secondary" fullWidth>
                Cancel
              </Button>
            </Link>
            <Button type="submit" isLoading={isSubmitting} fullWidth className="flex-1">
              Create Story
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
