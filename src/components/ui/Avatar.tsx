'use client';

import Image from 'next/image';

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showOnlineStatus?: boolean;
  isOnline?: boolean;
}

const sizeStyles = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-xl',
};

const onlineIndicatorSize = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
  xl: 'w-4 h-4',
};

export function Avatar({
  src,
  alt,
  size = 'md',
  className = '',
  showOnlineStatus = false,
  isOnline = false,
}: AvatarProps) {
  const initials = alt
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className={`
          ${sizeStyles[size]}
          relative rounded-full overflow-hidden
          bg-gradient-to-br from-cyan-500 to-purple-600
          flex items-center justify-center font-bold text-white
          ring-2 ring-dark-700
        `}
      >
        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      {showOnlineStatus && (
        <span
          className={`
            absolute bottom-0 right-0
            ${onlineIndicatorSize[size]}
            rounded-full border-2 border-dark-800
            ${isOnline ? 'bg-green-500' : 'bg-dark-500'}
          `}
        />
      )}
    </div>
  );
}

