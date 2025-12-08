'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { PageLoader } from '@/components/ui/LoadingSpinner';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuthStore();

  useEffect(() => {
    if (!loading) {
      if (user) {
        if (!user.isOnboarded) {
          router.push('/onboarding');
        } else {
          router.push('/feed');
        }
      } else {
        router.push('/auth/login');
      }
    }
  }, [user, loading, router]);

  return <PageLoader />;
}
