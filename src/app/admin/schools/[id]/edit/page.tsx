'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { getSchool, updateSchool } from '@/lib/firebase/db';
import { uploadSchoolLogo } from '@/lib/firebase/storage';
import type { School } from '@/types';

export default function EditSchoolPage() {
  const router = useRouter();
  const params = useParams();
  const schoolId = params.id as string;

  const [school, setSchool] = useState<School | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchool = async () => {
      try {
        const fetchedSchool = await getSchool(schoolId);
        if (!fetchedSchool) {
          toast.error('School not found');
          router.push('/admin/schools');
          return;
        }
        setSchool(fetchedSchool);
        setName(fetchedSchool.name);
        setLocation(fetchedSchool.location);
        setDescription(fetchedSchool.description || '');
        setIsVerified(fetchedSchool.isVerified);
        if (fetchedSchool.logo) {
          setLogoPreview(fetchedSchool.logo);
        }
      } catch (error) {
        console.error('Error fetching school:', error);
        toast.error('Failed to load school');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchool();
  }, [schoolId, router]);

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

    setIsSaving(true);
    try {
      let logo = school?.logo;

      // Upload new logo if provided
      if (logoFile) {
        logo = await uploadSchoolLogo(schoolId, logoFile);
      }

      await updateSchool(schoolId, {
        name: name.trim(),
        location: location.trim(),
        description: description.trim(),
        isVerified,
        logo,
      });

      toast.success('School updated successfully!');
      router.push('/admin/schools');
    } catch (error) {
      toast.error('Failed to update school');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

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
          <h1 className="text-2xl font-bold text-white mb-6">Edit School</h1>

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

            {/* Verified Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isVerified"
                checked={isVerified}
                onChange={(e) => setIsVerified(e.target.checked)}
                className="w-5 h-5 rounded border-dark-600 bg-dark-700 text-cyan-500 focus:ring-cyan-500"
              />
              <label htmlFor="isVerified" className="text-dark-200">
                Verified School
              </label>
            </div>

            {/* Members & Teams Info */}
            {school && (
              <div className="p-4 bg-dark-700/50 rounded-lg space-y-2">
                <p className="text-sm text-dark-400">
                  <span className="text-white font-medium">{school.members.length}</span> members
                </p>
                <p className="text-sm text-dark-400">
                  <span className="text-white font-medium">{school.teams.length}</span> teams
                </p>
              </div>
            )}

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

