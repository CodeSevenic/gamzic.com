import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider, isFirebaseConfigured } from './config';
import type { User, UserRole } from '@/types';

const checkFirebaseConfig = () => {
  if (!isFirebaseConfigured || !auth || !db) {
    throw new Error('Firebase is not configured. Please add your credentials to .env.local');
  }
};

export const createUser = async (
  email: string,
  password: string,
  fullName: string
): Promise<FirebaseUser> => {
  checkFirebaseConfig();
  
  const userCredential = await createUserWithEmailAndPassword(auth!, email, password);
  const user = userCredential.user;

  await updateProfile(user, { displayName: fullName });

  // Create user document in Firestore
  await createUserDocument(user.uid, {
    email: user.email!,
    fullName,
    displayName: fullName.split(' ')[0],
  });

  return user;
};

export const signInWithEmail = async (
  email: string,
  password: string
): Promise<FirebaseUser> => {
  checkFirebaseConfig();
  
  const userCredential = await signInWithEmailAndPassword(auth!, email, password);
  return userCredential.user;
};

export const signInWithGoogle = async (): Promise<FirebaseUser> => {
  checkFirebaseConfig();
  if (!googleProvider) {
    throw new Error('Google provider not initialized');
  }
  
  const result = await signInWithPopup(auth!, googleProvider);
  const user = result.user;

  // Check if user document exists, if not create it
  const userDoc = await getDoc(doc(db!, 'users', user.uid));
  if (!userDoc.exists()) {
    await createUserDocument(user.uid, {
      email: user.email!,
      fullName: user.displayName || 'Anonymous',
      displayName: user.displayName?.split(' ')[0] || 'Anonymous',
      avatar: user.photoURL || undefined,
    });
  }

  return user;
};

export const signOut = async (): Promise<void> => {
  checkFirebaseConfig();
  await firebaseSignOut(auth!);
};

export const createUserDocument = async (
  uid: string,
  data: {
    email: string;
    fullName: string;
    displayName: string;
    avatar?: string;
    role?: UserRole;
  }
): Promise<void> => {
  checkFirebaseConfig();
  
  const userRef = doc(db!, 'users', uid);
  
  const userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { createdAt: ReturnType<typeof serverTimestamp>; updatedAt: ReturnType<typeof serverTimestamp> } = {
    email: data.email,
    fullName: data.fullName,
    displayName: data.displayName,
    avatar: data.avatar || null,
    bio: '',
    schoolId: null,
    gradeYear: null,
    gameTags: {},
    followers: [],
    following: [],
    tournamentsJoined: [],
    teamsJoined: [],
    stats: {
      wins: 0,
      losses: 0,
      matches: 0,
      tournamentWins: 0,
    },
    role: data.role || 'player',
    badges: [],
    isOnboarded: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(userRef, userData);
};

export const getCurrentUser = (): Promise<FirebaseUser | null> => {
  if (!isFirebaseConfigured || !auth) {
    return Promise.resolve(null);
  }
  
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth!, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

export const onAuthChange = (callback: (user: FirebaseUser | null) => void) => {
  if (!isFirebaseConfigured || !auth) {
    // Return a no-op unsubscribe function
    callback(null);
    return () => {};
  }
  
  return onAuthStateChanged(auth, callback);
};
