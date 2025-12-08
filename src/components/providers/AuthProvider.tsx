'use client';

import { useEffect } from 'react';
import { onAuthChange } from '@/lib/firebase/auth';
import { getUser, updateUser } from '@/lib/firebase/db';
import { useAuthStore } from '@/store/authStore';

const SUPER_ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setFirebaseUser, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          let userData = await getUser(firebaseUser.uid);
          
          // Auto-promote super admin if email matches and not already super_admin
          if (
            userData &&
            SUPER_ADMIN_EMAIL &&
            firebaseUser.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() &&
            userData.role !== 'super_admin'
          ) {
            await updateUser(firebaseUser.uid, { role: 'super_admin' });
            userData = { ...userData, role: 'super_admin' };
            console.log('🔑 Super admin privileges granted');
          }
          
          setUser(userData);
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setFirebaseUser, setUser, setLoading]);

  return <>{children}</>;
}

