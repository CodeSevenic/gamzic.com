'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, PhotoIcon, VideoCameraIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/store/authStore';
import { createPost, getManageableAccounts, getBusinessAccounts } from '@/lib/firebase/db';
import { uploadPostImage } from '@/lib/firebase/storage';
import { useGames } from '@/hooks/useGames';
import { hasPermission, type User, type AccountType } from '@/types';

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  player: 'Player',
  business: 'Business',
  sponsor: 'Sponsor',
  organization: 'Organization',
};

export default function CreatePostPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { gameOptions } = useGames();
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState('');
  const [game, setGame] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Post As feature
  const [postAsAccounts, setPostAsAccounts] = useState<User[]>([]);
  const [selectedAuthorId, setSelectedAuthorId] = useState<string>('');
  const [selectedAuthor, setSelectedAuthor] = useState<User | null>(null);

  // Fetch accounts that user can post as
  useEffect(() => {
    const fetchPostAsAccounts = async () => {
      if (!user) return;
      
      try {
        // For super_admins, get all business accounts
        // For others, get only accounts they manage
        let accounts: User[];
        if (hasPermission(user.role, 'super_admin')) {
          accounts = await getBusinessAccounts();
        } else {
          accounts = await getManageableAccounts(user.id);
        }
        
        setPostAsAccounts(accounts);
      } catch (error) {
        console.error('Error fetching post-as accounts:', error);
      }
    };
    
    fetchPostAsAccounts();
  }, [user]);

  // Update selected author when selection changes
  useEffect(() => {
    if (selectedAuthorId && selectedAuthorId !== user?.id) {
      const account = postAsAccounts.find(a => a.id === selectedAuthorId);
      setSelectedAuthor(account || null);
    } else {
      setSelectedAuthor(null);
    }
  }, [selectedAuthorId, postAsAccounts, user?.id]);

  const extractYoutubeId = (url: string): string | null => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[7].length === 11 ? match[7] : null;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!content.trim()) {
      toast.error('Content is required');
      return;
    }

    setIsLoading(true);
    try {
      let imageUrl: string | undefined;

      // Upload image if provided
      if (imageFile) {
        const tempId = Date.now().toString();
        imageUrl = await uploadPostImage(tempId, imageFile);
      }

      // Extract YouTube ID if URL provided
      const youtubeVideoId = youtubeUrl ? extractYoutubeId(youtubeUrl) : undefined;

      // Build post data - only include optional fields if they have values
      // Firestore doesn't accept undefined, so we filter them out
      const postData: Parameters<typeof createPost>[0] = {
        content: content.trim(),
        createdBy: user.id,
        reactions: [],
        commentCount: 0,
        isPinned: false,
      };

      // Only add optional fields if they have values
      if (game) postData.game = game;
      if (imageUrl) postData.imageUrl = imageUrl;
      if (youtubeVideoId) postData.youtubeVideoId = youtubeVideoId;
      
      // Add author info if posting as someone else
      if (selectedAuthorId && selectedAuthor) {
        postData.authorId = selectedAuthorId;
        postData.authorType = selectedAuthor.accountType;
      }

      await createPost(postData);

      toast.success('Post created successfully!');
      router.push('/admin/posts');
    } catch (error) {
      toast.error('Failed to create post');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-dark-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        <span>Back</span>
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card variant="glass" padding="lg">
          <h1 className="text-2xl font-bold text-white mb-6">Create Post</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Post As Selector */}
            {postAsAccounts.length > 0 && (
              <div className="p-4 rounded-xl bg-dark-700/50 border border-dark-600">
                <label className="block text-sm font-medium text-dark-200 mb-3">
                  <UserCircleIcon className="w-4 h-4 inline mr-1" />
                  Post As
                </label>
                
                <div className="grid gap-2">
                  {/* Current user option */}
                  <button
                    type="button"
                    onClick={() => setSelectedAuthorId('')}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                      !selectedAuthorId 
                        ? 'bg-cyan-500/20 border border-cyan-500/50' 
                        : 'bg-dark-800 border border-dark-700 hover:border-dark-500'
                    }`}
                  >
                    <Avatar src={user?.avatar} alt={user?.displayName || ''} size="sm" />
                    <div className="flex-1 text-left">
                      <p className="font-medium text-white">{user?.displayName}</p>
                      <p className="text-xs text-dark-400">Your account</p>
                    </div>
                    {!selectedAuthorId && (
                      <Badge variant="info" size="sm">Selected</Badge>
                    )}
                  </button>
                  
                  {/* Business/Sponsor accounts */}
                  {postAsAccounts.map((account) => (
                    <button
                      key={account.id}
                      type="button"
                      onClick={() => setSelectedAuthorId(account.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                        selectedAuthorId === account.id 
                          ? 'bg-cyan-500/20 border border-cyan-500/50' 
                          : 'bg-dark-800 border border-dark-700 hover:border-dark-500'
                      }`}
                    >
                      <Avatar src={account.avatar} alt={account.displayName} size="sm" />
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white">{account.displayName}</p>
                          <Badge 
                            variant={account.accountType === 'sponsor' ? 'success' : account.accountType === 'business' ? 'info' : 'warning'} 
                            size="sm"
                          >
                            {ACCOUNT_TYPE_LABELS[account.accountType || 'player']}
                          </Badge>
                        </div>
                        {account.businessInfo?.companyName && (
                          <p className="text-xs text-dark-400">{account.businessInfo.companyName}</p>
                        )}
                      </div>
                      {selectedAuthorId === account.id && (
                        <Badge variant="info" size="sm">Selected</Badge>
                      )}
                    </button>
                  ))}
                </div>
                
                {selectedAuthor && (
                  <p className="text-xs text-cyan-400 mt-3">
                    ✓ This post will appear on {selectedAuthor.displayName}&apos;s profile
                  </p>
                )}
              </div>
            )}

            <Textarea
              label="Content"
              placeholder="Write your announcement or update..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              required
            />

            <Select
              label="Game (optional)"
              options={[
                { value: '', label: 'No specific game' },
                ...gameOptions,
              ]}
              value={game}
              onChange={(e) => setGame(e.target.value)}
            />

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">
                Image (optional)
              </label>
              <div className="flex items-start gap-4">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <div className="w-32 h-32 rounded-lg bg-dark-700 border-2 border-dashed border-dark-600 flex items-center justify-center hover:border-cyan-500 transition-colors overflow-hidden">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center">
                        <PhotoIcon className="w-8 h-8 text-dark-500 mx-auto" />
                        <span className="text-xs text-dark-500">Add Image</span>
                      </div>
                    )}
                  </div>
                </label>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="text-sm text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            {/* YouTube URL */}
            <Input
              label="YouTube Video URL (optional)"
              placeholder="https://youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              leftIcon={<VideoCameraIcon className="w-5 h-5" />}
            />

            {youtubeUrl && extractYoutubeId(youtubeUrl) && (
              <div className="aspect-video rounded-lg overflow-hidden">
                <iframe
                  src={`https://www.youtube.com/embed/${extractYoutubeId(youtubeUrl)}`}
                  title="YouTube preview"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isLoading}>
                Publish Post
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}

