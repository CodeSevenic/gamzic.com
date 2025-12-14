'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  TrophyIcon,
  UserGroupIcon,
  AcademicCapIcon,
  CalendarDaysIcon,
  PlayIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { useAuthStore } from '@/store/authStore';
import { getUser, getSchool, getTeam, getTournament, getMatches, getGames, getPostsByAuthor } from '@/lib/firebase/db';
import { type User, type School, type Team, type Tournament, type Match, type Game, type Post, REACTION_EMOJIS, type ReactionType } from '@/types';
import { formatDistanceToNow } from 'date-fns';

const ROLE_LABELS: Record<string, string> = {
  player: 'Player',
  moderator: 'Moderator',
  admin: 'Admin',
  super_admin: 'Super Admin',
};

const ROLE_COLORS: Record<string, 'default' | 'info' | 'purple' | 'warning'> = {
  player: 'default',
  moderator: 'info',
  admin: 'purple',
  super_admin: 'warning',
};

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  player: '',
  business: 'Business',
  sponsor: 'Sponsor',
  organization: 'Organization',
};

const ACCOUNT_TYPE_COLORS: Record<string, 'default' | 'info' | 'success' | 'warning'> = {
  player: 'default',
  business: 'info',
  sponsor: 'success',
  organization: 'warning',
};

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [fetchedUser, fetchedGames] = await Promise.all([
          getUser(userId),
          getGames(true),
        ]);

        if (!fetchedUser) {
          router.push('/');
          return;
        }

        setUser(fetchedUser);
        setGames(fetchedGames);

        // Fetch school
        if (fetchedUser.schoolId) {
          const fetchedSchool = await getSchool(fetchedUser.schoolId);
          setSchool(fetchedSchool);
        }

        // Fetch teams
        if (fetchedUser.teamsJoined && fetchedUser.teamsJoined.length > 0) {
          const teamPromises = fetchedUser.teamsJoined.slice(0, 5).map((id) => getTeam(id));
          const teamResults = await Promise.all(teamPromises);
          setTeams(teamResults.filter((t): t is Team => t !== null));
        }

        // Fetch tournaments
        if (fetchedUser.tournamentsJoined && fetchedUser.tournamentsJoined.length > 0) {
          const tournamentPromises = fetchedUser.tournamentsJoined.slice(0, 5).map((id) => getTournament(id));
          const tournamentResults = await Promise.all(tournamentPromises);
          setTournaments(tournamentResults.filter((t): t is Tournament => t !== null));
        }

        // Fetch recent matches where user participated
        const { matches } = await getMatches(undefined, undefined, 50);
        const userMatches = matches.filter((m) => 
          m.participants?.some((p) => p.oduserId === userId)
        ).slice(0, 5);
        setRecentMatches(userMatches);

        // Fetch user's posts
        const { posts: userPosts } = await getPostsByAuthor(userId, 10);
        setPosts(userPosts);

      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [userId, router]);

  const getGameInfo = (gameId: string) => {
    const game = games.find((g) => g.id === gameId);
    return game ? { name: game.name, icon: game.icon } : { name: gameId, icon: '🎮' };
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (!user) {
    return null;
  }

  const winRate = user.stats.matches > 0 
    ? Math.round((user.stats.wins / user.stats.matches) * 100) 
    : 0;

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-6">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-dark-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        <span>Back</span>
      </button>

      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card variant="glass" className="mb-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <Avatar src={user.avatar} alt={user.displayName} size="xl" />

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2 flex-wrap">
                <h1 className="text-2xl font-bold text-white">{user.displayName}</h1>
                {/* Account type badge (for non-players) */}
                {user.accountType && user.accountType !== 'player' && (
                  <Badge variant={ACCOUNT_TYPE_COLORS[user.accountType] || 'default'}>
                    {ACCOUNT_TYPE_LABELS[user.accountType]}
                    {user.isVerified && ' ✓'}
                  </Badge>
                )}
                {/* Role badge (for staff) */}
                {user.role !== 'player' && (
                  <Badge variant={ROLE_COLORS[user.role] || 'default'}>
                    {ROLE_LABELS[user.role] || user.role}
                  </Badge>
                )}
              </div>
              
              {/* Business info */}
              {user.businessInfo?.companyName && (
                <p className="text-cyan-400 font-medium mb-1">{user.businessInfo.companyName}</p>
              )}
              
              <p className="text-dark-400 mb-2">{user.fullName}</p>
              
              {school && (
                <Link href={`/schools/${school.id}`} className="inline-flex items-center gap-1 text-cyan-400 hover:underline">
                  <AcademicCapIcon className="w-4 h-4" />
                  {school.name}
                </Link>
              )}
              
              {/* Business website */}
              {user.businessInfo?.website && (
                <a 
                  href={user.businessInfo.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-purple-400 hover:underline mt-1"
                >
                  🌐 {user.businessInfo.website}
                </a>
              )}
              
              {user.bio && (
                <p className="text-dark-300 mt-3">{user.bio}</p>
              )}
              
              {/* Business description */}
              {user.businessInfo?.description && !user.bio && (
                <p className="text-dark-300 mt-3">{user.businessInfo.description}</p>
              )}
              
              <p className="text-xs text-dark-500 mt-3">
                {user.accountType && user.accountType !== 'player' ? 'On Gamzic' : 'Member'} since {format(user.createdAt, 'MMMM yyyy')}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 py-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{user.stats.matches}</p>
                <p className="text-xs text-dark-500">Matches</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{user.stats.wins}</p>
                <p className="text-xs text-dark-500">Wins</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-400">{user.stats.losses}</p>
                <p className="text-xs text-dark-500">Losses</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-cyber-yellow">{user.stats.tournamentWins}</p>
                <p className="text-xs text-dark-500">🏆</p>
              </div>
            </div>

            {/* Actions */}
            {isOwnProfile && (
              <div className="flex flex-col gap-2">
                <Link href="/settings">
                  <Button variant="secondary" size="sm">
                    Edit Profile
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Win Rate Bar */}
          <div className="mt-6 pt-4 border-t border-dark-700">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-dark-400">Win Rate</span>
              <span className="text-white font-medium">{winRate}%</span>
            </div>
            <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-500 to-green-500"
                initial={{ width: 0 }}
                animate={{ width: `${winRate}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>
        </Card>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Game IDs */}
        <Card variant="default">
          <h2 className="text-lg font-semibold text-white mb-4">Game IDs</h2>
          
          {Object.keys(user.gameTags || {}).filter(key => user.gameTags[key]).length === 0 ? (
            <p className="text-dark-400 text-center py-4">No game IDs added</p>
          ) : (
            <div className="space-y-3">
              {games.filter((game) => user.gameTags?.[game.id]).map((game) => (
                <div
                  key={game.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-dark-700/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{game.icon}</span>
                    <span className="text-white">{game.name}</span>
                  </div>
                  <span className="text-cyan-400 font-mono text-sm">{user.gameTags[game.id]}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Teams */}
        <Card variant="default">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <UserGroupIcon className="w-5 h-5 text-purple-400" />
            Teams ({teams.length})
          </h2>

          {teams.length === 0 ? (
            <p className="text-dark-400 text-center py-4">No teams joined</p>
          ) : (
            <div className="space-y-3">
              {teams.map((team) => {
                const game = getGameInfo(team.game);
                return (
                  <Link
                    key={team.id}
                    href={`/teams/${team.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-dark-700/50 hover:bg-dark-700 transition-colors"
                  >
                    {team.logo ? (
                      <img
                        src={team.logo}
                        alt={team.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                        <span className="font-bold text-white">{team.name.charAt(0)}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{team.name}</p>
                      <p className="text-sm text-dark-400">{game.icon} {game.name}</p>
                    </div>
                    {team.captainId === user.id && (
                      <Badge variant="warning" size="sm">Captain</Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        {/* Recent Matches */}
        <Card variant="default">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <PlayIcon className="w-5 h-5 text-green-400" />
            Recent Matches
          </h2>

          {recentMatches.length === 0 ? (
            <p className="text-dark-400 text-center py-4">No matches played</p>
          ) : (
            <div className="space-y-3">
              {recentMatches.map((match) => {
                const game = getGameInfo(match.game);
                const userParticipant = match.participants?.find((p) => p.oduserId === userId);
                const isWinner = match.winnerId === userId;
                const score = match.scores?.[userId];
                
                return (
                  <Link
                    key={match.id}
                    href={`/matches/${match.id}`}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      isWinner 
                        ? 'bg-green-500/10 border border-green-500/30 hover:bg-green-500/20'
                        : match.status === 'completed' && match.winnerId && !isWinner
                          ? 'bg-red-500/10 border border-red-500/30 hover:bg-red-500/20'
                          : 'bg-dark-700/50 hover:bg-dark-700'
                    }`}
                  >
                    <span className="text-2xl">{game.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{match.title}</p>
                      <p className="text-sm text-dark-400">{game.name}</p>
                    </div>
                    {match.status === 'completed' && (
                      <div className="text-right">
                        {isWinner ? (
                          <Badge variant="success" size="sm">Won 🏆</Badge>
                        ) : match.winnerId ? (
                          <Badge variant="danger" size="sm">Lost</Badge>
                        ) : (
                          <Badge variant="default" size="sm">Draw</Badge>
                        )}
                        {score !== undefined && (
                          <p className="text-xs text-dark-400 mt-1">Score: {score}</p>
                        )}
                      </div>
                    )}
                    {match.status === 'in_progress' && (
                      <Badge variant="warning" size="sm">Live</Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        {/* Tournament History */}
        <Card variant="default">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrophyIcon className="w-5 h-5 text-cyber-yellow" />
            Tournaments ({tournaments.length})
          </h2>

          {tournaments.length === 0 ? (
            <p className="text-dark-400 text-center py-4">No tournaments joined</p>
          ) : (
            <div className="space-y-3">
              {tournaments.map((tournament) => {
                const game = getGameInfo(tournament.game);
                return (
                  <Link
                    key={tournament.id}
                    href={`/tournaments/${tournament.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-dark-700/50 hover:bg-dark-700 transition-colors"
                  >
                    <span className="text-2xl">{game.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{tournament.title}</p>
                      <p className="text-sm text-dark-400">{game.name}</p>
                    </div>
                    <Badge
                      variant={tournament.status === 'completed' ? 'info' : tournament.status === 'in_progress' ? 'warning' : 'success'}
                      size="sm"
                    >
                      {tournament.status}
                    </Badge>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Posts Section - Always show for users who can post (admins, business accounts, etc.) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6"
      >
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <CalendarDaysIcon className="w-6 h-6 text-cyan-400" />
          Posts {posts.length > 0 && `(${posts.length})`}
        </h2>
        
        {posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card variant="default" padding="none" className="overflow-hidden">
                  {/* Post Header */}
                  <div className="p-4 flex items-center gap-3">
                    <Avatar src={user.avatar} alt={user.displayName} size="md" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{user.displayName}</span>
                        {user.accountType && user.accountType !== 'player' && (
                          <Badge variant={ACCOUNT_TYPE_COLORS[user.accountType]} size="sm">
                            {ACCOUNT_TYPE_LABELS[user.accountType]}
                          </Badge>
                        )}
                        {user.role !== 'player' && (!user.accountType || user.accountType === 'player') && (
                          <Badge variant={ROLE_COLORS[user.role]} size="sm">
                            {ROLE_LABELS[user.role]}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-dark-400">
                        {formatDistanceToNow(post.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                    {post.game && (
                      <Badge variant="info" size="sm">
                        {getGameInfo(post.game).icon} {getGameInfo(post.game).name}
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

                  {/* Reactions Summary */}
                  <div className="p-4 border-t border-dark-700">
                    <div className="flex items-center gap-4 text-sm text-dark-400">
                      <div className="flex items-center gap-1">
                        {(Object.keys(REACTION_EMOJIS) as ReactionType[]).slice(0, 3).map((type) => {
                          const count = post.reactions?.filter((r) => r.type === type).length || 0;
                          if (count === 0) return null;
                          return (
                            <span key={type} className="flex items-center gap-1">
                              {REACTION_EMOJIS[type]} {count}
                            </span>
                          );
                        })}
                      </div>
                      {post.commentCount > 0 && (
                        <span>{post.commentCount} comments</span>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card variant="glass">
            <div className="text-center py-6">
              <CalendarDaysIcon className="w-10 h-10 mx-auto mb-3 text-dark-500" />
              <p className="text-dark-400">
                No posts yet
              </p>
              {(user.accountType && user.accountType !== 'player') || user.role !== 'player' ? (
                <p className="text-dark-500 text-sm mt-1">
                  Check back later for updates and announcements!
                </p>
              ) : (
                <p className="text-dark-500 text-sm mt-1">
                  In the future, users will be able to share their gaming moments.
                </p>
              )}
            </div>
          </Card>
        )}
      </motion.div>
    </div>
  );
}

