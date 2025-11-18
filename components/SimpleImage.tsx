'use client';

import Image from 'next/image';

interface SimpleImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
}

/**
 * Simple Image Component - No retry, no fallback, just direct load
 * For testing Google Drive images
 */
export default function SimpleImage({
  src,
  alt,
  width = 800,
  height = 450,
  fill = false,
  className = '',
  priority = false,
}: SimpleImageProps) {
  
  console.log('🖼️ Loading image:', src);

  return fill ? (
    <Image
      src={src}
      alt={alt}
      fill
      className={className}
      priority={priority}
      unoptimized
      onError={(e) => {
        console.error('❌ Image failed:', src);
        console.error('Error details:', e);
      }}
      onLoad={() => {
        console.log('✅ Image loaded successfully:', src);
      }}
    />
  ) : (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      unoptimized
      onError={(e) => {
        console.error('❌ Image failed:', src);
        console.error('Error details:', e);
      }}
      onLoad={() => {
        console.log('✅ Image loaded successfully:', src);
      }}
    />
  );
}
