import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pzakjiqhksdwugvfosvl.supabase.co', // Exact Supabase project
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co', // All Supabase projects
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
    formats: ['image/webp', 'image/avif'], // WebP first (better support)
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60, // 1 minute (avoid Vercel limits)
    // Disable optimization to avoid Vercel limits and AVIF issues
    unoptimized: true,
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
