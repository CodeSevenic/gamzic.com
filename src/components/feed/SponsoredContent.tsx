'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
  MegaphoneIcon,
  SparklesIcon,
  GiftIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { type SponsoredContent as SponsoredContentType } from '@/types';

interface SponsoredContentProps {
  item: SponsoredContentType;
  onDismiss?: (id: string) => void;
  variant?: 'default' | 'inline' | 'card';
}

export function SponsoredContent({ item, onDismiss, variant = 'default' }: SponsoredContentProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (variant === 'inline') {
    return (
      <div className="relative py-3 px-4 bg-dark-800/50 border-y border-dark-700/50">
        <div className="flex items-center gap-3">
          {item.logoUrl && <Avatar src={item.logoUrl} alt={item.sponsorName} size="sm" />}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-dark-500">Sponsored</span>
              <span className="text-xs text-dark-600">•</span>
              <span className="text-xs text-dark-400">{item.sponsorName}</span>
            </div>
            <p className="text-sm text-white truncate">{item.title}</p>
          </div>
          <Link
            href={item.ctaUrl}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 text-xs font-medium hover:bg-cyan-500/30 transition-colors"
          >
            {item.ctaText || 'Learn More'}
          </Link>
          {onDismiss && (
            <button
              onClick={() => onDismiss(item.id)}
              className="p-1 rounded-full text-dark-500 hover:text-dark-300 hover:bg-dark-700 transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'card' || item.type === 'native') {
    return (
      <Card variant="default" padding="none" className="overflow-hidden relative">
        {/* Sponsored label */}
        <div className="absolute top-2 left-2 z-10">
          <Badge variant="default" size="sm" className="bg-dark-800/80 backdrop-blur-sm">
            <MegaphoneIcon className="w-3 h-3 mr-1" />
            Sponsored
          </Badge>
        </div>

        {/* Dismiss button */}
        {onDismiss && (
          <button
            onClick={() => onDismiss(item.id)}
            className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-dark-800/80 backdrop-blur-sm text-dark-400 hover:text-white hover:bg-dark-700 transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}

        <div className="p-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            {item.logoUrl ? (
              <Avatar src={item.logoUrl} alt={item.sponsorName} size="md" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                <SparklesIcon className="w-5 h-5 text-white" />
              </div>
            )}
            <div>
              <p className="font-semibold text-white">{item.sponsorName}</p>
              <p className="text-xs text-dark-400">Promoted</p>
            </div>
          </div>

          {/* Content */}
          <p className="text-dark-200 mb-3">{item.title}</p>
          {item.description && <p className="text-sm text-dark-400 mb-4">{item.description}</p>}

          {/* Image */}
          {item.imageUrl && (
            <div className="relative aspect-video rounded-lg overflow-hidden mb-4">
              <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
              {item.badge && (
                <div className="absolute top-2 right-2">
                  <Badge variant="warning" className="font-bold">
                    {item.badge}
                  </Badge>
                </div>
              )}
            </div>
          )}

          {/* CTA */}
          <Link
            href={item.ctaUrl}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-medium hover:from-cyan-400 hover:to-purple-400 transition-all"
          >
            {item.ctaText || 'Learn More'}
            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
          </Link>
        </div>
      </Card>
    );
  }

  // Default banner style
  return (
    <motion.div
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative rounded-xl overflow-hidden"
    >
      {/* Background */}
      <div
        className={`absolute inset-0 bg-gradient-to-r ${
          item.gradient || 'from-cyan-600 to-purple-600'
        }`}
      />
      {item.imageUrl && (
        <div className="absolute inset-0">
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover opacity-40"
          />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />

      {/* Content */}
      <div className="relative p-4 flex items-center gap-4">
        {/* Icon/Logo */}
        {item.type === 'promotion' ? (
          <div className="shrink-0 w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <GiftIcon className="w-6 h-6 text-white" />
          </div>
        ) : item.logoUrl ? (
          <Avatar src={item.logoUrl} alt={item.sponsorName} size="lg" className="shrink-0" />
        ) : null}

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-white/60 font-medium uppercase tracking-wider">
              Sponsored
            </span>
            {item.badge && (
              <Badge variant="warning" size="sm" className="font-bold">
                {item.badge}
              </Badge>
            )}
          </div>
          <h4 className="text-white font-bold text-lg leading-tight mb-1">{item.title}</h4>
          {item.description && (
            <p className="text-white/70 text-sm line-clamp-1">{item.description}</p>
          )}
        </div>

        {/* CTA */}
        <Link
          href={item.ctaUrl}
          className={`
            shrink-0 px-4 py-2 rounded-lg font-medium text-sm
            bg-white text-dark-900 hover:bg-white/90 transition-all
            flex items-center gap-2
          `}
        >
          {item.ctaText || 'Learn More'}
          <motion.span animate={{ x: isHovered ? 3 : 0 }} transition={{ duration: 0.2 }}>
            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
          </motion.span>
        </Link>
      </div>

      {/* Dismiss button */}
      {onDismiss && (
        <button
          onClick={() => onDismiss(item.id)}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/30 backdrop-blur-sm text-white/60 hover:text-white hover:bg-black/50 transition-colors"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
}

// Mini sponsored unit that appears between feed items
export function SponsoredMini({ hasAds }: { hasAds?: boolean }) {
  if (hasAds) return null;

  return (
    <div className="flex items-center gap-2 py-2 px-3 bg-dark-800/30 rounded-lg border border-dark-700/50">
      <MegaphoneIcon className="w-4 h-4 text-dark-500" />
      <span className="text-xs text-dark-400 flex-1">Want to reach gamers? Advertise with us!</span>
      <Link href="/advertise" className="text-xs text-cyan-400 hover:text-cyan-300">
        Learn More
      </Link>
    </div>
  );
}
