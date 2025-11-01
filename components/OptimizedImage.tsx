'use client';

import { useState, useEffect } from 'react';
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

const DEFAULT_FALLBACK = '/og-image.jpg'; // Default fallback image

export default function OptimizedImage({
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
  retryCount = 3,
  onError,
  inline = false,
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState(0);

  const handleError = () => {
    console.warn(`⚠️ Image failed to load: ${imgSrc}`);
    
    if (retryAttempts < retryCount && imgSrc !== fallbackSrc) {
      // Retry with backoff
      const delay = Math.min(1000 * Math.pow(2, retryAttempts), 5000);
      setTimeout(() => {
        console.log(`🔄 Retrying image load (attempt ${retryAttempts + 1}/${retryCount})...`);
        setRetryAttempts(prev => prev + 1);
        // Force reload by updating src with cache buster
        setImgSrc(`${src}?retry=${retryAttempts + 1}&t=${Date.now()}`);
        setIsLoading(true);
      }, delay);
    } else if (imgSrc !== fallbackSrc) {
      // Switch to fallback
      console.log(`🔄 Switching to fallback image: ${fallbackSrc}`);
      setImgSrc(fallbackSrc);
      setIsLoading(true);
      setHasError(true);
    } else {
      // Fallback also failed, stop loading
      setIsLoading(false);
      setHasError(true);
      if (onError) {
        onError();
      }
    }
  };

  const handleLoad = () => {
    console.log(`✅ Image loaded successfully: ${imgSrc}`);
    setIsLoading(false);
    setHasError(false);
  };
  
  // Enhanced error handler for Image component
  const handleImageError = () => {
    handleError();
  };
  
  // Check if image loaded successfully after a delay (fallback for onLoad not firing)
  useEffect(() => {
    if (!isLoading || typeof window === 'undefined') return;
    
    // If still loading after 3 seconds, check if image element exists and loaded
    const checkTimeout = setTimeout(() => {
      try {
        // Try to find the Next.js Image component's underlying img element
        const imgs = document.querySelectorAll('img');
        const foundImg = Array.from(imgs).find(img => 
          img.src.includes(imgSrc.split('?')[0]) || 
          img.getAttribute('src')?.includes(imgSrc.split('?')[0])
        );
        
        if (foundImg && (foundImg as HTMLImageElement).complete && (foundImg as HTMLImageElement).naturalHeight > 0) {
          console.log(`✅ Image loaded (detected via DOM check): ${imgSrc}`);
          setIsLoading(false);
          setHasError(false);
        }
      } catch (e) {
        // Silent fail for DOM check
      }
    }, 3000); // Check after 3 seconds
    
    return () => clearTimeout(checkTimeout);
  }, [isLoading, imgSrc]);

  // Reset when src changes
  useEffect(() => {
    setImgSrc(src);
    setIsLoading(true);
    setHasError(false);
    setRetryAttempts(0);
    
    // Timeout fallback: if image doesn't load within 8 seconds, show error
    const timeoutId = setTimeout(() => {
      console.warn(`⏱️ Image load timeout (8s) for: ${src}`);
      setIsLoading(prev => {
        if (prev) {
          // Still loading after timeout, trigger error handling
          handleError();
        }
        return false;
      });
    }, 8000); // 8 second timeout (reduced for faster fallback)
    
    return () => clearTimeout(timeoutId);
  }, [src]);
  
  // Additional absolute timeout check when component is loading
  useEffect(() => {
    if (!isLoading) return;
    
    const timeoutId = setTimeout(() => {
      console.warn(`⏱️ Image still loading after 12s absolute timeout: ${imgSrc}`);
      // Force stop loading and try fallback
      setIsLoading(false);
      if (imgSrc !== fallbackSrc && retryAttempts < retryCount) {
        handleError();
      } else {
        setHasError(true);
        if (onError) {
          onError();
        }
      }
    }, 12000); // 12 second absolute timeout (reduced)
    
    return () => clearTimeout(timeoutId);
  }, [isLoading, imgSrc, fallbackSrc, retryAttempts, retryCount, onError]);

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
          placeholder="blur"
          blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAwIiBoZWlnaHQ9IjQ3NSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2ZXJzaW9uPSIxLjEiLz4="
          unoptimized={imgSrc.includes('googleusercontent.com') || imgSrc.includes('lh3.googleusercontent.com')}
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
      {/* Loading State */}
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse z-10">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
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
          placeholder="blur"
          blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAwIiBoZWlnaHQ9IjQ3NSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2ZXJzaW9uPSIxLjEiLz4="
          unoptimized={imgSrc.includes('googleusercontent.com') || imgSrc.includes('lh3.googleusercontent.com')}
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
          placeholder="blur"
          blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAwIiBoZWlnaHQ9IjQ3NSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2ZXJzaW9uPSIxLjEiLz4="
          unoptimized={imgSrc.includes('googleusercontent.com') || imgSrc.includes('lh3.googleusercontent.com')}
        />
      )}
    </div>
  );
}
