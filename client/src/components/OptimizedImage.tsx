import { useState, useEffect, useRef, ImgHTMLAttributes } from 'react';
import { generateSrcSet, generateSizes, lazyLoadImage } from '@/lib/imageOptimization';
import { cn } from '@/lib/utils';

export interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet'> {
  /** Image source URL */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Enable lazy loading (default: true) */
  lazy?: boolean;
  /** Enable responsive srcset (default: false) */
  responsive?: boolean;
  /** Custom srcset widths */
  srcsetWidths?: number[];
  /** Custom sizes attribute */
  sizes?: string;
  /** Placeholder image while loading */
  placeholder?: string;
  /** Blur placeholder (low quality image placeholder) */
  blurDataURL?: string;
  /** Priority loading (disable lazy load) */
  priority?: boolean;
  /** Callback when image loads */
  onLoad?: () => void;
  /** Callback when image fails to load */
  onError?: () => void;
}

/**
 * Optimized Image Component
 * - Lazy loading with Intersection Observer
 * - Responsive srcset support
 * - WebP format support
 * - Blur placeholder
 * - Loading states
 */
export function OptimizedImage({
  src,
  alt,
  lazy = true,
  responsive = false,
  srcsetWidths = [320, 640, 960, 1280, 1920],
  sizes,
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23f3f4f6"/%3E%3C/svg%3E',
  blurDataURL,
  priority = false,
  className,
  onLoad,
  onError,
  ...props
}: OptimizedImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(blurDataURL || placeholder);

  useEffect(() => {
    const img = imgRef.current;
    if (!img || !src) return;

    // If priority or lazy disabled, load immediately
    if (priority || !lazy) {
      setCurrentSrc(src);
      if (responsive) {
        img.srcset = generateSrcSet(src, srcsetWidths);
      }
      return;
    }

    // Use lazy loading
    const srcset = responsive ? generateSrcSet(src, srcsetWidths) : undefined;
    lazyLoadImage(img, src, srcset);
    
    // Update state when image loads via lazy loading
    const observer = new MutationObserver(() => {
      if (img.src === src) {
        setCurrentSrc(src);
      }
    });
    
    observer.observe(img, { attributes: true, attributeFilter: ['src'] });
    
    return () => observer.disconnect();
  }, [src, lazy, priority, responsive, srcsetWidths]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  // Generate sizes attribute if responsive
  const sizesAttr = responsive && !sizes ? generateSizes() : sizes;

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Blur placeholder */}
      {isLoading && blurDataURL && (
        <img
          src={blurDataURL}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-lg scale-110"
          aria-hidden="true"
        />
      )}
      
      {/* Main image */}
      <img
        ref={imgRef}
        src={priority || !lazy ? src : currentSrc}
        srcSet={priority || !lazy ? (responsive ? generateSrcSet(src, srcsetWidths) : undefined) : undefined}
        sizes={sizesAttr}
        alt={alt}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          isLoading && 'opacity-0',
          !isLoading && 'opacity-100',
          lazy && !priority && 'lazy'
        )}
        loading={lazy && !priority ? 'lazy' : 'eager'}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
      
      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center text-gray-400">
            <svg
              className="w-12 h-12 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm">Failed to load image</p>
          </div>
        </div>
      )}
      
      {/* Loading spinner */}
      {isLoading && !hasError && !blurDataURL && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400" />
        </div>
      )}
    </div>
  );
}

/**
 * Hook to preload images
 */
export function useImagePreload(urls: string[]) {
  useEffect(() => {
    urls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      document.head.appendChild(link);
    });
  }, [urls]);
}
