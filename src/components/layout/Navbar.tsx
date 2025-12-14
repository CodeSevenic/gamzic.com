'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Bars3Icon, MagnifyingGlassIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { Avatar } from '@/components/ui/Avatar';
import { NotificationDropdown } from '@/components/layout/NotificationDropdown';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { hasPermission } from '@/types';

export function Navbar() {
  const pathname = usePathname();
  const { user, loading } = useAuthStore();
  const { toggleMobileMenu } = useUIStore();

  const isAuthPage = pathname?.startsWith('/auth');

  if (isAuthPage) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 h-16 bg-dark-900/80 backdrop-blur-lg border-b border-dark-800">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>

          <Link href="/">
            <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
              {/* Full logo on desktop */}
              <div className="hidden sm:block relative w-36 h-10">
                <Image
                  src="/gamzic-logo.svg"
                  alt="Gamzic"
                  fill
                  className="object-contain object-left max-w-[120px]"
                />
              </div>
              {/* Icon only on mobile */}
              <div className="sm:hidden relative w-10 h-10">
                <Image src="/gamzic-icon.svg" alt="Gamzic" fill className="object-contain" />
              </div>
            </motion.div>
          </Link>
        </div>

        {/* Center - Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
              type="text"
              placeholder="Search players, schools, tournaments..."
              className="w-full pl-10 pr-4 py-2 rounded-full bg-dark-800 border border-dark-700 text-white placeholder-dark-400 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {loading ? (
            // Show placeholder while loading to prevent flash
            <div className="w-8 h-8 rounded-full bg-dark-800 animate-pulse" />
          ) : user ? (
            <>
              {/* Admin Toggle - Show for moderator role and above */}
              {hasPermission(user.role, 'moderator') && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 text-orange-400 hover:from-orange-500/30 hover:to-red-500/30 transition-all"
                  title="Open Admin Panel"
                >
                  <ShieldCheckIcon className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs font-medium">Admin</span>
                </Link>
              )}

              <NotificationDropdown />

              <Link href="/profile" className="flex items-center gap-2">
                <Avatar src={user.avatar} alt={user.displayName} size="sm" />
                <span className="hidden sm:block text-sm font-medium text-white">
                  {user.displayName}
                </span>
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/login"
                className="px-4 py-2 text-sm font-medium text-dark-200 hover:text-white transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/auth/register"
                className="px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 transition-all"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
