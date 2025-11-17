import React, { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useSwipe } from '../../../hooks/useSwipe';

/**
 * Props for the ImageGallery component
 */
interface ImageGalleryProps {
  /** Array of images to display in the gallery */
  images: Array<{ image_url: string; storage_path?: string }>;
  /** Index of the currently displayed image */
  currentIndex: number;
  /** Callback when the gallery should be closed */
  onClose: () => void;
  /** Callback when navigating to the next image */
  onNext?: () => void;
  /** Callback when navigating to the previous image */
  onPrevious?: () => void;
}

/**
 * A modal image gallery component with swipe gestures, keyboard navigation, and smooth transitions.
 * Displays images in a full-screen overlay with navigation controls.
 *
 * @example
 * ```tsx
 * <ImageGallery
 *   images={imageList}
 *   currentIndex={currentImageIndex}
 *   onClose={() => setShowGallery(false)}
 *   onNext={handleNextImage}
 *   onPrevious={handlePreviousImage}
 * />
 * ```
 */
const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  currentIndex,
  onClose,
  onNext,
  onPrevious
}) => {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleNext = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    onNext?.();
    setTimeout(() => setIsTransitioning(false), 300);
  }, [isTransitioning, onNext]);

  const handlePrevious = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    onPrevious?.();
    setTimeout(() => setIsTransitioning(false), 300);
  }, [isTransitioning, onPrevious]);

  // Swipe gestures
  const swipeRef = useSwipe({
    onSwipeLeft: handleNext,
    onSwipeRight: handlePrevious,
  });

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      handlePrevious();
    } else if (e.key === 'ArrowRight') {
      handleNext();
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [handleNext, handlePrevious, onClose]);

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!images.length) return null;

  const currentImage = images[currentIndex];

  return (
    <div
      ref={swipeRef}
      className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors mobile-btn"
        aria-label="Cerrar galería"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Navigation buttons - hidden on very small screens, shown on larger mobile */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrevious();
            }}
            disabled={currentIndex === 0}
            className="absolute left-2 xs:left-4 top-1/2 transform -translate-y-1/2 p-2 xs:p-3 rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed transition-all mobile-btn"
            aria-label="Imagen anterior"
          >
            <ChevronLeft className="h-5 w-5 xs:h-6 xs:w-6" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            disabled={currentIndex === images.length - 1}
            className="absolute right-2 xs:right-4 top-1/2 transform -translate-y-1/2 p-2 xs:p-3 rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed transition-all mobile-btn"
            aria-label="Imagen siguiente"
          >
            <ChevronRight className="h-5 w-5 xs:h-6 xs:w-6" />
          </button>
        </>
      )}

      {/* Main image */}
      <div className="relative max-w-full max-h-full p-4">
        <img
          src={currentImage.image_url}
          alt={`Imagen ${currentIndex + 1} de ${images.length}`}
          className={`max-w-full max-h-full object-contain transition-transform duration-300 ${
            isTransitioning ? 'scale-95' : 'scale-100'
          }`}
          onClick={(e) => e.stopPropagation()}
          loading="lazy"
        />
      </div>

      {/* Image counter */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-black/50 text-white rounded-full text-mobile-sm">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* Swipe hint for mobile */}
      <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 md:hidden">
        <div className="flex items-center space-x-2 px-3 py-2 bg-black/30 text-white rounded-lg text-mobile-xs">
          <span>👆</span>
          <span>Desliza para navegar</span>
          <span>👆</span>
        </div>
      </div>
    </div>
  );
};

export default ImageGallery;

