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
  DocumentSnapshot,
  QueryConstraint,
  Timestamp,
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
  ReactionType,
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

export const createSchool = async (schoolData: Omit<School, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const firestore = getDb();
  const schoolRef = doc(collection(firestore, 'schools'));
  await setDoc(schoolRef, {
    ...schoolData,
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

export const createTeam = async (teamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const firestore = getDb();
  const teamRef = doc(collection(firestore, 'teams'));
  await setDoc(teamRef, {
    ...teamData,
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
    ...tournamentData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return tournamentRef.id;
};

export const updateTournament = async (tournamentId: string, data: Partial<Tournament>): Promise<void> => {
  const firestore = getDb();
  const tournamentRef = doc(firestore, 'tournaments', tournamentId);
  await updateDoc(tournamentRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
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

export const createBracket = async (bracketData: Omit<Bracket, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const firestore = getDb();
  const bracketRef = doc(collection(firestore, 'brackets'));
  await setDoc(bracketRef, {
    ...bracketData,
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

export const createPost = async (postData: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const firestore = getDb();
  const postRef = doc(collection(firestore, 'posts'));
  await setDoc(postRef, {
    ...postData,
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

export const createComment = async (commentData: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const firestore = getDb();
  const commentRef = doc(collection(firestore, 'comments'));
  await setDoc(commentRef, {
    ...commentData,
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
export const getNotifications = async (userId: string, unreadOnly = false): Promise<Notification[]> => {
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
    ...notificationData,
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
  
  const updates = snapshot.docs.map((doc) =>
    updateDoc(doc.ref, { isRead: true })
  );
  await Promise.all(updates);
};
