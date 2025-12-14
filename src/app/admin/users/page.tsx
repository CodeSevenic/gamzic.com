'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  TrashIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { getAllUsers, updateUserRole, deleteUser } from '@/lib/firebase/db';
import { useAuthStore } from '@/store/authStore';
import { hasPermission, type User, type UserRole } from '@/types';
import Link from 'next/link';

const ROLE_OPTIONS: { value: UserRole; label: string; color: string; description: string }[] = [
  { value: 'player', label: 'Player', color: 'bg-gray-500', description: 'Regular user with no admin privileges' },
  { value: 'moderator', label: 'Moderator', color: 'bg-blue-500', description: 'Can moderate content and handle reports' },
  { value: 'admin', label: 'Admin', color: 'bg-purple-500', description: 'Full admin access except user role management' },
  { value: 'super_admin', label: 'Super Admin', color: 'bg-orange-500', description: 'Full access including admin management' },
];

const ROLE_BADGES: Record<UserRole, { bg: string; text: string }> = {
  player: { bg: 'bg-gray-500/20', text: 'text-gray-400' },
  moderator: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  admin: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  super_admin: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
};

export default function AdminUsersPage() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { users: fetchedUsers } = await getAllUsers(100);
      setUsers(fetchedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.displayName.toLowerCase().includes(query) ||
      user.fullName.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  });

  const handleRoleChange = async (newRole: UserRole) => {
    if (!selectedUser || !currentUser) return;

    // Prevent changing own role
    if (selectedUser.id === currentUser.id) {
      toast.error("You can't change your own role");
      return;
    }

    // Only super_admin can promote to admin or super_admin
    if ((newRole === 'admin' || newRole === 'super_admin') && currentUser.role !== 'super_admin') {
      toast.error('Only super admins can promote to admin or super admin');
      return;
    }

    // Prevent demoting other super_admins unless you're a super_admin
    if (selectedUser.role === 'super_admin' && currentUser.role !== 'super_admin') {
      toast.error("You can't modify a super admin's role");
      return;
    }

    setIsUpdating(true);
    try {
      await updateUserRole(selectedUser.id, newRole);
      setUsers(users.map((u) => (u.id === selectedUser.id ? { ...u, role: newRole } : u)));
      toast.success(`${selectedUser.displayName} is now a ${newRole.replace('_', ' ')}`);
      setShowRoleModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser || !currentUser) return;

    // Prevent deleting yourself
    if (selectedUser.id === currentUser.id) {
      toast.error("You can't delete your own account");
      return;
    }

    // Prevent deleting super_admins unless you're a super_admin
    if (selectedUser.role === 'super_admin' && currentUser.role !== 'super_admin') {
      toast.error("You can't delete a super admin");
      return;
    }

    setIsUpdating(true);
    try {
      await deleteUser(selectedUser.id);
      setUsers(users.filter((u) => u.id !== selectedUser.id));
      toast.success(`${selectedUser.displayName} has been deleted`);
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    } finally {
      setIsUpdating(false);
    }
  };

  const canModifyUser = (targetUser: User): boolean => {
    if (!currentUser) return false;
    if (targetUser.id === currentUser.id) return false;
    if (targetUser.role === 'super_admin' && currentUser.role !== 'super_admin') return false;
    return true;
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">User Management</h1>
        <p className="text-gray-400">Manage user roles and permissions</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>
      </div>

      {/* Users List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.length === 0 ? (
            <Card className="text-center py-12">
              <UserIcon className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400">No users found</p>
            </Card>
          ) : (
            filteredUsers.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card className="flex items-center gap-4 p-4 bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
                  <Link href={`/users/${user.id}`} className="shrink-0">
                    <Avatar
                      src={user.avatar}
                      alt={user.displayName}
                      size="md"
                      className="cursor-pointer"
                    />
                  </Link>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link 
                        href={`/users/${user.id}`}
                        className="font-medium text-white truncate hover:text-cyan-400 transition-colors"
                      >
                        {user.displayName}
                      </Link>
                      {user.id === currentUser?.id && (
                        <span className="text-xs text-gray-500">(you)</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">{user.email}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Role Badge */}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${ROLE_BADGES[user.role].bg} ${ROLE_BADGES[user.role].text}`}
                    >
                      {user.role.replace('_', ' ')}
                    </span>

                    {/* Actions */}
                    {canModifyUser(user) && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowRoleModal(true);
                          }}
                          className="text-gray-400 hover:text-orange-400"
                        >
                          <ShieldCheckIcon className="w-4 h-4" />
                        </Button>
                        
                        {hasPermission(currentUser?.role || 'player', 'admin') && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDeleteModal(true);
                            }}
                            className="text-gray-400 hover:text-red-400"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Role Change Modal */}
      <Modal
        isOpen={showRoleModal}
        onClose={() => {
          setShowRoleModal(false);
          setSelectedUser(null);
        }}
        title={`Change Role: ${selectedUser?.displayName}`}
      >
        <div className="space-y-3">
          <p className="text-gray-400 text-sm mb-4">
            Select a new role for this user. Higher roles have more permissions.
          </p>
          
          {ROLE_OPTIONS.map((option) => {
            const isCurrentRole = selectedUser?.role === option.value;
            const canAssign =
              currentUser?.role === 'super_admin' ||
              (option.value !== 'admin' && option.value !== 'super_admin');

            return (
              <button
                key={option.value}
                onClick={() => canAssign && handleRoleChange(option.value)}
                disabled={isCurrentRole || !canAssign || isUpdating}
                className={`
                  w-full p-4 rounded-lg border text-left transition-all
                  ${isCurrentRole
                    ? 'border-orange-500 bg-orange-500/10'
                    : canAssign
                      ? 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                      : 'border-gray-800 bg-gray-900/50 opacity-50 cursor-not-allowed'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${option.color}`} />
                  <div className="flex-1">
                    <p className="font-medium text-white">{option.label}</p>
                    <p className="text-sm text-gray-500">{option.description}</p>
                  </div>
                  {isCurrentRole && (
                    <span className="text-xs text-orange-400">Current</span>
                  )}
                  {!canAssign && !isCurrentRole && (
                    <span className="text-xs text-gray-600">Super admin only</span>
                  )}
                </div>
              </button>
            );
          })}

          {isUpdating && (
            <div className="flex justify-center py-4">
              <LoadingSpinner size="sm" />
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedUser(null);
        }}
        title="Delete User"
      >
        <div className="space-y-4">
          <p className="text-gray-400">
            Are you sure you want to delete <span className="text-white font-medium">{selectedUser?.displayName}</span>?
            This action cannot be undone.
          </p>
          
          <div className="flex gap-3 justify-end">
            <Button
              variant="ghost"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedUser(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDeleteUser}
              isLoading={isUpdating}
              className="bg-red-600 hover:bg-red-500"
            >
              Delete User
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

