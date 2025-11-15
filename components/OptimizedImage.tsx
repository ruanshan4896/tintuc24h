'use client';

import { useState, useEffect, useMemo, useRef, memo } from 'react';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  quality?: number;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  fallbackSrc?: string;
  retryCount?: number;
  onError?: () => void;
  inline?: boolean; // If true, use span instead of div (for Markdown compatibility)
}

// Default fallback image - use a simple placeholder if og-image.jpg fails
const DEFAULT_FALLBACK = '/og-image.jpg'; // Default fallback image
const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQ1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjQ1MCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBub3QgYXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg==';

/**
 * Check if image URL is from vnexpress and needs proxy
 * Supports all vnexpress subdomains: *.vnexpress.net, *.vnecdn.net
 */
function needsProxy(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    // Match all vnexpress subdomains: i1-thethao.vnecdn.net, i2-vnexpress.vnecdn.net, etc.
    return hostname.includes('.vnecdn.net') || 
           hostname.includes('.vnexpress.net') ||
           hostname === 'vnexpress.net';
  } catch {
    return false;
  }
}

/**
 * Convert image URL to proxy URL if needed
 */
function getProxyUrl(url: string): string {
  if (needsProxy(url)) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}

function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className = '',
  sizes,
  priority = false,
  loading = 'lazy',
  quality = 75,
  objectFit = 'cover',
  fallbackSrc = DEFAULT_FALLBACK,
  retryCount = 1, // Reduce retry to 1 to avoid too many reloads
  onError,
  inline = false,
}: OptimizedImageProps) {
  // Memoize proxy URL to avoid recalculating on every render
  const proxiedSrc = useMemo(() => {
    return needsProxy(src) ? getProxyUrl(src) : src;
  }, [src]);
  
  const [imgSrc, setImgSrc] = useState(proxiedSrc);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const hasLoadedRef = useRef(false); // Track if image has successfully loaded before
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleError = () => {
    // Only log errors in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`⚠️ Image failed to load: ${imgSrc}`);
    }
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Don't retry if we've already loaded successfully before
    if (hasLoadedRef.current) {
      setIsLoading(false);
      return;
    }
    
    // Faster fallback - skip retry for non-priority images to improve UX
    if (priority && retryAttempts < retryCount && imgSrc !== fallbackSrc) {
      // Only retry for priority images
      const delay = 300; // Reduced delay for faster fallback
      timeoutRef.current = setTimeout(() => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔄 Retrying image load (attempt ${retryAttempts + 1}/${retryCount})...`);
        }
        setRetryAttempts(prev => prev + 1);
        setImgSrc(proxiedSrc);
        setIsLoading(true);
      }, delay);
    } else if (imgSrc !== fallbackSrc) {
      // Switch to fallback immediately for non-priority, or after retry for priority
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔄 Switching to fallback image: ${fallbackSrc}`);
      }
      setImgSrc(fallbackSrc);
      setIsLoading(true);
      setHasError(true);
    } else {
      // Fallback also failed, try placeholder as last resort
      if (fallbackSrc !== PLACEHOLDER_IMAGE) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔄 Fallback failed, using placeholder`);
        }
        setImgSrc(PLACEHOLDER_IMAGE);
        setIsLoading(true);
      } else {
        // Placeholder also failed, stop loading
        setIsLoading(false);
        setHasError(true);
        if (onError) {
          onError();
        }
      }
    }
  };

  const handleLoad = () => {
    // Mark as successfully loaded
    hasLoadedRef.current = true;
    setIsLoading(false);
    setHasError(false);
    
    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };
  
  // Enhanced error handler for Image component
  const handleImageError = () => {
    handleError();
  };

  // Reset when src changes - only if it's actually different
  useEffect(() => {
    // Only update if the proxied src is different
    if (imgSrc !== proxiedSrc && imgSrc !== fallbackSrc) {
      setImgSrc(proxiedSrc);
      setIsLoading(true);
      setHasError(false);
      setRetryAttempts(0);
      hasLoadedRef.current = false; // Reset loaded state for new image
      
      // Set timeout for new image - reduced for faster fallback
      timeoutRef.current = setTimeout(() => {
        setIsLoading(prev => {
          if (prev && !hasLoadedRef.current) {
            if (process.env.NODE_ENV === 'development') {
              console.warn(`⏱️ Image load timeout (3s) for: ${src}`);
            }
            handleError();
          }
          return prev;
        });
      }, 3000); // 3 second timeout (reduced from 4s)
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [src, proxiedSrc]);

  // Build className with object-fit
  const objectFitClass = objectFit === 'cover' ? 'object-cover' :
                         objectFit === 'contain' ? 'object-contain' :
                         objectFit === 'fill' ? 'object-fill' :
                         objectFit === 'none' ? 'object-none' :
                         'object-scale-down';

  const finalClassName = `${objectFitClass} ${className}`.trim();

  // For inline/markdown context, don't use wrapper - render Image directly
  // For standalone, use wrapper div
  if (inline && !fill) {
    // Inline context without fill - render Image directly without wrapper
    return (
      <>
        {isLoading && (
          <span className="inline-block w-8 h-8 text-gray-400 animate-spin">
            <Loader2 className="w-8 h-8" />
          </span>
        )}
        <Image
          src={imgSrc}
          alt={alt}
          width={width || 800}
          height={height || 450}
          className={finalClassName}
          sizes={sizes}
          priority={priority}
          quality={quality}
          loading={loading}
          onError={handleImageError}
          onLoad={handleLoad}
          onLoadingComplete={handleLoad} // Additional callback for Next.js Image
          placeholder={priority ? "blur" : "empty"}
          blurDataURL={priority ? "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAwIiBoZWlnaHQ9IjQ3NSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2ZXJzaW9uPSIxLjEiLz4=" : undefined}
          unoptimized={imgSrc.includes('googleusercontent.com') || imgSrc.includes('lh3.googleusercontent.com') || imgSrc.includes('/api/image-proxy') || imgSrc.startsWith('data:')}
        />
        {hasError && !isLoading && imgSrc === fallbackSrc && (
          <span className="inline-block text-xs text-gray-500 ml-2">Không thể tải ảnh</span>
        )}
      </>
    );
  }

  // Use div wrapper for standalone usage
  return (
    <div className={`relative ${fill ? 'w-full h-full' : ''} ${hasError && !isLoading ? 'bg-gray-100' : ''}`}>
      {/* Loading State - Only show spinner for non-priority images */}
      {isLoading && !priority && (
        <span className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="w-full h-full bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
        </span>
      )}

      {/* Error State (if both main and fallback failed) */}
      {hasError && !isLoading && imgSrc === fallbackSrc && (
        <span className="absolute inset-0 flex items-center justify-center bg-gray-200 z-20">
          <span className="text-center p-4">
            <svg
              className="w-12 h-12 text-gray-400 mx-auto mb-2"
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
            <span className="text-xs text-gray-500 block">Không thể tải ảnh</span>
          </span>
        </span>
      )}

      {/* Image Component */}
      {fill ? (
        <Image
          src={imgSrc}
          alt={alt}
          fill
          className={finalClassName}
          sizes={sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
          priority={priority}
          quality={quality}
          loading={loading}
          onError={handleImageError}
          onLoad={handleLoad}
          onLoadingComplete={handleLoad} // Additional callback for Next.js Image
          placeholder={priority ? "blur" : "empty"}
          blurDataURL={priority ? "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAwIiBoZWlnaHQ9IjQ3NSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2ZXJzaW9uPSIxLjEiLz4=" : undefined}
          unoptimized={imgSrc.includes('googleusercontent.com') || imgSrc.includes('lh3.googleusercontent.com') || imgSrc.includes('/api/image-proxy') || imgSrc.startsWith('data:')}
        />
      ) : (
        <Image
          src={imgSrc}
          alt={alt}
          width={width || 800}
          height={height || 450}
          className={finalClassName}
          sizes={sizes}
          priority={priority}
          quality={quality}
          loading={loading}
          onError={handleImageError}
          onLoad={handleLoad}
          onLoadingComplete={handleLoad} // Additional callback for Next.js Image
          placeholder={priority ? "blur" : "empty"}
          blurDataURL={priority ? "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAwIiBoZWlnaHQ9IjQ3NSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2ZXJzaW9uPSIxLjEiLz4=" : undefined}
          unoptimized={imgSrc.includes('googleusercontent.com') || imgSrc.includes('lh3.googleusercontent.com') || imgSrc.includes('/api/image-proxy') || imgSrc.startsWith('data:')}
        />
      )}
    </div>
  );
}

// Memoize component to prevent unnecessary re-renders
export default memo(OptimizedImage);
