'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  BuildingOffice2Icon,
  SparklesIcon,
  BuildingLibraryIcon,
  PencilIcon,
  TrashIcon,
  GlobeAltIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuthStore } from '@/store/authStore';
import { getBusinessAccounts, createBusinessAccount, updateUser, deleteUser } from '@/lib/firebase/db';
import { uploadAvatar } from '@/lib/firebase/storage';
import { hasPermission, type User, type AccountType } from '@/types';

const ACCOUNT_TYPE_OPTIONS = [
  { value: 'business', label: '🏢 Business', icon: BuildingOffice2Icon },
  { value: 'sponsor', label: '✨ Sponsor', icon: SparklesIcon },
  { value: 'organization', label: '🏛️ Organization', icon: BuildingLibraryIcon },
];

const ACCOUNT_TYPE_COLORS: Record<AccountType, 'info' | 'success' | 'warning' | 'default'> = {
  player: 'default',
  business: 'info',
  sponsor: 'success',
  organization: 'warning',
};

export default function ManageAccountsPage() {
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const [accounts, setAccounts] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<User | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    accountType: 'sponsor' as 'business' | 'sponsor' | 'organization',
    companyName: '',
    website: '',
    industry: '',
    description: '',
    contactEmail: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    // Check permissions
    if (currentUser && !hasPermission(currentUser.role, 'admin')) {
      router.push('/admin');
      return;
    }

    fetchAccounts();
  }, [currentUser, router]);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const fetchedAccounts = await getBusinessAccounts();
      setAccounts(fetchedAccounts);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast.error('Failed to load accounts');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      displayName: '',
      email: '',
      accountType: 'sponsor',
      companyName: '',
      website: '',
      industry: '',
      description: '',
      contactEmail: '',
    });
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!formData.displayName || !formData.email) {
      toast.error('Name and email are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const accountId = await createBusinessAccount({
        displayName: formData.displayName,
        email: formData.email,
        accountType: formData.accountType,
        businessInfo: {
          companyName: formData.companyName || undefined,
          website: formData.website || undefined,
          industry: formData.industry || undefined,
          description: formData.description || undefined,
          contactEmail: formData.contactEmail || undefined,
        },
        managedBy: [currentUser.id],
      });

      // Upload avatar if provided
      if (avatarFile) {
        const avatarUrl = await uploadAvatar(accountId, avatarFile);
        await updateUser(accountId, { avatar: avatarUrl });
      }

      toast.success('Account created successfully!');
      setShowCreateModal(false);
      resetForm();
      fetchAccounts();
    } catch (error) {
      toast.error('Failed to create account');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;

    setIsSubmitting(true);
    try {
      // Upload new avatar if provided
      let avatarUrl = editingAccount.avatar;
      if (avatarFile) {
        avatarUrl = await uploadAvatar(editingAccount.id, avatarFile);
      }

      await updateUser(editingAccount.id, {
        displayName: formData.displayName,
        email: formData.email,
        accountType: formData.accountType,
        avatar: avatarUrl,
        businessInfo: {
          companyName: formData.companyName || undefined,
          website: formData.website || undefined,
          industry: formData.industry || undefined,
          description: formData.description || undefined,
          contactEmail: formData.contactEmail || undefined,
        },
      });

      toast.success('Account updated successfully!');
      setEditingAccount(null);
      resetForm();
      fetchAccounts();
    } catch (error) {
      toast.error('Failed to update account');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingAccount) return;

    setIsSubmitting(true);
    try {
      await deleteUser(deletingAccount.id);
      toast.success('Account deleted');
      setDeletingAccount(null);
      fetchAccounts();
    } catch (error) {
      toast.error('Failed to delete account');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (account: User) => {
    setFormData({
      displayName: account.displayName,
      email: account.email,
      accountType: account.accountType as 'business' | 'sponsor' | 'organization',
      companyName: account.businessInfo?.companyName || '',
      website: account.businessInfo?.website || '',
      industry: account.businessInfo?.industry || '',
      description: account.businessInfo?.description || '',
      contactEmail: account.businessInfo?.contactEmail || '',
    });
    setAvatarPreview(account.avatar || null);
    setEditingAccount(account);
  };

  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case 'business': return <BuildingOffice2Icon className="w-5 h-5" />;
      case 'sponsor': return <SparklesIcon className="w-5 h-5" />;
      case 'organization': return <BuildingLibraryIcon className="w-5 h-5" />;
      default: return null;
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Business & Sponsor Accounts</h1>
          <p className="text-dark-400">Manage sponsor, business, and organization profiles</p>
        </div>
        <Button
          leftIcon={<PlusIcon className="w-5 h-5" />}
          onClick={() => setShowCreateModal(true)}
        >
          Create Account
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {ACCOUNT_TYPE_OPTIONS.map((type) => {
          const count = accounts.filter((a) => a.accountType === type.value).length;
          const Icon = type.icon;
          return (
            <Card key={type.value} variant="glass" className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                type.value === 'sponsor' ? 'bg-green-500/20 text-green-400' :
                type.value === 'business' ? 'bg-blue-500/20 text-blue-400' :
                'bg-yellow-500/20 text-yellow-400'
              }`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{count}</p>
                <p className="text-sm text-dark-400">{type.label.split(' ')[1]}s</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Accounts List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : accounts.length === 0 ? (
        <Card variant="glass" className="text-center py-12">
          <BuildingOffice2Icon className="w-12 h-12 mx-auto mb-3 text-dark-500" />
          <p className="text-dark-400 mb-4">No business accounts yet</p>
          <Button onClick={() => setShowCreateModal(true)}>
            Create Your First Account
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account, index) => (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card variant="default" className="relative overflow-hidden">
                {/* Type indicator stripe */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${
                  account.accountType === 'sponsor' ? 'bg-green-500' :
                  account.accountType === 'business' ? 'bg-blue-500' :
                  'bg-yellow-500'
                }`} />

                <div className="p-4">
                  <div className="flex items-start gap-4">
                    <Link href={`/users/${account.id}`}>
                      <Avatar
                        src={account.avatar}
                        alt={account.displayName}
                        size="lg"
                        className="cursor-pointer"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link 
                          href={`/users/${account.id}`}
                          className="font-semibold text-white hover:text-cyan-400 truncate"
                        >
                          {account.displayName}
                        </Link>
                        {account.isVerified && (
                          <CheckBadgeIcon className="w-4 h-4 text-cyan-400" />
                        )}
                      </div>
                      <Badge
                        variant={ACCOUNT_TYPE_COLORS[account.accountType || 'player']}
                        size="sm"
                      >
                        {getAccountIcon(account.accountType || 'player')}
                        <span className="ml-1 capitalize">{account.accountType}</span>
                      </Badge>
                      {account.businessInfo?.companyName && (
                        <p className="text-sm text-dark-400 mt-1 truncate">
                          {account.businessInfo.companyName}
                        </p>
                      )}
                    </div>
                  </div>

                  {account.businessInfo?.website && (
                    <a
                      href={account.businessInfo.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-purple-400 hover:underline mt-3"
                    >
                      <GlobeAltIcon className="w-4 h-4" />
                      {account.businessInfo.website.replace(/^https?:\/\//, '')}
                    </a>
                  )}

                  <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-dark-700">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(account)}
                    >
                      <PencilIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:bg-red-500/10"
                      onClick={() => setDeletingAccount(account)}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal || !!editingAccount}
        onClose={() => {
          setShowCreateModal(false);
          setEditingAccount(null);
          resetForm();
        }}
        title={editingAccount ? 'Edit Account' : 'Create Account'}
        size="lg"
      >
        <form onSubmit={editingAccount ? handleEdit : handleCreate} className="p-6 space-y-6">
          {/* Avatar */}
          <div className="flex justify-center">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <div className="w-24 h-24 rounded-full bg-dark-700 border-2 border-dashed border-dark-600 flex items-center justify-center hover:border-cyan-500 transition-colors overflow-hidden">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-dark-500 text-sm text-center">Add Logo</span>
                )}
              </div>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Display Name *"
              placeholder="Acme Gaming"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              required
            />
            <Input
              label="Email *"
              type="email"
              placeholder="contact@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <Select
            label="Account Type"
            options={ACCOUNT_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            value={formData.accountType}
            onChange={(e) => setFormData({ ...formData, accountType: e.target.value as 'business' | 'sponsor' | 'organization' })}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Company Name"
              placeholder="Full legal name"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            />
            <Input
              label="Website"
              placeholder="https://company.com"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Industry"
              placeholder="Gaming, Tech, etc."
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            />
            <Input
              label="Contact Email"
              type="email"
              placeholder="partnerships@company.com"
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
            />
          </div>

          <Textarea
            label="Description"
            placeholder="Tell us about this account..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-dark-700">
            <Button
              variant="ghost"
              onClick={() => {
                setShowCreateModal(false);
                setEditingAccount(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingAccount ? 'Save Changes' : 'Create Account'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingAccount}
        onClose={() => setDeletingAccount(null)}
        title="Delete Account"
        size="sm"
      >
        <div className="p-6">
          <p className="text-dark-300 mb-6">
            Are you sure you want to delete <span className="text-white font-semibold">{deletingAccount?.displayName}</span>?
            This will remove all their posts and data.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeletingAccount(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} isLoading={isSubmitting}>
              Delete Account
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

