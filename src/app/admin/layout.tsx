'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  DocumentTextIcon,
  TrophyIcon,
  AcademicCapIcon,
  UserGroupIcon,
  FlagIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
  PlayIcon,
  PuzzlePieceIcon,
  ArrowLeftIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store/authStore';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { hasPermission } from '@/types';
import { signOut } from '@/lib/firebase/auth';
import toast from 'react-hot-toast';

const adminNav = [
  { name: 'Dashboard', href: '/admin', icon: HomeIcon, minRole: 'moderator' as const },
  { name: 'Posts', href: '/admin/posts', icon: DocumentTextIcon, minRole: 'moderator' as const },
  { name: 'Tournaments', href: '/admin/tournaments', icon: TrophyIcon, minRole: 'admin' as const },
  { name: 'Matches', href: '/admin/matches', icon: PlayIcon, minRole: 'admin' as const },
  { name: 'Games', href: '/admin/games', icon: PuzzlePieceIcon, minRole: 'admin' as const },
  { name: 'Schools', href: '/admin/schools', icon: AcademicCapIcon, minRole: 'admin' as const },
  { name: 'Users', href: '/admin/users', icon: UserGroupIcon, minRole: 'admin' as const },
  { name: 'Accounts', href: '/admin/accounts', icon: BuildingOffice2Icon, minRole: 'admin' as const },
  { name: 'Reports', href: '/admin/reports', icon: FlagIcon, minRole: 'moderator' as const },
  { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon, minRole: 'super_admin' as const },
];

const ROLE_LABELS = {
  player: 'Player',
  moderator: 'Moderator',
  admin: 'Admin',
  super_admin: 'Super Admin',
};

const ROLE_COLORS = {
  player: 'text-gray-400',
  moderator: 'text-blue-400',
  admin: 'text-purple-400',
  super_admin: 'text-orange-400',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuthStore();

  // Allow /admin/login to bypass auth check
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) return;
    
    if (!loading && (!user || !hasPermission(user.role, 'moderator'))) {
      router.push('/admin/login');
    }
  }, [user, loading, router, isLoginPage]);

  // Don't render layout for login page
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return <PageLoader />;
  }

  if (!user || !hasPermission(user.role, 'moderator')) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logged out');
      router.push('/admin/login');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  return (
    <div className="flex">
      {/* Admin Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-56 min-h-[calc(100vh-4rem)] bg-gray-900 border-r border-gray-800">
        <div className="flex-1 p-4">
          {/* Header */}
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-800">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <ShieldCheckIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Command Center
              </h2>
              <p className={`text-xs ${ROLE_COLORS[user.role]}`}>
                {ROLE_LABELS[user.role]}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {adminNav.map((item) => {
              const isActive = pathname === item.href;
              const hasAccess = hasPermission(user.role, item.minRole);
              
              if (!hasAccess) return null;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                    transition-colors
                    ${isActive
                      ? 'bg-orange-500/20 text-orange-400'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User section at bottom */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-sm font-medium text-white">
              {user.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user.displayName}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user.email}
              </p>
            </div>
          </div>
          
          {/* Back to App button */}
          <Link
            href="/feed"
            className="flex items-center gap-2 w-full px-3 py-2 mb-2 rounded-lg text-sm bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 text-cyan-400 hover:from-cyan-500/30 hover:to-purple-500/30 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to App
          </Link>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-h-[calc(100vh-4rem)] bg-gray-950">
        {children}
      </div>
    </div>
  );
}

