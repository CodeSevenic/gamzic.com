'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  AcademicCapIcon,
  UserIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/store/authStore';
import { getSchools, joinSchool, updateUser, getGames } from '@/lib/firebase/db';
import { GRADE_YEARS, type GameTags, type School, type Game } from '@/types';

type Step = 'welcome' | 'profile' | 'school' | 'games';

export default function OnboardingPage() {
  const router = useRouter();
  const { firebaseUser, user, setUser } = useAuthStore();
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [isLoading, setIsLoading] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [userType, setUserType] = useState<'player' | 'fan'>('player');

  // Form data
  const [selectedSchool, setSelectedSchool] = useState('');
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState('');
  const [gradeYear, setGradeYear] = useState('');
  const [gameTags, setGameTags] = useState<GameTags>({});
  const [games, setGames] = useState<Game[]>([]);

  useEffect(() => {
    if (!firebaseUser) {
      router.push('/auth/login');
      return;
    }

    // Redirect already onboarded users to feed
    if (user?.isOnboarded) {
      router.push('/feed');
      return;
    }

    const fetchData = async () => {
      try {
        const [schoolsList, gamesList] = await Promise.all([
          getSchools(),
          getGames(true),
        ]);
        setSchools(schoolsList);
        setGames(gamesList);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [firebaseUser, user, router]);

  const getSteps = () => {
    if (userType === 'fan') {
      return [
        { id: 'welcome' as const, title: 'Welcome', icon: <span className="text-lg">👋</span> },
        { id: 'profile' as const, title: 'Profile', icon: <UserIcon className="w-5 h-5" /> },
        { id: 'games' as const, title: 'Games', icon: <span className="text-lg">🎮</span> },
      ];
    }
    return [
      { id: 'welcome' as const, title: 'Welcome', icon: <span className="text-lg">👋</span> },
      { id: 'profile' as const, title: 'Profile', icon: <UserIcon className="w-5 h-5" /> },
      { id: 'school' as const, title: 'School', icon: <AcademicCapIcon className="w-5 h-5" /> },
      { id: 'games' as const, title: 'Games', icon: <span className="text-lg">🎮</span> },
    ];
  };

  const steps = getSteps();

  const handleNext = () => {
    if (currentStep === 'welcome') {
      setCurrentStep('profile');
    } else if (currentStep === 'profile') {
      if (!displayName.trim()) {
        toast.error('Please enter a display name');
        return;
      }
      if (userType === 'fan') {
        setCurrentStep('games');
      } else {
        setCurrentStep('school');
      }
    } else if (currentStep === 'school') {
      setCurrentStep('games');
    }
  };

  const handleBack = () => {
    if (currentStep === 'profile') {
      setCurrentStep('welcome');
    } else if (currentStep === 'school') {
      setCurrentStep('profile');
    } else if (currentStep === 'games') {
      if (userType === 'fan') {
        setCurrentStep('profile');
      } else {
        setCurrentStep('school');
      }
    }
  };

  const handleComplete = async () => {
    if (!firebaseUser) return;

    setIsLoading(true);
    try {
      // Join school only if selected
      if (selectedSchool) {
        await joinSchool(firebaseUser.uid, selectedSchool);
      }

      // Update user profile
      await updateUser(firebaseUser.uid, {
        displayName: displayName.trim(),
        bio: bio.trim(),
        gradeYear: gradeYear || null,
        gameTags,
        isOnboarded: true,
      });

      // Update local state
      if (user) {
        setUser({
          ...user,
          displayName: displayName.trim(),
          bio: bio.trim(),
          gradeYear: gradeYear || undefined,
          gameTags,
          schoolId: selectedSchool || undefined,
          isOnboarded: true,
        });
      }

      toast.success('Profile setup complete!');
      router.push('/feed');
    } catch (error) {
      toast.error('Failed to complete setup. Please try again.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGameTagChange = (gameId: string, value: string) => {
    setGameTags((prev) => ({
      ...prev,
      [gameId]: value,
    }));
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            {steps.map((step, index) => {
              const isActive = step.id === currentStep;
              const isCompleted = steps.findIndex((s) => s.id === currentStep) > index;

              return (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-full transition-all
                      ${isActive ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : ''}
                      ${isCompleted ? 'bg-green-500/20 text-green-400' : ''}
                      ${!isActive && !isCompleted ? 'text-dark-500' : ''}
                    `}
                  >
                    {isCompleted ? (
                      <CheckIcon className="w-5 h-5" />
                    ) : (
                      step.icon
                    )}
                    <span className="font-medium hidden sm:block">{step.title}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-12 h-0.5 mx-2 ${
                        isCompleted ? 'bg-green-500' : 'bg-dark-700'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card variant="glass" padding="lg">
              {/* Welcome / User Type Selection */}
              {currentStep === 'welcome' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">Welcome to Gamzic! 🎮</h2>
                    <p className="text-dark-400">
                      How do you want to join the community?
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <button
                      onClick={() => setUserType('player')}
                      className={`p-6 rounded-xl border-2 transition-all text-left ${
                        userType === 'player'
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-dark-700 hover:border-dark-600 bg-dark-800/50'
                      }`}
                    >
                      <div className="text-3xl mb-3">🏆</div>
                      <h3 className="font-semibold text-white mb-1">Player / Competitor</h3>
                      <p className="text-sm text-dark-400">
                        Join a school, compete in tournaments, and build your esports career
                      </p>
                    </button>

                    <button
                      onClick={() => setUserType('fan')}
                      className={`p-6 rounded-xl border-2 transition-all text-left ${
                        userType === 'fan'
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-dark-700 hover:border-dark-600 bg-dark-800/50'
                      }`}
                    >
                      <div className="text-3xl mb-3">📣</div>
                      <h3 className="font-semibold text-white mb-1">Fan / Spectator</h3>
                      <p className="text-sm text-dark-400">
                        Follow tournaments, cheer for teams, react and comment on posts
                      </p>
                    </button>
                  </div>

                  <p className="text-sm text-dark-500 text-center">
                    You can always join a school later from your profile settings
                  </p>
                </div>
              )}

              {/* Profile Setup */}
              {currentStep === 'profile' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">Create Your Profile</h2>
                    <p className="text-dark-400">
                      {userType === 'fan' ? 'Set up your fan profile' : 'Set up your gamer identity'}
                    </p>
                  </div>

                  <Input
                    label="Display Name"
                    placeholder={userType === 'fan' ? 'Your username' : 'Your gamer tag'}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    helperText="This is how others will see you"
                  />

                  <Textarea
                    label="Bio (optional)"
                    placeholder="Tell us about yourself..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                  />

                  {userType === 'player' && (
                    <Select
                      label="Grade / Year (optional)"
                      options={GRADE_YEARS.map((g) => ({ value: g, label: g }))}
                      placeholder="Select your grade"
                      value={gradeYear}
                      onChange={(e) => setGradeYear(e.target.value)}
                    />
                  )}
                </div>
              )}

              {/* School Selection - Only for players */}
              {currentStep === 'school' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">Select Your School</h2>
                    <p className="text-dark-400">
                      Join your school&apos;s esports community
                    </p>
                  </div>

                  <Select
                    label="School (optional)"
                    options={schools.map((s) => ({ value: s.id, label: s.name }))}
                    placeholder="Choose your school"
                    value={selectedSchool}
                    onChange={(e) => setSelectedSchool(e.target.value)}
                  />

                  <div className="bg-dark-800/50 rounded-lg p-4">
                    <p className="text-sm text-dark-400">
                      <span className="text-cyan-400 font-medium">💡 Tip:</span> Joining a school lets you participate in school tournaments and represent your school. You can skip this for now and join later.
                    </p>
                  </div>

                  <p className="text-sm text-dark-500 text-center">
                    Can&apos;t find your school? Contact us to add it.
                  </p>
                </div>
              )}

              {/* Game Tags */}
              {currentStep === 'games' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {userType === 'fan' ? 'Favorite Games' : 'Add Your Game IDs'}
                    </h2>
                    <p className="text-dark-400">
                      {userType === 'fan' 
                        ? 'What games do you follow? (optional)' 
                        : 'Connect your gaming accounts (optional)'}
                    </p>
                  </div>

                  <div className="grid gap-4">
                    {games.map((game) => (
                      <Input
                        key={game.id}
                        label={`${game.icon} ${game.name}`}
                        placeholder={userType === 'fan' ? `Fan of ${game.name}? Add any note` : `Your ${game.name} username`}
                        value={gameTags[game.id] || ''}
                        onChange={(e) => handleGameTagChange(game.id, e.target.value)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                {currentStep !== 'welcome' ? (
                  <Button variant="ghost" onClick={handleBack}>
                    Back
                  </Button>
                ) : (
                  <div />
                )}

                {currentStep !== 'games' ? (
                  <Button onClick={handleNext}>
                    Continue
                  </Button>
                ) : (
                  <Button onClick={handleComplete} isLoading={isLoading}>
                    Complete Setup
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

