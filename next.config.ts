import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'vipwin358.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.vnecdn.net', // VnExpress CDN
      },
      {
        protocol: 'https',
        hostname: '*.vnexpress.net', // VnExpress
      },
      {
        protocol: 'https',
        hostname: 'www.vinmec.com', // Vinmec images
      },
      {
        protocol: 'https',
        hostname: '**', // Allow all hostnames for development
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
          minimumCacheTTL: 86400, // 24 hours cache for better performance
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
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
