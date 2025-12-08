'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ShieldCheckIcon,
  EnvelopeIcon,
  LockClosedIcon,
  CommandLineIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { signInWithEmail, signInWithGoogle } from '@/lib/firebase/auth';
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, loading } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Redirect if already logged in as admin
  useEffect(() => {
    if (!loading && user) {
      if (hasPermission(user.role, 'moderator')) {
        router.replace('/admin');
      }
    }
  }, [user, loading, router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signInWithEmail(email, password);
      toast.success('Authenticating...');
      // The AuthProvider will handle the redirect after checking permissions
    } catch (error: unknown) {
      const firebaseError = error as { code?: string };
      if (firebaseError.code === 'auth/invalid-credential') {
        toast.error('Invalid credentials');
      } else {
        toast.error('Authentication failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);

    try {
      await signInWithGoogle();
      toast.success('Authenticating...');
    } catch (error) {
      toast.error('Authentication failed');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-black">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If logged in but not admin, show access denied
  if (user && !hasPermission(user.role, 'moderator')) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-950 via-gray-900 to-black relative overflow-hidden">
        {/* Animated grid background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(239, 68, 68, 0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(239, 68, 68, 0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }} />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 text-center max-w-md"
        >
          <motion.div
            animate={{ 
              boxShadow: ['0 0 20px rgba(239, 68, 68, 0.3)', '0 0 40px rgba(239, 68, 68, 0.5)', '0 0 20px rgba(239, 68, 68, 0.3)']
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center"
          >
            <ShieldCheckIcon className="w-12 h-12 text-white" />
          </motion.div>
          
          <h1 className="text-3xl font-bold text-white mb-2">Access Restricted</h1>
          <p className="text-gray-400 mb-6">
            You don&apos;t have permission to access the admin panel.
            <br />
            Contact a super admin if you need access.
          </p>
          
          <div className="flex gap-3 justify-center">
            <Button
              variant="secondary"
              onClick={() => router.push('/feed')}
            >
              Go to Feed
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                useAuthStore.getState().reset();
                router.push('/admin/login');
              }}
            >
              Try Different Account
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-950 via-gray-900 to-black relative overflow-hidden">
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(249, 115, 22, 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(249, 115, 22, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }} />
      </div>
      
      {/* Glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-red-500/20 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
          {/* Terminal-style header */}
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-800">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <span className="text-gray-500 text-sm font-mono ml-2">admin@gamzic.com</span>
          </div>

          {/* Logo */}
          <div className="text-center mb-8">
            <motion.div
              animate={{ 
                boxShadow: ['0 0 20px rgba(249, 115, 22, 0.3)', '0 0 40px rgba(249, 115, 22, 0.5)', '0 0 20px rgba(249, 115, 22, 0.3)']
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center"
            >
              <CommandLineIcon className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-1 font-mono">
              COMMAND CENTER
            </h1>
            <p className="text-gray-500 text-sm">Administrative Access Portal</p>
          </div>

          {/* Google Login */}
          <Button
            onClick={handleGoogleLogin}
            variant="secondary"
            fullWidth
            isLoading={isLoading}
            className="mb-4 bg-gray-800 hover:bg-gray-700 border-gray-700"
            leftIcon={
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            }
          >
            Continue with Google
          </Button>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-800" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gray-900 text-gray-600 font-mono">or</span>
            </div>
          </div>

          {/* Email Login Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <Input
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<EnvelopeIcon className="w-5 h-5" />}
              className="bg-gray-800/50 border-gray-700 focus:border-orange-500"
              required
            />
            <Input
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<LockClosedIcon className="w-5 h-5" />}
              className="bg-gray-800/50 border-gray-700 focus:border-orange-500"
              required
            />

            <Button 
              type="submit" 
              fullWidth 
              isLoading={isLoading}
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500"
            >
              <ShieldCheckIcon className="w-5 h-5 mr-2" />
              Authenticate
            </Button>
          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-gray-600 text-xs font-mono">
            Authorized personnel only. All access is logged.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

