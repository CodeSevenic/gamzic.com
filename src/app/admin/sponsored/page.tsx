'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, MegaphoneIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { getSponsoredContent, deleteSponsoredContent } from '@/lib/firebase/db';
import { type SponsoredContent } from '@/types';

const contentTypeLabels: Record<string, string> = {
  banner: 'Banner Ad',
  native: 'Native Ad',
  promotion: 'Promotion',
  featured: 'Featured',
};

const contentTypeColors: Record<string, 'info' | 'success' | 'warning' | 'purple' | 'default'> = {
  banner: 'info',
  native: 'default',
  promotion: 'warning',
  featured: 'purple',
};

export default function AdminSponsoredPage() {
  const [content, setContent] = useState<SponsoredContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [contentToDelete, setContentToDelete] = useState<SponsoredContent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const fetchedContent = await getSponsoredContent(false);
        setContent(fetchedContent);
      } catch (error) {
        console.error('Error fetching sponsored content:', error);
        toast.error('Failed to load sponsored content');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, []);

  const handleDelete = async () => {
    if (!contentToDelete) return;

    setIsDeleting(true);
    try {
      await deleteSponsoredContent(contentToDelete.id);
      setContent((prev) => prev.filter((c) => c.id !== contentToDelete.id));
      toast.success('Sponsored content deleted');
      setDeleteModalOpen(false);
      setContentToDelete(null);
    } catch (error) {
      toast.error('Failed to delete sponsored content');
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
            <MegaphoneIcon className="w-7 h-7 text-cyan-400" />
            Sponsored Content
          </h1>
          <p className="text-dark-400">Manage ads and promotions in the feed</p>
        </div>
        <Link href="/admin/sponsored/create">
          <Button leftIcon={<PlusIcon className="w-5 h-5" />}>Create Ad</Button>
        </Link>
      </div>

      {content.length === 0 ? (
        <Card variant="glass" className="text-center py-12">
          <MegaphoneIcon className="w-16 h-16 mx-auto mb-4 text-dark-600" />
          <p className="text-dark-400 mb-4">No sponsored content yet</p>
          <Link href="/admin/sponsored/create">
            <Button>Create Your First Ad</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {content.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card variant="default" padding="none" className="overflow-hidden">
                {/* Preview Image */}
                <div className="relative h-32 bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : item.logoUrl ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <img
                        src={item.logoUrl}
                        alt={item.sponsorName}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MegaphoneIcon className="w-12 h-12 text-dark-600" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex gap-1">
                    <Badge variant={contentTypeColors[item.type] || 'default'} size="sm">
                      {contentTypeLabels[item.type] || item.type}
                    </Badge>
                  </div>
                  <div className="absolute top-2 right-2">
                    <Badge variant={item.isActive ? 'success' : 'default'} size="sm">
                      {item.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-white mb-1 truncate">{item.title}</h3>
                  <p className="text-sm text-cyan-400 mb-2">{item.sponsorName}</p>
                  {item.description && (
                    <p className="text-sm text-dark-400 mb-2 line-clamp-2">{item.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-dark-500">
                    <span>CTA: {item.ctaText || 'Learn More'}</span>
                  </div>
                  <p className="text-xs text-dark-500 mt-2">
                    Created {format(item.createdAt, 'MMM d, yyyy')}
                  </p>
                </div>

                {/* Actions */}
                <div className="px-4 pb-4 flex gap-2">
                  <Link href={`/admin/sponsored/${item.id}/edit`} className="flex-1">
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
                      setContentToDelete(item);
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
        title="Delete Sponsored Content"
      >
        <p className="text-dark-300 mb-6">
          Are you sure you want to delete &quot;{contentToDelete?.title}&quot;? This action cannot
          be undone.
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
