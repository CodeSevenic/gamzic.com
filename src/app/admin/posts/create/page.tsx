'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, PhotoIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { createPost } from '@/lib/firebase/db';
import { uploadPostImage } from '@/lib/firebase/storage';
import { GAMES } from '@/types';

export default function CreatePostPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState('');
  const [game, setGame] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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
                ...GAMES.map((g) => ({
                  value: g.id,
                  label: `${g.icon} ${g.name}`,
                })),
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

