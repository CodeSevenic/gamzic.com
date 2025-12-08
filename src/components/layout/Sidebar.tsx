'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HomeIcon,
  TrophyIcon,
  AcademicCapIcon,
  UserGroupIcon,
  UserIcon,
  Cog6ToothIcon,
  XMarkIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  TrophyIcon as TrophyIconSolid,
  AcademicCapIcon as AcademicCapIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  UserIcon as UserIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
  ShieldCheckIcon as ShieldCheckIconSolid,
} from '@heroicons/react/24/solid';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

const navigation = [
  { name: 'Feed', href: '/feed', icon: HomeIcon, iconSolid: HomeIconSolid },
  { name: 'Tournaments', href: '/tournaments', icon: TrophyIcon, iconSolid: TrophyIconSolid },
  { name: 'Schools', href: '/schools', icon: AcademicCapIcon, iconSolid: AcademicCapIconSolid },
  { name: 'Teams', href: '/teams', icon: UserGroupIcon, iconSolid: UserGroupIconSolid },
];

const userNavigation = [
  { name: 'Profile', href: '/profile', icon: UserIcon, iconSolid: UserIconSolid },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon, iconSolid: Cog6ToothIconSolid },
];

const adminNavigation = [
  { name: 'Admin Panel', href: '/admin', icon: ShieldCheckIcon, iconSolid: ShieldCheckIconSolid },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { mobileMenuOpen, setMobileMenuOpen } = useUIStore();

  const isAuthPage = pathname?.startsWith('/auth');
  if (isAuthPage) return null;

  const NavContent = () => (
    <div className="flex flex-col h-full py-4">
      {/* Main Navigation */}
      <div className="px-3 space-y-1">
        <p className="px-3 mb-2 text-xs font-semibold text-dark-500 uppercase tracking-wider">
          Menu
        </p>
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          const Icon = isActive ? item.iconSolid : item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg
                transition-all duration-200 group
                ${isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-dark-300 hover:text-white hover:bg-dark-800'
                }
              `}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-dark-400 group-hover:text-cyan-400'}`} />
              <span className="font-medium">{item.name}</span>
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute left-0 w-1 h-8 bg-cyan-500 rounded-r-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>

      {/* User Navigation */}
      {user && (
        <div className="px-3 mt-6 space-y-1">
          <p className="px-3 mb-2 text-xs font-semibold text-dark-500 uppercase tracking-wider">
            Account
          </p>
          {userNavigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = isActive ? item.iconSolid : item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-all duration-200 group
                  ${isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-dark-300 hover:text-white hover:bg-dark-800'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-dark-400 group-hover:text-cyan-400'}`} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      )}

      {/* Admin Navigation */}
      {user?.role === 'admin' && (
        <div className="px-3 mt-6 space-y-1">
          <p className="px-3 mb-2 text-xs font-semibold text-dark-500 uppercase tracking-wider">
            Admin
          </p>
          {adminNavigation.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            const Icon = isActive ? item.iconSolid : item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-all duration-200 group
                  ${isActive
                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border border-purple-500/30'
                    : 'text-dark-300 hover:text-white hover:bg-dark-800'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-purple-400' : 'text-dark-400 group-hover:text-purple-400'}`} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      )}

      {/* Bottom section */}
      <div className="mt-auto px-3">
        <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/20">
          <p className="text-sm font-semibold text-white mb-1">Join the competition!</p>
          <p className="text-xs text-dark-400 mb-3">
            Register for upcoming tournaments and prove your skills.
          </p>
          <Link
            href="/tournaments"
            className="block w-full py-2 text-center text-sm font-medium rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:from-cyan-400 hover:to-purple-500 transition-all"
          >
            Browse Tournaments
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-16 bottom-0 w-64 bg-dark-900 border-r border-dark-800 overflow-y-auto">
        <NavContent />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
            />
            
            {/* Sidebar */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-64 bg-dark-900 border-r border-dark-800 overflow-y-auto lg:hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-dark-800">
                <Link href="/">
                  <div className="relative w-10 h-10">
                    <Image
                      src="/gamzic-icon.svg"
                      alt="Gamzic"
                      fill
                      className="object-contain"
                    />
                  </div>
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              <NavContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

