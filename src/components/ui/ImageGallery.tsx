'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowsPointingOutIcon,
} from '@heroicons/react/24/outline';

interface ImageGalleryProps {
  images: string[];
  alt?: string;
}

// Gallery grid layout for displaying multiple images
export function ImageGallery({ images, alt = 'Post image' }: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  // Single image layout
  if (images.length === 1) {
    return (
      <>
        <div className="relative aspect-video cursor-pointer group" onClick={() => openLightbox(0)}>
          <img src={images[0]} alt={alt} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <ArrowsPointingOutIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
        <ImageLightbox
          images={images}
          currentIndex={currentIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          onNavigate={setCurrentIndex}
        />
      </>
    );
  }

  // Two images layout
  if (images.length === 2) {
    return (
      <>
        <div className="grid grid-cols-2 gap-1">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="relative aspect-square cursor-pointer group"
              onClick={() => openLightbox(idx)}
            >
              <img src={img} alt={`${alt} ${idx + 1}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </div>
          ))}
        </div>
        <ImageLightbox
          images={images}
          currentIndex={currentIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          onNavigate={setCurrentIndex}
        />
      </>
    );
  }

  // Three images layout
  if (images.length === 3) {
    return (
      <>
        <div className="grid grid-cols-2 gap-1">
          <div className="relative row-span-2 cursor-pointer group" onClick={() => openLightbox(0)}>
            <img src={images[0]} alt={`${alt} 1`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          </div>
          <div
            className="relative aspect-square cursor-pointer group"
            onClick={() => openLightbox(1)}
          >
            <img src={images[1]} alt={`${alt} 2`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          </div>
          <div
            className="relative aspect-square cursor-pointer group"
            onClick={() => openLightbox(2)}
          >
            <img src={images[2]} alt={`${alt} 3`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          </div>
        </div>
        <ImageLightbox
          images={images}
          currentIndex={currentIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          onNavigate={setCurrentIndex}
        />
      </>
    );
  }

  // Four images layout (2x2 grid)
  if (images.length === 4) {
    return (
      <>
        <div className="grid grid-cols-2 gap-1">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="relative aspect-square cursor-pointer group"
              onClick={() => openLightbox(idx)}
            >
              <img src={img} alt={`${alt} ${idx + 1}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </div>
          ))}
        </div>
        <ImageLightbox
          images={images}
          currentIndex={currentIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          onNavigate={setCurrentIndex}
        />
      </>
    );
  }

  // 5+ images layout (2x2 grid with +N indicator)
  return (
    <>
      <div className="grid grid-cols-2 gap-1">
        {images.slice(0, 4).map((img, idx) => (
          <div
            key={idx}
            className="relative aspect-square cursor-pointer group"
            onClick={() => openLightbox(idx)}
          >
            <img src={img} alt={`${alt} ${idx + 1}`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            {idx === 3 && images.length > 4 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">+{images.length - 4}</span>
              </div>
            )}
          </div>
        ))}
      </div>
      <ImageLightbox
        images={images}
        currentIndex={currentIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={setCurrentIndex}
      />
    </>
  );
}

// Fullscreen image viewer with navigation
interface ImageLightboxProps {
  images: string[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function ImageLightbox({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
}: ImageLightboxProps) {
  const goToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNavigate(currentIndex === 0 ? images.length - 1 : currentIndex - 1);
  };

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNavigate(currentIndex === images.length - 1 ? 0 : currentIndex + 1);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      onNavigate(currentIndex === 0 ? images.length - 1 : currentIndex - 1);
    } else if (e.key === 'ArrowRight') {
      onNavigate(currentIndex === images.length - 1 ? 0 : currentIndex + 1);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={onClose}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer z-10"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>

          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/50 text-white text-sm">
              {currentIndex + 1} / {images.length}
            </div>
          )}

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
              >
                <ChevronLeftIcon className="w-8 h-8" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
              >
                <ChevronRightIcon className="w-8 h-8" />
              </button>
            </>
          )}

          {/* Main image */}
          <motion.img
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            src={images[currentIndex]}
            alt={`Image ${currentIndex + 1}`}
            className="max-w-[90vw] max-h-[90vh] object-contain cursor-default"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 p-2 rounded-lg bg-black/50">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate(idx);
                  }}
                  className={`
                    w-12 h-12 rounded overflow-hidden cursor-pointer transition-all
                    ${
                      idx === currentIndex
                        ? 'ring-2 ring-cyan-500 scale-110'
                        : 'opacity-60 hover:opacity-100'
                    }
                  `}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
