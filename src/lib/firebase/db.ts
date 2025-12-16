import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  onSnapshot,
  DocumentSnapshot,
  QueryConstraint,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import type {
  User,
  School,
  Team,
  Tournament,
  Post,
  Comment,
  Notification,
  Bracket,
  Match,
  MatchParticipant,
  Game,
  ReactionType,
  FeedStory,
  SponsoredContent,
} from '@/types';

// Helper to check if db is available
const getDb = () => {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured. Please add your credentials to .env.local');
  }
  return db;
};

// Helper to convert Firestore timestamp to Date
const convertTimestamp = (timestamp: Timestamp | Date | undefined): Date => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Timestamp) return timestamp.toDate();
  return timestamp;
};

// Helper to remove undefined values (Firestore doesn't accept undefined)
const removeUndefined = <T extends Record<string, unknown>>(obj: T): Partial<T> => {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
};

// ============ USERS ============
export const getUser = async (userId: string): Promise<User | null> => {
  const firestore = getDb();
  const userDoc = await getDoc(doc(firestore, 'users', userId));
  if (!userDoc.exists()) return null;
  const data = userDoc.data();
  return {
    id: userDoc.id,
    ...data,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
  } as User;
};

export const updateUser = async (userId: string, data: Partial<User>): Promise<void> => {
  const firestore = getDb();
  const userRef = doc(firestore, 'users', userId);
  await updateDoc(userRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const followUser = async (userId: string, targetUserId: string): Promise<void> => {
  const firestore = getDb();
  const userRef = doc(firestore, 'users', userId);
  const targetRef = doc(firestore, 'users', targetUserId);

  await updateDoc(userRef, {
    following: arrayUnion(targetUserId),
  });
  await updateDoc(targetRef, {
    followers: arrayUnion(userId),
  });
};

export const unfollowUser = async (userId: string, targetUserId: string): Promise<void> => {
  const firestore = getDb();
  const userRef = doc(firestore, 'users', userId);
  const targetRef = doc(firestore, 'users', targetUserId);

  await updateDoc(userRef, {
    following: arrayRemove(targetUserId),
  });
  await updateDoc(targetRef, {
    followers: arrayRemove(userId),
  });
};

// ============ ADMIN: USER MANAGEMENT ============
export const getAllUsers = async (
  limitCount = 50,
  lastDoc?: DocumentSnapshot,
  searchQuery?: string
): Promise<{ users: User[]; lastDoc: DocumentSnapshot | null }> => {
  const firestore = getDb();
  const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];

  constraints.push(limit(limitCount));
  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }

  const usersQuery = query(collection(firestore, 'users'), ...constraints);
  const snapshot = await getDocs(usersQuery);

  let users = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
    } as User;
  });

  // Client-side search filtering (for simple implementation)
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    users = users.filter(
      (user) =>
        user.displayName.toLowerCase().includes(query) ||
        user.fullName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
    );
  }

  return {
    users,
    lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
  };
};

export const updateUserRole = async (
  userId: string,
  role: 'player' | 'moderator' | 'admin' | 'super_admin'
): Promise<void> => {
  const firestore = getDb();
  const userRef = doc(firestore, 'users', userId);
  await updateDoc(userRef, {
    role,
    updatedAt: serverTimestamp(),
  });
};

export const deleteUser = async (userId: string): Promise<void> => {
  const firestore = getDb();
  await deleteDoc(doc(firestore, 'users', userId));
};

// ============ SCHOOLS ============
export const getSchools = async (): Promise<School[]> => {
  const firestore = getDb();
  const schoolsQuery = query(collection(firestore, 'schools'), orderBy('name'));
  const snapshot = await getDocs(schoolsQuery);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
    } as School;
  });
};

export const getSchool = async (schoolId: string): Promise<School | null> => {
  const firestore = getDb();
  const schoolDoc = await getDoc(doc(firestore, 'schools', schoolId));
  if (!schoolDoc.exists()) return null;
  const data = schoolDoc.data();
  return {
    id: schoolDoc.id,
    ...data,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
  } as School;
};

export const createSchool = async (
  schoolData: Omit<School, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  const firestore = getDb();
  const schoolRef = doc(collection(firestore, 'schools'));
  await setDoc(schoolRef, {
    ...removeUndefined(schoolData),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return schoolRef.id;
};

export const updateSchool = async (schoolId: string, data: Partial<School>): Promise<void> => {
  const firestore = getDb();
  const schoolRef = doc(firestore, 'schools', schoolId);
  await updateDoc(schoolRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteSchool = async (schoolId: string): Promise<void> => {
  const firestore = getDb();
  await deleteDoc(doc(firestore, 'schools', schoolId));
};

export const joinSchool = async (userId: string, schoolId: string): Promise<void> => {
  const firestore = getDb();
  const userRef = doc(firestore, 'users', userId);
  const schoolRef = doc(firestore, 'schools', schoolId);

  await updateDoc(userRef, { schoolId });
  await updateDoc(schoolRef, {
    members: arrayUnion(userId),
  });
};

// ============ TEAMS ============
export const getTeams = async (schoolId?: string): Promise<Team[]> => {
  const firestore = getDb();
  const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];
  if (schoolId) {
    constraints.unshift(where('schoolId', '==', schoolId));
  }

  const teamsQuery = query(collection(firestore, 'teams'), ...constraints);
  const snapshot = await getDocs(teamsQuery);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
    } as Team;
  });
};

export const getTeam = async (teamId: string): Promise<Team | null> => {
  const firestore = getDb();
  const teamDoc = await getDoc(doc(firestore, 'teams', teamId));
  if (!teamDoc.exists()) return null;
  const data = teamDoc.data();
  return {
    id: teamDoc.id,
    ...data,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
  } as Team;
};

export const createTeam = async (
  teamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  const firestore = getDb();
  const teamRef = doc(collection(firestore, 'teams'));
  await setDoc(teamRef, {
    ...removeUndefined(teamData),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Add team to school
  if (teamData.schoolId) {
    await updateDoc(doc(firestore, 'schools', teamData.schoolId), {
      teams: arrayUnion(teamRef.id),
    });
  }

  // Add team to captain's teams
  await updateDoc(doc(firestore, 'users', teamData.captainId), {
    teamsJoined: arrayUnion(teamRef.id),
  });

  return teamRef.id;
};

export const joinTeam = async (userId: string, teamId: string): Promise<void> => {
  const firestore = getDb();
  const teamRef = doc(firestore, 'teams', teamId);
  const userRef = doc(firestore, 'users', userId);

  await updateDoc(teamRef, {
    members: arrayUnion(userId),
  });
  await updateDoc(userRef, {
    teamsJoined: arrayUnion(teamId),
  });
};

export const leaveTeam = async (userId: string, teamId: string): Promise<void> => {
  const firestore = getDb();
  const teamRef = doc(firestore, 'teams', teamId);
  const userRef = doc(firestore, 'users', userId);

  await updateDoc(teamRef, {
    members: arrayRemove(userId),
  });
  await updateDoc(userRef, {
    teamsJoined: arrayRemove(teamId),
  });
};

// ============ TOURNAMENTS ============
export const getTournaments = async (
  status?: string,
  game?: string,
  limitCount = 20,
  lastDoc?: DocumentSnapshot
): Promise<{ tournaments: Tournament[]; lastDoc: DocumentSnapshot | null }> => {
  const firestore = getDb();
  const constraints: QueryConstraint[] = [orderBy('dateStart', 'desc')];

  if (status) {
    constraints.unshift(where('status', '==', status));
  }
  if (game) {
    constraints.unshift(where('game', '==', game));
  }

  constraints.push(limit(limitCount));
  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }

  const tournamentsQuery = query(collection(firestore, 'tournaments'), ...constraints);
  const snapshot = await getDocs(tournamentsQuery);

  const tournaments = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      dateStart: convertTimestamp(data.dateStart),
      dateEnd: convertTimestamp(data.dateEnd),
      registrationDeadline: convertTimestamp(data.registrationDeadline),
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
    } as Tournament;
  });

  return {
    tournaments,
    lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
  };
};

export const getTournament = async (tournamentId: string): Promise<Tournament | null> => {
  const firestore = getDb();
  const tournamentDoc = await getDoc(doc(firestore, 'tournaments', tournamentId));
  if (!tournamentDoc.exists()) return null;
  const data = tournamentDoc.data();
  return {
    id: tournamentDoc.id,
    ...data,
    dateStart: convertTimestamp(data.dateStart),
    dateEnd: convertTimestamp(data.dateEnd),
    registrationDeadline: convertTimestamp(data.registrationDeadline),
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
  } as Tournament;
};

export const createTournament = async (
  tournamentData: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  const firestore = getDb();
  const tournamentRef = doc(collection(firestore, 'tournaments'));
  await setDoc(tournamentRef, {
    ...removeUndefined(tournamentData),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return tournamentRef.id;
};

export const updateTournament = async (
  tournamentId: string,
  data: Partial<Tournament>
): Promise<void> => {
  const firestore = getDb();
  const tournamentRef = doc(firestore, 'tournaments', tournamentId);
  await updateDoc(tournamentRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteTournament = async (tournamentId: string): Promise<void> => {
  const firestore = getDb();
  await deleteDoc(doc(firestore, 'tournaments', tournamentId));
};

export const registerForTournament = async (
  tournamentId: string,
  participantId: string,
  userId: string
): Promise<void> => {
  const firestore = getDb();
  const tournamentRef = doc(firestore, 'tournaments', tournamentId);
  const userRef = doc(firestore, 'users', userId);

  await updateDoc(tournamentRef, {
    participants: arrayUnion(participantId),
  });
  await updateDoc(userRef, {
    tournamentsJoined: arrayUnion(tournamentId),
  });
};

export const unregisterFromTournament = async (
  tournamentId: string,
  participantId: string,
  userId: string
): Promise<void> => {
  const firestore = getDb();
  const tournamentRef = doc(firestore, 'tournaments', tournamentId);
  const userRef = doc(firestore, 'users', userId);

  await updateDoc(tournamentRef, {
    participants: arrayRemove(participantId),
  });
  await updateDoc(userRef, {
    tournamentsJoined: arrayRemove(tournamentId),
  });
};

// ============ BRACKETS ============
export const getBracket = async (bracketId: string): Promise<Bracket | null> => {
  const firestore = getDb();
  const bracketDoc = await getDoc(doc(firestore, 'brackets', bracketId));
  if (!bracketDoc.exists()) return null;
  const data = bracketDoc.data();
  return {
    id: bracketDoc.id,
    ...data,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
  } as Bracket;
};

export const createBracket = async (
  bracketData: Omit<Bracket, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  const firestore = getDb();
  const bracketRef = doc(collection(firestore, 'brackets'));
  await setDoc(bracketRef, {
    ...removeUndefined(bracketData),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Update tournament with bracket ID
  await updateDoc(doc(firestore, 'tournaments', bracketData.tournamentId), {
    bracketId: bracketRef.id,
  });

  return bracketRef.id;
};

export const updateBracket = async (bracketId: string, data: Partial<Bracket>): Promise<void> => {
  const firestore = getDb();
  const bracketRef = doc(firestore, 'brackets', bracketId);
  await updateDoc(bracketRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

// ============ GAMES ============
export const getGames = async (activeOnly = true): Promise<Game[]> => {
  const firestore = getDb();
  const constraints: QueryConstraint[] = [orderBy('name', 'asc')];

  if (activeOnly) {
    constraints.unshift(where('isActive', '==', true));
  }

  const gamesQuery = query(collection(firestore, 'games'), ...constraints);
  const snapshot = await getDocs(gamesQuery);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
    } as Game;
  });
};

export const getGame = async (gameId: string): Promise<Game | null> => {
  const firestore = getDb();
  const gameDoc = await getDoc(doc(firestore, 'games', gameId));
  if (!gameDoc.exists()) return null;
  const data = gameDoc.data();
  return {
    id: gameDoc.id,
    ...data,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
  } as Game;
};

export const createGame = async (
  gameData: Omit<Game, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  const firestore = getDb();
  const gameRef = doc(collection(firestore, 'games'));
  await setDoc(gameRef, {
    ...removeUndefined(gameData),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return gameRef.id;
};

export const updateGame = async (gameId: string, data: Partial<Game>): Promise<void> => {
  const firestore = getDb();
  const gameRef = doc(firestore, 'games', gameId);
  await updateDoc(gameRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteGame = async (gameId: string): Promise<void> => {
  const firestore = getDb();
  await deleteDoc(doc(firestore, 'games', gameId));
};

// Seed default games (call once during initial setup)
export const seedDefaultGames = async (): Promise<void> => {
  const firestore = getDb();
  const { DEFAULT_GAMES } = await import('@/types');

  for (const game of DEFAULT_GAMES) {
    const gameRef = doc(firestore, 'games', game.id);
    const existing = await getDoc(gameRef);

    if (!existing.exists()) {
      await setDoc(gameRef, {
        name: game.name,
        icon: game.icon,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  }
};

// ============ MATCHES (Standalone) ============
export const getMatches = async (
  status?: string,
  game?: string,
  limitCount = 20,
  lastDoc?: DocumentSnapshot
): Promise<{ matches: Match[]; lastDoc: DocumentSnapshot | null }> => {
  const firestore = getDb();
  const constraints: QueryConstraint[] = [orderBy('scheduledTime', 'desc')];

  if (status) {
    constraints.unshift(where('status', '==', status));
  }
  if (game) {
    constraints.unshift(where('game', '==', game));
  }

  constraints.push(limit(limitCount));
  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }

  const matchesQuery = query(collection(firestore, 'matches'), ...constraints);
  const snapshot = await getDocs(matchesQuery);

  const matches = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      scheduledTime: data.scheduledTime ? convertTimestamp(data.scheduledTime) : undefined,
      completedAt: data.completedAt ? convertTimestamp(data.completedAt) : undefined,
      registrationDeadline: data.registrationDeadline
        ? convertTimestamp(data.registrationDeadline)
        : undefined,
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
    } as Match;
  });

  return {
    matches,
    lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
  };
};

export const getMatch = async (matchId: string): Promise<Match | null> => {
  const firestore = getDb();
  const matchDoc = await getDoc(doc(firestore, 'matches', matchId));
  if (!matchDoc.exists()) return null;
  const data = matchDoc.data();
  return {
    id: matchDoc.id,
    ...data,
    scheduledTime: data.scheduledTime ? convertTimestamp(data.scheduledTime) : undefined,
    completedAt: data.completedAt ? convertTimestamp(data.completedAt) : undefined,
    registrationDeadline: data.registrationDeadline
      ? convertTimestamp(data.registrationDeadline)
      : undefined,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
  } as Match;
};

export const createMatch = async (
  matchData: Omit<Match, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  const firestore = getDb();
  const matchRef = doc(collection(firestore, 'matches'));
  await setDoc(matchRef, {
    ...removeUndefined(matchData),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return matchRef.id;
};

export const updateMatch = async (matchId: string, data: Partial<Match>): Promise<void> => {
  const firestore = getDb();
  const matchRef = doc(firestore, 'matches', matchId);
  await updateDoc(matchRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteMatch = async (matchId: string): Promise<void> => {
  const firestore = getDb();
  await deleteDoc(doc(firestore, 'matches', matchId));
};

export const joinMatch = async (matchId: string, participant: MatchParticipant): Promise<void> => {
  const firestore = getDb();
  const matchRef = doc(firestore, 'matches', matchId);
  const matchDoc = await getDoc(matchRef);

  if (!matchDoc.exists()) {
    throw new Error('Match not found');
  }

  const matchData = matchDoc.data();
  const participants = matchData.participants || [];

  // Check if already joined
  const alreadyJoined = participants.some(
    (p: MatchParticipant) =>
      (p.oduserId && p.oduserId === participant.oduserId) ||
      (p.teamId && p.teamId === participant.teamId)
  );

  if (alreadyJoined) {
    throw new Error('Already joined this match');
  }

  // Check max participants
  if (participants.length >= matchData.maxParticipants) {
    throw new Error('Match is full');
  }

  await updateDoc(matchRef, {
    participants: arrayUnion({
      ...participant,
      joinedAt: new Date(),
    }),
    updatedAt: serverTimestamp(),
  });

  // If match is full, update status to scheduled
  if (participants.length + 1 >= matchData.maxParticipants) {
    await updateDoc(matchRef, {
      status: 'scheduled',
    });
  }
};

export const leaveMatch = async (
  matchId: string,
  oduserId?: string,
  teamId?: string
): Promise<void> => {
  const firestore = getDb();
  const matchRef = doc(firestore, 'matches', matchId);
  const matchDoc = await getDoc(matchRef);

  if (!matchDoc.exists()) {
    throw new Error('Match not found');
  }

  const matchData = matchDoc.data();
  const participants = matchData.participants || [];

  // Find the participant to remove
  const updatedParticipants = participants.filter((p: MatchParticipant) => {
    if (oduserId) return p.oduserId !== oduserId;
    if (teamId) return p.teamId !== teamId;
    return true;
  });

  await updateDoc(matchRef, {
    participants: updatedParticipants,
    status: 'open', // Reopen the match if someone leaves
    updatedAt: serverTimestamp(),
  });
};

export const updateMatchScores = async (
  matchId: string,
  scores: Record<string, number>,
  winnerId?: string
): Promise<void> => {
  const firestore = getDb();
  const matchRef = doc(firestore, 'matches', matchId);

  const updateData: Record<string, unknown> = {
    scores,
    updatedAt: serverTimestamp(),
  };

  if (winnerId) {
    updateData.winnerId = winnerId;
    updateData.status = 'completed';
    updateData.completedAt = serverTimestamp();
  }

  await updateDoc(matchRef, updateData);
};

// ============ POSTS ============
export const getPosts = async (
  filters?: { schoolId?: string; game?: string; tournamentId?: string },
  limitCount = 20,
  lastDoc?: DocumentSnapshot
): Promise<{ posts: Post[]; lastDoc: DocumentSnapshot | null }> => {
  const firestore = getDb();
  const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];

  if (filters?.schoolId) {
    constraints.unshift(where('schoolId', '==', filters.schoolId));
  }
  if (filters?.game) {
    constraints.unshift(where('game', '==', filters.game));
  }
  if (filters?.tournamentId) {
    constraints.unshift(where('tournamentId', '==', filters.tournamentId));
  }

  constraints.push(limit(limitCount));
  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }

  const postsQuery = query(collection(firestore, 'posts'), ...constraints);
  const snapshot = await getDocs(postsQuery);

  const posts = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
    } as Post;
  });

  return {
    posts,
    lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
  };
};

export const getPost = async (postId: string): Promise<Post | null> => {
  const firestore = getDb();
  const postDoc = await getDoc(doc(firestore, 'posts', postId));
  if (!postDoc.exists()) return null;
  const data = postDoc.data();
  return {
    id: postDoc.id,
    ...data,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
  } as Post;
};

export const createPost = async (
  postData: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  const firestore = getDb();
  const postRef = doc(collection(firestore, 'posts'));
  await setDoc(postRef, {
    ...removeUndefined(postData),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return postRef.id;
};

export const updatePost = async (postId: string, data: Partial<Post>): Promise<void> => {
  const firestore = getDb();
  const postRef = doc(firestore, 'posts', postId);
  await updateDoc(postRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deletePost = async (postId: string): Promise<void> => {
  const firestore = getDb();
  await deleteDoc(doc(firestore, 'posts', postId));
};

// Get posts by author (for profile pages)
export const getPostsByAuthor = async (
  authorId: string,
  limitCount = 20,
  lastDoc?: DocumentSnapshot
): Promise<{ posts: Post[]; lastDoc: DocumentSnapshot | null }> => {
  const firestore = getDb();

  try {
    // Query posts where authorId matches OR createdBy matches (for posts without authorId)
    // We don't use orderBy to avoid needing composite indexes - we sort client-side
    const createdByQuery = query(
      collection(firestore, 'posts'),
      where('createdBy', '==', authorId)
    );

    // First get posts created by this user (most common case)
    const createdBySnapshot = await getDocs(createdByQuery);

    // Merge and dedupe posts
    const postsMap = new Map<string, Post>();

    createdBySnapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data) {
        postsMap.set(doc.id, {
          id: doc.id,
          ...data,
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
        } as Post);
      }
    });

    // Also try to get posts where authorId is set (for "post as" feature)
    // This might fail if no posts have authorId set yet, so we wrap in try-catch
    try {
      const authorQuery = query(collection(firestore, 'posts'), where('authorId', '==', authorId));
      const authorSnapshot = await getDocs(authorQuery);

      authorSnapshot.docs.forEach((doc) => {
        if (!postsMap.has(doc.id)) {
          const data = doc.data();
          if (data) {
            postsMap.set(doc.id, {
              id: doc.id,
              ...data,
              createdAt: convertTimestamp(data.createdAt),
              updatedAt: convertTimestamp(data.updatedAt),
            } as Post);
          }
        }
      });
    } catch (authorQueryError) {
      // authorId query might fail if index doesn't exist yet - that's okay
      console.log('Note: authorId query skipped (index may not exist yet)');
    }

    // Sort by createdAt descending (client-side to avoid index requirement)
    const posts = Array.from(postsMap.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limitCount);

    return {
      posts,
      lastDoc: null, // Pagination is complex with merged queries
    };
  } catch (error) {
    console.error('Error fetching posts by author:', error);
    return { posts: [], lastDoc: null };
  }
};

// Get accounts that the user can manage/post as
export const getManageableAccounts = async (userId: string): Promise<User[]> => {
  const firestore = getDb();

  // Get accounts where userId is in managedBy array
  const managedQuery = query(
    collection(firestore, 'users'),
    where('managedBy', 'array-contains', userId)
  );

  const snapshot = await getDocs(managedQuery);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
    } as User;
  });
};

// Get all business/sponsor accounts (for admin management)
export const getBusinessAccounts = async (
  accountType?: 'business' | 'sponsor' | 'organization'
): Promise<User[]> => {
  const firestore = getDb();

  // Query without orderBy to avoid needing a composite index
  // We'll sort client-side instead
  const accountsQuery = query(
    collection(firestore, 'users'),
    where(
      'accountType',
      'in',
      accountType ? [accountType] : ['business', 'sponsor', 'organization']
    )
  );

  const snapshot = await getDocs(accountsQuery);

  const accounts = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
    } as User;
  });

  // Sort by displayName client-side
  return accounts.sort((a, b) => a.displayName.localeCompare(b.displayName));
};

// Create a business/sponsor account
export const createBusinessAccount = async (accountData: {
  displayName: string;
  email: string;
  accountType: 'business' | 'sponsor' | 'organization';
  businessInfo?: {
    companyName?: string;
    website?: string;
    industry?: string;
    description?: string;
    contactEmail?: string;
  };
  avatar?: string;
  managedBy: string[];
}): Promise<string> => {
  const firestore = getDb();
  const accountRef = doc(collection(firestore, 'users'));

  await setDoc(accountRef, {
    ...accountData,
    fullName: accountData.displayName,
    bio: accountData.businessInfo?.description || '',
    gameTags: {},
    followers: [],
    following: [],
    tournamentsJoined: [],
    teamsJoined: [],
    stats: { wins: 0, losses: 0, matches: 0, tournamentWins: 0 },
    role: 'player', // Business accounts don't need admin roles
    badges: [],
    isOnboarded: true,
    isVerified: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return accountRef.id;
};

// Update managedBy for an account
export const updateAccountManagers = async (
  accountId: string,
  managerIds: string[]
): Promise<void> => {
  const firestore = getDb();
  await updateDoc(doc(firestore, 'users', accountId), {
    managedBy: managerIds,
    updatedAt: serverTimestamp(),
  });
};

export const reactToPost = async (
  postId: string,
  userId: string,
  reactionType: ReactionType
): Promise<void> => {
  const firestore = getDb();
  const postRef = doc(firestore, 'posts', postId);
  const postDoc = await getDoc(postRef);

  if (!postDoc.exists()) return;

  const reactions = postDoc.data().reactions || [];
  const existingIndex = reactions.findIndex((r: { userId: string }) => r.userId === userId);

  if (existingIndex >= 0) {
    // Remove existing reaction if same type, or update if different
    if (reactions[existingIndex].type === reactionType) {
      reactions.splice(existingIndex, 1);
    } else {
      reactions[existingIndex] = { userId, type: reactionType, createdAt: new Date() };
    }
  } else {
    reactions.push({ userId, type: reactionType, createdAt: new Date() });
  }

  await updateDoc(postRef, { reactions });
};

// ============ COMMENTS ============
export const getComments = async (postId: string): Promise<Comment[]> => {
  const firestore = getDb();
  const commentsQuery = query(
    collection(firestore, 'comments'),
    where('postId', '==', postId),
    orderBy('createdAt', 'asc')
  );
  const snapshot = await getDocs(commentsQuery);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
    } as Comment;
  });
};

export const createComment = async (
  commentData: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  const firestore = getDb();
  const commentRef = doc(collection(firestore, 'comments'));
  await setDoc(commentRef, {
    ...removeUndefined(commentData),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Increment comment count on post
  await updateDoc(doc(firestore, 'posts', commentData.postId), {
    commentCount: increment(1),
  });

  return commentRef.id;
};

export const deleteComment = async (commentId: string, postId: string): Promise<void> => {
  const firestore = getDb();
  await deleteDoc(doc(firestore, 'comments', commentId));

  // Decrement comment count on post
  await updateDoc(doc(firestore, 'posts', postId), {
    commentCount: increment(-1),
  });
};

export const reportComment = async (commentId: string): Promise<void> => {
  const firestore = getDb();
  await updateDoc(doc(firestore, 'comments', commentId), {
    isReported: true,
  });
};

// ============ NOTIFICATIONS ============
export const getNotifications = async (
  userId: string,
  unreadOnly = false
): Promise<Notification[]> => {
  const firestore = getDb();
  const constraints: QueryConstraint[] = [
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(50),
  ];

  if (unreadOnly) {
    constraints.splice(1, 0, where('isRead', '==', false));
  }

  const notificationsQuery = query(collection(firestore, 'notifications'), ...constraints);
  const snapshot = await getDocs(notificationsQuery);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: convertTimestamp(data.createdAt),
    } as Notification;
  });
};

export const createNotification = async (
  notificationData: Omit<Notification, 'id' | 'createdAt'>
): Promise<string> => {
  const firestore = getDb();
  const notificationRef = doc(collection(firestore, 'notifications'));
  await setDoc(notificationRef, {
    ...removeUndefined(notificationData),
    createdAt: serverTimestamp(),
  });
  return notificationRef.id;
};

export const markNotificationRead = async (notificationId: string): Promise<void> => {
  const firestore = getDb();
  await updateDoc(doc(firestore, 'notifications', notificationId), {
    isRead: true,
  });
};

export const markAllNotificationsRead = async (userId: string): Promise<void> => {
  const firestore = getDb();
  const notificationsQuery = query(
    collection(firestore, 'notifications'),
    where('userId', '==', userId),
    where('isRead', '==', false)
  );
  const snapshot = await getDocs(notificationsQuery);

  const updates = snapshot.docs.map((doc) => updateDoc(doc.ref, { isRead: true }));
  await Promise.all(updates);
};

// ============ REAL-TIME LISTENERS ============

// Subscribe to real-time match updates
export const subscribeToMatch = (
  matchId: string,
  callback: (match: Match | null) => void
): Unsubscribe => {
  const firestore = getDb();
  const matchRef = doc(firestore, 'matches', matchId);

  return onSnapshot(matchRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    const data = snapshot.data();
    callback({
      id: snapshot.id,
      ...data,
      scheduledTime: data.scheduledTime ? convertTimestamp(data.scheduledTime) : undefined,
      completedAt: data.completedAt ? convertTimestamp(data.completedAt) : undefined,
      registrationDeadline: data.registrationDeadline
        ? convertTimestamp(data.registrationDeadline)
        : undefined,
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
    } as Match);
  });
};

// Subscribe to real-time tournament updates
export const subscribeToTournament = (
  tournamentId: string,
  callback: (tournament: Tournament | null) => void
): Unsubscribe => {
  const firestore = getDb();
  const tournamentRef = doc(firestore, 'tournaments', tournamentId);

  return onSnapshot(tournamentRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    const data = snapshot.data();
    callback({
      id: snapshot.id,
      ...data,
      dateStart: convertTimestamp(data.dateStart),
      dateEnd: convertTimestamp(data.dateEnd),
      registrationDeadline: convertTimestamp(data.registrationDeadline),
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
    } as Tournament);
  });
};

// Get multiple users by IDs (for displaying avatars)
export const getUsersByIds = async (userIds: string[]): Promise<Record<string, User>> => {
  if (userIds.length === 0) return {};

  const firestore = getDb();
  const userPromises = userIds.map((id) => getDoc(doc(firestore, 'users', id)));
  const snapshots = await Promise.all(userPromises);

  const users: Record<string, User> = {};
  snapshots.forEach((snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      users[snapshot.id] = {
        id: snapshot.id,
        ...data,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
      } as User;
    }
  });

  return users;
};

// ============ FEED STORIES ============
export const getFeedStories = async (activeOnly = true): Promise<FeedStory[]> => {
  const firestore = getDb();

  try {
    // Simple query without composite index requirement
    const storiesQuery = query(collection(firestore, 'feedStories'));
    const snapshot = await getDocs(storiesQuery);

    const now = new Date();

    return snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startDate: data.startDate ? convertTimestamp(data.startDate) : undefined,
          endDate: data.endDate ? convertTimestamp(data.endDate) : undefined,
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
        } as FeedStory;
      })
      .filter((story) => {
        // Filter by active status
        if (activeOnly && !story.isActive) return false;
        // Filter by date range if set
        if (story.startDate && story.startDate > now) return false;
        if (story.endDate && story.endDate < now) return false;
        return true;
      })
      .sort((a, b) => {
        // Priority stories first
        if (a.isPriority && !b.isPriority) return -1;
        if (!a.isPriority && b.isPriority) return 1;
        // Then by createdAt
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
  } catch (error) {
    console.error('Error fetching feed stories:', error);
    return [];
  }
};

export const getFeedStory = async (storyId: string): Promise<FeedStory | null> => {
  const firestore = getDb();
  const storyDoc = await getDoc(doc(firestore, 'feedStories', storyId));
  if (!storyDoc.exists()) return null;
  const data = storyDoc.data();
  return {
    id: storyDoc.id,
    ...data,
    startDate: data.startDate ? convertTimestamp(data.startDate) : undefined,
    endDate: data.endDate ? convertTimestamp(data.endDate) : undefined,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
  } as FeedStory;
};

export const createFeedStory = async (
  storyData: Omit<FeedStory, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  const firestore = getDb();
  const storyRef = doc(collection(firestore, 'feedStories'));
  await setDoc(storyRef, {
    ...removeUndefined(storyData),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return storyRef.id;
};

export const updateFeedStory = async (storyId: string, data: Partial<FeedStory>): Promise<void> => {
  const firestore = getDb();
  const storyRef = doc(firestore, 'feedStories', storyId);
  await updateDoc(storyRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteFeedStory = async (storyId: string): Promise<void> => {
  const firestore = getDb();
  await deleteDoc(doc(firestore, 'feedStories', storyId));
};

// ============ SPONSORED CONTENT ============
export const getSponsoredContent = async (activeOnly = true): Promise<SponsoredContent[]> => {
  const firestore = getDb();

  try {
    // Simple query without composite index requirement
    const contentQuery = query(collection(firestore, 'sponsoredContent'));
    const snapshot = await getDocs(contentQuery);

    const now = new Date();

    return snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startDate: data.startDate ? convertTimestamp(data.startDate) : undefined,
          endDate: data.endDate ? convertTimestamp(data.endDate) : undefined,
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
        } as SponsoredContent;
      })
      .filter((content) => {
        // Filter by active status
        if (activeOnly && !content.isActive) return false;
        // Filter by date range if set
        if (content.startDate && content.startDate > now) return false;
        if (content.endDate && content.endDate < now) return false;
        return true;
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Error fetching sponsored content:', error);
    return [];
  }
};

export const getSponsoredContentById = async (
  contentId: string
): Promise<SponsoredContent | null> => {
  const firestore = getDb();
  const contentDoc = await getDoc(doc(firestore, 'sponsoredContent', contentId));
  if (!contentDoc.exists()) return null;
  const data = contentDoc.data();
  return {
    id: contentDoc.id,
    ...data,
    startDate: data.startDate ? convertTimestamp(data.startDate) : undefined,
    endDate: data.endDate ? convertTimestamp(data.endDate) : undefined,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
  } as SponsoredContent;
};

export const createSponsoredContent = async (
  contentData: Omit<SponsoredContent, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  const firestore = getDb();
  const contentRef = doc(collection(firestore, 'sponsoredContent'));
  await setDoc(contentRef, {
    ...removeUndefined(contentData),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return contentRef.id;
};

export const updateSponsoredContent = async (
  contentId: string,
  data: Partial<SponsoredContent>
): Promise<void> => {
  const firestore = getDb();
  const contentRef = doc(firestore, 'sponsoredContent', contentId);
  await updateDoc(contentRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteSponsoredContent = async (contentId: string): Promise<void> => {
  const firestore = getDb();
  await deleteDoc(doc(firestore, 'sponsoredContent', contentId));
};

// ============ PLATFORM STATS (Real-time) ============
export const getPlatformStats = async (): Promise<{
  totalMatches: number;
  activeTournaments: number;
  totalUsers: number;
  matchesThisWeek: number;
}> => {
  const firestore = getDb();

  try {
    // Get counts from various collections - simple queries to avoid index requirements
    const [matchesSnap, tournamentsSnap, usersSnap] = await Promise.all([
      getDocs(collection(firestore, 'matches')),
      getDocs(collection(firestore, 'tournaments')),
      getDocs(collection(firestore, 'users')),
    ]);

    // Filter active tournaments client-side
    const activeTournaments = tournamentsSnap.docs.filter((doc) => {
      const data = doc.data();
      return data.status === 'registration' || data.status === 'in_progress';
    }).length;

    // Count matches from this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const matchesThisWeek = matchesSnap.docs.filter((doc) => {
      const data = doc.data();
      const createdAt = convertTimestamp(data.createdAt);
      return createdAt >= oneWeekAgo;
    }).length;

    return {
      totalMatches: matchesSnap.size,
      activeTournaments,
      totalUsers: usersSnap.size,
      matchesThisWeek,
    };
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    return {
      totalMatches: 0,
      activeTournaments: 0,
      totalUsers: 0,
      matchesThisWeek: 0,
    };
  }
};

// ============ TOP PLAYERS ============
export const getTopPlayers = async (limitCount = 10): Promise<User[]> => {
  const firestore = getDb();

  try {
    // Get all users and sort by wins client-side
    // (Firestore doesn't support ordering by nested fields easily)
    const usersQuery = query(collection(firestore, 'users'), limit(100));
    const snapshot = await getDocs(usersQuery);

    const users = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
      } as User;
    });

    // Sort by wins and return top players
    return users
      .filter((u) => u.accountType === 'player' && u.stats && u.stats.wins > 0)
      .sort((a, b) => (b.stats?.wins || 0) - (a.stats?.wins || 0))
      .slice(0, limitCount);
  } catch (error) {
    console.error('Error fetching top players:', error);
    return [];
  }
};
