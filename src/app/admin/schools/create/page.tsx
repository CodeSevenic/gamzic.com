'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { createSchool } from '@/lib/firebase/db';
import { uploadSchoolLogo } from '@/lib/firebase/storage';

export default function CreateSchoolPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('School name is required');
      return;
    }
    if (!location.trim()) {
      toast.error('Location is required');
      return;
    }

    setIsLoading(true);
    try {
      const schoolId = await createSchool({
        name: name.trim(),
        location: location.trim(),
        description: description.trim(),
        members: [],
        teams: [],
        isVerified: false,
      });

      // Upload logo if provided
      if (logoFile) {
        await uploadSchoolLogo(schoolId, logoFile);
      }

      toast.success('School added successfully!');
      router.push('/admin/schools');
    } catch (error) {
      toast.error('Failed to add school');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl">
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
          <h1 className="text-2xl font-bold text-white mb-6">Add School</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Logo Upload */}
            <div className="flex justify-center">
              <label className="cursor-pointer group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <div className="w-24 h-24 rounded-xl bg-dark-700 border-2 border-dashed border-dark-600 flex items-center justify-center group-hover:border-cyan-500 transition-colors overflow-hidden">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <PhotoIcon className="w-8 h-8 text-dark-500 mx-auto" />
                      <span className="text-xs text-dark-500">Add Logo</span>
                    </div>
                  )}
                </div>
              </label>
            </div>

            <Input
              label="School Name"
              placeholder="Enter school name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Location"
              placeholder="City, State"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />

            <Textarea
              label="Description (optional)"
              placeholder="Tell us about this school..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />

            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isLoading}>
                Add School
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}

