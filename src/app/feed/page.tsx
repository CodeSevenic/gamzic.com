'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FunnelIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { useAuthStore } from '@/store/authStore';
import { getPosts, getUser, reactToPost } from '@/lib/firebase/db';
import { formatDistanceToNow } from 'date-fns';
import { REACTION_EMOJIS, type Post, type User, type ReactionType, type AccountType } from '@/types';

const ACCOUNT_TYPE_BADGES: Record<AccountType | 'admin', { label: string; variant: 'purple' | 'info' | 'success' | 'warning' }> = {
  player: { label: '', variant: 'purple' },
  admin: { label: 'Admin', variant: 'purple' },
  business: { label: 'Business', variant: 'info' },
  sponsor: { label: 'Sponsor', variant: 'success' },
  organization: { label: 'Organization', variant: 'warning' },
};
import { PostComments } from '@/components/feed/PostComments';
import { useGames } from '@/hooks/useGames';
import Link from 'next/link';

export default function FeedPage() {
  const { user } = useAuthStore();
  const { games, gameOptions, getGameInfo } = useGames();
  const [posts, setPosts] = useState<Post[]>([]);
  const [authors, setAuthors] = useState<Record<string, User>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'school' | string>('all');
  const [selectedPost, setSelectedPost] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const filters: { schoolId?: string; game?: string } = {};
        
        if (filter === 'school' && user?.schoolId) {
          filters.schoolId = user.schoolId;
        } else if (filter !== 'all' && filter !== 'school') {
          filters.game = filter;
        }

        const { posts: fetchedPosts } = await getPosts(filters);
        setPosts(fetchedPosts);

        // Fetch authors (use authorId if set, otherwise createdBy)
        const authorIds = [...new Set(fetchedPosts.map((p) => p.authorId || p.createdBy))];
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
  }, [filter, user?.schoolId]);

  const handleReaction = async (postId: string, reactionType: ReactionType) => {
    if (!user) return;

    try {
      await reactToPost(postId, user.id, reactionType);
      
      // Update local state
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id !== postId) return post;
          
          const existingIndex = post.reactions.findIndex((r) => r.userId === user.id);
          const newReactions = [...post.reactions];
          
          if (existingIndex >= 0) {
            if (newReactions[existingIndex].type === reactionType) {
              newReactions.splice(existingIndex, 1);
            } else {
              newReactions[existingIndex] = { userId: user.id, type: reactionType, createdAt: new Date() };
            }
          } else {
            newReactions.push({ userId: user.id, type: reactionType, createdAt: new Date() });
          }
          
          return { ...post, reactions: newReactions };
        })
      );
    } catch (error) {
      console.error('Error reacting to post:', error);
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="max-w-3xl mx-auto p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Feed</h1>
        
        {/* Filter */}
        <div className="flex items-center gap-2">
          <FunnelIcon className="w-5 h-5 text-dark-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Posts</option>
            <option value="school">My School</option>
            {gameOptions.map((game) => (
              <option key={game.value} value={game.value}>
                {game.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <Card variant="glass" className="text-center py-12">
          <p className="text-dark-400">No posts yet. Check back soon!</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post, index) => {
            // Use authorId if set, otherwise fall back to createdBy
            const authorId = post.authorId || post.createdBy;
            const author = authors[authorId];
            const userReaction = post.reactions.find((r) => r.userId === user?.id);
            
            // Determine badge to show
            const badgeType = post.authorType || (author?.accountType !== 'player' ? author?.accountType : 'admin');
            const badgeInfo = ACCOUNT_TYPE_BADGES[badgeType || 'admin'];

            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card variant="default" padding="none" className="overflow-hidden">
                  {/* Post Header */}
                  <div className="p-4 flex items-center gap-3">
                    {author ? (
                      <Link href={`/users/${author.id}`} className="shrink-0">
                        <Avatar
                          src={author.avatar}
                          alt={author.displayName}
                          size="md"
                          className="cursor-pointer"
                        />
                      </Link>
                    ) : (
                      <Avatar
                        src={undefined}
                        alt="Admin"
                        size="md"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {author ? (
                          <Link 
                            href={`/users/${author.id}`}
                            className="font-semibold text-white hover:text-cyan-400 transition-colors"
                          >
                            {author.displayName}
                          </Link>
                        ) : (
                          <span className="font-semibold text-white">Admin</span>
                        )}
                        {badgeInfo.label && (
                          <Badge variant={badgeInfo.variant} size="sm">
                            {author?.isVerified && '✓ '}{badgeInfo.label}
                          </Badge>
                        )}
                      </div>
                      {author?.businessInfo?.companyName && (
                        <p className="text-xs text-cyan-400">{author.businessInfo.companyName}</p>
                      )}
                      <p className="text-sm text-dark-400">
                        {formatDistanceToNow(post.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                    {post.game && (
                      <Badge variant="info" size="sm">
                        {getGameInfo(post.game).name}
                      </Badge>
                    )}
                  </div>

                  {/* Post Content */}
                  <div className="px-4 pb-4">
                    <p className="text-dark-200 whitespace-pre-wrap">{post.content}</p>
                  </div>

                  {/* Post Image */}
                  {post.imageUrl && (
                    <div className="relative aspect-video">
                      <img
                        src={post.imageUrl}
                        alt="Post image"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* YouTube Video */}
                  {post.youtubeVideoId && (
                    <div className="relative aspect-video">
                      <iframe
                        src={`https://www.youtube.com/embed/${post.youtubeVideoId}`}
                        title="YouTube video"
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}

                  {/* Reactions & Comments */}
                  <div className="p-4 border-t border-dark-700">
                    <div className="flex items-center justify-between mb-3">
                      {/* Reaction Buttons */}
                      <div className="flex items-center gap-1">
                        {(Object.keys(REACTION_EMOJIS) as ReactionType[]).map((type) => {
                          const count = post.reactions.filter((r) => r.type === type).length;
                          const isActive = userReaction?.type === type;

                          return (
                            <button
                              key={type}
                              onClick={() => handleReaction(post.id, type)}
                              className={`
                                flex items-center gap-1 px-2 py-1 rounded-lg text-sm
                                transition-all duration-200
                                ${isActive
                                  ? 'bg-cyan-500/20 text-cyan-400'
                                  : 'hover:bg-dark-700 text-dark-400 hover:text-white'
                                }
                              `}
                            >
                              <span>{REACTION_EMOJIS[type]}</span>
                              {count > 0 && <span>{count}</span>}
                            </button>
                          );
                        })}
                      </div>

                      {/* Comment Count */}
                      <button
                        onClick={() => setSelectedPost(selectedPost === post.id ? null : post.id)}
                        className="text-sm text-dark-400 hover:text-cyan-400 transition-colors"
                      >
                        {post.commentCount} comments
                      </button>
                    </div>

                    {/* Comments Section */}
                    {selectedPost === post.id && (
                      <PostComments postId={post.id} />
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

