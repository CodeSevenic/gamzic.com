'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckBadgeIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { getSchools, updateSchool, deleteSchool } from '@/lib/firebase/db';
import type { School } from '@/types';

export default function AdminSchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [schoolToDelete, setSchoolToDelete] = useState<School | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const fetchedSchools = await getSchools();
        setSchools(fetchedSchools);
      } catch (error) {
        console.error('Error fetching schools:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchools();
  }, []);

  const handleVerify = async (schoolId: string, verified: boolean) => {
    try {
      await updateSchool(schoolId, { isVerified: verified });
      setSchools((prev) =>
        prev.map((s) =>
          s.id === schoolId ? { ...s, isVerified: verified } : s
        )
      );
      toast.success(verified ? 'School verified' : 'Verification removed');
    } catch (error) {
      toast.error('Failed to update school');
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!schoolToDelete) return;

    setIsDeleting(true);
    try {
      await deleteSchool(schoolToDelete.id);
      setSchools((prev) => prev.filter((s) => s.id !== schoolToDelete.id));
      toast.success('School deleted');
      setDeleteModalOpen(false);
      setSchoolToDelete(null);
    } catch (error) {
      toast.error('Failed to delete school');
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Schools</h1>
          <p className="text-dark-400">Manage registered schools</p>
        </div>
        <Link href="/admin/schools/create">
          <Button leftIcon={<PlusIcon className="w-5 h-5" />}>
            Add School
          </Button>
        </Link>
      </div>

      {schools.length === 0 ? (
        <Card variant="glass" className="text-center py-12">
          <p className="text-dark-400 mb-4">No schools registered yet</p>
          <Link href="/admin/schools/create">
            <Button>Add First School</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {schools.map((school, index) => (
            <motion.div
              key={school.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card variant="default" className="h-full">
                <div className="flex items-start gap-4">
                  {/* Logo */}
                  {school.logo ? (
                    <img
                      src={school.logo}
                      alt={school.name}
                      className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl font-bold text-white">
                        {school.name.charAt(0)}
                      </span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white truncate">{school.name}</h3>
                      {school.isVerified && (
                        <CheckBadgeIcon className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-dark-400 mb-2">
                      <MapPinIcon className="w-4 h-4" />
                      <span className="truncate">{school.location}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-dark-500">
                      <span>{school.members.length} players</span>
                      <span>{school.teams.length} teams</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-dark-700">
                  <Button
                    variant={school.isVerified ? 'ghost' : 'secondary'}
                    size="sm"
                    onClick={() => handleVerify(school.id, !school.isVerified)}
                  >
                    {school.isVerified ? 'Remove Verify' : 'Verify'}
                  </Button>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/schools/${school.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <PencilIcon className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSchoolToDelete(school);
                        setDeleteModalOpen(true);
                      }}
                      className="text-red-400 hover:text-red-300"
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete School"
        size="sm"
      >
        <div className="p-6">
          <p className="text-dark-300 mb-6">
            Are you sure you want to delete &quot;{schoolToDelete?.name}&quot;? This action cannot be undone.
            {schoolToDelete && (schoolToDelete.members.length > 0 || schoolToDelete.teams.length > 0) && (
              <span className="block mt-2 text-yellow-400 text-sm">
                ⚠️ This school has {schoolToDelete.members.length} member(s) and {schoolToDelete.teams.length} team(s).
              </span>
            )}
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} isLoading={isDeleting}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

