'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AcademicCapIcon, MapPinIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { getSchools } from '@/lib/firebase/db';
import type { School } from '@/types';

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredSchools = schools.filter((school) =>
    school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    school.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <AcademicCapIcon className="w-7 h-7 text-cyan-400" />
            Schools
          </h1>
          <p className="text-dark-400 mt-1">Explore esports communities</p>
        </div>

        {/* Search */}
        <div className="w-full sm:w-64">
          <Input
            placeholder="Search schools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<MagnifyingGlassIcon className="w-5 h-5" />}
          />
        </div>
      </div>

      {/* Schools Grid */}
      {filteredSchools.length === 0 ? (
        <Card variant="glass" className="text-center py-12">
          <AcademicCapIcon className="w-16 h-16 mx-auto mb-4 text-dark-600" />
          <p className="text-dark-400">
            {searchQuery ? 'No schools found matching your search' : 'No schools available yet'}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSchools.map((school, index) => (
            <motion.div
              key={school.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={`/schools/${school.id}`}>
                <Card variant="default" hover padding="none" className="overflow-hidden h-full">
                  {/* Logo/Banner */}
                  <div className="relative h-24 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                    {school.logo ? (
                      <img
                        src={school.logo}
                        alt={school.name}
                        className="w-16 h-16 rounded-full object-cover border-4 border-dark-800"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center border-4 border-dark-800">
                        <span className="text-2xl font-bold text-white">
                          {school.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    {school.isVerified && (
                      <Badge variant="success" size="sm" className="absolute top-2 right-2">
                        Verified
                      </Badge>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-bold text-white text-center mb-2 line-clamp-1">
                      {school.name}
                    </h3>

                    <div className="flex items-center justify-center gap-1 text-sm text-dark-400 mb-3">
                      <MapPinIcon className="w-4 h-4" />
                      <span className="truncate">{school.location}</span>
                    </div>

                    {school.description && (
                      <p className="text-sm text-dark-400 text-center line-clamp-2 mb-3">
                        {school.description}
                      </p>
                    )}

                    <div className="flex items-center justify-center gap-4 pt-3 border-t border-dark-700">
                      <div className="text-center">
                        <p className="text-lg font-bold text-white">{school.members.length}</p>
                        <p className="text-xs text-dark-500">Players</p>
                      </div>
                      <div className="w-px h-8 bg-dark-700" />
                      <div className="text-center">
                        <p className="text-lg font-bold text-white">{school.teams.length}</p>
                        <p className="text-xs text-dark-500">Teams</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

