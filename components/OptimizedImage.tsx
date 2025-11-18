'use client';

import { useState } from 'react';
import Image from 'next/image';

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
  onError?: () => void;
  inline?: boolean;
}

const DEFAULT_FALLBACK = '/og-image.jpg';

/**
 * Optimized Image Component for Supabase Storage
 * Simple, fast, reliable - no complex retry logic needed
 */
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
  quality = 80,
  objectFit = 'cover',
  onError,
  inline = false,
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (imgSrc !== DEFAULT_FALLBACK) {
      console.warn(`⚠️ Image failed to load: ${imgSrc}`);
      setImgSrc(DEFAULT_FALLBACK);
      setHasError(true);
    }
    onError?.();
  };

  const handleLoad = () => {
    setHasError(false);
  };

  // Build className with object-fit
  const objectFitClass = objectFit === 'cover' ? 'object-cover' :
                         objectFit === 'contain' ? 'object-contain' :
                         objectFit === 'fill' ? 'object-fill' :
                         objectFit === 'none' ? 'object-none' :
                         'object-scale-down';

  const finalClassName = `${objectFitClass} ${className}`.trim();

  // Check if image is from Supabase Storage (no need for unoptimized)
  const isSupabaseStorage = imgSrc.includes('supabase.co') && imgSrc.includes('/storage/v1/object/public/');
  
  // For inline/markdown context
  if (inline && !fill) {
    return (
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
        onError={handleError}
        onLoad={handleLoad}
        unoptimized={!isSupabaseStorage} // Only optimize Supabase images
      />
    );
  }

  // Standard usage with wrapper
  return (
    <div className={`relative ${fill ? 'w-full h-full' : ''} ${hasError ? 'bg-gray-100' : ''}`}>
      {/* Error State */}
      {hasError && imgSrc === DEFAULT_FALLBACK && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 z-10">
          <div className="text-center p-4">
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
            <p className="text-xs text-gray-500">Không thể tải ảnh</p>
          </div>
        </div>
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
          onError={handleError}
          onLoad={handleLoad}
          unoptimized={!isSupabaseStorage}
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
          onError={handleError}
          onLoad={handleLoad}
          unoptimized={!isSupabaseStorage}
        />
      )}
    </div>
  );
}
