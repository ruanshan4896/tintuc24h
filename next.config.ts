import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co', // Primary: Supabase Storage
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // Fallback: Unsplash
      },
      {
        protocol: 'https',
        hostname: '**', // Allow all for development/migration
      },
    ],
    formats: ['image/avif', 'image/webp'], // Modern formats
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year cache
    // Enable optimization for Supabase images
    unoptimized: false,
  },
  experimental: {
    optimizePackageImports: ['react-markdown', 'date-fns', 'lucide-react', '@vercel/analytics', '@vercel/speed-insights'],
  },
  // Optimize production build
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  compress: true,
  // Strict mode for better performance
  reactStrictMode: true,
  // TypeScript config
  typescript: {
    ignoreBuildErrors: false,
  },
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Output optimization
  output: 'standalone',
};

export default nextConfig;
