'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  PhotoIcon,
  VideoCameraIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
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
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

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
      const account = postAsAccounts.find((a) => a.id === selectedAuthorId);
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
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Limit to 10 images total
    const remainingSlots = 10 - imageFiles.length;
    const newFiles = files.slice(0, remainingSlots);

    if (newFiles.length < files.length) {
      toast.error('Maximum 10 images allowed');
    }

    setImageFiles((prev) => [...prev, ...newFiles]);

    // Create previews for new files
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
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
      const uploadedImages: string[] = [];

      // Upload all images
      if (imageFiles.length > 0) {
        const tempId = Date.now().toString();
        for (let i = 0; i < imageFiles.length; i++) {
          const imageUrl = await uploadPostImage(`${tempId}-${i}`, imageFiles[i]);
          uploadedImages.push(imageUrl);
        }
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
      if (uploadedImages.length === 1) {
        postData.imageUrl = uploadedImages[0]; // Single image for backward compatibility
      } else if (uploadedImages.length > 1) {
        postData.images = uploadedImages; // Multiple images
      }
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

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
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
                      <Badge variant="info" size="sm">
                        Selected
                      </Badge>
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
                            variant={
                              account.accountType === 'sponsor'
                                ? 'success'
                                : account.accountType === 'business'
                                ? 'info'
                                : 'warning'
                            }
                            size="sm"
                          >
                            {ACCOUNT_TYPE_LABELS[account.accountType || 'player']}
                          </Badge>
                        </div>
                        {account.businessInfo?.companyName && (
                          <p className="text-xs text-dark-400">
                            {account.businessInfo.companyName}
                          </p>
                        )}
                      </div>
                      {selectedAuthorId === account.id && (
                        <Badge variant="info" size="sm">
                          Selected
                        </Badge>
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
              options={[{ value: '', label: 'No specific game' }, ...gameOptions]}
              value={game}
              onChange={(e) => setGame(e.target.value)}
            />

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">
                Images (optional, up to 10)
              </label>
              <div className="space-y-3">
                {/* Image Previews Grid */}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative aspect-square group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          ×
                        </button>
                        {index === 0 && (
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 text-xs bg-cyan-500 text-white rounded">
                            Cover
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Image Button */}
                {imagePreviews.length < 10 && (
                  <label className="cursor-pointer inline-block">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <div className="w-24 h-24 rounded-lg bg-dark-700 border-2 border-dashed border-dark-600 flex items-center justify-center hover:border-cyan-500 transition-colors">
                      <div className="text-center">
                        <PhotoIcon className="w-6 h-6 text-dark-500 mx-auto" />
                        <span className="text-xs text-dark-500">
                          {imagePreviews.length === 0 ? 'Add' : '+'}
                        </span>
                      </div>
                    </div>
                  </label>
                )}

                {imagePreviews.length > 0 && (
                  <p className="text-xs text-dark-400">
                    {imagePreviews.length} image{imagePreviews.length !== 1 ? 's' : ''} selected
                    {imagePreviews.length > 1 && ' • First image will be the cover'}
                  </p>
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
