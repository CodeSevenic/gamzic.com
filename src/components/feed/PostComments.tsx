'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { PaperAirplaneIcon, FlagIcon } from '@heroicons/react/24/outline';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { getComments, createComment, reportComment, getUser } from '@/lib/firebase/db';
import { formatDistanceToNow } from 'date-fns';
import type { Comment, User } from '@/types';

interface PostCommentsProps {
  postId: string;
}

export function PostComments({ postId }: PostCommentsProps) {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [authors, setAuthors] = useState<Record<string, User>>({});
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const fetchedComments = await getComments(postId);
        setComments(fetchedComments);

        // Fetch authors
        const authorIds = [...new Set(fetchedComments.map((c) => c.userId))];
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
        console.error('Error fetching comments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComments();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const commentId = await createComment({
        postId,
        userId: user.id,
        content: newComment.trim(),
        reactions: [],
        mentions: [],
        isReported: false,
      });

      const newCommentObj: Comment = {
        id: commentId,
        postId,
        userId: user.id,
        content: newComment.trim(),
        reactions: [],
        mentions: [],
        isReported: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setComments((prev) => [...prev, newCommentObj]);
      setAuthors((prev) => ({ ...prev, [user.id]: user }));
      setNewComment('');
      toast.success('Comment posted!');
    } catch (error) {
      toast.error('Failed to post comment');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReport = async (commentId: string) => {
    try {
      await reportComment(commentId);
      toast.success('Comment reported');
    } catch (error) {
      toast.error('Failed to report comment');
      console.error(error);
    }
  };

  return (
    <div className="border-t border-dark-700 pt-4 mt-4">
      {/* Comment Form */}
      {user ? (
        <form onSubmit={handleSubmit} className="flex items-start gap-3 mb-4">
          <Avatar src={user.avatar} alt={user.displayName} size="sm" />
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-cyan-500"
            />
            <Button
              type="submit"
              size="sm"
              isLoading={isSubmitting}
              disabled={!newComment.trim()}
            >
              <PaperAirplaneIcon className="w-4 h-4" />
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-dark-400 text-center py-2">
          Sign in to comment
        </p>
      )}

      {/* Comments List */}
      {isLoading ? (
        <p className="text-sm text-dark-400 text-center py-4">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-dark-400 text-center py-4">No comments yet</p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment, index) => {
            const author = authors[comment.userId];

            return (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-3 group"
              >
                <Avatar
                  src={author?.avatar}
                  alt={author?.displayName || 'User'}
                  size="sm"
                />
                <div className="flex-1 bg-dark-700/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white">
                      {author?.displayName || 'User'}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-dark-500">
                        {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                      </span>
                      {user && user.id !== comment.userId && (
                        <button
                          onClick={() => handleReport(comment.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-dark-500 hover:text-red-400 transition-all"
                          title="Report comment"
                        >
                          <FlagIcon className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-dark-200">{comment.content}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

