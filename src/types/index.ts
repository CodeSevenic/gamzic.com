// User Types
export type UserRole = 'player' | 'moderator' | 'admin' | 'super_admin';

// Account types for different kinds of profiles
export type AccountType = 'player' | 'business' | 'sponsor' | 'organization';

// Role hierarchy for permission checking
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  player: 0,
  moderator: 1,
  admin: 2,
  super_admin: 3,
};

export const hasPermission = (userRole: UserRole, requiredRole: UserRole): boolean => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};

// Business/Sponsor profile info
export interface BusinessInfo {
  companyName?: string;
  website?: string;
  industry?: string;
  description?: string;
  contactEmail?: string;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    discord?: string;
  };
}

export interface GameTags {
  valorant?: string;
  fifa?: string;
  fortnite?: string;
  rocketLeague?: string;
  leagueOfLegends?: string;
  apexLegends?: string;
  overwatch?: string;
  callOfDuty?: string;
  [key: string]: string | undefined;
}

export interface UserStats {
  wins: number;
  losses: number;
  matches: number;
  tournamentWins: number;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  schoolId?: string;
  gradeYear?: string;
  gameTags: GameTags;
  followers: string[];
  following: string[];
  tournamentsJoined: string[];
  teamsJoined: string[];
  stats: UserStats;
  role: UserRole;
  badges: string[];
  isOnboarded: boolean;
  // Account type support for business/sponsor profiles
  accountType: AccountType;
  businessInfo?: BusinessInfo;
  // User IDs who can manage this account (for sponsors/businesses managed by admins)
  managedBy?: string[];
  // Verification status for business accounts
  isVerified?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// School Types
export interface School {
  id: string;
  name: string;
  logo?: string;
  location: string;
  description?: string;
  members: string[];
  teams: string[];
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Team Types
export interface Team {
  id: string;
  name: string;
  schoolId: string;
  logo?: string;
  description?: string;
  members: string[];
  captainId: string;
  game: string;
  stats: {
    wins: number;
    losses: number;
    tournamentWins: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Tournament Types
export type TournamentType = 'solo' | 'team';
export type TournamentStatus = 'draft' | 'registration' | 'in_progress' | 'completed' | 'cancelled';

export interface Tournament {
  id: string;
  title: string;
  description?: string;
  game: string;
  rules?: string;
  prizeDescription?: string;
  bannerImage?: string;
  dateStart: Date;
  dateEnd: Date;
  registrationDeadline: Date;
  type: TournamentType;
  maxParticipants?: number;
  participants: string[]; // userId or teamId
  bracketId?: string;
  createdBy: string;
  status: TournamentStatus;
  // Sponsor support
  sponsors?: string[]; // Array of sponsor/business user IDs
  createdAt: Date;
  updatedAt: Date;
}

// Bracket Types
export interface BracketMatch {
  id: string;
  round: number;
  matchNumber: number;
  participant1?: string;
  participant2?: string;
  score1?: number;
  score2?: number;
  winnerId?: string;
  scheduledTime?: Date;
  completedAt?: Date;
}

export interface Bracket {
  id: string;
  tournamentId: string;
  rounds: BracketMatch[][];
  createdAt: Date;
  updatedAt: Date;
}

// Standalone Match Types (non-tournament matches)
export type MatchType = 'friendly' | 'scrimmage' | 'ranked' | 'casual';
export type MatchStatus = 'open' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface MatchParticipant {
  oduserId?: string;
  teamId?: string;
  name: string;
  joinedAt: Date;
}

export interface Match {
  id: string;
  title: string;
  description?: string;
  game: string;
  type: MatchType;
  status: MatchStatus;
  // Participants join the match (instead of being manually added)
  isTeamMatch: boolean;
  maxParticipants: number; // Any number - flexible like tournaments
  participants: MatchParticipant[];
  // Scores (indexed by oduserId or teamId)
  scores?: Record<string, number>;
  winnerId?: string;
  // Enhanced features (like tournaments)
  bannerImage?: string;
  rules?: string;
  prizeDescription?: string;
  registrationDeadline?: Date;
  // Optional associations
  schoolId?: string;
  tournamentId?: string; // If part of a tournament
  // Scheduling
  scheduledTime?: Date;
  completedAt?: Date;
  // Stream/spectate info
  streamUrl?: string;
  isPublic: boolean;
  // Sponsor support
  sponsors?: string[]; // Array of sponsor/business user IDs
  // Meta
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Post Types
export type ReactionType = 'like' | 'gg' | 'fire' | 'wow';

export interface Reaction {
  userId: string;
  type: ReactionType;
  createdAt: Date;
}

export interface Post {
  id: string;
  content: string;
  imageUrl?: string; // Single image (legacy support)
  images?: string[]; // Multiple images (new feature)
  videoUrl?: string;
  youtubeVideoId?: string;
  // Who actually created the post (the admin who made it)
  createdBy: string;
  // Who the post appears to be from (can be different from createdBy for "post as" feature)
  // If not set, defaults to createdBy
  authorId?: string;
  // Type of account the author is (for display purposes)
  authorType?: AccountType;
  schoolId?: string;
  tournamentId?: string;
  game?: string;
  reactions: Reaction[];
  commentCount: number;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Comment Types
export interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  reactions: Reaction[];
  mentions: string[];
  isReported: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Notification Types
export type NotificationType =
  | 'comment_reply'
  | 'tournament_update'
  | 'match_reminder'
  | 'team_invite'
  | 'follow'
  | 'mention'
  | 'tournament_registration'
  | 'tournament_result';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl?: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: Date;
}

// Game Type (dynamic - stored in Firestore)
export interface Game {
  id: string;
  name: string;
  icon: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Default games (used for seeding, admin can modify)
export const DEFAULT_GAMES = [
  { id: 'valorant', name: 'Valorant', icon: '🎯' },
  { id: 'fifa', name: 'EA FC / FIFA', icon: '⚽' },
  { id: 'fortnite', name: 'Fortnite', icon: '🏗️' },
  { id: 'rocketLeague', name: 'Rocket League', icon: '🚗' },
  { id: 'leagueOfLegends', name: 'League of Legends', icon: '⚔️' },
  { id: 'apexLegends', name: 'Apex Legends', icon: '🎖️' },
  { id: 'overwatch', name: 'Overwatch 2', icon: '🦸' },
  { id: 'callOfDuty', name: 'Call of Duty', icon: '🔫' },
] as const;

// Legacy constant for backward compatibility
export const GAMES = DEFAULT_GAMES;

export const REACTION_EMOJIS: Record<ReactionType, string> = {
  like: '👍',
  gg: '🎮',
  fire: '🔥',
  wow: '😮',
};

export const GRADE_YEARS = [
  'Freshman',
  'Sophomore',
  'Junior',
  'Senior',
  'Graduate',
  'Other',
] as const;

// Feed Story Types (for the stories carousel)
export type FeedStoryType = 'announcement' | 'highlight' | 'promotion' | 'update' | 'event';

export interface FeedStory {
  id: string;
  type: FeedStoryType;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  // Link to related content
  linkUrl?: string;
  linkType?: 'match' | 'tournament' | 'post' | 'user' | 'external';
  linkId?: string; // ID of the related item (matchId, tournamentId, etc.)
  // Styling
  badge?: string;
  badgeColor?: 'red' | 'yellow' | 'cyan' | 'purple' | 'green';
  gradient?: string; // Tailwind gradient classes
  // Display options
  isActive: boolean;
  isPriority: boolean; // Shows first in the carousel
  // Scheduling
  startDate?: Date;
  endDate?: Date;
  // Meta
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Sponsored Content Types (for ads in feed)
export type SponsoredContentType = 'banner' | 'native' | 'promotion' | 'featured';

export interface SponsoredContent {
  id: string;
  type: SponsoredContentType;
  title: string;
  description?: string;
  imageUrl?: string;
  logoUrl?: string;
  sponsorName: string;
  ctaText?: string;
  ctaUrl: string;
  badge?: string;
  gradient?: string;
  // Display options
  isActive: boolean;
  // Scheduling
  startDate?: Date;
  endDate?: Date;
  // Targeting (optional for future use)
  targetGames?: string[];
  // Meta
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
