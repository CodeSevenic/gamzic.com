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
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { getPosts, deletePost, getUser } from '@/lib/firebase/db';
import { GAMES, type Post, type User } from '@/types';

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [authors, setAuthors] = useState<Record<string, User>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { posts: fetchedPosts } = await getPosts({}, 50);
        setPosts(fetchedPosts);

        // Fetch authors
        const authorIds = [...new Set(fetchedPosts.map((p) => p.createdBy))];
        const authorPromises = authorIds.map((id) => getUser(id));
        const authorResults = await Promise.all(authorPromises);

        const authorsMap: Record<string, User> = {};
        authorResults.forEach((author) => {
          if (author) {
            authorsMap[author.id] = author;
          }
        });
        setAuthors(authorsMap);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const handleDelete = async () => {
    if (!postToDelete) return;

    setIsDeleting(true);
    try {
      await deletePost(postToDelete.id);
      setPosts((prev) => prev.filter((p) => p.id !== postToDelete.id));
      toast.success('Post deleted');
      setDeleteModalOpen(false);
      setPostToDelete(null);
    } catch (error) {
      toast.error('Failed to delete post');
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
          <h1 className="text-2xl font-bold text-white">Posts</h1>
          <p className="text-dark-400">Manage platform content</p>
        </div>
        <Link href="/admin/posts/create">
          <Button leftIcon={<PlusIcon className="w-5 h-5" />}>
            Create Post
          </Button>
        </Link>
      </div>

      {posts.length === 0 ? (
        <Card variant="glass" className="text-center py-12">
          <p className="text-dark-400 mb-4">No posts yet</p>
          <Link href="/admin/posts/create">
            <Button>Create Your First Post</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post, index) => {
            const author = authors[post.createdBy];
            const game = post.game ? GAMES.find((g) => g.id === post.game) : null;

            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card variant="default" className="flex items-start gap-4">
                  {/* Thumbnail */}
                  {post.imageUrl ? (
                    <img
                      src={post.imageUrl}
                      alt=""
                      className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-lg bg-dark-700 flex items-center justify-center flex-shrink-0">
                      {game ? (
                        <span className="text-3xl">{game.icon}</span>
                      ) : (
                        <span className="text-3xl">📝</span>
                      )}
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white line-clamp-2 mb-2">{post.content}</p>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="text-dark-400">
                        By {author?.displayName || 'Admin'}
                      </span>
                      <span className="text-dark-600">•</span>
                      <span className="text-dark-400">
                        {format(post.createdAt, 'MMM d, yyyy h:mm a')}
                      </span>
                      {game && (
                        <Badge variant="info" size="sm">
                          {game.icon} {game.name}
                        </Badge>
                      )}
                      {post.isPinned && (
                        <Badge variant="warning" size="sm">Pinned</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-dark-500">
                      <span>{post.reactions.length} reactions</span>
                      <span>{post.commentCount} comments</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link href={`/admin/posts/${post.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <PencilIcon className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setPostToDelete(post);
                        setDeleteModalOpen(true);
                      }}
                      className="text-red-400 hover:text-red-300"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Post"
        size="sm"
      >
        <div className="p-6">
          <p className="text-dark-300 mb-6">
            Are you sure you want to delete this post? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} isLoading={isDeleting}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

