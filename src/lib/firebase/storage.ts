import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage, isFirebaseConfigured } from './config';

const getStorage = () => {
  if (!isFirebaseConfigured || !storage) {
    throw new Error('Firebase Storage is not configured. Please add your credentials to .env.local');
  }
  return storage;
};

export const uploadImage = async (
  file: File,
  path: string
): Promise<string> => {
  const storageInstance = getStorage();
  const storageRef = ref(storageInstance, path);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  return downloadURL;
};

export const uploadAvatar = async (
  userId: string,
  file: File
): Promise<string> => {
  const ext = file.name.split('.').pop();
  const path = `avatars/${userId}.${ext}`;
  return uploadImage(file, path);
};

export const uploadSchoolLogo = async (
  schoolId: string,
  file: File
): Promise<string> => {
  const ext = file.name.split('.').pop();
  const path = `schools/${schoolId}/logo.${ext}`;
  return uploadImage(file, path);
};

export const uploadTeamLogo = async (
  teamId: string,
  file: File
): Promise<string> => {
  const ext = file.name.split('.').pop();
  const path = `teams/${teamId}/logo.${ext}`;
  return uploadImage(file, path);
};

export const uploadPostImage = async (
  postId: string,
  file: File
): Promise<string> => {
  const ext = file.name.split('.').pop();
  const timestamp = Date.now();
  const path = `posts/${postId}/${timestamp}.${ext}`;
  return uploadImage(file, path);
};

export const uploadTournamentBanner = async (
  tournamentId: string,
  file: File
): Promise<string> => {
  const ext = file.name.split('.').pop();
  const path = `tournaments/${tournamentId}/banner.${ext}`;
  return uploadImage(file, path);
};

export const uploadMatchBanner = async (
  matchId: string,
  file: File
): Promise<string> => {
  const ext = file.name.split('.').pop();
  const path = `matches/${matchId}/banner.${ext}`;
  return uploadImage(file, path);
};

export const deleteImage = async (url: string): Promise<void> => {
  try {
    const storageInstance = getStorage();
    const storageRef = ref(storageInstance, url);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting image:', error);
  }
};
