/**
 * Image Optimization Utilities
 * - WebP format conversion
 * - Responsive image srcset generation
 * - Lazy loading support
 */

export interface ImageOptimizationOptions {
  /** Quality for WebP conversion (0-100) */
  quality?: number;
  /** Maximum width for the image */
  maxWidth?: number;
  /** Maximum height for the image */
  maxHeight?: number;
  /** Generate responsive srcset */
  responsive?: boolean;
  /** Widths for responsive srcset */
  srcsetWidths?: number[];
}

/**
 * Check if browser supports WebP format
 */
export function supportsWebP(): boolean {
  if (typeof window === 'undefined') return false;
  
  const elem = document.createElement('canvas');
  if (elem.getContext && elem.getContext('2d')) {
    return elem.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }
  return false;
}

/**
 * Convert image URL to WebP format if supported
 */
export function getOptimizedImageUrl(url: string, options: ImageOptimizationOptions = {}): string {
  if (!url) return url;
  
  // Skip if already WebP
  if (url.endsWith('.webp')) return url;
  
  // Skip external URLs (can't optimize)
  if (url.startsWith('http') && !url.includes(window.location.hostname)) {
    return url;
  }
  
  // For S3 URLs, we can add transformation parameters if the CDN supports it
  // For now, return original URL (would need CDN configuration)
  return url;
}

/**
 * Generate srcset for responsive images
 */
export function generateSrcSet(baseUrl: string, widths: number[] = [320, 640, 960, 1280, 1920]): string {
  if (!baseUrl) return '';
  
  // For S3 URLs with CDN transformation support
  // Format: url?w=320 320w, url?w=640 640w, ...
  return widths
    .map(width => `${baseUrl}?w=${width} ${width}w`)
    .join(', ');
}

/**
 * Generate sizes attribute for responsive images
 */
export function generateSizes(breakpoints: Record<string, string> = {
  '(max-width: 640px)': '100vw',
  '(max-width: 1024px)': '50vw',
  '(max-width: 1280px)': '33vw',
}): string {
  const entries = Object.entries(breakpoints);
  const sizeRules = entries.map(([query, size]) => `${query} ${size}`).join(', ');
  return `${sizeRules}, 33vw`; // default fallback
}

/**
 * Preload critical images
 */
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Lazy load image with Intersection Observer
 */
export function lazyLoadImage(img: HTMLImageElement, src: string, srcset?: string): void {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          img.src = src;
          if (srcset) img.srcset = srcset;
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      });
    });
    
    observer.observe(img);
  } else {
    // Fallback for browsers without Intersection Observer
    img.src = src;
    if (srcset) img.srcset = srcset;
  }
}

/**
 * Compress image file before upload (client-side)
 */
export async function compressImage(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    outputFormat?: 'image/jpeg' | 'image/png' | 'image/webp';
  } = {}
): Promise<Blob> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.85,
    outputFormat = 'image/jpeg',
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        
        // Calculate new dimensions while maintaining aspect ratio
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          outputFormat,
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Get optimal image format based on browser support
 */
export function getOptimalFormat(originalFormat: string): string {
  if (supportsWebP()) {
    return 'image/webp';
  }
  
  // Fallback to JPEG for photos, PNG for graphics
  if (originalFormat.includes('png')) {
    return 'image/png';
  }
  
  return 'image/jpeg';
}

/**
 * Calculate image dimensions to fit within bounds while maintaining aspect ratio
 */
export function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let width = originalWidth;
  let height = originalHeight;
  
  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }
  
  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }
  
  return { width: Math.round(width), height: Math.round(height) };
}
