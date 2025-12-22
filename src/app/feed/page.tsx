'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FunnelIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { useAuthStore } from '@/store/authStore';
import {
  getPosts,
  getUser,
  reactToPost,
  getMatches,
  getTournaments,
  getFeedStories,
  getSponsoredContent,
} from '@/lib/firebase/db';
import { formatDistanceToNow } from 'date-fns';
import {
  REACTION_EMOJIS,
  type Post,
  type User,
  type ReactionType,
  type AccountType,
  type Match,
  type Tournament,
  type FeedStory,
  type SponsoredContent as SponsoredContentType,
} from '@/types';

// Feed Components
import { Stories } from '@/components/feed/Stories';
import { LiveMatchCard } from '@/components/feed/LiveMatchCard';
import { TournamentSpotlight, TournamentRow } from '@/components/feed/TournamentSpotlight';
import { SponsoredContent, SponsoredMini } from '@/components/feed/SponsoredContent';
import { PostComments } from '@/components/feed/PostComments';
import { ImageGallery } from '@/components/ui/ImageGallery';
import { useGames } from '@/hooks/useGames';
import Link from 'next/link';

const ACCOUNT_TYPE_BADGES: Record<
  AccountType | 'admin',
  { label: string; variant: 'purple' | 'info' | 'success' | 'warning' }
> = {
  player: { label: '', variant: 'purple' },
  admin: { label: 'Admin', variant: 'purple' },
  business: { label: 'Business', variant: 'info' },
  sponsor: { label: 'Sponsor', variant: 'success' },
  organization: { label: 'Organization', variant: 'warning' },
};

// Types for mixed feed content
type FeedItemType = 'post' | 'live_match' | 'tournament' | 'sponsored' | 'quick_matches';

interface FeedItem {
  type: FeedItemType;
  id: string;
  data: Post | Match | Tournament | SponsoredContentType | null;
  priority: number;
}

export default function FeedPage() {
  const { user } = useAuthStore();
  const { games, gameOptions, getGameInfo } = useGames();
  const [posts, setPosts] = useState<Post[]>([]);
  const [authors, setAuthors] = useState<Record<string, User>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'school' | string>('all');
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [dismissedAds, setDismissedAds] = useState<Set<string>>(new Set());

  // Real data from database
  const [feedStories, setFeedStories] = useState<FeedStory[]>([]);
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [sponsoredContent, setSponsoredContent] = useState<SponsoredContentType[]>([]);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Fetch core data first (posts, matches, tournaments) - these should always work
        const [postsResult, matchesResult, tournamentsResult] = await Promise.all([
          getPosts({
            schoolId: filter === 'school' && user?.schoolId ? user.schoolId : undefined,
            game: filter !== 'all' && filter !== 'school' ? filter : undefined,
          }),
          getMatches(undefined, undefined, 20),
          getTournaments(undefined, undefined, 10),
        ]);

        setPosts(postsResult.posts);

        // Separate live, featured, and upcoming matches
        const live = matchesResult.matches.filter((m) => m.status === 'in_progress');
        const featured = matchesResult.matches.filter(
          (m) => m.isFeatured && m.status !== 'completed' && m.status !== 'cancelled'
        );
        const upcoming = matchesResult.matches.filter(
          (m) => m.status === 'open' || m.status === 'scheduled'
        );
        // Combine live and featured (live takes priority) for prominent display
        const prominentMatches = [...live, ...featured.filter((f) => !live.some((l) => l.id === f.id))];
        setLiveMatches(prominentMatches);
        setUpcomingMatches(upcoming);

        // Filter tournaments with open registration or in progress
        const activeTournaments = tournamentsResult.tournaments.filter(
          (t) => t.status === 'registration' || t.status === 'in_progress'
        );
        setTournaments(activeTournaments);

        // Fetch authors for posts
        const authorIds = [...new Set(postsResult.posts.map((p) => p.authorId || p.createdBy))];
        const authorPromises = authorIds.map((id) => getUser(id));
        const authorResults = await Promise.all(authorPromises);

        const authorsMap: Record<string, User> = {};
        authorResults.forEach((author) => {
          if (author) {
            authorsMap[author.id] = author;
          }
        });
        setAuthors(authorsMap);

        // Fetch new optional data separately - these can fail without breaking the feed
        try {
          const [storiesResult, sponsoredResult] = await Promise.all([
            getFeedStories(true),
            getSponsoredContent(true),
          ]);
          setFeedStories(storiesResult);
          setSponsoredContent(sponsoredResult);
        } catch (optionalError) {
          console.error('Error fetching optional feed data:', optionalError);
          // Continue without this data - feed will still work
        }
      } catch (error) {
        console.error('Error fetching feed data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [filter, user?.schoolId]);

  // Create mixed feed content - all real data, diverse content types
  const mixedFeed = useMemo(() => {
    const items: FeedItem[] = [];

    // Filter sponsored content based on placement and settings
    const activeSponsored = sponsoredContent
      .filter((ad) => {
        // Must not be dismissed
        if (dismissedAds.has(ad.id)) return false;
        // Must be active
        if (!ad.isActive) return false;
        // Check placement (default to 'feed' if not specified)
        const placements = ad.placements || ['feed'];
        if (!placements.includes('feed')) return false;
        // Check minPostsRequired (default to 0)
        const minPosts = ad.minPostsRequired ?? 0;
        if (posts.length < minPosts) return false;
        // Check showOnEmptyFeed (default to true)
        if (posts.length === 0 && ad.showOnEmptyFeed === false) return false;
        return true;
      })
      .sort((a, b) => (b.priority || 5) - (a.priority || 5));

    // Separate ads by position preference
    const topAds = activeSponsored.filter((ad) => ad.position === 'top');
    const middleAds = activeSponsored.filter((ad) => ad.position === 'middle');
    const bottomAds = activeSponsored.filter((ad) => ad.position === 'bottom');
    const anywhereAds = activeSponsored.filter((ad) => !ad.position || ad.position === 'anywhere');

    // Track which ads we've used
    const usedAdIds = new Set<string>();
    let itemCount = 0;

    // Helper to add an ad and mark it as used
    const addAd = (ad: SponsoredContentType, priorityVal: number) => {
      if (usedAdIds.has(ad.id)) return false;
      items.push({
        type: 'sponsored',
        id: `sponsored-${ad.id}`,
        data: ad,
        priority: priorityVal,
      });
      usedAdIds.add(ad.id);
      itemCount++;
      return true;
    };

    // 1. Featured/Live matches go first (most important for engagement)
    liveMatches.forEach((match) => {
      items.push({
        type: 'live_match',
        id: `live-match-${match.id}`,
        data: match,
        priority: -100,
      });
      itemCount++;
    });

    // 2. TOP positioned ads (show at the very beginning)
    topAds.forEach((ad, idx) => addAd(ad, -90 + idx));

    // 3. First sponsored content if we have any and no live matches
    // This ensures at least one ad shows even with few posts
    if (anywhereAds.length > 0 && liveMatches.length === 0 && topAds.length === 0) {
      addAd(anywhereAds[0], -50);
    }

    // 4. First tournament if any
    if (tournaments.length > 0) {
      items.push({
        type: 'tournament',
        id: 'tournament-spotlight',
        data: tournaments[0],
        priority: -40,
      });
      itemCount++;
    }

    // 5. Mix in posts with other content
    const totalPosts = posts.length;
    posts.forEach((post, index) => {
      items.push({
        type: 'post',
        id: post.id,
        data: post,
        priority: index,
      });
      itemCount++;

      // Insert quick matches section after 2nd post (or at end if fewer posts)
      if ((index === 2 || (totalPosts <= 2 && index === totalPosts - 1)) && upcomingMatches.length > 0) {
        items.push({
          type: 'quick_matches',
          id: 'quick-matches',
          data: null,
          priority: index + 0.2,
        });
      }

      // MIDDLE positioned ads - show after first few posts
      if (index === 1 && middleAds.length > 0) {
        middleAds.forEach((ad, idx) => addAd(ad, index + 0.25 + idx * 0.01));
      }

      // Insert "anywhere" ads based on frequency
      // But also ensure at least one shows if we have few posts
      const unusedAnywhereAds = anywhereAds.filter((ad) => !usedAdIds.has(ad.id));
      if (unusedAnywhereAds.length > 0) {
        const currentAd = unusedAnywhereAds[0];
        const adFrequency = currentAd.frequency || 5;

        // Show ad at frequency intervals OR if this is the last post and no ads shown yet
        const isLastPost = index === totalPosts - 1;
        const noAdsShownYet = usedAdIds.size === 0;
        const frequencyMatch = (index + 1) % adFrequency === 0;
        const shouldShowAd = frequencyMatch || (isLastPost && noAdsShownYet && totalPosts >= 1);

        if (shouldShowAd) {
          addAd(currentAd, index + 0.3);
        }
      }

      // Insert more tournaments later in the feed
      if (index === 5 && tournaments.length > 1) {
        items.push({
          type: 'tournament',
          id: `tournament-${tournaments[1].id}`,
          data: tournaments[1],
          priority: index + 0.4,
        });
      }
    });

    // 6. BOTTOM positioned ads
    bottomAds.forEach((ad, idx) => addAd(ad, 50 + idx));

    // 7. If no posts at all, still show content
    if (posts.length === 0) {
      // Add any remaining sponsored content
      anywhereAds.filter((ad) => !usedAdIds.has(ad.id)).forEach((ad, idx) => {
        addAd(ad, 100 + idx);
      });

      // Add upcoming matches
      if (upcomingMatches.length > 0) {
        items.push({
          type: 'quick_matches',
          id: 'quick-matches',
          data: null,
          priority: 200,
        });
      }

      // Add more tournaments
      tournaments.slice(1).forEach((tournament, idx) => {
        items.push({
          type: 'tournament',
          id: `tournament-${tournament.id}`,
          data: tournament,
          priority: 300 + idx,
        });
      });
    }

    return items;
  }, [
    posts,
    liveMatches,
    upcomingMatches,
    tournaments,
    sponsoredContent,
    dismissedAds,
  ]);

  const handleReaction = async (postId: string, reactionType: ReactionType) => {
    if (!user) return;

    try {
      await reactToPost(postId, user.id, reactionType);

      setPosts((prev) =>
        prev.map((post) => {
          if (post.id !== postId) return post;

          const existingIndex = post.reactions.findIndex((r) => r.userId === user.id);
          const newReactions = [...post.reactions];

          if (existingIndex >= 0) {
            if (newReactions[existingIndex].type === reactionType) {
              newReactions.splice(existingIndex, 1);
            } else {
              newReactions[existingIndex] = {
                userId: user.id,
                type: reactionType,
                createdAt: new Date(),
              };
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

  const handleDismissAd = (adId: string) => {
    setDismissedAds((prev) => new Set([...prev, adId]));
  };

  if (isLoading) {
    return <PageLoader />;
  }

  // Check if we have any stories content to show
  const hasStoriesContent =
    feedStories.length > 0 || liveMatches.length > 0 || tournaments.length > 0;

  // Filter sponsored content for stories placement
  const storiesAds = sponsoredContent.filter((ad) => {
    const placements = ad.placements || ['feed'];
    return placements.includes('stories') && ad.isActive;
  });

  return (
    <div className="max-w-3xl mx-auto p-4 lg:p-6">
      {/* Stories Section - only show if there's content */}
      {(hasStoriesContent || storiesAds.length > 0) && (
        <Stories
          stories={feedStories}
          liveMatches={liveMatches}
          upcomingTournaments={tournaments}
          sponsoredAds={storiesAds}
          getGameInfo={getGameInfo}
        />
      )}

      {/* Header with Filter */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-cyan-400" />
          Your Feed
        </h1>

        <div className="flex items-center gap-2">
          <FunnelIcon className="w-4 h-4 text-dark-400" />
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

      {/* Mixed Content Feed */}
      {mixedFeed.length === 0 ? (
        <Card variant="glass" className="text-center py-12">
          <p className="text-dark-400">No posts yet. Check back soon!</p>
        </Card>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {mixedFeed.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: Math.min(index * 0.05, 0.5) }}
                layout
              >
                {/* Live Match Card */}
                {item.type === 'live_match' && item.data && (
                  <div className="mb-2">
                    <p className="text-xs text-red-400 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      Live Now
                    </p>
                    <LiveMatchCard
                      match={item.data as Match}
                      getGameInfo={getGameInfo}
                      variant="featured"
                    />
                  </div>
                )}

                {/* Tournament Spotlight */}
                {item.type === 'tournament' && item.data && (
                  <TournamentSpotlight
                    tournament={item.data as Tournament}
                    getGameInfo={getGameInfo}
                    variant="featured"
                  />
                )}

                {/* Quick Matches Section */}
                {item.type === 'quick_matches' && upcomingMatches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-dark-300 uppercase tracking-wider">
                        🎮 Quick Matches
                      </h3>
                      <Link href="/matches" className="text-xs text-cyan-400 hover:text-cyan-300">
                        View All →
                      </Link>
                    </div>
                    <div className="space-y-2">
                      {upcomingMatches.slice(0, 3).map((match) => (
                        <LiveMatchCard
                          key={match.id}
                          match={match}
                          getGameInfo={getGameInfo}
                          variant="compact"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Sponsored Content - only real ads */}
                {item.type === 'sponsored' && item.data && (() => {
                  const ad = item.data as SponsoredContentType;
                  // Map displaySize to component variant
                  const variantMap: Record<string, 'default' | 'inline' | 'card'> = {
                    full: 'default',
                    compact: 'card',
                    inline: 'inline',
                  };
                  const variant = variantMap[ad.displaySize || 'full'] || 'default';
                  return (
                    <SponsoredContent
                      item={ad}
                      onDismiss={handleDismissAd}
                      variant={variant}
                    />
                  );
                })()}

                {/* Regular Post */}
                {item.type === 'post' && item.data && (
                  <PostCard
                    post={item.data as Post}
                    author={authors[(item.data as Post).authorId || (item.data as Post).createdBy]}
                    user={user}
                    selectedPost={selectedPost}
                    setSelectedPost={setSelectedPost}
                    handleReaction={handleReaction}
                    getGameInfo={getGameInfo}
                  />
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Tournament Row at bottom - only if we have more tournaments */}
          {tournaments.length > 1 && (
            <TournamentRow
              tournaments={tournaments.slice(1, 4)}
              getGameInfo={getGameInfo}
              title="More Tournaments"
            />
          )}

          {/* Sponsored Mini at end - only if no ads shown */}
          <SponsoredMini hasAds={sponsoredContent.length > 0} />
        </div>
      )}
    </div>
  );
}

// Extracted Post Card component for cleaner code
function PostCard({
  post,
  author,
  user,
  selectedPost,
  setSelectedPost,
  handleReaction,
  getGameInfo,
}: {
  post: Post;
  author?: User;
  user: User | null;
  selectedPost: string | null;
  setSelectedPost: (id: string | null) => void;
  handleReaction: (postId: string, reactionType: ReactionType) => void;
  getGameInfo: (gameId: string) => { name: string; icon: string };
}) {
  const userReaction = post.reactions.find((r) => r.userId === user?.id);
  const badgeType =
    post.authorType || (author?.accountType !== 'player' ? author?.accountType : 'admin');
  const badgeInfo = ACCOUNT_TYPE_BADGES[badgeType || 'admin'];

  return (
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
          <Avatar src={undefined} alt="Admin" size="md" />
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
                {author?.isVerified && '✓ '}
                {badgeInfo.label}
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

      {/* Post Images */}
      {(post.images && post.images.length > 0) || post.imageUrl ? (
        <ImageGallery
          images={post.images && post.images.length > 0 ? post.images : [post.imageUrl!]}
          alt="Post image"
        />
      ) : null}

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
                    transition-all duration-200 cursor-pointer
                    ${
                      isActive
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
            className="text-sm text-dark-400 hover:text-cyan-400 transition-colors cursor-pointer"
          >
            {post.commentCount} comments
          </button>
        </div>

        {/* Comments Section */}
        {selectedPost === post.id && <PostComments postId={post.id} />}
      </div>
    </Card>
  );
}
