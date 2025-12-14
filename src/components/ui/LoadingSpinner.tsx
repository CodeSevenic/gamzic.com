'use client';

import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeStyles = {
  sm: 'w-5 h-5 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-3',
};

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  return (
    <motion.div
      className={`${sizeStyles[size]} ${className} rounded-full border-transparent border-t-cyan-500 border-r-cyan-500/30`}
      animate={{ rotate: 360 }}
      transition={{
        duration: 0.8,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          {/* Outer ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-3 border-transparent border-t-cyan-500 border-r-purple-600"
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
          {/* Inner ring */}
          <motion.div
            className="absolute inset-2 rounded-full border-3 border-transparent border-t-purple-600 border-l-cyan-500"
            animate={{ rotate: -360 }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </div>
        <p className="text-dark-400 font-medium">Loading...</p>
      </div>
    </div>
  );
}
