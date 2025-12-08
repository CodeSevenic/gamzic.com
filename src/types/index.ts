// User Types
export type UserRole = 'player' | 'moderator' | 'admin' | 'super_admin';

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
  imageUrl?: string;
  videoUrl?: string;
  youtubeVideoId?: string;
  createdBy: string;
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

// Constants
export const GAMES = [
  { id: 'valorant', name: 'Valorant', icon: '🎯' },
  { id: 'fifa', name: 'EA FC / FIFA', icon: '⚽' },
  { id: 'fortnite', name: 'Fortnite', icon: '🏗️' },
  { id: 'rocketLeague', name: 'Rocket League', icon: '🚗' },
  { id: 'leagueOfLegends', name: 'League of Legends', icon: '⚔️' },
  { id: 'apexLegends', name: 'Apex Legends', icon: '🎖️' },
  { id: 'overwatch', name: 'Overwatch 2', icon: '🦸' },
  { id: 'callOfDuty', name: 'Call of Duty', icon: '🔫' },
] as const;

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

