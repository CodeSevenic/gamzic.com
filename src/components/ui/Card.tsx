'use client';

import { forwardRef, HTMLAttributes } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode;
  variant?: 'default' | 'glass' | 'neon';
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const variantStyles = {
  default: 'bg-dark-800 border border-dark-700',
  glass: 'bg-dark-800/50 backdrop-blur-lg border border-dark-700/50',
  neon: 'bg-dark-800 border border-cyan-500/30 shadow-inner-glow',
};

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, variant = 'default', hover = false, padding = 'md', className = '', ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={hover ? { scale: 1.01, y: -2 } : undefined}
        className={`
          rounded-xl transition-all duration-300
          ${variantStyles[variant]}
          ${paddingStyles[padding]}
          ${hover ? 'cursor-pointer hover:border-cyan-500/50 hover:shadow-lg' : ''}
          ${className}
        `}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

