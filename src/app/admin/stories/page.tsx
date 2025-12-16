'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { getFeedStories, deleteFeedStory } from '@/lib/firebase/db';
import { type FeedStory } from '@/types';

const storyTypeLabels: Record<string, string> = {
  announcement: 'Announcement',
  highlight: 'Highlight',
  promotion: 'Promotion',
  update: 'Update',
  event: 'Event',
};

const storyTypeColors: Record<string, 'info' | 'success' | 'warning' | 'purple' | 'default'> = {
  announcement: 'info',
  highlight: 'warning',
  promotion: 'purple',
  update: 'default',
  event: 'success',
};

export default function AdminStoriesPage() {
  const [stories, setStories] = useState<FeedStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [storyToDelete, setStoryToDelete] = useState<FeedStory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const fetchedStories = await getFeedStories(false); // Get all, including inactive
        setStories(fetchedStories);
      } catch (error) {
        console.error('Error fetching stories:', error);
        toast.error('Failed to load stories');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStories();
  }, []);

  const handleDelete = async () => {
    if (!storyToDelete) return;

    setIsDeleting(true);
    try {
      await deleteFeedStory(storyToDelete.id);
      setStories((prev) => prev.filter((s) => s.id !== storyToDelete.id));
      toast.success('Story deleted');
      setDeleteModalOpen(false);
      setStoryToDelete(null);
    } catch (error) {
      toast.error('Failed to delete story');
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <SparklesIcon className="w-7 h-7 text-cyber-yellow" />
            Feed Stories
          </h1>
          <p className="text-dark-400">Manage stories that appear in the feed carousel</p>
        </div>
        <Link href="/admin/stories/create">
          <Button leftIcon={<PlusIcon className="w-5 h-5" />}>Create Story</Button>
        </Link>
      </div>

      {stories.length === 0 ? (
        <Card variant="glass" className="text-center py-12">
          <SparklesIcon className="w-16 h-16 mx-auto mb-4 text-dark-600" />
          <p className="text-dark-400 mb-4">No stories yet</p>
          <Link href="/admin/stories/create">
            <Button>Create Your First Story</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stories.map((story, index) => (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card variant="default" padding="none" className="overflow-hidden">
                {/* Preview Image */}
                <div className="relative h-32 bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
                  {story.imageUrl ? (
                    <img
                      src={story.imageUrl}
                      alt={story.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <SparklesIcon className="w-12 h-12 text-dark-600" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex gap-1">
                    <Badge variant={storyTypeColors[story.type] || 'default'} size="sm">
                      {storyTypeLabels[story.type] || story.type}
                    </Badge>
                  </div>
                  <div className="absolute top-2 right-2">
                    <Badge variant={story.isActive ? 'success' : 'default'} size="sm">
                      {story.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  {story.isPriority && (
                    <div className="absolute bottom-2 left-2">
                      <Badge variant="warning" size="sm">
                        ⭐ Priority
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-white mb-1 truncate">{story.title}</h3>
                  {story.subtitle && (
                    <p className="text-sm text-dark-400 mb-2 truncate">{story.subtitle}</p>
                  )}
                  {story.badge && (
                    <Badge
                      variant={
                        story.badgeColor === 'red'
                          ? 'danger'
                          : story.badgeColor === 'green'
                          ? 'success'
                          : story.badgeColor === 'yellow'
                          ? 'warning'
                          : story.badgeColor === 'purple'
                          ? 'purple'
                          : 'info'
                      }
                      size="sm"
                    >
                      {story.badge}
                    </Badge>
                  )}
                  <p className="text-xs text-dark-500 mt-2">
                    Created {format(story.createdAt, 'MMM d, yyyy')}
                  </p>
                </div>

                {/* Actions */}
                <div className="px-4 pb-4 flex gap-2">
                  <Link href={`/admin/stories/${story.id}/edit`} className="flex-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      fullWidth
                      leftIcon={<PencilIcon className="w-4 h-4" />}
                    >
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      setStoryToDelete(story);
                      setDeleteModalOpen(true);
                    }}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Story"
      >
        <p className="text-dark-300 mb-6">
          Are you sure you want to delete &quot;{storyToDelete?.title}&quot;? This action cannot be
          undone.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setDeleteModalOpen(false)} fullWidth>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} isLoading={isDeleting} fullWidth>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
