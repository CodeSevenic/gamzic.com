'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, PhotoIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { getPost, updatePost } from '@/lib/firebase/db';
import { uploadPostImage } from '@/lib/firebase/storage';
import { type Post } from '@/types';
import { useGames } from '@/hooks/useGames';

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  const { gameOptions } = useGames();
  
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [content, setContent] = useState('');
  const [game, setGame] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const fetchedPost = await getPost(postId);
        if (!fetchedPost) {
          toast.error('Post not found');
          router.push('/admin/posts');
          return;
        }
        setPost(fetchedPost);
        setContent(fetchedPost.content);
        setGame(fetchedPost.game || '');
        setIsPinned(fetchedPost.isPinned);
        if (fetchedPost.youtubeVideoId) {
          setYoutubeUrl(`https://youtube.com/watch?v=${fetchedPost.youtubeVideoId}`);
        }
        if (fetchedPost.imageUrl) {
          setImagePreview(fetchedPost.imageUrl);
        }
      } catch (error) {
        console.error('Error fetching post:', error);
        toast.error('Failed to load post');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [postId, router]);

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

    if (!content.trim()) {
      toast.error('Content is required');
      return;
    }

    setIsSaving(true);
    try {
      let imageUrl = post?.imageUrl;

      // Upload new image if provided
      if (imageFile) {
        imageUrl = await uploadPostImage(postId, imageFile);
      }

      // Extract YouTube ID if URL provided
      const youtubeVideoId = youtubeUrl ? extractYoutubeId(youtubeUrl) : undefined;

      const updateData: Partial<Post> = {
        content: content.trim(),
        isPinned,
      };

      // Handle optional fields
      if (game) {
        updateData.game = game;
      }
      if (imageUrl) {
        updateData.imageUrl = imageUrl;
      }
      if (youtubeVideoId) {
        updateData.youtubeVideoId = youtubeVideoId;
      }

      await updatePost(postId, updateData);

      toast.success('Post updated successfully!');
      router.push('/admin/posts');
    } catch (error) {
      toast.error('Failed to update post');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

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
          <h1 className="text-2xl font-bold text-white mb-6">Edit Post</h1>

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

            {/* Pin Post Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isPinned"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="w-5 h-5 rounded border-dark-600 bg-dark-700 text-cyan-500 focus:ring-cyan-500"
              />
              <label htmlFor="isPinned" className="text-dark-200">
                Pin this post to the top
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSaving}>
                Save Changes
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}

